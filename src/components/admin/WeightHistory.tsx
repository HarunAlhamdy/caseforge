"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { formatDate } from "@/lib/utils/format";

export function WeightHistory() {
  const { data: modelData } = trpc.scoringModel.getModel.useQuery();
  const modelId = modelData?.model.id;

  const { data: versions, isLoading } = trpc.scoringModel.listVersions.useQuery(
    { modelId: modelId ?? "" },
    { enabled: Boolean(modelId) },
  );

  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  const compare = trpc.scoringModel.compareVersions.useQuery(
    { versionIdA: compareA, versionIdB: compareB },
    { enabled: Boolean(compareA && compareB) },
  );

  const snapshotsA = trpc.scoringModel.getVersionSnapshots.useQuery(
    { versionId: compareA },
    { enabled: Boolean(compareA) },
  );

  if (isLoading || !versions) {
    return <p className="text-sm text-slate-500">Loading weight history…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Version</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Effective</th>
              <th className="px-4 py-3 text-left">Summary</th>
              <th className="px-4 py-3 text-left">Snapshots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {versions.map((version) => (
              <tr key={version.id}>
                <td className="px-4 py-3 font-medium">v{version.versionNumber}</td>
                <td className="px-4 py-3">{version.status}</td>
                <td className="px-4 py-3">
                  {version.effectiveDate
                    ? formatDate(version.effectiveDate)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {version.changeSummary ?? version.changeReason ?? "—"}
                </td>
                <td className="px-4 py-3">{version._count.snapshots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-3 font-medium text-slate-900">Compare versions</h3>
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={compareA}
            onChange={(e) => setCompareA(e.target.value)}
          >
            <option value="">Version A…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({v.status})
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={compareB}
            onChange={(e) => setCompareB(e.target.value)}
          >
            <option value="">Version B…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({v.status})
              </option>
            ))}
          </select>
        </div>

        {compare.data?.comparisons.length ? (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Use case</th>
                <th className="px-3 py-2 text-right">Rank A</th>
                <th className="px-3 py-2 text-right">Rank B</th>
                <th className="px-3 py-2 text-right">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {compare.data.comparisons.map((row) => (
                <tr key={row.useCaseId}>
                  <td className="px-3 py-2">
                    {row.useCaseNumber} — {row.title}
                  </td>
                  <td className="px-3 py-2 text-right">{row.rankA}</td>
                  <td className="px-3 py-2 text-right">{row.rankB ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{row.rankDelta ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : compareA && compareB ? (
          <p className="text-sm text-slate-500">No snapshot comparisons available.</p>
        ) : null}

        {snapshotsA.data?.length ? (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-slate-800">
              Portfolio snapshot (Version A)
            </h4>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Use case</th>
                  <th className="px-3 py-2 text-right">Priority</th>
                  <th className="px-3 py-2 text-right">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {snapshotsA.data.map((snap) => (
                  <tr key={snap.id}>
                    <td className="px-3 py-2">
                      {snap.useCase.useCaseNumber} — {snap.useCase.title}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {snap.priorityScore.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right">{snap.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
