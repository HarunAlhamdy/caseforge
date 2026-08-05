export {
  calculateAxisScore,
  weightedAxisScore,
  determineRiskTier,
  calculatePriorityScore,
  priorityScore,
  calculateRanking,
  rankByPriority,
  calculateDataReadiness,
  calculatePortfolioScore,
  rankPortfolioItems,
} from "@/lib/scoring/portfolio-scoring";
export {
  calculateDimensionAverage,
  calculateCompositeFeasibility,
  determineVerdict,
  calculateFeasibilityScore,
} from "@/lib/scoring/feasibility-scoring";
export { calculateRiskTier } from "@/lib/scoring/risk-tier";
export { calculateEffort } from "@/lib/scoring/effort-calculator";
export { determineControls, resolveControlInheritance } from "@/lib/scoring/control-inheritance";
export {
  calculateNetAnnualBenefit,
  calculatePaybackMonths,
  calculateYear1ROI,
  calculateNPV,
  calculateFinancialSummary,
  calculateFinancialProjection,
} from "@/lib/scoring/financial-calculator";
export {
  normalizeWeights,
  normalizeAxisWeights,
  createVersionSnapshot,
  generateChangeSummary,
  summarizeWeightChanges,
  calculateHypothetical,
  hypotheticalRescore,
  reScorePortfolio,
  createSnapshots,
  compareVersions,
  applyWeightVersion,
  createDraftWeightVersion,
} from "@/lib/scoring/weight-versioning";
