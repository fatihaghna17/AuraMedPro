import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';
import { SAMPLE_BANKS } from '../data/sampleBanks';
import { getCachedQuestions, setCachedQuestions, getLocalUserBanks, deleteLocalUserBank } from '../utils/questionCache';
import { cloudflareApi } from '../services/cloudflareApi';
import { authClient } from '../lib/authClient';

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
      // 1. Ambil data profil dari Cloudflare D1
      let profile = await cloudflareApi.getProfile(userId);

      if (!profile) {
        const newProfile: any = {
          id: userId,
          username: user.user_metadata?.username || defaultUsername,
          role: 'user',
          xp: 0,
          streak: 0,
          level: 1,
          total_questions_answered: 0,
          active_session_id: currentSessionId
        };
        await cloudflareApi.saveProfile(newProfile);
        profile = newProfile;
      }

      if (profile) {
        // 2. Cek Single Device Session
        if (isLoggingInRef.current) {
          // Jika proses login baru, langsung update session ID di DB dan matikan flag
          await cloudflareApi.saveProfile({ ...profile, active_session_id: currentSessionId });
          isLoggingInRef.current = false;
        } else {
          // Jika background check biasa, cek apakah session ID bentrok dengan device lain
          if (profile.active_session_id && profile.active_session_id !== currentSessionId) {
            setIsSessionKicked(true);
            await authClient.signOut();
            return;
          }

          // Update active_session_id di database jika masih kosong
          if (!profile.active_session_id) {
            await cloudflareApi.saveProfile({ ...profile, active_session_id: currentSessionId });
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

        // Sinkronkan profil ke Cloudflare D1 agar ID non-admin dikenali dengan username yang benar
        cloudflareApi.saveProfile({
          id: userId,
          username: profile.username || defaultUsername,
          role: profile.role || (profile.username === 'admin' ? 'admin' : 'user'),
          xp: profile.xp || 0,
          streak: savedStreak,
          level: profile.level || 1,
          total_questions_answered: profile.total_questions_answered || 0,
          last_active: lastActive || new Date().toISOString()
        }).catch((cfErr) => console.warn('Sync profile to D1 failed (best-effort):', cfErr));
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
      // 1. Ambil sesi dari Cloudflare D1
      const cfSession = await cloudflareApi.getQuizSession(userId);
      let cloudSessions: any[] = [];
      if (cfSession) {
        if (cfSession.is_multi_session === true && Array.isArray(cfSession.sessions)) {
          cloudSessions = cfSession.sessions;
        } else if (Array.isArray(cfSession.sessions)) {
          cloudSessions = cfSession.sessions;
        }
      }
      if (cloudSessions.length > 0) {
        setPendingSessions(cloudSessions);
        return;
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
      // Ambil dari Cloudflare D1
      const cfSettings = await cloudflareApi.getAppSettings();
      if (cfSettings) {
        if (cfSettings.customFolders) setGlobalCustomFolders(cfSettings.customFolders);
        if (cfSettings.quizFolderMap) setGlobalQuizFolderMap(cfSettings.quizFolderMap);
      }
    } catch (err) {
      console.error('Error in fetchGlobalSettings:', err);
    }
  };

  const fetchUserQuestions = async (userId: string, username: string) => {
    try {
      // 1. Ambil metadata bank soal dari Cloudflare D1 (0 Egress!)
      const cfBanks = await cloudflareApi.getQuestionBanks();
      
      let data: any[] = [];
      if (cfBanks && cfBanks.length > 0) {
        data = cfBanks
          .filter(b => {
            // Soal global bawaan dari admin
            const isGlobal = b.user_id === '47c2368d-792a-4c69-9386-4b7d2139ddc3' || b.uploader_username === 'admin';
            // Soal pribadi milik user yang sedang login
            const isMine = b.user_id === userId;
            // Hak pantau semua soal khusus akun collector
            const isCollector = username === 'collector' || profileUsername === 'collector' || currentUser?.user_metadata?.username === 'collector' || currentUser?.email === 'collector@ai.online';
            return isGlobal || isMine || isCollector;
          })
          .map(b => {
            // Utamakan r2_key untuk menarik berkas soal lengkap dari Cloudflare R2
            const hasDirectJson = b.questions_json && b.questions_json !== 'null' && b.questions_json !== 'undefined';
            const questionsPayload = b.r2_key 
              ? { r2_key: b.r2_key, r2_url: b.r2_url } 
              : (hasDirectJson ? b.questions_json : null);
            return {
              name: b.name,
              user_id: b.user_id,
              questions_json: questionsPayload,
              profiles: { username: b.uploader_username || (b.user_id === userId ? username : 'admin') }
            };
          });
      } else {
        console.warn('Bank soal dari Cloudflare D1 belum tersedia.');
      }
      
      const mappedData: Record<string, Question[]> = {};
      const globals: string[] = [];
      const uploaders: Record<string, string> = {};
      
      if (data) {
        const fetchPromises = data.map(async (row: any) => {
          let questions = typeof row.questions_json === 'string'
            ? JSON.parse(row.questions_json)
            : row.questions_json;
            
          if (questions && !Array.isArray(questions) && questions.r2_key) {
            const r2Key = questions.r2_key;
            // 1. Cek cache lokal browser terlebih dahulu (0ms network)
            const cached = await getCachedQuestions(r2Key);
            if (cached && Array.isArray(cached) && cached.length > 0) {
              questions = cached;
            } else {
              // 2. Fetch dari R2 via same-origin proxy (hindari CORS block)
              const correctUrl = `/api/r2-questions?key=${encodeURIComponent(r2Key)}`;
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
            if (row.user_id === '47c2368d-792a-4c69-9386-4b7d2139ddc3' || ownerProfile.username === 'admin') {
              globals.push(row.name);
            }
          }
        });
      }

      // Muat juga bank soal kustom lokal jika belum ada di mappedData
      try {
        const localBanks = getLocalUserBanks();
        Object.entries(localBanks).forEach(([bName, bQuestions]) => {
          if (!mappedData[bName] || mappedData[bName].length === 0) {
            mappedData[bName] = bQuestions;
            if (!uploaders[bName]) {
              uploaders[bName] = username;
            }
          }
        });
      } catch (e) {
        console.warn('Gagal memuat bank soal lokal:', e);
      }

      setUploaderMap(uploaders);
      
      // Seed bank soal sampel jika login sebagai admin dan database kosong
      if (username === 'admin' && Object.keys(mappedData).length === 0) {
        console.log('Akun admin kosong. Melakukan seeding sampel bawaan...');
        for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
          await cloudflareApi.saveQuestionBank(userId, name, questions);
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
        const { data: { session } } = await authClient.getSession();
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

    const { data: { subscription } } = authClient.onAuthStateChange(async (event, session) => {
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
        const profile = await cloudflareApi.getProfile(currentUser.id);
        
        if (profile && profile.active_session_id && profile.active_session_id !== localSessionId) {
          setIsSessionKicked(true);
          await authClient.signOut();
        }
      } catch (err) {
        console.error('Error checking active session:', err);
      }
    }, 120000); // 2 menit (menghemat egress 87.5% dibanding 15 detik)

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

      const { error } = await authClient.signInWithPassword({
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
      const msg = String(err?.message || '') + ' ' + String(err?.name || '');
      const isNetworkIssue = /network|fetch|timeout|abort/i.test(msg);
      if (isNetworkIssue) {
        triggerToast('Server sedang lambat/tidak bisa dihubungi. Coba lagi 1-2 menit.', '📡');
      } else {
        triggerToast('Username atau password salah', '❌');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const removeDatabase = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    (async () => {
      try {
        // 1. Hapus dari Cloudflare D1 & R2
        cloudflareApi.deleteQuestionBank(name).catch((cfErr) => console.warn('Gagal hapus D1:', cfErr));
        // 2. Hapus dari storage browser lokal
        deleteLocalUserBank(name);

        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus dari database`, '🗑');
      } catch (err) {
        console.error(err);
        deleteLocalUserBank(name);
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus secara lokal`, '⚠️');
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
