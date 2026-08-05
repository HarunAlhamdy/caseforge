import { describe, expect, it } from "vitest";
import {
  compareVersions,
  createSnapshots,
  createVersionSnapshot,
  generateChangeSummary,
  hypotheticalRescore,
  reScorePortfolio,
} from "@/lib/scoring/weight-versioning";
import type { ScoringDriverSnapshot } from "@/lib/types";
import { DEFAULT_RISK_TIERS } from "@/lib/constants/scoring-template";

const valueDrivers: ScoringDriverSnapshot[] = [
  { driverId: "v1", driverName: "Financial", weight: 0.5, axisType: "VALUE" },
  { driverId: "v2", driverName: "Strategic", weight: 0.5, axisType: "VALUE" },
];

describe("weight-versioning API", () => {
  it("generateChangeSummary describes driver deltas", () => {
    const oldWeights = createVersionSnapshot({
      valueDrivers,
      feasibilityDrivers: valueDrivers,
      riskDrivers: valueDrivers,
      valueWeightInPriority: 0.5,
      feasibilityWeightInPriority: 0.5,
      riskTierConfig: DEFAULT_RISK_TIERS,
    });
    const newWeights = createVersionSnapshot({
      valueDrivers: [
        { driverId: "v1", driverName: "Financial", weight: 0.7, axisType: "VALUE" },
        { driverId: "v2", driverName: "Strategic", weight: 0.3, axisType: "VALUE" },
      ],
      feasibilityDrivers: valueDrivers,
      riskDrivers: valueDrivers,
      valueWeightInPriority: 0.6,
      feasibilityWeightInPriority: 0.4,
      riskTierConfig: DEFAULT_RISK_TIERS,
    });

    const summary = generateChangeSummary(oldWeights, newWeights);
    expect(summary).toContain("Financial");
    expect(summary).toContain("Priority value weight");
  });

  it("reScorePortfolio returns ranked results", () => {
    const weights = createVersionSnapshot({
      valueDrivers,
      feasibilityDrivers: valueDrivers,
      riskDrivers: valueDrivers,
      valueWeightInPriority: 0.5,
      feasibilityWeightInPriority: 0.5,
      riskTierConfig: DEFAULT_RISK_TIERS,
    });

    const results = reScorePortfolio(
      [
        {
          id: "uc1",
          useCaseNumber: "UC-001",
          title: "Alpha",
          driverScores: { v1: 5, v2: 5 },
        },
        {
          id: "uc2",
          useCaseNumber: "UC-002",
          title: "Beta",
          driverScores: { v1: 2, v2: 2 },
        },
      ],
      {},
      weights,
    );

    expect(results[0]?.rank).toBe(1);
    expect(results[0]?.priorityScore).toBeGreaterThan(results[1]?.priorityScore ?? 0);
  });

  it("createSnapshots assigns version and ranks", () => {
    const snapshots = createSnapshots(
      [
        {
          id: "uc1",
          useCaseNumber: "UC-001",
          title: "A",
          driverScores: {},
          valueScore: 4,
          feasibilityScore: 3,
          riskScore: 2,
          riskTier: "R1_MINIMAL",
          tierMultiplier: 1,
          priorityScore: 3.5,
        },
      ],
      { versionId: "ver-1" },
    );
    expect(snapshots[0]?.versionId).toBe("ver-1");
    expect(snapshots[0]?.rank).toBe(1);
  });

  it("compareVersions computes rank deltas", () => {
    const comparisons = compareVersions(
      [
        {
          useCaseId: "uc1",
          versionId: "v1",
          valueScore: 4,
          feasibilityScore: 3,
          riskScore: 2,
          riskTier: "R1_MINIMAL",
          tierMultiplier: 1,
          priorityScore: 3.5,
          rank: 1,
        },
      ],
      [
        {
          useCaseId: "uc1",
          versionId: "v2",
          valueScore: 3,
          feasibilityScore: 3,
          riskScore: 2,
          riskTier: "R1_MINIMAL",
          tierMultiplier: 1,
          priorityScore: 3,
          rank: 2,
        },
      ],
    );
    expect(comparisons[0]?.rankDelta).toBe(-1);
  });

  it("hypotheticalRescore returns rank changes", () => {
    const weights = createVersionSnapshot({
      valueDrivers,
      feasibilityDrivers: valueDrivers,
      riskDrivers: valueDrivers,
      valueWeightInPriority: 0.5,
      feasibilityWeightInPriority: 0.5,
      riskTierConfig: DEFAULT_RISK_TIERS,
    });

    const impact = hypotheticalRescore(
      [
        {
          id: "uc1",
          useCaseNumber: "UC-001",
          title: "Alpha",
          driverScores: { v1: 5, v2: 5 },
          priorityScore: 4,
          rank: 1,
        },
      ],
      weights,
    );

    expect(impact).toHaveLength(1);
    expect(typeof impact[0]?.proposedRank).toBe("number");
  });
});
