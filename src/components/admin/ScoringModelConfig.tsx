"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { ScoringDriverSnapshot } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

function DriverSliders({
  title,
  drivers,
  onChange,
}: {
  title: string;
  drivers: ScoringDriverSnapshot[];
  onChange: (drivers: ScoringDriverSnapshot[]) => void;
}) {
  const sum = drivers.reduce((total, d) => total + d.weight, 0);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-slate-900">{title}</h4>
        <Badge variant={Math.abs(sum - 1) <= 0.02 ? "success" : "default"}>
          Sum: {sum.toFixed(2)}
        </Badge>
      </div>
      <div className="space-y-3">
        {drivers.map((driver) => (
          <div key={driver.driverId}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{driver.driverName}</span>
              <span>{Math.round(driver.weight * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(driver.weight * 100)}
              className="w-full"
              onChange={(e) => {
                const next = drivers.map((d) =>
                  d.driverId === driver.driverId
                    ? { ...d, weight: Number(e.target.value) / 100 }
                    : d,
                );
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoringModelConfig() {
  const { data, isLoading, refetch } = trpc.scoringModel.getModel.useQuery();
  const utils = trpc.useUtils();

  const applyVersion = trpc.scoringModel.applyVersion.useMutation({
    onSuccess: () => void refetch(),
  });
  const approveProposal = trpc.scoringModel.approveProposal.useMutation({
    onSuccess: () => void refetch(),
  });
  const rejectProposal = trpc.scoringModel.rejectProposal.useMutation({
    onSuccess: () => void refetch(),
  });

  const [valueDrivers, setValueDrivers] = useState<ScoringDriverSnapshot[]>([]);
  const [feasibilityDrivers, setFeasibilityDrivers] = useState<
    ScoringDriverSnapshot[]
  >([]);
  const [riskDrivers, setRiskDrivers] = useState<ScoringDriverSnapshot[]>([]);
  const [valueWeight, setValueWeight] = useState(0.5);
  const [feasibilityWeight, setFeasibilityWeight] = useState(0.5);
  const [changeReason, setChangeReason] = useState("");
  const [impactRows, setImpactRows] = useState<
    Awaited<ReturnType<typeof utils.scoringModel.previewImpact.fetch>> | null
  >(null);

  useEffect(() => {
    if (data?.model) {
      setValueDrivers(data.model.valueDrivers);
      setFeasibilityDrivers(data.model.feasibilityDrivers);
      setRiskDrivers(data.model.riskDrivers);
      setValueWeight(data.model.valueWeightInPriority);
      setFeasibilityWeight(data.model.feasibilityWeightInPriority);
    }
  }, [data]);

  const weights = useMemo(
    () => ({
      valueDrivers,
      feasibilityDrivers,
      riskDrivers,
      valueWeightInPriority: valueWeight,
      feasibilityWeightInPriority: feasibilityWeight,
    }),
    [
      valueDrivers,
      feasibilityDrivers,
      riskDrivers,
      valueWeight,
      feasibilityWeight,
    ],
  );

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading scoring model…</p>;
  }

  const activeVersion = data.activeVersion;

  return (
    <div className="space-y-6">
      {data.pendingProposal ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            Weight change proposed by {data.pendingProposal.proposedBy.name}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {data.pendingProposal.reason}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                approveProposal.mutate({ proposalId: data.pendingProposal!.id })
              }
              isLoading={approveProposal.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                rejectProposal.mutate({ proposalId: data.pendingProposal!.id })
              }
              isLoading={rejectProposal.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <strong>
          v{activeVersion?.versionNumber ?? 1} (
          {activeVersion?.status ?? "ACTIVE"})
        </strong>
        {activeVersion?.effectiveDate ? (
          <span className="ml-2 text-slate-600">
            active since {formatDate(activeVersion.effectiveDate)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DriverSliders
          title="Value drivers"
          drivers={valueDrivers}
          onChange={setValueDrivers}
        />
        <DriverSliders
          title="Feasibility drivers"
          drivers={feasibilityDrivers}
          onChange={setFeasibilityDrivers}
        />
        <DriverSliders
          title="Risk drivers"
          drivers={riskDrivers}
          onChange={setRiskDrivers}
        />
      </div>

      <div className="grid max-w-xl gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Value weight in priority ({Math.round(valueWeight * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(valueWeight * 100)}
            className="w-full"
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setValueWeight(v);
              setFeasibilityWeight(Math.round((1 - v) * 100) / 100);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Feasibility weight in priority (
            {Math.round(feasibilityWeight * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(feasibilityWeight * 100)}
            className="w-full"
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setFeasibilityWeight(v);
              setValueWeight(Math.round((1 - v) * 100) / 100);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            const rows = await utils.scoringModel.previewImpact.fetch({
              weights,
            });
            setImpactRows(rows);
          }}
        >
          Preview Impact
        </Button>
      </div>

      {impactRows?.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Use case</th>
                <th className="px-3 py-2 text-right">Current priority</th>
                <th className="px-3 py-2 text-right">Current rank</th>
                <th className="px-3 py-2 text-right">New priority</th>
                <th className="px-3 py-2 text-right">New rank</th>
                <th className="px-3 py-2 text-right">Δ rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {impactRows.map((row) => (
                <tr key={row.useCaseId}>
                  <td className="px-3 py-2">
                    {row.useCaseNumber} — {row.title}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.currentPriorityScore.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right">{row.currentRank}</td>
                  <td className="px-3 py-2 text-right">
                    {row.proposedPriorityScore.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right">{row.proposedRank}</td>
                  <td className="px-3 py-2 text-right">
                    {row.rankDelta > 0 ? `↑${row.rankDelta}` : row.rankDelta < 0 ? `↓${Math.abs(row.rankDelta)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <form
        className="flex max-w-xl flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          applyVersion.mutate({
            modelId: data.model.id,
            weights,
            changeReason,
          });
        }}
      >
        <Input
          label="Change reason"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          required
        />
        <Button type="submit" isLoading={applyVersion.isPending}>
          Apply New Weights
        </Button>
      </form>
    </div>
  );
}
