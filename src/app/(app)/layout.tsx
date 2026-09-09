import { getDefaultTenantTheme } from "@/lib/utils/tenant-theme";
import { getTenantTheme } from "@/server/services/tenant-service";
import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { TenantBrand } from "@/components/layout/TenantBrand";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, tenantId: true, role: true },
  });
  if (!dbUser?.isActive) {
    redirect("/login?disabled=1");
  }

  const tenantId = dbUser.tenantId ?? session.user.tenantId;
  const theme = tenantId
    ? await getTenantTheme(tenantId)
    : getDefaultTenantTheme();

  return (
    <TenantBrand theme={theme}>
      <div className="flex h-screen overflow-hidden bg-[#f3f1ee]">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <BreadcrumbBar />
          <main className="relative z-0 flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TenantBrand>
  );
}
