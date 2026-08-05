"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { trpc } from "@/trpc/react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, refetch } = trpc.notification.list.useQuery({ limit: 20 });
  const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => refetch() });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5">
            <Badge variant="danger">{unreadCount}</Badge>
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs text-brand-primary hover:underline"
                onClick={() => markAllRead.mutate()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`border-b px-4 py-3 text-sm ${n.isRead ? "bg-white" : "bg-teal-50"}`}
                >
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="font-medium text-slate-900 hover:text-brand-primary"
                      onClick={() => {
                        if (!n.isRead) markRead.mutate({ id: n.id });
                        setOpen(false);
                      }}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-medium text-slate-900">{n.title}</p>
                  )}
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
