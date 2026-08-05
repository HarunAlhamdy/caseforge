"use client";

import { trpc } from "@/trpc/react";
import { getStageLabel } from "@/lib/workflow/stage-transitions";
import type { LifecycleStage } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface StageTransitionBarProps {
  useCaseId: string;
  currentStage: LifecycleStage;
}

export function StageTransitionBar({
  useCaseId,
  currentStage,
}: StageTransitionBarProps) {
  const utils = trpc.useUtils();
  const { data: transitions, isLoading } =
    trpc.lifecycle.getAvailableTransitions.useQuery({ useCaseId });
  const transition = trpc.lifecycle.transition.useMutation({
    onSuccess: () => {
      utils.usecase.get.invalidate({ id: useCaseId });
      utils.lifecycle.getEvents.invalidate({ useCaseId });
      utils.lifecycle.getAvailableTransitions.invalidate({ useCaseId });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading transitions…</p>;
  }

  const allowed = transitions?.filter((t) => t.allowed) ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-slate-500">
          Stage transitions
        </h3>
        <span className="text-sm text-slate-600">
          Current: <strong>{getStageLabel(currentStage)}</strong>
        </span>
      </div>
      {allowed.length === 0 ? (
        <p className="text-sm text-slate-500">
          No transitions available from this stage.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowed.map((t) => (
            <Button
              key={t.stage}
              variant="secondary"
              disabled={transition.isLoading}
              onClick={() =>
                transition.mutate({
                  useCaseId,
                  targetStage: t.stage,
                })
              }
            >
              → {t.label}
            </Button>
          ))}
        </div>
      )}
      {transitions?.some((t) => !t.allowed) ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          {transitions
            .filter((t) => !t.allowed)
            .map((t) => (
              <li key={t.stage}>
                {t.label}: {t.reasons.join("; ")}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
