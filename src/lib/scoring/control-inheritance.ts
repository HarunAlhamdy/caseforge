import type { AiPattern, LlmContextEntry, PiiType } from "@prisma/client";

export interface SensitiveDataElementInput {
  id: string;
  fieldColumnName?: string | null;
  dataClassification?: string;
  piiType?: PiiType | null;
  entersLlmContext?: LlmContextEntry | null;
  rightToErasure?: boolean;
  crossBorderTransfer?: boolean;
}

export interface ArchitectureContext {
  aiPattern?: AiPattern | null;
  agentWriteActions?: Array<{ system?: string; action?: string }> | null;
  corpusSensitiveData?: boolean | null;
}

export interface SecurityContext {
  dataClassification?: string | null;
}

export interface MandatoryControl {
  controlCode: string;
  controlName: string;
  controlDescription: string;
  triggeredBy: string;
}

const LLM_CONTEXT_VALUES: LlmContextEntry[] = [
  "YES_IN_PROMPT",
  "YES_IN_RAG",
];

function entersLlm(element: SensitiveDataElementInput): boolean {
  return (
    element.entersLlmContext != null &&
    LLM_CONTEXT_VALUES.includes(element.entersLlmContext)
  );
}

function isPiiClassification(classification?: string): boolean {
  return (
    classification === "PII" ||
    classification === "PII_SENSITIVE" ||
    classification === "PHI"
  );
}

export function determineControls(
  elements: SensitiveDataElementInput[],
  architecture: ArchitectureContext,
  security: SecurityContext,
): MandatoryControl[] {
  void security;
  const controls: MandatoryControl[] = [];
  const seen = new Set<string>();

  const addControl = (control: MandatoryControl) => {
    if (seen.has(control.controlCode)) return;
    seen.add(control.controlCode);
    controls.push(control);
  };

  const piiInLlm = elements.filter(
    (e) => isPiiClassification(e.dataClassification) && entersLlm(e),
  );

  if (piiInLlm.length > 0) {
    addControl({
      controlCode: "CTRL-PII-LLM-001",
      controlName: "Pre-LLM tokenization pipeline",
      controlDescription:
        "Tokenize or mask PII before data enters LLM context",
      triggeredBy: "PII field enters LLM context",
    });
    addControl({
      controlCode: "CTRL-PII-LLM-002",
      controlName: "Post-LLM PII output scan",
      controlDescription: "Scan model output for PII leakage before delivery",
      triggeredBy: "PII field enters LLM context",
    });
    addControl({
      controlCode: "CTRL-PII-LLM-003",
      controlName: "PII-free logging",
      controlDescription: "Ensure logs exclude raw PII values",
      triggeredBy: "PII field enters LLM context",
    });
  }

  const ssnTaxFinancial = elements.filter(
    (e) =>
      e.piiType === "SSN" ||
      e.piiType === "TAX_ID" ||
      e.piiType === "FINANCIAL_ACCOUNT" ||
      e.dataClassification === "FINANCIAL",
  );
  if (ssnTaxFinancial.length > 0) {
    addControl({
      controlCode: "CTRL-FIN-001",
      controlName: "Field-level encryption at rest",
      controlDescription: "Encrypt sensitive financial identifiers at rest",
      triggeredBy: "SSN/Tax ID/Financial account in scope",
    });
    addControl({
      controlCode: "CTRL-FIN-002",
      controlName: "Tokenization before processing",
      controlDescription: "Tokenize values before any processing or LLM use",
      triggeredBy: "SSN/Tax ID/Financial account in scope",
    });
    addControl({
      controlCode: "CTRL-FIN-003",
      controlName: "No raw values in logs",
      controlDescription: "Prohibit raw financial identifiers in any log",
      triggeredBy: "SSN/Tax ID/Financial account in scope",
    });
  }

  const phiElements = elements.filter(
    (e) =>
      e.dataClassification === "PHI" ||
      e.piiType === "HEALTH_RECORD",
  );
  if (phiElements.length > 0) {
    addControl({
      controlCode: "CTRL-PHI-001",
      controlName: "BAA with LLM provider",
      controlDescription: "Business Associate Agreement with LLM provider",
      triggeredBy: "PHI in scope",
    });
    addControl({
      controlCode: "CTRL-PHI-002",
      controlName: "Minimum necessary standard",
      controlDescription: "Limit PHI exposure to minimum necessary",
      triggeredBy: "PHI in scope",
    });
    addControl({
      controlCode: "CTRL-PHI-003",
      controlName: "6-year access audit trail",
      controlDescription: "Maintain 6-year audit trail for PHI access",
      triggeredBy: "PHI in scope",
    });
  }

  const cuiElements = elements.filter((e) => e.dataClassification === "CUI");
  if (cuiElements.length > 0) {
    addControl({
      controlCode: "CTRL-CUI-001",
      controlName: "FedRAMP environment required",
      controlDescription: "Deploy in FedRAMP-authorized environment",
      triggeredBy: "CUI in scope",
    });
    addControl({
      controlCode: "CTRL-CUI-002",
      controlName: "NIST 800-171 controls",
      controlDescription: "Implement NIST 800-171 control set",
      triggeredBy: "CUI in scope",
    });
  }

  const crossBorder = elements.filter((e) => e.crossBorderTransfer);
  if (crossBorder.length > 0) {
    addControl({
      controlCode: "CTRL-XBORDER-001",
      controlName: "Transfer impact assessment",
      controlDescription: "Complete cross-border transfer impact assessment",
      triggeredBy: "Cross-border data transfer",
    });
    addControl({
      controlCode: "CTRL-XBORDER-002",
      controlName: "Standard Contractual Clauses",
      controlDescription: "Execute SCCs for international transfers",
      triggeredBy: "Cross-border data transfer",
    });
  }

  const erasureFields = elements.filter((e) => e.rightToErasure);
  if (erasureFields.length > 0) {
    addControl({
      controlCode: "CTRL-ERASE-001",
      controlName: "Deletion in vector store + logs",
      controlDescription:
        "Support deletion in vector store, logs, and backups within 30 days",
      triggeredBy: "Right-to-erasure fields in scope",
    });
  }

  const writeActions = architecture.agentWriteActions ?? [];
  const financialWrites = writeActions.filter(
    (a) =>
      (a.system ?? "").toLowerCase().includes("financial") ||
      (a.system ?? "").toLowerCase().includes("erp") ||
      (a.action ?? "").toLowerCase().includes("payment"),
  );
  if (financialWrites.length > 0) {
    addControl({
      controlCode: "CTRL-SOX-001",
      controlName: "SOX change logging",
      controlDescription: "Log all financial system write actions for SOX",
      triggeredBy: "Agent writes to financial systems",
    });
    addControl({
      controlCode: "CTRL-SOX-002",
      controlName: "Dual-approval workflow",
      controlDescription: "Require dual approval for financial write actions",
      triggeredBy: "Agent writes to financial systems",
    });
  }

  const hrWrites = writeActions.filter(
    (a) =>
      (a.system ?? "").toLowerCase().includes("hr") ||
      (a.system ?? "").toLowerCase().includes("payroll"),
  );
  if (hrWrites.length > 0) {
    addControl({
      controlCode: "CTRL-HR-001",
      controlName: "Employee notification",
      controlDescription: "Notify employees of automated HR/payroll actions",
      triggeredBy: "Agent writes to HR/payroll",
    });
    addControl({
      controlCode: "CTRL-HR-002",
      controlName: "Grievance path",
      controlDescription: "Provide grievance path for HR automation decisions",
      triggeredBy: "Agent writes to HR/payroll",
    });
  }

  const piiFieldCount = elements.filter((e) =>
    isPiiClassification(e.dataClassification),
  ).length;
  if (piiFieldCount >= 6) {
    addControl({
      controlCode: "CTRL-DPIA-001",
      controlName: "Mandatory DPIA before pilot",
      controlDescription:
        "Complete Data Protection Impact Assessment before pilot",
      triggeredBy: "6+ PII fields in scope",
    });
  }

  const biometric = elements.filter((e) => e.piiType === "BIOMETRIC");
  if (biometric.length > 0) {
    addControl({
      controlCode: "CTRL-BIO-001",
      controlName: "Explicit consent mechanism",
      controlDescription: "Obtain explicit consent for biometric processing",
      triggeredBy: "Biometric data in scope",
    });
    addControl({
      controlCode: "CTRL-BIO-002",
      controlName: "Purpose limitation",
      controlDescription: "Limit biometric use to stated purpose only",
      triggeredBy: "Biometric data in scope",
    });
    addControl({
      controlCode: "CTRL-BIO-003",
      controlName: "State-law compliance check",
      controlDescription: "Verify compliance with applicable state biometric laws",
      triggeredBy: "Biometric data in scope",
    });
  }

  if (architecture.corpusSensitiveData && architecture.aiPattern === "RAG") {
    addControl({
      controlCode: "CTRL-RAG-001",
      controlName: "Corpus sensitivity review",
      controlDescription: "Review and classify sensitive data in RAG corpus",
      triggeredBy: "Sensitive data in RAG corpus",
    });
  }

  return controls;
}

/** @deprecated Use determineControls */
export function resolveControlInheritance(input: {
  parentControls: string[];
  childOverrides: string[];
}): { effectiveControls: string[]; inheritedCount: number } {
  const effectiveControls = Array.from(
    new Set([...input.parentControls, ...input.childOverrides]),
  );
  return {
    effectiveControls,
    inheritedCount: input.parentControls.length,
  };
}
