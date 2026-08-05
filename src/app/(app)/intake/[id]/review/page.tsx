"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import { AppPage } from "@/components/layout/AppPage";
import { IntakeReviewPanel } from "@/components/intake/IntakeReviewPanel";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = trpc.usecase.get.useQuery({ id: params.id });

  if (isLoading) {
    return <AppPage title="Review Intake" description="Loading…" />;
  }

  if (!data) {
    return <AppPage title="Review Intake" description="Use case not found." />;
  }

  return (
    <AppPage
      title="Review before submit"
      description={`${data.useCaseNumber} — confirm completeness and submit for triage.`}
    >
      <IntakeReviewPanel
        useCaseId={data.id}
        values={data.intakeValues}
        config={data.intakeConfig}
        mandatoryComplete={data.mandatoryComplete}
      />
    </AppPage>
  );
}
