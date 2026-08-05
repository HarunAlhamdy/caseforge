import type { CompositeVerdict } from "@prisma/client";
import { COMPOSITE_VERDICT_BANDS } from "@/lib/constants/seed-data";

export interface FeasibilityScoreInput {
  dataReadiness: number;
  technicalComplexity: number;
  orgReadiness: number;
}

export interface FeasibilityScoreResult {
  score: number;
  band: "LOW" | "MEDIUM" | "HIGH";
}

export function calculateDimensionAverage(scores: number[]): number {
  const valid = scores.filter((s) => s > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 1000) / 1000;
}

export function calculateCompositeFeasibility(
  dimensions: Array<{ weight: number; avg: number }>,
): number {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = dimensions.reduce(
    (sum, d) => sum + d.weight * d.avg,
    0,
  );
  return Math.round((weighted / totalWeight) * 1000) / 1000;
}

export function determineVerdict(
  compositeScore: number,
  bands: number[] = COMPOSITE_VERDICT_BANDS,
): CompositeVerdict {
  const [notReady, conditional, strongGo] = bands;
  if (compositeScore >= (strongGo ?? 4.0)) return "STRONG_GO";
  if (compositeScore >= (conditional ?? 3.0)) return "CONDITIONAL_GO";
  if (compositeScore >= (notReady ?? 2.5)) return "NOT_READY";
  return "NO_GO";
}

/** @deprecated Use calculateCompositeFeasibility + determineVerdict */
export function calculateFeasibilityScore(
  input: FeasibilityScoreInput,
): FeasibilityScoreResult {
  const score =
    input.dataReadiness * 0.4 +
    input.technicalComplexity * 0.35 +
    input.orgReadiness * 0.25;

  const clamped = Math.max(0, Math.min(100, score));
  let band: FeasibilityScoreResult["band"] = "LOW";
  if (clamped >= 70) band = "HIGH";
  else if (clamped >= 40) band = "MEDIUM";

  return { score: Math.round(clamped * 100) / 100, band };
}

export function dimensionColorClass(avg: number): string {
  if (avg >= 4) return "text-emerald-700 bg-emerald-50";
  if (avg >= 3) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export function verdictBadgeVariant(
  verdict: CompositeVerdict,
): "success" | "warning" | "danger" | "info" {
  switch (verdict) {
    case "STRONG_GO":
      return "success";
    case "CONDITIONAL_GO":
      return "warning";
    case "NOT_READY":
      return "info";
    case "NO_GO":
      return "danger";
    default:
      return "info";
  }
}
