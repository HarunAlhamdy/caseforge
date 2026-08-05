const fs = require("fs");
const path = require("path");

const pages = {
  "dashboard/page.tsx": [
    "Dashboard",
    "Overview of active use cases, pipeline health, and stage distribution across your portfolio.",
  ],
  "intake/page.tsx": [
    "Intake",
    "Stage 1 — browse submitted and draft use case intakes.",
  ],
  "intake/new/page.tsx": [
    "New Intake",
    "Stage 1 — start a new use case intake wizard.",
  ],
  "intake/[id]/page.tsx": [
    "Intake Detail",
    "Stage 1 — view or edit a specific intake submission.",
  ],
  "review/queue/page.tsx": [
    "Review Queue",
    "Stage 2 — triage incoming use cases awaiting initial review.",
  ],
  "review/gate/[id]/page.tsx": [
    "Gating Review",
    "Stage 2 — evaluate gate criteria and make pass/hold/gate decisions.",
  ],
  "review/profiles/page.tsx": [
    "Profile Reviews",
    "Stage 3A — dashboard of specialist profile review assignments.",
  ],
  "review/profiles/[id]/page.tsx": [
    "Profile Review Detail",
    "Stage 3A — complete domain-specific profile review for a use case.",
  ],
  "scoring/[id]/page.tsx": [
    "Use Case Scoring",
    "Stage 3B — score an individual use case across value, feasibility, and risk axes.",
  ],
  "scoring/portfolio/page.tsx": [
    "Portfolio Scoring",
    "Stage 3B — ranked portfolio view with composite scores.",
  ],
  "architecture/[id]/page.tsx": [
    "Solution Architecture",
    "Stage 4 — AI solution design, patterns, and technical blueprint.",
  ],
  "evaluation/[id]/page.tsx": [
    "Evaluation",
    "Stage 5 — formal assessment of feasibility, risk, and readiness.",
  ],
  "evaluation/[id]/gates/page.tsx": [
    "Evaluation Gates",
    "Stage 5 — hard gate checklist and evidence review.",
  ],
  "financial/page.tsx": [
    "Financial Analysis",
    "ROI, NPV, payback, and cost band projections for evaluated use cases.",
  ],
  "criteria/page.tsx": [
    "Success Criteria",
    "Define and track measurable success criteria for use cases.",
  ],
  "scorecard/page.tsx": [
    "Scorecard",
    "Composite scorecard summary across portfolio dimensions.",
  ],
  "delivery/waves/page.tsx": [
    "Wave Planning",
    "Stage 6 — plan delivery waves and resource allocation.",
  ],
  "delivery/pilot/[id]/page.tsx": [
    "Pilot Delivery",
    "Stage 6 — manage pilot execution and success metrics.",
  ],
  "delivery/scaleup/[id]/page.tsx": [
    "Scale Up",
    "Stage 6 — transition from pilot to scaled deployment.",
  ],
  "operations/page.tsx": [
    "Operations",
    "Stage 7 — production operations dashboard.",
  ],
  "operations/[id]/page.tsx": [
    "Operations Detail",
    "Stage 7 — monitor a production use case health and SLAs.",
  ],
  "usecase/[id]/page.tsx": [
    "Use Case Master",
    "Unified detail view with tabs across all lifecycle stages.",
  ],
  "partner/dashboard/page.tsx": [
    "Partner Dashboard",
    "Cross-customer portfolio view for partner consultants.",
  ],
  "partner/workload/page.tsx": [
    "Partner Workload",
    "Consultant assignment and capacity planning.",
  ],
  "partner/health/page.tsx": [
    "Partner Health",
    "Tenant health scores and engagement metrics.",
  ],
  "admin/platform/page.tsx": [
    "Platform Admin",
    "Platform super-admin configuration and tenant management.",
  ],
  "admin/partner/page.tsx": [
    "Partner Admin",
    "Partner-level user and tenant administration.",
  ],
  "admin/customer/page.tsx": [
    "Customer Admin",
    "Customer tenant user management and settings.",
  ],
  "reports/gate-report/page.tsx": [
    "Gate Report",
    "Summary of gate decisions across the portfolio.",
  ],
  "reports/export/page.tsx": [
    "Data Export",
    "Export portfolio data to Excel or CSV.",
  ],
};

const base = path.join(__dirname, "..", "src", "app", "(app)");

for (const [relPath, [title, description]] of Object.entries(pages)) {
  const fullPath = path.join(base, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const content = `import { AppPage } from "@/components/layout/AppPage";

export default function Page() {
  return (
    <AppPage
      title="${title}"
      description="${description}"
    />
  );
}
`;
  fs.writeFileSync(fullPath, content);
}

console.log(`Created ${Object.keys(pages).length} pages`);
