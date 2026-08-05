"use client";

import { useMemo } from "react";
import * as XLSX from "xlsx";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/format";

export function GateReportView() {
  const { data, isLoading } = trpc.usecase.getGatedOutReport.useQuery();

  const groups = useMemo(() => data?.grouped ?? {}, [data]);

  function exportExcel() {
    const rows = (data?.items ?? []).map((item) => ({
      "UC #": item.useCaseNumber,
      Title: item.title,
      "Business Unit": item.businessUnit,
      "Gate Code": item.gateDecision,
      Rationale: item.gateRationale ?? "",
      "Decided At": item.gateDecidedAt ? formatDate(item.gateDecidedAt) : "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Gated Out");
    XLSX.writeFile(book, "gate-report.xlsx");
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading gate report…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={exportExcel}>
          Export Excel
        </Button>
      </div>

      {Object.entries(groups).map(([gateCode, items]) => (
        <section key={gateCode} className="rounded-xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-semibold text-slate-900">
            {gateCode.replace(/_/g, " ")} ({items.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-4">
                <p className="font-medium text-slate-900">
                  {item.useCaseNumber} — {item.title}
                </p>
                <p className="text-sm text-slate-600">{item.businessUnit}</p>
                <p className="mt-2 text-sm text-slate-700">{item.gateRationale}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {Object.keys(groups).length === 0 ? (
        <p className="text-sm text-slate-500">No gated-out cases.</p>
      ) : null}
    </div>
  );
}
