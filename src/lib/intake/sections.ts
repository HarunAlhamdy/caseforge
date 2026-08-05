import type { IntakeFormConfig } from "@/lib/types";
import { DEFAULT_SCORING_TEMPLATE } from "@/lib/constants/scoring-template";

export const INTAKE_SECTION_IDS = [
  "submission",
  "description",
  "currentState",
  "dataLandscape",
  "dataQuality",
  "domainModel",
  "governance",
  "security",
  "consumption",
  "assessment",
  "nextSteps",
] as const;

export type IntakeSectionId = (typeof INTAKE_SECTION_IDS)[number];

export const INTAKE_SECTION_LABELS: Record<IntakeSectionId, string> = {
  submission: "Submission Details",
  description: "Description",
  currentState: "Current State",
  dataLandscape: "Data Landscape",
  dataQuality: "Data Quality",
  domainModel: "Domain Model",
  governance: "Governance",
  security: "Security",
  consumption: "Consumption",
  assessment: "Assessment",
  nextSteps: "Next Steps",
};

/** Default mandatory fields per section when tenant config has no override. */
export const DEFAULT_MANDATORY_FIELDS: Record<IntakeSectionId, string[]> = {
  submission: ["title", "businessUnit"],
  description: ["problemStatement", "proposedSolution", "expectedBenefits"],
  currentState: ["currentProcessDescription"],
  dataLandscape: ["sourceSystemsText", "readSystems"],
  dataQuality: ["dqIssues"],
  domainModel: ["businessDomains"],
  governance: ["dataOwner", "dataSteward"],
  security: ["dataClassification"],
  consumption: ["endUserPersonas"],
  assessment: ["submitterPriority", "estimatedTimeline"],
  nextSteps: ["recommendedAction"],
};

export function resolveIntakeConfig(config?: IntakeFormConfig | null): IntakeFormConfig {
  return config?.sections?.length
    ? config
    : DEFAULT_SCORING_TEMPLATE.intakeFormConfig;
}

export function isSectionHidden(
  sectionId: IntakeSectionId,
  config?: IntakeFormConfig | null,
): boolean {
  const resolved = resolveIntakeConfig(config);
  const section = resolved.sections?.find((s) => s.id === sectionId);
  return section?.hidden === true;
}

export function isFieldMandatory(
  sectionId: IntakeSectionId,
  fieldId: string,
  config?: IntakeFormConfig | null,
): boolean {
  const resolved = resolveIntakeConfig(config);
  const section = resolved.sections?.find((s) => s.id === sectionId);
  const field = section?.fields?.find((f) => f.id === fieldId);
  if (field?.hidden) return false;
  if (field?.mandatory !== undefined) return field.mandatory;
  return DEFAULT_MANDATORY_FIELDS[sectionId]?.includes(fieldId) ?? false;
}

export function visibleSections(config?: IntakeFormConfig | null): IntakeSectionId[] {
  return INTAKE_SECTION_IDS.filter((id) => !isSectionHidden(id, config));
}
