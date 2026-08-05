"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppPage } from "@/components/layout/AppPage";
import { trpc } from "@/trpc/react";
import { CHART_COLORS, chartTooltipStyle, emptyChartMessage } from "@/components/dashboard/chart-theme";

export default function PartnerHealthPage() {
  const { data, isLoading } = trpc.dashboard.partnerHealth.useQuery();

  return (
    <AppPage
      title="Partner Health"
      description="Customer health scores and portfolio risk indicators."
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !data?.healthScores.length ? (
        emptyChartMessage("customer health")
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Health score distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.healthScores.map((h) => ({
                      name: h.tenantName,
                      value: h.healthScore,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {data.healthScores.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Customer detail</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-2">Customer</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Cases</th>
                  <th className="p-2">On hold</th>
                </tr>
              </thead>
              <tbody>
                {data.healthScores.map((h) => (
                  <tr key={h.tenantId} className="border-t">
                    <td className="p-2">{h.tenantName}</td>
                    <td className="p-2">{h.healthScore}</td>
                    <td className="p-2">{h.useCaseCount}</td>
                    <td className="p-2">{h.onHold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppPage>
  );
}
