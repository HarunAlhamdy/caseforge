"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TenantType } from "@/lib/constants/enums";

export function TenantProvisioning() {
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [type, setType] = useState<"SELF_SERVE" | "PARTNER_MANAGED">("SELF_SERVE");
  const [result, setResult] = useState<{ tempPassword?: string; tenantName?: string } | null>(
    null,
  );

  const { data: partners } = trpc.admin.listPartners.useQuery({ includeInactive: false });
  const { data: tenants, refetch } = trpc.admin.listTenants.useQuery();

  const createTenant = trpc.admin.createTenant.useMutation({
    onSuccess: (data) => {
      setResult({ tempPassword: data.tempPassword, tenantName: data.tenant.name });
      setName("");
      setAdminName("");
      setAdminEmail("");
      setPartnerId("");
      void refetch();
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createTenant.mutate({
            name,
            adminName,
            adminEmail,
            type: type === "SELF_SERVE" ? TenantType.SELF_SERVE : TenantType.PARTNER_MANAGED,
            partnerId: type === "PARTNER_MANAGED" ? partnerId : undefined,
          });
        }}
      >
        <Input label="Tenant name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Tenant type</label>
          <select
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="SELF_SERVE">Self-serve</option>
            <option value="PARTNER_MANAGED">Partner-managed</option>
          </select>
        </div>
        {type === "PARTNER_MANAGED" ? (
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Partner</label>
            <select
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
            >
              <option value="">Select partner…</option>
              {partners?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <Input
          label="Admin name"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          required
        />
        <Input
          label="Admin email"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          required
        />
        <div className="md:col-span-2">
          <Button type="submit" isLoading={createTenant.isPending}>
            Provision Tenant
          </Button>
        </div>
      </form>

      {result?.tempPassword ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Tenant <strong>{result.tenantName}</strong> created. Temporary admin password:{" "}
          <code className="rounded bg-white px-1">{result.tempPassword}</code>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Tenant</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Partner</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Users</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Use Cases</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {tenants?.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{tenant.name}</td>
                <td className="px-4 py-3">{tenant.type}</td>
                <td className="px-4 py-3">{tenant.partner?.name ?? "—"}</td>
                <td className="px-4 py-3">{tenant._count.users}</td>
                <td className="px-4 py-3">{tenant._count.useCases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
