import { AppPage } from "@/components/layout/AppPage";
import { ArchitectureWorkspace } from "@/components/architecture/ArchitectureWorkspace";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Solution Architecture"
      description="Stage 4 — AI solution design, patterns, and technical blueprint."
    >
      <ArchitectureWorkspace useCaseId={params.id} />
    </AppPage>
  );
}
