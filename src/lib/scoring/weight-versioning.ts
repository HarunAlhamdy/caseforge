import {
  calculateAxisScore,
  calculatePriorityScore,
  calculateRanking,
  determineRiskTier,
  rankByPriority,
} from "@/lib/scoring/portfolio-scoring";
import type {
  RiskTierConfigSnapshot,
  ScoringDriverSnapshot,
  WeightImpactPreview,
} from "@/lib/types";
import type { RiskTier } from "@prisma/client";

export interface WeightVersionSnapshot {
  valueDrivers: ScoringDriverSnapshot[];
  feasibilityDrivers: ScoringDriverSnapshot[];
  riskDrivers: ScoringDriverSnapshot[];
  valueWeightInPriority: number;
  feasibilityWeightInPriority: number;
  riskTierConfig: RiskTierConfigSnapshot[];
}

export interface RescoreCaseInput {
  id: string;
  useCaseNumber: string;
  title: string;
  driverScores: Record<string, number>;
  priorityScore?: number | null;
  rank?: number | null;
}

export interface ScoringSnapshotRecord {
  useCaseId: string;
  versionId: string;
  valueScore: number;
  feasibilityScore: number;
  riskScore: number;
  riskTier: RiskTier;
  tierMultiplier: number;
  priorityScore: number;
  rank: number;
}

export interface RankComparison {
  useCaseId: string;
  rankA: number;
  rankB: number;
  priorityA: number;
  priorityB: number;
  rankDelta: number;
}

export interface WeightVersion {
  versionId: string;
  weights: Record<string, number>;
  status: string;
}

export function normalizeWeights(
  weights: Record<string, number>,
): Record<string, number> {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) return weights;

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = Math.round((value / total) * 10000) / 10000;
  }
  return normalized;
}

export function normalizeAxisWeights(
  drivers: ScoringDriverSnapshot[],
): ScoringDriverSnapshot[] {
  const total = drivers.reduce((sum, d) => sum + d.weight, 0);
  if (total === 0) return drivers;

  return drivers.map((d) => ({
    ...d,
    weight: Math.round((d.weight / total) * 10000) / 10000,
  }));
}

export function createVersionSnapshot(
  weights: WeightVersionSnapshot,
): WeightVersionSnapshot {
  return {
    valueDrivers: normalizeAxisWeights(weights.valueDrivers),
    feasibilityDrivers: normalizeAxisWeights(weights.feasibilityDrivers),
    riskDrivers: normalizeAxisWeights(weights.riskDrivers),
    valueWeightInPriority: weights.valueWeightInPriority,
    feasibilityWeightInPriority: weights.feasibilityWeightInPriority,
    riskTierConfig: weights.riskTierConfig,
  };
}

function axisDriversToWeighted(
  drivers: ScoringDriverSnapshot[],
  driverScores: Record<string, number>,
) {
  return drivers.map((d) => ({
    weight: d.weight,
    score: driverScores[d.driverId] ?? 3,
  }));
}

function scoreCaseWithWeights(
  driverScores: Record<string, number>,
  weights: WeightVersionSnapshot,
) {
  const valueScore = calculateAxisScore(
    axisDriversToWeighted(weights.valueDrivers, driverScores),
  );
  const feasibilityScore = calculateAxisScore(
    axisDriversToWeighted(weights.feasibilityDrivers, driverScores),
  );
  const riskScore = calculateAxisScore(
    axisDriversToWeighted(weights.riskDrivers, driverScores),
  );

  const tier = determineRiskTier(riskScore, weights.riskTierConfig);
  const computedPriority = calculatePriorityScore(
    valueScore,
    feasibilityScore,
    weights.valueWeightInPriority,
    weights.feasibilityWeightInPriority,
    tier.multiplier,
  );

  return {
    valueScore,
    feasibilityScore,
    riskScore,
    riskTier: tier.tierCode as RiskTier,
    tierMultiplier: tier.multiplier,
    priorityScore: computedPriority,
  };
}

export function generateChangeSummary(
  oldVersion: WeightVersionSnapshot,
  newVersion: WeightVersionSnapshot,
): string {
  return summarizeWeightChanges(oldVersion, newVersion);
}

/** @deprecated Use generateChangeSummary */
export function summarizeWeightChanges(
  oldWeights: WeightVersionSnapshot,
  newWeights: WeightVersionSnapshot,
): string {
  const parts: string[] = [];

  const compareDrivers = (
    label: string,
    oldDrivers: ScoringDriverSnapshot[],
    newDrivers: ScoringDriverSnapshot[],
  ) => {
    const newById = new Map(newDrivers.map((d) => [d.driverId, d]));
    for (const oldDriver of oldDrivers) {
      const updated = newById.get(oldDriver.driverId);
      if (!updated) continue;
      const oldPct = Math.round(oldDriver.weight * 100);
      const newPct = Math.round(updated.weight * 100);
      if (oldPct !== newPct) {
        parts.push(
          `${label}: ${oldDriver.driverName} ${oldPct}%→${newPct}%`,
        );
      }
    }
  };

  compareDrivers("Value", oldWeights.valueDrivers, newWeights.valueDrivers);
  compareDrivers(
    "Feasibility",
    oldWeights.feasibilityDrivers,
    newWeights.feasibilityDrivers,
  );
  compareDrivers("Risk", oldWeights.riskDrivers, newWeights.riskDrivers);

  const oldValueWt = Math.round(oldWeights.valueWeightInPriority * 100);
  const newValueWt = Math.round(newWeights.valueWeightInPriority * 100);
  if (oldValueWt !== newValueWt) {
    parts.push(`Priority value weight ${oldValueWt}%→${newValueWt}%`);
  }

  return parts.length > 0 ? parts.join("; ") : "No weight changes";
}

export function calculateHypothetical(
  activeCases: RescoreCaseInput[],
  currentScores: Map<string, { priorityScore: number; rank: number }>,
  proposedVersion: WeightVersionSnapshot,
): WeightImpactPreview[] {
  void currentScores;
  return hypotheticalRescore(activeCases, proposedVersion);
}

/** @deprecated Use calculateHypothetical */
export function hypotheticalRescore(
  cases: RescoreCaseInput[],
  newWeights: WeightVersionSnapshot,
): WeightImpactPreview[] {
  const normalized = createVersionSnapshot(newWeights);

  const currentRanked = rankByPriority(
    cases.map((c) => ({
      id: c.id,
      priorityScore: c.priorityScore ?? 0,
    })),
  );
  const currentRankById = new Map(currentRanked.map((c) => [c.id, c.rank]));

  const proposed = cases.map((c) => {
    const scored = scoreCaseWithWeights(c.driverScores, normalized);
    return {
      id: c.id,
      useCaseNumber: c.useCaseNumber,
      title: c.title,
      priorityScore: scored.priorityScore,
    };
  });

  const proposedRanked = rankByPriority(
    proposed.map((p) => ({ id: p.id, priorityScore: p.priorityScore })),
  );
  const proposedRankById = new Map(proposedRanked.map((p) => [p.id, p.rank]));

  return proposed.map((p) => {
    const currentRank = currentRankById.get(p.id) ?? 0;
    const proposedRank = proposedRankById.get(p.id) ?? 0;
    const original = cases.find((c) => c.id === p.id);

    return {
      useCaseId: p.id,
      useCaseNumber: p.useCaseNumber,
      title: p.title,
      currentPriorityScore: original?.priorityScore ?? 0,
      proposedPriorityScore: p.priorityScore,
      currentRank,
      proposedRank,
      rankDelta: currentRank - proposedRank,
    };
  });
}

export function reScorePortfolio(
  activeCases: RescoreCaseInput[],
  _allScores: Record<string, Record<string, number>>,
  newVersion: WeightVersionSnapshot,
): Array<RescoreCaseInput & ReturnType<typeof scoreCaseWithWeights> & { rank: number }> {
  void _allScores;
  const normalized = createVersionSnapshot(newVersion);

  const rescored = activeCases.map((uc) => ({
    ...uc,
    ...scoreCaseWithWeights(uc.driverScores, normalized),
  }));

  const rankMap = calculateRanking(
    rescored.map((r) => ({ id: r.id, priorityScore: r.priorityScore })),
  );

  return rescored.map((r) => ({
    ...r,
    rank: rankMap.get(r.id) ?? 0,
  }));
}

export function createSnapshots(
  activeCases: Array<RescoreCaseInput & ReturnType<typeof scoreCaseWithWeights>>,
  beingSuperseded: { versionId: string },
): ScoringSnapshotRecord[] {
  const rankMap = calculateRanking(
    activeCases.map((c) => ({ id: c.id, priorityScore: c.priorityScore })),
  );

  return activeCases.map((c) => ({
    useCaseId: c.id,
    versionId: beingSuperseded.versionId,
    valueScore: c.valueScore,
    feasibilityScore: c.feasibilityScore,
    riskScore: c.riskScore,
    riskTier: c.riskTier,
    tierMultiplier: c.tierMultiplier,
    priorityScore: c.priorityScore,
    rank: rankMap.get(c.id) ?? 0,
  }));
}

export function compareVersions(
  snapshotsV1: ScoringSnapshotRecord[],
  snapshotsV2: ScoringSnapshotRecord[],
): RankComparison[] {
  const v2ByUseCase = new Map(snapshotsV2.map((s) => [s.useCaseId, s]));

  return snapshotsV1.map((a) => {
    const b = v2ByUseCase.get(a.useCaseId);
    return {
      useCaseId: a.useCaseId,
      rankA: a.rank,
      rankB: b?.rank ?? 0,
      priorityA: a.priorityScore,
      priorityB: b?.priorityScore ?? 0,
      rankDelta: b ? a.rank - b.rank : 0,
    };
  });
}

/** @deprecated Use createVersionSnapshot */
export function applyWeightVersion(
  version: WeightVersion,
  scores: Record<string, number>,
): number {
  const weights = normalizeWeights(version.weights);
  return Object.entries(scores).reduce(
    (total, [axis, score]) => total + (weights[axis] ?? 0) * score,
    0,
  );
}

/** @deprecated Use createVersionSnapshot */
export function createDraftWeightVersion(
  versionId: string,
  weights: Record<string, number>,
): WeightVersion {
  return {
    versionId,
    weights: normalizeWeights(weights),
    status: "DRAFT",
  };
}
