import { describe, expect, it } from "vitest";
import {
  calculateCompositeFeasibility,
  calculateDimensionAverage,
  determineVerdict,
} from "@/lib/scoring/feasibility-scoring";
import {
  calculateNPV,
  calculateNetAnnualBenefit,
  calculatePaybackMonths,
  calculateYear1ROI,
} from "@/lib/scoring/financial-calculator";

describe("feasibility-scoring", () => {
  it("calculateDimensionAverage ignores zero scores", () => {
    expect(calculateDimensionAverage([4, 5, 0])).toBe(4.5);
  });

  it("calculateCompositeFeasibility weights dimensions", () => {
    const composite = calculateCompositeFeasibility([
      { weight: 0.5, avg: 4 },
      { weight: 0.5, avg: 2 },
    ]);
    expect(composite).toBe(3);
  });

  it("determineVerdict maps score to verdict", () => {
    expect(determineVerdict(4.2)).toBe("STRONG_GO");
    expect(determineVerdict(3.2)).toBe("CONDITIONAL_GO");
    expect(determineVerdict(2.7)).toBe("NOT_READY");
    expect(determineVerdict(2.0)).toBe("NO_GO");
  });
});

describe("financial-calculator", () => {
  it("calculateNetAnnualBenefit subtracts opex", () => {
    expect(calculateNetAnnualBenefit(500000, 50000)).toBe(450000);
  });

  it("calculatePaybackMonths computes months", () => {
    expect(calculatePaybackMonths(100000, 50000)).toBe(24);
  });

  it("calculatePaybackMonths returns 999 when no benefit", () => {
    expect(calculatePaybackMonths(100000, 0)).toBe(999);
  });

  it("calculateYear1ROI computes percentage", () => {
    expect(calculateYear1ROI(150000, 100000)).toBe(50);
  });

  it("calculateNPV discounts future cash flows", () => {
    const npv = calculateNPV(100000, 200000, 0.1, 3);
    expect(npv).toBeGreaterThan(0);
    expect(npv).toBeLessThan(100000);
  });
});
