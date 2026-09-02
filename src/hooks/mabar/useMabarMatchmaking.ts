import { useState, useCallback, useRef } from 'react';
import { findOrCreateQuickMatch } from '../../lib/mabar/mabarMatchmaking';
import type { MabarGameMode, MabarRoom } from '../../lib/mabar/mabarTypes';

export function useMabarMatchmaking() {
  const [isSearching, setIsSearching] = useState(false);
  const [matchedRoom, setMatchedRoom] = useState<MabarRoom | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const startSearch = useCallback(async (userId: string, userName: string, mode: MabarGameMode) => {
    setIsSearching(true);
    setMatchedRoom(null);
    
    try {
      const room = await findOrCreateQuickMatch(userId, userName, mode, 'Cerdas Cermat Umum');
      setMatchedRoom(room);
    } catch (e) {
      console.error('Matchmaking error:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const cancelSearch = useCallback(() => {
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    // Note: should leave room if we created one and are cancelling
  }, []);

  return { isSearching, matchedRoom, startSearch, cancelSearch };
}
