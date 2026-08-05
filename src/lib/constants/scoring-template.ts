import type {
  IntakeFormConfig,
  RiskTierConfigSnapshot,
  ScoringDriverSnapshot,
} from "@/lib/types";

export interface ScoringTemplateAxis {
  axisName: string;
  axisType: "VALUE" | "FEASIBILITY" | "RISK";
  drivers: Omit<ScoringDriverSnapshot, "driverId" | "axisType">[];
}

export interface DefaultScoringTemplate {
  modelName: string;
  valueWeightInPriority: number;
  feasibilityWeightInPriority: number;
  axes: ScoringTemplateAxis[];
  riskTiers: RiskTierConfigSnapshot[];
  feasibilityDimensions: {
    dimensionCode: string;
    dimensionName: string;
    weight: number;
    questions: string[];
  }[];
  hardGates: {
    gateCode: string;
    gateName: string;
    conditionText: string;
  }[];
  intakeFormConfig: IntakeFormConfig;
  subscriptionTiers: string[];
}

const VALUE_DRIVERS = [
  { driverName: "Financial return", weight: 0.2 },
  { driverName: "Executive alignment", weight: 0.2 },
  { driverName: "Strategic fit", weight: 0.2 },
  { driverName: "Customer impact", weight: 0.2 },
  { driverName: "Innovation value", weight: 0.2 },
];

const FEASIBILITY_DRIVERS = [
  { driverName: "Data readiness", weight: 0.2 },
  { driverName: "Technical complexity", weight: 0.2 },
  { driverName: "Integration effort", weight: 0.2 },
  { driverName: "Org readiness", weight: 0.2 },
  { driverName: "Timeline feasibility", weight: 0.2 },
];

const RISK_DRIVERS = [
  { driverName: "Decision consequentiality", weight: 0.2 },
  { driverName: "Data sensitivity", weight: 0.2 },
  { driverName: "Regulatory exposure", weight: 0.2 },
  { driverName: "Autonomy level", weight: 0.2 },
  { driverName: "Reversibility", weight: 0.2 },
];

export const DEFAULT_RISK_TIERS: RiskTierConfigSnapshot[] = [
  {
    tierCode: "R1_MINIMAL",
    tierName: "Minimal",
    upperBound: 1.8,
    multiplier: 1.0,
    controlsInherited: "Baseline",
  },
  {
    tierCode: "R2_LIMITED",
    tierName: "Limited",
    upperBound: 2.6,
    multiplier: 0.95,
    controlsInherited: "Baseline + Limited",
  },
  {
    tierCode: "R3_ELEVATED",
    tierName: "Elevated",
    upperBound: 3.4,
    multiplier: 0.85,
    controlsInherited: "Baseline + Elevated",
  },
  {
    tierCode: "R4_HIGH_IMPACT",
    tierName: "High Impact",
    upperBound: 5.0,
    multiplier: 0.7,
    controlsInherited: "Full control set",
  },
];

export const DEFAULT_SCORING_TEMPLATE: DefaultScoringTemplate = {
  modelName: "Default Portfolio Model",
  valueWeightInPriority: 0.5,
  feasibilityWeightInPriority: 0.5,
  axes: [
    { axisName: "Value", axisType: "VALUE", drivers: VALUE_DRIVERS },
    {
      axisName: "Feasibility",
      axisType: "FEASIBILITY",
      drivers: FEASIBILITY_DRIVERS,
    },
    { axisName: "Risk", axisType: "RISK", drivers: RISK_DRIVERS },
  ],
  riskTiers: DEFAULT_RISK_TIERS,
  feasibilityDimensions: [
    {
      dimensionCode: "D1",
      dimensionName: "Data readiness",
      weight: 0.25,
      questions: [
        "Is source data accessible and documented?",
        "Are data quality issues understood?",
      ],
    },
    {
      dimensionCode: "D2",
      dimensionName: "Technical feasibility",
      weight: 0.2,
      questions: ["Can the proposed AI pattern be implemented with existing skills?"],
    },
    {
      dimensionCode: "D3",
      dimensionName: "Integration",
      weight: 0.15,
      questions: ["Are integration endpoints available?"],
    },
    {
      dimensionCode: "D4",
      dimensionName: "Security & compliance",
      weight: 0.2,
      questions: ["Are security controls defined?"],
    },
    {
      dimensionCode: "D5",
      dimensionName: "Operational readiness",
      weight: 0.1,
      questions: ["Is operations team ready to support?"],
    },
    {
      dimensionCode: "D6",
      dimensionName: "Change management",
      weight: 0.1,
      questions: ["Is stakeholder buy-in sufficient?"],
    },
  ],
  hardGates: [
    {
      gateCode: "G1",
      gateName: "Executive sponsor",
      conditionText: "Named executive sponsor with budget authority",
    },
    {
      gateCode: "G2",
      gateName: "Data access",
      conditionText: "Confirmed access to required source systems",
    },
    {
      gateCode: "G3",
      gateName: "Security classification",
      conditionText: "Data classification completed",
    },
    {
      gateCode: "G4",
      gateName: "Regulatory review",
      conditionText: "Regulatory requirements identified",
    },
    {
      gateCode: "G5",
      gateName: "PII handling",
      conditionText: "PII handling plan documented if applicable",
    },
    {
      gateCode: "G6",
      gateName: "NDA status",
      conditionText: "NDA executed or not required",
    },
    {
      gateCode: "G7",
      gateName: "Success criteria",
      conditionText: "Measurable success criteria defined",
    },
    {
      gateCode: "G8",
      gateName: "Resource commitment",
      conditionText: "Delivery resources committed",
    },
  ],
  intakeFormConfig: {
    sections: [
      { id: "submission", label: "Submission Details" },
      { id: "description", label: "Description" },
      { id: "currentState", label: "Current State" },
      { id: "dataLandscape", label: "Data Landscape" },
      { id: "dataQuality", label: "Data Quality" },
      { id: "domainModel", label: "Domain Model" },
      { id: "governance", label: "Governance" },
      { id: "security", label: "Security" },
      { id: "consumption", label: "Consumption" },
      { id: "assessment", label: "Assessment" },
      { id: "nextSteps", label: "Next Steps" },
    ],
  },
  subscriptionTiers: ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
};

export function driverSnapshotsFromTemplate(): {
  valueDrivers: ScoringDriverSnapshot[];
  feasibilityDrivers: ScoringDriverSnapshot[];
  riskDrivers: ScoringDriverSnapshot[];
} {
  const valueDrivers: ScoringDriverSnapshot[] = [];
  const feasibilityDrivers: ScoringDriverSnapshot[] = [];
  const riskDrivers: ScoringDriverSnapshot[] = [];

  for (const axis of DEFAULT_SCORING_TEMPLATE.axes) {
    axis.drivers.forEach((driver, index) => {
      const snapshot: ScoringDriverSnapshot = {
        driverId: `${axis.axisType.toLowerCase()}-${index}`,
        driverName: driver.driverName,
        weight: driver.weight,
        axisType: axis.axisType,
      };
      if (axis.axisType === "VALUE") valueDrivers.push(snapshot);
      else if (axis.axisType === "FEASIBILITY") feasibilityDrivers.push(snapshot);
      else riskDrivers.push(snapshot);
    });
  }

  return { valueDrivers, feasibilityDrivers, riskDrivers };
}
