import { AppPage } from "@/components/layout/AppPage";
import { ScoringForm } from "@/components/scoring/ScoringForm";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Use Case Scoring"
      description="Stage 3B — score an individual use case across value, feasibility, and risk axes."
    >
      <ScoringForm useCaseId={params.id} />
    </AppPage>
  );
}
