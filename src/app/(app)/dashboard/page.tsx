import { AppPage } from "@/components/layout/AppPage";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AppPage
      title="Dashboard"
      description="Overview of active use cases, pipeline health, and stage distribution across your portfolio."
    >
      <DashboardWidgets />
    </AppPage>
  );
}
