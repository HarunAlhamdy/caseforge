# CaseForge — Seven-Stage Process Map

## Complete Data Point Inventory by Stage

**Version:** 1.0 · **Date:** August 4, 2026
**Purpose:** Defines every data point, who captures it, when, what it feeds, and the exit criteria at each stage. This is the decision document — confirm this before any code is written.

---

## STAGE 1 — CAPTURE

**Purpose:** Gather everything the business submitter knows about the idea in a structured format. Do not ask questions they cannot answer.

**Primary actor:** Business Submitter
**Supporting actor:** None — this is self-service with AI-assisted completeness checking
**Duration target:** 1–5 business days (can save as draft and return)

---

### 1.1 Submission Identity

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Use case title | Free text (300 char) | Yes | "Automated Lease Abstraction" | Register display, all dashboards |
| Submitting business unit | Picklist (tenant-managed) | Yes | "Real Estate" | Portfolio grouping, dashboard filters |
| Submitted by | Auto-populated (logged-in user) | Yes | — | Notifications, audit trail |
| Date submitted | Auto-populated | Yes | — | Intake velocity metrics |
| Executive sponsor name | Free text (200 char) | Yes | "Jane Torres" | Hard gate G1 auto-fill |
| Executive sponsor title | Free text (200 char) | No | "VP Real Estate" | Stakeholder context |
| Source / origin | Picklist | Yes | "Ideation Register" / "BU Catalog" / "Strategic Ideation" | Portfolio segmentation |

### 1.2 Use Case Description

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Current state / problem statement | Free text (unlimited) | Yes | "Manual validation of store layout plans takes 3 FTEs..." | Gating decision evidence, D1 scoring evidence, AI question generation |
| Proposed AI solution / approach | Free text (unlimited) | Yes | "AI checks floor plans against fixture standards..." | Gating decision (is this AI?), AI pattern classification, D3 evidence |
| Expected business benefits / KPIs | Free text (unlimited) | Yes | "hours saved, error reduction, faster store openings" | Value scoring evidence, financial model seed |
| AI pattern (suggested) | Picklist | No | "Document extraction" / "RAG" / "Agent" | Register column, solution architecture seed |
| Autonomy level (suggested) | Picklist | No | "Copilot" / "Semi-autonomous" / "Fully autonomous" | Risk scoring evidence, gating consideration |

### 1.3 Current State Metrics

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| How is this work done today? | Free text | Yes | "Analysts manually compare floor plans to standards in Excel" | D2 process readiness evidence |
| FTEs involved | Decimal | Yes | 3.0 | Financial model: current labor cost seed |
| Current volume | Free text (200 char) | Yes | "120 plans/month" | Financial model, pilot scoping |
| Current cycle time per unit | Free text (200 char) | Yes | "4 hours per plan" | Financial model, success criteria baseline |
| Current error/rework rate | Free text (100 char) | No | "~12%" | Financial model: error cost, success criteria baseline |
| Annual fully loaded cost | Currency | No | $450,000 | Financial model: current state cost seed |
| Known pain points | Free text | No | "Peak season backlog, inconsistent reviewer judgment" | D1 cost of inaction, D2 process pain |

### 1.4 Data Landscape (what the submitter knows)

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Source systems involved | Free text (500 char) | Yes | "Salesforce FSL, Oracle lease DB, SharePoint floor plans" | Stage 3 source system inventory seed |
| Systems the AI would read from | Free text | Yes | "SharePoint document library, Oracle lease terms" | Solution architecture seed, integration scoping |
| Systems the AI would write to | Free text | No | "Salesforce FSL status field, email notifications" | Risk scoring: autonomy, write action scoping |
| Ingestion method (known) | Picklist multi-select | No | "API" / "Batch" / "CDC" / "Manual upload" / "Unknown" | Integration complexity evidence |
| Ingestion frequency needed | Picklist | No | "Real-time" / "Daily" / "Weekly" / "Ad hoc" | Integration scoping |
| Estimated data volume | Free text (200 char) | No | "~500 floor plan PDFs, 10K lease records" | Storage and cost scoping |
| Historical data required? | Yes/No + text | No | "Yes — 3 years of completed plans for training" | RAG corpus / fine-tuning scoping |

### 1.5 Data Quality (what the submitter knows)

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Known data quality issues | Free text | No | "Floor plan formats are inconsistent, some scanned images" | Data readiness flag, D3 evidence |
| Remediation known to be needed? | Yes/No + text | No | "Yes — need to standardize plan format" | Data readiness flag |
| Data quality ownership | Free text (200 char) | No | "RE Operations team" | Profile review assignment |

### 1.6 Domain Model (what the submitter knows)

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Business domains involved | Picklist multi-select | No | "Facility" / "Product" / "Customer" / "Financial" | Domain model profile seed |
| Master/reference data needed | Free text | No | "Facility hierarchy, fixture catalog" | Data architecture scoping |
| Relationship to existing models | Picklist | No | "Reuses existing" / "Extends" / "New domain" | Integration complexity evidence |

### 1.7 Governance & Compliance (what the submitter knows)

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Auditability requirements identified? | Yes/No + text | Yes | "Yes — all plan approvals must be traceable" | Hard gate G7 seed, control inheritance |
| Policy review required? | Yes/No + text | Yes | "Yes — AI Governance Board" | Hard gate G2 seed |
| Policy/review body name | Free text (200 char) | Conditional (if Yes) | "AAFES AI Governance Framework" | Governance profile |
| NDA / data-sharing agreement status | Picklist | Yes | "Not started" / "In progress" / "Executed" / "Not required" | Hard gate G4 seed, governance dashboard |
| Data owner | Free text (200 char) | Yes | "Mike Chen, RE Data Manager" | Profile review assignment |
| Data steward | Free text (200 char) | No | "RE Operations Data Team" | Profile review assignment |
| Retention & lifecycle policy | Free text | No | "7-year retention per AAFES records policy" | Control inheritance |
| Regulatory considerations | Free text | No | "FAR/DFARS, AAFES policy manual Ch. 12" | Risk scoring evidence, compliance controls |

### 1.8 Security (what the submitter knows)

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Data classification | Picklist | Yes | "Internal" / "CUI" / "Sensitive" / "Public" / "Unknown" | Risk scoring, control inheritance trigger |
| Access control requirements | Free text | No | "RBAC, manager-level approval for plan sign-off" | Security profile |
| PII/CUI present? | Yes/No + text | Yes | "Yes — tenant names and lease financial terms" | Stage 3 sensitive data inventory trigger |
| Encryption requirements identified | Picklist multi-select | No | "At-rest" / "In-transit" / "Tokenization" / "None" | Security profile |
| Government model/tool requirements | Free text | No | "None — commercial cloud acceptable" | Architecture constraint |
| Security review / ATO status | Picklist | No | "Not started" / "In progress" / "ATO granted" | Hard gate G5 seed, governance dashboard |

### 1.9 Consumption Layer

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Reporting/dashboard requirements | Free text | No | "Weekly compliance dashboard for RE leadership" | Solution architecture |
| Primary end-user personas | Free text | Yes | "RE Analyst, Store Planner, VP Real Estate" | Change management scoping, D6 evidence |
| Conversational AI required? | Yes/No + text | No | "No" | Solution architecture |
| Access channels | Picklist multi-select | Conditional | "Web" / "Mobile" / "Teams" / "Embedded" | Architecture constraint |
| Downstream API/system consumption | Free text | No | "Results feed into Salesforce FSL work orders" | Integration scoping |

### 1.10 Submitter's Assessment

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Priority tier (submitter's view) | Picklist | Yes | "High" / "Medium" / "Low" | Context for portfolio manager — NOT used in scoring |
| Implementation complexity (submitter's view) | Picklist | Yes | "Medium" | Context only |
| Estimated timeline (submitter's view) | Free text (200 char) | No | "3–4 months" | Context only |
| Dependencies / risks | Free text | No | "Depends on Salesforce FSL rollout completing first" | Gating consideration, delivery planning |

### 1.11 Attachments & Next Steps

| Data Point | Field Type | Mandatory | Example | Feeds → |
|---|---|---|---|---|
| Supporting documents | File upload (multi) | No | Process maps, sample data, prior analysis | Evidence for all downstream stages |
| Recommended next action | Free text | No | — | Action item tracking |
| Action owner | Free text | No | — | Action item tracking |
| Follow-up date | Date | No | — | Action item tracking |

---

### Stage 1 Exit Criteria

| Criterion | Check |
|---|---|
| All mandatory fields populated | System-enforced validation |
| Problem statement is not vague | AI completeness check flags single-sentence or symptom-level descriptions |
| Cross-section consistency | AI check: if §1.8 says CUI, §1.7 must have regulatory considerations; if §1.4 mentions write-back, §1.2 should describe agent behavior |
| At least one source system named | §1.4 source systems is not blank |
| PII/CUI question answered | §1.8 answered Yes or No (not skipped) |
| Executive sponsor named | §1.1 sponsor name is not blank |

**Transition:** Submitter clicks "Submit for Review" → status moves to **Pending Review** → notification to Portfolio Manager + auto-assigned specialist reviewers.

---

## STAGE 2 — TRIAGE

**Purpose:** Fast expert judgment on whether this idea belongs in an AI engagement. Not a scoring exercise — a yes/no/not-yet gate.

**Primary actor:** Portfolio Manager
**Duration target:** 1–3 business days per use case

---

### 2.1 Gate Decision

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Gate decision | Picklist | Portfolio Manager | "Pass" / "Gate A" / "Gate B" / "Gate C" / "Gate D" / "Hold" | Lifecycle stage, gate report |
| Gate rationale | Free text (unlimited) | Portfolio Manager | "Bounded corpus, written standard exists, exception output is reviewable." | Gate report, customer-facing deliverable |
| Decided by | Auto-populated | System | — | Audit trail |
| Decision date | Auto-populated | System | — | Audit trail, velocity metrics |

### 2.2 Gate Definitions

| Gate | Name | Criteria | Outcome |
|---|---|---|---|
| Pass | Cleared | This is an AI/agentic problem, scoped for this engagement, with enough information to score | Advances to Stage 3 |
| Gate A | Too easy | Already solved by a prompt, copilot, or existing tool | Returned to submitter with guidance |
| Gate B | Wrong tool | Better solved by conventional analytics, OR, RPA, or middleware | Redirected with named alternative |
| Gate C | Too far | Real AI opportunity but exceeds engagement scope or depends on prerequisites that haven't landed | Parked at ROM estimate, revisit later |
| Gate D | Needs redesign | Fails human-in-command test as described, or autonomy level is unacceptable without redesign | Returned with specific redesign requirements |
| Hold | Incomplete | Described as a symptom, a bundle, or too vague to evaluate | Returned with request for SME card or scope split |

### 2.3 Data Read at Triage (from Stage 1 — not re-entered)

The portfolio manager reads but does not re-enter:
- §1.2 Problem statement and proposed solution (is this AI? is it scoped?)
- §1.2 Autonomy level (human-in-command check for Gate D)
- §1.4 Systems involved (is write-back to critical systems proposed?)
- §1.8 Data classification (does CUI/sensitivity change the engagement viability?)
- §1.10 Dependencies (do prerequisites exist that block this?)
- §1.10 Complexity (submitter's self-assessment as context)

---

### Stage 2 Exit Criteria

| Criterion | Check |
|---|---|
| Gate decision recorded | Not blank |
| Gate rationale recorded | Not blank (minimum 1 sentence) |
| If Hold: information request sent | Info request details populated, submitter notified |
| If Gate A–D: customer-facing rationale written | Rationale is clear enough to include in the gate report deliverable |

**Transition (Pass):** → Stage 3 (Profile & Score) — both tracks begin simultaneously
**Transition (Gate A–D):** → Gated Out (with rationale) — appears in Gate Report
**Transition (Hold):** → Info Request → returns to submitter → resubmission → back to Stage 2

---

## STAGE 3 — PROFILE & SCORE

**Purpose:** Two things happen in parallel. The portfolio manager scores the use case on three axes. Specialist reviewers validate and deepen the data, governance, and security profiles — including building the sensitive data field inventory.

**Duration target:** 5–10 business days (parallel tracks)

---

### TRACK A: SPECIALIST PROFILE REVIEWS (parallel)

Each profile review is assigned to a specialist. They validate what the submitter provided and add technical depth the submitter couldn't.

---

#### 3A.1 Source System Inventory (Data Engineer)

For each source system the submitter named, the data engineer creates a detailed record:

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| System name | Free text | Data Engineer (seeded from §1.4) | "SAP ECC 6.0" | Architecture, integration scoping |
| System type | Picklist | Data Engineer | "ERP" / "CRM" / "Data warehouse" / "SaaS" / "Mainframe" / "File share" / "API" | Integration complexity scoring |
| Environment | Picklist | Data Engineer | "On-prem" / "Azure" / "AWS" / "GovCloud" / "Hybrid" | Architecture constraints |
| Specific tables/views/objects needed | Free text | Data Engineer | "VBAK (Sales Header), KNA1 (Customer Master)" | Sensitive data inventory, architecture |
| Specific fields/columns needed | Structured text (JSON) | Data Engineer | "KNA1.STEUERNR (Tax ID), KNA1.NAME1 (Customer Name)" | Sensitive data inventory — field level |
| Access method available | Picklist | Data Engineer | "REST API" / "OData" / "Direct DB" / "SFTP" / "CDC" / "Kafka" / "Manual" | Integration complexity scoring, effort estimation |
| Authentication method | Picklist | Data Engineer | "OAuth 2.0" / "API key" / "Service account" / "Certificate" | Security profile, architecture |
| Rate limits / throttling | Free text | Data Engineer | "100 req/min, 10K records/call" | Architecture constraints |
| Data refresh SLA | Free text | Data Engineer | "Nightly batch, 15-min lag on CDC" | Latency tolerance check |
| Source system owner / DBA | Free text | Data Engineer | "Mike Chen, RE Data" | Stakeholder for access negotiations |
| Existing ETL touching this source | Free text | Data Engineer | "Informatica loads to Snowflake nightly" | Reuse opportunity, architecture |
| Network accessibility | Picklist | Data Engineer | "VPN required" / "Private endpoint" / "Public" / "Air-gapped" | Architecture constraint, effort multiplier |
| Initial load volume | Free text | Data Engineer | "12M rows / 45 GB" | Effort estimation, storage sizing |
| Incremental volume per cycle | Free text | Data Engineer | "~8K new rows/day" | Cost modeling, scaling |
| Latency tolerance | Picklist | Data Engineer | "Real-time" / "Sub-hour" / "Same-day" / "Next-day" | Architecture decision |

**Profile review status:** Pending → In Review → Approved / Rejected / Info Requested
**Reviewer:** Data Engineer / Data Architect

---

#### 3A.2 Data Quality Validation (Data Steward)

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Validated DQ baseline score | Decimal (0–100) | Data Steward | 74.5 | Data readiness flag calculation |
| Validated known issues | Free text | Data Steward | "15% of lease records have missing expiry dates" | D3 evidence, remediation scoping |
| Remediation required? | Yes/No | Data Steward | Yes | Data readiness flag |
| Remediation plan | Free text | Data Steward | "Backfill missing dates from Oracle source within 4 weeks" | Effort estimation, dependency tracking |
| Remediation owner | Free text | Data Steward | "RE Data Operations" | Action item |
| Remediation timeline | Free text | Data Steward | "4 weeks" | Dependency for pilot |
| DQ sufficient for pilot? | Yes/No | Data Steward | Yes (with remediation) | Stage gate |

**Profile review status:** Pending → In Review → Approved / Rejected / Info Requested
**Reviewer:** Data Steward / DQ Analyst

---

#### 3A.3 Sensitive Data Field Inventory (Data Steward + Security)

**This is the most consequential review.** For every field that contains sensitive data, one record is created:

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Source system | Lookup | Data Steward | "SAP KNA1" | Traceability |
| Table/object | Free text | Data Steward | "KNA1" | Traceability |
| Field/column name | Free text | Data Steward | "STEUERNR" | Traceability |
| Business meaning | Free text | Data Steward | "Customer federal tax ID number" | Context for architect |
| Data classification | Picklist | Data Steward | "PII-Sensitive" | Risk scoring, control inheritance trigger |
| PII type (if applicable) | Picklist | Data Steward | "Tax ID" / "SSN" / "DOB" / "Email" / "Phone" / "Address" / "Biometric" / "Financial account" / "Health record" | Control inheritance trigger |
| Regulatory regime | Free text / multi-select | Data Steward | "SOX" | Compliance controls |
| **Enters LLM context?** | Picklist | **AI Architect (Stage 4)** | "Yes — in prompt" / "Yes — in RAG retrieval" / "No — pre-processing only" / "No — not used" | **THE pivotal question — drives entire control set** |
| Required handling | Picklist | Security Architect | "Tokenize" / "Mask" / "Encrypt" / "Redact" / "Aggregate only" | Control inheritance, architecture |
| Consent basis | Picklist | Governance Reviewer | "Contract performance" / "Legitimate interest" / "Explicit consent" | Compliance |
| Right to erasure? | Yes/No | Governance Reviewer | No | Control inheritance (vector store deletion capability) |
| Cross-border transfer? | Yes/No + destination | Governance Reviewer | "No" | Control inheritance (SCC requirements) |
| Retention period | Free text | Governance Reviewer | "7 years (SOX)" | Data lifecycle |

**Note:** The "Enters LLM context?" column is intentionally left blank at Stage 3. It cannot be answered until Stage 4, when the AI architect designs the solution. But the inventory must be built here so the architect has the complete field list to make that determination.

**Profile review status:** Pending → In Review → Approved / Rejected / Info Requested
**Reviewer:** Data Steward + Security Architect (joint)

---

#### 3A.4 Governance Review (Compliance / Legal)

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Policy review completed? | Yes/No | Governance Reviewer | Yes | Hard gate G2 |
| Policy review outcome | Free text | Governance Reviewer | "No prohibition identified. Standard logging required." | G2 evidence |
| NDA status validated | Picklist | Governance Reviewer | "Executed" / "In progress" / "Not started" / "Not required" | Hard gate G4, governance dashboard |
| Regulatory requirements confirmed | Free text | Governance Reviewer | "FAR 52.204-21 applies. No CUI in AI output permitted." | Control inheritance, architecture constraint |
| Data ownership confirmed | Free text | Governance Reviewer | "Confirmed: Mike Chen, RE Data Manager" | RACI |
| Retention policy confirmed | Free text | Governance Reviewer | "7-year retention confirmed per AAFES RM policy" | Control inheritance |
| Auditability requirements confirmed | Free text | Governance Reviewer | "All plan approval decisions must be logged with timestamp, user, and rationale" | Hard gate G7, architecture requirement |

**Profile review status:** Pending → In Review → Approved / Rejected / Info Requested
**Reviewer:** Compliance Officer / Legal

---

#### 3A.5 Security Review (Security Architect)

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Data classification validated | Picklist | Security Architect | "Internal" (confirmed — no CUI in this case) | Risk scoring, control inheritance |
| Access control design | Free text | Security Architect | "RBAC via Azure AD, manager approval for plan sign-off" | Architecture |
| Encryption requirements confirmed | Picklist multi-select | Security Architect | "At-rest (AES-256), In-transit (TLS 1.3)" | Architecture |
| ATO path confirmed | Picklist | Security Architect | "Not required — falls under existing ATO boundary" / "New ATO required" | Hard gate G5, timeline impact |
| Government environment required? | Yes/No + details | Security Architect | "No — commercial Azure acceptable" | Architecture constraint |
| Network security requirements | Free text | Security Architect | "Private endpoint to Oracle, public API to Salesforce" | Architecture |
| Threat model notes | Free text | Security Architect | "Low adversarial surface — internal users only, no untrusted input" | D4 evidence, architecture |

**Profile review status:** Pending → In Review → Approved / Rejected / Info Requested
**Reviewer:** Security Architect / CISO representative

---

### TRACK B: PORTFOLIO SCORING (parallel with Track A)

The portfolio manager (or evaluator) scores 15 drivers across three axes. Evidence fields are pre-populated from Stage 1 intake data.

---

#### 3B.1 Value Scoring

| Driver | Weight (default) | Score (1–5) | Evidence pre-populated from | Scored by |
|---|---|---|---|---|
| Financial return | 0.30 | Evaluator input | §1.2 Expected benefits, §1.3 Annual cost, §1.10 Priority | Evaluator |
| Executive-agenda alignment | 0.20 | Evaluator input | §1.1 Exec sponsor name and title | Evaluator |
| Risk and compliance value | 0.20 | Evaluator input | §1.7 Regulatory considerations, §1.8 Classification | Evaluator |
| Breadth of beneficiaries | 0.15 | Evaluator input | §1.9 End-user personas | Evaluator |
| Reusability of the pattern | 0.15 | Evaluator input | §1.2 Proposed solution, §1.6 Model relationship | Evaluator |

**Value Score** = Σ(driver_weight × driver_score) → range 1.00–5.00

---

#### 3B.2 Feasibility Scoring

| Driver | Weight (default) | Score (1–5) | Evidence pre-populated from | Scored by |
|---|---|---|---|---|
| Data readiness | 0.30 | Evaluator input | §1.4 Source systems, §1.5 DQ issues, 3A.2 DQ validation | Evaluator |
| Integration complexity | 0.20 | Evaluator input | 3A.1 Source system inventory (access methods, network) | Evaluator |
| Governance and security fit | 0.20 | Evaluator input | 3A.4 Governance review, 3A.5 Security review | Evaluator |
| Change-management load | 0.15 | Evaluator input | §1.9 End-user personas, §1.10 Complexity | Evaluator |
| Pilot scopability | 0.15 | Evaluator input | §1.3 Volume, §1.4 Data volume | Evaluator |

**Feasibility Score** = Σ(driver_weight × driver_score) → range 1.00–5.00

---

#### 3B.3 Risk Exposure Scoring

| Driver | Weight (default) | Score (1–5) | Evidence pre-populated from | Scored by |
|---|---|---|---|---|
| Decision consequentiality | 0.30 | Evaluator input | §1.2 Proposed solution, §1.7 Auditability | Evaluator |
| Data sensitivity | 0.25 | Evaluator input | 3A.3 Sensitive data inventory summary, §1.8 Classification | Evaluator |
| Degree of autonomy | 0.20 | Evaluator input | §1.2 Proposed solution, §1.4 Write-to systems | Evaluator |
| Irreversibility of bad output | 0.15 | Evaluator input | §1.8 ATO status, §1.7 Regulatory | Evaluator |
| Adversarial surface | 0.10 | Evaluator input | 3A.1 Access methods, §1.9 Access channels | Evaluator |

**Risk Score** = Σ(driver_weight × driver_score) → range 1.00–5.00

---

#### 3B.4 Calculated Outputs (system-generated)

| Output | Formula | Example |
|---|---|---|
| Risk tier | Risk score mapped to configurable tier bounds | R1 (score 1.65) |
| Tier multiplier | From tier config | 1.00 |
| Priority score | (value_wt × Value + feasibility_wt × Feasibility) × multiplier | (0.5×4.0 + 0.5×3.15) × 1.00 = 3.575 |
| Rank | Priority score descending within tenant | 1 |
| Data readiness flag | Auto-calculated from 3A.1 + 3A.2 + 3A.3 | Amber |

---

### Stage 3 Exit Criteria

| Criterion | Check |
|---|---|
| All 15 drivers scored (1–5) | No blank scores |
| All profile reviews completed | All five review tracks show Approved status |
| Sensitive data inventory complete | If §1.8 PII/CUI = Yes, at least one sensitive data element record exists |
| Risk tier assigned | System-calculated from risk score |
| Priority score calculated | System-calculated |
| Rank assigned | System-calculated |
| Data readiness flag calculated | System-calculated from profile data |
| No profile review in Rejected status | If any rejected, use case returns for rework |

**Transition:** → Stage 4 (Architect) — AI Architect is assigned

---

## STAGE 4 — ARCHITECT

**Purpose:** The AI Architect designs the technical solution. This stage produces the solution architecture profile, the effort estimate, and the mandatory control set. It also answers the pivotal question for every sensitive data field: does it enter the LLM context?

**Primary actor:** AI Architect
**Supporting actor:** Data Engineer (for technical validation)
**Duration target:** 3–7 business days per use case

---

### 4.1 AI Pattern & Model Selection

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| AI pattern (confirmed) | Picklist | AI Architect | "RAG" / "Single Agent" / "Multi-Agent" / "Classification" / "Extraction" / "Summarization" | Effort estimation multiplier |
| Agent sub-pattern (if agent) | Picklist | AI Architect | "ReAct" / "Plan-and-execute" / "Supervisor-worker" / "Tool-use-only" | Architecture detail |
| LLM model(s) selected | Structured (JSON) | AI Architect | [{"model":"gpt-4o","purpose":"reasoning"}] | Cost modeling |
| Model hosting | Picklist | AI Architect | "Azure OpenAI managed" / "Self-hosted" / "Bedrock" | Infra cost, compliance |
| Context window requirement | Picklist | AI Architect | "4K" / "32K" / "128K" | Model selection validation |
| Token estimate per transaction | Free text | AI Architect | "~2,500 input + 800 output" | Monthly LLM cost calculation |
| Daily transaction volume | Integer | AI Architect | 500 | Monthly LLM cost calculation |
| Estimated monthly LLM cost | Currency (calculated) | System | $2,400 | Financial model feed |
| Fine-tuning required? | Yes/No | AI Architect | No | Effort multiplier, data requirements |
| Training data description | Free text | AI Architect (if fine-tuning) | — | Data engineering scoping |

### 4.2 RAG Architecture (if applicable)

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Knowledge corpus description | Free text | AI Architect | "2,400 policy PDFs, 180 SOPs" | Data engineering scope |
| Corpus document count | Integer | AI Architect | 2,580 | Effort estimation multiplier |
| Corpus update frequency | Picklist | AI Architect | "Quarterly" | Operational process |
| Chunking strategy | Free text | AI Architect | "512-token chunks, 50-token overlap, by section headers" | Architecture spec |
| Embedding model | Free text | AI Architect | "text-embedding-3-large (3072 dims)" | Cost modeling |
| Vector store | Picklist | AI Architect | "Azure AI Search" | Infra cost, architecture |
| Retrieval strategy | Picklist | AI Architect | "Hybrid (semantic + keyword) with RRF" | Architecture spec |
| Citation/grounding required? | Picklist | AI Architect | "Inline citations required" | Architecture spec, guardrails |
| Corpus contains sensitive data? | Yes/No | AI Architect | Yes → triggers RBAC on vector store | Control inheritance |

### 4.3 Agent Architecture (if applicable)

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Tools the agent will use | Structured (JSON) | AI Architect | [{"tool":"Salesforce API","action":"query","type":"read"}] | Risk assessment, effort |
| Write actions (list) | Structured (JSON) | AI Architect | [{"system":"Salesforce","action":"update status","reversible":true}] | Hard gate G3, risk scoring, controls |
| Read actions (list) | Structured (JSON) | AI Architect | [{"system":"Oracle","action":"query lease terms"}] | Architecture spec |
| Approval gates before writes | Structured (JSON) | AI Architect | [{"action":"status update","requires":"manager approval"}] | Hard gate G3, D4 evidence |
| Max tool calls per session | Integer | AI Architect | 15 | Runaway prevention, cost cap |
| Fallback behavior | Picklist | AI Architect | "Escalate to human queue" | Architecture spec, D3 evidence |
| Memory management | Picklist | AI Architect | "Session-scoped" | Architecture spec |
| Orchestration pattern | Picklist | AI Architect | "Single agent" / "Supervisor-routed" / "Sequential" | Effort multiplier |
| Observability tool | Free text | AI Architect | "Azure AI Tracing + App Insights" | Hard gate G7 |

### 4.4 Sensitive Data Context Determination

**The architect now answers the pivotal question for every sensitive data field inventoried in Stage 3A.3:**

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Enters LLM context? | Picklist (per field) | AI Architect | "Yes — in prompt" / "Yes — in RAG retrieval" / "No — pre-processing only" / "No — not used" | **Control inheritance engine** |

This single determination per field triggers the entire mandatory control set (see 4.7).

### 4.5 Guardrails & Safety Controls

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Input validation | Multi-select + text | AI Architect | "PII scanner, prompt injection detection, content filter" | Architecture spec |
| Output validation | Multi-select + text | AI Architect | "PII scanner on output, fact-check against source, confidence threshold" | Architecture spec |
| Content filter level | Picklist | AI Architect | "Medium" | Architecture config |
| Prompt injection mitigation | Free text | AI Architect | "System prompt hardening, input-output separation, instruction hierarchy" | D4 evidence |
| Hallucination mitigation | Free text | AI Architect | "RAG grounding with inline citations, confidence scoring" | D4 evidence |
| PII leakage prevention | Free text | AI Architect | "Pre-LLM tokenization of Tax IDs, post-LLM PII scan on output" | Control implementation |
| Rate limiting design | Free text | AI Architect | "10 req/min per user, circuit breaker at 50% error rate" | Architecture spec |
| Token budget (max per session) | Integer | AI Architect | 50,000 | Cost control |
| Bias/fairness testing scope | Picklist | AI Architect | "Not required" / "Internal" / "Third-party" / "Automated" | Effort estimation |
| Red team testing scope | Picklist | AI Architect | "Not required" / "Internal" / "Third-party" | Effort estimation |
| Drift monitoring plan | Picklist | AI Architect | "Monthly sampling" / "Automated drift detection" / "Quarterly revalidation" | Operational process |

### 4.6 Infrastructure & Deployment

| Data Point | Field Type | Filled by | Example | Feeds → |
|---|---|---|---|---|
| Compute requirements | Free text | AI Architect | "2× Standard_D4s_v3 for API tier" | Cost modeling |
| Storage requirements | Free text | AI Architect | "50 GB AI Search index, 200 GB Blob" | Cost modeling |
| Estimated monthly infra cost | Currency | AI Architect | $1,800 | Financial model feed |
| Deployment architecture | Picklist | AI Architect | "Container (AKS)" / "Serverless" / "App Service" | Effort estimation |
| Scaling strategy | Free text | AI Architect | "Horizontal autoscale 2–8 pods on CPU > 70%" | Architecture spec |
| HA requirements | Picklist | AI Architect | "Business hours" / "99.9%" / "99.99%" | Infra cost, architecture |
| Logging & tracing config | Free text | AI Architect | "All LLM calls to App Insights, 90-day retention" | Hard gate G7, operations |
| Environment promotion path | Free text | AI Architect | "Dev → QA → Staging → Prod via Azure DevOps" | Delivery process |

### 4.7 Mandatory Controls (auto-generated)

After 4.4 is completed, the **control inheritance engine** runs automatically. It reads the sensitive data inventory + the architect's LLM context determinations and generates mandatory control records:

| Trigger Condition | Control Generated |
|---|---|
| Any PII field enters LLM context | Pre-LLM tokenization pipeline, Post-LLM PII output scan, PII-free logging |
| SSN / Tax ID / Financial account in scope | Field-level encryption at rest, Tokenization before any processing, No raw values in any log |
| PHI (health data) in scope | BAA with LLM provider, Minimum necessary standard, 6-year access audit trail |
| CUI in scope | FedRAMP environment required, NIST 800-171 controls |
| Cross-border data transfer | Transfer impact assessment, Standard Contractual Clauses |
| Right-to-erasure fields in scope | Deletion capability in vector store + logs + backups, 30-day SLA |
| Agent writes to financial systems | SOX change logging, Dual-approval workflow |
| Agent writes to HR/payroll | Employee notification, Grievance path |
| 6+ PII fields in scope | Mandatory DPIA before pilot |
| Biometric data in scope | Explicit consent mechanism, Purpose limitation, State-law compliance check |

Each generated control starts at status = "Required" and must progress through "Implemented" → "Verified" before the use case can advance to pilot.

### 4.8 Effort Estimate (auto-calculated)

The system calculates effort based on the technical profile:

| Effort Category | Calculation Inputs | Output |
|---|---|---|
| Data engineering hours | Source system count, transform complexity, corpus size | e.g. 120 hrs |
| Integration hours | Source system count, access methods, auth complexity | e.g. 80 hrs |
| AI development hours | AI pattern, RAG complexity, agent tool count | e.g. 200 hrs |
| Security & compliance hours | PII field count in LLM, regulatory regime count, controls generated | e.g. 60 hrs |
| Testing hours | Write action count, guardrail scope, red team needs | e.g. 100 hrs |
| Infrastructure hours | Deployment type, HA requirements, monitoring setup | e.g. 40 hrs |
| Change management hours | End-user persona count, autonomy level | e.g. 30 hrs |
| **Total estimated hours** | Sum | **630 hrs** |
| Calculated cost band | Total hours × blended rate → S/M/L/XL | **L (150K–400K)** |
| Monthly run cost | LLM API + infra + HITL labor | **$5,200/month** |

---

### Stage 4 Exit Criteria

| Criterion | Check |
|---|---|
| Solution architecture complete | All applicable sections (4.1 through 4.6) populated |
| LLM context determination complete | Every sensitive data field from 3A.3 has "Enters LLM context?" answered |
| Mandatory controls generated | Control inheritance engine has run |
| Effort estimate calculated | Total hours, cost band, and monthly run cost populated |
| Architecture reviewed | Status = Approved (by senior architect or technical lead) |

**Transition:** → Stage 5 (Evaluate & Justify) — use case now has enough evidence for deep feasibility

---

## STAGE 5 — EVALUATE & JUSTIFY

**Purpose:** Deep feasibility scoring (58+ questions), hard gate pass/fail, financial model completion, and success criteria definition. This is the investment decision stage.

**Primary actor:** Evaluator (may be the AI Architect or a separate evaluator role)
**Supporting actors:** Finance (financial model), Executive Sponsor (approval)
**Duration target:** 5–10 business days

---

### 5.1 Deep Feasibility Assessment

58 questions across 6 weighted dimensions, scored 1–5. Evidence fields pre-populated from Stages 1, 3, and 4.

| Dimension | Weight | Questions | Evidence pre-populated from |
|---|---|---|---|
| D1: Strategic & Business Alignment | 0.25 | 8 questions | §1.1 Sponsor, §1.2 Problem/solution, §1.3 Pain points, 3B.1 Value scores |
| D2: Process Readiness | 0.15 | 9 questions | §1.3 Current state metrics, 3A.2 DQ validation |
| D3: Technical Feasibility | 0.20 | 12 questions | 3A.1 Source systems, 3A.3 Sensitive data, 4.1–4.6 Solution architecture |
| D4: Risk, Governance & Compliance | 0.15 | 11 questions | 3A.4 Governance, 3A.5 Security, 4.3 Agent actions, 4.5 Guardrails, 4.7 Controls |
| D5: Financial Viability | 0.15 | 8 questions | §1.3 Annual cost, 4.8 Effort estimate, 5.2 Financial model |
| D6: Organizational Readiness | 0.10 | 8 questions | §1.9 Personas, §1.10 Complexity, 4.3 Agent architecture |

**Scoring outputs:**
- Dimension average = mean of question scores within dimension
- Composite feasibility = Σ(dimension_weight × dimension_average)
- Verdict: 4.0–5.0 = Strong Go, 3.0–3.9 = Conditional Go, 2.0–2.9 = Not Ready, 1.0–1.9 = No Go

AI-generated questions (3–5 additional, tailored to the specific use case based on the canvas and architecture) are included and flagged as AI-generated.

### 5.2 Hard Gates (Pass/Fail)

| Gate | Name | Auto-populated from | Evaluator action |
|---|---|---|---|
| G1 | Executive Sponsor committed | §1.1 Sponsor name (auto-Pass if named) | Verify budget authority |
| G2 | Legal/Compliance clearance | 3A.4 Policy review outcome | Confirm or override |
| G3 | Reversibility / Human override | 4.3 Write actions + approval gates | Verify reversibility |
| G4 | Data access is lawful | 3A.4 NDA status + 3A.3 Consent basis | Confirm all fields covered |
| G5 | Kill switch exists | 4.3 Max tool calls + 4.5 Rate limiting | Verify architecture supports instant stop |
| G6 | POC evidence | Manual entry (or 4.1 if fine-tuning tested) | Confirm POC demonstrated core capability |
| G7 | Observability | 3A.4 Auditability + 4.3 Observability tool + 4.6 Logging config | Verify every action is traceable |
| G8 | Liability reviewed | 3A.4 Policy review + 3A.5 Security review | Confirm legal counsel has reviewed |

**Any single Fail = mandatory hold, regardless of composite score.**

### 5.3 Financial Model

| Data Point | Filled by | Pre-populated from |
|---|---|---|
| Current state annual cost (6 line items) | Finance / Evaluator | §1.3 FTEs, cycle time, error rate, annual cost |
| Agentic solution one-time costs (7 line items) | Finance / Evaluator | 4.8 Effort estimate (hours × blended rate) |
| Agentic solution annual costs (5 line items) | Finance / Evaluator | 4.1 Monthly LLM cost, 4.6 Monthly infra cost |
| Net annual benefit | System-calculated | Current total − annual opex |
| Payback period (months) | System-calculated | One-time investment ÷ net monthly benefit |
| Year 1 ROI | System-calculated | (Net benefit − one-time) ÷ one-time |
| 3-year NPV (10% discount) | System-calculated | Standard NPV formula |
| Board-readiness flag | System-generated | Flags if assumptions are too rough to present (flat benefit, no ramp) |

### 5.4 Success Criteria

| Data Point | Filled by | Example |
|---|---|---|
| Quantitative metrics (up to 8) | Evaluator + Sponsor | Agent accuracy, cycle time reduction, throughput increase, error rate, human intervention rate, cost per tx, SLA compliance, first-contact resolution |
| Each metric: current baseline | Evaluator | "4 hours per plan" |
| Each metric: minimum threshold | Evaluator | "< 2 hours" |
| Each metric: target | Evaluator | "< 1 hour" |
| Each metric: stretch goal | Evaluator | "< 30 minutes" |
| Qualitative criteria (up to 5) | Evaluator + Sponsor | User trust, stakeholder satisfaction, operational stability, auditability, graceful failure |
| Pilot duration (days) | Evaluator | 45 days |
| Pilot scope | Evaluator | "10 stores in one region, one store format" |
| Volume cap during pilot | Evaluator | "50 plans/day max" |
| Human review rate (first 2 weeks) | Evaluator | 100% |
| Human review rate (weeks 3+) | Evaluator | 25% |
| Rollback trigger | Evaluator | "Auto-pause if accuracy drops below 85%" |
| Decision checkpoint dates | Evaluator | "Day 14, Day 30, Day 45" |

---

### Stage 5 Exit Criteria

| Criterion | Check |
|---|---|
| All 58+ feasibility questions scored | No blanks |
| Composite score calculated | System-generated |
| All 8 hard gates evaluated | No "Not Evaluated" remaining |
| Zero hard gate failures | If any Fail → mandatory hold (cannot advance) |
| Financial model complete | All line items populated, ROI calculated |
| Success criteria defined | At least 3 quantitative metrics with baselines and targets |
| Pilot guardrails defined | Duration, scope, volume cap, review rates, rollback trigger |
| Executive sponsor approval | Sponsor has signed off on the investment and pilot plan |
| Composite verdict ≥ Conditional Go | Score ≥ 3.0 (or waiver with documented justification) |

**Transition:** → Stage 6 (Deliver) — wave assignment and pilot launch

---

## STAGE 6 — DELIVER

**Purpose:** Assign to a delivery wave, execute the pilot within guardrails, measure success, and scale up.

**Primary actor:** Portfolio Manager (wave planning), Delivery Team (build), Executive Sponsor (checkpoints)
**Duration:** Variable — depends on wave timing and pilot duration

---

### 6.1 Wave Planning

| Data Point | Filled by | Example | Feeds → |
|---|---|---|---|
| Wave assignment | Portfolio Manager | "Wave 1" | Delivery roadmap |
| Cost band (confirmed) | System (from 4.8 effort estimate) | "M (50K–150K)" | Budget allocation |
| Timeline band | Portfolio Manager | "10–14 weeks" | Delivery roadmap |
| Pilot slice | Portfolio Manager (from 5.4) | "10 stores, one region, one format" | Pilot scope |
| Dependencies | Portfolio Manager | "Salesforce FSL rollout must complete by Week 4" | Dependency tracking |
| Delivery team assigned | Portfolio Manager | Team names / resource IDs | Resourcing |

### 6.2 Mandatory Control Implementation

| Data Point | Filled by | Example |
|---|---|---|
| Control status | Delivery Team | "Required" → "Implemented" → "Verified" |
| Implementation evidence | Delivery Team | "Tokenization pipeline deployed, tested with 100 sample records" |
| Verified by | Security / Compliance | Name + date |

**All mandatory controls must reach "Verified" before pilot launch.**

### 6.3 Pilot Execution & Tracking

| Data Point | Filled by | Frequency | Example |
|---|---|---|---|
| Actual metric values (per success criterion) | Delivery Team | Per checkpoint | "Accuracy: 92% at Day 14" |
| Human intervention rate (actual) | Delivery Team | Weekly | "8% of cases escalated" |
| Incident count | Delivery Team | Ongoing | "0 critical, 2 minor" |
| Rollback triggered? | System / Delivery Team | If accuracy threshold breached | "No" |
| Pilot checkpoint decision | Executive Sponsor + Portfolio Manager | At each checkpoint date | "Continue" / "Adjust" / "Pause" / "Terminate" |
| Checkpoint notes | Evaluator | At each checkpoint | "Accuracy improving. Extend pilot 2 weeks for larger sample." |

### 6.4 Pilot Exit / Go-No-Go

| Data Point | Filled by | Check |
|---|---|---|
| All minimum thresholds met? | System-calculated | Each metric: actual ≥ minimum threshold |
| Go/No-Go decision | Executive Sponsor | "Go to Scale-Up" / "Extend Pilot" / "No-Go" |
| Decision rationale | Executive Sponsor | Free text |
| Lessons learned | Delivery Team | Free text |

### 6.5 Scale-Up

| Data Point | Filled by | Example |
|---|---|---|
| Production scope | Portfolio Manager | "All 120 stores, all formats" |
| Production deployment date | Delivery Team | Date |
| Production readiness checklist | Delivery Team | All items checked |
| Full control set verified at production scale | Security / Compliance | All controls re-verified |
| Operations handoff confirmed | Portfolio Manager | Ops team assigned and trained |

---

### Stage 6 Exit Criteria

| Criterion | Check |
|---|---|
| Wave assigned | Not blank |
| All mandatory controls verified | Every control at "Verified" status |
| Pilot completed | All checkpoint dates passed |
| Minimum thresholds met | All success criteria ≥ minimum |
| Go decision recorded | Executive sponsor signed off |
| Production readiness complete | Checklist all green |
| Operations handoff done | Ops team confirmed |

**Transition:** → Stage 7 (Operate)

---

## STAGE 7 — OPERATE

**Purpose:** Production steady-state with ongoing monitoring, governance, and revalidation.

**Primary actor:** Operations Team (day-to-day), Portfolio Manager (governance), Compliance (revalidation)
**Duration:** Ongoing until retirement

---

### 7.1 Operational Monitoring

| Data Point | Captured by | Frequency | Example |
|---|---|---|---|
| Success metric actuals (ongoing) | System / Ops | Monthly | "Accuracy: 94%, Cycle time: 0.8 hrs" |
| LLM cost actuals | System | Monthly | "$2,150/month" |
| Infrastructure cost actuals | System | Monthly | "$1,650/month" |
| HITL labor actuals | Ops | Monthly | "$800/month" |
| Total monthly run cost | System-calculated | Monthly | "$4,600/month" |
| Incident count | Ops | Monthly | "0 critical, 1 minor" |
| User adoption / usage | System | Monthly | "85% of eligible users active" |
| Model performance (accuracy, latency) | System | Continuous | "P95 latency: 2.3s, accuracy: 94.2%" |

### 7.2 Governance Cycles

| Activity | Trigger | Performed by | Deliverable |
|---|---|---|---|
| Quarterly revalidation | R3 cases, every 90 days | Evaluator + Security | Updated D4 scores, control re-verification, drift check |
| Annual attestation | R4 cases, every 12 months | Executive Sponsor + Compliance | Full re-assessment: scoring, controls, financial actuals vs. model |
| Drift monitoring review | Per plan from 4.5 | AI Architect / Ops | Drift report: accuracy trend, distribution shift, prompt effectiveness |
| Control re-verification | Annual (all tiers) | Compliance | All mandatory controls confirmed still in place and effective |
| Financial actuals review | Quarterly | Finance + Portfolio Manager | Actual ROI vs. projected, cost variance analysis |
| NDA / agreement renewal | Before expiry | Governance | NDA renewed or renegotiated |
| ATO renewal | Per ATO terms | Security | ATO re-authorized or remediation plan |

### 7.3 Lifecycle Events

| Event | Trigger | Result |
|---|---|---|
| Retirement | Business need no longer exists, technology superseded, or use case consolidated | Status → Retired, production decommissioned |
| Major change | Scope expansion, new data source, new write action, autonomy level change | Re-enters Stage 4 (Architect) for redesign and re-evaluation |
| Revalidation failure | R3/R4 revalidation finds material degradation | OnHold → remediation → re-evaluation |
| Incident response | Critical incident in production | Immediate: kill switch. Then: root cause analysis, control review, re-verification |

---

### Stage 7 Ongoing Criteria

| Criterion | Check |
|---|---|
| Monthly metrics reported | Not stale (last update < 30 days) |
| Quarterly revalidation current (R3) | Last revalidation < 90 days ago |
| Annual attestation current (R4) | Last attestation < 365 days ago |
| All controls verified (annual) | Last control verification < 365 days ago |
| NDA / agreements current | No expired agreements |
| Financial actuals tracked | Quarterly variance report exists |

---

## DATA FLOW SUMMARY — WHAT FEEDS WHAT

```
STAGE 1 (CAPTURE)
  │
  ├──→ §1.1 Exec sponsor name ──────────────────→ Hard gate G1 (Stage 5)
  ├──→ §1.2 Problem/solution ──────────────────→ Gating evidence (Stage 2)
  │                                               D1 scoring evidence (Stage 3B)
  │                                               AI question generation (Stage 5)
  ├──→ §1.3 Current state metrics ─────────────→ Financial model seed (Stage 5)
  │                                               D2 scoring evidence (Stage 3B)
  │                                               Success criteria baselines (Stage 5)
  ├──→ §1.4 Source systems ────────────────────→ Source system inventory seed (Stage 3A.1)
  ├──→ §1.5 DQ issues ────────────────────────→ DQ validation seed (Stage 3A.2)
  ├──→ §1.7 Governance fields ─────────────────→ Governance review seed (Stage 3A.4)
  │                                               Hard gates G2, G4, G7 (Stage 5)
  ├──→ §1.8 Security fields ──────────────────→ Security review seed (Stage 3A.5)
  │                                               Risk scoring evidence (Stage 3B)
  │                                               Hard gate G5 (Stage 5)
  └──→ §1.8 PII/CUI = Yes ────────────────────→ Triggers sensitive data inventory (Stage 3A.3)

STAGE 2 (TRIAGE)
  │
  └──→ Gate decision = Pass ───────────────────→ Unlocks Stage 3

STAGE 3 (PROFILE & SCORE)
  │
  ├──→ 3A.1 Source system inventory ───────────→ Integration complexity score (3B.2)
  │                                               Architecture inputs (Stage 4)
  │                                               Effort estimation inputs (Stage 4)
  ├──→ 3A.2 DQ validation ────────────────────→ Data readiness score (3B.2)
  │                                               Data readiness flag
  │                                               D3 evidence (Stage 5)
  ├──→ 3A.3 Sensitive data inventory ──────────→ Data sensitivity score (3B.3)
  │                                               LLM context determination (Stage 4.4)
  │                                               Control inheritance (Stage 4.7)
  ├──→ 3A.4 Governance review ─────────────────→ Governance/security fit score (3B.2)
  │                                               Hard gates G2, G4, G8 (Stage 5)
  │                                               D4 evidence (Stage 5)
  ├──→ 3A.5 Security review ──────────────────→ Risk scoring evidence (3B.3)
  │                                               Architecture constraints (Stage 4)
  │                                               Hard gate G5 (Stage 5)
  ├──→ 3B Priority score + rank ───────────────→ Wave planning priority (Stage 6)
  └──→ 3B Risk tier ──────────────────────────→ Control tier (Stage 4)
                                                  Revalidation frequency (Stage 7)

STAGE 4 (ARCHITECT)
  │
  ├──→ 4.1 LLM cost estimate ─────────────────→ Financial model: LLM API annual (Stage 5)
  ├──→ 4.3 Agent write actions ────────────────→ Hard gate G3 (Stage 5)
  │                                               D4 evidence (Stage 5)
  │                                               Control triggers (4.7)
  ├──→ 4.4 LLM context determination ─────────→ Control inheritance engine (4.7)
  ├──→ 4.5 Guardrails ────────────────────────→ Hard gates G5, G7 (Stage 5)
  │                                               D3, D4 evidence (Stage 5)
  ├──→ 4.6 Infra cost estimate ───────────────→ Financial model: infra annual (Stage 5)
  ├──→ 4.7 Mandatory controls ────────────────→ Control verification requirement (Stage 6)
  │                                               Operations checklist (Stage 7)
  └──→ 4.8 Effort estimate ───────────────────→ Financial model: one-time cost (Stage 5)
                                                  Cost band (Stage 6)

STAGE 5 (EVALUATE & JUSTIFY)
  │
  ├──→ Composite score + verdict ──────────────→ Go/No-Go decision
  ├──→ Financial model outputs ────────────────→ Investment approval (Stage 6)
  │                                               Actuals tracking baseline (Stage 7)
  ├──→ Success criteria ───────────────────────→ Pilot measurement (Stage 6)
  │                                               Ongoing monitoring (Stage 7)
  └──→ Pilot guardrails ──────────────────────→ Pilot execution rules (Stage 6)

STAGE 6 (DELIVER)
  │
  ├──→ Pilot actuals ─────────────────────────→ Go/No-Go evidence
  ├──→ Control verification ───────────────────→ Production readiness gate
  └──→ Production deployment ──────────────────→ Stage 7 (Operate)

STAGE 7 (OPERATE)
  │
  ├──→ Monthly actuals ───────────────────────→ Portfolio dashboards
  ├──→ Revalidation results ──────────────────→ Re-scoring or remediation
  └──→ Major change ──────────────────────────→ Re-enters Stage 4 (Architect)
```

---

## ROLE SUMMARY — WHO DOES WHAT, WHEN

| Role | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 | Stage 6 | Stage 7 |
|---|---|---|---|---|---|---|---|
| **Submitter** | Fills entire intake | — | Responds to info requests | — | — | — | — |
| **Portfolio Manager** | — | Gate decision | Scores 15 drivers (Track B) | — | — | Wave planning, checkpoints | Governance oversight |
| **Data Engineer** | — | — | Source system inventory (3A.1) | Technical validation | — | — | — |
| **Data Steward** | — | — | DQ validation (3A.2), Sensitive data inventory (3A.3) | — | — | — | — |
| **Security Architect** | — | — | Security review (3A.5), Sensitive data handling (3A.3) | — | — | Control verification | ATO renewal |
| **Governance Reviewer** | — | — | Governance review (3A.4), Consent/erasure fields (3A.3) | — | — | — | NDA/agreement renewal |
| **AI Architect** | — | — | — | Full solution design (4.1–4.8) | Deep feasibility scoring | Architecture support | Drift monitoring, re-architecture |
| **Evaluator** | — | — | May score (if separate from PM) | — | 58-question assessment, hard gates | — | Revalidation (R3/R4) |
| **Finance** | — | — | — | — | Financial model | — | Actuals tracking |
| **Executive Sponsor** | Named in §1.1 | — | — | — | Investment approval | Pilot checkpoints, Go/No-Go | Annual attestation (R4) |
| **Delivery Team** | — | — | — | — | — | Build, pilot execution | — |
| **Operations Team** | — | — | — | — | — | — | Day-to-day monitoring |
| **Compliance** | — | — | — | — | — | Control verification | Re-verification cycles |
