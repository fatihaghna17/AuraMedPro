import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Question } from '../types';
import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';
import { SAMPLE_BANKS } from '../data/sampleBanks';
import { getCachedQuestions, setCachedQuestions } from '../utils/questionCache';
import { uploadQuestionsToR2 } from '../r2Storage';

export function useAuth({
  triggerToast,
  setUserXP,
  setCurrentStreak,
  setLongestStreak,
  setStreakFreezeLeft,
  setLastActiveDate,
  setTotalQuestionsAnswered,
  setXpHistory,
  fetchGlobalLeaderboard,
  setSelectedDatabases,
  setPendingSessions,
  setGlobalCustomFolders,
  setGlobalQuizFolderMap,
}: any) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const [isSessionKicked, setIsSessionKicked] = useState(false);
  const [profileUsername, setProfileUsername] = useState('user');
  const [globalDatabases, setGlobalDatabases] = useState<string[]>([]);
  const [uploaderMap, setUploaderMap] = useState<Record<string, string>>({});
  const [questionDatabase, setQuestionDatabase] = useState<Record<string, Question[]>>({});
  
  const isLoggingInRef = useRef(false);
  const isProfileSyncedRef = useRef(false);

  const syncUserProfile = async (user: any, currentSessionId: string) => {
    const userId = user.id;
    const email = user.email || '';
    const defaultUsername = email ? email.split('@')[0] : 'user';
    try {
      // 1. Ambil data profil dari Supabase profiles
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profil belum dibuat (trigger Supabase lambat), kita buat manual
        const newProfile = {
          id: userId,
          username: defaultUsername,
          xp: 0,
          streak: 0,
          level: 1,
          active_session_id: currentSessionId
        };
        await supabase.from('profiles').insert(newProfile);
        profile = newProfile;
      } else if (error) {
        throw error;
      }

      if (profile) {
        // 2. Cek Single Device Session
        if (isLoggingInRef.current) {
          // Jika proses login baru, langsung update session ID di DB dan matikan flag
          await supabase
            .from('profiles')
            .update({ active_session_id: currentSessionId })
            .eq('id', userId);
          isLoggingInRef.current = false;
        } else {
          // Jika background check biasa, cek apakah session ID bentrok dengan device lain
          if (profile.active_session_id && profile.active_session_id !== currentSessionId) {
            setIsSessionKicked(true);
            await supabase.auth.signOut();
            return;
          }

          // Update active_session_id di database jika masih kosong
          if (!profile.active_session_id) {
            await supabase
              .from('profiles')
              .update({ active_session_id: currentSessionId })
              .eq('id', userId);
          }
        }

        // Set state gamifikasi dari cloud profile
        setUserXP(profile.xp || 0);
        
        // Cek timezone Asia/Jakarta
        const nowInJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const todayStr = nowInJakarta.toISOString().split('T')[0];
        
        let savedStreak = profile.current_streak ?? profile.streak ?? 0;
        let freezeLeft = profile.streak_freeze_left ?? 1;
        let lastActive = profile.last_active_date || null;
        
        // Logika Reset Streak saat login (jika terlewat hari)
        if (lastActive) {
          const lastActiveDateObj = new Date(lastActive);
          // Normalize to midnight
          lastActiveDateObj.setHours(0, 0, 0, 0);
          const todayDateObj = new Date(todayStr);
          todayDateObj.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((todayDateObj.getTime() - lastActiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            // Cek apakah punya freeze dan mau digunakan otomatis? (Implementasi di sini anggap manual via tombol, jadi reset aja jika > 1)
            // Atau otomatis pakai freeze jika diffDays == 2
            if (diffDays === 2 && freezeLeft > 0) {
              freezeLeft -= 1;
              // Streak aman
            } else {
              savedStreak = 0; // Reset streak
            }
          }
        }
        
        setCurrentStreak(savedStreak);
        setLongestStreak(profile.longest_streak || savedStreak);
        setStreakFreezeLeft(freezeLeft);
        setLastActiveDate(lastActive);

        setTotalQuestionsAnswered(profile.total_questions_answered || 0);
        setXpHistory([profile.xp || 0]);
        setProfileUsername(profile.username || 'user');
        isProfileSyncedRef.current = true;
      }

      // 3-5. Paralel: tarik data kuis, sesi tertunda, dan leaderboard sekaligus
      // Global safety timeout 20s agar tidak stuck forever di device lambat (iPhone, dll)
      const syncTimeout = new Promise<'timeout'>((_, reject) =>
        setTimeout(() => reject(new Error('Sync timeout (20s)')), 20000)
      );
      await Promise.race([
        Promise.all([
          fetchUserQuestions(userId, profile?.username || 'user'),
          checkActiveQuizSession(userId),
          fetchGlobalLeaderboard(),
        ]),
        syncTimeout,
      ]);
    } catch (err) {
      console.error('Error syncing user profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const checkActiveQuizSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      let cloudSessions: any[] = [];
      if (data && data.current_quiz_json) {
        const parsedQuiz = typeof data.current_quiz_json === 'string'
          ? JSON.parse(data.current_quiz_json)
          : data.current_quiz_json;
        
        if (parsedQuiz && parsedQuiz.is_multi_session === true) {
          cloudSessions = parsedQuiz.sessions || [];
        } else if (parsedQuiz) {
          const selectedDbs = typeof data.selected_databases === 'string'
            ? JSON.parse(data.selected_databases)
            : data.selected_databases;
          cloudSessions = [{
            id: `legacy_${new Date(data.updated_at).getTime()}`,
            title: selectedDbs ? selectedDbs.join(', ') : 'Kuis Sebelumnya',
            current_quiz_json: data.current_quiz_json,
            current_index: data.current_index,
            user_answers_json: data.user_answers_json,
            doubt_status_json: data.doubt_status_json,
            is_revealed_json: data.is_revealed_json,
            unlocked_hints_json: data.unlocked_hints_json,
            selected_databases: selectedDbs,
            quiz_mode: data.quiz_mode,
            updated_at: data.updated_at
          }];
        }
      }

      let localSessions: any[] = [];
      try {
        const savedLocal = localStorage.getItem('cbt_active_sessions');
        if (savedLocal) {
          localSessions = JSON.parse(savedLocal);
        }
      } catch (e) {
        console.error('Error loading local sessions:', e);
      }

      const sessionMap = new Map<string, any>();
      [...localSessions, ...cloudSessions].forEach(s => {
        if (!s || !s.id) return;
        const existing = sessionMap.get(s.id);
        if (!existing || new Date(s.updated_at) > new Date(existing.updated_at)) {
          sessionMap.set(s.id, s);
        }
      });

      const mergedSessions = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setPendingSessions(mergedSessions);
      try { localStorage.setItem('cbt_active_sessions', JSON.stringify(mergedSessions)); } catch(e) { console.warn('localStorage full'); }
    } catch (err) {
      console.error('Error checking active quiz session:', err);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');
      if (error) {
        if (error.code !== '42P01') console.error('Error fetching global settings:', error);
        return;
      }
      if (data) {
        data.forEach(row => {
          if (row.key === 'customFolders') setGlobalCustomFolders(row.value || []);
          if (row.key === 'quizFolderMap') setGlobalQuizFolderMap(row.value || {});
        });
      }
    } catch (err) {
      console.error('Error in fetchGlobalSettings:', err);
    }
  };

  const fetchUserQuestions = async (userId: string, username: string) => {
    try {
      // ============================================================
      // ANTI-EGRESS GUARD (Supabase Free Plan)
      // JANGAN pernah menarik questions_json utuh dari Supabase.
      // Cukup pointer kecil (r2_key/r2_url). Konten berat diambil dari
      // Cloudflare R2 (egress gratis) dengan cache browser 7 hari.
      // Fallback kompatibel untuk row lama yang masih inline (array).
      // ============================================================
      let data: any[] | null = null;
      const slim = await supabase
        .from('question_banks')
        .select(`
          name,
          user_id,
          questions_json->>r2_key as r2_key,
          questions_json->>r2_url as r2_url,
          profiles (
            username
          )
        `);

      if (slim.error) {
        // Kompatibilitas: PostgREST versi lama bisa gagal parse operator JSON.
        // Fallback ke select penuh ( perilaku lama ) agar app tetap jalan.
        console.warn('[Egress-Guard] Slim select gagal, fallback select lama:', slim.error.message);
        const legacy = await supabase
          .from('question_banks')
          .select(`
            name,
            questions_json,
            user_id,
            profiles (
              username
            )
          `);
        if (legacy.error) throw legacy.error;
        data = legacy.data;
      } else {
        data = slim.data;
      }

      const mappedData: Record<string, Question[]> = {};
      const globals: string[] = [];
      const uploaders: Record<string, string> = {};
      
      if (data) {
        const fetchPromises = data.map(async (row: any) => {
          let questions: any = null;

          // Normalisasi: slim row punya r2_key/r2_url langsung; legacy row ada di dalam questions_json
          let r2Key: string | null = row.r2_key ?? null;
          let oldUrl: string | null = row.r2_url ?? null;
          if (r2Key === null && row.questions_json !== undefined && row.questions_json !== null && !Array.isArray(row.questions_json)) {
            const qjObj = typeof row.questions_json === 'string' ? JSON.parse(row.questions_json) : row.questions_json;
            if (qjObj && typeof qjObj === 'object') {
              r2Key = qjObj.r2_key ?? null;
              oldUrl = qjObj.r2_url ?? null;
            }
          }

          if (r2Key) {
            // ---- Konten dari R2 (egress gratis), cache browser 7 hari ----
            const cached = await getCachedQuestions(r2Key);
            if (cached && Array.isArray(cached) && cached.length > 0) {
              questions = cached;
            } else {
              const R2_BASE = 'https://pub-f0707ec9f2b24a6e8ffc24ef68b6c995.r2.dev';
              const correctUrl = `${R2_BASE}/${r2Key}`;
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                const res = await fetch(correctUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                  const fetched = await res.json();
                  if (Array.isArray(fetched) && fetched.length > 0) {
                    questions = fetched;
                    // Simpan ke cache browser untuk kunjungan berikutnya
                    setCachedQuestions(r2Key, fetched);
                    // Auto-migrate: perbaiki r2_url di Supabase jika URL lama salah
                    if (oldUrl !== correctUrl) {
                      supabase.from('question_banks')
                        .update({ questions_json: { r2_url: correctUrl, r2_key: r2Key } })
                        .eq('name', row.name)
                        .then(() => console.log('Auto-migrated R2 URL for:', row.name));
                    }
                  } else {
                    console.warn('R2 returned empty/invalid data for:', row.name);
                    questions = [];
                  }
                } else {
                  console.warn('R2 fetch failed (status', res.status, ') for:', row.name);
                  questions = [];
                }
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  console.warn('R2 fetch timed out (10s) for:', row.name);
                } else {
                  console.error('Failed to fetch from R2 for', row.name, ':', err);
                }
                questions = [];
              }
            }
          } else if (row.questions_json !== undefined) {
            // ---- Row legacy (fallback select): array inline langsung dipakai ----
            let qj: any = row.questions_json;
            if (typeof qj === 'string') qj = JSON.parse(qj);
            questions = Array.isArray(qj) ? qj : [];
          } else {
            // ---- Row lama belum termigrasi (masih array inline di Supabase) ----
            // Ambil kontennya SEKALI secara ter-target (1 row saja) agar bank tidak hilang,
            // lalu JALANKAN scripts/migrate_banks_to_r2.mjs untuk migrasi permanen.
            console.warn(`[Egress-Guard] Bank "${row.name}" masih inline di Supabase. Jalankan: node scripts/migrate_banks_to_r2.mjs --apply`);
            try {
              const one = await supabase
                .from('question_banks')
                .select('questions_json')
                .eq('name', row.name)
                .eq('user_id', row.user_id)
                .maybeSingle();
              let qj: any = one.error ? null : one.data?.questions_json ?? null;
              if (typeof qj === 'string') qj = JSON.parse(qj);
              questions = Array.isArray(qj) ? qj : [];
            } catch {
              questions = [];
            }
          }
          return { row, questions };
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(({ row, questions }) => {
          if (questions && Array.isArray(questions)) {
            mappedData[row.name] = questions;
          } else {
            mappedData[row.name] = []; // Fallback aman
          }
          
          // Cek apakah pemiliknya adalah admin (global database)
          const ownerProfile = row.profiles as any;
          if (ownerProfile) {
            uploaders[row.name] = ownerProfile.username;
            if (ownerProfile.username === 'admin') {
              globals.push(row.name);
            }
          }
        });
      }
      setUploaderMap(uploaders);
      
      // Seed bank soal sampel jika login sebagai admin dan database kosong
      if (username === 'admin' && Object.keys(mappedData).length === 0) {
        console.log('Akun admin kosong. Melakukan seeding sampel bawaan...');
        for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
          // ANTI-EGRESS: R2 = penyimpanan primer; Supabase hanya menerima pointer kecil.
          // Jika R2 gagal → fallback inline (perilaku lama) agar seeding tidak pernah hilang.
          let payload: any = questions;
          try {
            const r2 = await uploadQuestionsToR2(name, questions as any[]);
            if (r2) payload = r2;
          } catch (err) {
            console.warn('R2 seed upload gagal, fallback inline untuk:', name, err);
          }
          await supabase
            .from('question_banks')
            .upsert({ user_id: userId, name, questions_json: payload }, { onConflict: 'user_id,name' });
          mappedData[name] = questions as any;
          globals.push(name);
        }
      }
      
      setGlobalDatabases(globals);
      setQuestionDatabase(mappedData);
      setSelectedDatabases([]);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        await fetchGlobalSettings();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);

          // Anonymous / guest users — skip heavy sync
          const isGuest = session.user.is_anonymous || session.user.user_metadata?.is_guest;
          if (isGuest) {
            setProfileUsername(session.user.user_metadata?.username || 'Guest');
            setAuthLoading(false);
            return;
          }

          let token = localStorage.getItem('cbt_session_token');
          if (!token) {
            token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('cbt_session_token', token);
          }
          setLocalSessionId(token);
          await syncUserProfile(session.user, token);
        } else {
          setCurrentUser(null);
          setQuestionDatabase({});
          setSelectedDatabases([]);
          setProfileUsername('user');
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          setCurrentUser(session.user);

          // Anonymous / guest users only need mabar — skip heavy profile sync
          const isGuest = session.user.is_anonymous || session.user.user_metadata?.is_guest;
          if (isGuest) {
            setProfileUsername(session.user.user_metadata?.username || 'Guest');
            setAuthLoading(false);
            return;
          }

          let token = localStorage.getItem('cbt_session_token');
          if (!token) {
            token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('cbt_session_token', token);
          }
          setLocalSessionId(token);
          await syncUserProfile(session.user, token);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLocalSessionId(null);
          setQuestionDatabase({});
          setSelectedDatabases([]);
          setProfileUsername('user');
          isProfileSyncedRef.current = false;
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Error on auth state change:', err);
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic active session checking
  useEffect(() => {
    if (!currentUser || !localSessionId) return;

    const interval = setInterval(async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('active_session_id')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;
        
        if (profile && profile.active_session_id !== localSessionId) {
          setIsSessionKicked(true);
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('Error checking active session:', err);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [currentUser, localSessionId]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      triggerToast('Username dan password wajib diisi!', '⚠️');
      return;
    }
    setAuthLoading(true);
    setIsSessionKicked(false);
    isLoggingInRef.current = true;

    // Generate new token on fresh login to take over session
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('cbt_session_token', token);
    setLocalSessionId(token);

    try {
      const email = emailInput.includes('@') 
        ? emailInput.trim() 
        : `${emailInput.trim().toLowerCase()}@ai.online`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordInput,
      });
      if (error) {
        isLoggingInRef.current = false;
        throw error;
      }
      triggerToast('Berhasil masuk!', '🔑');
    } catch (err: any) {
      console.error(err);
      isLoggingInRef.current = false;
      triggerToast('Username atau password salah', '❌');
    } finally {
      setAuthLoading(false);
    }
  };

  const removeDatabase = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    (async () => {
      try {
        const { error } = await supabase
          .from('question_banks')
          .delete()
          .eq('name', name)
          .eq('user_id', currentUser.id);
        if (error) throw error;
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus dari database`, '🗑');
      } catch (err) {
        console.error(err);
        // Hapus lokal saja jika server gagal
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus secara lokal, gagal menghapus di cloud`, '⚠️');
      }
    })();
  };

  return {
    currentUser, authLoading, authMode, emailInput, passwordInput, localSessionId,
    isSessionKicked, profileUsername, globalDatabases, uploaderMap, questionDatabase,
    isLoggingInRef, isProfileSyncedRef,
    setCurrentUser, setAuthLoading, setAuthMode, setEmailInput, setPasswordInput,
    setLocalSessionId, setIsSessionKicked, setProfileUsername, setGlobalDatabases,
    setUploaderMap, setQuestionDatabase,
    syncUserProfile, handleAuthSubmit, fetchGlobalSettings, fetchUserQuestions,
    checkActiveQuizSession, removeDatabase
  };
}
