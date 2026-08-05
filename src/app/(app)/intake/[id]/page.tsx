"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import { AppPage } from "@/components/layout/AppPage";
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = trpc.usecase.get.useQuery({ id: params.id });

  if (isLoading) {
    return (
      <AppPage title="Intake Detail" description="Loading…" />
    );
  }

  if (!data) {
    return (
      <AppPage title="Intake Detail" description="Use case not found." />
    );
  }

  const editable =
    data.currentStage === "INTAKE_DRAFT" || data.currentStage === "INFO_REQUEST";

  return (
    <AppPage
      title={data.title}
      description={`${data.useCaseNumber} · ${data.currentStage.replace(/_/g, " ")}`}
    >
      {data.currentStage === "INFO_REQUEST" ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Additional information was requested. Update the intake and resubmit from the review page.
          {data.gateRationale ? (
            <p className="mt-2 whitespace-pre-wrap">{data.gateRationale}</p>
          ) : null}
        </div>
      ) : null}
      <IntakeWizard
        useCaseId={data.id}
        intakeConfig={data.intakeConfig}
        initialValues={data.intakeValues}
        readOnly={!editable}
      />
      {editable ? (
        <div className="mt-4">
          <Link href={`/intake/${data.id}/review`}>
            <Button>Review & Submit</Button>
          </Link>
        </div>
      ) : null}
    </AppPage>
  );
}
