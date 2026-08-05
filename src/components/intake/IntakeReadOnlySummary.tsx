"use client";

import {
  INTAKE_SECTION_LABELS,
  INTAKE_SECTION_IDS,
  visibleSections,
} from "@/lib/intake/sections";
import { getIncompleteMandatoryFields } from "@/lib/intake/completion";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeFormConfig } from "@/lib/types";
import { IntakeSectionForm } from "./IntakeSectionForm";

interface IntakeReadOnlySummaryProps {
  values: IntakeFormValues;
  config?: IntakeFormConfig | null;
}

export function IntakeReadOnlySummary({
  values,
  config,
}: IntakeReadOnlySummaryProps) {
  const missing = getIncompleteMandatoryFields(values, config);
  const sections = visibleSections(config);

  return (
    <div className="space-y-6">
      {missing.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Incomplete mandatory fields</p>
          <ul className="mt-2 list-disc pl-5">
            {missing.map((item) => (
              <li key={`${item.section}-${item.field}`}>
                {INTAKE_SECTION_LABELS[item.section]} — {item.field}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sections.map((sectionId) => (
        <section
          key={sectionId}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <h3 className="mb-3 font-semibold text-slate-900">
            {INTAKE_SECTION_LABELS[sectionId]}
          </h3>
          <IntakeSectionForm sectionId={sectionId} values={values} onChange={() => undefined} readOnly />
        </section>
      ))}
    </div>
  );
}

/** Collapsible read-only view for gate review left panel */
export function IntakeCollapsibleSummary({
  values,
  config,
}: IntakeReadOnlySummaryProps) {
  const sections = visibleSections(config);

  return (
    <div className="space-y-2">
      {sections.map((sectionId) => (
        <details key={sectionId} className="rounded-lg border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 font-medium text-slate-800">
            {INTAKE_SECTION_LABELS[sectionId]}
          </summary>
          <div className="border-t border-slate-100 p-4">
            <IntakeSectionForm sectionId={sectionId} values={values} onChange={() => undefined} readOnly />
          </div>
        </details>
      ))}
    </div>
  );
}

export { INTAKE_SECTION_IDS };
