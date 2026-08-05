import { RiskTier as RiskTierValues } from "@/lib/constants/enums";
import type { RiskTierInput, RiskTierResult } from "@/lib/types";
import type { RiskTier } from "@prisma/client";

/**
 * TODO(Prompt 8): Replace with full risk tier matrix from governance spec.
 */
export function calculateRiskTier(input: RiskTierInput): RiskTierResult {
  let score = input.autonomyLevel * 10;
  if (input.piiPresent) score += 25;
  if (input.dataClassification.includes("PII")) score += 20;
  if (input.dataClassification.includes("PHI")) score += 30;

  let tier: RiskTier = RiskTierValues.R1_MINIMAL;
  if (score >= 75) tier = RiskTierValues.R4_HIGH_IMPACT;
  else if (score >= 50) tier = RiskTierValues.R3_ELEVATED;
  else if (score >= 25) tier = RiskTierValues.R2_LIMITED;

  return { tier, score: Math.min(100, score) };
}
