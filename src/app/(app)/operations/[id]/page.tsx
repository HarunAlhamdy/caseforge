import { AppPage } from "@/components/layout/AppPage";
import { OperationsDetail } from "@/components/delivery/DeliveryOperationsPanels";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Operations Metrics"
      description="Stage 7 — metrics history and revalidation."
    >
      <OperationsDetail useCaseId={params.id} />
    </AppPage>
  );
}
