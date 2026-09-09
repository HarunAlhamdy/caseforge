"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  SECURITY_ROLE_LABELS,
  SecurityRole,
} from "@/lib/constants/enums";

const ROLE_OPTIONS = Object.values(SecurityRole);

export function PlatformUsersAdmin() {
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<SecurityRole>(SecurityRole.VIEWER);

  const { data: users, isLoading, refetch } = trpc.admin.listAllUsers.useQuery({
    search: search || undefined,
    includeInactive,
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      setEditingId(null);
      void refetch();
    },
  });
  const setActive = trpc.admin.setUserActive.useMutation({
    onSuccess: () => void refetch(),
  });
  const verifyEmail = trpc.admin.verifyUserEmail.useMutation({
    onSuccess: () => void refetch(),
  });

  function startEdit(user: {
    id: string;
    name: string;
    email: string;
    role: SecurityRole;
  }) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading users…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Include inactive
        </label>
      </div>

      {!users?.length ? (
        <p className="text-sm text-slate-500">No users found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Tenant
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
              {users.map((user) => {
                const isEditing = editingId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            label="Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-slate-900">
                            {user.name}
                          </div>
                          <div className="text-slate-600">{user.email}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as SecurityRole)
                          }
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {SECURITY_ROLE_LABELS[role] ?? role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        SECURITY_ROLE_LABELS[
                          user.role as keyof typeof SECURITY_ROLE_LABELS
                        ] ?? user.role
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.tenant?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={user.isActive ? "success" : "default"}>
                          {user.isActive ? "Active" : "Disabled"}
                        </Badge>
                        <Badge
                          variant={user.emailVerifiedAt ? "success" : "warning"}
                        >
                          {user.emailVerifiedAt ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              isLoading={updateUser.isPending}
                              onClick={() =>
                                updateUser.mutate({
                                  userId: user.id,
                                  name: editName,
                                  email: editEmail,
                                  role: editRole,
                                })
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </Button>
                        )}
                        {!user.emailVerifiedAt ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={verifyEmail.isPending}
                            onClick={() =>
                              verifyEmail.mutate({ userId: user.id })
                            }
                          >
                            Verify
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={setActive.isPending}
                          onClick={() =>
                            setActive.mutate({
                              userId: user.id,
                              isActive: !user.isActive,
                            })
                          }
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
