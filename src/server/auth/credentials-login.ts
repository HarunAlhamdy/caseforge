import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import {
  PartnerRole as PartnerRoleEnum,
  SecurityRole,
} from "@/lib/constants/enums";
import type { SessionUser } from "@/lib/types";

/** Must match Auth.js `cookies.sessionToken.name` (Firebase Hosting allowlist). */
export const SESSION_COOKIE_NAME = "__session";

export type AuthFailureCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_DISABLED";

export type AuthenticateResult =
  | { ok: true; user: SessionUser }
  | { ok: false; code: AuthFailureCode; email?: string };

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadPartnerContext(userId: string) {
  const partnerUser = await prisma.partnerUser.findUnique({
    where: { userId },
    include: {
      customerAssignments: {
        where: { isActive: true },
      },
      partner: {
        include: {
          tenants: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!partnerUser?.isActive) {
    return {
      partnerId: null as string | null,
      partnerRole: null as SessionUser["partnerRole"],
      accessibleTenantIds: [] as string[],
    };
  }

  const accessibleTenantIds =
    partnerUser.partnerRole === PartnerRoleEnum.PARTNER_ADMIN
      ? partnerUser.partner.tenants.map((t) => t.id)
      : Array.from(
          new Set(partnerUser.customerAssignments.map((a) => a.tenantId)),
        );

  return {
    partnerId: partnerUser.partnerId,
    partnerRole: partnerUser.partnerRole,
    accessibleTenantIds,
  };
}

export async function authenticateCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthenticateResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user?.passwordHash) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  if (!user.isActive) {
    return { ok: false, code: "ACCOUNT_DISABLED", email: user.email };
  }

  if (!user.emailVerifiedAt) {
    return { ok: false, code: "EMAIL_NOT_VERIFIED", email: user.email };
  }

  const valid = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!valid) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const partnerContext = await loadPartnerContext(user.id);
  const accessibleTenantIds =
    partnerContext.partnerId && partnerContext.accessibleTenantIds.length > 0
      ? partnerContext.accessibleTenantIds
      : user.tenantId
        ? [user.tenantId]
        : [];

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      tenantId: user.tenantId,
      partnerId: partnerContext.partnerId,
      partnerRole: partnerContext.partnerRole,
      accessibleTenantIds,
    },
  };
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      userId: user.id,
      role: user.role ?? SecurityRole.VIEWER,
      tenantId: user.tenantId ?? null,
      partnerId: user.partnerId ?? null,
      partnerRole: user.partnerRole ?? null,
      accessibleTenantIds: user.accessibleTenantIds ?? [],
    },
    secret,
    salt: SESSION_COOKIE_NAME,
    maxAge: SESSION_MAX_AGE,
  });
}

export function sessionCookieHeader(token: string): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  return parts.join("; ");
}
