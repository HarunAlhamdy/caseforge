import type { PrismaClient } from "@prisma/client";
import { getStageLabel } from "@/lib/workflow/stage-transitions";
import type { LifecycleStage } from "@/lib/types";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>;
}

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private from: string;

  constructor(
    apiKey = process.env.RESEND_API_KEY ?? "",
    from = process.env.EMAIL_FROM ?? "CaseForge <noreply@caseforge.web.app>",
  ) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    if (!this.apiKey) {
      console.info("[notification stub]", message.subject, message.to);
      return { id: `stub-${Date.now()}` };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(this.apiKey);
    const result = await resend.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    return { id: result.data?.id ?? "unknown" };
  }
}

export function createNotificationService(): EmailProvider {
  return new ResendEmailProvider();
}

export async function createInAppNotification(
  scopedDb: PrismaClient,
  data: {
    tenantId: string | null;
    userId: string;
    title: string;
    message: string;
    link?: string;
  },
): Promise<void> {
  await scopedDb.notification.create({ data });
}

export async function notifyUsers(
  scopedDb: PrismaClient,
  params: {
    tenantId: string | null;
    userIds: string[];
    title: string;
    message: string;
    link?: string;
    emailSubject?: string;
    emailHtml?: string;
  },
): Promise<void> {
  const uniqueIds = Array.from(new Set(params.userIds));
  for (const userId of uniqueIds) {
    await createInAppNotification(scopedDb, {
      tenantId: params.tenantId,
      userId,
      title: params.title,
      message: params.message,
      link: params.link,
    });
  }

  if (params.emailSubject && params.emailHtml) {
    const users = await scopedDb.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { email: true },
    });
    const email = createNotificationService();
    for (const user of users) {
      if (user.email) {
        await email.send({
          to: user.email,
          subject: params.emailSubject,
          html: params.emailHtml,
        });
      }
    }
  }
}

export async function notifyStageTransition(
  scopedDb: PrismaClient,
  params: {
    tenantId: string;
    userIds: string[];
    useCaseTitle: string;
    useCaseId: string;
    fromStage: LifecycleStage;
    toStage: LifecycleStage;
    userEmail?: string;
  },
): Promise<void> {
  const fromLabel = getStageLabel(params.fromStage);
  const toLabel = getStageLabel(params.toStage);
  const link = `/usecase/${params.useCaseId}`;

  await notifyUsers(scopedDb, {
    tenantId: params.tenantId,
    userIds: params.userIds,
    title: "Stage transition",
    message: `${params.useCaseTitle} moved from ${fromLabel} to ${toLabel}.`,
    link,
    emailSubject: `${params.useCaseTitle} → ${toLabel}`,
    emailHtml: `<p><strong>${params.useCaseTitle}</strong> transitioned from <em>${fromLabel}</em> to <em>${toLabel}</em>.</p><p><a href="${link}">View use case</a></p>`,
  });
}

export async function notifyWeightChange(
  scopedDb: PrismaClient,
  params: {
    tenantId: string;
    userIds: string[];
    modelName: string;
    versionNumber: number;
  },
): Promise<void> {
  await notifyUsers(scopedDb, {
    tenantId: params.tenantId,
    userIds: params.userIds,
    title: "Scoring weights updated",
    message: `${params.modelName} version ${params.versionNumber} is now active.`,
    link: "/scoring/portfolio",
    emailSubject: `Scoring model updated: ${params.modelName}`,
    emailHtml: `<p>Scoring model <strong>${params.modelName}</strong> version <strong>v${params.versionNumber}</strong> is now active.</p>`,
  });
}

export async function notifyConsultantAssignment(
  scopedDb: PrismaClient,
  params: {
    tenantId: string;
    consultantUserId: string;
    customerName: string;
    roleInTenant: string;
  },
): Promise<void> {
  await notifyUsers(scopedDb, {
    tenantId: params.tenantId,
    userIds: [params.consultantUserId],
    title: "Customer assignment",
    message: `You were assigned to ${params.customerName} as ${params.roleInTenant.replace(/_/g, " ").toLowerCase()}.`,
    link: "/partner/dashboard",
    emailSubject: `Assigned to ${params.customerName}`,
    emailHtml: `<p>You have been assigned to <strong>${params.customerName}</strong>.</p>`,
  });
}

export async function notifyPartnerBroadcast(
  scopedDb: PrismaClient,
  params: {
    partnerId: string;
    title: string;
    message: string;
    link?: string;
  },
): Promise<void> {
  const partnerUsers = await scopedDb.partnerUser.findMany({
    where: { partnerId: params.partnerId, isActive: true },
    select: { userId: true },
  });

  await notifyUsers(scopedDb, {
    tenantId: null,
    userIds: partnerUsers.map((p) => p.userId),
    title: params.title,
    message: params.message,
    link: params.link,
  });
}

export async function sendStageTransitionEmail(
  to: string,
  useCaseTitle: string,
  stage: string,
): Promise<void> {
  const service = createNotificationService();
  await service.send({
    to,
    subject: `Use case moved to ${stage}`,
    html: `<p><strong>${useCaseTitle}</strong> has transitioned to <strong>${stage}</strong>.</p>`,
  });
}
