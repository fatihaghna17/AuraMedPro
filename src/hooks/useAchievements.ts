// src/hooks/useAchievements.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Achievement, AchievementStats, checkNewAchievements, ACHIEVEMENTS } from '../utils/achievements';
import { cloudflareApi } from '../services/cloudflareApi';

export function useAchievements(userId: string | null, onXPReward?: (xp: number) => void) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const xpRewardQueued = useRef(0);

  const fetchUnlocked = useCallback(async () => {
    if (!userId) return;
    try {
      const cfIds = await cloudflareApi.getAchievements(userId);
      if (cfIds && cfIds.length > 0) {
        setUnlockedIds(cfIds);
        return;
      }
    } catch {
      // fallback to supabase
    }
    const { data } = await supabase
      .from('user_achievements').select('achievement_id').eq('user_id', userId);
    setUnlockedIds((data || []).map(d => d.achievement_id));
  }, [userId]);

  useEffect(() => { fetchUnlocked(); }, [fetchUnlocked]);

  const checkAchievements = useCallback(async (stats: AchievementStats) => {
    if (!userId) return [];
    const newOnes = checkNewAchievements(stats, unlockedIds);
    if (newOnes.length > 0) {
      setNewlyUnlocked(newOnes);
      for (const a of newOnes) {
        cloudflareApi.saveAchievement(userId, a.id).catch(() => {});
        await supabase.from('user_achievements').upsert(
          { user_id: userId, achievement_id: a.id },
          { onConflict: 'user_id,achievement_id' }
        );
      }
      const totalXPReward = newOnes.reduce((sum, a) => sum + a.xpReward, 0);
      xpRewardQueued.current += totalXPReward;
      if (onXPReward) onXPReward(totalXPReward);
      setUnlockedIds(prev => [...prev, ...newOnes.map(a => a.id)]);
    }
    return newOnes;
  }, [userId, unlockedIds, onXPReward]);

  const dismissNew = () => setNewlyUnlocked([]);

  const getAllAchievements = () => ACHIEVEMENTS.map(a => ({
    ...a,
    isUnlocked: unlockedIds.includes(a.id),
  }));

  return { unlockedIds, newlyUnlocked, checkAchievements, dismissNew, fetchUnlocked, getAllAchievements };
}
