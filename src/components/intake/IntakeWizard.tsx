"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { IntakeStepper } from "./IntakeStepper";
import { IntakeSectionForm } from "./IntakeSectionForm";
import { useIntakeFormStore } from "@/stores/intake-form-store";
import {
  INTAKE_SECTION_IDS,
  INTAKE_SECTION_LABELS,
  type IntakeSectionId,
  visibleSections,
} from "@/lib/intake/sections";
import {
  areAllMandatorySectionsComplete,
  calculateCompletionPercent,
  getSectionCompletionStatus,
} from "@/lib/intake/completion";
import type { IntakeFormConfig } from "@/lib/types";

interface IntakeWizardProps {
  useCaseId?: string;
  intakeConfig?: IntakeFormConfig | null;
  initialValues?: ReturnType<typeof useIntakeFormStore.getState>["draft"];
  readOnly?: boolean;
}

export function IntakeWizard({
  useCaseId,
  intakeConfig,
  initialValues,
  readOnly = false,
}: IntakeWizardProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const {
    draft,
    activeSection,
    isDirty,
    lastSavedAt,
    setUseCaseId,
    setActiveSection,
    loadDraft,
    updateDraft,
    markSaved,
  } = useIntakeFormStore();

  const [localId, setLocalId] = useState<string | undefined>(useCaseId);

  const createMutation = trpc.usecase.create.useMutation();
  const updateMutation = trpc.usecase.update.useMutation();

  useEffect(() => {
    if (initialValues) {
      loadDraft(initialValues, useCaseId ?? null);
    }
    if (useCaseId) {
      setUseCaseId(useCaseId);
      setLocalId(useCaseId);
    }
  }, [initialValues, useCaseId, loadDraft, setUseCaseId]);

  const sectionStatus = useMemo(() => {
    const map = {} as Record<IntakeSectionId, ReturnType<typeof getSectionCompletionStatus>>;
    for (const sectionId of INTAKE_SECTION_IDS) {
      map[sectionId] = getSectionCompletionStatus(sectionId, draft, intakeConfig);
    }
    return map;
  }, [draft, intakeConfig]);

  const completionPercent = calculateCompletionPercent(draft, intakeConfig);
  const mandatoryComplete = areAllMandatorySectionsComplete(draft, intakeConfig);

  const saveDraft = useCallback(async () => {
    if (readOnly) return;
    if (localId) {
      await updateMutation.mutateAsync({ id: localId, data: draft });
    } else {
      const created = await createMutation.mutateAsync(draft);
      setLocalId(created.id);
      setUseCaseId(created.id);
      router.replace(`/intake/${created.id}`);
    }
    markSaved();
    void utils.usecase.list.invalidate();
    void utils.usecase.get.invalidate({ id: localId! });
  }, [
    readOnly,
    localId,
    draft,
    updateMutation,
    createMutation,
    setUseCaseId,
    markSaved,
    utils,
    router,
  ]);

  useEffect(() => {
    if (!isDirty || readOnly) return;
    const timer = setInterval(() => {
      void saveDraft();
    }, 60_000);
    return () => clearInterval(timer);
  }, [isDirty, readOnly, saveDraft]);

  const sections = visibleSections(intakeConfig);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Completion: {completionPercent}%
            {lastSavedAt ? ` · Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
            {isDirty ? " · Unsaved changes" : ""}
          </p>
        </div>
        {!readOnly ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void saveDraft()} isLoading={createMutation.isPending || updateMutation.isPending}>
              Save Draft
            </Button>
            {mandatoryComplete && localId ? (
              <Button onClick={() => router.push(`/intake/${localId}/review`)}>
                Review & Submit
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <IntakeStepper
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionStatus={sectionStatus}
        config={intakeConfig}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {INTAKE_SECTION_LABELS[activeSection]}
        </h2>
        {sections.includes(activeSection) ? (
          <IntakeSectionForm
            sectionId={activeSection}
            values={draft}
            onChange={readOnly ? () => undefined : updateDraft}
            readOnly={readOnly}
          />
        ) : (
          <p className="text-sm text-slate-500">This section is hidden by tenant configuration.</p>
        )}
      </div>
    </div>
  );
}
