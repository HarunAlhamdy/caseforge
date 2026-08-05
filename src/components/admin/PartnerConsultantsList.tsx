"use client";

import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/Badge";
import { PARTNER_ROLE_OPTIONS, SECURITY_ROLE_LABELS } from "@/lib/constants/enums";

export function PartnerConsultantsList() {
  const { data: consultants, isLoading } =
    trpc.partner.listConsultants.useQuery();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading consultants…</p>;
  }

  if (!consultants?.length) {
    return (
      <p className="text-sm text-slate-500">
        No partner consultants found for this organization.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {consultants.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-slate-900">{entry.user.name}</h3>
              <p className="text-sm text-slate-600">{entry.user.email}</p>
            </div>
            <Badge variant={entry.user.isActive ? "success" : "default"}>
              {PARTNER_ROLE_OPTIONS.find((o) => o.value === entry.partnerRole)
                ?.label ?? entry.partnerRole}
            </Badge>
          </div>
          {entry.customerAssignments.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {entry.customerAssignments.map((a) => (
                <li key={a.id}>
                  {a.tenant.name} —{" "}
                  {SECURITY_ROLE_LABELS[
                    a.roleInTenant as keyof typeof SECURITY_ROLE_LABELS
                  ] ?? a.roleInTenant}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No customer assignments</p>
          )}
        </div>
      ))}
    </div>
  );
}
