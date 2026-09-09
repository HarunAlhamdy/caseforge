/**
 * Left-side hero panel shown on auth pages (hidden on mobile).
 * Teal background + dot-grid texture + brand stats.
 */
export function AuthHeroPanel() {
  return (
    <div className="relative isolate hidden lg:flex lg:w-1/2 flex-col justify-between bg-teal-800 p-12 overflow-hidden">
      {/* Dot-grid texture overlay — always behind content */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage: "url('/dot-grid.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "20px 20px",
        }}
        aria-hidden
      />

      {/* Top: wordmark */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M3 10C3 6.134 6.134 3 10 3s7 3.134 7 7-3.134 7-7 7-7-3.134-7-7Z"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              d="M7 10h6M10 7v6"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-lg font-bold text-white tracking-tight">CaseForge</span>
      </div>

      {/* Middle: tagline + stat cards */}
      <div className="relative z-10 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300 mb-3">
            AI Use Case Lifecycle
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug text-balance">
            From idea to AI in production — governed, scored, and tracked.
          </h2>
          <p className="mt-4 text-teal-200 text-sm leading-relaxed max-w-xs">
            CaseForge brings structure to enterprise AI adoption across intake, evaluation, architecture, and delivery.
          </p>
        </div>

        {/* Floating stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Use cases evaluated", value: "143+" },
            { label: "Avg. ROI identified", value: "4.2×" },
            { label: "Delivery success rate", value: "91%" },
            { label: "Avg. time to pilot", value: "6 wks" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-teal-200 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: footer note */}
      <div className="relative z-10">
        <p className="text-xs text-teal-300/70">
          Enterprise-grade. Multi-tenant. SOC 2 ready.
        </p>
      </div>
    </div>
  );
}
