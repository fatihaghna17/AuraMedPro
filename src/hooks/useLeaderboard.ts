import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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

      // 1. Coba ambil dari Cloudflare D1 terlebih dahulu
      const cfData = await cloudflareApi.getGlobalLeaderboard(globalTimeFilter);
      if (cfData && cfData.length > 0) {
        const userRankIndex = cfData.findIndex(u => u.username === profileUsername);
        let top10 = cfData.slice(0, 10);
        if (userRankIndex > 9) {
          top10.push({
            ...cfData[userRankIndex],
            isCurrentUserOutOfTop10: true,
            actualRank: userRankIndex + 1
          });
        }
        setGlobalLeaderboard(top10);
        setIsLeaderboardLoading(false);
        return;
      }

      // 2. Fallback ke Supabase
      let allData: any[] = [];

      if (globalTimeFilter === 'all') {
        // SEMUA WAKTU: pakai total_questions_answered dari profiles (kumulatif, tidak reset)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, total_questions_answered, level')
          .order('total_questions_answered', { ascending: false });
        
        if (error) throw error;
        allData = (data || []).map((row: any) => ({
          id: row.id,
          username: row.username,
          level: row.level,
          total_questions_answered: row.total_questions_answered || 0
        }));
      } else {
        // FILTER WAKTU: hitung jawaban benar dari quiz_history_logs
        // dengan fixed period berdasarkan WIB (UTC+7)

        // Fixed period WIB (UTC+7) — timezone-agnostic calculation
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
        const utcNowMs = Date.now();
        const wibNowMs = utcNowMs + WIB_OFFSET_MS;
        const wibNow = new Date(wibNowMs);

        // Ambil komponen tanggal WIB via getUTC* (karena wibNow sudah di-shift +7h)
        const wibYear = wibNow.getUTCFullYear();
        const wibMonth = wibNow.getUTCMonth();
        const wibDate = wibNow.getUTCDate();
        const wibDay = wibNow.getUTCDay();

        // Hitung cutoff dalam WIB, lalu konversi ke UTC
        let cutoffWibMs: number;
        if (globalTimeFilter === '1') {
          // HARI INI: 00:00 WIB hari ini
          cutoffWibMs = Date.UTC(wibYear, wibMonth, wibDate, 0, 0, 0);
        } else if (globalTimeFilter === '7') {
          // MINGGU INI: 00:00 WIB hari Senin terakhir
          const diffToMonday = wibDay === 0 ? 6 : wibDay - 1;
          cutoffWibMs = Date.UTC(wibYear, wibMonth, wibDate - diffToMonday, 0, 0, 0);
        } else {
          // BULAN INI: 00:00 WIB tanggal 1
          cutoffWibMs = Date.UTC(wibYear, wibMonth, 1, 0, 0, 0);
        }

        // Konversi WIB cutoff ke UTC (Supabase simpan created_at dalam UTC)
        const cutoffUtcMs = cutoffWibMs - WIB_OFFSET_MS;
        const cutoffIso = new Date(cutoffUtcMs).toISOString();

        const { data, error } = await supabase
          .from('quiz_history_logs')
          .select(`
            user_id,
            correct_count,
            profiles (
              username,
              level
            )
          `)
          .gte('created_at', cutoffIso);

        if (error) throw error;

        // Aggregate correct_count per user
        const userMap: Record<string, { username: string; level: number; total: number }> = {};
        (data || []).forEach((row: any) => {
          const uid = row.user_id;
          if (!userMap[uid]) {
            userMap[uid] = {
              username: row.profiles?.username || 'User',
              level: row.profiles?.level || 1,
              total: 0
            };
          }
          // Hitung jawaban BENAR (correct_count)
          userMap[uid].total += (row.correct_count || 0);
        });

        allData = Object.entries(userMap)
          .map(([id, info]) => ({
            id,
            username: info.username,
            level: info.level,
            total_questions_answered: info.total
          }))
          .sort((a, b) => b.total_questions_answered - a.total_questions_answered);
      }

      const userRankIndex = allData.findIndex(u => u.username === profileUsername);
      let top10 = allData.slice(0, 10);
      
      if (userRankIndex > 9) {
        top10.push({
          ...allData[userRankIndex],
          isCurrentUserOutOfTop10: true,
          actualRank: userRankIndex + 1
        });
      }

      setGlobalLeaderboard(top10);
    } catch (err: any) {
      console.error('Error fetching global leaderboard:', err);
      // Jika time-filtered query gagal (kemungkinan RLS), tampilkan pesan
      if (globalTimeFilter !== 'all') {
        console.warn('Time-filtered leaderboard query failed. Possible RLS issue on quiz_history_logs table. Error:', err?.message);
      }
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const fetchFileLeaderboard = async (fileName: string) => {
    if (!fileName) return;
    try {
      setIsLeaderboardLoading(true);
      
      // 1. Coba ambil dari Cloudflare D1 terlebih dahulu
      const cfData = await cloudflareApi.getFileLeaderboard(fileName, fileTimeFilter);
      if (cfData && cfData.length > 0) {
        const userRankIndex = cfData.findIndex(u => u.username === profileUsername);
        let top10 = cfData.slice(0, 10);
        if (userRankIndex > 9) {
          top10.push({
            ...cfData[userRankIndex],
            isCurrentUserOutOfTop10: true,
            actualRank: userRankIndex + 1
          });
        }
        setFileLeaderboard(top10);
        setIsLeaderboardLoading(false);
        return;
      }

      // 2. Fallback ke Supabase
      let query = supabase
        .from('leaderboard')
        .select(`
          user_id,
          score,
          questions_count,
          created_at,
          profiles (
            username,
            level
          )
        `)
        .eq('file_name', fileName);

      // Terapkan filter waktu jika bukan 'all' (fixed period WIB)
      if (fileTimeFilter !== 'all') {
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
        const utcNowMs = Date.now();
        const wibNowMs = utcNowMs + WIB_OFFSET_MS;
        const wibNow = new Date(wibNowMs);

        const wibYear = wibNow.getUTCFullYear();
        const wibMonth = wibNow.getUTCMonth();
        const wibDate = wibNow.getUTCDate();
        const wibDay = wibNow.getUTCDay();

        let cutoffWibMs: number;
        if (fileTimeFilter === '1') {
          cutoffWibMs = Date.UTC(wibYear, wibMonth, wibDate, 0, 0, 0);
        } else if (fileTimeFilter === '7') {
          const diffToMonday = wibDay === 0 ? 6 : wibDay - 1;
          cutoffWibMs = Date.UTC(wibYear, wibMonth, wibDate - diffToMonday, 0, 0, 0);
        } else {
          cutoffWibMs = Date.UTC(wibYear, wibMonth, 1, 0, 0, 0);
        }
        const cutoffUtcMs = cutoffWibMs - WIB_OFFSET_MS;
        query = query.gte('created_at', new Date(cutoffUtcMs).toISOString());
      }

      const { data, error } = await query
        .order('score', { ascending: false })
        .order('questions_count', { ascending: false });
      
      if (error) throw error;
      
      const allData: any[] = (data || []).map((row: any) => ({
        user_id: row.user_id,
        username: row.profiles?.username || 'User',
        level: row.profiles?.level || 1,
        score: row.score,
        questions_count: row.questions_count,
        created_at: row.created_at
      }));
      
      const userRankIndex = allData.findIndex(u => u.username === profileUsername);
      let top10 = allData.slice(0, 10);
      
      if (userRankIndex > 9) {
        top10.push({
          ...allData[userRankIndex],
          isCurrentUserOutOfTop10: true,
          actualRank: userRankIndex + 1
        });
      }

      setFileLeaderboard(top10);
    } catch (err) {
      console.error('Error fetching file leaderboard:', err);
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
      // 0. Simpan ke Cloudflare D1 (0 Egress!)
      cloudflareApi.recordQuizResult({
        user_id: currentUser.id,
        file_name: fileName,
        score,
        correct_count: correctCount,
        total_count: totalCount,
      }).catch(err => console.warn('Failed to sync to Cloudflare D1 leaderboard:', err));

      // 1. Insert ke quiz_history_logs (untuk time-filtered global leaderboard)
      const { error: logError } = await supabase
        .from('quiz_history_logs')
        .insert({
          user_id: currentUser.id,
          file_name: fileName,
          score: score,
          correct_count: correctCount,
          total_count: totalCount,
          created_at: new Date().toISOString(),
        });

      if (logError) console.error('Failed to insert quiz_history_logs:', logError);

      // 2. Insert/update leaderboard (untuk per-file leaderboard)
      // Cek apakah user sudah punya skor untuk file ini
      const { data: existingScore } = await supabase
        .from('leaderboard')
        .select('score, questions_count')
        .eq('user_id', currentUser.id)
        .eq('file_name', fileName)
        .maybeSingle();

      if (existingScore) {
        // Update hanya jika skor baru lebih tinggi, atau jumlah soal lebih banyak
        if (score > existingScore.score || totalCount > existingScore.questions_count) {
          await supabase
            .from('leaderboard')
            .update({
              score: Math.max(score, existingScore.score),
              questions_count: Math.max(totalCount, existingScore.questions_count),
              created_at: new Date().toISOString(),
            })
            .eq('user_id', currentUser.id)
            .eq('file_name', fileName);
        }
      } else {
        // Insert baru
        await supabase
          .from('leaderboard')
          .insert({
            user_id: currentUser.id,
            file_name: fileName,
            score: score,
            questions_count: totalCount,
            created_at: new Date().toISOString(),
          });
      }

      // 3. Update profiles.total_questions_answered (tambah correctCount)
      // Gunakan RPC untuk atomic increment agar tidak race condition
      const { error: profileError } = await supabase.rpc('increment_total_answered', {
        user_id_input: currentUser.id,
        count_input: correctCount,
      });

      if (profileError) {
        // Fallback: update manual jika RPC tidak ada
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_questions_answered')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              total_questions_answered: (profile.total_questions_answered || 0) + correctCount,
            })
            .eq('id', currentUser.id);
        }
      }

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
