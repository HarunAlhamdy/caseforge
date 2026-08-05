import { describe, expect, it } from "vitest";
import { checkTransitionGuards } from "@/lib/workflow/transition-guards";

describe("checkTransitionGuards", () => {
  it("allows valid transition with satisfied guards", () => {
    const result = checkTransitionGuards({
      currentStage: "GATING_REVIEW",
      targetStage: "PORTFOLIO_SCORING",
      gateDecision: "PASS",
      portfolioScored: false,
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks portfolio scoring without gate pass", () => {
    const result = checkTransitionGuards({
      currentStage: "GATING_REVIEW",
      targetStage: "PORTFOLIO_SCORING",
      gateDecision: "GATE_A",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toMatch(/Gating review must pass/);
  });

  it("blocks deep feasibility without portfolio scored", () => {
    const result = checkTransitionGuards({
      currentStage: "PORTFOLIO_SCORING",
      targetStage: "DEEP_FEASIBILITY",
      portfolioScored: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks invalid state machine transition", () => {
    const result = checkTransitionGuards({
      currentStage: "INTAKE_DRAFT",
      targetStage: "PRODUCTION",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toMatch(/Invalid transition/);
  });
});
