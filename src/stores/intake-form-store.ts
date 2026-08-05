import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeSectionId } from "@/lib/intake/sections";

export const emptyIntakeDraft: IntakeFormValues = {
  title: "",
  businessUnit: "",
  problemStatement: "",
  proposedSolution: "",
  expectedBenefits: "",
  businessDomains: [],
  encryptionReqs: [],
  accessChannels: [],
};

interface IntakeFormState {
  useCaseId: string | null;
  draft: IntakeFormValues;
  activeSection: IntakeSectionId;
  isDirty: boolean;
  lastSavedAt: string | null;
  setUseCaseId: (id: string | null) => void;
  setActiveSection: (section: IntakeSectionId) => void;
  loadDraft: (values: IntakeFormValues, useCaseId?: string | null) => void;
  updateDraft: (patch: Partial<IntakeFormValues>) => void;
  markClean: () => void;
  markSaved: () => void;
  resetDraft: () => void;
}

export const useIntakeFormStore = create<IntakeFormState>()(
  persist(
    (set) => ({
      useCaseId: null,
      draft: { ...emptyIntakeDraft },
      activeSection: "submission",
      isDirty: false,
      lastSavedAt: null,
      setUseCaseId: (id) => set({ useCaseId: id }),
      setActiveSection: (section) => set({ activeSection: section }),
      loadDraft: (values, useCaseId = null) =>
        set({
          draft: { ...emptyIntakeDraft, ...values },
          useCaseId,
          isDirty: false,
        }),
      updateDraft: (patch) =>
        set((state) => ({
          draft: { ...state.draft, ...patch },
          isDirty: true,
        })),
      markClean: () => set({ isDirty: false }),
      markSaved: () =>
        set({ isDirty: false, lastSavedAt: new Date().toISOString() }),
      resetDraft: () =>
        set({
          useCaseId: null,
          draft: { ...emptyIntakeDraft },
          activeSection: "submission",
          isDirty: false,
          lastSavedAt: null,
        }),
    }),
    {
      name: "caseforge-intake-draft",
      partialize: (state) => ({
        useCaseId: state.useCaseId,
        draft: state.draft,
        activeSection: state.activeSection,
        lastSavedAt: state.lastSavedAt,
      }),
    },
  ),
);
