import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { formatNotifTime } from '../utils/appHelpers';

export function useNotifications(currentUser: any, srs: any, triggerToast: (msg: string, icon?: string) => void) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<{ id: string; type: 'srs' | 'new_quiz'; text: string; time: string; bankName?: string }[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(() => ('Notification' in window && Notification.permission === 'granted') || localStorage.getItem('auramed_push') === 'dismissed');

  const showBrowserNotification = useCallback((title: string, body: string, url?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      // Use Service Worker if available (works even when app is in background)
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, body, url: url || window.location.href },
        });
      } else {
        // Fallback: direct Notification API
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'auramed-notif',
          renotify: true,
        } as NotificationOptions);
      }
    } catch (e) {
      // Notification failed silently — non-critical
    }
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      triggerToast('Browser ini tidak mendukung notifikasi', '⚠️');
      return;
    }
    if (Notification.permission === 'granted') {
      setPushEnabled(true);
      return;
    }
    if (Notification.permission === 'denied') {
      triggerToast('Izin notifikasi ditolak. Aktifkan di Settings browser.', '⚠️');
      localStorage.setItem('auramed_push', 'dismissed');
      setPushEnabled(true);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushEnabled(true);
      triggerToast('Notifikasi device aktif!', '🔔');
      
    } else {
      localStorage.setItem('auramed_push', 'dismissed');
      setPushEnabled(true);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const lastCheck = localStorage.getItem('cbt_last_notif_check');
      const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
      const newNotifs: { id: string; type: 'srs' | 'new_quiz'; text: string; time: string; bankName?: string }[] = [];

      // 1. SRS: hitung kartu yang perlu direview dari local state
      if (srs && srs.cards) {
        const now = new Date();
        const dueCards = srs.cards.filter((c: any) => new Date(c.next_review_date) <= now);
        if (dueCards.length > 0) {
          newNotifs.push({
            id: 'srs-due',
            type: 'srs',
            text: `${dueCards.length} kartu SRS perlu direview hari ini`,
            time: 'Sekarang',
          });
        }
      }

      // 2. Kuis baru dari admin/collector sejak lastCheck
      const { data: newBanks } = await supabase
        .from('question_banks')
        .select(`name, created_at, profiles!inner(username)`)
        .gte('created_at', lastCheckDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (newBanks && newBanks.length > 0) {
        const adminBanks = newBanks.filter((b: any) =>
          b.profiles && (b.profiles.username === 'admin' || b.profiles.username === 'collector')
        );
        adminBanks.forEach((b: any) => {
          newNotifs.push({
            id: `quiz-${b.name}-${b.created_at}`,
            type: 'new_quiz',
            text: `Kuis baru: ${b.name}`,
            time: formatNotifTime(b.created_at),
            bankName: b.name,
          });
        });
      }

      setNotifList(newNotifs);
      setNotifCount(newNotifs.length);

      // Push browser notification for new items (only if user granted permission)
      if (newNotifs.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        // Don't re-notify for items we've already pushed this session
        const pushed = new Set(JSON.parse(sessionStorage.getItem('auramed_pushed') || '[]'));
        const fresh = newNotifs.filter((n) => !pushed.has(n.id));
        if (fresh.length > 0) {
          // Show one summary notification
          const srsCount = fresh.filter((n) => n.type === 'srs').length;
          const quizCount = fresh.filter((n) => n.type === 'new_quiz').length;
          let body = '';
          if (srsCount > 0) body += `${srsCount} kartu SRS perlu review. `;
          if (quizCount > 0) body += `${quizCount} kuis baru tersedia.`;
          showBrowserNotification('AuraMed PRO', body.trim());
          // Remember pushed IDs for this session
          fresh.forEach((n) => pushed.add(n.id));
          sessionStorage.setItem('auramed_pushed', JSON.stringify([...pushed]));
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [currentUser, srs, showBrowserNotification]);

  const markAllNotifRead = () => {
    localStorage.setItem('cbt_last_notif_check', new Date().toISOString());
    setNotifList([]);
    setNotifCount(0);
    setNotifOpen(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // refresh tiap 1 menit
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchNotifications]);

  return {
    notifOpen, notifList, notifCount, pushEnabled,
    setNotifOpen, setNotifList, setNotifCount, setPushEnabled,
    showBrowserNotification, requestPushPermission, fetchNotifications, markAllNotifRead
  };
}
