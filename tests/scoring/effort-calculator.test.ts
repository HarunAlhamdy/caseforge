import { describe, expect, it } from "vitest";
import { calculateEffort } from "@/lib/scoring/effort-calculator";
import { CostBand } from "@/lib/constants/enums";

describe("effort-calculator", () => {
  it("calculates hours by discipline", () => {
    const estimate = calculateEffort({
      sourceSystemCount: 2,
      integrationComplexity: 3,
      piiInLlm: false,
      aiPattern: "RAG",
      guardrailCount: 2,
      corpusDocCount: 500,
      agentToolCount: 2,
      writeActionCount: 1,
      autonomyLevel: 3,
      endUserPersonaCount: 2,
      haRequired: false,
      redTeamRequired: false,
    });

    expect(estimate.totalEstimatedHrs).toBeGreaterThan(0);
    expect(estimate.dataEngineeringHrs).toBeGreaterThan(0);
    expect(estimate.aiDevelopmentHrs).toBeGreaterThan(estimate.integrationHrs);
  });

  it("increases security hours when PII in LLM", () => {
    const base = calculateEffort({
      sourceSystemCount: 1,
      integrationComplexity: 2,
      piiInLlm: false,
      aiPattern: "CLASSIFICATION",
      guardrailCount: 1,
      corpusDocCount: 100,
      agentToolCount: 0,
      writeActionCount: 0,
      autonomyLevel: 2,
      endUserPersonaCount: 1,
      haRequired: false,
      redTeamRequired: false,
    });
    const withPii = calculateEffort({
      ...{
        sourceSystemCount: 1,
        integrationComplexity: 2,
        piiInLlm: true,
        aiPattern: "CLASSIFICATION",
        guardrailCount: 1,
        corpusDocCount: 100,
        agentToolCount: 0,
        writeActionCount: 0,
        autonomyLevel: 2,
        endUserPersonaCount: 1,
        haRequired: false,
        redTeamRequired: false,
      },
    });
    expect(withPii.securityComplianceHrs).toBeGreaterThan(
      base.securityComplianceHrs,
    );
  });

  it("assigns cost band based on total hours", () => {
    const small = calculateEffort({
      sourceSystemCount: 1,
      integrationComplexity: 1,
      piiInLlm: false,
      aiPattern: "CLASSIFICATION",
      guardrailCount: 0,
      corpusDocCount: 0,
      agentToolCount: 0,
      writeActionCount: 0,
      autonomyLevel: 1,
      endUserPersonaCount: 1,
      haRequired: false,
      redTeamRequired: false,
      blendedHourlyRate: 150,
    });
    expect(small.calculatedCostBand).toBe(CostBand.S_UNDER_50K);
  });

  it("calculates monthly run cost", () => {
    const estimate = calculateEffort({
      sourceSystemCount: 1,
      integrationComplexity: 2,
      piiInLlm: false,
      aiPattern: "RAG",
      guardrailCount: 1,
      corpusDocCount: 100,
      agentToolCount: 1,
      writeActionCount: 0,
      autonomyLevel: 2,
      endUserPersonaCount: 1,
      haRequired: false,
      redTeamRequired: false,
      monthlyLlmCost: 1000,
      monthlyInfraCost: 500,
      hitlHoursPerMonth: 10,
    });
    expect(estimate.estMonthlyRunCost).toBeGreaterThan(1500);
  });
});
