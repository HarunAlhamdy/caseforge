"use client";

import { cn } from "@/lib/utils/format";

export interface AdminTab {
  id: string;
  label: string;
}

export function AdminTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: AdminTab[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex flex-wrap gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
