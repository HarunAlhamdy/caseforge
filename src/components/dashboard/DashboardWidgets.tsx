"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  BarChart2,
  GitBranch,
  Layers,
  ListOrdered,
  Map,
  ShieldCheck,
  TrendingUp,
  Waves,
  Zap,
  FileDown,
  Clock,
} from "lucide-react";
import { trpc } from "@/trpc/react";
import { CHART_COLORS, chartTooltipStyle } from "./chart-theme";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "./KpiCard";
import { WidgetShell, WidgetEmpty } from "./WidgetShell";

function downloadBase64(base64: string, fileName: string) {
  const link = document.createElement("a");
  link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  link.download = fileName;
  link.click();
}

export function DashboardWidgets() {
  const { data, isLoading } = trpc.dashboard.summary.useQuery();
  const exportPortfolio = trpc.dashboard.exportPortfolio.useMutation({
    onSuccess: (result) => downloadBase64(result.base64, result.fileName),
  });
  const exportGate = trpc.dashboard.exportGateReport.useMutation({
    onSuccess: (result) => downloadBase64(result.base64, result.fileName),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-400">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportPortfolio.mutate()}
          disabled={exportPortfolio.isLoading}
        >
          <FileDown className="h-4 w-4" aria-hidden />
          Portfolio (xlsx)
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportGate.mutate()}
          disabled={exportGate.isLoading}
        >
          <FileDown className="h-4 w-4" aria-hidden />
          Gate report (xlsx)
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active use cases" value={data.totalActive} icon={Zap} trend="Across all stages" />
        <KpiCard label="Scored use cases" value={data.scatter.length} icon={BarChart2} trend="Value × feasibility" trendUp={data.scatter.length > 0} />
        <KpiCard label="Pipeline stages" value={data.stageBar.length} icon={GitBranch} />
        <KpiCard label="Recent events" value={data.recentActivity.length} icon={Activity} />
      </div>

      {/* Chart grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 1. Stage funnel */}
        <WidgetShell title="Stage funnel" icon={Layers}>
          {data.funnel.some((f) => f.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel.filter((f) => f.count > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 10, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="stage funnel" />
          )}
        </WidgetShell>

        {/* 2. Value vs feasibility */}
        <WidgetShell title="Value vs. feasibility" icon={TrendingUp}>
          {data.scatter.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="value" name="Value" tick={{ fontSize: 11, fill: "#78716c" }} label={{ value: "Value", position: "insideBottom", offset: -4, fontSize: 10 }} />
                  <YAxis dataKey="feasibility" name="Feasibility" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={data.scatter} fill={CHART_COLORS.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="scatter" />
          )}
        </WidgetShell>

        {/* 3. Stage distribution */}
        <WidgetShell title="Stage distribution" icon={BarChart2}>
          {data.stageBar.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stageBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#78716c" }} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="stage distribution" />
          )}
        </WidgetShell>

        {/* 4. Risk tier pie */}
        <WidgetShell title="Risk tier breakdown" icon={ShieldCheck}>
          {data.riskTierPie.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.riskTierPie.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.riskTierPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="risk tiers" />
          )}
        </WidgetShell>

        {/* 5. Priority trend */}
        <WidgetShell title="Priority score trend" icon={TrendingUp}>
          {data.priorityLine.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priorityLine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Line
                    type="monotone"
                    dataKey="avgPriority"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CHART_COLORS.primary }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="priority trend" />
          )}
        </WidgetShell>

        {/* 6. Heatmap grid */}
        <WidgetShell title="Unit × stage heatmap" icon={Map}>
          {data.heatmap.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="pb-2 text-left text-stone-400 font-semibold uppercase tracking-wider">Unit</th>
                    <th className="pb-2 text-left text-stone-400 font-semibold uppercase tracking-wider">Stage</th>
                    <th className="pb-2 text-right text-stone-400 font-semibold uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((cell, i) => (
                    <tr key={i} className="border-t border-stone-50">
                      <td className="py-2 text-stone-700">{cell.unit}</td>
                      <td className="py-2 text-stone-500">{cell.stage}</td>
                      <td className="py-2 text-right">
                        <span
                          className="inline-block rounded-lg px-2 py-0.5 text-white text-xs font-semibold"
                          style={{
                            backgroundColor: CHART_COLORS.primary,
                            opacity: Math.min(1, 0.5 + cell.count * 0.15),
                          }}
                        >
                          {cell.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <WidgetEmpty label="heatmap" />
          )}
        </WidgetShell>

        {/* 7. Top use cases */}
        <WidgetShell title="Top use cases" icon={ListOrdered}>
          {data.topUseCases.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Rank</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Title</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-400">Priority</th>
                </tr>
              </thead>
              <tbody>
                {data.topUseCases.map((uc) => (
                  <tr key={uc.id} className="border-t border-stone-50">
                    <td className="py-2 font-semibold text-teal-600">{uc.rank ?? "—"}</td>
                    <td className="py-2 text-stone-800">{uc.title}</td>
                    <td className="py-2 text-right text-stone-500">{uc.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <WidgetEmpty label="top use cases" />
          )}
        </WidgetShell>

        {/* 8. Data readiness */}
        <WidgetShell title="Data readiness" icon={ShieldCheck}>
          {data.readinessPie.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.readinessPie.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.readinessPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="data readiness" />
          )}
        </WidgetShell>

        {/* 9. Gate decisions */}
        <WidgetShell title="Gate decisions" icon={ShieldCheck}>
          {data.gateBar.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gateBar.filter((d) => d.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="value" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="gate decisions" />
          )}
        </WidgetShell>

        {/* 10. Wave distribution */}
        <WidgetShell title="Wave distribution" icon={Waves}>
          {data.waveBar.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.waveBar.filter((d) => d.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <WidgetEmpty label="wave distribution" />
          )}
        </WidgetShell>

        {/* 11. Recent activity */}
        <WidgetShell title="Recent activity" icon={Clock}>
          {data.recentActivity.length > 0 ? (
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {data.recentActivity.map((e) => (
                <li key={e.id} className="flex items-start gap-3 border-b border-stone-50 pb-3 last:border-0">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-50">
                    <Activity className="h-3 w-3 text-teal-600" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{e.useCaseTitle}</p>
                    <p className="text-xs text-stone-400">
                      {e.fromStage} → {e.toStage} · {e.by} ·{" "}
                      {new Date(e.at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <WidgetEmpty label="recent activity" />
          )}
        </WidgetShell>
      </div>
    </div>
  );
}
