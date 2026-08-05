import type { IntakeFormConfig } from "@/lib/types";
import type { IntakeFormValues } from "./schema";
import {
  DEFAULT_MANDATORY_FIELDS,
  type IntakeSectionId,
  INTAKE_SECTION_IDS,
  isFieldMandatory,
  isSectionHidden,
  visibleSections,
} from "./sections";

export type SectionCompletionStatus = "empty" | "partial" | "complete";

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function getFieldValue(values: IntakeFormValues, fieldId: string): unknown {
  return (values as Record<string, unknown>)[fieldId];
}

export function getSectionMandatoryFields(
  sectionId: IntakeSectionId,
  config?: IntakeFormConfig | null,
): string[] {
  if (isSectionHidden(sectionId, config)) return [];

  const defaults = DEFAULT_MANDATORY_FIELDS[sectionId] ?? [];
  const mandatory = defaults.filter((fieldId) =>
    isFieldMandatory(sectionId, fieldId, config),
  );

  const optionalDefaults = defaults.filter(
    (fieldId) => !mandatory.includes(fieldId),
  );
  for (const fieldId of optionalDefaults) {
    if (isFieldMandatory(sectionId, fieldId, config)) {
      mandatory.push(fieldId);
    }
  }

  return Array.from(new Set(mandatory));
}

export function getSectionCompletionStatus(
  sectionId: IntakeSectionId,
  values: IntakeFormValues,
  config?: IntakeFormConfig | null,
): SectionCompletionStatus {
  if (isSectionHidden(sectionId, config)) return "complete";

  const mandatory = getSectionMandatoryFields(sectionId, config);
  const sectionHasAnyData = mandatory.some((field) =>
    hasValue(getFieldValue(values, field)),
  );

  if (mandatory.length === 0) {
    return sectionHasAnyData ? "complete" : "empty";
  }

  const filledMandatory = mandatory.filter((field) =>
    hasValue(getFieldValue(values, field)),
  );

  if (filledMandatory.length === 0) return "empty";
  if (filledMandatory.length === mandatory.length) return "complete";
  return "partial";
}

export function areAllMandatorySectionsComplete(
  values: IntakeFormValues,
  config?: IntakeFormConfig | null,
): boolean {
  return visibleSections(config).every(
    (sectionId) =>
      getSectionCompletionStatus(sectionId, values, config) === "complete",
  );
}

export function calculateCompletionPercent(
  values: IntakeFormValues,
  config?: IntakeFormConfig | null,
): number {
  const sections = visibleSections(config);
  if (sections.length === 0) return 100;

  const completeCount = sections.filter(
    (sectionId) =>
      getSectionCompletionStatus(sectionId, values, config) === "complete",
  ).length;

  return Math.round((completeCount / sections.length) * 100);
}

export function getIncompleteMandatoryFields(
  values: IntakeFormValues,
  config?: IntakeFormConfig | null,
): { section: IntakeSectionId; field: string }[] {
  const missing: { section: IntakeSectionId; field: string }[] = [];

  for (const sectionId of INTAKE_SECTION_IDS) {
    if (isSectionHidden(sectionId, config)) continue;
    for (const field of getSectionMandatoryFields(sectionId, config)) {
      if (!hasValue(getFieldValue(values, field))) {
        missing.push({ section: sectionId, field });
      }
    }
  }

  return missing;
}
