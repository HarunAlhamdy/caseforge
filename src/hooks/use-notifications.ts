"use client";

import { useCallback, useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(
    (title: string) => {
      setNotifications((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  return {
    notifications,
    unreadCount,
    markAllRead,
    addNotification,
  };
}
