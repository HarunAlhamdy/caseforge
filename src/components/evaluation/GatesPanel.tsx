"use client";

import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function GatesPanel({ useCaseId }: { useCaseId: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.evaluation.getGates.useQuery({ useCaseId });
  const save = trpc.evaluation.saveGates.useMutation({
    onSuccess: () => void utils.evaluation.getGates.invalidate({ useCaseId }),
  });

  if (!data) return <p className="text-sm text-slate-500">Loading gates…</p>;

  const statusVariant =
    data.status === "ALL_PASSED"
      ? "success"
      : data.status === "HAS_FAILURES"
        ? "danger"
        : "warning";

  return (
    <div className="space-y-4">
      <Link href={`/evaluation/${useCaseId}`} className="text-sm text-brand-primary hover:underline">
        ← Assessment
      </Link>
      <Badge variant={statusVariant}>{data.status.replace(/_/g, " ")}</Badge>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="p-2">Code</th>
            <th className="p-2">Name</th>
            <th className="p-2">Condition</th>
            <th className="p-2">Result</th>
            <th className="p-2">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {data.gates.map((gate) => (
            <tr key={gate.id} className="border-t border-slate-100">
              <td className="p-2">{gate.gateCode}</td>
              <td className="p-2">{gate.gateName}</td>
              <td className="p-2">{gate.conditionText}</td>
              <td className="p-2">
                <select
                  className="rounded border border-slate-300 px-2 py-1"
                  defaultValue={
                    gate.result === true ? "pass" : gate.result === false ? "fail" : ""
                  }
                  id={`gate-${gate.id}`}
                >
                  <option value="">—</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </td>
              <td className="p-2">
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1"
                  defaultValue={gate.evidenceNotes ?? ""}
                  id={`evidence-${gate.id}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        onClick={() => {
          const gates = data.gates.map((g) => {
            const sel = document.getElementById(`gate-${g.id}`) as HTMLSelectElement;
            const ev = document.getElementById(`evidence-${g.id}`) as HTMLInputElement;
            return {
              id: g.id,
              result: sel.value === "pass",
              evidenceNotes: ev.value,
            };
          }).filter((g) => {
            const sel = document.getElementById(`gate-${g.id}`) as HTMLSelectElement;
            return sel.value !== "";
          });
          save.mutate({ useCaseId, gates });
        }}
      >
        Save gates
      </Button>
    </div>
  );
}
