"use client";

import { trpc } from "@/trpc/react";
import { getStageLabel } from "@/lib/workflow/stage-transitions";
import type { LifecycleStage } from "@/lib/types";

interface LifecycleTimelineProps {
  useCaseId: string;
}

const STAGE_ORDER: LifecycleStage[] = [
  "INTAKE_DRAFT",
  "INTAKE_COMPLETE",
  "PENDING_REVIEW",
  "GATING_REVIEW",
  "PROFILE_REVIEW",
  "PORTFOLIO_SCORING",
  "DEEP_FEASIBILITY",
  "WAVE_PLANNING",
  "PILOT",
  "SCALE_UP",
  "PRODUCTION",
  "RETIRED",
];

export function LifecycleTimeline({ useCaseId }: LifecycleTimelineProps) {
  const { data: events, isLoading } = trpc.lifecycle.getEvents.useQuery({
    useCaseId,
  });
  const { data: useCase } = trpc.usecase.get.useQuery({ id: useCaseId });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading timeline…</p>;
  }

  const currentStage = useCase?.currentStage as LifecycleStage | undefined;
  const currentIdx = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">
        Lifecycle timeline
      </h3>

      <div className="mb-6 flex flex-wrap gap-1">
        {STAGE_ORDER.map((stage, idx) => {
          const isPast = currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = stage === currentStage;
          return (
            <div
              key={stage}
              className={`rounded px-2 py-1 text-xs ${
                isCurrent
                  ? "bg-brand-primary text-white"
                  : isPast
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-100 text-slate-500"
              }`}
              title={getStageLabel(stage)}
            >
              {getStageLabel(stage)}
            </div>
          );
        })}
      </div>

      {events?.length ? (
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1 h-2 w-2 rounded-full bg-brand-primary" />
              <p className="text-sm font-medium text-slate-800">
                {getStageLabel(event.fromStage)} → {getStageLabel(event.toStage)}
              </p>
              <p className="text-xs text-slate-500">
                {event.transitionedBy.name} ·{" "}
                {new Date(event.transitionedAt).toLocaleString()}
                {event.notes ? ` · ${event.notes}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-500">No lifecycle events recorded yet.</p>
      )}
    </div>
  );
}
