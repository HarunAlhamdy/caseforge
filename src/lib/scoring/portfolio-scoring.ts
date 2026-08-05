import type {
  PortfolioScoreInput,
  PortfolioScoreResult,
  RiskTierConfigSnapshot,
} from "@/lib/types";
import type { DataReadinessFlag } from "@prisma/client";

export interface WeightedDriver {
  weight: number;
  score: number;
}

export interface PriorityRankItem {
  id: string;
  priorityScore: number;
}

export interface SourceSystemSummary {
  systemName: string;
  accessMethod?: string;
  networkAccess?: string;
}

export interface DataQualityProfile {
  hasKnownIssues: boolean;
  remediationNeeded: boolean;
  dqIssues?: string | null;
}

export interface SensitiveElementSummary {
  dataClassification?: string;
  piiType?: string | null;
  entersLlmContext?: string | null;
}

export interface HypotheticalScore {
  useCaseId: string;
  priorityScore: number;
  rank: number;
}

export interface ReScoreResult {
  useCaseId: string;
  valueScore: number;
  feasibilityScore: number;
  riskScore: number;
  riskTier: string;
  tierMultiplier: number;
  priorityScore: number;
  rank: number;
}

/** Weighted average of driver scores (typically 1–5 scale). */
export function calculateAxisScore(drivers: WeightedDriver[]): number {
  return weightedAxisScore(drivers);
}

/** @deprecated Alias — use calculateAxisScore */
export function weightedAxisScore(drivers: WeightedDriver[]): number {
  if (drivers.length === 0) return 0;

  const totalWeight = drivers.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = drivers.reduce((sum, d) => sum + d.weight * d.score, 0);
  return Math.round((weightedSum / totalWeight) * 1000) / 1000;
}

export function determineRiskTier(
  riskScore: number,
  tiers: RiskTierConfigSnapshot[],
): RiskTierConfigSnapshot {
  const sorted = [...tiers].sort((a, b) => a.upperBound - b.upperBound);
  for (const tier of sorted) {
    if (riskScore <= tier.upperBound) {
      return tier;
    }
  }
  return sorted[sorted.length - 1] ?? {
    tierCode: "R4",
    tierName: "High Impact",
    upperBound: 5,
    multiplier: 0.7,
  };
}

export function calculatePriorityScore(
  valueScore: number,
  feasibilityScore: number,
  valueWeight: number,
  feasibilityWeight: number,
  tierMultiplier: number,
): number {
  return priorityScore(
    valueScore,
    feasibilityScore,
    tierMultiplier,
    valueWeight,
    feasibilityWeight,
  );
}

/**
 * Priority = (value × valueWt + feasibility × feasWt) × risk tier multiplier.
 */
export function priorityScore(
  value: number,
  feasibility: number,
  riskTierMultiplier: number,
  valueWt: number,
  feasWt: number,
): number {
  const composite = value * valueWt + feasibility * feasWt;
  return Math.round(composite * riskTierMultiplier * 1000) / 1000;
}

/** Returns rank map: useCaseId → rank (1 = highest priority). */
export function calculateRanking(
  cases: PriorityRankItem[],
): Map<string, number> {
  const ranked = rankByPriority(cases);
  return new Map(ranked.map((item) => [item.id, item.rank]));
}

export function rankByPriority<T extends PriorityRankItem>(
  items: T[],
): Array<T & { rank: number }> {
  const sorted = [...items].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.id.localeCompare(b.id);
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

export function calculateDataReadiness(
  sources: SourceSystemSummary[],
  dq: DataQualityProfile,
  sensitive: SensitiveElementSummary[],
): DataReadinessFlag {
  let score = 0;

  if (sources.length === 0) score += 2;
  else if (sources.length >= 3) score += 1;

  if (dq.hasKnownIssues) score += 1;
  if (dq.remediationNeeded) score += 1;

  const highSensitivity = sensitive.filter(
    (s) =>
      s.dataClassification === "PII" ||
      s.dataClassification === "PII_SENSITIVE" ||
      s.dataClassification === "PHI" ||
      s.dataClassification === "CUI",
  );
  if (highSensitivity.length > 0 && sources.length === 0) score += 2;

  const llmExposed = sensitive.filter(
    (s) =>
      s.entersLlmContext === "YES_IN_PROMPT" ||
      s.entersLlmContext === "YES_IN_RAG",
  );
  if (llmExposed.length > 3) score += 1;

  if (score >= 4) return "RED";
  if (score >= 2) return "AMBER";
  return "GREEN";
}

/** @deprecated Use calculatePortfolioScore */
export function calculatePortfolioScore(
  input: PortfolioScoreInput,
): PortfolioScoreResult {
  const compositeScore = Math.max(
    0,
    Math.min(
      100,
      input.valueScore * 0.5 +
        input.feasibilityScore * 0.4 -
        input.riskPenalty * 0.1,
    ),
  );

  return {
    compositeScore: Math.round(compositeScore * 100) / 100,
    rank: 0,
  };
}

/** @deprecated Use rankByPriority */
export function rankPortfolioItems(
  items: Array<{ id: string; compositeScore: number }>,
): Array<{ id: string; compositeScore: number; rank: number }> {
  const mapped = items.map((item) => ({
    id: item.id,
    priorityScore: item.compositeScore,
  }));
  const ranked = rankByPriority(mapped);
  return ranked.map((item) => ({
    id: item.id,
    compositeScore: item.priorityScore,
    rank: item.rank,
  }));
}
