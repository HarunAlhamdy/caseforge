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

export default function PartnerDashboardPage() {
  const { data, isLoading } = trpc.dashboard.partnerSummary.useQuery();
  const { data: insights } = trpc.ai.naturalLanguageInsights.useQuery(
    { query: "Summarize portfolio health across customers" },
    { enabled: Boolean(data) },
  );

  return (
    <AppPage
      title="Partner Dashboard"
      description="Cross-customer portfolio view for partner consultants."
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !data ? (
        emptyChartMessage("partner dashboard")
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Customers" value={data.customers.length} />
            <Kpi label="Total use cases" value={data.totalUseCases} />
            <Kpi label="Consultants" value={data.workloadByConsultant.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Stage distribution (all customers)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip {...chartTooltipStyle()} />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Customer health scores</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.healthScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tenantName" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip {...chartTooltipStyle()} />
                    <Bar dataKey="healthScore" fill={CHART_COLORS.accent} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {insights ? (
            <div className="rounded-lg border bg-teal-50 p-4">
              <h3 className="text-sm font-semibold">AI portfolio insights</h3>
              <p className="mt-2 text-sm">{insights.summary}</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {insights.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </AppPage>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
