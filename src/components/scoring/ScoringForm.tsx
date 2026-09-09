"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ScoringDriverSnapshot } from "@/lib/types";

interface ScoringFormProps {
  useCaseId: string;
}

function tierVariant(tierCode?: string | null): "success" | "warning" | "danger" | "info" {
  if (!tierCode) return "info";
  if (tierCode.includes("R1")) return "success";
  if (tierCode.includes("R2")) return "info";
  if (tierCode.includes("R3")) return "warning";
  return "danger";
}

function DriverPanel({
  title,
  drivers,
  scores,
  evidencePrefills,
  onChange,
}: {
  title: string;
  drivers: ScoringDriverSnapshot[];
  scores: Record<string, { score: number; evidenceNotes: string | null }>;
  evidencePrefills: Record<string, string>;
  onChange: (driverId: string, score: number, evidence: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="space-y-4">
        {drivers.map((driver) => {
          const current = scores[driver.driverId];
          return (
            <div key={driver.driverId} className="grid gap-2 md:grid-cols-12 md:items-start">
              <div className="md:col-span-4">
                <p className="text-sm font-medium text-slate-900">{driver.driverName}</p>
                <p className="text-xs text-slate-500">Weight {(driver.weight * 100).toFixed(0)}%</p>
              </div>
              <div className="md:col-span-2">
                <select
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={current?.score ?? ""}
                  onChange={(e) =>
                    onChange(
                      driver.driverId,
                      Number(e.target.value),
                      current?.evidenceNotes ?? evidencePrefills[driver.driverName] ?? "",
                    )
                  }
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-6">
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  rows={2}
                  placeholder="Evidence"
                  defaultValue={
                    current?.evidenceNotes ??
                    evidencePrefills[driver.driverName] ??
                    ""
                  }
                  onBlur={(e) =>
                    onChange(driver.driverId, current?.score ?? 0, e.target.value)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScoringForm({ useCaseId }: ScoringFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.scoring.getForUseCase.useQuery({ useCaseId });
  const saveScores = trpc.scoring.saveDriverScores.useMutation({
    onSuccess: () => void utils.scoring.getForUseCase.invalidate({ useCaseId }),
  });
  const completeScoring = trpc.scoring.completeScoring.useMutation({
    onSuccess: () => router.push(`/evaluation/${useCaseId}`),
  });

  const [localScores, setLocalScores] = useState<
    Record<string, { score: number; evidenceNotes: string }>
  >({});

  useEffect(() => {
    if (!data?.driverScores) return;
    const next: Record<string, { score: number; evidenceNotes: string }> = {};
    for (const [id, val] of Object.entries(data.driverScores)) {
      next[id] = {
        score: val.score,
        evidenceNotes: val.evidenceNotes ?? "",
      };
    }
    setLocalScores(next);
  }, [data?.driverScores]);

  const allDrivers = useMemo(() => {
    if (!data) return [];
    return [
      ...data.drivers.value,
      ...data.drivers.feasibility,
      ...data.drivers.risk,
    ];
  }, [data]);

  const allScored = allDrivers.every(
    (d) => localScores[d.driverId]?.score >= 1 && localScores[d.driverId]?.score <= 5,
  );

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading scoring…</p>;
  }

  const handleChange = (driverId: string, score: number, evidence: string) => {
    setLocalScores((prev) => ({
      ...prev,
      [driverId]: { score, evidenceNotes: evidence },
    }));
  };

  const handleSave = async () => {
    const scores = Object.entries(localScores)
      .filter(([, v]) => v.score >= 1 && v.score <= 5)
      .map(([driverId, v]) => ({
        driverId,
        score: v.score,
        evidenceNotes: v.evidenceNotes,
      }));
    await saveScores.mutateAsync({ useCaseId, scores });
  };

  const handleComplete = async () => {
    try {
      await handleSave();
      await completeScoring.mutateAsync({ useCaseId });
    } catch {
      // mutation errors surface via react-query state
    }
  };

  const computed = data.computed;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="info">Scoring under weight model {data.versionLabel}</Badge>
        {computed?.riskTier ? (
          <Badge variant={tierVariant(computed.riskTier)}>{computed.riskTier}</Badge>
        ) : null}
        <Badge variant="default">Readiness: {data.dataReadiness}</Badge>
      </div>

      {computed ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Value", computed.valueScore],
            ["Feasibility", computed.feasibilityScore],
            ["Risk", computed.riskScore],
            ["Priority", computed.priorityScore],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs uppercase text-slate-500">{label}</p>
              <p className="text-xl font-semibold text-slate-900">{val as number}</p>
            </div>
          ))}
        </div>
      ) : null}

      <DriverPanel
        title="Value"
        drivers={data.drivers.value}
        scores={localScores}
        evidencePrefills={data.evidencePrefills}
        onChange={handleChange}
      />
      <DriverPanel
        title="Feasibility"
        drivers={data.drivers.feasibility}
        scores={localScores}
        evidencePrefills={data.evidencePrefills}
        onChange={handleChange}
      />
      <DriverPanel
        title="Risk"
        drivers={data.drivers.risk}
        scores={localScores}
        evidencePrefills={data.evidencePrefills}
        onChange={handleChange}
      />

      {(saveScores.error || completeScoring.error) && (
        <p className="text-sm text-red-600">
          {(saveScores.error ?? completeScoring.error)?.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void handleSave()} disabled={saveScores.isPending}>
          Save scores
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleComplete()}
          disabled={!allScored || completeScoring.isPending || saveScores.isPending}
        >
          Complete Scoring → Deep Feasibility
        </Button>
      </div>
    </div>
  );
}
