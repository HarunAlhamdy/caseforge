"use client";

import { CheckIcon } from "lucide-react";
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

export function IntakeStepper({
  activeSection,
  onSectionChange,
  sectionStatus,
  config,
}: IntakeStepperProps) {
  const sections = visibleSections(config);
  const activeIndex = sections.indexOf(activeSection);

  return (
    <nav
      className="flex items-center gap-0 overflow-x-auto pb-1"
      aria-label="Intake wizard sections"
    >
      {sections.map((sectionId, index) => {
        const status = sectionStatus[sectionId] ?? "empty";
        const isActive = activeSection === sectionId;
        const isCompleted = status === "complete";
        const isPast = index < activeIndex;
        const isConnectorFilled = isPast || isCompleted;

        return (
          <div key={sectionId} className="flex items-center">
            {/* Step pill */}
            <button
              type="button"
              onClick={() => onSectionChange(sectionId)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap",
                isActive
                  ? "bg-white border-2 border-teal-600 text-teal-700 shadow-sm"
                  : isCompleted
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : status === "partial"
                      ? "bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Number or check */}
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                  isActive ? "bg-teal-600 text-white" : "bg-white/20",
                  !isActive && isCompleted && "bg-white/30",
                  !isActive && !isCompleted && "bg-stone-300/50 text-stone-600",
                )}
              >
                {isCompleted && !isActive ? (
                  <CheckIcon className="h-2.5 w-2.5" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {INTAKE_SECTION_LABELS[sectionId]}
            </button>

            {/* Connector line between steps */}
            {index < sections.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-6 flex-shrink-0 rounded-full transition-colors duration-300",
                  isConnectorFilled ? "bg-teal-400" : "bg-stone-200",
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
