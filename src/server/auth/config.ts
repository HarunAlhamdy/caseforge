import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import {
  PartnerRole as PartnerRoleEnum,
  SecurityRole,
} from "@/lib/constants/enums";
import type { SessionUser } from "@/lib/types";

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
          new Set(
            partnerUser.customerAssignments.map((a) => a.tenantId),
          ),
        );

  return {
    partnerId: partnerUser.partnerId,
    partnerRole: partnerUser.partnerRole,
    accessibleTenantIds,
  };
}

const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user?.passwordHash || !user.isActive) {
      return null;
    }

    const valid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );
    if (!valid) {
      return null;
    }

    const partnerContext = await loadPartnerContext(user.id);
    const accessibleTenantIds =
      partnerContext.partnerId && partnerContext.accessibleTenantIds.length > 0
        ? partnerContext.accessibleTenantIds
        : user.tenantId
          ? [user.tenantId]
          : [];

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      tenantId: user.tenantId,
      partnerId: partnerContext.partnerId,
      partnerRole: partnerContext.partnerRole,
      accessibleTenantIds,
    };
  },
});

function buildOidcProvider(): NextAuthConfig["providers"][number] | null {
  const issuer = process.env.AUTH_OIDC_ISSUER;
  const clientId = process.env.AUTH_OIDC_CLIENT_ID;
  const clientSecret = process.env.AUTH_OIDC_CLIENT_SECRET;

  if (!issuer || !clientId || !clientSecret) {
    return null;
  }

  return {
    id: "oidc",
    name: process.env.AUTH_OIDC_NAME ?? "Enterprise SSO",
    type: "oidc",
    issuer,
    clientId,
    clientSecret,
    authorization: { params: { scope: "openid email profile" } },
  };
}

function buildProviders(): NextAuthConfig["providers"] {
  const list: NextAuthConfig["providers"] = [credentialsProvider];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    list.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  const oidc = buildOidcProvider();
  if (oidc) {
    list.push(oidc);
  }

  return list;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role ?? SecurityRole.VIEWER;
        token.tenantId = user.tenantId ?? null;
        token.partnerId = user.partnerId ?? null;
        token.partnerRole = user.partnerRole ?? null;
        token.accessibleTenantIds = user.accessibleTenantIds ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.userId as string | undefined) ?? token.sub ?? "";
        session.user.role =
          (token.role as SessionUser["role"] | undefined) ??
          SecurityRole.VIEWER;
        session.user.tenantId =
          (token.tenantId as string | null | undefined) ?? null;
        session.user.partnerId =
          (token.partnerId as string | null | undefined) ?? null;
        session.user.partnerRole =
          (token.partnerRole as SessionUser["partnerRole"] | undefined) ??
          null;
        session.user.accessibleTenantIds =
          (token.accessibleTenantIds as string[] | undefined) ?? [];
      }
      return session;
    },
  },
});
