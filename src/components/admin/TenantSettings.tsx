"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TenantBrand } from "@/components/layout/TenantBrand";

export function TenantSettings() {
  const { data, isLoading, refetch } = trpc.admin.getTenantSettings.useQuery();
  const update = trpc.admin.updateTenantSettings.useMutation({
    onSuccess: () => void refetch(),
  });

  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
    fontFamily: "Inter, system-ui, sans-serif",
    terminologyJson: "{}",
  });

  useEffect(() => {
    if (data) {
      setForm({
        logoUrl: data.logoUrl ?? "",
        primaryColor: data.primaryColor ?? "#0f766e",
        accentColor: data.accentColor ?? "#14b8a6",
        fontFamily: data.fontFamily ?? "Inter, system-ui, sans-serif",
        terminologyJson: JSON.stringify(data.terminologyOverrides ?? {}, null, 2),
      });
    }
  }, [data]);

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading tenant settings…</p>;
  }

  const previewTheme = {
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    logoUrl: form.logoUrl || null,
    fontFamily: form.fontFamily,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          let terminologyOverrides = {};
          try {
            terminologyOverrides = JSON.parse(form.terminologyJson);
          } catch {
            return;
          }
          update.mutate({
            logoUrl: form.logoUrl || null,
            primaryColor: form.primaryColor,
            accentColor: form.accentColor,
            fontFamily: form.fontFamily,
            terminologyOverrides,
          });
        }}
      >
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
        <Input
          label="Font family"
          value={form.fontFamily}
          onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value }))}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Terminology overrides (JSON)
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
            value={form.terminologyJson}
            onChange={(e) => setForm((f) => ({ ...f, terminologyJson: e.target.value }))}
          />
        </div>
        <Button type="submit" isLoading={update.isPending}>
          Save Tenant Settings
        </Button>
      </form>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Live preview</h3>
        <TenantBrand theme={previewTheme}>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {previewTheme.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewTheme.logoUrl}
                alt="Logo preview"
                className="mb-3 h-10 object-contain"
              />
            ) : null}
            <p className="text-brand-primary text-lg font-semibold">
              {data.name}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Sample branded content using tenant colors and font.
            </p>
            <Button className="mt-4" size="sm">
              Primary action
            </Button>
          </div>
        </TenantBrand>
      </div>
    </div>
  );
}
