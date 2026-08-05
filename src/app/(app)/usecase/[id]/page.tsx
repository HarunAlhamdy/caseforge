import { AppPage } from "@/components/layout/AppPage";
import { UseCaseDetailView } from "@/components/usecase/UseCaseDetailView";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppPage
      title="Use Case Master"
      description="Unified detail view with tabs across all lifecycle stages."
    >
      <UseCaseDetailView useCaseId={params.id} />
    </AppPage>
  );
}
