// src/hooks/useAchievements.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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
      setUnlockedIds(cfIds || []);
    } catch (err) {
      console.error('Failed to fetch achievements from D1:', err);
    }
  }, [userId]);

  useEffect(() => { fetchUnlocked(); }, [fetchUnlocked]);

  const checkAchievements = useCallback(async (stats: AchievementStats) => {
    if (!userId) return [];
    const newOnes = checkNewAchievements(stats, unlockedIds);
    if (newOnes.length > 0) {
      setNewlyUnlocked(newOnes);
      for (const a of newOnes) {
        await cloudflareApi.saveAchievement(userId, a.id).catch(err => {
          console.warn('Failed to save achievement to D1:', err);
        });
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
