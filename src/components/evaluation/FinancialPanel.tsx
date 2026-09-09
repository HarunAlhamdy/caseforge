"use client";

import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";

export function FinancialPanel({ useCaseId }: { useCaseId: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.financial.get.useQuery({ useCaseId });
  const save = trpc.financial.save.useMutation({
    onSuccess: () => void utils.financial.get.invalidate({ useCaseId }),
  });

  if (!data) return <p className="text-sm text-slate-500">Loading financial model…</p>;

  const m = data.model;

  return (
    <div className="space-y-4">
      <Link href={`/evaluation/${useCaseId}`} className="text-sm text-brand-primary hover:underline">
        ← Assessment
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold">Current state</legend>
          {[
            "currentLaborDirect",
            "currentLaborMgmt",
            "currentErrorCost",
            "currentSlaPenalty",
            "currentOpportunityCost",
            "currentToolCost",
          ].map((field) => (
            <label key={field} className="mb-2 block text-sm">
              {field}
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                defaultValue={(m as unknown as Record<string, number | null>)[field] ?? ""}
                id={field}
              />
            </label>
          ))}
        </fieldset>
        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold">Agentic solution</legend>
          {[
            "devInternalOnetime",
            "devExternalOnetime",
            "integrationOnetime",
            "testingOnetime",
            "changeMgmtOnetime",
            "llmApiAnnual",
            "infraAnnual",
            "maintenanceAnnual",
            "monitoringAnnual",
            "hitlLaborAnnual",
          ].map((field) => (
            <label key={field} className="mb-2 block text-sm">
              {field}
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                defaultValue={(m as unknown as Record<string, number | null>)[field] ?? ""}
                id={field}
              />
            </label>
          ))}
        </fieldset>
      </div>
      <div className="grid gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-4">
        {[
          ["Net annual benefit", data.summary.netAnnualBenefit],
          ["Payback (months)", data.summary.paybackMonths],
          ["Year 1 ROI %", data.summary.year1Roi],
          ["3-yr NPV", data.summary.npv],
        ].map(([label, val]) => (
          <div key={label as string}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-semibold">{val as number}</p>
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          const fields = [
            "currentLaborDirect",
            "currentLaborMgmt",
            "currentErrorCost",
            "currentSlaPenalty",
            "currentOpportunityCost",
            "currentToolCost",
            "devInternalOnetime",
            "devExternalOnetime",
            "integrationOnetime",
            "testingOnetime",
            "changeMgmtOnetime",
            "llmApiAnnual",
            "infraAnnual",
            "maintenanceAnnual",
            "monitoringAnnual",
            "hitlLaborAnnual",
          ];
          const payload: Record<string, number> = {};
          for (const f of fields) {
            const el = document.getElementById(f) as HTMLInputElement | null;
            if (!el) continue;
            payload[f] = el.value === "" ? 0 : Number(el.value);
          }
          save.mutate({ useCaseId, data: payload });
        }}
      >
        Save financial model
      </Button>
    </div>
  );
}
