import { SecurityRole } from "@/lib/constants/enums";
import { requireAdminRoles } from "@/lib/auth/require-admin";
import { AppPage } from "@/components/layout/AppPage";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default async function Page() {
  await requireAdminRoles([
    SecurityRole.PLATFORM_SUPER_ADMIN,
    SecurityRole.PARTNER_ADMIN,
    SecurityRole.CUSTOMER_ADMIN,
  ]);

  return (
    <AppPage
      title="Audit Log"
      description="View create, update, and delete activity for your tenant."
    >
      <div className="mt-6">
        <AuditLogViewer />
      </div>
    </AppPage>
  );
}
