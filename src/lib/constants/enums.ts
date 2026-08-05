import type { SecurityRole as PrismaSecurityRole } from "@prisma/client";

export type EnumOption<T extends string = string> = {
  value: T;
  label: string;
};

function options<T extends string>(
  entries: readonly { value: T; label: string }[],
): EnumOption<T>[] {
  return entries.map((e) => ({ ...e }));
}

// ─── Raw enum value objects (for comparisons without Prisma import) ─────────

export const TenantType = {
  PARTNER_MANAGED: "PARTNER_MANAGED",
  SELF_SERVE: "SELF_SERVE",
} as const;
export type TenantTypeValue = (typeof TenantType)[keyof typeof TenantType];

export const PartnerRole = {
  PARTNER_ADMIN: "PARTNER_ADMIN",
  PARTNER_CONSULTANT: "PARTNER_CONSULTANT",
} as const;
export type PartnerRoleValue = (typeof PartnerRole)[keyof typeof PartnerRole];

export const SecurityRole = {
  PLATFORM_SUPER_ADMIN: "PLATFORM_SUPER_ADMIN",
  PARTNER_ADMIN: "PARTNER_ADMIN",
  PARTNER_CONSULTANT: "PARTNER_CONSULTANT",
  CUSTOMER_ADMIN: "CUSTOMER_ADMIN",
  PORTFOLIO_MANAGER: "PORTFOLIO_MANAGER",
  EVALUATOR: "EVALUATOR",
  SUBMITTER: "SUBMITTER",
  DATA_SECURITY_REVIEWER: "DATA_SECURITY_REVIEWER",
  EXECUTIVE_SPONSOR: "EXECUTIVE_SPONSOR",
  VIEWER: "VIEWER",
} as const;
export type SecurityRoleValue =
  (typeof SecurityRole)[keyof typeof SecurityRole];

export const LifecycleStage = {
  INTAKE_DRAFT: "INTAKE_DRAFT",
  INTAKE_COMPLETE: "INTAKE_COMPLETE",
  PENDING_REVIEW: "PENDING_REVIEW",
  INFO_REQUEST: "INFO_REQUEST",
  GATING_REVIEW: "GATING_REVIEW",
  PROFILE_REVIEW: "PROFILE_REVIEW",
  PORTFOLIO_SCORING: "PORTFOLIO_SCORING",
  DEEP_FEASIBILITY: "DEEP_FEASIBILITY",
  WAVE_PLANNING: "WAVE_PLANNING",
  PILOT: "PILOT",
  SCALE_UP: "SCALE_UP",
  PRODUCTION: "PRODUCTION",
  ON_HOLD: "ON_HOLD",
  GATED_OUT: "GATED_OUT",
  RETIRED: "RETIRED",
} as const;
export type LifecycleStageValue =
  (typeof LifecycleStage)[keyof typeof LifecycleStage];

export const UseCaseStatus = {
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  GATED_OUT: "GATED_OUT",
} as const;

export const GateDecision = {
  NONE: "NONE",
  PASS: "PASS",
  GATE_A: "GATE_A",
  GATE_B: "GATE_B",
  GATE_C: "GATE_C",
  GATE_D: "GATE_D",
  HOLD: "HOLD",
} as const;

export const RiskTier = {
  R1_MINIMAL: "R1_MINIMAL",
  R2_LIMITED: "R2_LIMITED",
  R3_ELEVATED: "R3_ELEVATED",
  R4_HIGH_IMPACT: "R4_HIGH_IMPACT",
} as const;

export const CompositeVerdict = {
  STRONG_GO: "STRONG_GO",
  CONDITIONAL_GO: "CONDITIONAL_GO",
  NOT_READY: "NOT_READY",
  NO_GO: "NO_GO",
} as const;

export const HardGateStatus = {
  ALL_PASSED: "ALL_PASSED",
  HAS_FAILURES: "HAS_FAILURES",
  INCOMPLETE: "INCOMPLETE",
} as const;

export const CostBand = {
  S_UNDER_50K: "S_UNDER_50K",
  M_50K_150K: "M_50K_150K",
  L_150K_400K: "L_150K_400K",
  XL_OVER_400K: "XL_OVER_400K",
} as const;

export const DataReadinessFlag = {
  GREEN: "GREEN",
  AMBER: "AMBER",
  RED: "RED",
} as const;

export const DataClassification = {
  PUBLIC: "PUBLIC",
  INTERNAL: "INTERNAL",
  CONFIDENTIAL: "CONFIDENTIAL",
  PII: "PII",
  PII_SENSITIVE: "PII_SENSITIVE",
  PHI: "PHI",
  CUI: "CUI",
  FINANCIAL: "FINANCIAL",
} as const;

export const PiiType = {
  NONE: "NONE",
  SSN: "SSN",
  TAX_ID: "TAX_ID",
  DOB: "DOB",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  ADDRESS: "ADDRESS",
  NAME: "NAME",
  BIOMETRIC: "BIOMETRIC",
  FINANCIAL_ACCOUNT: "FINANCIAL_ACCOUNT",
  HEALTH_RECORD: "HEALTH_RECORD",
  DRIVER_LICENSE: "DRIVER_LICENSE",
  PASSPORT: "PASSPORT",
  OTHER: "OTHER",
} as const;

export const LlmContextEntry = {
  YES_IN_PROMPT: "YES_IN_PROMPT",
  YES_IN_RAG: "YES_IN_RAG",
  NO_PRE_PROCESS: "NO_PRE_PROCESS",
  NO_NOT_USED: "NO_NOT_USED",
} as const;

export const RequiredHandling = {
  TOKENIZE: "TOKENIZE",
  MASK: "MASK",
  ENCRYPT: "ENCRYPT",
  ANONYMIZE: "ANONYMIZE",
  REDACT: "REDACT",
  AGGREGATE_ONLY: "AGGREGATE_ONLY",
  NO_SPECIAL: "NO_SPECIAL",
} as const;

export const ConsentBasis = {
  CONTRACT: "CONTRACT",
  LEGITIMATE_INTEREST: "LEGITIMATE_INTEREST",
  EXPLICIT_CONSENT: "EXPLICIT_CONSENT",
  LEGAL_OBLIGATION: "LEGAL_OBLIGATION",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export const SystemType = {
  ERP: "ERP",
  CRM: "CRM",
  DATA_WAREHOUSE: "DATA_WAREHOUSE",
  DATA_LAKE: "DATA_LAKE",
  FILE_SHARE: "FILE_SHARE",
  API: "API",
  MAINFRAME: "MAINFRAME",
  SAAS: "SAAS",
  IOT: "IOT",
  OTHER: "OTHER",
} as const;

export const AccessMethod = {
  DIRECT_DB: "DIRECT_DB",
  REST_API: "REST_API",
  ODATA: "ODATA",
  SFTP: "SFTP",
  FLAT_FILE: "FLAT_FILE",
  CDC: "CDC",
  KAFKA: "KAFKA",
  GRAPHQL: "GRAPHQL",
  SDK: "SDK",
  MANUAL: "MANUAL",
  OTHER: "OTHER",
} as const;

export const AuthMethod = {
  OAUTH2: "OAUTH2",
  API_KEY: "API_KEY",
  SERVICE_ACCOUNT: "SERVICE_ACCOUNT",
  SSO: "SSO",
  CERTIFICATE: "CERTIFICATE",
  BASIC_AUTH: "BASIC_AUTH",
  NONE: "NONE",
  OTHER: "OTHER",
} as const;

export const NetworkAccess = {
  VPN_REQUIRED: "VPN_REQUIRED",
  PRIVATE_ENDPOINT: "PRIVATE_ENDPOINT",
  PUBLIC: "PUBLIC",
  AIR_GAPPED: "AIR_GAPPED",
  OTHER: "OTHER",
} as const;

export const LatencyTolerance = {
  REAL_TIME: "REAL_TIME",
  SUB_HOUR: "SUB_HOUR",
  SAME_DAY: "SAME_DAY",
  NEXT_DAY: "NEXT_DAY",
  WEEKLY: "WEEKLY",
  NOT_CRITICAL: "NOT_CRITICAL",
} as const;

export const AiPattern = {
  RAG: "RAG",
  FINE_TUNED: "FINE_TUNED",
  SINGLE_AGENT: "SINGLE_AGENT",
  MULTI_AGENT: "MULTI_AGENT",
  CLASSIFICATION: "CLASSIFICATION",
  EXTRACTION: "EXTRACTION",
  SUMMARIZATION: "SUMMARIZATION",
  CODE_GEN: "CODE_GEN",
  OTHER: "OTHER",
} as const;

export const AgentSubPattern = {
  REACT: "REACT",
  PLAN_EXECUTE: "PLAN_EXECUTE",
  SUPERVISOR_WORKER: "SUPERVISOR_WORKER",
  SWARM: "SWARM",
  TOOL_USE_ONLY: "TOOL_USE_ONLY",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export const ModelHosting = {
  OPENAI_MANAGED: "OPENAI_MANAGED",
  SELF_HOSTED: "SELF_HOSTED",
  BEDROCK: "BEDROCK",
  ON_PREM: "ON_PREM",
  OTHER: "OTHER",
} as const;

export const VectorStore = {
  AI_SEARCH: "AI_SEARCH",
  PINECONE: "PINECONE",
  WEAVIATE: "WEAVIATE",
  PGVECTOR: "PGVECTOR",
  CHROMA: "CHROMA",
  COSMOS_VECTOR: "COSMOS_VECTOR",
  OTHER: "OTHER",
} as const;

export const RetrievalStrategy = {
  SEMANTIC: "SEMANTIC",
  KEYWORD: "KEYWORD",
  HYBRID_RRF: "HYBRID_RRF",
  MULTI_QUERY: "MULTI_QUERY",
  OTHER: "OTHER",
} as const;

export const DeploymentArch = {
  SERVERLESS: "SERVERLESS",
  CONTAINER: "CONTAINER",
  APP_SERVICE: "APP_SERVICE",
  VM: "VM",
  FUNCTIONS: "FUNCTIONS",
  OTHER: "OTHER",
} as const;

export const FallbackBehavior = {
  ESCALATE: "ESCALATE",
  RETRY_SIMPLIFIED: "RETRY_SIMPLIFIED",
  LOG_ABANDON: "LOG_ABANDON",
  QUEUE_REVIEW: "QUEUE_REVIEW",
} as const;

export const MemoryMgmt = {
  STATELESS: "STATELESS",
  SESSION_SCOPED: "SESSION_SCOPED",
  PERSISTENT: "PERSISTENT",
} as const;

export const SecurityReviewStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  ATO_GRANTED: "ATO_GRANTED",
  NOT_REQUIRED: "NOT_REQUIRED",
} as const;

export const NdaStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  EXECUTED: "EXECUTED",
  NOT_REQUIRED: "NOT_REQUIRED",
} as const;

export const ProfileSection = {
  DATA_INGESTION: "DATA_INGESTION",
  DATA_QUALITY: "DATA_QUALITY",
  SENSITIVE_DATA: "SENSITIVE_DATA",
  DOMAIN_MODEL: "DOMAIN_MODEL",
  GOVERNANCE: "GOVERNANCE",
  SECURITY: "SECURITY",
  SOLUTION_ARCHITECTURE: "SOLUTION_ARCHITECTURE",
} as const;

export const ProfileReviewStatus = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  INFO_REQUESTED: "INFO_REQUESTED",
} as const;

export const ControlStatus = {
  REQUIRED: "REQUIRED",
  IMPLEMENTED: "IMPLEMENTED",
  VERIFIED: "VERIFIED",
  WAIVED: "WAIVED",
} as const;

export const ConfidenceLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export const ScoringAxisType = {
  VALUE: "VALUE",
  FEASIBILITY: "FEASIBILITY",
  RISK: "RISK",
} as const;

export const SuccessCriteriaStatus = {
  NOT_MEASURED: "NOT_MEASURED",
  BELOW_MINIMUM: "BELOW_MINIMUM",
  MEETS_MINIMUM: "MEETS_MINIMUM",
  MEETS_TARGET: "MEETS_TARGET",
  EXCEEDS_STRETCH: "EXCEEDS_STRETCH",
} as const;

export const ScoringModelVersionStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  SUPERSEDED: "SUPERSEDED",
} as const;

export const WeightProposalStatus = {
  PROPOSED: "PROPOSED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

// ─── Display label option arrays ─────────────────────────────────────────────

export const TENANT_TYPE_OPTIONS = options<TenantTypeValue>([
  { value: "PARTNER_MANAGED", label: "Partner Managed" },
  { value: "SELF_SERVE", label: "Self Serve" },
]);

export const PARTNER_ROLE_OPTIONS = options<PartnerRoleValue>([
  { value: "PARTNER_ADMIN", label: "Partner Admin" },
  { value: "PARTNER_CONSULTANT", label: "Partner Consultant" },
]);

export const SECURITY_ROLE_OPTIONS = options<SecurityRoleValue>([
  { value: "PLATFORM_SUPER_ADMIN", label: "Platform Super Admin" },
  { value: "PARTNER_ADMIN", label: "Partner Admin" },
  { value: "PARTNER_CONSULTANT", label: "Partner Consultant" },
  { value: "CUSTOMER_ADMIN", label: "Customer Admin" },
  { value: "PORTFOLIO_MANAGER", label: "Portfolio Manager" },
  { value: "EVALUATOR", label: "Evaluator" },
  { value: "SUBMITTER", label: "Submitter" },
  { value: "DATA_SECURITY_REVIEWER", label: "Data Security Reviewer" },
  { value: "EXECUTIVE_SPONSOR", label: "Executive Sponsor" },
  { value: "VIEWER", label: "Viewer" },
]);

export const LIFECYCLE_STAGE_OPTIONS = options<LifecycleStageValue>([
  { value: "INTAKE_DRAFT", label: "Intake Draft" },
  { value: "INTAKE_COMPLETE", label: "Intake Complete" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "INFO_REQUEST", label: "Info Request" },
  { value: "GATING_REVIEW", label: "Gating Review" },
  { value: "PROFILE_REVIEW", label: "Profile Review" },
  { value: "PORTFOLIO_SCORING", label: "Portfolio Scoring" },
  { value: "DEEP_FEASIBILITY", label: "Deep Feasibility" },
  { value: "WAVE_PLANNING", label: "Wave Planning" },
  { value: "PILOT", label: "Pilot" },
  { value: "SCALE_UP", label: "Scale Up" },
  { value: "PRODUCTION", label: "Production" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "GATED_OUT", label: "Gated Out" },
  { value: "RETIRED", label: "Retired" },
]);

export const USE_CASE_STATUS_OPTIONS = options([
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "GATED_OUT", label: "Gated Out" },
]);

export const GATE_DECISION_OPTIONS = options([
  { value: "NONE", label: "None" },
  { value: "PASS", label: "Pass" },
  { value: "GATE_A", label: "Gate A — Too easy" },
  { value: "GATE_B", label: "Gate B — Insufficient value" },
  { value: "GATE_C", label: "Gate C — Data not ready" },
  { value: "GATE_D", label: "Gate D — Risk too high" },
  { value: "HOLD", label: "Hold — More info needed" },
]);

export const RISK_TIER_OPTIONS = options([
  { value: "R1_MINIMAL", label: "R1 — Minimal" },
  { value: "R2_LIMITED", label: "R2 — Limited" },
  { value: "R3_ELEVATED", label: "R3 — Elevated" },
  { value: "R4_HIGH_IMPACT", label: "R4 — High Impact" },
]);

export const COMPOSITE_VERDICT_OPTIONS = options([
  { value: "STRONG_GO", label: "Strong Go" },
  { value: "CONDITIONAL_GO", label: "Conditional Go" },
  { value: "NOT_READY", label: "Not Ready" },
  { value: "NO_GO", label: "No Go" },
]);

export const HARD_GATE_STATUS_OPTIONS = options([
  { value: "ALL_PASSED", label: "All Passed" },
  { value: "HAS_FAILURES", label: "Has Failures" },
  { value: "INCOMPLETE", label: "Incomplete" },
]);

export const COST_BAND_OPTIONS = options([
  { value: "S_UNDER_50K", label: "S — Under $50K" },
  { value: "M_50K_150K", label: "M — $50K–$150K" },
  { value: "L_150K_400K", label: "L — $150K–$400K" },
  { value: "XL_OVER_400K", label: "XL — Over $400K" },
]);

export const DATA_READINESS_FLAG_OPTIONS = options([
  { value: "GREEN", label: "Green — Ready" },
  { value: "AMBER", label: "Amber — Partial" },
  { value: "RED", label: "Red — Not Ready" },
]);

export const DATA_CLASSIFICATION_OPTIONS = options([
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "PII", label: "PII" },
  { value: "PII_SENSITIVE", label: "PII — Sensitive" },
  { value: "PHI", label: "PHI" },
  { value: "CUI", label: "CUI" },
  { value: "FINANCIAL", label: "Financial" },
]);

export const PII_TYPE_OPTIONS = options([
  { value: "NONE", label: "None" },
  { value: "SSN", label: "SSN" },
  { value: "TAX_ID", label: "Tax ID" },
  { value: "DOB", label: "Date of Birth" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "ADDRESS", label: "Address" },
  { value: "NAME", label: "Name" },
  { value: "BIOMETRIC", label: "Biometric" },
  { value: "FINANCIAL_ACCOUNT", label: "Financial Account" },
  { value: "HEALTH_RECORD", label: "Health Record" },
  { value: "DRIVER_LICENSE", label: "Driver License" },
  { value: "PASSPORT", label: "Passport" },
  { value: "OTHER", label: "Other" },
]);

export const LLM_CONTEXT_ENTRY_OPTIONS = options([
  { value: "YES_IN_PROMPT", label: "Yes — In Prompt" },
  { value: "YES_IN_RAG", label: "Yes — In RAG" },
  { value: "NO_PRE_PROCESS", label: "No — Pre-process Only" },
  { value: "NO_NOT_USED", label: "No — Not Used" },
]);

export const REQUIRED_HANDLING_OPTIONS = options([
  { value: "TOKENIZE", label: "Tokenize" },
  { value: "MASK", label: "Mask" },
  { value: "ENCRYPT", label: "Encrypt" },
  { value: "ANONYMIZE", label: "Anonymize" },
  { value: "REDACT", label: "Redact" },
  { value: "AGGREGATE_ONLY", label: "Aggregate Only" },
  { value: "NO_SPECIAL", label: "No Special Handling" },
]);

export const CONSENT_BASIS_OPTIONS = options([
  { value: "CONTRACT", label: "Contract" },
  { value: "LEGITIMATE_INTEREST", label: "Legitimate Interest" },
  { value: "EXPLICIT_CONSENT", label: "Explicit Consent" },
  { value: "LEGAL_OBLIGATION", label: "Legal Obligation" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
]);

export const SYSTEM_TYPE_OPTIONS = options([
  { value: "ERP", label: "ERP" },
  { value: "CRM", label: "CRM" },
  { value: "DATA_WAREHOUSE", label: "Data Warehouse" },
  { value: "DATA_LAKE", label: "Data Lake" },
  { value: "FILE_SHARE", label: "File Share" },
  { value: "API", label: "API" },
  { value: "MAINFRAME", label: "Mainframe" },
  { value: "SAAS", label: "SaaS" },
  { value: "IOT", label: "IoT" },
  { value: "OTHER", label: "Other" },
]);

export const ACCESS_METHOD_OPTIONS = options([
  { value: "DIRECT_DB", label: "Direct DB" },
  { value: "REST_API", label: "REST API" },
  { value: "ODATA", label: "OData" },
  { value: "SFTP", label: "SFTP" },
  { value: "FLAT_FILE", label: "Flat File" },
  { value: "CDC", label: "CDC" },
  { value: "KAFKA", label: "Kafka" },
  { value: "GRAPHQL", label: "GraphQL" },
  { value: "SDK", label: "SDK" },
  { value: "MANUAL", label: "Manual" },
  { value: "OTHER", label: "Other" },
]);

export const AUTH_METHOD_OPTIONS = options([
  { value: "OAUTH2", label: "OAuth 2.0" },
  { value: "API_KEY", label: "API Key" },
  { value: "SERVICE_ACCOUNT", label: "Service Account" },
  { value: "SSO", label: "SSO" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "BASIC_AUTH", label: "Basic Auth" },
  { value: "NONE", label: "None" },
  { value: "OTHER", label: "Other" },
]);

export const NETWORK_ACCESS_OPTIONS = options([
  { value: "VPN_REQUIRED", label: "VPN Required" },
  { value: "PRIVATE_ENDPOINT", label: "Private Endpoint" },
  { value: "PUBLIC", label: "Public" },
  { value: "AIR_GAPPED", label: "Air Gapped" },
  { value: "OTHER", label: "Other" },
]);

export const LATENCY_TOLERANCE_OPTIONS = options([
  { value: "REAL_TIME", label: "Real Time" },
  { value: "SUB_HOUR", label: "Sub Hour" },
  { value: "SAME_DAY", label: "Same Day" },
  { value: "NEXT_DAY", label: "Next Day" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "NOT_CRITICAL", label: "Not Critical" },
]);

export const AI_PATTERN_OPTIONS = options([
  { value: "RAG", label: "RAG" },
  { value: "FINE_TUNED", label: "Fine Tuned" },
  { value: "SINGLE_AGENT", label: "Single Agent" },
  { value: "MULTI_AGENT", label: "Multi Agent" },
  { value: "CLASSIFICATION", label: "Classification" },
  { value: "EXTRACTION", label: "Extraction" },
  { value: "SUMMARIZATION", label: "Summarization" },
  { value: "CODE_GEN", label: "Code Generation" },
  { value: "OTHER", label: "Other" },
]);

export const AGENT_SUB_PATTERN_OPTIONS = options([
  { value: "REACT", label: "ReAct" },
  { value: "PLAN_EXECUTE", label: "Plan & Execute" },
  { value: "SUPERVISOR_WORKER", label: "Supervisor / Worker" },
  { value: "SWARM", label: "Swarm" },
  { value: "TOOL_USE_ONLY", label: "Tool Use Only" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
]);

export const MODEL_HOSTING_OPTIONS = options([
  { value: "OPENAI_MANAGED", label: "OpenAI Managed" },
  { value: "SELF_HOSTED", label: "Self Hosted" },
  { value: "BEDROCK", label: "AWS Bedrock" },
  { value: "ON_PREM", label: "On Premises" },
  { value: "OTHER", label: "Other" },
]);

export const VECTOR_STORE_OPTIONS = options([
  { value: "AI_SEARCH", label: "Azure AI Search" },
  { value: "PINECONE", label: "Pinecone" },
  { value: "WEAVIATE", label: "Weaviate" },
  { value: "PGVECTOR", label: "pgvector" },
  { value: "CHROMA", label: "Chroma" },
  { value: "COSMOS_VECTOR", label: "Cosmos Vector" },
  { value: "OTHER", label: "Other" },
]);

export const RETRIEVAL_STRATEGY_OPTIONS = options([
  { value: "SEMANTIC", label: "Semantic" },
  { value: "KEYWORD", label: "Keyword" },
  { value: "HYBRID_RRF", label: "Hybrid RRF" },
  { value: "MULTI_QUERY", label: "Multi Query" },
  { value: "OTHER", label: "Other" },
]);

export const DEPLOYMENT_ARCH_OPTIONS = options([
  { value: "SERVERLESS", label: "Serverless" },
  { value: "CONTAINER", label: "Container" },
  { value: "APP_SERVICE", label: "App Service" },
  { value: "VM", label: "Virtual Machine" },
  { value: "FUNCTIONS", label: "Functions" },
  { value: "OTHER", label: "Other" },
]);

export const FALLBACK_BEHAVIOR_OPTIONS = options([
  { value: "ESCALATE", label: "Escalate" },
  { value: "RETRY_SIMPLIFIED", label: "Retry Simplified" },
  { value: "LOG_ABANDON", label: "Log & Abandon" },
  { value: "QUEUE_REVIEW", label: "Queue for Review" },
]);

export const MEMORY_MGMT_OPTIONS = options([
  { value: "STATELESS", label: "Stateless" },
  { value: "SESSION_SCOPED", label: "Session Scoped" },
  { value: "PERSISTENT", label: "Persistent" },
]);

export const SECURITY_REVIEW_STATUS_OPTIONS = options([
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ATO_GRANTED", label: "ATO Granted" },
  { value: "NOT_REQUIRED", label: "Not Required" },
]);

export const NDA_STATUS_OPTIONS = options([
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "EXECUTED", label: "Executed" },
  { value: "NOT_REQUIRED", label: "Not Required" },
]);

export const PROFILE_SECTION_OPTIONS = options([
  { value: "DATA_INGESTION", label: "Data Ingestion" },
  { value: "DATA_QUALITY", label: "Data Quality" },
  { value: "SENSITIVE_DATA", label: "Sensitive Data" },
  { value: "DOMAIN_MODEL", label: "Domain Model" },
  { value: "GOVERNANCE", label: "Governance" },
  { value: "SECURITY", label: "Security" },
  { value: "SOLUTION_ARCHITECTURE", label: "Solution Architecture" },
]);

export const PROFILE_REVIEW_STATUS_OPTIONS = options([
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "INFO_REQUESTED", label: "Info Requested" },
]);

export const CONTROL_STATUS_OPTIONS = options([
  { value: "REQUIRED", label: "Required" },
  { value: "IMPLEMENTED", label: "Implemented" },
  { value: "VERIFIED", label: "Verified" },
  { value: "WAIVED", label: "Waived" },
]);

export const CONFIDENCE_LEVEL_OPTIONS = options([
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
]);

export const SCORING_AXIS_TYPE_OPTIONS = options([
  { value: "VALUE", label: "Value" },
  { value: "FEASIBILITY", label: "Feasibility" },
  { value: "RISK", label: "Risk" },
]);

export const SUCCESS_CRITERIA_STATUS_OPTIONS = options([
  { value: "NOT_MEASURED", label: "Not Measured" },
  { value: "BELOW_MINIMUM", label: "Below Minimum" },
  { value: "MEETS_MINIMUM", label: "Meets Minimum" },
  { value: "MEETS_TARGET", label: "Meets Target" },
  { value: "EXCEEDS_STRETCH", label: "Exceeds Stretch" },
]);

export const SCORING_MODEL_VERSION_STATUS_OPTIONS = options([
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUPERSEDED", label: "Superseded" },
]);

export const WEIGHT_PROPOSAL_STATUS_OPTIONS = options([
  { value: "PROPOSED", label: "Proposed" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
]);

// ─── Legacy label maps (kept for existing imports) ───────────────────────────

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStageValue, string> =
  Object.fromEntries(
    LIFECYCLE_STAGE_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<LifecycleStageValue, string>;

export const SECURITY_ROLE_LABELS: Record<SecurityRoleValue, string> =
  Object.fromEntries(
    SECURITY_ROLE_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<SecurityRoleValue, string>;

/** Prisma SecurityRole alias for type-safe server code */
export type SecurityRole = PrismaSecurityRole;
