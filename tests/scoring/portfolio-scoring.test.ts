import { describe, expect, it } from "vitest";
import {
  calculateAxisScore,
  calculateDataReadiness,
  calculatePriorityScore,
  calculateRanking,
  determineRiskTier,
} from "@/lib/scoring/portfolio-scoring";
import { DEFAULT_RISK_TIERS } from "@/lib/constants/scoring-template";

describe("portfolio-scoring API", () => {
  it("calculateAxisScore computes weighted average", () => {
    expect(
      calculateAxisScore([
        { weight: 0.5, score: 4 },
        { weight: 0.5, score: 2 },
      ]),
    ).toBe(3);
  });

  it("calculateAxisScore returns 0 for empty drivers", () => {
    expect(calculateAxisScore([])).toBe(0);
  });

  it("calculatePriorityScore applies tier multiplier", () => {
    expect(calculatePriorityScore(4, 3, 0.5, 0.5, 0.85)).toBe(2.975);
  });

  it("calculateRanking returns Map with correct ranks", () => {
    const ranks = calculateRanking([
      { id: "a", priorityScore: 2.5 },
      { id: "b", priorityScore: 3.8 },
      { id: "c", priorityScore: 3.8 },
    ]);
    expect(ranks.get("b")).toBe(1);
    expect(ranks.get("c")).toBe(2);
    expect(ranks.get("a")).toBe(3);
  });

  it("determineRiskTier selects correct tier", () => {
    const tier = determineRiskTier(1.5, DEFAULT_RISK_TIERS);
    expect(tier.tierCode).toBe("R1_MINIMAL");
  });

  it("calculateDataReadiness returns RED for missing sources with sensitive data", () => {
    const flag = calculateDataReadiness(
      [],
      { hasKnownIssues: true, remediationNeeded: true },
      [{ dataClassification: "PII", entersLlmContext: "YES_IN_PROMPT" }],
    );
    expect(flag).toBe("RED");
  });

  it("calculateDataReadiness returns GREEN for clean profile", () => {
    const flag = calculateDataReadiness(
      [{ systemName: "ERP" }],
      { hasKnownIssues: false, remediationNeeded: false },
      [],
    );
    expect(flag).toBe("GREEN");
  });
});
