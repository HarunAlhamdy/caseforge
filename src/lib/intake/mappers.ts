import type { UseCase } from "@prisma/client";
import type { IntakeFormValues } from "@/lib/intake/schema";

/** Map UseCase DB record to intake form values. */
export function mapUseCaseToIntakeValues(useCase: UseCase): IntakeFormValues {
  const encryptionReqs = Array.isArray(useCase.encryptionReqs)
    ? (useCase.encryptionReqs as string[])
    : undefined;
  const accessChannels = Array.isArray(useCase.accessChannels)
    ? (useCase.accessChannels as string[])
    : undefined;
  const businessDomains = Array.isArray(useCase.businessDomains)
    ? (useCase.businessDomains as string[])
    : undefined;

  return {
    title: useCase.title,
    businessUnit: useCase.businessUnit,
    executiveSponsorName: useCase.executiveSponsorName ?? undefined,
    executiveSponsorTitle: useCase.executiveSponsorTitle ?? undefined,
    problemStatement: useCase.problemStatement ?? undefined,
    proposedSolution: useCase.proposedSolution ?? undefined,
    expectedBenefits: useCase.expectedBenefits ?? undefined,
    aiPattern: useCase.aiPattern,
    autonomyLevel: useCase.autonomyLevel,
    currentProcessDescription: useCase.currentProcessDescription ?? undefined,
    currentFtes: useCase.currentFtes,
    currentVolume: useCase.currentVolume ?? undefined,
    currentCycleTime: useCase.currentCycleTime ?? undefined,
    currentErrorRate: useCase.currentErrorRate,
    annualCost: useCase.annualCost,
    knownPainPoints: useCase.knownPainPoints ?? undefined,
    sourceSystemsText: useCase.sourceSystemsText ?? undefined,
    readSystems: useCase.readSystems ?? undefined,
    writeSystems: useCase.writeSystems ?? undefined,
    ingestionMethod: useCase.ingestionMethod ?? undefined,
    ingestionFrequency: useCase.ingestionFrequency ?? undefined,
    dataVolume: useCase.dataVolume ?? undefined,
    historicalRequired: useCase.historicalRequired,
    historicalLookback: useCase.historicalLookback ?? undefined,
    dqIssues: useCase.dqIssues ?? undefined,
    remediationNeeded: useCase.remediationNeeded,
    remediationPlan: useCase.remediationPlan ?? undefined,
    dqOwnership: useCase.dqOwnership ?? undefined,
    businessDomains,
    masterRefData: useCase.masterRefData ?? undefined,
    modelRelationship: useCase.modelRelationship ?? undefined,
    auditabilityRequired: useCase.auditabilityRequired,
    auditabilityDetail: useCase.auditabilityDetail ?? undefined,
    policyReviewRequired: useCase.policyReviewRequired,
    policyReviewBody: useCase.policyReviewBody ?? undefined,
    ndaStatus: useCase.ndaStatus,
    dataOwner: useCase.dataOwner ?? undefined,
    dataSteward: useCase.dataSteward ?? undefined,
    retentionPolicy: useCase.retentionPolicy ?? undefined,
    regulatoryConsiderations: useCase.regulatoryConsiderations ?? undefined,
    dataClassification: useCase.dataClassification,
    accessControlReqs: useCase.accessControlReqs ?? undefined,
    piiCuiPresent: useCase.piiCuiPresent,
    piiCuiDetail: useCase.piiCuiDetail ?? undefined,
    encryptionReqs,
    govtModelAccess: useCase.govtModelAccess,
    securityReviewStatus: useCase.securityReviewStatus,
    reportingReqs: useCase.reportingReqs ?? undefined,
    endUserPersonas: useCase.endUserPersonas ?? undefined,
    conversationalAiRequired: useCase.conversationalAiRequired,
    conversationalAiDetail: useCase.conversationalAiDetail ?? undefined,
    accessChannels,
    downstreamConsumption: useCase.downstreamConsumption ?? undefined,
    submitterPriority: useCase.submitterPriority ?? undefined,
    submitterComplexity: useCase.submitterComplexity ?? undefined,
    estimatedTimeline: useCase.estimatedTimeline ?? undefined,
    dependenciesRisks: useCase.dependenciesRisks ?? undefined,
  };
}

/** Map intake form values to Prisma UseCase update payload. */
export function intakeValuesToUseCaseData(
  values: Partial<IntakeFormValues>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  const directMap: (keyof IntakeFormValues)[] = [
    "title",
    "businessUnit",
    "executiveSponsorName",
    "executiveSponsorTitle",
    "problemStatement",
    "proposedSolution",
    "expectedBenefits",
    "aiPattern",
    "autonomyLevel",
    "currentProcessDescription",
    "currentFtes",
    "currentVolume",
    "currentCycleTime",
    "currentErrorRate",
    "annualCost",
    "knownPainPoints",
    "sourceSystemsText",
    "readSystems",
    "writeSystems",
    "ingestionMethod",
    "ingestionFrequency",
    "dataVolume",
    "historicalRequired",
    "historicalLookback",
    "dqIssues",
    "remediationNeeded",
    "remediationPlan",
    "dqOwnership",
    "masterRefData",
    "modelRelationship",
    "auditabilityRequired",
    "auditabilityDetail",
    "policyReviewRequired",
    "policyReviewBody",
    "ndaStatus",
    "dataOwner",
    "dataSteward",
    "retentionPolicy",
    "regulatoryConsiderations",
    "dataClassification",
    "accessControlReqs",
    "piiCuiPresent",
    "piiCuiDetail",
    "govtModelAccess",
    "securityReviewStatus",
    "reportingReqs",
    "endUserPersonas",
    "conversationalAiRequired",
    "conversationalAiDetail",
    "downstreamConsumption",
    "submitterPriority",
    "submitterComplexity",
    "estimatedTimeline",
    "dependenciesRisks",
  ];

  for (const key of directMap) {
    if (values[key] !== undefined) {
      // Don't persist empty title/unit over create fallbacks via partial updates
      if (
        (key === "title" || key === "businessUnit") &&
        typeof values[key] === "string" &&
        !(values[key] as string).trim()
      ) {
        continue;
      }
      data[key] = values[key];
    }
  }

  if (values.businessDomains !== undefined) {
    data.businessDomains = values.businessDomains;
  }
  if (values.encryptionReqs !== undefined) {
    data.encryptionReqs = values.encryptionReqs;
  }
  if (values.accessChannels !== undefined) {
    data.accessChannels = values.accessChannels;
  }

  return data;
}

export function actionItemFromIntake(values: Partial<IntakeFormValues>) {
  if (!values.recommendedAction && !values.nextStepsOwner && !values.followUpDate) {
    return null;
  }
  return {
    recommendedAction: values.recommendedAction,
    owner: values.nextStepsOwner,
    followUpDate: values.followUpDate
      ? new Date(values.followUpDate)
      : undefined,
    status: "OPEN",
  };
}
