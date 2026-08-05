import { AppPage } from "@/components/layout/AppPage";
import { ScorecardPanel } from "@/components/evaluation/CriteriaScorecardPanels";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Decision Scorecard"
      description="Stage 5 — composite verdict and sponsor approval."
    >
      <ScorecardPanel useCaseId={params.id} />
    </AppPage>
  );
}
