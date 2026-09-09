import {
  GateDecision,
  LifecycleStage,
  PartnerRole,
  PrismaClient,
  SecurityRole,
  TenantType,
  UseCaseStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { provisionTenant } from "../src/server/services/scoring-model-service";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "CaseForge123!";

async function upsertUser(params: {
  email: string;
  name: string;
  role: SecurityRole;
  tenantId?: string | null;
  passwordHash: string;
  emailVerified?: boolean;
}) {
  const verifiedAt = params.emailVerified === false ? null : new Date();
  return prisma.user.upsert({
    where: { email: params.email.toLowerCase() },
    update: {
      name: params.name,
      role: params.role,
      tenantId: params.tenantId ?? null,
      passwordHash: params.passwordHash,
      isActive: true,
      emailVerifiedAt: verifiedAt,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
    create: {
      email: params.email.toLowerCase(),
      name: params.name,
      role: params.role,
      tenantId: params.tenantId ?? null,
      passwordHash: params.passwordHash,
      isActive: true,
      emailVerifiedAt: verifiedAt,
    },
  });
}

async function ensureAssignment(params: {
  partnerId: string;
  partnerUserId: string;
  tenantId: string;
  assignedBy: string;
}) {
  const existing = await prisma.customerAssignment.findFirst({
    where: {
      partnerId: params.partnerId,
      partnerUserId: params.partnerUserId,
      tenantId: params.tenantId,
    },
  });
  if (existing) {
    return prisma.customerAssignment.update({
      where: { id: existing.id },
      data: { isActive: true, roleInTenant: SecurityRole.PORTFOLIO_MANAGER },
    });
  }
  return prisma.customerAssignment.create({
    data: {
      ...params,
      roleInTenant: SecurityRole.PORTFOLIO_MANAGER,
    },
  });
}

async function ensureTenant(
  name: string,
  adminEmail: string,
  adminName: string,
  partnerId: string,
) {
  const existing = await prisma.tenant.findFirst({ where: { name, partnerId } });
  if (existing) {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail.toLowerCase() },
    });
    const model = await prisma.scoringModel.findFirstOrThrow({
      where: { tenantId: existing.id, isDefault: true },
    });
    return { tenant: existing, admin, model };
  }
  return provisionTenant(prisma, {
    name,
    type: TenantType.PARTNER_MANAGED,
    partnerId,
    adminEmail,
    adminName,
    subscriptionTier: "ENTERPRISE",
  });
}

async function main() {
  console.info("Seeding CaseForge demo data…");

  // Pre-verification accounts have no token yet — treat them as verified so
  // existing demos are not locked out. New signups always receive a token.
  await prisma.user.updateMany({
    where: {
      emailVerifiedAt: null,
      emailVerificationToken: null,
    },
    data: { emailVerifiedAt: new Date() },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const platformAdminPasswordHash = await bcrypt.hash(
    "C4s3forg34DMIN!",
    10,
  );

  const platformAdmin = await upsertUser({
    email: "admin@caseforge.com",
    name: "Platform Admin",
    role: SecurityRole.PLATFORM_SUPER_ADMIN,
    passwordHash: platformAdminPasswordHash,
    emailVerified: true,
  });

  // Keep legacy local admin usable in demos if present
  await upsertUser({
    email: "admin@caseforge.local",
    name: "Platform Admin (local)",
    role: SecurityRole.PLATFORM_SUPER_ADMIN,
    passwordHash,
    emailVerified: true,
  });

  const partner = await prisma.partner.upsert({
    where: { id: "seed-partner-park-place" },
    update: {
      name: "Park Place",
      primaryColor: "#0f766e",
      accentColor: "#14b8a6",
      contactEmail: "ops@parkplace.example",
      isActive: true,
    },
    create: {
      id: "seed-partner-park-place",
      name: "Park Place",
      primaryColor: "#0f766e",
      accentColor: "#14b8a6",
      contactEmail: "ops@parkplace.example",
      maxCustomers: 50,
      maxConsultants: 20,
    },
  });

  const partnerAdmin = await upsertUser({
    email: "partner.admin@parkplace.example",
    name: "Park Place Admin",
    role: SecurityRole.PARTNER_ADMIN,
    passwordHash,
  });

  await prisma.partnerUser.upsert({
    where: { userId: partnerAdmin.id },
    update: { partnerId: partner.id, partnerRole: PartnerRole.PARTNER_ADMIN, isActive: true },
    create: {
      partnerId: partner.id,
      userId: partnerAdmin.id,
      partnerRole: PartnerRole.PARTNER_ADMIN,
    },
  });

  const consultant = await upsertUser({
    email: "consultant@parkplace.example",
    name: "Alex Consultant",
    role: SecurityRole.PARTNER_CONSULTANT,
    passwordHash,
  });

  const partnerConsultant = await prisma.partnerUser.upsert({
    where: { userId: consultant.id },
    update: { partnerId: partner.id, partnerRole: PartnerRole.PARTNER_CONSULTANT, isActive: true },
    create: {
      partnerId: partner.id,
      userId: consultant.id,
      partnerRole: PartnerRole.PARTNER_CONSULTANT,
    },
  });

  const customerA = await ensureTenant(
    "Acme Federal",
    "admin@acme-federal.example",
    "Acme Admin",
    partner.id,
  );
  const customerB = await ensureTenant(
    "Globex Industries",
    "admin@globex.example",
    "Globex Admin",
    partner.id,
  );

  for (const tenant of [customerA.tenant, customerB.tenant]) {
    await ensureAssignment({
      partnerId: partner.id,
      partnerUserId: partnerConsultant.id,
      tenantId: tenant.id,
      assignedBy: partnerAdmin.id,
    });
  }

  const roleUsers = [
    { email: "portfolio@acme-federal.example", name: "Portfolio Manager", role: SecurityRole.PORTFOLIO_MANAGER },
    { email: "evaluator@acme-federal.example", name: "Evaluator", role: SecurityRole.EVALUATOR },
    { email: "submitter@acme-federal.example", name: "Submitter", role: SecurityRole.SUBMITTER },
    { email: "security@acme-federal.example", name: "Security Reviewer", role: SecurityRole.DATA_SECURITY_REVIEWER },
    { email: "executive@acme-federal.example", name: "Executive Sponsor", role: SecurityRole.EXECUTIVE_SPONSOR },
    { email: "viewer@acme-federal.example", name: "Viewer", role: SecurityRole.VIEWER },
  ] as const;

  for (const ru of roleUsers) {
    await upsertUser({
      ...ru,
      tenantId: customerA.tenant.id,
      passwordHash,
    });
  }

  const submitter = await prisma.user.findUniqueOrThrow({
    where: { email: "submitter@acme-federal.example" },
  });

  const activeVersion = await prisma.scoringModelVersion.findFirst({
    where: { tenantId: customerA.tenant.id, status: "ACTIVE" },
  });

  const sampleUseCases = [
    { number: "UC-0001", title: "Invoice processing automation", unit: "Finance", stage: LifecycleStage.PRODUCTION, value: 4.2, feasibility: 3.8, risk: 2.1, priority: 78, rank: 1, gate: GateDecision.PASS, wave: 1 },
    { number: "UC-0002", title: "Contract intelligence assistant", unit: "Legal", stage: LifecycleStage.PILOT, value: 3.9, feasibility: 3.2, risk: 3.0, priority: 65, rank: 2, gate: GateDecision.PASS, wave: 2 },
    { number: "UC-0003", title: "Predictive maintenance alerts", unit: "Operations", stage: LifecycleStage.DEEP_FEASIBILITY, value: 3.5, feasibility: 2.8, risk: 2.5, priority: 58, rank: 3, gate: GateDecision.PASS },
    { number: "UC-0004", title: "Customer churn model", unit: "Sales", stage: LifecycleStage.PORTFOLIO_SCORING, value: 3.2, feasibility: 3.0, risk: 2.8, priority: 52, rank: 4, gate: GateDecision.PASS },
    { number: "UC-0005", title: "HR policy chatbot", unit: "HR", stage: LifecycleStage.GATING_REVIEW, value: 2.8, feasibility: 3.5, risk: 3.2, gate: GateDecision.NONE },
    { number: "UC-0006", title: "Legacy archive search", unit: "IT", stage: LifecycleStage.INTAKE_COMPLETE },
    { number: "UC-0007", title: "Supply chain risk monitor", unit: "Operations", stage: LifecycleStage.GATED_OUT, gate: GateDecision.GATE_C },
    { number: "UC-0008", title: "Benefits enrollment assistant", unit: "HR", stage: LifecycleStage.WAVE_PLANNING, value: 3.6, feasibility: 3.4, risk: 2.2, priority: 61, rank: 2, gate: GateDecision.PASS, wave: 1 },
  ] as const;

  for (const sample of sampleUseCases) {
    const existing = await prisma.useCase.findFirst({
      where: { tenantId: customerA.tenant.id, useCaseNumber: sample.number },
    });
    if (existing) continue;

    const uc = await prisma.useCase.create({
      data: {
        tenantId: customerA.tenant.id,
        useCaseNumber: sample.number,
        title: sample.title,
        businessUnit: sample.unit,
        submittedById: submitter.id,
        problemStatement: `Operational pain in ${sample.unit} requiring measurable automation outcomes.`,
        proposedSolution: `AI-assisted workflow for ${sample.title.toLowerCase()} with human-in-the-loop controls.`,
        expectedBenefits: "Reduce cycle time by 30% and improve auditability.",
        currentStage: sample.stage,
        status: sample.stage === LifecycleStage.GATED_OUT ? UseCaseStatus.GATED_OUT : UseCaseStatus.ACTIVE,
        gateDecision: "gate" in sample ? sample.gate : GateDecision.NONE,
        valueScore: "value" in sample ? sample.value : undefined,
        feasibilityScore: "feasibility" in sample ? sample.feasibility : undefined,
        riskScore: "risk" in sample ? sample.risk : undefined,
        priorityScore: "priority" in sample ? sample.priority : undefined,
        rank: "rank" in sample ? sample.rank : undefined,
        wave: "wave" in sample ? sample.wave : undefined,
        currentScoringVersionId: activeVersion?.id,
      },
    });

    await prisma.lifecycleEvent.create({
      data: {
        useCaseId: uc.id,
        tenantId: customerA.tenant.id,
        fromStage: LifecycleStage.INTAKE_DRAFT,
        toStage: sample.stage,
        transitionedById: submitter.id,
        notes: "Seeded demo transition",
      },
    });
  }

  const globexSubmitter = await upsertUser({
    email: "submitter@globex.example",
    name: "Globex Submitter",
    role: SecurityRole.SUBMITTER,
    tenantId: customerB.tenant.id,
    passwordHash,
  });

  const globexExists = await prisma.useCase.findFirst({
    where: { tenantId: customerB.tenant.id, useCaseNumber: "UC-G001" },
  });
  if (!globexExists) {
    await prisma.useCase.create({
      data: {
        tenantId: customerB.tenant.id,
        useCaseNumber: "UC-G001",
        title: "Quality inspection vision model",
        businessUnit: "Manufacturing",
        submittedById: globexSubmitter.id,
        problemStatement: "Manual inspection bottlenecks on high-volume lines.",
        proposedSolution: "Computer vision model with edge deployment.",
        currentStage: LifecycleStage.PORTFOLIO_SCORING,
        status: UseCaseStatus.ACTIVE,
        valueScore: 3.8,
        feasibilityScore: 2.9,
        riskScore: 3.1,
        priorityScore: 55,
        rank: 1,
        gateDecision: GateDecision.PASS,
      },
    });
  }

  const welcomeExists = await prisma.notification.findFirst({
    where: { userId: customerA.admin.id, title: "Welcome to CaseForge" },
  });
  if (!welcomeExists) {
    await prisma.notification.create({
      data: {
        tenantId: customerA.tenant.id,
        userId: customerA.admin.id,
        title: "Welcome to CaseForge",
        message: "Demo tenant seeded with sample use cases across lifecycle stages.",
        link: "/dashboard",
      },
    });
  }

  console.info("Seed complete.");
  console.info("Demo password for seeded users:", DEMO_PASSWORD);
  console.info("Platform admin:", platformAdmin.email, "/ C4s3forg34DMIN!");
  console.info("Partner admin:", partnerAdmin.email);
  console.info("Consultant:", consultant.email);
  console.info("Customer A admin:", customerA.admin.email);
  console.info("Customer B admin:", customerB.admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
