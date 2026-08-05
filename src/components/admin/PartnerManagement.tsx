"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function PartnerManagement() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const { data: partners, isLoading, refetch } = trpc.admin.listPartners.useQuery({
    includeInactive: true,
  });

  const createPartner = trpc.admin.createPartner.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setName("");
      setContactEmail("");
      void refetch();
    },
  });

  const setActive = trpc.admin.setPartnerActive.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading partners…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Create Partner"}
        </Button>
      </div>

      {showForm ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            createPartner.mutate({
              name,
              contactEmail: contactEmail || undefined,
            });
          }}
        >
          <Input label="Partner name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Contact email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" isLoading={createPartner.isPending}>
              Save Partner
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Partner</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Tenants</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Users</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {partners?.map((partner) => (
              <tr key={partner.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{partner.name}</td>
                <td className="px-4 py-3 text-slate-600">{partner.contactEmail ?? "—"}</td>
                <td className="px-4 py-3">{partner._count.tenants}</td>
                <td className="px-4 py-3">{partner._count.partnerUsers}</td>
                <td className="px-4 py-3">
                  <Badge variant={partner.isActive ? "success" : "default"}>
                    {partner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={setActive.isPending}
                    onClick={() =>
                      setActive.mutate({
                        partnerId: partner.id,
                        isActive: !partner.isActive,
                      })
                    }
                  >
                    {partner.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
