"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  dimensionColorClass,
  verdictBadgeVariant,
} from "@/lib/scoring/feasibility-scoring";

interface EvaluationAssessmentProps {
  useCaseId: string;
}

export function EvaluationAssessment({ useCaseId }: EvaluationAssessmentProps) {
  const [openDim, setOpenDim] = useState<string | null>("D1");
  const [localScores, setLocalScores] = useState<
    Record<string, { score: number; evidence: string }>
  >({});

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.evaluation.getAssessment.useQuery({ useCaseId });
  const save = trpc.evaluation.saveAssessment.useMutation({
    onSuccess: () => void utils.evaluation.getAssessment.invalidate({ useCaseId }),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading assessment…</p>;
  }

  const handleSave = async () => {
    const scores = Object.entries(localScores)
      .filter(([, v]) => v.score >= 1)
      .map(([questionId, v]) => ({
        questionId,
        score: v.score,
        evidenceNotes: v.evidence,
      }));
    if (scores.length) {
      await save.mutateAsync({ useCaseId, scores });
    }
  };

  const navigateAfterSave = async (href: string) => {
    try {
      await handleSave();
    } catch {
      return;
    }
    window.location.assign(href);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-sm text-brand-primary hover:underline"
          onClick={() => void navigateAfterSave(`/evaluation/${useCaseId}/gates`)}
        >
          Hard Gates →
        </button>
        <button
          type="button"
          className="text-sm text-brand-primary hover:underline"
          onClick={() => void navigateAfterSave(`/evaluation/${useCaseId}/financial`)}
        >
          Financial →
        </button>
        <button
          type="button"
          className="text-sm text-brand-primary hover:underline"
          onClick={() => void navigateAfterSave(`/evaluation/${useCaseId}/criteria`)}
        >
          Criteria →
        </button>
        <button
          type="button"
          className="text-sm text-brand-primary hover:underline"
          onClick={() => void navigateAfterSave(`/evaluation/${useCaseId}/scorecard`)}
        >
          Scorecard →
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-4">
        <span className="text-sm text-slate-600">Composite:</span>
        <span className="text-2xl font-bold">{data.composite?.toFixed(2) ?? "—"}</span>
        {data.verdict ? (
          <Badge variant={verdictBadgeVariant(data.verdict)}>{data.verdict}</Badge>
        ) : null}
      </div>

      {data.dimensions.map((dim) => (
        <div key={dim.dimensionCode} className="rounded-lg border border-slate-200">
          <button
            type="button"
            className={`flex w-full items-center justify-between px-4 py-3 text-left ${dimensionColorClass(dim.avg)}`}
            onClick={() =>
              setOpenDim(openDim === dim.dimensionCode ? null : dim.dimensionCode)
            }
          >
            <span className="font-medium">
              {dim.dimensionCode} — {dim.dimensionName}
            </span>
            <span className="text-sm">Avg: {dim.avg.toFixed(2) || "—"}</span>
          </button>
          {openDim === dim.dimensionCode ? (
            <div className="space-y-3 p-4">
              {dim.questions.map((q) => (
                <div key={q.id} className="grid gap-2 md:grid-cols-12">
                  <p className="text-sm md:col-span-6">{q.questionText}</p>
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-2"
                    defaultValue={q.assessment?.score ?? ""}
                    onChange={(e) =>
                      setLocalScores((prev) => ({
                        ...prev,
                        [q.id]: {
                          score: Number(e.target.value),
                          evidence:
                            prev[q.id]?.evidence ??
                            q.assessment?.evidenceNotes ??
                            q.evidencePrefill,
                        },
                      }))
                    }
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-4"
                    rows={2}
                    defaultValue={
                      q.assessment?.evidenceNotes ?? q.evidencePrefill ?? ""
                    }
                    onBlur={(e) =>
                      setLocalScores((prev) => ({
                        ...prev,
                        [q.id]: {
                          score: prev[q.id]?.score ?? q.assessment?.score ?? 0,
                          evidence: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}

      <Button onClick={handleSave} disabled={save.isPending}>
        Save assessment
      </Button>
    </div>
  );
}
