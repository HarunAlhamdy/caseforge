"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { verdictBadgeVariant } from "@/lib/scoring/feasibility-scoring";

export function CriteriaPanel({ useCaseId }: { useCaseId: string }) {
  const [rows, setRows] = useState([{ metricName: "", target: "" }]);
  const utils = trpc.useUtils();
  const { data: existing } = trpc.evaluation.getCriteria.useQuery({ useCaseId });
  const save = trpc.evaluation.saveCriteria.useMutation({
    onSuccess: () => void utils.evaluation.getCriteria.invalidate({ useCaseId }),
  });

  useEffect(() => {
    if (!existing?.length) return;
    setRows(
      existing.map((c) => ({
        metricName: c.metricName,
        target: c.target != null ? String(c.target) : "",
      })),
    );
  }, [existing]);

  return (
    <div className="space-y-4">
      <Link href={`/evaluation/${useCaseId}`} className="text-sm text-brand-primary hover:underline">
        ← Assessment
      </Link>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Metric name"
            value={row.metricName}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...next[i]!, metricName: e.target.value };
              setRows(next);
            }}
          />
          <input
            className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Target"
            value={row.target}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...next[i]!, target: e.target.value };
              setRows(next);
            }}
          />
        </div>
      ))}
      <Button variant="secondary" onClick={() => setRows([...rows, { metricName: "", target: "" }])}>
        Add metric
      </Button>
      <Button
        disabled={
          save.isPending ||
          rows.filter((r) => r.metricName.trim()).length === 0
        }
        onClick={() =>
          save.mutate({
            useCaseId,
            criteria: rows
              .filter((r) => r.metricName.trim())
              .map((r) => ({
                metricName: r.metricName,
                target: r.target ? Number(r.target) : undefined,
              })),
          })
        }
      >
        Save criteria
      </Button>
    </div>
  );
}

export function ScorecardPanel({ useCaseId }: { useCaseId: string }) {
  const [reason, setReason] = useState("");
  const { data } = trpc.evaluation.getScorecard.useQuery({ useCaseId });
  const decide = trpc.evaluation.recordDecision.useMutation();

  if (!data) return <p className="text-sm text-slate-500">Loading scorecard…</p>;

  return (
    <div className="space-y-4">
      <Link href={`/evaluation/${useCaseId}`} className="text-sm text-brand-primary hover:underline">
        ← Assessment
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Feasibility</h3>
          <p className="text-2xl font-bold">{data.feasibility.composite?.toFixed(2) ?? "—"}</p>
          {data.feasibility.verdict ? (
            <Badge variant={verdictBadgeVariant(data.feasibility.verdict)}>
              {data.feasibility.verdict}
            </Badge>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Hard gates</h3>
          <p>{data.gates.status ?? "INCOMPLETE"}</p>
          <p className="text-sm text-slate-500">{data.gates.failed} failed</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Portfolio</h3>
          <p>Priority: {data.portfolio.priorityScore ?? "—"}</p>
          <p>Rank: {data.portfolio.rank ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Controls</h3>
          <p>
            {data.controls.verified}/{data.controls.total} verified
          </p>
        </div>
      </div>
      <textarea
        className="w-full rounded-lg border border-slate-300 p-2 text-sm"
        rows={3}
        placeholder="Decision rationale (min 10 chars)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {decide.error ? (
        <p className="text-sm text-red-600">{decide.error.message}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={reason.trim().length < 10 || decide.isPending}
          onClick={() => decide.mutate({ useCaseId, decision: "APPROVE", reason })}
        >
          Approve for Delivery
        </Button>
        <Button
          variant="secondary"
          disabled={reason.trim().length < 10 || decide.isPending}
          onClick={() =>
            decide.mutate({
              useCaseId,
              decision: "CONDITIONAL",
              reason,
              waiverNotes: reason,
            })
          }
        >
          Conditional Go
        </Button>
        <Button
          variant="secondary"
          disabled={reason.trim().length < 10 || decide.isPending}
          onClick={() => decide.mutate({ useCaseId, decision: "HOLD", reason })}
        >
          Place on Hold
        </Button>
        <Button
          variant="danger"
          disabled={reason.trim().length < 10 || decide.isPending}
          onClick={() => decide.mutate({ useCaseId, decision: "NO_GO", reason })}
        >
          No Go
        </Button>
      </div>
    </div>
  );
}
