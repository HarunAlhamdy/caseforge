import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function KpiCard({ label, value, icon: Icon, trend, trendUp }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_2px_10px_rgba(28,25,23,0.05)] transition-shadow hover:shadow-[0_6px_20px_rgba(28,25,23,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-600 to-teal-400 opacity-90" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            {label}
          </p>
          <p className="mt-2.5 text-4xl font-bold tracking-tight text-stone-900">
            {value}
          </p>
          {trend ? (
            <p
              className={`mt-2 text-xs font-semibold ${
                trendUp ? "text-teal-700" : "text-stone-500"
              }`}
            >
              {trend}
            </p>
          ) : null}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-teal-300 transition-transform group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
