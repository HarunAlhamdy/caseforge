import type {
  AiPattern,
  GateDecision,
  LifecycleStage,
  PartnerRole,
  RiskTier,
  SecurityRole,
  UseCaseStatus,
} from "@prisma/client";

// ─── Session & access ────────────────────────────────────────────────────────

export interface SessionClaims {
  userId: string;
  email?: string | null;
  name?: string | null;
  role: SecurityRole;
  tenantId?: string | null;
  partnerId?: string | null;
  partnerRole?: PartnerRole | null;
  accessibleTenantIds?: string[];
}

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: SecurityRole;
  tenantId?: string | null;
  partnerId?: string | null;
  partnerRole?: PartnerRole | null;
  accessibleTenantIds?: string[];
  image?: string | null;
}

export type AccessLevel = "PLATFORM" | "PARTNER" | "CUSTOMER";

export interface AccessContext {
  userId: string;
  tenantId: string | null;
  effectiveRole: SecurityRole;
  partnerId: string | null;
  partnerRole: PartnerRole | null;
  isPartnerUser: boolean;
  accessLevel: AccessLevel;
  accessibleTenantIds: string[];
}

/** @deprecated Use AccessContext */
export interface AccessResolution {
  tier: AccessLevel;
  effectiveRole: SecurityRole;
  tenantId: string | null;
  partnerId: string | null;
  accessibleTenantIds: string[];
  canSwitchTenant: boolean;
}

export interface TenantThemeConfig {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  fontFamily?: string;
}

// ─── Tenant JSON config types ─────────────────────────────────────────────────

export interface TerminologyOverrides {
  useCase?: string;
  businessUnit?: string;
  wave?: string;
  [key: string]: string | undefined;
}

export interface IntakeFormFieldConfig {
  id: string;
  label: string;
  mandatory?: boolean;
  hidden?: boolean;
  guidance?: string;
  picklistValues?: string[];
}

export interface IntakeFormSectionConfig {
  id: string;
  label: string;
  hidden?: boolean;
  fields?: IntakeFormFieldConfig[];
}

export interface IntakeFormConfig {
  sections?: IntakeFormSectionConfig[];
  customFields?: IntakeFormFieldConfig[];
}

// ─── Source system & architecture JSON ───────────────────────────────────────

export interface SourceSystemFieldSpec {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
}

export interface LlmModelSpec {
  provider: string;
  model: string;
  purpose?: string;
  maxTokens?: number;
}

export interface AgentToolSpec {
  name: string;
  system?: string;
  action: string;
  readWrite?: "READ" | "WRITE" | "BOTH";
  description?: string;
}

export interface ValidationRuleSpec {
  rule: string;
  description?: string;
  severity?: "ERROR" | "WARNING";
}

export interface ApprovalGateSpec {
  name: string;
  trigger: string;
  approverRole?: string;
}

// ─── Scoring JSON snapshots ──────────────────────────────────────────────────

export interface ScoringDriverSnapshot {
  driverId: string;
  driverName: string;
  weight: number;
  axisType: "VALUE" | "FEASIBILITY" | "RISK";
}

export interface RiskTierConfigSnapshot {
  tierCode: string;
  tierName: string;
  upperBound: number;
  multiplier: number;
  controlsInherited?: string;
}

export interface WeightImpactPreview {
  useCaseId: string;
  useCaseNumber: string;
  title: string;
  currentPriorityScore: number;
  proposedPriorityScore: number;
  currentRank: number;
  proposedRank: number;
  rankDelta: number;
}

export interface HardGateTemplate {
  gateCode: string;
  gateName: string;
  conditionText: string;
  isActive?: boolean;
}

export interface NotificationChannelConfig {
  email: boolean;
  inApp: boolean;
}

export interface NotificationConfig {
  weightChangeApplied?: NotificationChannelConfig;
  weightChangeProposed?: NotificationChannelConfig;
  stageTransition?: NotificationChannelConfig;
  gateDecision?: NotificationChannelConfig;
  [key: string]: NotificationChannelConfig | undefined;
}

export interface TenantAdminConfigBundle {
  intake?: IntakeFormConfig;
  hardGates?: HardGateTemplate[];
  notifications?: NotificationConfig;
}

export interface EffortAssumptions {
  notes?: string;
  sourceSystemCount?: number;
  piiInLlm?: boolean;
  aiPattern?: AiPattern;
  [key: string]: string | number | boolean | undefined;
}

// ─── Audit JSON ──────────────────────────────────────────────────────────────

export type AuditJson = Record<string, unknown>;

// ─── Scoring engine helpers (pure function I/O) ─────────────────────────────

export interface PortfolioScoreInput {
  valueScore: number;
  feasibilityScore: number;
  riskPenalty: number;
}

export interface PortfolioScoreResult {
  compositeScore: number;
  rank: number;
}

export interface FeasibilityScoreInput {
  dataReadiness: number;
  technicalComplexity: number;
  orgReadiness: number;
}

export interface FeasibilityScoreResult {
  score: number;
  band: "LOW" | "MEDIUM" | "HIGH";
}

export interface RiskTierInput {
  dataClassification: string;
  piiPresent: boolean;
  autonomyLevel: number;
}

export interface RiskTierResult {
  tier: RiskTier;
  score: number;
}

export interface EffortEstimateInput {
  complexityPoints: number;
  teamSize: number;
  weeksPerSprint: number;
}

export interface EffortEstimateResult {
  storyPoints: number;
  estimatedWeeks: number;
  costBand: string;
}

export interface ControlInheritanceInput {
  parentControls: string[];
  childOverrides: string[];
}

export interface ControlInheritanceResult {
  effectiveControls: string[];
  inheritedCount: number;
}

export interface FinancialProjectionInput {
  implementationCost: number;
  annualBenefit: number;
  annualCost: number;
  discountRate: number;
  years: number;
}

export interface FinancialProjectionResult {
  npv: number;
  paybackMonths: number;
  roi: number;
}

export interface WeightVersion {
  versionId: string;
  weights: Record<string, number>;
  status: string;
}

// Re-export commonly used enum value types for client code
export type {
  LifecycleStage,
  GateDecision,
  UseCaseStatus,
  SecurityRole,
  PartnerRole,
  RiskTier,
  AiPattern,
};
