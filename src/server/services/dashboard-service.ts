import type { PrismaClient } from "@prisma/client";
import { LifecycleStage, UseCaseStatus } from "@prisma/client";
import { getStageLabel } from "@/lib/workflow/stage-transitions";

const ACTIVE_STAGES = Object.values(LifecycleStage).filter(
  (s) => s !== "RETIRED" && s !== "GATED_OUT",
);

export async function getDashboardSummary(scopedDb: PrismaClient, tenantId: string) {
  const useCases = await scopedDb.useCase.findMany({
    where: { tenantId, status: UseCaseStatus.ACTIVE },
    include: { lifecycleEvents: { orderBy: { transitionedAt: "desc" }, take: 1 } },
  });

  const stageCounts: Record<string, number> = {};
  for (const stage of ACTIVE_STAGES) {
    stageCounts[stage] = 0;
  }
  for (const uc of useCases) {
    stageCounts[uc.currentStage] = (stageCounts[uc.currentStage] ?? 0) + 1;
  }

  const funnel = ACTIVE_STAGES.map((stage) => ({
    stage,
    label: getStageLabel(stage),
    count: stageCounts[stage] ?? 0,
  }));

  const scatter = useCases
    .filter((uc) => uc.valueScore != null && uc.feasibilityScore != null)
    .map((uc) => ({
      id: uc.id,
      title: uc.title,
      value: uc.valueScore!,
      feasibility: uc.feasibilityScore!,
      priority: uc.priorityScore ?? 0,
      tier: uc.riskTier,
    }));

  const riskTierCounts: Record<string, number> = {};
  for (const uc of useCases) {
    const tier = uc.riskTier ?? "UNSCORED";
    riskTierCounts[tier] = (riskTierCounts[tier] ?? 0) + 1;
  }

  const businessUnits = Array.from(new Set(useCases.map((uc) => uc.businessUnit)));
  const heatmap: Array<{ unit: string; stage: string; count: number }> = [];
  for (const unit of businessUnits) {
    for (const stage of ACTIVE_STAGES.slice(0, 8)) {
      const count = useCases.filter(
        (uc) => uc.businessUnit === unit && uc.currentStage === stage,
      ).length;
      if (count > 0) {
        heatmap.push({ unit, stage: getStageLabel(stage), count });
      }
    }
  }

  const readinessCounts = { GREEN: 0, AMBER: 0, RED: 0, UNKNOWN: 0 };
  for (const uc of useCases) {
    const flag = uc.dataReadinessFlag ?? "UNKNOWN";
    readinessCounts[flag as keyof typeof readinessCounts]++;
  }

  const waveCounts: Record<string, number> = {
    unassigned: 0,
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
  };
  for (const uc of useCases) {
    if (uc.wave == null) waveCounts.unassigned++;
    else waveCounts[String(uc.wave)] = (waveCounts[String(uc.wave)] ?? 0) + 1;
  }

  const gateCounts: Record<string, number> = {};
  for (const uc of useCases) {
    const g = uc.gateDecision ?? "NONE";
    gateCounts[g] = (gateCounts[g] ?? 0) + 1;
  }

  const topUseCases = [...useCases]
    .filter((uc) => uc.priorityScore != null)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .slice(0, 10)
    .map((uc) => ({
      id: uc.id,
      number: uc.useCaseNumber,
      title: uc.title,
      stage: getStageLabel(uc.currentStage),
      priority: uc.priorityScore,
      rank: uc.rank,
    }));

  const recentActivity = await scopedDb.lifecycleEvent.findMany({
    where: { tenantId },
    orderBy: { transitionedAt: "desc" },
    take: 15,
    include: {
      useCase: { select: { title: true, useCaseNumber: true } },
      transitionedBy: { select: { name: true } },
    },
  });

  const snapshots = await scopedDb.scoringSnapshot.findMany({
    where: { tenantId },
    orderBy: { snapshotDate: "asc" },
    take: 50,
    include: { version: { select: { versionNumber: true } } },
  });

  const priorityTrend: Record<string, { date: string; avgPriority: number; count: number }> = {};
  for (const snap of snapshots) {
    const key = snap.snapshotDate.toISOString().slice(0, 10);
    if (!priorityTrend[key]) {
      priorityTrend[key] = { date: key, avgPriority: 0, count: 0 };
    }
    priorityTrend[key].avgPriority += snap.priorityScore;
    priorityTrend[key].count += 1;
  }
  const priorityLine = Object.values(priorityTrend).map((p) => ({
    date: p.date,
    avgPriority: Math.round((p.avgPriority / p.count) * 10) / 10,
  }));

  return {
    totalActive: useCases.length,
    funnel,
    scatter,
    stageBar: funnel.filter((f) => f.count > 0),
    riskTierPie: Object.entries(riskTierCounts).map(([name, value]) => ({
      name,
      value,
    })),
    heatmap,
    readinessPie: Object.entries(readinessCounts).map(([name, value]) => ({
      name,
      value,
    })),
    waveBar: Object.entries(waveCounts).map(([name, value]) => ({ name, value })),
    gateBar: Object.entries(gateCounts).map(([name, value]) => ({ name, value })),
    topUseCases,
    priorityLine,
    recentActivity: recentActivity.map((e) => ({
      id: e.id,
      useCaseTitle: e.useCase.title,
      useCaseNumber: e.useCase.useCaseNumber,
      fromStage: getStageLabel(e.fromStage),
      toStage: getStageLabel(e.toStage),
      by: e.transitionedBy.name,
      at: e.transitionedAt,
    })),
  };
}

export async function getPartnerDashboard(db: PrismaClient, partnerId: string) {
  const tenants = await db.tenant.findMany({
    where: { partnerId },
    select: { id: true, name: true },
  });

  const tenantIds = tenants.map((t) => t.id);
  if (tenantIds.length === 0) {
    return {
      customers: [],
      totalUseCases: 0,
      stageDistribution: [],
      workloadByConsultant: [],
      healthScores: [],
    };
  }

  const useCases = await db.useCase.findMany({
    where: { tenantId: { in: tenantIds }, status: UseCaseStatus.ACTIVE },
  });

  const stageDistribution: Record<string, number> = {};
  for (const uc of useCases) {
    stageDistribution[uc.currentStage] = (stageDistribution[uc.currentStage] ?? 0) + 1;
  }

  const assignments = await db.customerAssignment.findMany({
    where: { partnerId, isActive: true },
    include: {
      partnerUser: { include: { user: { select: { name: true, id: true } } } },
      tenant: { select: { name: true } },
    },
  });

  const workloadMap: Record<string, { name: string; assignments: number; customers: string[] }> = {};
  for (const a of assignments) {
    const uid = a.partnerUser.user.id;
    if (!workloadMap[uid]) {
      workloadMap[uid] = {
        name: a.partnerUser.user.name,
        assignments: 0,
        customers: [],
      };
    }
    workloadMap[uid].assignments += 1;
    workloadMap[uid].customers.push(a.tenant.name);
  }

  const healthScores = tenants.map((t) => {
    const tenantCases = useCases.filter((uc) => uc.tenantId === t.id);
    const scored = tenantCases.filter((uc) => uc.priorityScore != null).length;
    const onHold = tenantCases.filter((uc) => uc.currentStage === "ON_HOLD").length;
    const gated = tenantCases.filter((uc) => uc.currentStage === "GATED_OUT").length;
    const score = tenantCases.length
      ? Math.round(((scored / tenantCases.length) * 70 + (1 - onHold / tenantCases.length) * 20 + (1 - gated / tenantCases.length) * 10))
      : 0;
    return {
      tenantId: t.id,
      tenantName: t.name,
      useCaseCount: tenantCases.length,
      healthScore: Math.min(100, Math.max(0, score)),
      onHold,
      gated,
    };
  });

  return {
    customers: tenants,
    totalUseCases: useCases.length,
    stageDistribution: Object.entries(stageDistribution).map(([stage, count]) => ({
      stage: getStageLabel(stage as LifecycleStage),
      count,
    })),
    workloadByConsultant: Object.values(workloadMap),
    healthScores,
  };
}

export async function getExecutiveSummary(scopedDb: PrismaClient, tenantId: string) {
  const summary = await getDashboardSummary(scopedDb, tenantId);
  const useCases = await scopedDb.useCase.findMany({
    where: { tenantId, status: UseCaseStatus.ACTIVE },
  });

  const inDelivery = useCases.filter((uc) =>
    ["PILOT", "SCALE_UP", "PRODUCTION"].includes(uc.currentStage),
  ).length;
  const inPipeline = useCases.filter((uc) =>
    ["INTAKE_DRAFT", "INTAKE_COMPLETE", "PENDING_REVIEW", "GATING_REVIEW"].includes(
      uc.currentStage,
    ),
  ).length;
  const avgPriority =
    useCases.filter((uc) => uc.priorityScore != null).reduce((s, uc) => s + (uc.priorityScore ?? 0), 0) /
    Math.max(1, useCases.filter((uc) => uc.priorityScore != null).length);

  return {
    ...summary,
    kpis: {
      totalActive: summary.totalActive,
      inDelivery,
      inPipeline,
      avgPriority: Math.round(avgPriority * 10) / 10,
      topRanked: summary.topUseCases[0] ?? null,
    },
  };
}
