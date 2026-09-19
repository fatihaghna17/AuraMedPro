import { useState } from 'react';

export function useNotifications(currentUser: any, srs: any, triggerToast: (msg: string, icon?: string) => void, userAngkatan?: string, userProdi?: string) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(true); // Dummy true to hide prompt

  const showBrowserNotification = () => {};
  const requestPushPermission = async () => {};
  const fetchNotifications = async () => {};
  const markAllNotifRead = () => {
    setNotifOpen(false);
  };

  return {
    notifOpen, notifList, notifCount, pushEnabled,
    setNotifOpen, setNotifList, setNotifCount, setPushEnabled,
    showBrowserNotification, requestPushPermission, fetchNotifications, markAllNotifRead
  };
}
