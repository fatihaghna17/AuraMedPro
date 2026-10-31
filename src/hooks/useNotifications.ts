import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudflareApi } from '../services/cloudflareApi';
import { formatNotifTime } from '../utils/appHelpers';
import { NotificationItem } from '../components/NotificationDropdown';

export function useNotifications(
  currentUser: any,
  srs: any,
  triggerToast: (msg: string, icon?: string) => void,
  userAngkatan?: string,
  userProdi?: string
) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(
    () =>
      ('Notification' in window && Notification.permission === 'granted') ||
      localStorage.getItem('auramed_push') === 'dismissed'
  );

  const showBrowserNotification = useCallback((title: string, body: string, url?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, body, url: url || window.location.href },
        });
      } else {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'auramed-notif',
          renotify: true,
        } as NotificationOptions);
      }
    } catch {
      // Non-critical error
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
  }, [triggerToast]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const lastCheck = localStorage.getItem('cbt_last_notif_check');
      const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
      const newNotifs: NotificationItem[] = [];

      const username = (
        currentUser?.user_metadata?.username ||
        currentUser?.profile?.username ||
        currentUser?.username ||
        ''
      ).toLowerCase();
      const subStatus =
        currentUser?.user_metadata?.subscription_status ||
        currentUser?.profile?.subscription_status ||
        currentUser?.subscription_status;

      // 1. Notifikasi Khusus Lifetime Milestone (Jidan / 11.000 soal pertama)
      const isJidan = username === 'jidan';
      const isLifetime = isJidan || subStatus === 'lifetime';

      if (isLifetime) {
        newNotifs.push({
          id: 'lifetime-milestone-11000',
          type: 'lifetime',
          text: '🎉 Selamat! Karena sudah 11.000 soal pertama akunmu jadi LIFETIME!',
          time: 'Spesial',
        });
      }

      // 2. SRS: hitung kartu yang perlu direview
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

      // 3. Kuis baru sejak lastCheck dari Cloudflare D1
      try {
        const allBanks = await cloudflareApi.getQuestionBanks(userAngkatan, userProdi, { meta: true });
        const newBanks = (allBanks || [])
          .filter((b: any) => {
            if (!b.created_at) return false;
            return new Date(b.created_at) >= lastCheckDate;
          })
          .slice(0, 10);

        newBanks.forEach((b: any) => {
          newNotifs.push({
            id: `quiz-${b.name}-${b.created_at}`,
            type: 'new_quiz',
            text: `Kuis baru: ${b.name}`,
            time: formatNotifTime(b.created_at),
            bankName: b.name,
          });
        });
      } catch (bankErr) {
        // Fallback jika fetch question banks gagal
        console.warn('Gagal memuat bank soal untuk notifikasi:', bankErr);
      }

      setNotifList(newNotifs);

      // Hitung notif yang belum di-read
      const isLifetimeRead = localStorage.getItem('auramed_lifetime_notif_read') === 'true';
      const unreadCount = newNotifs.filter((n) => {
        if (n.type === 'lifetime' && isLifetimeRead) return false;
        return true;
      }).length;
      setNotifCount(unreadCount);

      // Push browser notification jika diizinkan
      if (newNotifs.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        const pushed = new Set(JSON.parse(sessionStorage.getItem('auramed_pushed') || '[]'));
        const fresh = newNotifs.filter((n) => !pushed.has(n.id));
        if (fresh.length > 0) {
          const lifetimeNotif = fresh.find((n) => n.type === 'lifetime');
          if (lifetimeNotif) {
            showBrowserNotification(
              'AuraMed PRO 👑',
              '🎉 Selamat! Karena sudah 11.000 soal pertama akunmu jadi LIFETIME!'
            );
          } else {
            const srsCount = fresh.filter((n) => n.type === 'srs').length;
            const quizCount = fresh.filter((n) => n.type === 'new_quiz').length;
            let body = '';
            if (srsCount > 0) body += `${srsCount} kartu SRS perlu review. `;
            if (quizCount > 0) body += `${quizCount} kuis baru tersedia.`;
            showBrowserNotification('AuraMed PRO', body.trim());
          }
          fresh.forEach((n) => pushed.add(n.id));
          sessionStorage.setItem('auramed_pushed', JSON.stringify([...pushed]));
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [currentUser, srs, showBrowserNotification, userAngkatan, userProdi]);

  const markAllNotifRead = () => {
    localStorage.setItem('cbt_last_notif_check', new Date().toISOString());
    localStorage.setItem('auramed_lifetime_notif_read', 'true');
    setNotifCount(0);
    setNotifOpen(false);
  };

  const fetchNotifRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotifRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifRef.current();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetchNotifRef.current();
    }, 180000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return {
    notifOpen,
    notifList,
    notifCount,
    pushEnabled,
    setNotifOpen,
    setNotifList,
    setNotifCount,
    setPushEnabled,
    showBrowserNotification,
    requestPushPermission,
    fetchNotifications,
    markAllNotifRead,
  };
}
