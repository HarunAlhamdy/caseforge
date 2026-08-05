"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppPage } from "@/components/layout/AppPage";
import { trpc } from "@/trpc/react";
import { CHART_COLORS, chartTooltipStyle, emptyChartMessage } from "@/components/dashboard/chart-theme";

export default function ExecutiveDashboardPage() {
  const { data, isLoading } = trpc.dashboard.executive.useQuery();

  return (
    <AppPage
      title="Executive Dashboard"
      description="High-level KPIs and portfolio health for leadership review."
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !data ? (
        emptyChartMessage("executive summary")
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active portfolio", data.kpis.totalActive],
              ["In delivery", data.kpis.inDelivery],
              ["In early pipeline", data.kpis.inPipeline],
              ["Avg priority", data.kpis.avgPriority],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-lg border bg-white p-4">
                <p className="text-xs uppercase text-slate-500">{label}</p>
                <p className="text-2xl font-bold">{val}</p>
              </div>
            ))}
          </div>

          {data.kpis.topRanked ? (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-700">Top ranked use case</h3>
              <p className="mt-2 text-lg font-medium">{data.kpis.topRanked.title}</p>
              <p className="text-sm text-slate-500">
                Priority {data.kpis.topRanked.priority} · Rank {data.kpis.topRanked.rank}
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Stage funnel</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel.filter((f) => f.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
}
