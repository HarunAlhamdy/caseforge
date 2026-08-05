import { AppPage } from "@/components/layout/AppPage";
import { PilotTracker } from "@/components/delivery/DeliveryOperationsPanels";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Pilot Delivery"
      description="Stage 6 — manage pilot execution and success metrics."
    >
      <PilotTracker useCaseId={params.id} />
    </AppPage>
  );
}
