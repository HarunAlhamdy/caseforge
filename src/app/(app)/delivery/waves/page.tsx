import { AppPage } from "@/components/layout/AppPage";
import { WavePlanningBoard } from "@/components/delivery/WavePlanningBoard";

export default function Page() {
  return (
    <AppPage
      title="Wave Planning"
      description="Stage 6 — plan delivery waves and resource allocation."
    >
      <WavePlanningBoard />
    </AppPage>
  );
}
