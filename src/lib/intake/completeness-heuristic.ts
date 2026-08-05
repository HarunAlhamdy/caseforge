import type { IntakeFormValues } from "./schema";
import type { IntakeSectionId } from "./sections";

export type CompletenessSeverity = "error" | "warning" | "suggestion";

export interface CompletenessWarning {
  severity: CompletenessSeverity;
  message: string;
  section: IntakeSectionId | string;
  field?: string;
}

export interface CompletenessCheckResult {
  warnings: CompletenessWarning[];
  suggestedClassification?: string;
  overallReadiness?: string;
}

function isVague(text: string | undefined | null, minWords = 12): boolean {
  if (!text?.trim()) return true;
  return text.trim().split(/\s+/).length < minWords;
}

/** Rule-based completeness check used when OpenAI is unavailable or as fallback. */
export function runCompletenessHeuristic(
  values: IntakeFormValues,
): CompletenessCheckResult {
  const warnings: CompletenessWarning[] = [];

  if (isVague(values.problemStatement)) {
    warnings.push({
      severity: "error",
      message:
        "Problem statement appears vague — add measurable pain, volume, and business impact.",
      section: "description",
      field: "problemStatement",
    });
  }

  if (values.piiCuiPresent && !values.piiCuiDetail?.trim()) {
    warnings.push({
      severity: "error",
      message: "PII/CUI marked present but no handling detail provided.",
      section: "security",
      field: "piiCuiDetail",
    });
  }

  if (
    values.piiCuiPresent &&
    !values.regulatoryConsiderations?.trim()
  ) {
    warnings.push({
      severity: "warning",
      message:
        "PII/CUI present without regulatory considerations — confirm compliance scope.",
      section: "governance",
      field: "regulatoryConsiderations",
    });
  }

  if (values.writeSystems?.trim() && !values.proposedSolution?.trim()) {
    warnings.push({
      severity: "warning",
      message:
        "Write systems listed but proposed solution does not describe agent write behavior.",
      section: "description",
      field: "proposedSolution",
    });
  }

  if (
    values.conversationalAiRequired &&
    !values.conversationalAiDetail?.trim()
  ) {
    warnings.push({
      severity: "warning",
      message: "Conversational AI required — describe channels and guardrails.",
      section: "consumption",
      field: "conversationalAiDetail",
    });
  }

  if (values.remediationNeeded && !values.remediationPlan?.trim()) {
    warnings.push({
      severity: "error",
      message: "Data remediation flagged but no remediation plan documented.",
      section: "dataQuality",
      field: "remediationPlan",
    });
  }

  if (!values.dataClassification) {
    warnings.push({
      severity: "suggestion",
      message: "Consider classifying data as INTERNAL until security review confirms.",
      section: "security",
      field: "dataClassification",
    });
  }

  const suggestedClassification =
    values.piiCuiPresent === true
      ? "PII"
      : values.dataClassification ?? "INTERNAL";

  return {
    warnings,
    suggestedClassification,
    overallReadiness:
      warnings.some((w) => w.severity === "error")
        ? "needs_work"
        : warnings.length > 0
          ? "review_warnings"
          : "ready",
  };
}

export function intakeValuesToPromptText(values: IntakeFormValues): string {
  return JSON.stringify(values, null, 2);
}
