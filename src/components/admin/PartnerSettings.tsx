"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PartnerSettings() {
  const { data, isLoading, refetch } = trpc.partner.getPartnerSettings.useQuery();
  const update = trpc.partner.updatePartnerSettings.useMutation({
    onSuccess: () => void refetch(),
  });

  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    logoUrl: "",
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        contactEmail: data.contactEmail ?? "",
        logoUrl: data.logoUrl ?? "",
        primaryColor: data.primaryColor ?? "#0f766e",
        accentColor: data.accentColor ?? "#14b8a6",
      });
    }
  }, [data]);

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading partner settings…</p>;
  }

  return (
    <form
      className="grid max-w-2xl gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({
          name: form.name,
          contactEmail: form.contactEmail || null,
          logoUrl: form.logoUrl || null,
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
        });
      }}
    >
      <Input
        label="Partner name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Contact email"
        type="email"
        value={form.contactEmail}
        onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
      />
      <Input
        label="Logo URL"
        value={form.logoUrl}
        onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Primary color"
          type="color"
          value={form.primaryColor}
          onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
        />
        <Input
          label="Accent color"
          type="color"
          value={form.accentColor}
          onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
        />
      </div>
      <Button type="submit" isLoading={update.isPending}>
        Save Partner Settings
      </Button>
    </form>
  );
}
