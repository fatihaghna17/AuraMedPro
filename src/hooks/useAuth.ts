import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';
import { SAMPLE_BANKS } from '../data/sampleBanks';
import { getCachedQuestions, setCachedQuestions, getLocalUserBanks, deleteLocalUserBank, cleanupLegacyLocalBanks } from '../utils/questionCache';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAngkatan, setUserAngkatan] = useState<string | null>(null);
  const [userProdi, setUserProdi] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>('2026-09-14T05:00:00Z');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState<boolean>(true);
  const [globalDatabases, setGlobalDatabases] = useState<string[]>([]);
  const [uploaderMap, setUploaderMap] = useState<Record<string, string>>({});
  const [bankAngkatanMap, setBankAngkatanMap] = useState<Record<string, string>>({});
  const [bankProdiMap, setBankProdiMap] = useState<Record<string, string>>({});
  const [bankGroupMap, setBankGroupMap] = useState<Record<string, string>>({});
  const [bankCreatedAtMap, setBankCreatedAtMap] = useState<Record<string, string>>({});
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
        
        // Simpan state profil, angkatan, prodi, dan subscription
        setUserProfile(profile);
        setUserAngkatan(profile.angkatan || null);
        setUserProdi(profile.prodi || 'kedokteran');
        setSubscriptionStatus(profile.subscription_status || 'trial');
        
        const trialEndsMap: Record<string, string> = {
          '23': '2026-09-14T05:00:00Z',
          '24': '2026-09-14T05:00:00Z',
          '25': '2026-09-17T05:00:00Z',
          '26': '2026-09-22T05:00:00Z',
        };
        const effectiveTrialEnd = profile.trial_ends_at || (profile.angkatan ? trialEndsMap[profile.angkatan] : '2026-09-14T05:00:00Z');
        setTrialEndsAt(effectiveTrialEnd);
        setSubscriptionExpiresAt(profile.subscription_expires_at || null);

        // Validasi akses langganan / trial:
        let accessAllowed = user.user_metadata?.canAccess ?? true;
        
        // Coba validasi jika backend gagal mengirimkan canAccess
        if (user.user_metadata?.canAccess === undefined) {
           try {
              const subInfo = await authClient.getSubscriptionStatus(userId);
              if (subInfo) {
                accessAllowed = subInfo.canAccess;
                setSubscriptionStatus(subInfo.status);
                setTrialEndsAt(subInfo.trialEndsAt);
                setSubscriptionExpiresAt(subInfo.subscriptionExpiresAt);
              }
           } catch (e) {}
        }
        
        setCanAccess(accessAllowed);

        isProfileSyncedRef.current = true;

        // Sinkronkan profil ke Cloudflare D1 agar ID non-admin dikenali dengan username yang benar
        cloudflareApi.saveProfile({
          id: userId,
          username: profile.username || defaultUsername,
          role: profile.role || (profile.username === 'admin' || profile.username === 'admin25' ? 'admin' : undefined),
          xp: profile.xp || 0,
          streak: savedStreak,
          level: profile.level || 1,
          total_questions_answered: profile.total_questions_answered || 0,
          last_active: lastActive || new Date().toISOString(),
          angkatan: profile.angkatan,
          prodi: profile.prodi || 'kedokteran'
        }).catch((cfErr) => console.warn('Sync profile to D1 failed (best-effort):', cfErr));
      }

      // 3-5. Paralel: tarik data kuis, sesi tertunda, dan leaderboard sekaligus
      // Global safety timeout 20s agar tidak stuck forever di device lambat (iPhone, dll)
      const syncTimeout = new Promise<'timeout'>((_, reject) =>
        setTimeout(() => reject(new Error('Sync timeout (20s)')), 20000)
      );
      await Promise.race([
        Promise.all([
          fetchUserQuestions(userId, profile?.username || 'user', profile?.angkatan, profile?.prodi || 'kedokteran'),
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

  const fetchUserQuestions = async (userId: string, username: string, angkatan?: string, prodi?: string) => {
    try {
      // 1. Ambil metadata bank soal dari Cloudflare D1 (0 Egress!)
      // Hanya admin super yang mengambil seluruh soal lintas angkatan dan prodi
      const isSuper = username === 'admin' || userProfile?.role === 'super_admin';
      const queryAngkatan = isSuper ? undefined : angkatan;
      const queryProdi = isSuper ? undefined : prodi;
      const cfBanks = await cloudflareApi.getQuestionBanks(queryAngkatan, queryProdi);
      
      let data: any[] = [];
      if (cfBanks && cfBanks.length > 0) {
        data = cfBanks
          .filter(b => {
            if (isSuper) return true;

            const bankAngkatans = (b.angkatan || 'all').split(',').map(s => s.trim());
            const angkatanMatch = bankAngkatans.includes('all') || (angkatan && bankAngkatans.includes(angkatan));

            const bankProdis = (b.prodi || 'all').split(',').map(s => s.trim().toLowerCase());
            const currentProdi = (prodi || userProdi || 'kedokteran').toLowerCase();
            const prodiMatch = bankProdis.includes('all') || bankProdis.includes(currentProdi);

            // Soal dari admin besar atau admin angkatan
            const isFromAdmin = 
              b.user_id === '47c2368d-792a-4c69-9386-4b7d2139ddc3' || 
              b.uploader_username === 'admin' ||
              (b.uploader_username && b.uploader_username.toLowerCase().startsWith('admin'));

            // Soal pribadi milik user yang sedang login
            const isMine = b.user_id === userId;

            // Hak unduh akun collector / admin angkatan
            const isCollector = 
              username === 'collector' || 
              profileUsername === 'collector' || 
              currentUser?.user_metadata?.username === 'collector' || 
              currentUser?.email === 'collector@ai.online' || 
              userProfile?.role === 'collector' ||
              userProfile?.role === 'admin_angkatan' ||
              username.toLowerCase().startsWith('admin');

            return (isFromAdmin || isMine || isCollector) && angkatanMatch && prodiMatch;
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
              angkatan: b.angkatan,
              prodi: b.prodi,
              created_at: b.created_at,
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
      const angkatans: Record<string, string> = {};
      const prodis: Record<string, string> = {};
      const createdAts: Record<string, string> = {};
      const groups: Record<string, string> = {};

      if (data) {
        data.forEach((b: any) => {
          angkatans[b.name] = b.angkatan || 'all';
          prodis[b.name] = b.prodi || 'all';
          if (b.study_group_id) {
            groups[b.name] = b.study_group_id;
          }
          if (b.created_at) {
            createdAts[b.name] = b.created_at;
          }
        });

        const fetchPromises = data.map(async (row: any) => {
          let questions = typeof row.questions_json === 'string'
            ? JSON.parse(row.questions_json)
            : row.questions_json;
            
          if ((!questions || !Array.isArray(questions)) && row.r2_key) {
            const r2Key = row.r2_key;
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
          const uploaderUser = row.uploader_username || (row.profiles as any)?.username;
          if (uploaderUser) {
            uploaders[row.name] = uploaderUser;
          }
          if (
            row.user_id === '47c2368d-792a-4c69-9386-4b7d2139ddc3' || 
            uploaderUser === 'admin' ||
            (uploaderUser && uploaderUser.toLowerCase().startsWith('admin'))
          ) {
            globals.push(row.name);
          }
        });
      }

      // Bersihkan cache lama un-scoped agar tidak mencemari akun lain di perangkat yang sama
      cleanupLegacyLocalBanks();

      // Muat juga bank soal kustom lokal jika belum ada di mappedData (diisolasi per akun)
      try {
        const localBanks = getLocalUserBanks(userId);
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

      setUploaderMap(prev => ({ ...prev, ...uploaders }));
      setBankAngkatanMap(prev => ({ ...prev, ...angkatans }));
      setBankProdiMap(prev => ({ ...prev, ...prodis }));
      setBankGroupMap(prev => ({ ...prev, ...groups }));
      setBankCreatedAtMap(prev => ({ ...prev, ...createdAts }));
      
      // Seed bank soal sampel jika login sebagai admin dan database kosong
      if (username === 'admin' && Object.keys(mappedData).length === 0) {
        console.log('Akun admin kosong. Melakukan seeding sampel bawaan...');
        for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
          await cloudflareApi.saveQuestionBank(userId, name, questions);
          mappedData[name] = questions as any;
          globals.push(name);
        }
      }
      
      setGlobalDatabases(prev => [...new Set([...prev, ...globals])]);
      setQuestionDatabase(prev => ({ ...prev, ...mappedData }));
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

  const fetchGroupBanks = async (groupId: string) => {
    try {
      const cfBanks = await cloudflareApi.getQuestionBanks(undefined, undefined, { study_group_id: groupId });
      if (cfBanks && cfBanks.length > 0) {
        const uploaderMapUpdate: Record<string, string> = {};
        const angkatanMapUpdate: Record<string, string> = {};
        const prodiMapUpdate: Record<string, string> = {};
        const groupsUpdate: Record<string, string> = {};
        const createdAtMapUpdate: Record<string, string> = {};
        const dbUpdate: Record<string, any[]> = {};
        const newDbs: string[] = [];

        const fetchPromises = cfBanks.map(async (b: any) => {
          const name = b.name;
          uploaderMapUpdate[name] = b.uploader_username || 'admin';
          angkatanMapUpdate[name] = b.angkatan || 'all';
          prodiMapUpdate[name] = b.prodi || 'all';
          if (b.study_group_id) {
            groupsUpdate[name] = b.study_group_id;
          }
          if (b.created_at) {
            createdAtMapUpdate[name] = b.created_at;
          }

          let questions = typeof b.questions_json === 'string'
            ? JSON.parse(b.questions_json)
            : b.questions_json;

          if ((!questions || !Array.isArray(questions)) && b.r2_key) {
            const r2Key = b.r2_key;
            const cached = await getCachedQuestions(r2Key);
            if (cached && Array.isArray(cached) && cached.length > 0) {
              questions = cached;
            } else {
              const correctUrl = `/api/r2-questions?key=${encodeURIComponent(r2Key)}`;
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const res = await fetch(correctUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                  const fetched = await res.json();
                  if (Array.isArray(fetched) && fetched.length > 0) {
                    questions = fetched;
                    setCachedQuestions(r2Key, fetched);
                  } else {
                    questions = [];
                  }
                } else {
                  questions = [];
                }
              } catch (err: any) {
                questions = [];
              }
            }
          }

          return { name, questions };
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(({ name, questions }) => {
          if (questions && Array.isArray(questions)) {
            dbUpdate[name] = questions;
            newDbs.push(name);
          }
        });

        setUploaderMap((prev) => ({ ...prev, ...uploaderMapUpdate }));
        setBankAngkatanMap((prev) => ({ ...prev, ...angkatanMapUpdate }));
        setBankProdiMap((prev) => ({ ...prev, ...prodiMapUpdate }));
        setBankGroupMap((prev) => ({ ...prev, ...groupsUpdate }));
        setBankCreatedAtMap((prev) => ({ ...prev, ...createdAtMapUpdate }));
        setQuestionDatabase((prev) => ({ ...prev, ...dbUpdate }));
        setGlobalDatabases((prev) => [...new Set([...prev, ...newDbs])]);
      }
    } catch (e) {
      console.error('Error fetching group banks:', e);
    }
  };

  const removeDatabase = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    (async () => {
      try {
        // 1. Hapus dari Cloudflare D1 & R2
        await cloudflareApi.deleteQuestionBank(name);
        // 2. Hapus dari storage browser lokal
        deleteLocalUserBank(name, currentUser?.id);
        deleteLocalUserBank(name); // fallback un-scoped

        // 3. Bersihkan dari quizFolderMap
        setGlobalQuizFolderMap((prev: any) => {
          if (!prev || !prev[name]) return prev;
          const next = { ...prev };
          delete next[name];
          cloudflareApi.saveAppSettings('quizFolderMap', next).catch(() => {});
          return next;
        });

        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus dari database`, '🗑');
      } catch (err) {
        console.error(err);
        deleteLocalUserBank(name, currentUser?.id);
        deleteLocalUserBank(name);
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus secara lokal`, '⚠️');
      }
    })();
  };

  const refreshSubscriptionStatus = async () => {
    if (!currentUser) return;
    try {
      const statusInfo = await authClient.getSubscriptionStatus(currentUser.id);
      if (statusInfo) {
        setSubscriptionStatus(statusInfo.status);
        setCanAccess(statusInfo.canAccess);
        setTrialEndsAt(statusInfo.trialEndsAt);
        setSubscriptionExpiresAt(statusInfo.subscriptionExpiresAt);
        if (statusInfo.canAccess) {
          triggerToast('Status langganan aktif!', '🎉');
        }
      }
    } catch (e) {
      console.error('Error refreshing subscription status:', e);
    }
  };

  return {
    currentUser, authLoading, authMode, emailInput, passwordInput, localSessionId,
    isSessionKicked, profileUsername, userProfile, userAngkatan, userProdi, subscriptionStatus,
    trialEndsAt, subscriptionExpiresAt, canAccess, globalDatabases, uploaderMap, bankAngkatanMap, bankProdiMap, bankGroupMap, bankCreatedAtMap, questionDatabase,
    isLoggingInRef, isProfileSyncedRef,
    setCurrentUser, setAuthLoading, setAuthMode, setEmailInput, setPasswordInput,
    setLocalSessionId, setIsSessionKicked, setProfileUsername, setUserProfile, setUserAngkatan, setUserProdi,
    setSubscriptionStatus, setCanAccess, setGlobalDatabases,
    setUploaderMap, setBankAngkatanMap, setBankProdiMap, setBankGroupMap, setBankCreatedAtMap, setQuestionDatabase,
    syncUserProfile, handleAuthSubmit, fetchGlobalSettings, fetchUserQuestions, fetchGroupBanks,
    checkActiveQuizSession, removeDatabase, refreshSubscriptionStatus
  };
}
