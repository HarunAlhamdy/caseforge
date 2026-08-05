import { AppPage } from "@/components/layout/AppPage";
import { ScaleUpPanel } from "@/components/delivery/DeliveryOperationsPanels";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Scale Up"
      description="Stage 6 — production readiness and deployment."
    >
      <ScaleUpPanel useCaseId={params.id} />
    </AppPage>
  );
}
