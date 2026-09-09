import type { PrismaClient, Prisma } from "@prisma/client";
import {
  ScoringAxisType,
  ScoringModelVersionStatus,
  SecurityRole,
  TenantType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { getGlobalConfig } from "@/lib/constants/global-config";
import { DEFAULT_RISK_TIERS } from "@/lib/constants/scoring-template";
import type { ScoringDriverSnapshot } from "@/lib/types";

export interface ProvisionTenantInput {
  name: string;
  type: TenantType;
  partnerId?: string | null;
  subscriptionTier?: string;
  adminEmail: string;
  adminName: string;
  /** If omitted, a one-time random password is generated and returned as tempPassword */
  password?: string;
  /** Admin-provisioned accounts skip email verification */
  markEmailVerified?: boolean;
}

export async function provisionTenant(
  db: PrismaClient,
  input: ProvisionTenantInput,
) {
  const globalConfig = getGlobalConfig();
  const tempPassword = input.password ?? crypto.randomUUID();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Supabase pooler + many nested creates needs more than Prisma's 5s default
  return db.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          type: input.type,
          partnerId: input.partnerId ?? null,
          subscriptionTier: input.subscriptionTier ?? "STARTER",
          intakeFormConfig:
            globalConfig.intakeFormConfig as unknown as Prisma.InputJsonValue,
        },
      });

      const { model } = await createScoringModelForTenant(tx, tenant.id);

      const admin = await tx.user.create({
        data: {
          email: input.adminEmail.toLowerCase(),
          name: input.adminName,
          role: SecurityRole.CUSTOMER_ADMIN,
          tenantId: tenant.id,
          passwordHash,
          emailVerifiedAt: input.markEmailVerified ? new Date() : null,
        },
      });

      return { tenant, model, admin, tempPassword };
    },
    { timeout: 60_000, maxWait: 15_000 },
  );
}

async function createScoringModelForTenant(
  tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
  tenantId: string,
  createdById?: string,
) {
  const globalConfig = getGlobalConfig();

  const model = await tx.scoringModel.create({
    data: {
      tenantId,
      name: globalConfig.modelName,
      isDefault: true,
      valueWeightInPriority: globalConfig.valueWeightInPriority,
      feasibilityWeightInPriority: globalConfig.feasibilityWeightInPriority,
      createdById,
    },
  });

  const driverIdByKey = new Map<string, string>();

  for (const axisDef of globalConfig.axes) {
    const axisType =
      axisDef.axisType === "VALUE"
        ? ScoringAxisType.VALUE
        : axisDef.axisType === "FEASIBILITY"
          ? ScoringAxisType.FEASIBILITY
          : ScoringAxisType.RISK;

    const axis = await tx.scoringAxis.create({
      data: {
        modelId: model.id,
        axisName: axisDef.axisName,
        axisType,
        displayOrder: globalConfig.axes.indexOf(axisDef),
      },
    });

    for (let index = 0; index < axisDef.drivers.length; index++) {
      const driver = axisDef.drivers[index]!;
      const created = await tx.scoringDriver.create({
        data: {
          axisId: axis.id,
          driverName: driver.driverName,
          weight: driver.weight,
          displayOrder: index,
        },
      });
      driverIdByKey.set(`${axisDef.axisType}-${index}`, created.id);
    }
  }

  for (let index = 0; index < globalConfig.riskTiers.length; index++) {
    const tier = globalConfig.riskTiers[index]!;
    await tx.riskTierConfig.create({
      data: {
        modelId: model.id,
        tierCode: tier.tierCode,
        tierName: tier.tierName,
        upperBound: tier.upperBound,
        multiplier: tier.multiplier,
        controlsInherited: tier.controlsInherited,
        displayOrder: index,
      },
    });
  }

  for (let index = 0; index < globalConfig.feasibilityDimensions.length; index++) {
    const dim = globalConfig.feasibilityDimensions[index]!;
    const dimension = await tx.feasibilityDimension.create({
      data: {
        modelId: model.id,
        dimensionCode: dim.dimensionCode,
        dimensionName: dim.dimensionName,
        weight: dim.weight,
        displayOrder: index,
      },
    });

    const questions = dim.questions.map((questionText, qIndex) => ({
      dimensionId: dimension.id,
      questionText,
      displayOrder: qIndex,
    }));
    if (questions.length) {
      await tx.feasibilityQuestion.createMany({ data: questions });
    }
  }

  const valueDrivers = buildDriverSnapshots("VALUE", driverIdByKey);
  const feasibilityDrivers = buildDriverSnapshots("FEASIBILITY", driverIdByKey);
  const riskDrivers = buildDriverSnapshots("RISK", driverIdByKey);

  await tx.scoringModelVersion.create({
    data: {
      modelId: model.id,
      tenantId,
      versionNumber: 1,
      status: ScoringModelVersionStatus.ACTIVE,
      effectiveDate: new Date(),
      valueDriversJson: valueDrivers as unknown as Prisma.InputJsonValue,
      feasibilityDriversJson:
        feasibilityDrivers as unknown as Prisma.InputJsonValue,
      riskDriversJson: riskDrivers as unknown as Prisma.InputJsonValue,
      valueWeightInPriority: globalConfig.valueWeightInPriority,
      feasibilityWeightInPriority: globalConfig.feasibilityWeightInPriority,
      riskTierConfigJson:
        globalConfig.riskTiers as unknown as Prisma.InputJsonValue,
      changeSummary: "Initial version",
      createdById,
    },
  });

  return { model, valueDrivers, feasibilityDrivers, riskDrivers };
}

function buildDriverSnapshots(
  axisType: "VALUE" | "FEASIBILITY" | "RISK",
  driverIdByKey: Map<string, string>,
): ScoringDriverSnapshot[] {
  const globalConfig = getGlobalConfig();
  const axis = globalConfig.axes.find((a) => a.axisType === axisType);
  if (!axis) return [];

  return axis.drivers.map((driver, index) => ({
    driverId: driverIdByKey.get(`${axisType}-${index}`) ?? `${axisType}-${index}`,
    driverName: driver.driverName,
    weight: driver.weight,
    axisType,
  }));
}

export async function getOrCreateDefaultScoringModel(
  db: PrismaClient,
  tenantId: string,
  createdById?: string,
) {
  const existing = await db.scoringModel.findFirst({
    where: { tenantId, isDefault: true, isActive: true },
    include: {
      axes: {
        include: { drivers: { orderBy: { displayOrder: "asc" } } },
        orderBy: { displayOrder: "asc" },
      },
      riskTiers: { orderBy: { displayOrder: "asc" } },
      versions: {
        where: { status: ScoringModelVersionStatus.ACTIVE },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (existing) return existing;

  await createScoringModelForTenant(db, tenantId, createdById);

  return db.scoringModel.findFirstOrThrow({
    where: { tenantId, isDefault: true, isActive: true },
    include: {
      axes: {
        include: { drivers: { orderBy: { displayOrder: "asc" } } },
        orderBy: { displayOrder: "asc" },
      },
      riskTiers: { orderBy: { displayOrder: "asc" } },
      versions: {
        where: { status: ScoringModelVersionStatus.ACTIVE },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
}

export function snapshotsFromModel(model: {
  axes: Array<{
    axisType: ScoringAxisType;
    drivers: Array<{ id: string; driverName: string; weight: number }>;
  }>;
  valueWeightInPriority: number;
  feasibilityWeightInPriority: number;
  riskTiers: Array<{
    tierCode: string;
    tierName: string;
    upperBound: number;
    multiplier: number;
    controlsInherited: string | null;
  }>;
}) {
  const valueDrivers: ScoringDriverSnapshot[] = [];
  const feasibilityDrivers: ScoringDriverSnapshot[] = [];
  const riskDrivers: ScoringDriverSnapshot[] = [];

  for (const axis of model.axes) {
    for (const driver of axis.drivers) {
      const snapshot: ScoringDriverSnapshot = {
        driverId: driver.id,
        driverName: driver.driverName,
        weight: driver.weight,
        axisType:
          axis.axisType === ScoringAxisType.VALUE
            ? "VALUE"
            : axis.axisType === ScoringAxisType.FEASIBILITY
              ? "FEASIBILITY"
              : "RISK",
      };
      if (axis.axisType === ScoringAxisType.VALUE) valueDrivers.push(snapshot);
      else if (axis.axisType === ScoringAxisType.FEASIBILITY)
        feasibilityDrivers.push(snapshot);
      else riskDrivers.push(snapshot);
    }
  }

  return {
    valueDrivers,
    feasibilityDrivers,
    riskDrivers,
    valueWeightInPriority: model.valueWeightInPriority,
    feasibilityWeightInPriority: model.feasibilityWeightInPriority,
    riskTierConfig: model.riskTiers.map((t) => ({
      tierCode: t.tierCode,
      tierName: t.tierName,
      upperBound: t.upperBound,
      multiplier: t.multiplier,
      controlsInherited: t.controlsInherited ?? undefined,
    })),
  };
}

export function versionToWeightSnapshot(version: {
  valueDriversJson: unknown;
  feasibilityDriversJson: unknown;
  riskDriversJson: unknown;
  valueWeightInPriority: number;
  feasibilityWeightInPriority: number;
  riskTierConfigJson: unknown;
}) {
  return {
    valueDrivers: (version.valueDriversJson ?? []) as ScoringDriverSnapshot[],
    feasibilityDrivers: (version.feasibilityDriversJson ??
      []) as ScoringDriverSnapshot[],
    riskDrivers: (version.riskDriversJson ?? []) as ScoringDriverSnapshot[],
    valueWeightInPriority: version.valueWeightInPriority,
    feasibilityWeightInPriority: version.feasibilityWeightInPriority,
    riskTierConfig: (version.riskTierConfigJson ??
      DEFAULT_RISK_TIERS) as typeof DEFAULT_RISK_TIERS,
  };
}
