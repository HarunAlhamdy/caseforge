"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import type { HardGateTemplate } from "@/lib/types";

export function HardGateConfigEditor() {
  const { data, isLoading, refetch } = trpc.admin.getTenantSettings.useQuery();
  const update = trpc.admin.updateHardGateConfig.useMutation({
    onSuccess: () => void refetch(),
  });

  const [gates, setGates] = useState<HardGateTemplate[]>([]);

  useEffect(() => {
    if (data?.hardGates) setGates(data.hardGates);
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading hard gate config…</p>;
  }

  return (
    <div className="space-y-4">
      {gates.map((gate, index) => (
        <div
          key={gate.gateCode}
          className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-4"
        >
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={gate.gateName}
            onChange={(e) => {
              const next = [...gates];
              next[index] = { ...gate, gateName: e.target.value };
              setGates(next);
            }}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            value={gate.conditionText}
            onChange={(e) => {
              const next = [...gates];
              next[index] = { ...gate, conditionText: e.target.value };
              setGates(next);
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gate.isActive !== false}
              onChange={(e) => {
                const next = [...gates];
                next[index] = { ...gate, isActive: e.target.checked };
                setGates(next);
              }}
            />
            Active
          </label>
        </div>
      ))}
      <Button onClick={() => update.mutate(gates)} isLoading={update.isPending}>
        Save Hard Gate Config
      </Button>
    </div>
  );
}
