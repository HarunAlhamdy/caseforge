import { AppPage } from "@/components/layout/AppPage";
import { EvaluationAssessment } from "@/components/evaluation/EvaluationAssessment";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Evaluation"
      description="Stage 5 — formal assessment of feasibility, risk, and readiness."
    >
      <EvaluationAssessment useCaseId={params.id} />
    </AppPage>
  );
}
