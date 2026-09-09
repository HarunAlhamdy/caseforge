"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SECURITY_ROLE_LABELS } from "@/lib/constants/enums";
import { SecurityRole } from "@/lib/constants/enums";

const INVITE_ROLES = [
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.EVALUATOR,
  SecurityRole.SUBMITTER,
  SecurityRole.DATA_SECURITY_REVIEWER,
  SecurityRole.EXECUTIVE_SPONSOR,
  SecurityRole.VIEWER,
] as const;

export function CustomerAdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SecurityRole>(SecurityRole.SUBMITTER);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const deactivate = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => void refetch(),
  });
  const reactivate = trpc.admin.reactivateUser.useMutation({
    onSuccess: () => void refetch(),
  });
  const invite = trpc.admin.inviteUser.useMutation({
    onSuccess: (data) => {
      setInviteResult(
        `Invited ${data.user.email}. Temporary password: ${data.tempPassword}`,
      );
      setInviteError(null);
      setName("");
      setEmail("");
      void refetch();
    },
    onError: (err) => {
      setInviteError(err.message);
      setInviteResult(null);
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading users…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Invite user</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <select
              className="block w-full rounded-lg border border-slate-300 px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as SecurityRole)}
            >
              {INVITE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {SECURITY_ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </label>
        </div>
        {inviteError ? (
          <p className="mt-2 text-sm text-red-600">{inviteError}</p>
        ) : null}
        {inviteResult ? (
          <p className="mt-2 text-sm text-emerald-700">{inviteResult}</p>
        ) : null}
        <Button
          className="mt-3"
          isLoading={invite.isPending}
          disabled={!name.trim() || !email.trim()}
          onClick={() =>
            invite.mutate({ name: name.trim(), email: email.trim(), role })
          }
        >
          Invite user
        </Button>
      </div>

      {!users?.length ? (
        <p className="text-sm text-slate-500">No users in this tenant yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {SECURITY_ROLE_LABELS[
                      user.role as keyof typeof SECURITY_ROLE_LABELS
                    ] ?? user.role}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={user.isActive ? "success" : "default"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant={user.emailVerifiedAt ? "success" : "warning"}
                      >
                        {user.emailVerifiedAt ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== SecurityRole.PLATFORM_SUPER_ADMIN ? (
                      user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deactivate.isPending}
                          onClick={() =>
                            deactivate.mutate({ userId: user.id })
                          }
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={reactivate.isPending}
                          onClick={() =>
                            reactivate.mutate({ userId: user.id })
                          }
                        >
                          Reactivate
                        </Button>
                      )
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
