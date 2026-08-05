# CaseForge — Cursor Development Prompts (Open Stack Edition)

## Stack-Agnostic · Multi-Tenant · Three-Tier Access · Weight Versioning

**Version:** 3.0 · **Date:** August 4, 2026
**Stack:** React + Next.js 14 · PostgreSQL + Prisma · NextAuth.js · OpenAI API · Docker
**Deployable to:** AWS, Azure, GCP, or self-hosted — no cloud vendor lock-in

**Instructions:** Execute prompts 1-15 in order. Each assumes all previous prompts are complete. Every prompt produces working, production-grade code — not stubs or placeholders.

---

## TECHNOLOGY STACK (referenced by all prompts)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Next.js 14 (App Router, TypeScript) | SSR for SEO, RSC for performance, full CSS control for white-labeling |
| Styling | Tailwind CSS + CSS custom properties | Tenant-aware theming via runtime CSS variable injection |
| State | Zustand (client state) + React Query / TanStack Query (server state) | Lightweight, no boilerplate |
| Backend | Next.js API Routes + tRPC | End-to-end type safety, no separate API project |
| Database | PostgreSQL 16 + Prisma ORM | Open source, row-level security via Prisma middleware, full relational model |
| Auth | NextAuth.js (Auth.js) v5 | Multi-provider (email, Google, SAML, OIDC), JWT with custom claims |
| AI | OpenAI API (GPT-4o, GPT-4o-mini, text-embedding-3-large) | Provider-abstracted behind an interface — swap to Anthropic, local models, etc. |
| File storage | S3-compatible (AWS S3, MinIO, Cloudflare R2) | Presigned uploads, any S3-compatible provider |
| Email | Resend or SendGrid (abstracted behind interface) | Transactional notifications |
| Charts | Recharts (React) + Chart.js (fallback) | Native React charting, no embedded BI dependency |
| Real-time | Server-Sent Events (SSE) or WebSocket via socket.io | Notifications, live score updates |
| Search | PostgreSQL full-text search (pg_trgm) | No external search service dependency |
| Deployment | Docker + Docker Compose | Any cloud or self-hosted. Kubernetes-ready. |
| CI/CD | GitHub Actions (or any CI) | Build, test, deploy pipeline |
| Monitoring | OpenTelemetry + any backend (Grafana, Datadog, etc.) | Vendor-neutral observability |

---

## PROMPT 1 OF 15 — PROJECT SCAFFOLD & SOLUTION STRUCTURE

```
You are building CaseForge, a multi-tenant white-labeled SaaS platform for managing AI use case lifecycles. This is Prompt 1 of 15. Create the complete project structure using Next.js 14 with App Router.

TECHNOLOGY: React 18 + Next.js 14 (App Router, TypeScript), PostgreSQL + Prisma, NextAuth.js v5, Tailwind CSS, tRPC, Zustand, TanStack Query.

CREATE THIS PROJECT STRUCTURE:

/caseforge
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── docker-compose.yml                # PostgreSQL + app for local dev
├── Dockerfile                        # Production container
├── .env.example                      # All env vars documented
├── prisma/
│   ├── schema.prisma                 # Complete data model (Prompt 2)
│   ├── seed.ts                       # Seed data (Prompt 15)
│   └── migrations/                   # Auto-generated
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Landing / redirect to dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/                    # Authenticated app shell
│   │   │   ├── layout.tsx            # Sidebar + topbar + tenant branding
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── intake/               # Stage 1
│   │   │   │   ├── page.tsx          # Intake list
│   │   │   │   ├── new/page.tsx      # New intake wizard
│   │   │   │   └── [id]/page.tsx     # Edit/view intake
│   │   │   ├── review/               # Stage 2 + 3A
│   │   │   │   ├── queue/page.tsx    # Review queue
│   │   │   │   ├── gate/[id]/page.tsx # Gating review
│   │   │   │   ├── profiles/page.tsx # Profile review dashboard
│   │   │   │   └── profiles/[id]/page.tsx
│   │   │   ├── scoring/              # Stage 3B
│   │   │   │   ├── [id]/page.tsx     # Score a use case
│   │   │   │   └── portfolio/page.tsx # Ranked portfolio
│   │   │   ├── architecture/         # Stage 4
│   │   │   │   └── [id]/page.tsx     # Solution design
│   │   │   ├── evaluation/           # Stage 5
│   │   │   │   ├── [id]/page.tsx     # Assessment
│   │   │   │   ├── [id]/gates/page.tsx
│   │   │   │   ├── [id]/financial/page.tsx
│   │   │   │   ├── [id]/criteria/page.tsx
│   │   │   │   └── [id]/scorecard/page.tsx
│   │   │   ├── delivery/             # Stage 6
│   │   │   │   ├── waves/page.tsx    # Wave planning
│   │   │   │   ├── pilot/[id]/page.tsx
│   │   │   │   └── scaleup/[id]/page.tsx
│   │   │   ├── operations/           # Stage 7
│   │   │   │   ├── page.tsx          # Operations dashboard
│   │   │   │   └── [id]/page.tsx     # Use case ops detail
│   │   │   ├── usecase/[id]/page.tsx # Master detail page (all tabs)
│   │   │   ├── partner/              # Partner-level views
│   │   │   │   ├── dashboard/page.tsx # Cross-customer dashboard
│   │   │   │   ├── workload/page.tsx
│   │   │   │   └── health/page.tsx
│   │   │   ├── admin/                # Admin pages (3 tiers)
│   │   │   │   ├── platform/         # Platform super admin
│   │   │   │   ├── partner/          # Partner admin
│   │   │   │   └── customer/         # Customer admin
│   │   │   └── reports/
│   │   │       ├── gate-report/page.tsx
│   │   │       └── export/page.tsx
│   │   └── api/                      # API routes
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── trpc/[trpc]/route.ts
│   ├── server/                       # Server-side code
│   │   ├── trpc/
│   │   │   ├── router.ts             # Root tRPC router
│   │   │   ├── context.ts            # tRPC context with auth + tenant
│   │   │   ├── middleware.ts          # Auth, tenant, role middleware
│   │   │   └── routers/
│   │   │       ├── usecase.ts
│   │   │       ├── scoring.ts
│   │   │       ├── workflow.ts
│   │   │       ├── architecture.ts
│   │   │       ├── evaluation.ts
│   │   │       ├── financial.ts
│   │   │       ├── admin.ts
│   │   │       ├── partner.ts
│   │   │       ├── ai.ts
│   │   │       ├── import.ts
│   │   │       └── export.ts
│   │   ├── services/
│   │   │   ├── scoring-engine.ts     # All scoring formulas (pure functions)
│   │   │   ├── effort-engine.ts      # Effort estimation (pure functions)
│   │   │   ├── control-engine.ts     # Control inheritance (pure functions)
│   │   │   ├── financial-engine.ts   # ROI/NPV/payback (pure functions)
│   │   │   ├── workflow-engine.ts    # State machine + transition guards
│   │   │   ├── notification-service.ts # Email + in-app notifications
│   │   │   ├── ai-service.ts         # OpenAI abstraction layer
│   │   │   ├── storage-service.ts    # S3-compatible file storage
│   │   │   ├── tenant-service.ts     # Tenant resolution + config
│   │   │   └── access-resolver.ts    # Three-tier access control
│   │   ├── db/
│   │   │   ├── client.ts             # Prisma client singleton
│   │   │   └── middleware.ts         # Tenant-scoping middleware for Prisma
│   │   └── auth/
│   │       └── config.ts             # NextAuth configuration
│   ├── components/
│   │   ├── ui/                       # Primitives (Button, Input, Modal, Badge, etc.)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── TenantSwitcher.tsx    # Partner users only
│   │   │   ├── TenantBrand.tsx       # Applies tenant CSS vars
│   │   │   ├── NotificationBell.tsx
│   │   │   └── BreadcrumbBar.tsx
│   │   ├── intake/                   # Stage 1 form components
│   │   ├── scoring/                  # Score inputs, radar chart, weight sliders
│   │   ├── lifecycle/                # Timeline, stage badges, transition bar
│   │   ├── charts/                   # Reusable chart wrappers (Recharts)
│   │   └── forms/                    # Dynamic form builder, field renderers
│   ├── lib/
│   │   ├── scoring/                  # Pure scoring functions (shared client+server)
│   │   │   ├── portfolio-scoring.ts
│   │   │   ├── feasibility-scoring.ts
│   │   │   ├── risk-tier.ts
│   │   │   ├── effort-calculator.ts
│   │   │   ├── control-inheritance.ts
│   │   │   ├── financial-calculator.ts
│   │   │   └── weight-versioning.ts
│   │   ├── workflow/
│   │   │   ├── stage-transitions.ts  # Valid transition map
│   │   │   └── transition-guards.ts  # Guard conditions
│   │   ├── constants/
│   │   │   ├── seed-data.ts          # Default drivers, questions, gates
│   │   │   └── enums.ts              # All enum definitions
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   └── utils/
│   │       ├── tenant-theme.ts       # CSS variable injection
│   │       └── format.ts             # Number/date formatting
│   ├── hooks/
│   │   ├── use-tenant.ts             # Current tenant context
│   │   ├── use-access.ts             # Current user access level
│   │   └── use-notifications.ts      # Notification state
│   └── stores/
│       ├── app-store.ts              # Zustand global state
│       └── intake-form-store.ts      # Draft form state
├── tests/
│   ├── scoring/                      # Unit tests for all pure functions
│   ├── workflow/                     # State machine tests
│   └── api/                          # API integration tests
└── docs/
    └── api.md                        # API documentation

REQUIREMENTS:
1. Initialize Next.js 14 with App Router, TypeScript strict mode, Tailwind CSS
2. Set up Prisma with PostgreSQL connection string from env
3. Set up tRPC with Next.js App Router integration
4. Set up NextAuth.js v5 with credentials + Google + SAML providers
5. Create docker-compose.yml with PostgreSQL 16 + app services
6. Create the root layout with TanStack Query provider, tRPC provider, session provider
7. Create the authenticated app layout with:
   - Sidebar navigation (collapsible, role-aware)
   - Top bar with tenant logo, user menu, notification bell, tenant switcher (partner users)
   - Breadcrumb bar
   - Main content area
8. Create the tenant theming system:
   - CSS custom properties: --brand-primary, --brand-accent, --brand-font, --brand-logo-url
   - TenantBrand component that injects tenant-specific CSS variables on mount
   - Tailwind config extended with CSS variable references
9. Create the tRPC context with auth session and tenant resolution
10. Create a health check API route at /api/health
11. Ensure `npm run dev` starts the app with hot reload
12. Ensure `npm run build` succeeds with zero TypeScript errors

NPM PACKAGES:
next, react, react-dom, @trpc/server, @trpc/client, @trpc/react-query, @trpc/next,
@tanstack/react-query, @prisma/client, prisma (dev), next-auth,
zustand, recharts, tailwindcss, @tailwindcss/forms, @tailwindcss/typography,
zod (validation), date-fns, lucide-react (icons), openai,
@aws-sdk/client-s3 (file storage), resend (email),
xlsx (import/export), vitest (testing), @testing-library/react

Do NOT create placeholder or stub implementations. Every file should have real, functional code.
```

---

## PROMPT 2 OF 15 — DATA MODEL: PRISMA SCHEMA & TYPES

```
You are building CaseForge. This is Prompt 2 of 15. The project structure from Prompt 1 exists. Now create the complete data model.

CREATE prisma/schema.prisma with ALL entities below. Use PostgreSQL as the provider. Every model must include tenantId for row-level isolation (enforced via Prisma middleware, not application code).

ENUMS (define as Prisma enums):

enum TenantType { PARTNER_MANAGED, SELF_SERVE }
enum PartnerRole { PARTNER_ADMIN, PARTNER_CONSULTANT }
enum SecurityRole { PLATFORM_SUPER_ADMIN, PARTNER_ADMIN, PARTNER_CONSULTANT, CUSTOMER_ADMIN, PORTFOLIO_MANAGER, EVALUATOR, SUBMITTER, DATA_SECURITY_REVIEWER, EXECUTIVE_SPONSOR, VIEWER }
enum LifecycleStage { INTAKE_DRAFT, INTAKE_COMPLETE, PENDING_REVIEW, INFO_REQUEST, GATING_REVIEW, PROFILE_REVIEW, PORTFOLIO_SCORING, DEEP_FEASIBILITY, WAVE_PLANNING, PILOT, SCALE_UP, PRODUCTION, ON_HOLD, GATED_OUT, RETIRED }
enum UseCaseStatus { ACTIVE, ON_HOLD, COMPLETED, CANCELLED, GATED_OUT }
enum GateDecision { NONE, PASS, GATE_A, GATE_B, GATE_C, GATE_D, HOLD }
enum RiskTier { R1_MINIMAL, R2_LIMITED, R3_ELEVATED, R4_HIGH_IMPACT }
enum CompositeVerdict { STRONG_GO, CONDITIONAL_GO, NOT_READY, NO_GO }
enum HardGateStatus { ALL_PASSED, HAS_FAILURES, INCOMPLETE }
enum CostBand { S_UNDER_50K, M_50K_150K, L_150K_400K, XL_OVER_400K }
enum DataReadinessFlag { GREEN, AMBER, RED }
enum DataClassification { PUBLIC, INTERNAL, CONFIDENTIAL, PII, PII_SENSITIVE, PHI, CUI, FINANCIAL }
enum PiiType { NONE, SSN, TAX_ID, DOB, EMAIL, PHONE, ADDRESS, NAME, BIOMETRIC, FINANCIAL_ACCOUNT, HEALTH_RECORD, DRIVER_LICENSE, PASSPORT, OTHER }
enum LlmContextEntry { YES_IN_PROMPT, YES_IN_RAG, NO_PRE_PROCESS, NO_NOT_USED }
enum RequiredHandling { TOKENIZE, MASK, ENCRYPT, ANONYMIZE, REDACT, AGGREGATE_ONLY, NO_SPECIAL }
enum ConsentBasis { CONTRACT, LEGITIMATE_INTEREST, EXPLICIT_CONSENT, LEGAL_OBLIGATION, NOT_APPLICABLE }
enum SystemType { ERP, CRM, DATA_WAREHOUSE, DATA_LAKE, FILE_SHARE, API, MAINFRAME, SAAS, IOT, OTHER }
enum AccessMethod { DIRECT_DB, REST_API, ODATA, SFTP, FLAT_FILE, CDC, KAFKA, GRAPHQL, SDK, MANUAL, OTHER }
enum AuthMethod { OAUTH2, API_KEY, SERVICE_ACCOUNT, SSO, CERTIFICATE, BASIC_AUTH, NONE, OTHER }
enum NetworkAccess { VPN_REQUIRED, PRIVATE_ENDPOINT, PUBLIC, AIR_GAPPED, OTHER }
enum LatencyTolerance { REAL_TIME, SUB_HOUR, SAME_DAY, NEXT_DAY, WEEKLY, NOT_CRITICAL }
enum AiPattern { RAG, FINE_TUNED, SINGLE_AGENT, MULTI_AGENT, CLASSIFICATION, EXTRACTION, SUMMARIZATION, CODE_GEN, OTHER }
enum AgentSubPattern { REACT, PLAN_EXECUTE, SUPERVISOR_WORKER, SWARM, TOOL_USE_ONLY, NOT_APPLICABLE }
enum ModelHosting { OPENAI_MANAGED, SELF_HOSTED, BEDROCK, ON_PREM, OTHER }
enum VectorStore { AI_SEARCH, PINECONE, WEAVIATE, PGVECTOR, CHROMA, COSMOS_VECTOR, OTHER }
enum RetrievalStrategy { SEMANTIC, KEYWORD, HYBRID_RRF, MULTI_QUERY, OTHER }
enum DeploymentArch { SERVERLESS, CONTAINER, APP_SERVICE, VM, FUNCTIONS, OTHER }
enum FallbackBehavior { ESCALATE, RETRY_SIMPLIFIED, LOG_ABANDON, QUEUE_REVIEW }
enum MemoryMgmt { STATELESS, SESSION_SCOPED, PERSISTENT }
enum SecurityReviewStatus { NOT_STARTED, IN_PROGRESS, ATO_GRANTED, NOT_REQUIRED }
enum NdaStatus { NOT_STARTED, IN_PROGRESS, EXECUTED, NOT_REQUIRED }
enum ProfileSection { DATA_INGESTION, DATA_QUALITY, SENSITIVE_DATA, DOMAIN_MODEL, GOVERNANCE, SECURITY, SOLUTION_ARCHITECTURE }
enum ProfileReviewStatus { PENDING, IN_REVIEW, APPROVED, REJECTED, INFO_REQUESTED }
enum ControlStatus { REQUIRED, IMPLEMENTED, VERIFIED, WAIVED }
enum ConfidenceLevel { LOW, MEDIUM, HIGH }
enum ScoringAxisType { VALUE, FEASIBILITY, RISK }
enum SuccessCriteriaStatus { NOT_MEASURED, BELOW_MINIMUM, MEETS_MINIMUM, MEETS_TARGET, EXCEEDS_STRETCH }
enum ScoringModelVersionStatus { DRAFT, ACTIVE, SUPERSEDED }
enum WeightProposalStatus { PROPOSED, APPROVED, REJECTED, WITHDRAWN }

MODELS (create each with all fields as specified):

1. Partner — id, name, logoUrl, primaryColor, accentColor, contactEmail, isActive, createdAt, maxCustomers, maxConsultants
   Relations: partnerUsers[], tenants[]

2. PartnerUser — id, partnerId, userId, partnerRole, isActive, joinedAt
   Relations: partner, user, customerAssignments[]

3. CustomerAssignment — id, partnerId, partnerUserId, tenantId, roleInTenant, assignedBy, assignedAt, isActive
   Relations: partner, partnerUser, tenant

4. Tenant — id, name, type, partnerId?, subscriptionTier, isActive, createdAt, logoUrl, primaryColor, accentColor, fontFamily, customDomain, emailFromName, emailFromAddress, terminologyOverrides (Json), intakeFormConfig (Json)
   Relations: partner?, useCases[], scoringModels[], users[]

5. User — id, email, name, tenantId?, role, isActive, createdAt, lastLoginAt
   Relations: tenant?, partnerUser?

6. UseCase — id, tenantId, useCaseNumber, title, businessUnit, submittedById, dateSubmitted, executiveSponsorName, executiveSponsorTitle, problemStatement, proposedSolution, expectedBenefits, aiPattern?, autonomyLevel?, currentFtes?, currentVolume?, currentCycleTime?, currentErrorRate?, annualCost?, knownPainPoints?, sourceSystemsText?, readSystems?, writeSystems?, ingestionMethod?, ingestionFrequency?, dataVolume?, historicalRequired?, dqIssues?, remediationNeeded?, dqOwnership?, businessDomains?, masterRefData?, modelRelationship?, auditabilityRequired?, policyReviewRequired?, policyReviewBody?, ndaStatus?, dataOwner?, dataSteward?, retentionPolicy?, regulatoryConsiderations?, dataClassification?, accessControlReqs?, piiCuiPresent?, encryptionReqs?, govtModelAccess?, securityReviewStatus?, reportingReqs?, endUserPersonas?, conversationalAiRequired?, accessChannels?, downstreamConsumption?, submitterPriority?, submitterComplexity?, estimatedTimeline?, dependenciesRisks?, gateDecision, gateRationale?, gateDecidedById?, gateDecidedAt?, valueScore?, feasibilityScore?, riskScore?, riskTier?, tierMultiplier?, priorityScore?, rank?, compositeFeasibility?, compositeVerdict?, hardGateStatus?, wave?, costBand?, timelineBand?, pilotSlice?, dataReadinessFlag?, currentStage, status, currentScoringVersionId?, createdAt, updatedAt
   Relations: tenant, submittedBy, scores[], sourceSystemInventory[], sensitiveDataElements[], solutionArchitecture?, financialModel?, effortEstimate?, hardGates[], feasibilityAssessments[], successCriteria[], lifecycleEvents[], profileReviews[], mandatoryControls[], actionItems[], scoringSnapshots[]

7. SourceSystem — id, useCaseId, tenantId, systemName, systemType, environment, tablesViewsObjects?, fieldsRequired (Json)?, accessMethod, authMethod?, rateLimits?, dataRefreshSla?, sourceOwnerContact?, existingEtl?, networkAccess, initialLoadVolume?, incrementalVolume?, growthRate?, latencyTolerance

8. SensitiveDataElement — id, useCaseId, tenantId, sourceSystemId?, sourceSystemName?, tableObject?, fieldColumnName?, businessMeaning?, dataClassification, piiType?, regulatoryRegime?, entersLlmContext?, requiredHandling?, consentBasis?, rightToErasure, crossBorderTransfer, transferDestination?, retentionPeriod?

9. SolutionArchitecture — id, useCaseId, tenantId, aiPattern, agentSubPattern?, llmModels (Json)?, modelHosting?, contextWindowReq?, tokenEstimatePerTx?, dailyTxVolume?, estMonthlyLlmCost?, fineTuningRequired?, trainingDataDesc?, ragCorpusDesc?, ragCorpusDocCount?, ragUpdateFrequency?, chunkingStrategy?, embeddingModel?, vectorStore?, retrievalStrategy?, rerankingEnabled?, citationRequired?, corpusSensitiveData?, agentTools (Json)?, agentWriteActions (Json)?, agentReadActions (Json)?, approvalGates (Json)?, maxToolCalls?, toolCallTimeoutSec?, fallbackBehavior?, memoryMgmt?, orchestrationPattern?, observabilityTool?, inputValidation (Json)?, outputValidation (Json)?, contentFilterLevel?, promptInjectionMitigation?, hallucinationMitigation?, piiLeakagePrevention?, rateLimitConfig?, tokenBudgetMax?, biasTestingScope?, redTeamScope?, driftMonitoringPlan?, computeRequirements?, storageRequirements?, estMonthlyInfraCost?, deploymentArch?, scalingStrategy?, haRequirements?, loggingConfig?, backupRecovery?, envPromotionPath?, createdById, version, status, createdAt, updatedAt

10. FinancialModel — id, useCaseId, tenantId, currentLaborDirect?, currentLaborMgmt?, currentErrorCost?, currentSlaPenalty?, currentOpportunityCost?, currentToolCost?, currentTotal?, devInternalOnetime?, devExternalOnetime?, llmApiAnnual?, infraAnnual?, integrationOnetime?, testingOnetime?, changeMgmtOnetime?, maintenanceAnnual?, monitoringAnnual?, hitlLaborAnnual?, totalOnetime?, totalAnnualOpex?, netAnnualBenefit?, paybackMonths?, year1Roi?, npv3yr?

11. EffortEstimate — id, useCaseId, tenantId, dataEngineeringHrs?, integrationHrs?, aiDevelopmentHrs?, securityComplianceHrs?, testingHrs?, infrastructureHrs?, changeMgmtHrs?, totalEstimatedHrs?, calculatedCostBand?, estMonthlyRunCost?, confidenceLevel?, assumptions (Json)?, version, createdById?, lastCalculatedAt

12. MandatoryControl — id, useCaseId, tenantId, controlCode, controlName, controlDescription?, triggeredBy?, status, waiverApprovedById?, waiverJustification?, implementationNotes?, verifiedById?, verifiedAt?

13. ScoringModel — id, tenantId, name, isDefault, valueWeightInPriority (default 0.5), feasibilityWeightInPriority (default 0.5), version, createdById?, createdAt, isActive
    Relations: axes[], dimensions[], riskTiers[], versions[]

14. ScoringAxis — id, modelId, axisName, axisType, displayOrder
    Relations: drivers[]

15. ScoringDriver — id, axisId, driverName, weight, anchorText1?, anchorText3?, anchorText5?, intakeFeedSections?, displayOrder

16. AxisScore — id, useCaseId, driverId, score (1-5), evidenceNotes?, scoredById?, scoredAt?, versionId?

17. RiskTierConfig — id, modelId, tierCode, tierName, upperBound, multiplier, controlsInherited?, displayOrder

18. FeasibilityDimension — id, modelId, dimensionCode (D1-D6), dimensionName, weight, rubricText?, displayOrder
    Relations: questions[]

19. FeasibilityQuestion — id, dimensionId, questionText, isAiGenerated, isActive, displayOrder

20. FeasibilityAssessment — id, useCaseId, questionId, score (1-5)?, evidenceNotes?, scoredById?, scoredAt?

21. HardGate — id, useCaseId, tenantId, gateCode, gateName, conditionText?, result?, evidenceNotes?, autoPopulatedFrom?, reviewedById?, reviewedAt?

22. SuccessCriteria — id, useCaseId, tenantId, metricName, metricType?, currentBaseline?, minThreshold?, target?, stretchGoal?, actualResult?, measurementMethod?, status?, measuredAt?

23. LifecycleEvent — id, useCaseId, tenantId, fromStage, toStage, transitionedById, transitionedAt, notes?, approvalRequired?, approvedById?, approvalAt?

24. ProfileReview — id, useCaseId, tenantId, section, assignedToId?, status, reviewNotes?, reviewedAt?, infoRequestDetails?

25. ActionItem — id, useCaseId, tenantId, recommendedAction?, owner?, followUpDate?, status?, completedAt?, notes?

26. ScoringModelVersion — id, modelId, tenantId, versionNumber, status, effectiveDate?, supersededDate?, createdById?, createdAt, changeSummary?, changeReason?, valueDriversJson (Json), feasibilityDriversJson (Json), riskDriversJson (Json), valueWeightInPriority, feasibilityWeightInPriority, riskTierConfigJson (Json)

27. ScoringSnapshot — id, useCaseId, tenantId, versionId, snapshotDate, valueScore, feasibilityScore, riskScore, riskTier, tierMultiplier, priorityScore, rank

28. WeightChangeProposal — id, modelId, tenantId, proposedById, proposedAt, status, reason?, proposedValueDriversJson (Json)?, proposedFeasibilityDriversJson (Json)?, proposedRiskDriversJson (Json)?, proposedValueWeight?, proposedFeasibilityWeight?, impactPreviewJson (Json)?, resolvedById?, resolvedAt?, resolutionNotes?

29. Notification — id, tenantId?, userId, title, message, link?, isRead, createdAt

30. AuditLog — id, tenantId?, userId?, partnerId?, entityType, entityId, action, beforeJson (Json)?, afterJson (Json)?, timestamp

CREATE src/server/db/middleware.ts:
Prisma middleware that automatically:
1. Adds tenantId filter to every findMany, findFirst, findUnique, count, aggregate query
2. Sets tenantId on every create operation
3. Validates tenantId on every update and delete
4. Skips tenant filtering for PlatformSuperAdmin role
5. For partner users in cross-customer view, filters to their accessible tenant list

CREATE src/lib/types/index.ts:
TypeScript types derived from Prisma models with proper typing for all JSON fields.

CREATE src/lib/constants/enums.ts:
Export all enums with display labels (e.g., { value: "GATE_A", label: "Gate A — Too easy" }).

Ensure `npx prisma generate` and `npx prisma db push` succeed.
```

---

## PROMPT 3 OF 15 — AUTHENTICATION, MULTI-TENANCY & THREE-TIER ACCESS

```
You are building CaseForge. This is Prompt 3 of 15. Prompts 1-2 are complete. Now implement authentication, three-tier multi-tenancy, and role-based access control.

NEXTAUTH CONFIGURATION (src/server/auth/config.ts):
1. Providers: Credentials (email+password), Google OAuth, generic OIDC/SAML (for enterprise SSO)
2. JWT strategy with custom claims: userId, tenantId, role, partnerId, partnerRole, accessibleTenantIds
3. Session callback that enriches the session with tenant context
4. Password hashing with bcrypt

THREE-TIER ACCESS RESOLVER (src/server/services/access-resolver.ts):

export class AccessResolver {
  // Resolution order:
  // 1. PlatformSuperAdmin → full access to any tenant
  // 2. PartnerUser → check PartnerUser + CustomerAssignment tables
  //    a. PartnerAdmin → access all tenants under their partner
  //    b. PartnerConsultant → access only assigned tenants with assigned role
  // 3. CustomerUser → access only their own tenant with their role
  async resolve(session: Session, requestedTenantId?: string): Promise<AccessContext>
}

type AccessContext = {
  userId: string
  tenantId: string | null  // null for cross-customer partner views
  effectiveRole: SecurityRole
  partnerId: string | null
  isPartnerUser: boolean
  accessLevel: 'PLATFORM' | 'PARTNER' | 'CUSTOMER'
  accessibleTenantIds: string[]
}

tRPC MIDDLEWARE (src/server/trpc/middleware.ts):
1. authMiddleware — verifies session exists, rejects unauthenticated
2. tenantMiddleware — resolves tenant context, injects into tRPC context
3. roleMiddleware(allowedRoles: SecurityRole[]) — checks effective role against allowed list
4. auditMiddleware — logs all mutations to AuditLog

TENANT SWITCHER (src/components/layout/TenantSwitcher.tsx):
- Only rendered for partner users (isPartnerUser === true)
- Dropdown showing all accessibleTenantIds with:
  - Tenant name and small logo
  - User's role in that tenant
  - Active indicator on current context
- "Cross-customer view" option (sets tenantId = null)
- On switch: calls setActiveTenant(), reloads tenant config, applies branding, invalidates all queries

ROLE-AWARE NAVIGATION (src/components/layout/Sidebar.tsx):
Navigation items filtered by effectiveRole:
- PlatformSuperAdmin: Partners, Tenants, Global Config
- PartnerAdmin (cross-customer): Customer Health, Workload, All Customers
- PartnerAdmin/Consultant (in customer): full nav based on roleInTenant
- CustomerAdmin: Settings, Scoring, Users, all stages
- Other roles: pages appropriate to their role

USER MANAGEMENT:
- tRPC router: admin.listUsers, admin.inviteUser, admin.updateRole, admin.deactivateUser
- Customer admin page: list users, invite, change role, deactivate
- Partner admin page: manage consultants, assign to customers
- Platform admin page: manage partners, provision tenants

AUDIT LOGGING:
- Every create/update/delete logged with: userId, tenantId, partnerId, entityType, entityId, action, before/after JSON, timestamp
- Audit log viewer page (admin only) with date, user, entity, action filters

DATA ISOLATION TESTS (tests/api/tenant-isolation.test.ts):
- Partner consultant assigned to Tenant A CANNOT query Tenant B data
- Customer user from Tenant A gets error when requesting Tenant B data
- Tenant switcher only shows assigned tenants
- Platform admin can access all tenants
```

---

## PROMPT 4 OF 15 — ADMIN PANELS (THREE-TIER)

```
You are building CaseForge. This is Prompt 4 of 15. Prompts 1-3 are complete. Now build admin panels for all three tiers.

PLATFORM ADMIN (/admin/platform/):
1. PartnerManagement — list partners, create partner, activate/deactivate, view stats
2. TenantProvisioning — create tenant under partner or self-serve, run seed data, assign admin
3. GlobalConfig — default scoring model template, default questions, default gates, subscription tiers

PARTNER ADMIN (/admin/partner/):
1. ConsultantManagement — list consultants, invite, deactivate, view workload
2. CustomerAssignment — matrix: consultants × customers × roles, drag to assign
3. PartnerSettings — partner branding, default templates

CUSTOMER ADMIN (/admin/customer/):
1. TenantSettings — logo upload (to S3), color pickers, font selector, terminology overrides JSON editor, live preview
2. ScoringModelConfig — WITH WEIGHT VERSIONING:
   - Current weights with sliders (must sum to 1.00 per axis, real-time rebalancing)
   - Version header: "v3 (active since Aug 1, 2026)"
   - "Preview Impact" — hypothetical re-scoring of all active cases, side-by-side rank comparison table
   - "Apply New Weights" — requires change reason, creates new version, snapshots old scores, re-scores all active cases, recalculates rankings, fires notifications
   - Proposal handling: if consultant proposed changes, show banner with approve/reject
3. WeightHistory — timeline of all versions, version detail, compare two versions side-by-side, view portfolio snapshot under any historical version
4. IntakeFormConfig — section visibility toggles, field mandatory/optional, picklist management, custom fields (up to 20), guidance text editor
5. FeasibilityConfig — question list by dimension, active/inactive toggle, edit text, add custom questions, dimension weight sliders, interpretation band thresholds
6. HardGateConfig — list 8 default gates, toggle active, edit text, add custom (up to 4 more)
7. NotificationConfig — event × channel matrix (Email, In-App), toggle each on/off
8. UserManagement — customer users only, invite/role change/deactivate

Weight versioning tRPC endpoints:
- scoringModel.createDraftVersion, scoringModel.previewImpact, scoringModel.applyVersion
- scoringModel.listVersions, scoringModel.getVersionSnapshots, scoringModel.compareVersions
- scoringModel.createProposal, scoringModel.approveProposal, scoringModel.rejectProposal
```

---

## PROMPT 5 OF 15 — STAGE 1: INTAKE FORM WIZARD

```
You are building CaseForge. This is Prompt 5 of 15. Prompts 1-4 are complete. Now build the Stage 1 intake form.

Create a multi-step wizard at /intake/new with 11 sections. Use React Hook Form + Zod for validation. Store draft state in Zustand (persisted to DB via auto-save).

WIZARD BEHAVIOR:
- Horizontal stepper showing 11 sections with completion status (empty/partial/complete)
- Sections completable in any order by clicking stepper
- "Save Draft" on every section — saves to DB via tRPC mutation with status = INTAKE_DRAFT
- Auto-save every 60 seconds if dirty
- "Review & Submit" when all mandatory sections green
- Respects tenant intake form config (hidden sections, mandatory overrides, custom fields)

SECTIONS (create as separate React components):
1. SubmissionDetails — title, business unit (tenant picklist), exec sponsor name+title, source
2. Description — problem statement (textarea), proposed solution, expected benefits, AI pattern (optional dropdown), autonomy level (optional)
3. CurrentState — how work is done today, FTEs, volume, cycle time, error rate, annual cost, pain points
4. DataLandscape — source systems (text), read systems, write systems, ingestion method (multi-select), frequency, volume, historical required (toggle + lookback)
5. DataQuality — known issues, remediation needed (toggle + plan), DQ ownership
6. DomainModel — business domains (multi-select), master/ref data, model relationship (dropdown)
7. Governance — auditability (toggle + detail), policy review (toggle + body), NDA status (dropdown), data owner, steward, retention, regulatory
8. Security — classification (dropdown), access control, PII/CUI present (toggle + detail), encryption (multi-select), govt model access, ATO status (dropdown)
9. Consumption — reporting reqs, end-user personas, conversational AI (toggle + detail), access channels (multi-select), downstream consumption
10. Assessment — priority (dropdown, context only), complexity (dropdown, context only), timeline, dependencies
11. NextSteps — recommended action, owner, follow-up date

REVIEW PAGE (/intake/[id]/review):
- Read-only summary of all sections
- Red highlight on incomplete mandatory fields
- AI completeness check (call OpenAI via tRPC):
  - Flags vague problem statements
  - Flags cross-section inconsistencies (CUI without regulatory, writes without agent description, PII without handling)
  - Suggests data classification
  - Returns warnings with severity (error/warning/suggestion)
- "Acknowledge & Submit" or "Go Back to Fix"
- Submit transitions to PENDING_REVIEW, creates notification

INTAKE LIST (/intake):
- Table: UC number, title, business unit, stage, date, completion %
- Filter by stage, business unit, date range
- Sort by any column
- "New Use Case" button
- Click row to open

tRPC ENDPOINTS:
- usecase.create, usecase.update, usecase.submit, usecase.get, usecase.list
- usecase.uploadAttachment (presigned S3 URL)
- ai.completenessCheck
```

---

## PROMPT 6 OF 15 — STAGE 2: TRIAGE & GATING WORKFLOW

```
You are building CaseForge. This is Prompt 6 of 15. Prompts 1-5 are complete. Now build Stage 2 triage and gating.

/review/gate/[id] — GATING REVIEW:
- Left panel (60%): read-only intake form (all sections, collapsible)
- Right panel (40%): gate decision form
  - Gate dropdown: Pass, Gate A-D, Hold (with definition as helper text per option)
  - Rationale textarea (required, min 1 sentence)
  - "Record Decision" button
  - Pass → creates profile reviews, transitions to PORTFOLIO_SCORING, notifies
  - Gate A-D → GATED_OUT with rationale, notifies submitter
  - Hold → INFO_REQUEST, notifies submitter with what's needed

/review/queue — REVIEW QUEUE:
- List of PENDING_REVIEW cases with UC#, title, business unit, date, days waiting
- Badge count in sidebar nav

/reports/gate-report — GATE REPORT:
- All gated-out cases grouped by gate code with rationale
- Professional formatting, exportable to Excel

INFO REQUEST WORKFLOW:
- Submitter receives notification, can edit sections, resubmit
- Resubmission returns to PENDING_REVIEW

tRPC: usecase.recordGateDecision, usecase.createInfoRequest, usecase.resubmit, usecase.getReviewQueue
```

---

## PROMPT 7 OF 15 — STAGE 3A: PROFILE REVIEWS & DATA INVENTORIES

```
You are building CaseForge. This is Prompt 7 of 15. Prompts 1-6 are complete. Now build Stage 3A specialist profile reviews.

When gating = Pass, auto-create 5 ProfileReview records (DATA_INGESTION, DATA_QUALITY, SENSITIVE_DATA, GOVERNANCE, SECURITY).

/review/profiles — PROFILE REVIEW DASHBOARD:
- Reviews assigned to current user: UC#, title, section, status, days open
- Click to open appropriate review form

CREATE 5 REVIEW FORMS:

1. SourceSystemReview — Data Engineer enriches source systems
   - Read-only submitter's §4 answers at top
   - Editable table: one row per SourceSystem record (15 fields each per spec)
   - "Add Source System" button, pre-seeded from submitter's text
   - Dropdowns for SystemType, AccessMethod, AuthMethod, NetworkAccess, LatencyTolerance

2. DataQualityReview — Data Steward validates §5
   - DQ baseline score (0-100), validated issues, remediation plan/owner/timeline, sufficient for pilot?

3. SensitiveDataReview — Data Steward + Security
   - THE CRITICAL REVIEW: field-level PII/CUI inventory
   - Editable table: one row per SensitiveDataElement (13 fields)
   - "Enters LLM Context?" column DISABLED here — marked "Stage 4: AI Architect"
   - Auto-calculated summary: total fields, PII count, tokenization needed, erasure fields, cross-border count

4. GovernanceReview — Compliance/Legal reviews §7
   - Policy review completed, NDA validated, regulatory confirmed, ownership confirmed, auditability confirmed

5. SecurityReview — Security Architect reviews §8
   - Classification validated, access control designed, encryption confirmed, ATO path, govt env, network security, threat model

Each form: Approve / Reject / Request Info buttons. When ALL 5 approved AND gating = Pass → auto-transition to PORTFOLIO_SCORING.

tRPC: profileReview.createAll, profileReview.get, profileReview.update, profileReview.getMyQueue, sourceSystem.create/update/delete, sensitiveData.create/update/delete
```

---

## PROMPT 8 OF 15 — STAGE 3B: PORTFOLIO SCORING ENGINE

```
You are building CaseForge. This is Prompt 8 of 15. Prompts 1-7 are complete. Now build the portfolio scoring engine with weight versioning.

CREATE src/lib/scoring/portfolio-scoring.ts — PURE FUNCTIONS (no DB, no side effects):

calculateAxisScore(drivers: {weight: number, score: number}[]): number  // weighted sum, range 1-5
determineRiskTier(riskScore: number, tiers: RiskTierConfig[]): RiskTierConfig  // score → tier
calculatePriorityScore(valueScore, feasibilityScore, valueWeight, feasibilityWeight, tierMultiplier): number
calculateRanking(cases: {id: string, priorityScore: number}[]): Map<string, number>
calculateDataReadiness(sources: SourceSystem[], dq: DataQualityProfile, sensitive: SensitiveDataElement[]): DataReadinessFlag
calculateHypothetical(activeCases, currentScores, proposedVersion): HypotheticalScore[]  // preview without saving
reScorePortfolio(activeCases, allScores, newVersion): ReScoreResult[]  // batch re-score

CREATE src/lib/scoring/weight-versioning.ts — PURE FUNCTIONS:
createSnapshots(activeCases, beingSuperseded): ScoringSnapshot[]
generateChangeSummary(oldVersion, newVersion): string
compareVersions(snapshotsV1, snapshotsV2): RankComparison[]

/scoring/[id] — PORTFOLIO SCORING PAGE:
- Three scoring panels (Value, Feasibility, Risk) each with 5 drivers
- Weight (read-only from ScoringModel), score dropdown (1-5), evidence textarea
- Evidence PRE-POPULATED from intake + profile review data (15 mappings from process map)
- Auto-calculated: axis scores, risk tier (color badge), priority score
- "Complete Scoring" validates all 15 scored, transitions to DEEP_FEASIBILITY
- Header: "Scoring under weight model v{X}"

/scoring/portfolio — RANKED PORTFOLIO:
- Table: rank, title, directorate, value, feasibility, risk, tier, priority, wave, readiness
- Version selector: view rankings under any historical version (from ScoringSnapshot)
- "Compare Versions" button for side-by-side ranking diff
- Exportable to Excel

SCORE HISTORY on use case detail page:
- Table: version#, effective date, all scores, priority, rank
- Line chart: priority score over time

UNIT TESTS: test all pure functions with known inputs/outputs, boundary cases, ties.
```

---

## PROMPT 9 OF 15 — STAGE 4: SOLUTION ARCHITECTURE, EFFORT & CONTROLS

```
You are building CaseForge. This is Prompt 9 of 15. Prompts 1-8 are complete. Now build Stage 4.

/architecture/[id] — TABBED FORM (5 tabs):

Tab 1: AI Pattern & Model — pattern selector, sub-pattern (conditional), LLM models (dynamic list), hosting, context window, token estimate, daily volume, monthly LLM cost (auto-calc), fine-tuning toggle
Tab 2: RAG Architecture (conditional) — corpus, doc count, update frequency, chunking, embedding model, vector store, retrieval strategy, reranking, citation, corpus sensitivity
Tab 3: Agent Architecture (conditional) — tools list (dynamic: name, system, action, read/write), approval gates, max tool calls, timeout, fallback, memory, orchestration, observability
Tab 4: Guardrails & Safety — input validation (multi-select + text), output validation, content filter, prompt injection mitigation, hallucination mitigation, PII leakage prevention, rate limiting, token budget, bias testing scope, red team scope, drift monitoring
Tab 5: Infrastructure — compute, storage, monthly infra cost, deployment arch, scaling, HA, logging, backup, env promotion path

LLM CONTEXT DETERMINATION — collapsible panel on all tabs:
- Shows all SensitiveDataElement records from Stage 3A.3
- For EACH: architect selects "Enters LLM context?" (dropdown)
- Red-bordered, with explanatory text about consequences
- When complete: show summary + preview of controls that will auto-generate

CONTROL INHERITANCE ENGINE (src/lib/scoring/control-inheritance.ts) — PURE FUNCTION:
determineControls(elements, architecture, security): MandatoryControl[]
Implements all 10 trigger rules from spec (PII in LLM, SSN/TaxID, PHI, CUI, cross-border, erasure, financial writes, HR writes, 6+ PII, biometric)

EFFORT ESTIMATION ENGINE (src/lib/scoring/effort-calculator.ts) — PURE FUNCTION:
calculateEffort(factors: EffortFactors): EffortEstimate
Multiplier logic: source system count, integration complexity, PII in LLM, AI pattern, guardrails, corpus size → hours by discipline → cost band → monthly run cost

Display effort as bar chart (Recharts) + summary card.

UNIT TESTS for both engines.

tRPC: architecture.save, architecture.saveLlmContext (triggers control engine), architecture.getControls, architecture.getEffort, architecture.complete
```

---

## PROMPT 10 OF 15 — STAGE 5: FEASIBILITY, HARD GATES, FINANCIAL, SCORECARD

```
You are building CaseForge. This is Prompt 10 of 15. Prompts 1-9 are complete. Now build Stage 5.

CREATE src/lib/scoring/feasibility-scoring.ts — PURE FUNCTIONS:
calculateDimensionAverage(scores: number[]): number
calculateCompositeFeasibility(dimensions: {weight: number, avg: number}[]): number
determineVerdict(compositeScore: number, bands: number[]): CompositeVerdict

CREATE src/lib/scoring/financial-calculator.ts — PURE FUNCTIONS:
calculateNetAnnualBenefit, calculatePaybackMonths, calculateYear1ROI, calculateNPV

/evaluation/[id] — ASSESSMENT (58 questions):
- 6 collapsible dimension panels with questions, score dropdowns (1-5), evidence textareas
- Evidence PRE-POPULATED from Stages 1, 3, 4
- AI-generated questions (3-5 additional, flagged with badge, accept/edit/dismiss)
- Dimension averages auto-calculated with color coding (≥4 green, ≥3 amber, <3 red)
- Composite score and verdict displayed

/evaluation/[id]/gates — HARD GATES (G1-G8):
- Table: code, name, condition, Pass/Fail dropdown, evidence
- Auto-populated from earlier stages where applicable
- Gate status summary: ALL PASSED / FAILED / INCOMPLETE

/evaluation/[id]/financial — FINANCIAL MODEL:
- Current state (6 cost items, pre-populated from §3)
- Agentic solution (10 items: one-time + annual, pre-populated from Stage 4 effort + costs)
- ROI summary: net benefit, payback, Year 1 ROI, 3-year NPV (all auto-calculated)

/evaluation/[id]/criteria — SUCCESS CRITERIA:
- Quantitative metrics table (up to 8), qualitative criteria (up to 5), pilot guardrails

/evaluation/[id]/scorecard — THE DECISION PAGE:
- Dimension summary table with composite score + verdict badge
- Hard gate status, financial summary, portfolio scoring summary, controls summary, effort summary
- "Approve for Delivery" (exec sponsor, validates composite ≥ 3.0, gates passed, financials complete)
- "Place on Hold" or "No Go" with reason

UNIT TESTS for all pure functions.
```

---

## PROMPT 11 OF 15 — STAGES 6 & 7: DELIVERY & OPERATIONS

```
You are building CaseForge. This is Prompt 11 of 15. Prompts 1-10 are complete. Now build Stages 6-7.

/delivery/waves — WAVE PLANNING:
- Drag-and-drop Kanban (react-beautiful-dnd or @dnd-kit): Unassigned, Wave 1-4
- Cards: UC title, priority score, cost band badge, risk tier badge
- Wave capacity indicators, detail panel on select
- Gantt toggle view (horizontal timeline)
- "Confirm Wave Plan" locks assignments

/delivery/pilot/[id] — PILOT TRACKER:
- Success criteria table with actual values (editable), auto-calculated status
- Pilot guardrails display, progress timeline, incident log
- Mandatory controls checklist: Required → Implemented → Verified (all must be Verified before pilot)
- Checkpoint decisions (Continue/Adjust/Extend/Pause/Terminate)
- Go/No-Go decision at final checkpoint

/delivery/scaleup/[id] — SCALE-UP:
- Production scope, deployment date, readiness checklist (all items must check), "Deploy to Production"

/operations — OPERATIONS DASHBOARD:
- Production use cases with monthly metrics (success vs targets, cost actuals, performance, incidents, adoption)
- Governance panel: revalidation due dates, control verification, NDA/ATO expiry
- "Record Monthly Metrics" form
- Revalidation workflow (re-assessment of D4 + controls)
- "Retire" button with confirmation

/operations/[id] — METRICS HISTORY:
- Time-series charts: accuracy, cost, incidents over time
- Actuals vs projections comparison

tRPC endpoints for all operations.
```

---

## PROMPT 12 OF 15 — LIFECYCLE STATE MACHINE & NOTIFICATIONS

```
You are building CaseForge. This is Prompt 12 of 15. Prompts 1-11 are complete. Now build the state machine and notification engine.

CREATE src/lib/workflow/stage-transitions.ts:
Valid transitions map (all 15 stages with allowed destinations — exact map from process spec).

CREATE src/lib/workflow/transition-guards.ts:
Guard conditions for every transition (AllMandatoryFieldsComplete, GatePass+ProfilesApproved, AllDriversScored, CompositeAboveThreshold+GatesPassed, WaveAssigned+CriteriaDefined+ControlsVerified, PilotCheckpointPassed, ProductionReadinessComplete, etc.)

CREATE src/server/services/workflow-engine.ts:
- transitionAsync(usecaseId, targetStage, notes, userId) — validate guards, execute, create LifecycleEvent, update stage, trigger notifications, audit log
- getAvailableTransitions(useCase) — what can happen next
- checkGuards(useCase, targetStage) — unmet conditions without executing

STAGE TRANSITION BAR (src/components/lifecycle/StageTransitionBar.tsx):
- Horizontal bar with all stages, current highlighted
- Available transitions as buttons, guard check on click, confirmation dialog

LIFECYCLE TIMELINE (src/components/lifecycle/LifecycleTimeline.tsx):
- Vertical timeline of all events for a use case with duration at each stage

NOTIFICATION ENGINE (src/server/services/notification-service.ts):
All 24 notification triggers:
1-16: original matrix (intake submitted, profile assigned, gate decided, hard gate failed, stage transition, pilot checkpoint, R3/R4 assigned, idle >14d, NDA/ATO changed, etc.)
17-24: multi-tenant additions (weight change applied/proposed/approved/rejected, tenant provisioned, consultant assigned/removed, subscription limit approaching)

Each notification:
- Respects tenant notification preferences
- Creates in-app Notification record
- Sends email via Resend/SendGrid (with tenant branding in template)
- Deep link to relevant page
- Mark as read/unread

NOTIFICATION BELL (src/components/layout/NotificationBell.tsx):
- Bell icon with unread count badge
- Dropdown with recent 20 notifications
- Click to navigate, "Mark all read", "View all"

tRPC: notification.list, notification.markRead, notification.markAllRead
```

---

## PROMPT 13 OF 15 — DASHBOARDS & REPORTING

```
You are building CaseForge. This is Prompt 13 of 15. Prompts 1-12 are complete. Now build dashboards using Recharts (no Power BI dependency).

/dashboard — PORTFOLIO DASHBOARD (11 widgets):
1. Pipeline funnel (Recharts FunnelChart) — cases at each lifecycle stage, click to filter
2. Priority scatter (Recharts ScatterChart) — Value(x) vs Feasibility(y), bubble=breadth, color=risk tier, click navigates
3. Gate summary (stacked horizontal bar) — Pass/A/B/C/D/Hold by business unit
4. Risk heatmap (custom grid component) — directorates × risk tiers, cell=count, color intensity
5. Top 10 priority table — rank through status, click to navigate
6. Data readiness tracker — traffic light grid by use case
7. Stale cases alert — cards for cases idle >14 days
8. Intake velocity (Recharts LineChart) — submissions per week, 12 weeks
9. Profile review bottleneck (horizontal bar) — avg days by section
10. Control compliance (Recharts PieChart) — Required/Implemented/Verified %
11. Monthly run cost (stacked bar) — LLM + infra + HITL across production cases

/usecase/[id] — USE CASE DETAIL (tabbed):
- Overview: title, stage badge, intake completeness ring, profile review badges, timeline, activity log
- Scoring: radar chart (3 axes), feasibility dimension bars, hard gate badges, priority+rank+tier
- Architecture: solution summary, sensitive data summary, controls checklist, effort bar chart
- Financial: KPI cards (cost, investment, benefit, payback, ROI), comparison bar chart
- Delivery: wave, criteria tracker, pilot/production metrics
- History: lifecycle timeline, audit log, score history with version chart

/partner/dashboard — CROSS-CUSTOMER (partner users only, 4 widgets):
1. Customer health matrix table — total/active/pilot/production/avg priority/highest tier/stale/weight version per customer
2. Aggregate pipeline funnel across all customers
3. Consultant workload table (partner admin only)
4. Weight changes log across customers

/dashboard/executive — EXECUTIVE SUMMARY:
- Portfolio health gauge, investment donut, wave progress, ROI projection, decisions needed, governance flags

REPORTING:
- Gate report: professional table, exportable to Excel (xlsx library)
- Portfolio export: ranked portfolio to Excel matching offline model format
- Single use case scorecard export
- Cross-customer report (partner admin): PDF-style HTML with portfolio status per customer

tRPC: dashboard.portfolioSummary, dashboard.pipelineFunnel, dashboard.riskHeatmap, dashboard.staleCases, dashboard.executiveSummary, dashboard.partnerSummary, report.exportGateReport, report.exportPortfolio, report.exportScorecard

All charts use Recharts with tenant color scheme (CSS variables), responsive sizing, loading/empty states, click handlers for drill-down.
```

---

## PROMPT 14 OF 15 — AI FEATURES (OPENAI INTEGRATION)

```
You are building CaseForge. This is Prompt 14 of 15. Prompts 1-13 are complete. Now build AI features.

CREATE src/server/services/ai-service.ts:
Abstract AI provider behind an interface so the model can be swapped:

interface AiProvider {
  chat(messages: ChatMessage[], options?: AiOptions): Promise<string>
  chatJson<T>(messages: ChatMessage[], schema: ZodSchema<T>, options?: AiOptions): Promise<T>
}

class OpenAiProvider implements AiProvider { ... }
// Future: class AnthropicProvider, class LocalLlamaProvider, etc.

FEATURE 1: NATURAL LANGUAGE PORTFOLIO INSIGHTS
- Chat input on portfolio dashboard
- User query → system prompt with tenant schema + enum values → GPT-4o
- Returns JSON: { filters, aggregations, sort, limit }
- Translate to Prisma where clause, execute, return results
- Send results back for narrative summary
- Must handle: "high-risk cases stuck in pilot", "cases needing NDA", "compare feasibility across directorates", "CUI cases without security review", "total run cost for production"
- Cross-customer queries for partner users

FEATURE 2: AUTO-GENERATED FEASIBILITY QUESTIONS
- Trigger on transition to DEEP_FEASIBILITY
- Context: problem statement, source systems, sensitive data summary, architecture summary
- GPT-4o generates 3-5 questions specific to the use case (not in the standard 58)
- Saved as FeasibilityQuestion with isAiGenerated=true
- Evaluator can accept/edit/dismiss

FEATURE 3: INTAKE COMPLETENESS ASSISTANT
- Trigger on "Review before submit"
- All intake sections assembled as structured text → GPT-4o-mini
- Returns JSON: { warnings: [{section, field, message, severity}], suggestedClassification, overallReadiness }
- Display warnings with severity badges, "Acknowledge & Submit Anyway" for warnings

FEATURE 4: DATA READINESS FLAG (rule-based, not AI)
- Trigger on source system + DQ profile save
- GREEN: all sources have non-manual access, DQ ≥ 80, no remediation needed
- AMBER: sources identified but DQ < 80 or remediation needed with plan
- RED: air-gapped source, manual access, DQ < 50, or no remediation plan

tRPC: ai.portfolioInsights, ai.generateQuestions, ai.completenessCheck, ai.dataReadiness
```

---

## PROMPT 15 OF 15 — IMPORT/EXPORT, API, SEED DATA & DEPLOYMENT

```
You are building CaseForge. This is Prompt 15 of 15. Prompts 1-14 are complete. Now build import/export, public API, seed data, and deployment.

BULK IMPORT (/admin/customer/import):
- Download Excel template (.xlsx via xlsx library)
- Upload filled file, validate each row against UseCase Zod schema
- Preview table with error highlighting
- Import: create UseCase records, set stage = INTAKE_DRAFT
- Progress bar, import history

EXPORT:
- Ranked portfolio → Excel (matching offline model format)
- Single use case scorecard → Excel (all stages in one workbook)
- Gate report → Excel (customer-delivery quality)
- Cross-customer report → HTML/PDF
- Full use case package → ZIP (scorecard + attachments + architecture + audit trail)

PUBLIC REST API (/api/v1/):
- API key auth per tenant (stored hashed in DB)
- Rate limiting (configurable per subscription tier)
- Endpoints: GET/POST usecases, GET usecases/:id, GET portfolio/ranked, GET portfolio/summary, POST usecases/:id/transition, GET scoring-model/versions, POST webhooks (register for events)
- OpenAPI/Swagger spec auto-generated and served at /api/docs (use next-swagger-doc or similar)

SEED DATA (prisma/seed.ts):
1. Default scoring model: 3 axes, 15 drivers with weights and anchors (all from spec)
2. 4 risk tier configs (R1-R4 with bounds, multipliers, control descriptions)
3. 6 feasibility dimensions (D1-D6 with weights)
4. 58 feasibility questions (all from spec, assigned to dimensions)
5. 8 hard gates (G1-G8 with names, conditions)
6. Default picklists, notification preferences, intake form config
7. First ScoringModelVersion (v1, status=ACTIVE)

TENANT PROVISIONING FUNCTION:
1. Create Tenant record
2. Clone default scoring model + drivers + axes + dimensions + questions + gates + risk tiers
3. Create first ScoringModelVersion (v1)
4. Create admin user
5. Seed notification preferences
6. If partner-managed: link to partner, create assignment for partner admin

DOCKER DEPLOYMENT:
- Dockerfile: multi-stage build (deps → build → production)
- docker-compose.yml: PostgreSQL 16 + app + (optional) MinIO for S3-compatible local storage
- docker-compose.prod.yml: production config with env vars from .env
- Health check endpoint at /api/health

CI/CD (GitHub Actions):
- .github/workflows/ci.yml: lint, type-check, test (vitest), build
- .github/workflows/deploy.yml: build Docker image, push to registry, deploy (configurable target)
- .github/workflows/provision-tenant.yml: manual trigger with inputs (tenant name, admin email, partner ID)

ENV VARS (.env.example):
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, OPENAI_API_KEY, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, EMAIL_API_KEY, EMAIL_FROM

FINAL CHECKLIST:
- [ ] `docker compose up` starts PostgreSQL + app
- [ ] `npx prisma db push && npx prisma db seed` creates schema and seeds data
- [ ] User signs up → assigned to tenant → sees branded UI
- [ ] Submitter creates intake → drafts → submits → AI completeness check
- [ ] Portfolio Manager gates → Pass → profile reviews auto-assigned
- [ ] Specialists review and approve → scoring page loads with pre-populated evidence
- [ ] 15 drivers scored → priority calculated → ranked in portfolio
- [ ] Architect fills solution design → LLM context determined → controls auto-generated → effort calculated
- [ ] 58 questions scored → hard gates evaluated → financial model completed → scorecard rendered
- [ ] Executive approves → wave planned → pilot tracked → Go/No-Go → production
- [ ] Weight change: preview impact → apply → snapshot created → all cases re-scored
- [ ] Partner consultant switches tenant → sees that customer's branding and data
- [ ] Cross-customer dashboard shows aggregate data
- [ ] All dashboards render with Recharts (no Power BI)
- [ ] NL insights return correct filtered results
- [ ] Excel export matches offline model format
- [ ] Docker build succeeds, container runs on any cloud
- [ ] All scoring/control/effort/financial engines have passing unit tests
```

---

## EXECUTION NOTES

1. Execute prompts 1-15 in order. Each assumes previous prompts are complete.
2. After each prompt: `npm run build` must succeed with zero TypeScript errors.
3. All scoring, control, effort, financial, and weight versioning logic lives in src/lib/scoring/ as PURE FUNCTIONS — no DB calls, no side effects. These are imported by both server services and client components.
4. Prisma middleware handles tenant scoping automatically. Application code never manually filters by tenantId.
5. tRPC provides end-to-end type safety — no manual API type definitions needed.
6. The AI service is behind an interface (AiProvider). Swap OpenAI for Anthropic, local Llama, or any other provider by implementing the interface.
7. File storage is S3-compatible. Works with AWS S3, MinIO (local), Cloudflare R2, or any S3-compatible service.
8. Email is behind an interface. Swap Resend for SendGrid, SES, or SMTP by implementing the interface.
9. Charts use Recharts (React-native). No external BI platform dependency.
10. The entire app runs in a single Docker container + PostgreSQL. No Azure, no Dataverse, no Power Platform dependency.
11. Deploy to any cloud (AWS ECS/Fargate, Azure Container Apps, GCP Cloud Run, Railway, Fly.io) or self-hosted with Docker Compose.
