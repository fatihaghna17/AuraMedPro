import { useState, useCallback, useRef, useEffect } from 'react';
import { cloudflareApi } from '../services/cloudflareApi';

export function useLeaderboard(
  currentUser: any,
  profileUsername: string,
  triggerToast: (msg: string, icon?: string) => void,
  angkatan?: string,
  isSuperAdmin?: boolean,
  isAdminAngkatan?: boolean,
  userProdi?: string
) {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [fileLeaderboard, setFileLeaderboard] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [hasSubmittedLeaderboard, setHasSubmittedLeaderboard] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState<number>(0);
  const [globalTimeFilter, setGlobalTimeFilter] = useState<'all' | '1' | '7' | '30'>('all');
  const [fileTimeFilter, setFileTimeFilter] = useState<'all' | '1' | '7' | '30'>('all');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'file'>('global');
  const [selectedLeaderboardFile, setSelectedLeaderboardFile] = useState<string>('');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'riwayat' | 'leaderboard'>('riwayat');
  const [leaderboardScope, setLeaderboardScope] = useState<'my' | 'all'>('my');
  const [adminAngkatanFilter, setAdminAngkatanFilter] = useState<'all' | '23' | '24' | '25' | '26'>('all');
  const [leaderboardProdiFilter, setLeaderboardProdiFilter] = useState<string>(
    isSuperAdmin ? 'all' : (userProdi || 'all')
  );

  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (userProdi && !isSuperAdmin && !initialSyncDone.current) {
      initialSyncDone.current = true;
      setLeaderboardProdiFilter(userProdi);
    }
  }, [userProdi, isSuperAdmin]);

  const getTargetAngkatan = useCallback(() => {
    if (isSuperAdmin) {
      // Super admin bisa melihat semua peringkat ('all') atau memilih angkatan tertentu via dropdown
      return adminAngkatanFilter;
    }
    if (isAdminAngkatan) {
      // Admin angkatan hanya bisa melihat di angkatannya saja
      return angkatan || undefined;
    }
    // Pengguna biasa bisa beralih antara 'my' (Angkatan Saya) atau 'all' (Lintas Angkatan)
    if (leaderboardScope === 'all') {
      return 'all';
    }
    return angkatan || undefined;
  }, [isSuperAdmin, isAdminAngkatan, adminAngkatanFilter, leaderboardScope, angkatan]);

  const getTargetProdi = useCallback(() => {
    if (leaderboardProdiFilter && leaderboardProdiFilter !== 'all') {
      return leaderboardProdiFilter;
    }
    return undefined;
  }, [leaderboardProdiFilter]);

  async function fetchGlobalLeaderboard(angkatanOverride?: string, prodiOverride?: string) {
    try {
      setIsLeaderboardLoading(true);
      const targetAngkatan = angkatanOverride !== undefined ? angkatanOverride : getTargetAngkatan();
      const targetProdi = prodiOverride !== undefined ? prodiOverride : getTargetProdi();
      const cfData = await cloudflareApi.getGlobalLeaderboard(globalTimeFilter, targetAngkatan, targetProdi);
      const isAnyAdmin = isSuperAdmin || isAdminAngkatan;
      if (isAnyAdmin) {
        // Admin (super admin maupun admin angkatan) melihat seluruh user
        setGlobalLeaderboard(cfData || []);
      } else {
        const userRankIndex = (cfData || []).findIndex((u: any) => u.username === profileUsername);
        let top10 = (cfData || []).slice(0, 10);
        if (userRankIndex > 9) {
          top10.push({
            ...cfData[userRankIndex],
            isCurrentUserOutOfTop10: true,
            actualRank: userRankIndex + 1,
          });
        }
        setGlobalLeaderboard(top10);
      }
    } catch (err) {
      console.error('Gagal mengambil leaderboard global dari D1:', err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }

  const fetchFileLeaderboard = async (fileName: string, angkatanOverride?: string, prodiOverride?: string) => {
    if (!fileName) return;
    try {
      setIsLeaderboardLoading(true);
      const targetAngkatan = angkatanOverride !== undefined ? angkatanOverride : getTargetAngkatan();
      const targetProdi = prodiOverride !== undefined ? prodiOverride : getTargetProdi();
      const cfData = await cloudflareApi.getFileLeaderboard(fileName, fileTimeFilter, targetAngkatan, targetProdi);
      const isAnyAdmin = isSuperAdmin || isAdminAngkatan;
      if (isAnyAdmin) {
        // Admin (super admin maupun admin angkatan) melihat seluruh user
        setFileLeaderboard(cfData || []);
      } else {
        const userRankIndex = (cfData || []).findIndex((u: any) => u.username === profileUsername);
        let top10 = (cfData || []).slice(0, 10);
        if (userRankIndex > 9) {
          top10.push({
            ...cfData[userRankIndex],
            isCurrentUserOutOfTop10: true,
            actualRank: userRankIndex + 1,
          });
        }
        setFileLeaderboard(top10);
      }
    } catch (err) {
      console.error('Gagal mengambil leaderboard file dari D1:', err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const recordQuizToLeaderboard = useCallback(async (
    fileName: string,
    correctCount: number,
    totalCount: number
  ) => {
    if (!currentUser || totalCount === 0) return;

    const score = Math.round((correctCount / totalCount) * 100);

    try {
      // Simpan langsung ke Cloudflare D1 (otomatis mengupdate quiz_history_logs, leaderboard, & total_questions_answered secara atomik)
      await cloudflareApi.recordQuizResult({
        user_id: currentUser.id,
        file_name: fileName,
        score,
        correct_count: correctCount,
        total_count: totalCount,
      });

      // Re-fetch leaderboard setelah update
      await fetchGlobalLeaderboard();
    } catch (err) {
      console.error('Failed to record quiz to leaderboard:', err);
    }
  }, [currentUser, profileUsername, globalTimeFilter]);

  return {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    adminAngkatanFilter, setAdminAngkatanFilter,
    leaderboardScope, setLeaderboardScope,
    leaderboardProdiFilter, setLeaderboardProdiFilter,
    setGlobalLeaderboard, setFileLeaderboard, setIsLeaderboardLoading, setHasSubmittedLeaderboard,
    setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter, setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard
  };
}
