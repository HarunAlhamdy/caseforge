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
import { trpc } from "@/trpc/react";
import { CHART_COLORS, chartTooltipStyle, emptyChartMessage } from "./chart-theme";
import { Button } from "@/components/ui/Button";

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
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  if (!data) {
    return emptyChartMessage("portfolio dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => exportPortfolio.mutate()}
          disabled={exportPortfolio.isLoading}
        >
          Export portfolio (xlsx)
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportGate.mutate()}
          disabled={exportGate.isLoading}
        >
          Export gate report (xlsx)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active use cases", data.totalActive],
          ["Scored (scatter)", data.scatter.length],
          ["Stages with cases", data.stageBar.length],
          ["Recent events", data.recentActivity.length],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetCard title="1. Stage funnel">
          {data.funnel.some((f) => f.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel.filter((f) => f.count > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("stage funnel")
          )}
        </WidgetCard>

        <WidgetCard title="2. Value vs feasibility scatter">
          {data.scatter.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" name="Value" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feasibility" name="Feasibility" tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={data.scatter} fill={CHART_COLORS.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("scatter plot")
          )}
        </WidgetCard>

        <WidgetCard title="3. Stage distribution">
          {data.stageBar.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stageBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("stage bar chart")
          )}
        </WidgetCard>

        <WidgetCard title="4. Risk tier pie">
          {data.riskTierPie.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.riskTierPie.filter((d) => d.value > 0)} dataKey="value" nameKey="name" label>
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
            emptyChartMessage("risk tiers")
          )}
        </WidgetCard>

        <WidgetCard title="5. Priority trend">
          {data.priorityLine.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priorityLine}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Line type="monotone" dataKey="avgPriority" stroke={CHART_COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("priority trend")
          )}
        </WidgetCard>

        <WidgetCard title="6. Heatmap grid (unit × stage)">
          {data.heatmap.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Stage</th>
                    <th className="p-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((cell, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{cell.unit}</td>
                      <td className="p-2">{cell.stage}</td>
                      <td className="p-2 text-right">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-white"
                          style={{
                            backgroundColor: CHART_COLORS.primary,
                            opacity: Math.min(1, 0.4 + cell.count * 0.15),
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
            emptyChartMessage("heatmap")
          )}
        </WidgetCard>

        <WidgetCard title="7. Top use cases">
          {data.topUseCases.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {data.topUseCases.map((uc) => (
                  <tr key={uc.id} className="border-t">
                    <td className="p-2">{uc.rank ?? "—"}</td>
                    <td className="p-2">{uc.title}</td>
                    <td className="p-2">{uc.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            emptyChartMessage("top use cases")
          )}
        </WidgetCard>

        <WidgetCard title="8. Data readiness">
          {data.readinessPie.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.readinessPie.filter((d) => d.value > 0)} dataKey="value" nameKey="name" label>
                    {data.readinessPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("data readiness")
          )}
        </WidgetCard>

        <WidgetCard title="9. Gate decisions">
          {data.gateBar.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gateBar.filter((d) => d.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="value" fill={CHART_COLORS.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("gate decisions")
          )}
        </WidgetCard>

        <WidgetCard title="10. Wave distribution">
          {data.waveBar.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.waveBar.filter((d) => d.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyChartMessage("waves")
          )}
        </WidgetCard>

        <WidgetCard title="11. Recent activity">
          {data.recentActivity.length > 0 ? (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {data.recentActivity.map((e) => (
                <li key={e.id} className="border-b border-slate-100 pb-2">
                  <p className="font-medium">{e.useCaseTitle}</p>
                  <p className="text-xs text-slate-500">
                    {e.fromStage} → {e.toStage} · {e.by} ·{" "}
                    {new Date(e.at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            emptyChartMessage("recent activity")
          )}
        </WidgetCard>
      </div>
    </div>
  );
}

function WidgetCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
