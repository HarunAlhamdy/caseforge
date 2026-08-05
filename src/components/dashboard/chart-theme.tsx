export const CHART_COLORS = {
  primary: "var(--brand-primary, #0f766e)",
  accent: "var(--brand-accent, #14b8a6)",
  palette: [
    "var(--brand-primary, #0f766e)",
    "var(--brand-accent, #14b8a6)",
    "#0ea5e9",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#64748b",
  ],
};

export function chartTooltipStyle() {
  return {
    contentStyle: {
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      fontSize: 12,
    },
  };
}

export function emptyChartMessage(label: string) {
  return (
    <div className="flex h-full min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      No data yet for {label}. Seed the database or add use cases to populate charts.
    </div>
  );
}
