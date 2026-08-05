import type { SessionUser } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    role?: SessionUser["role"];
    tenantId?: string | null;
    partnerId?: string | null;
    partnerRole?: SessionUser["partnerRole"];
    accessibleTenantIds?: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: SessionUser["role"];
    tenantId?: string | null;
    partnerId?: string | null;
    partnerRole?: SessionUser["partnerRole"];
    accessibleTenantIds?: string[];
  }
}
