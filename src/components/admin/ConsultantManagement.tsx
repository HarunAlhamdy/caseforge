"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PARTNER_ROLE_OPTIONS } from "@/lib/constants/enums";

export function ConsultantManagement() {
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: consultants, isLoading, refetch } =
    trpc.partner.listConsultants.useQuery();

  const invite = trpc.partner.inviteConsultant.useMutation({
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      setShowInvite(false);
      setName("");
      setEmail("");
      void refetch();
    },
  });

  const deactivate = trpc.partner.deactivateConsultant.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading consultants…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowInvite((v) => !v)}>
          {showInvite ? "Cancel" : "Invite Consultant"}
        </Button>
      </div>

      {showInvite ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate({ name, email });
          }}
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" isLoading={invite.isPending}>
              Send Invite
            </Button>
          </div>
        </form>
      ) : null}

      {tempPassword ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Temporary password: <code>{tempPassword}</code>
        </div>
      ) : null}

      <div className="space-y-3">
        {consultants?.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-slate-900">{entry.user.name}</h3>
                <p className="text-sm text-slate-600">{entry.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={entry.user.isActive ? "success" : "default"}>
                  {PARTNER_ROLE_OPTIONS.find((o) => o.value === entry.partnerRole)
                    ?.label ?? entry.partnerRole}
                </Badge>
                {entry.user.isActive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate({ partnerUserId: entry.id })}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
