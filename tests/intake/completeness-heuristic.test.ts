import { describe, expect, it } from "vitest";
import { runCompletenessHeuristic } from "@/lib/intake/completeness-heuristic";

describe("runCompletenessHeuristic", () => {
  it("flags vague problem statements", () => {
    const result = runCompletenessHeuristic({
      problemStatement: "Too short",
      piiCuiPresent: false,
    });
    expect(result.warnings.some((w) => w.section === "description")).toBe(true);
  });

  it("flags PII without regulatory context", () => {
    const result = runCompletenessHeuristic({
      problemStatement: "This is a sufficiently long problem statement with enough words to pass the vague check easily.",
      piiCuiPresent: true,
      piiCuiDetail: "Customer names and emails",
    });
    expect(result.warnings.some((w) => w.section === "governance")).toBe(true);
  });

  it("returns ready when no blocking issues", () => {
    const result = runCompletenessHeuristic({
      problemStatement:
        "Manual invoice processing takes forty hours per week across three FTEs with a twelve percent error rate causing rework.",
      proposedSolution: "Agent reads ERP invoices and posts approved entries.",
      piiCuiPresent: false,
      dataClassification: "INTERNAL",
    });
    expect(result.overallReadiness).toBe("ready");
  });
});
