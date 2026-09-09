"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PortfolioTable() {
  const [versionId, setVersionId] = useState<string>("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  const { data: versions } = trpc.scoring.listVersions.useQuery();
  const { data: portfolio, refetch } = trpc.scoring.getPortfolio.useQuery(
    versionId ? { versionId } : undefined,
  );
  const { data: comparisons } = trpc.scoring.compareVersionRankings.useQuery(
    { versionIdA: compareA, versionIdB: compareB },
    { enabled: showCompare && Boolean(compareA && compareB) },
  );
  const exportExcel = trpc.scoring.exportPortfolioExcel.useMutation({
    onSuccess: (result) => {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`;
      link.download = result.fileName;
      link.click();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">Version</label>
          <select
            className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          >
            <option value="">Current rankings</option>
            {versions?.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({v.status})
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="secondary"
          onClick={() => exportExcel.mutate(versionId ? { versionId } : undefined)}
          disabled={exportExcel.isPending}
        >
          Export Excel
        </Button>
        <Button variant="secondary" onClick={() => setShowCompare(!showCompare)}>
          Compare Versions
        </Button>
        <Button variant="secondary" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {showCompare ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap gap-3">
            <select
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            >
              <option value="">Version A</option>
              {versions?.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            >
              <option value="">Version B</option>
              {versions?.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber}
                </option>
              ))}
            </select>
          </div>
          {comparisons?.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-2">Use case</th>
                  <th className="p-2">Rank A</th>
                  <th className="p-2">Rank B</th>
                  <th className="p-2">Δ</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr key={row.useCaseId} className="border-t border-slate-200">
                    <td className="p-2">{row.title}</td>
                    <td className="p-2">{row.rankA}</td>
                    <td className="p-2">{row.rankB ?? "—"}</td>
                    <td className="p-2">{row.rankDelta ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Rank",
                "Title",
                "Directorate",
                "Value",
                "Feasibility",
                "Risk",
                "Tier",
                "Priority",
                "Wave",
                "Readiness",
              ].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {portfolio?.items.map((row) => (
              <tr key={row.useCaseId}>
                <td className="px-3 py-2 font-medium">{row.rank ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/scoring/${row.useCaseId}`}
                      className="text-brand-primary hover:underline"
                    >
                      {row.title}
                    </Link>
                    <span className="text-xs text-slate-500">
                      <Link
                        href={`/architecture/${row.useCaseId}`}
                        className="hover:underline"
                      >
                        Architecture
                      </Link>
                      {" · "}
                      <Link
                        href={`/evaluation/${row.useCaseId}`}
                        className="hover:underline"
                      >
                        Evaluation
                      </Link>
                      {" · "}
                      <Link
                        href={`/delivery/pilot/${row.useCaseId}`}
                        className="hover:underline"
                      >
                        Pilot
                      </Link>
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">{row.businessUnit}</td>
                <td className="px-3 py-2">{row.valueScore?.toFixed(2) ?? "—"}</td>
                <td className="px-3 py-2">{row.feasibilityScore?.toFixed(2) ?? "—"}</td>
                <td className="px-3 py-2">{row.riskScore?.toFixed(2) ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.riskTier ? <Badge>{row.riskTier}</Badge> : "—"}
                </td>
                <td className="px-3 py-2">{row.priorityScore?.toFixed(3) ?? "—"}</td>
                <td className="px-3 py-2">{row.wave ?? "—"}</td>
                <td className="px-3 py-2">{row.dataReadinessFlag ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
