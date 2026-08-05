import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { cookies } from "next/headers";
import { AccessResolver } from "@/server/services/access-resolver";
import { createTenantScopedClient } from "@/server/db/middleware";
import type { AccessContext } from "@/lib/types";
import type { PrismaClient } from "@prisma/client";

export const ACTIVE_TENANT_COOKIE = "cf-active-tenant";

function parseActiveTenantCookie(value: string | undefined): string | null {
  if (!value || value === "cross") {
    return null;
  }
  return value;
}

export async function createContext() {
  const session = await auth();
  const cookieStore = await cookies();
  const rawActiveTenant = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const activeTenantId = parseActiveTenantCookie(rawActiveTenant);

  let access: AccessContext | null = null;
  let scopedDb: PrismaClient = prisma;

  if (session?.user?.id) {
    const resolver = new AccessResolver(prisma);
    const requestedTenantId =
      activeTenantId !== undefined ? activeTenantId : session.user.tenantId;

    access = await resolver.resolve(session, requestedTenantId);

    scopedDb = createTenantScopedClient(prisma, {
      tenantId: access.tenantId,
      role: access.effectiveRole,
      accessibleTenantIds: access.accessibleTenantIds,
    });
  }

  return {
    session,
    db: prisma,
    scopedDb,
    access,
    activeTenantId: access?.tenantId ?? activeTenantId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
