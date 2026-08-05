"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/Badge";
import { getStageLabel } from "@/lib/workflow/stage-transitions";
import { StageTransitionBar } from "@/components/lifecycle/StageTransitionBar";
import { LifecycleTimeline } from "@/components/lifecycle/LifecycleTimeline";
import { CHART_COLORS, chartTooltipStyle } from "@/components/dashboard/chart-theme";
import type { LifecycleStage } from "@/lib/types";

interface UseCaseDetailViewProps {
  useCaseId: string;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "scores", label: "Scores" },
  { id: "ai", label: "AI insights" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function UseCaseDetailView({ useCaseId }: UseCaseDetailViewProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const { data: useCase, isLoading } = trpc.usecase.get.useQuery({ id: useCaseId });
  const { data: history } = trpc.scoring.getScoreHistory.useQuery({ useCaseId });
  const { data: completeness } = trpc.ai.completenessCheck.useQuery(
    { useCaseId },
    { enabled: tab === "ai" },
  );
  const { data: classification } = trpc.ai.suggestClassification.useQuery(
    { useCaseId },
    { enabled: tab === "ai" },
  );
  const { data: feasibilityQs } = trpc.ai.generateFeasibilityQuestions.useQuery(
    { useCaseId },
    { enabled: tab === "ai" },
  );

  if (isLoading || !useCase) {
    return <p className="text-sm text-slate-500">Loading use case…</p>;
  }

  const chartData: Array<{ label: string; date: string; priority: number }> =
    history?.map((snap) => ({
      label: `v${snap.version.versionNumber}`,
      date: snap.snapshotDate.toISOString(),
      priority: snap.priorityScore,
    })) ?? [];

  if (useCase.priorityScore != null) {
    chartData.push({
      label: "Current",
      date: new Date().toISOString(),
      priority: useCase.priorityScore,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{useCase.title}</h2>
            <p className="text-sm text-slate-500">
              {useCase.useCaseNumber} · {useCase.businessUnit}
            </p>
          </div>
          <Badge>{getStageLabel(useCase.currentStage)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "border-b-2 border-brand-primary text-brand-primary"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Priority", useCase.priorityScore],
              ["Rank", useCase.rank],
              ["Value", useCase.valueScore],
              ["Feasibility", useCase.feasibilityScore],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-lg border bg-white p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-semibold">{val ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={`/scoring/${useCaseId}`} className="text-brand-primary hover:underline">
              Scoring
            </Link>
            <Link href={`/architecture/${useCaseId}`} className="text-brand-primary hover:underline">
              Architecture
            </Link>
            <Link href={`/evaluation/${useCaseId}`} className="text-brand-primary hover:underline">
              Evaluation
            </Link>
            <Link href={`/operations/${useCaseId}`} className="text-brand-primary hover:underline">
              Operations
            </Link>
          </div>
        </>
      ) : null}

      {tab === "lifecycle" ? (
        <>
          <StageTransitionBar
            useCaseId={useCaseId}
            currentStage={useCase.currentStage as LifecycleStage}
          />
          <LifecycleTimeline useCaseId={useCaseId} />
        </>
      ) : null}

      {tab === "scores" ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Score history</h3>
          {history?.length ? (
            <>
              <table className="mb-4 min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="p-2">Version</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Feasibility</th>
                    <th className="p-2">Risk</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((snap) => (
                    <tr key={snap.id} className="border-t border-slate-100">
                      <td className="p-2">v{snap.version.versionNumber}</td>
                      <td className="p-2">
                        {new Date(snap.snapshotDate).toLocaleDateString()}
                      </td>
                      <td className="p-2">{snap.valueScore}</td>
                      <td className="p-2">{snap.feasibilityScore}</td>
                      <td className="p-2">{snap.riskScore}</td>
                      <td className="p-2">{snap.priorityScore}</td>
                      <td className="p-2">{snap.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chartData.length > 1 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                      <Tooltip {...chartTooltipStyle()} />
                      <Line
                        type="monotone"
                        dataKey="priority"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">No historical snapshots yet.</p>
          )}
        </div>
      ) : null}

      {tab === "ai" ? (
        <div className="space-y-4">
          <AiPanel title="Completeness check">
            {completeness?.warnings.length ? (
              <ul className="space-y-2 text-sm">
                {completeness.warnings.map((w, i) => (
                  <li
                    key={i}
                    className={`rounded p-2 ${
                      w.severity === "error"
                        ? "bg-red-50 text-red-800"
                        : w.severity === "warning"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {w.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No warnings.</p>
            )}
          </AiPanel>
          <AiPanel title="Suggested classification">
            <p className="text-sm">
              {classification?.suggestedPattern ?? "—"} ({classification?.confidence ?? "—"})
            </p>
            <p className="mt-1 text-xs text-slate-500">{classification?.rationale}</p>
          </AiPanel>
          <AiPanel title="Feasibility questions">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feasibilityQs?.questions.map((q, i) => (
                <li key={i}>
                  <strong>{q.dimension}:</strong> {q.question}
                </li>
              ))}
            </ul>
          </AiPanel>
        </div>
      ) : null}
    </div>
  );
}

function AiPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
