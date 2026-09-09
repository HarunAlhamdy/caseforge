"use client";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function WavePlanningBoard() {
  const { data, refetch } = trpc.workflow.getWavePlan.useQuery();
  const assign = trpc.workflow.assignWave.useMutation({
    onSuccess: () => void refetch(),
  });
  const confirm = trpc.workflow.confirmWavePlan.useMutation({
    onSuccess: () => void refetch(),
  });

  if (!data) return <p className="text-sm text-slate-500">Loading wave plan…</p>;

  const columns: Array<{ key: number | "unassigned"; label: string }> = [
    { key: "unassigned", label: "Unassigned" },
    { key: 1, label: "Wave 1" },
    { key: 2, label: "Wave 2" },
    { key: 3, label: "Wave 3" },
    { key: 4, label: "Wave 4" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>
          Confirm Wave Plan
        </Button>
        <Button variant="secondary" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {columns.map((col) => {
          const items =
            col.key === "unassigned"
              ? data.waves.unassigned
              : data.waves[col.key as 1 | 2 | 3 | 4];
          return (
            <div key={String(col.key)} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-2 text-sm font-semibold">
                {col.label}
                <span className="ml-1 text-slate-400">({items.length})</span>
              </h3>
              <div className="space-y-2">
                {items.map((uc) => (
                  <div key={uc.id} className="rounded border border-slate-200 bg-white p-2 text-sm">
                    <p className="font-medium">
                      <a
                        href={`/usecase/${uc.id}`}
                        className="text-brand-primary hover:underline"
                      >
                        {uc.title}
                      </a>
                    </p>
                    <p className="text-xs text-slate-500">P: {uc.priorityScore?.toFixed(2)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {uc.costBand ? <Badge>{uc.costBand}</Badge> : null}
                      {uc.riskTier ? <Badge variant="warning">{uc.riskTier}</Badge> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <a
                        href={`/delivery/pilot/${uc.id}`}
                        className="text-brand-primary hover:underline"
                      >
                        Pilot
                      </a>
                      <a
                        href={`/delivery/scaleup/${uc.id}`}
                        className="text-brand-primary hover:underline"
                      >
                        Scale-up
                      </a>
                    </div>
                    <select
                      className="mt-2 w-full rounded border border-slate-300 text-xs"
                      value={uc.wave ?? 0}
                      onChange={(e) =>
                        assign.mutate({
                          useCaseId: uc.id,
                          wave: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Unassigned</option>
                      {[1, 2, 3, 4].map((w) => (
                        <option key={w} value={w}>
                          Wave {w}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
