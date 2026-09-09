"use client";

import { trpc } from "@/trpc/react";
import { SECURITY_ROLE_LABELS } from "@/lib/constants/enums";
import { SecurityRole } from "@/lib/constants/enums";

const ASSIGNABLE_ROLES = [
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.EVALUATOR,
  SecurityRole.DATA_SECURITY_REVIEWER,
  SecurityRole.VIEWER,
] as const;

type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function CustomerAssignmentMatrix() {
  const { data: consultants, isLoading: loadingConsultants } =
    trpc.partner.listConsultants.useQuery();
  const { data: tenants, isLoading: loadingTenants } =
    trpc.partner.listTenants.useQuery();
  const { data: assignments, refetch } = trpc.partner.listAssignments.useQuery();

  const assign = trpc.partner.assignConsultant.useMutation({
    onSuccess: () => void refetch(),
  });

  if (loadingConsultants || loadingTenants) {
    return <p className="text-sm text-slate-500">Loading assignment matrix…</p>;
  }

  const consultantsOnly =
    consultants?.filter((c) => c.partnerRole === "PARTNER_CONSULTANT") ?? [];

  function currentRole(partnerUserId: string, tenantId: string) {
    return assignments?.find(
      (a) => a.partnerUserId === partnerUserId && a.tenantId === tenantId,
    )?.roleInTenant;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">
              Consultant
            </th>
            {tenants?.map((tenant) => (
              <th
                key={tenant.id}
                className="px-4 py-3 text-left font-medium text-slate-700"
              >
                {tenant.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {consultantsOnly.map((consultant) => (
            <tr key={consultant.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                {consultant.user.name}
              </td>
              {tenants?.map((tenant) => {
                const role = currentRole(consultant.id, tenant.id);
                return (
                  <td key={tenant.id} className="px-4 py-3">
                    <select
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      value={role ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        assign.mutate({
                          partnerUserId: consultant.id,
                          tenantId: tenant.id,
                          roleInTenant: e.target.value as AssignableRole,
                        });
                      }}
                    >
                      <option value="">—</option>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {SECURITY_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!consultantsOnly.length || !tenants?.length ? (
        <p className="p-4 text-sm text-slate-500">
          Add consultants and customer tenants to manage assignments.
        </p>
      ) : null}
    </div>
  );
}
