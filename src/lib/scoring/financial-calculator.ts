export interface FinancialInputs {
  currentTotal: number;
  agenticTotalOnetime: number;
  agenticTotalAnnualOpex: number;
  annualBenefit: number;
  implementationCost?: number;
  discountRate?: number;
  years?: number;
}

export interface FinancialResults {
  netAnnualBenefit: number;
  paybackMonths: number;
  year1Roi: number;
  npv: number;
}

export function calculateNetAnnualBenefit(
  annualBenefit: number,
  annualOpex: number,
): number {
  return Math.round((annualBenefit - annualOpex) * 100) / 100;
}

export function calculatePaybackMonths(
  implementationCost: number,
  netAnnualBenefit: number,
): number {
  if (netAnnualBenefit <= 0) return 999;
  return Math.ceil((implementationCost / netAnnualBenefit) * 12);
}

export function calculateYear1ROI(
  netAnnualBenefit: number,
  implementationCost: number,
): number {
  if (implementationCost <= 0) return 0;
  return (
    Math.round(
      ((netAnnualBenefit - implementationCost) / implementationCost) * 10000,
    ) / 100
  );
}

export function calculateNPV(
  netAnnualBenefit: number,
  implementationCost: number,
  discountRate: number,
  years: number,
): number {
  let npv = -implementationCost;
  for (let year = 1; year <= years; year++) {
    npv += netAnnualBenefit / Math.pow(1 + discountRate, year);
  }
  return Math.round(npv * 100) / 100;
}

export function calculateFinancialSummary(
  inputs: FinancialInputs,
): FinancialResults {
  const implementationCost =
    inputs.implementationCost ?? inputs.agenticTotalOnetime;
  const discountRate = inputs.discountRate ?? 0.08;
  const years = inputs.years ?? 3;

  const netAnnualBenefit = calculateNetAnnualBenefit(
    inputs.annualBenefit,
    inputs.agenticTotalAnnualOpex,
  );
  const paybackMonths = calculatePaybackMonths(
    implementationCost,
    netAnnualBenefit,
  );
  const year1Roi = calculateYear1ROI(netAnnualBenefit, implementationCost);
  const npv = calculateNPV(
    netAnnualBenefit,
    implementationCost,
    discountRate,
    years,
  );

  return { netAnnualBenefit, paybackMonths, year1Roi, npv };
}

/** @deprecated Use calculateFinancialSummary */
export function calculateFinancialProjection(input: {
  implementationCost: number;
  annualBenefit: number;
  annualCost: number;
  discountRate: number;
  years: number;
}): { npv: number; paybackMonths: number; roi: number } {
  const netAnnual = calculateNetAnnualBenefit(
    input.annualBenefit,
    input.annualCost,
  );
  return {
    npv: calculateNPV(
      netAnnual,
      input.implementationCost,
      input.discountRate,
      input.years,
    ),
    paybackMonths: calculatePaybackMonths(
      input.implementationCost,
      netAnnual,
    ),
    roi: calculateYear1ROI(netAnnual, input.implementationCost),
  };
}
