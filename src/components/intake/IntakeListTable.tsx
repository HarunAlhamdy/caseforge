"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import { getStageLabel } from "@/lib/workflow/stage-transitions";
import type { LifecycleStage } from "@/lib/types";

export function IntakeListTable() {
  const [stage, setStage] = useState<string>("");
  const [businessUnit, setBusinessUnit] = useState("");
  const { data, isLoading } = trpc.usecase.list.useQuery({
    stage: stage ? (stage as LifecycleStage) : undefined,
    businessUnit: businessUnit || undefined,
  });

  const businessUnits = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((item) => item.businessUnit))).sort();
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading intakes…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Stage</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">All stages</option>
            <option value="INTAKE_DRAFT">Intake Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="INFO_REQUEST">Info Request</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Business unit</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
          >
            <option value="">All units</option>
            {businessUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <Link href="/intake/new">
          <Button>New Use Case</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">UC #</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Business unit</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Complete</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/intake/${item.id}`} className="font-medium text-brand-primary hover:underline">
                    {item.useCaseNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.businessUnit}</td>
                <td className="px-4 py-3">
                  <Badge variant="info">{getStageLabel(item.currentStage)}</Badge>
                </td>
                <td className="px-4 py-3">{formatDate(item.dateSubmitted)}</td>
                <td className="px-4 py-3">{item.completionPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No use cases found.</p>
        ) : null}
      </div>
    </div>
  );
}
