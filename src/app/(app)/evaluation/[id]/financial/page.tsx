import { AppPage } from "@/components/layout/AppPage";
import { FinancialPanel } from "@/components/evaluation/FinancialPanel";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Financial Model"
      description="Stage 5 — ROI, payback, and NPV analysis."
    >
      <FinancialPanel useCaseId={params.id} />
    </AppPage>
  );
}
