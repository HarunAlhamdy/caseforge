"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import type { NotificationConfig } from "@/lib/types";

const EVENTS = [
  "weightChangeApplied",
  "weightChangeProposed",
  "stageTransition",
  "gateDecision",
] as const;

export function NotificationConfigEditor() {
  const { data, isLoading, refetch } = trpc.admin.getTenantSettings.useQuery();
  const update = trpc.admin.updateNotificationConfig.useMutation({
    onSuccess: () => void refetch(),
  });

  const [config, setConfig] = useState<NotificationConfig>({});

  useEffect(() => {
    if (data?.notifications) setConfig(data.notifications);
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading notification config…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-center">Email</th>
              <th className="px-4 py-3 text-center">In-App</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {EVENTS.map((event) => {
              const row = config[event] ?? { email: true, inApp: true };
              return (
                <tr key={event}>
                  <td className="px-4 py-3 font-medium">{event}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.email}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          [event]: { ...row, email: e.target.checked },
                        }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.inApp}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          [event]: { ...row, inApp: e.target.checked },
                        }))
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button
        onClick={() =>
          update.mutate(
            config as Record<string, { email: boolean; inApp: boolean }>,
          )
        }
        isLoading={update.isPending}
      >
        Save Notification Config
      </Button>
    </div>
  );
}
