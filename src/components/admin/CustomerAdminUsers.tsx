"use client";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SECURITY_ROLE_LABELS } from "@/lib/constants/enums";
import { SecurityRole } from "@/lib/constants/enums";

export function CustomerAdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();

  const deactivate = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading users…</p>;
  }

  if (!users?.length) {
    return (
      <p className="text-sm text-slate-500">
        No users in this tenant. Invite users from the admin panel (Prompt 4).
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Role</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
            <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                {SECURITY_ROLE_LABELS[user.role as keyof typeof SECURITY_ROLE_LABELS] ??
                  user.role}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.isActive ? "success" : "default"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {user.isActive &&
                user.role !== SecurityRole.PLATFORM_SUPER_ADMIN ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate({ userId: user.id })}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
