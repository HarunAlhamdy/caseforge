import { AppPage } from "@/components/layout/AppPage";
import { GatesPanel } from "@/components/evaluation/GatesPanel";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Hard Gates"
      description="Stage 5 — G1–G8 pass/fail gates."
    >
      <GatesPanel useCaseId={params.id} />
    </AppPage>
  );
}
