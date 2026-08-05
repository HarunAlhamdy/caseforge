import { describe, expect, it } from "vitest";
import { getAvailableTransitions, checkGuards } from "@/server/services/workflow-engine";

describe("workflow-engine", () => {
  it("returns available transitions from intake draft", () => {
    const transitions = getAvailableTransitions({
      currentStage: "INTAKE_DRAFT",
      intakeComplete: true,
    });
    expect(transitions.some((t) => t.stage === "INTAKE_COMPLETE")).toBe(true);
  });

  it("checkGuards blocks pilot without wave", () => {
    const guard = checkGuards({
      currentStage: "WAVE_PLANNING",
      targetStage: "PILOT",
      waveAssigned: false,
      feasibilityComplete: true,
    });
    expect(guard.allowed).toBe(false);
  });
});
