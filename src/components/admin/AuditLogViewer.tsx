"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AuditLogViewer() {
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");

  const { data: logs, isLoading, refetch } = trpc.admin.listAuditLogs.useQuery({
    entityType: entityType || undefined,
    userId: userId || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filter by entity type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Apply filters
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading audit logs…</p>
      ) : !logs?.length ? (
        <p className="text-sm text-slate-500">No audit entries match your filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">User</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Entity
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.user?.name ?? log.user?.email ?? log.userId ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">
                      {log.entityType}:{log.entityId}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
