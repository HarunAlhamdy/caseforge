import { prisma } from "@/server/db/client";
import type { TenantThemeConfig } from "@/lib/types";
import { getDefaultTenantTheme } from "@/lib/utils/tenant-theme";

export async function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}

export async function getTenantTheme(
  tenantId: string | null | undefined,
): Promise<TenantThemeConfig> {
  if (!tenantId) return getDefaultTenantTheme();

  const tenant = await getTenantById(tenantId);
  if (!tenant) return getDefaultTenantTheme();

  const defaults = getDefaultTenantTheme();
  return {
    primaryColor: tenant.primaryColor ?? defaults.primaryColor,
    accentColor: tenant.accentColor ?? defaults.accentColor,
    logoUrl: tenant.logoUrl,
    fontFamily: tenant.fontFamily ?? defaults.fontFamily,
  };
}

export async function listActiveTenants() {
  return prisma.tenant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
