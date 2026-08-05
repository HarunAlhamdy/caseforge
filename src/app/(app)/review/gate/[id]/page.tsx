"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import { AppPage } from "@/components/layout/AppPage";
import { GateDecisionPanel } from "@/components/intake/GateDecisionPanel";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = trpc.usecase.get.useQuery({ id: params.id });

  if (isLoading) {
    return <AppPage title="Gating Review" description="Loading…" />;
  }

  if (!data) {
    return <AppPage title="Gating Review" description="Use case not found." />;
  }

  return (
    <AppPage
      title="Gating Review"
      description={`${data.useCaseNumber} — ${data.title}`}
    >
      <GateDecisionPanel
        useCaseId={data.id}
        values={data.intakeValues}
        config={data.intakeConfig}
      />
    </AppPage>
  );
}
