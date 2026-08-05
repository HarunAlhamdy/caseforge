"use client";

import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/Badge";

export function PlatformPartnersList() {
  const { data: partners, isLoading } = trpc.admin.listPartners.useQuery();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading partners…</p>;
  }

  if (!partners?.length) {
    return (
      <p className="text-sm text-slate-500">
        No active partners. Partner provisioning arrives in Prompt 4.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Partner</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Contact</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Tenants</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Users</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {partners.map((partner) => (
            <tr key={partner.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                {partner.name}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {partner.contactEmail ?? "—"}
              </td>
              <td className="px-4 py-3">{partner._count.tenants}</td>
              <td className="px-4 py-3">{partner._count.partnerUsers}</td>
              <td className="px-4 py-3">
                <Badge variant={partner.isActive ? "success" : "default"}>
                  {partner.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
