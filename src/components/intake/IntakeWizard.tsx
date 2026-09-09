"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { IntakeStepper } from "./IntakeStepper";
import { IntakeSectionForm } from "./IntakeSectionForm";
import { useIntakeFormStore } from "@/stores/intake-form-store";
import {
  INTAKE_SECTION_LABELS,
  type IntakeSectionId,
  visibleSections,
} from "@/lib/intake/sections";
import {
  areAllMandatorySectionsComplete,
  calculateCompletionPercent,
  getSectionCompletionStatus,
} from "@/lib/intake/completion";
import { INTAKE_SECTION_IDS } from "@/lib/intake/sections";
import type { IntakeFormConfig } from "@/lib/types";

const AUTOSAVE_DEBOUNCE_MS = 2_000;

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [navigatingReview, setNavigatingReview] = useState(false);
  const savingRef = useRef(false);
  const hydratedRef = useRef<string | null>(null);

  const createMutation = trpc.usecase.create.useMutation();
  const updateMutation = trpc.usecase.update.useMutation();

  useEffect(() => {
    const hydrateKey = useCaseId ?? "__new__";
    if (hydratedRef.current === hydrateKey) return;

    if (useCaseId && initialValues) {
      const storeId = useIntakeFormStore.getState().useCaseId;
      if (storeId && storeId !== useCaseId) {
        useIntakeFormStore.getState().resetDraft();
      }
      loadDraft(initialValues, useCaseId);
      setUseCaseId(useCaseId);
      setLocalId(useCaseId);
    } else if (!useCaseId) {
      useIntakeFormStore.getState().resetDraft();
      setLocalId(undefined);
    }

    hydratedRef.current = hydrateKey;
  }, [initialValues, useCaseId, loadDraft, setUseCaseId]);

  const sections = useMemo(
    () => visibleSections(intakeConfig),
    [intakeConfig],
  );

  const sectionStatus = useMemo(() => {
    const map = {} as Record<
      IntakeSectionId,
      ReturnType<typeof getSectionCompletionStatus>
    >;
    for (const sectionId of INTAKE_SECTION_IDS) {
      map[sectionId] = getSectionCompletionStatus(
        sectionId,
        draft,
        intakeConfig,
      );
    }
    return map;
  }, [draft, intakeConfig]);

  const completionPercent = calculateCompletionPercent(draft, intakeConfig);
  const mandatoryComplete = areAllMandatorySectionsComplete(
    draft,
    intakeConfig,
  );

  const activeIndex = sections.indexOf(activeSection);
  const isLastSection =
    activeIndex >= 0 && activeIndex === sections.length - 1;

  const saveDraft = useCallback(async (): Promise<string | undefined> => {
    if (readOnly) return localId;

    while (savingRef.current) {
      await new Promise((r) => setTimeout(r, 40));
    }
    savingRef.current = true;
    setSaveError(null);
    try {
      const latest = useIntakeFormStore.getState().draft;
      const storeId = useIntakeFormStore.getState().useCaseId;
      const id = localId ?? storeId ?? undefined;
      if (id && storeId && storeId !== id && localId && storeId !== localId) {
        throw new Error("Draft does not match this use case — reload and try again");
      }
      if (localId) {
        await updateMutation.mutateAsync({ id: localId, data: latest });
        markSaved(latest);
        void utils.usecase.list.invalidate();
        void utils.usecase.get.invalidate({ id: localId });
        return localId;
      }
      const created = await createMutation.mutateAsync(latest);
      setLocalId(created.id);
      setUseCaseId(created.id);
      markSaved(latest);
      void utils.usecase.list.invalidate();
      router.replace(`/intake/${created.id}`);
      return created.id;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not save draft";
      setSaveError(message);
      throw err;
    } finally {
      savingRef.current = false;
    }
  }, [
    readOnly,
    localId,
    updateMutation,
    createMutation,
    setUseCaseId,
    markSaved,
    utils,
    router,
  ]);

  // Debounced autosave
  useEffect(() => {
    if (!isDirty || readOnly) return;
    const timer = setTimeout(() => {
      void saveDraft().catch(() => undefined);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isDirty, readOnly, draft, saveDraft]);

  async function goToSection(sectionId: IntakeSectionId) {
    if (!readOnly && isDirty) {
      try {
        await saveDraft();
      } catch {
        return;
      }
    }
    setActiveSection(sectionId);
  }

  async function saveAndNext() {
    try {
      await saveDraft();
    } catch {
      return;
    }
    if (activeIndex < 0 || activeIndex >= sections.length - 1) return;
    setActiveSection(sections[activeIndex + 1]!);
  }

  async function saveAndPrevious() {
    try {
      if (isDirty) await saveDraft();
    } catch {
      return;
    }
    if (activeIndex <= 0) return;
    setActiveSection(sections[activeIndex - 1]!);
  }

  async function goToReview() {
    if (!mandatoryComplete) return;
    setNavigatingReview(true);
    try {
      const id = await saveDraft();
      if (!id) {
        setNavigatingReview(false);
        setSaveError("Could not save before review — try again");
        return;
      }
      router.push(`/intake/${id}/review`);
      router.refresh();
    } catch {
      setNavigatingReview(false);
    }
  }

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    navigatingReview;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Autosave status pill */}
        <div className="flex items-center gap-2.5">
          {saveError ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <AlertCircle className="h-3 w-3" aria-hidden />
              {saveError}
            </span>
          ) : isDirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" aria-hidden />
              Unsaved changes
            </span>
          ) : lastSavedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          ) : null}

          {/* Completion bar */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs text-stone-400">{completionPercent}%</span>
          </div>
        </div>

        {/* Top-right actions */}
        {!readOnly ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void saveDraft()}
              isLoading={saving && !navigatingReview}
            >
              Save draft
            </Button>
            {mandatoryComplete ? (
              <Button
                size="sm"
                onClick={() => void goToReview()}
                isLoading={navigatingReview}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Review & Submit
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Stepper */}
      <IntakeStepper
        activeSection={activeSection}
        onSectionChange={(section) => void goToSection(section)}
        sectionStatus={sectionStatus}
        config={intakeConfig}
      />

      {/* Section panel */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
        {/* Section header strip */}
        <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <div className="h-5 w-1 rounded-full bg-teal-500" aria-hidden />
          <h2 className="text-base font-semibold text-stone-900">
            {INTAKE_SECTION_LABELS[activeSection]}
          </h2>
          <span className="ml-auto text-xs text-stone-400">
            Step {activeIndex + 1} of {sections.length}
          </span>
        </div>

        {/* Form content */}
        <div className="p-6">
          {sections.includes(activeSection) ? (
            <IntakeSectionForm
              sectionId={activeSection}
              values={draft}
              onChange={readOnly ? () => undefined : updateDraft}
              readOnly={readOnly}
            />
          ) : (
            <p className="text-sm text-stone-400">
              This section is hidden by tenant configuration.
            </p>
          )}
        </div>

        {/* Sticky footer nav */}
        {!readOnly ? (
          <div className="flex items-center justify-between border-t border-stone-100 bg-white px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeIndex <= 0 || saving}
              onClick={() => void saveAndPrevious()}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>

            <div className="flex gap-2">
              {!isLastSection ? (
                <Button
                  size="sm"
                  onClick={() => void saveAndNext()}
                  isLoading={saving && !navigatingReview}
                >
                  Save & next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              ) : mandatoryComplete ? (
                <Button
                  size="sm"
                  onClick={() => void goToReview()}
                  isLoading={navigatingReview}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  Review & Submit
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void saveDraft()}
                  isLoading={saving}
                >
                  Save draft
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {!readOnly && !mandatoryComplete ? (
        <p className="text-xs text-stone-400">
          Complete every mandatory field in all sections to unlock Review &amp; Submit.
        </p>
      ) : null}
    </div>
  );
}
