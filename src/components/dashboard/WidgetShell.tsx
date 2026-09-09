import type { LucideIcon } from "lucide-react";

interface WidgetShellProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function WidgetShell({ title, icon: Icon, action, children }: WidgetShellProps) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white shadow-[0_2px_10px_rgba(28,25,23,0.05)]">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100">
              <Icon className="h-4 w-4 text-stone-700" aria-hidden />
            </div>
          ) : null}
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function WidgetEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
      <svg width="56" height="44" viewBox="0 0 56 44" fill="none" aria-hidden>
        <rect x="4" y="24" width="8" height="16" rx="2" fill="#e7e5e4" />
        <rect x="16" y="16" width="8" height="24" rx="2" fill="#e7e5e4" />
        <rect x="28" y="10" width="8" height="30" rx="2" fill="#a8a29e" />
        <rect x="40" y="20" width="8" height="20" rx="2" fill="#e7e5e4" />
        <line x1="0" y1="40" x2="56" y2="40" stroke="#d6d3d1" strokeWidth="1.5" />
      </svg>
      <p className="text-sm font-medium text-stone-500">No {label} data yet</p>
    </div>
  );
}
