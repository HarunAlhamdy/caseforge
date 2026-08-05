import { AppPage } from "@/components/layout/AppPage";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default function Page() {
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
