"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IntakeReadOnlySummary } from "./IntakeReadOnlySummary";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeFormConfig } from "@/lib/types";

interface IntakeReviewPanelProps {
  useCaseId: string;
  values: IntakeFormValues;
  config?: IntakeFormConfig | null;
  mandatoryComplete: boolean;
}

export function IntakeReviewPanel({
  useCaseId,
  values,
  config,
  mandatoryComplete,
}: IntakeReviewPanelProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const completeness = trpc.ai.completenessCheck.useQuery({ useCaseId });
  const submitMutation = trpc.usecase.submit.useMutation({
    onSuccess: () => router.push("/intake"),
  });

  const warnings = completeness.data?.warnings ?? [];

  return (
    <div className="space-y-6">
      <IntakeReadOnlySummary values={values} config={config} />

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">AI completeness check</h2>
        {completeness.isLoading ? (
          <p className="mt-2 text-sm text-slate-500">Analyzing intake…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {warnings.length === 0 ? (
              <li className="text-sm text-emerald-700">No issues detected.</li>
            ) : (
              warnings.map((warning, index) => (
                <li
                  key={`${warning.section}-${index}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <Badge
                    variant={
                      warning.severity === "error"
                        ? "danger"
                        : warning.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {warning.severity}
                  </Badge>
                  <span>{warning.message}</span>
                </li>
              ))
            )}
          </ul>
        )}
        {completeness.data?.suggestedClassification ? (
          <p className="mt-3 text-sm text-slate-600">
            Suggested classification:{" "}
            <strong>{completeness.data.suggestedClassification}</strong>
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          I acknowledge the completeness review and submit for triage
        </label>
        <Button variant="secondary" onClick={() => router.push(`/intake/${useCaseId}`)}>
          Go Back to Fix
        </Button>
        <Button
          disabled={!mandatoryComplete || !acknowledged || submitMutation.isPending}
          isLoading={submitMutation.isPending}
          onClick={() =>
            submitMutation.mutate({ id: useCaseId, acknowledgedWarnings: true })
          }
        >
          Acknowledge & Submit
        </Button>
      </div>
    </div>
  );
}
