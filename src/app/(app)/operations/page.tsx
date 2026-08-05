import { AppPage } from "@/components/layout/AppPage";
import { OperationsDashboard } from "@/components/delivery/DeliveryOperationsPanels";

export default function Page() {
  return (
    <AppPage
      title="Operations"
      description="Stage 7 — production operations dashboard."
    >
      <OperationsDashboard />
    </AppPage>
  );
}
