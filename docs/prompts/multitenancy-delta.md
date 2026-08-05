# CaseForge — Multi-Tenancy Architecture Delta

## What Changes and Why

---

## 1. THE PROBLEM WITH THE CURRENT MODEL

The current architecture has two tiers:
- Platform Admin (manages tenants)
- Tenant users (work within one tenant)

What you actually need is **three tiers**:

```
TIER 1: PLATFORM
  Global Admin — manages everything, billing, platform config
  
TIER 2: PARTNER (Your consulting firm)
  Partner Admin — manages your consultants, assigns them to customers
  Partner Consultants — work ACROSS multiple customer tenants
  Cross-tenant dashboards — see portfolio health across all your customers
  Tenant switcher — jump between customer contexts
  
TIER 3: CUSTOMER (Each client)
  Customer Admin — manages their users, configures THEIR scoring weights
  Customer Users — submitters, reviewers, sponsors — see ONLY their data
  Independent scoring models — each customer owns their weight configuration
```

The critical difference: a Partner Consultant is NOT a user within a customer tenant. They are a user at the partner level who has **delegated access** to specific customer tenants. When they switch to "Acme Corp" context, they see Acme's data, Acme's branding, Acme's scoring model — but their identity remains as a Park Place consultant.

---

## 2. REVISED TENANT & IDENTITY MODEL

### New Entity: cf_Partner

```
Entity: cf_Partner
───────────────────────────────────────
partner_id             uniqueidentifier  PK
partner_name           nvarchar(200)     "Park Place Technologies"
logo_url               nvarchar(500)
primary_color          nvarchar(7)
is_active              bit
created_date           datetime
```

### New Entity: cf_PartnerUserAssignment

```
Entity: cf_PartnerUserAssignment
───────────────────────────────────────
assignment_id          uniqueidentifier  PK
partner_id             uniqueidentifier  FK → cf_Partner
user_id                uniqueidentifier  FK → SystemUser
tenant_id              uniqueidentifier  FK → cf_TenantConfig (the customer tenant)
role_in_tenant         OptionSet         [PortfolioManager, Evaluator, Architect, Viewer]
assigned_date          datetime
assigned_by            uniqueidentifier
is_active              bit
```

This entity answers: "Which of my consultants can access which customer tenants, and in what role?"

### Revised Entity: cf_TenantConfig (add fields)

```
# New fields on cf_TenantConfig
partner_id             uniqueidentifier  FK → cf_Partner (nullable — SaaS customers have no partner)
tenant_type            OptionSet         [PartnerManaged, SelfServe]
```

### Revised Security Roles

```
PLATFORM LEVEL:
  PlatformSuperAdmin     Full access to everything — platform config, billing, all partners, all tenants

PARTNER LEVEL:
  PartnerAdmin           Manages the partner org — invite/remove consultants, assign to customers,
                         see cross-customer dashboards, create new customer tenants
  PartnerConsultant      Works within assigned customer tenants (role per tenant from assignment).
                         Can switch between customers. Sees cross-customer summary dashboard.

CUSTOMER LEVEL:
  CustomerAdmin          Manages their tenant — users, scoring weights, form config, branding.
                         Cannot see other tenants. Cannot see partner-level data.
  PortfolioManager       Within their tenant only
  Evaluator              Within their tenant only
  Submitter              Within their tenant only
  DataSecurityReviewer   Within their tenant only
  ExecutiveSponsor       Within their tenant only
  Viewer                 Within their tenant only
```

### Access Control Logic

```csharp
// When resolving access, check in order:
public async Task<TenantAccessResult> ResolveAccess(Guid userId, Guid? requestedTenantId)
{
    // 1. Is user a Platform Super Admin?
    if (IsPlatformAdmin(userId))
        return FullAccess(requestedTenantId);

    // 2. Is user a Partner user?
    var partnerAssignments = GetPartnerAssignments(userId);
    if (partnerAssignments.Any())
    {
        // Partner Admin: access all tenants under their partner
        if (IsPartnerAdmin(userId))
            return PartnerAccess(partnerAssignments.Select(a => a.TenantId));

        // Partner Consultant: access only assigned tenants, with assigned role
        var assignment = partnerAssignments.FirstOrDefault(a => a.TenantId == requestedTenantId);
        if (assignment != null)
            return TenantAccess(requestedTenantId, assignment.RoleInTenant);

        return AccessDenied("Not assigned to this customer");
    }

    // 3. Is user a Customer user?
    var customerTenantId = GetUserTenantId(userId);
    if (customerTenantId == requestedTenantId)
        return TenantAccess(requestedTenantId, GetUserRole(userId));

    return AccessDenied("No access to this tenant");
}
```

---

## 3. TENANT SWITCHER (Partner Users Only)

### UI Component: TenantSwitcher.razor

Partner Consultants and Partner Admins see a **tenant switcher** in the top navigation bar.

```
┌─────────────────────────────────────────────────────┐
│ [Park Place Logo]  │  Working as: Acme Corp ▼       │
│                    │  ┌─────────────────────────┐   │
│                    │  │ ● Acme Corp         (PM) │   │
│                    │  │ ○ GlobalRetail Inc  (Eval)│   │
│                    │  │ ○ DefenseCo Ltd    (View)│   │
│                    │  │ ──────────────────────── │   │
│                    │  │ Cross-Customer Dashboard │   │
│                    │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Behavior:
- Shows all customer tenants the user is assigned to
- Shows their role in each tenant (PM, Evaluator, Architect, Viewer)
- Switching tenant: reloads tenant config, applies customer branding, scopes all data queries
- "Cross-Customer Dashboard" option: switches to partner-level view (see §4 below)
- Customer users NEVER see this component

### Cross-Customer Dashboard (Partner Level)

Available only to PartnerAdmin and PartnerConsultant roles. Shows:

| Widget | Description |
|---|---|
| Customer Health Matrix | Table: customers × (total use cases, active, in pilot, in production, avg priority, top risk tier) |
| Aggregate Pipeline | Funnel across all customers (how many cases at each stage across the book of business) |
| At-Risk Customers | Customers with: stale cases > 30 days, failed hard gates, expired NDAs |
| Consultant Workload | Which consultants are assigned to which customers, how many active cases each |
| Revenue View | Cost band totals per customer (sizing the engagement value) |
| Weight Change Log | Recent weight changes across customers (see §5) |

---

## 4. CUSTOMER-INDEPENDENT SCORING MODELS

Each customer already has their own scoring model (cf_ScoringModel with tenant_id). What needs to change is:

### The customer can modify weights independently

The CustomerAdmin role (not the partner) controls their scoring weights. This is critical — it's the customer's value judgment, not the consultant's.

However, the partner consultant (as PortfolioManager in that tenant) can:
- VIEW the current weights
- PROPOSE weight changes (creates a draft version for the CustomerAdmin to approve)
- RUN "what-if" simulations with different weights (preview only, does not save)

The CustomerAdmin can:
- VIEW and CHANGE weights directly
- APPROVE proposed changes from the consultant
- VIEW weight change history
- TRIGGER re-scoring of all active use cases under new weights

---

## 5. WEIGHT VERSIONING & HISTORICAL RE-SCORING

### New Entity: cf_ScoringModelVersion

```
Entity: cf_ScoringModelVersion
───────────────────────────────────────
version_id             uniqueidentifier  PK
model_id               uniqueidentifier  FK → cf_ScoringModel
version_number         int               Auto-increment per model
status                 OptionSet         [Draft, Active, Superseded]
effective_date         datetime          When this version became active
superseded_date        datetime          When replaced by next version
created_by             uniqueidentifier
created_date           datetime
change_summary         nvarchar(max)     "Value: Financial return 30%→25%, Exec alignment 20%→25%"
change_reason          nvarchar(max)     "Customer requested more emphasis on executive alignment"

# Snapshot of all weights at this version
value_drivers          nvarchar(max)     JSON: [{"driver":"Financial return","weight":0.25}, ...]
feasibility_drivers    nvarchar(max)     JSON: [{"driver":"Data readiness","weight":0.30}, ...]
risk_drivers           nvarchar(max)     JSON: [{"driver":"Decision consequentiality","weight":0.30}, ...]
value_weight_in_priority  decimal(3,2)   The V/F split (e.g., 0.50)
feasibility_weight_in_priority decimal(3,2)
```

### New Entity: cf_ScoringSnapshot

```
Entity: cf_ScoringSnapshot
───────────────────────────────────────
snapshot_id            uniqueidentifier  PK
usecase_id             uniqueidentifier  FK → cf_UseCase
version_id             uniqueidentifier  FK → cf_ScoringModelVersion
snapshot_date          datetime

# Frozen scores under this weight version
value_score            decimal(5,3)
feasibility_score      decimal(5,3)
risk_score             decimal(5,3)
risk_tier              OptionSet
tier_multiplier        decimal(3,2)
priority_score         decimal(5,3)
rank                   int
```

### How It Works

```
WEIGHT CHANGE FLOW:

1. CustomerAdmin opens Scoring Model Config
2. Adjusts weights (sliders)
3. Clicks "Preview Impact"
   → System calculates new scores for ALL active use cases using new weights
   → Shows side-by-side comparison:
   
   ┌──────────────────────────────────────────────────────────────┐
   │ WEIGHT CHANGE IMPACT PREVIEW                                 │
   │                                                              │
   │ Use Case            Current   Current  New      New    Rank  │
   │                     Priority  Rank     Priority Rank   Δ     │
   │ ────────────────────────────────────────────────────────────  │
   │ Floor Plan Valid.   3.575     1        3.425    2      ↓1    │
   │ Lease Abstraction   3.420     2        3.580    1      ↑1    │
   │ Inventory Recon     3.200     3        3.200    3      —     │
   │ ...                                                          │
   └──────────────────────────────────────────────────────────────┘

4. CustomerAdmin clicks "Apply New Weights"
   → Current version status → Superseded (with superseded_date = now)
   → New version created with status = Active
   → SNAPSHOT: for every active use case, a cf_ScoringSnapshot is created
     recording the scores under the OLD weights (preserving history)
   → All active use cases are RE-SCORED with new weights
   → New scores written to the UseCase entity
   → Rankings recalculated
   → Audit log entry created

5. CustomerAdmin (or consultant) can view historical scoring:
   → "Score History" tab on use case detail shows:
     - Current scores (under current weights)
     - Previous scores under each historical weight version
     - Chart: priority score over time (each weight version as a data point)
     - Table: weight version, effective date, priority score, rank at that time
```

### Weight Change Constraints

- Only one version can be Active at a time per tenant
- Superseded versions are read-only (historical record)
- Draft versions can be created by PartnerConsultants for CustomerAdmin review
- Weight changes are logged in the audit trail with before/after diff
- Notification fires to PartnerAdmin + all PortfolioManagers when weights change
- Re-scoring is atomic — all use cases are re-scored in one transaction

---

## 6. DATA ISOLATION VERIFICATION

### What each tier can see:

| Data | Platform Admin | Partner Admin | Partner Consultant | Customer Admin | Customer User |
|---|---|---|---|---|---|
| All tenants' data | Yes | Their customers only | Assigned customers only | Their tenant only | Their tenant only |
| Partner config | Yes | Their partner | View only | No | No |
| Cross-customer dashboard | Yes | Yes | Yes (assigned only) | No | No |
| Scoring model weights | Yes | View all customers | View assigned | Edit own | View |
| Weight change history | Yes | All customers | Assigned | Own tenant | No |
| Use case data | Yes | Their customers | Assigned customers | Own tenant | Own (Submitter) or all (PM+) |
| User management | All | Partner users + customer users | No | Customer users | No |
| Tenant branding | All | Their customers | No | Own | No |
| Billing | Yes | View own | No | No | No |

### Dataverse Row-Level Security Implementation

```
Business Unit hierarchy:
  Platform Root
  ├── Partner: Park Place Technologies
  │   ├── Customer: Acme Corp
  │   │   ├── Team: Acme Admins
  │   │   ├── Team: Acme Users
  │   │   └── Team: Park Place @ Acme  ← partner consultants assigned to Acme
  │   ├── Customer: GlobalRetail Inc
  │   │   ├── Team: GR Admins
  │   │   ├── Team: GR Users
  │   │   └── Team: Park Place @ GR
  │   └── Partner-Level Team: Park Place Admins
  └── Platform Admin Team
```

Each "Park Place @ {Customer}" team gets the assigned partner consultant as a member. Their security role in that team matches their role_in_tenant from the assignment table. When they switch tenant context, queries run under that team's security role.

---

## 7. CURSOR PROMPT CHANGES

### Prompt 2 (Data Model) — ADD:
- cf_Partner entity
- cf_PartnerUserAssignment entity
- cf_ScoringModelVersion entity
- cf_ScoringSnapshot entity
- Add partner_id and tenant_type to cf_TenantConfig
- Add version_id to cf_AxisScore (which version were these scores calculated under)

### Prompt 3 (Auth & Roles) — REWRITE:
- Three-tier access resolution (Platform → Partner → Customer)
- Partner-level roles: PartnerAdmin, PartnerConsultant
- Customer-level roles: CustomerAdmin + existing roles
- TenantSwitcher component (partner users only)
- Cross-tenant query capability for partner users
- Assignment management (PartnerAdmin assigns consultants to customers)

### Prompt 4 (Admin) — SPLIT INTO THREE:
- Platform Admin: tenant provisioning, partner management, billing
- Partner Admin: consultant management, customer assignment, cross-customer dashboard
- Customer Admin: branding, scoring weights (with versioning), form config, user management

### Prompt 8 (Scoring) — EXPAND:
- Weight versioning: create/activate/supersede versions
- Snapshot creation on weight change
- Re-scoring engine: recalculate all active use cases atomically
- "Preview Impact" function: calculate hypothetical scores without saving
- Score history view: show scores under each historical weight version
- Draft weight proposal workflow (consultant proposes → customer approves)

### Prompt 12 (Lifecycle & Notifications) — ADD:
- Notification: weight change applied → all PortfolioManagers + PartnerAdmin
- Notification: weight change proposed → CustomerAdmin
- Notification: new customer tenant provisioned → PartnerAdmin

### Prompt 13 (Dashboards) — ADD:
- Cross-customer dashboard (partner level)
- Customer health matrix
- Consultant workload view
- Score history chart on use case detail
- Weight version comparison view

### Prompt 15 (Deployment) — ADD:
- Partner provisioning pipeline (create partner, assign first admin)
- Customer provisioning under a partner (creates BU under partner, assigns default team)
- Self-serve customer provisioning (no partner, direct SaaS)
