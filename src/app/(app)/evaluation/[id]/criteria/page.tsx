import { AppPage } from "@/components/layout/AppPage";
import { CriteriaPanel } from "@/components/evaluation/CriteriaScorecardPanels";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Success Criteria"
      description="Stage 5 — quantitative metrics and pilot guardrails."
    >
      <CriteriaPanel useCaseId={params.id} />
    </AppPage>
  );
}
