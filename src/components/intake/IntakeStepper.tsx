"use client";

import { cn } from "@/lib/utils/format";
import {
  INTAKE_SECTION_LABELS,
  type IntakeSectionId,
  visibleSections,
} from "@/lib/intake/sections";
import type { IntakeFormConfig } from "@/lib/types";
import type { SectionCompletionStatus } from "@/lib/intake/completion";

interface IntakeStepperProps {
  activeSection: IntakeSectionId;
  onSectionChange: (section: IntakeSectionId) => void;
  sectionStatus: Record<IntakeSectionId, SectionCompletionStatus>;
  config?: IntakeFormConfig | null;
}

function statusColor(status: SectionCompletionStatus): string {
  if (status === "complete") return "bg-emerald-500 border-emerald-500 text-white";
  if (status === "partial") return "bg-amber-400 border-amber-400 text-white";
  return "bg-white border-slate-300 text-slate-500";
}

export function IntakeStepper({
  activeSection,
  onSectionChange,
  sectionStatus,
  config,
}: IntakeStepperProps) {
  const sections = visibleSections(config);

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-2"
      aria-label="Intake wizard sections"
    >
      {sections.map((sectionId, index) => {
        const status = sectionStatus[sectionId] ?? "empty";
        const isActive = activeSection === sectionId;
        return (
          <button
            key={sectionId}
            type="button"
            onClick={() => onSectionChange(sectionId)}
            className={cn(
              "flex min-w-[120px] flex-col items-center gap-1 rounded-lg border px-3 py-2 text-left transition-colors",
              isActive
                ? "border-brand-primary bg-brand-primary/5"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                statusColor(status),
              )}
            >
              {index + 1}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {INTAKE_SECTION_LABELS[sectionId]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
