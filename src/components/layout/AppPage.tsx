import Link from "next/link";

export interface AppPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  heroContent?: React.ReactNode;
  hideBack?: boolean;
}

/**
 * Light editorial page header — intentionally different from the
 * dark teal auth marketing panel.
 */
export function AppPage({
  title,
  description,
  children,
  heroContent,
  hideBack,
}: AppPageProps) {
  return (
    <div className="space-y-6">
      <header className="relative isolate overflow-hidden rounded-3xl border border-stone-200 bg-white px-7 py-7 shadow-[0_2px_12px_rgba(28,25,23,0.04)]">
        {/* Soft corner wash — behind content */}
        <div
          className="pointer-events-none absolute -right-16 -top-20 z-0 h-56 w-56 rounded-full bg-teal-100/70 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-24 z-0 h-40 w-40 rounded-full bg-amber-100/50 blur-2xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
              CaseForge
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              {title}
            </h1>
            {heroContent ?? (
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {description}
              </p>
            )}
            <div className="mt-4 h-1 w-14 rounded-full bg-teal-600" aria-hidden />
          </div>

          <div
            className="relative z-10 hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 sm:flex"
            aria-hidden
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="4" width="12" height="12" rx="3" fill="#0f766e" />
              <rect x="20" y="4" width="12" height="12" rx="3" fill="#d6d3d1" />
              <rect x="4" y="20" width="12" height="12" rx="3" fill="#d6d3d1" />
              <rect x="20" y="20" width="12" height="12" rx="3" fill="#14b8a6" />
            </svg>
          </div>
        </div>
      </header>

      {children}

      {!hideBack && (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-stone-700 hover:text-teal-800 hover:underline underline-offset-2"
        >
          ← Back to dashboard
        </Link>
      )}
    </div>
  );
}
