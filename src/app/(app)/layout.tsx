import { getDefaultTenantTheme } from "@/lib/utils/tenant-theme";
import { getTenantTheme } from "@/server/services/tenant-service";
import { auth } from "@/server/auth/config";
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
  if (!session?.user) {
    redirect("/login");
  }

  const theme = session.user.tenantId
    ? await getTenantTheme(session.user.tenantId)
    : getDefaultTenantTheme();

  return (
    <TenantBrand theme={theme}>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <BreadcrumbBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TenantBrand>
  );
}
