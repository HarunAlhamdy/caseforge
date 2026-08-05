import type {
  HardGateTemplate,
  ScoringDriverSnapshot,
} from "@/lib/types";

/** Evidence prefill mapping: driver name → intake/profile field keys */
export const DRIVER_EVIDENCE_MAPPINGS: Record<string, string[]> = {
  "Financial return": [
    "expectedBenefits",
    "annualCost",
    "submitterPriority",
  ],
  "Executive alignment": ["executiveSponsorName", "executiveSponsorTitle"],
  "Strategic fit": ["regulatoryConsiderations", "dataClassification"],
  "Customer impact": ["endUserPersonas"],
  "Innovation value": ["proposedSolution", "modelRelationship"],
  "Data readiness": ["sourceSystemsText", "dqIssues", "remediationNeeded"],
  "Technical complexity": ["sourceSystemsText", "ingestionMethod"],
  "Integration effort": ["readSystems", "writeSystems", "ingestionMethod"],
  "Org readiness": ["endUserPersonas", "submitterComplexity"],
  "Timeline feasibility": ["currentVolume", "dataVolume"],
  "Decision consequentiality": ["proposedSolution", "auditabilityRequired"],
  "Data sensitivity": ["dataClassification", "piiCuiPresent"],
  "Regulatory exposure": ["atoStatus", "regulatoryConsiderations"],
  "Autonomy level": ["proposedSolution", "writeSystems", "autonomyLevel"],
  "Reversibility": ["auditabilityRequired", "regulatoryConsiderations"],
};

export const DEFAULT_VALUE_DRIVERS: Omit<
  ScoringDriverSnapshot,
  "driverId"
>[] = [
  { driverName: "Financial return", weight: 0.2, axisType: "VALUE" },
  { driverName: "Executive alignment", weight: 0.2, axisType: "VALUE" },
  { driverName: "Strategic fit", weight: 0.2, axisType: "VALUE" },
  { driverName: "Customer impact", weight: 0.2, axisType: "VALUE" },
  { driverName: "Innovation value", weight: 0.2, axisType: "VALUE" },
];

export const DEFAULT_FEASIBILITY_DRIVERS: Omit<
  ScoringDriverSnapshot,
  "driverId"
>[] = [
  { driverName: "Data readiness", weight: 0.2, axisType: "FEASIBILITY" },
  { driverName: "Technical complexity", weight: 0.2, axisType: "FEASIBILITY" },
  { driverName: "Integration effort", weight: 0.2, axisType: "FEASIBILITY" },
  { driverName: "Org readiness", weight: 0.2, axisType: "FEASIBILITY" },
  { driverName: "Timeline feasibility", weight: 0.2, axisType: "FEASIBILITY" },
];

export const DEFAULT_RISK_DRIVERS: Omit<ScoringDriverSnapshot, "driverId">[] = [
  { driverName: "Decision consequentiality", weight: 0.2, axisType: "RISK" },
  { driverName: "Data sensitivity", weight: 0.2, axisType: "RISK" },
  { driverName: "Regulatory exposure", weight: 0.2, axisType: "RISK" },
  { driverName: "Autonomy level", weight: 0.2, axisType: "RISK" },
  { driverName: "Reversibility", weight: 0.2, axisType: "RISK" },
];

export const DEFAULT_HARD_GATES: HardGateTemplate[] = [
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
    gateName: "POC evidence",
    conditionText: "POC demonstrated core capability",
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
];

export interface FeasibilityQuestionSeed {
  dimensionCode: string;
  questionText: string;
  evidenceSources?: string[];
}

/** 58 default feasibility questions across D1–D6 */
export const DEFAULT_FEASIBILITY_QUESTIONS: FeasibilityQuestionSeed[] = [
  // D1 — Data readiness (10)
  { dimensionCode: "D1", questionText: "Is source data accessible and documented?" },
  { dimensionCode: "D1", questionText: "Are data quality issues understood and quantified?" },
  { dimensionCode: "D1", questionText: "Is a data owner assigned for each source system?" },
  { dimensionCode: "D1", questionText: "Are data retention policies compatible with the use case?" },
  { dimensionCode: "D1", questionText: "Is historical data available if required?" },
  { dimensionCode: "D1", questionText: "Are data refresh SLAs defined and achievable?" },
  { dimensionCode: "D1", questionText: "Is master/reference data available and governed?" },
  { dimensionCode: "D1", questionText: "Are data lineage requirements understood?" },
  { dimensionCode: "D1", questionText: "Is remediation effort scoped and resourced?" },
  { dimensionCode: "D1", questionText: "Can data quality be monitored post-launch?" },
  // D2 — Technical feasibility (10)
  { dimensionCode: "D2", questionText: "Can the proposed AI pattern be implemented with existing skills?" },
  { dimensionCode: "D2", questionText: "Is the LLM model selection validated for the task?" },
  { dimensionCode: "D2", questionText: "Are context window requirements feasible?" },
  { dimensionCode: "D2", questionText: "Is fine-tuning required and justified?" },
  { dimensionCode: "D2", questionText: "Are prompt engineering approaches proven?" },
  { dimensionCode: "D2", questionText: "Is the RAG corpus sufficient for accuracy targets?" },
  { dimensionCode: "D2", questionText: "Are embedding and retrieval strategies validated?" },
  { dimensionCode: "D2", questionText: "Can agent tools be integrated reliably?" },
  { dimensionCode: "D2", questionText: "Are fallback behaviors defined for model failures?" },
  { dimensionCode: "D2", questionText: "Is observability sufficient for debugging?" },
  // D3 — Integration (8)
  { dimensionCode: "D3", questionText: "Are integration endpoints available?" },
  { dimensionCode: "D3", questionText: "Are authentication methods approved?" },
  { dimensionCode: "D3", questionText: "Is network access provisioned (VPN, private endpoints)?" },
  { dimensionCode: "D3", questionText: "Are rate limits and quotas understood?" },
  { dimensionCode: "D3", questionText: "Can write-back actions be implemented safely?" },
  { dimensionCode: "D3", questionText: "Is error handling and retry logic defined?" },
  { dimensionCode: "D3", questionText: "Are integration test environments available?" },
  { dimensionCode: "D3", questionText: "Is the ingestion frequency achievable?" },
  // D4 — Security & compliance (12)
  { dimensionCode: "D4", questionText: "Are security controls defined in architecture?" },
  { dimensionCode: "D4", questionText: "Is PII handling documented for all sensitive fields?" },
  { dimensionCode: "D4", questionText: "Are input/output validation rules specified?" },
  { dimensionCode: "D4", questionText: "Is prompt injection mitigation in place?" },
  { dimensionCode: "D4", questionText: "Is hallucination mitigation adequate?" },
  { dimensionCode: "D4", questionText: "Are mandatory controls generated and assigned?" },
  { dimensionCode: "D4", questionText: "Is content filtering configured appropriately?" },
  { dimensionCode: "D4", questionText: "Are audit trails sufficient for compliance?" },
  { dimensionCode: "D4", questionText: "Is red team testing scoped if required?" },
  { dimensionCode: "D4", questionText: "Is bias testing scoped if required?" },
  { dimensionCode: "D4", questionText: "Are regulatory requirements addressed?" },
  { dimensionCode: "D4", questionText: "Is drift monitoring planned?" },
  // D5 — Operational readiness (8)
  { dimensionCode: "D5", questionText: "Is the operations team ready to support?" },
  { dimensionCode: "D5", questionText: "Are runbooks and escalation paths defined?" },
  { dimensionCode: "D5", questionText: "Is monitoring and alerting configured?" },
  { dimensionCode: "D5", questionText: "Are backup and recovery procedures defined?" },
  { dimensionCode: "D5", questionText: "Is HITL staffing planned if needed?" },
  { dimensionCode: "D5", questionText: "Are SLA targets defined and measurable?" },
  { dimensionCode: "D5", questionText: "Is incident response process documented?" },
  { dimensionCode: "D5", questionText: "Is revalidation schedule defined?" },
  // D6 — Change management (10)
  { dimensionCode: "D6", questionText: "Is stakeholder buy-in sufficient?" },
  { dimensionCode: "D6", questionText: "Are end-user personas identified and engaged?" },
  { dimensionCode: "D6", questionText: "Is training plan scoped and resourced?" },
  { dimensionCode: "D6", questionText: "Are communication plans in place?" },
  { dimensionCode: "D6", questionText: "Is change resistance assessed?" },
  { dimensionCode: "D6", questionText: "Are pilot users identified?" },
  { dimensionCode: "D6", questionText: "Is adoption measurement defined?" },
  { dimensionCode: "D6", questionText: "Are feedback channels established?" },
  { dimensionCode: "D6", questionText: "Is executive sponsorship active?" },
  { dimensionCode: "D6", questionText: "Are success criteria communicated to users?" },
];

export const FEASIBILITY_DIMENSION_WEIGHTS: Record<string, number> = {
  D1: 0.25,
  D2: 0.2,
  D3: 0.15,
  D4: 0.2,
  D5: 0.1,
  D6: 0.1,
};

export const COMPOSITE_VERDICT_BANDS = [2.5, 3.0, 3.5, 4.0];
