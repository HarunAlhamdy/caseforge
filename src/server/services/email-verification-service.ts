import { createHash, randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { createNotificationService } from "@/server/services/notification-service";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function appBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function issueEmailVerification(
  db: PrismaClient,
  userId: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateVerificationToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: hashVerificationToken(rawToken),
      emailVerificationExpiresAt: expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function sendVerificationEmail(params: {
  email: string;
  name: string;
  rawToken: string;
}): Promise<void> {
  const verifyUrl = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(params.rawToken)}`;
  const email = createNotificationService();

  await email.send({
    to: params.email,
    subject: "Verify your CaseForge email",
    html: `
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>Confirm your email address to activate your CaseForge account.</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>This link expires in 24 hours. If you did not create an account, you can ignore this message.</p>
      <p style="color:#64748b;font-size:12px;">Or paste this URL:<br/>${verifyUrl}</p>
    `,
  });
}

export async function sendVerificationForUser(
  db: PrismaClient,
  userId: string,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }
  if (user.emailVerifiedAt) {
    throw new Error("Email is already verified");
  }

  const { rawToken } = await issueEmailVerification(db, user.id);
  await sendVerificationEmail({
    email: user.email,
    name: user.name,
    rawToken,
  });
}

export async function verifyEmailToken(
  db: PrismaClient,
  rawToken: string,
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  if (!rawToken.trim()) {
    return { ok: false, reason: "Missing verification token" };
  }

  const hashed = hashVerificationToken(rawToken);
  const user = await db.user.findFirst({
    where: { emailVerificationToken: hashed },
  });

  if (!user) {
    return { ok: false, reason: "Invalid or already used verification link" };
  }

  if (
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt.getTime() < Date.now()
  ) {
    return { ok: false, reason: "Verification link has expired" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return { ok: true, email: user.email };
}

export async function markEmailVerified(
  db: PrismaClient,
  userId: string,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
