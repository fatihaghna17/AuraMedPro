import { useState, useCallback } from 'react';
import { cloudflareApi } from '../services/cloudflareApi';

export function useLeaderboard(currentUser: any, profileUsername: string, triggerToast: (msg: string, icon?: string) => void) {
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

  async function fetchGlobalLeaderboard() {
    try {
      setIsLeaderboardLoading(true);
      const cfData = await cloudflareApi.getGlobalLeaderboard(globalTimeFilter);
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
    } catch (err) {
      console.error('Gagal mengambil leaderboard global dari D1:', err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }

  const fetchFileLeaderboard = async (fileName: string) => {
    if (!fileName) return;
    try {
      setIsLeaderboardLoading(true);
      const cfData = await cloudflareApi.getFileLeaderboard(fileName, fileTimeFilter);
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
    setGlobalLeaderboard, setFileLeaderboard, setIsLeaderboardLoading, setHasSubmittedLeaderboard,
    setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter, setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard
  };
}
