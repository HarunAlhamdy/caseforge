"use client";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";

export function FeasibilityConfigEditor() {
  const { data: dimensions, isLoading, refetch } =
    trpc.admin.getFeasibilityConfig.useQuery();

  const updateDimension = trpc.admin.updateFeasibilityDimension.useMutation({
    onSuccess: () => void refetch(),
  });
  const updateQuestion = trpc.admin.updateFeasibilityQuestion.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading || !dimensions) {
    return <p className="text-sm text-slate-500">Loading feasibility config…</p>;
  }

  return (
    <div className="space-y-4">
      {dimensions.map((dimension) => (
        <div
          key={dimension.id}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h4 className="font-medium text-slate-900">
              {dimension.dimensionCode}: {dimension.dimensionName}
            </h4>
            <label className="flex items-center gap-2 text-sm">
              Weight
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(dimension.weight * 100)}
                onChange={(e) =>
                  updateDimension.mutate({
                    dimensionId: dimension.id,
                    weight: Number(e.target.value) / 100,
                  })
                }
              />
              {Math.round(dimension.weight * 100)}%
            </label>
          </div>
          <ul className="space-y-2">
            {dimension.questions.map((question) => (
              <li
                key={question.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 p-2 text-sm"
              >
                <span className={question.isActive ? "" : "text-slate-400 line-through"}>
                  {question.questionText}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateQuestion.mutate({
                      questionId: question.id,
                      isActive: !question.isActive,
                    })
                  }
                >
                  {question.isActive ? "Deactivate" : "Activate"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
