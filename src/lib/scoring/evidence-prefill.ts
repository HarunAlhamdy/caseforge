import { DRIVER_EVIDENCE_MAPPINGS } from "@/lib/constants/seed-data";

type UseCaseEvidenceSource = Record<string, unknown>;

function formatValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function buildDriverEvidencePrefill(
  driverName: string,
  useCase: UseCaseEvidenceSource,
  profileNotes?: Record<string, string>,
): string {
  const fields = DRIVER_EVIDENCE_MAPPINGS[driverName] ?? [];
  const parts: string[] = [];

  for (const field of fields) {
    const value = formatValue(useCase[field]);
    if (value) parts.push(`${field}: ${value}`);
  }

  if (profileNotes) {
    for (const [key, note] of Object.entries(profileNotes)) {
      if (note.trim()) parts.push(`${key}: ${note}`);
    }
  }

  return parts.join("\n");
}

export function buildAllDriverEvidence(
  driverNames: string[],
  useCase: UseCaseEvidenceSource,
  profileNotesBySection?: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of driverNames) {
    result[name] = buildDriverEvidencePrefill(
      name,
      useCase,
      profileNotesBySection,
    );
  }
  return result;
}

export function buildFeasibilityEvidencePrefill(
  questionText: string,
  useCase: UseCaseEvidenceSource,
): string {
  const lower = questionText.toLowerCase();
  const parts: string[] = [];

  if (lower.includes("data") || lower.includes("source")) {
    const v = formatValue(useCase.sourceSystemsText);
    if (v) parts.push(`Source systems: ${v}`);
    const dq = formatValue(useCase.dqIssues);
    if (dq) parts.push(`DQ issues: ${dq}`);
  }
  if (lower.includes("security") || lower.includes("pii")) {
    const c = formatValue(useCase.dataClassification);
    if (c) parts.push(`Classification: ${c}`);
  }
  if (lower.includes("integration") || lower.includes("endpoint")) {
    const r = formatValue(useCase.readSystems);
    if (r) parts.push(`Read systems: ${r}`);
  }
  if (lower.includes("stakeholder") || lower.includes("user")) {
    const p = formatValue(useCase.endUserPersonas);
    if (p) parts.push(`Personas: ${p}`);
  }

  return parts.join("\n");
}
