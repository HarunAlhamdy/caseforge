"use client";

import { Input } from "@/components/ui/Input";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeSectionId } from "@/lib/intake/sections";
import {
  AiPattern,
  DataClassification,
  NdaStatus,
  SecurityReviewStatus,
} from "@prisma/client";

interface SectionFormProps {
  sectionId: IntakeSectionId;
  values: IntakeFormValues;
  onChange: (patch: Partial<IntakeFormValues>) => void;
  readOnly?: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="block w-full rounded-lg border border-slate-300 px-3 py-2"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="block w-full rounded-lg border border-slate-300 px-3 py-2"
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function IntakeSectionForm({
  sectionId,
  values,
  onChange,
  readOnly = false,
}: SectionFormProps) {
  switch (sectionId) {
    case "submission":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Title" value={values.title ?? ""} disabled={readOnly} onChange={(e) => onChange({ title: e.target.value })} />
          <Input label="Business unit" value={values.businessUnit ?? ""} disabled={readOnly} onChange={(e) => onChange({ businessUnit: e.target.value })} />
          <Input label="Executive sponsor" value={values.executiveSponsorName ?? ""} disabled={readOnly} onChange={(e) => onChange({ executiveSponsorName: e.target.value })} />
          <Input label="Sponsor title" value={values.executiveSponsorTitle ?? ""} disabled={readOnly} onChange={(e) => onChange({ executiveSponsorTitle: e.target.value })} />
        </div>
      );
    case "description":
      return (
        <div className="space-y-4">
          <TextAreaField label="Problem statement" value={values.problemStatement} onChange={(v) => onChange({ problemStatement: v })} />
          <TextAreaField label="Proposed solution" value={values.proposedSolution} onChange={(v) => onChange({ proposedSolution: v })} />
          <TextAreaField label="Expected benefits" value={values.expectedBenefits} onChange={(v) => onChange({ expectedBenefits: v })} />
          <SelectField
            label="AI pattern (optional)"
            value={values.aiPattern}
            onChange={(v) => onChange({ aiPattern: v as IntakeFormValues["aiPattern"] })}
            options={Object.values(AiPattern).map((p) => ({ value: p, label: p.replace(/_/g, " ") }))}
          />
          <Input
            label="Autonomy level (1-5)"
            type="number"
            min={1}
            max={5}
            value={values.autonomyLevel ?? ""}
            onChange={(e) => onChange({ autonomyLevel: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      );
    case "currentState":
      return (
        <div className="space-y-4">
          <TextAreaField label="How work is done today" value={values.currentProcessDescription} onChange={(v) => onChange({ currentProcessDescription: v })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="FTEs" type="number" value={values.currentFtes ?? ""} onChange={(e) => onChange({ currentFtes: e.target.value ? Number(e.target.value) : null })} />
            <Input label="Volume" value={values.currentVolume ?? ""} onChange={(e) => onChange({ currentVolume: e.target.value })} />
            <Input label="Cycle time" value={values.currentCycleTime ?? ""} onChange={(e) => onChange({ currentCycleTime: e.target.value })} />
            <Input label="Error rate (%)" type="number" value={values.currentErrorRate ?? ""} onChange={(e) => onChange({ currentErrorRate: e.target.value ? Number(e.target.value) : null })} />
            <Input label="Annual cost" type="number" value={values.annualCost ?? ""} onChange={(e) => onChange({ annualCost: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <TextAreaField label="Known pain points" value={values.knownPainPoints} onChange={(v) => onChange({ knownPainPoints: v })} />
        </div>
      );
    case "dataLandscape":
      return (
        <div className="space-y-4">
          <TextAreaField label="Source systems" value={values.sourceSystemsText} onChange={(v) => onChange({ sourceSystemsText: v })} />
          <Input label="Read systems" value={values.readSystems ?? ""} onChange={(e) => onChange({ readSystems: e.target.value })} />
          <Input label="Write systems" value={values.writeSystems ?? ""} onChange={(e) => onChange({ writeSystems: e.target.value })} />
          <Input label="Ingestion method" value={values.ingestionMethod ?? ""} onChange={(e) => onChange({ ingestionMethod: e.target.value })} />
          <Input label="Frequency" value={values.ingestionFrequency ?? ""} onChange={(e) => onChange({ ingestionFrequency: e.target.value })} />
          <Input label="Data volume" value={values.dataVolume ?? ""} onChange={(e) => onChange({ dataVolume: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.historicalRequired ?? false} onChange={(e) => onChange({ historicalRequired: e.target.checked })} />
            Historical data required
          </label>
          {values.historicalRequired ? (
            <Input label="Lookback period" value={values.historicalLookback ?? ""} onChange={(e) => onChange({ historicalLookback: e.target.value })} />
          ) : null}
        </div>
      );
    case "dataQuality":
      return (
        <div className="space-y-4">
          <TextAreaField label="Known data quality issues" value={values.dqIssues} onChange={(v) => onChange({ dqIssues: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.remediationNeeded ?? false} onChange={(e) => onChange({ remediationNeeded: e.target.checked })} />
            Remediation needed
          </label>
          {values.remediationNeeded ? (
            <TextAreaField label="Remediation plan" value={values.remediationPlan} onChange={(v) => onChange({ remediationPlan: v })} />
          ) : null}
          <Input label="DQ ownership" value={values.dqOwnership ?? ""} onChange={(e) => onChange({ dqOwnership: e.target.value })} />
        </div>
      );
    case "domainModel":
      return (
        <div className="space-y-4">
          <Input
            label="Business domains (comma-separated)"
            value={(values.businessDomains ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                businessDomains: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextAreaField label="Master / reference data" value={values.masterRefData} onChange={(v) => onChange({ masterRefData: v })} />
          <Input label="Model relationship" value={values.modelRelationship ?? ""} onChange={(e) => onChange({ modelRelationship: e.target.value })} />
        </div>
      );
    case "governance":
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.auditabilityRequired ?? false} onChange={(e) => onChange({ auditabilityRequired: e.target.checked })} />
            Auditability required
          </label>
          {values.auditabilityRequired ? (
            <TextAreaField label="Auditability detail" value={values.auditabilityDetail} onChange={(v) => onChange({ auditabilityDetail: v })} />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.policyReviewRequired ?? false} onChange={(e) => onChange({ policyReviewRequired: e.target.checked })} />
            Policy review required
          </label>
          {values.policyReviewRequired ? (
            <TextAreaField label="Policy review body" value={values.policyReviewBody} onChange={(v) => onChange({ policyReviewBody: v })} />
          ) : null}
          <SelectField label="NDA status" value={values.ndaStatus} onChange={(v) => onChange({ ndaStatus: v as NdaStatus })} options={Object.values(NdaStatus).map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} />
          <Input label="Data owner" value={values.dataOwner ?? ""} onChange={(e) => onChange({ dataOwner: e.target.value })} />
          <Input label="Data steward" value={values.dataSteward ?? ""} onChange={(e) => onChange({ dataSteward: e.target.value })} />
          <Input label="Retention policy" value={values.retentionPolicy ?? ""} onChange={(e) => onChange({ retentionPolicy: e.target.value })} />
          <TextAreaField label="Regulatory considerations" value={values.regulatoryConsiderations} onChange={(v) => onChange({ regulatoryConsiderations: v })} />
        </div>
      );
    case "security":
      return (
        <div className="space-y-4">
          <SelectField
            label="Data classification"
            value={values.dataClassification}
            onChange={(v) => onChange({ dataClassification: v as DataClassification })}
            options={Object.values(DataClassification).map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
          />
          <TextAreaField label="Access control requirements" value={values.accessControlReqs} onChange={(v) => onChange({ accessControlReqs: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.piiCuiPresent ?? false} onChange={(e) => onChange({ piiCuiPresent: e.target.checked })} />
            PII / CUI present
          </label>
          {values.piiCuiPresent ? (
            <TextAreaField label="PII/CUI detail" value={values.piiCuiDetail} onChange={(v) => onChange({ piiCuiDetail: v })} />
          ) : null}
          <Input
            label="Encryption requirements (comma-separated)"
            value={(values.encryptionReqs ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                encryptionReqs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.govtModelAccess ?? false} onChange={(e) => onChange({ govtModelAccess: e.target.checked })} />
            Government model access required
          </label>
          <SelectField
            label="Security review / ATO status"
            value={values.securityReviewStatus}
            onChange={(v) => onChange({ securityReviewStatus: v as SecurityReviewStatus })}
            options={Object.values(SecurityReviewStatus).map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          />
        </div>
      );
    case "consumption":
      return (
        <div className="space-y-4">
          <TextAreaField label="Reporting requirements" value={values.reportingReqs} onChange={(v) => onChange({ reportingReqs: v })} />
          <TextAreaField label="End-user personas" value={values.endUserPersonas} onChange={(v) => onChange({ endUserPersonas: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.conversationalAiRequired ?? false} onChange={(e) => onChange({ conversationalAiRequired: e.target.checked })} />
            Conversational AI required
          </label>
          {values.conversationalAiRequired ? (
            <TextAreaField label="Conversational AI detail" value={values.conversationalAiDetail} onChange={(v) => onChange({ conversationalAiDetail: v })} />
          ) : null}
          <Input
            label="Access channels (comma-separated)"
            value={(values.accessChannels ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                accessChannels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <TextAreaField label="Downstream consumption" value={values.downstreamConsumption} onChange={(v) => onChange({ downstreamConsumption: v })} />
        </div>
      );
    case "assessment":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Priority (context)" value={values.submitterPriority ?? ""} onChange={(e) => onChange({ submitterPriority: e.target.value })} />
          <Input label="Complexity (context)" value={values.submitterComplexity ?? ""} onChange={(e) => onChange({ submitterComplexity: e.target.value })} />
          <Input label="Estimated timeline" value={values.estimatedTimeline ?? ""} onChange={(e) => onChange({ estimatedTimeline: e.target.value })} />
          <TextAreaField label="Dependencies & risks" value={values.dependenciesRisks} onChange={(v) => onChange({ dependenciesRisks: v })} />
        </div>
      );
    case "nextSteps":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="Recommended action" value={values.recommendedAction} onChange={(v) => onChange({ recommendedAction: v })} />
          <Input label="Owner" value={values.nextStepsOwner ?? ""} onChange={(e) => onChange({ nextStepsOwner: e.target.value })} />
          <Input label="Follow-up date" type="date" value={values.followUpDate ?? ""} onChange={(e) => onChange({ followUpDate: e.target.value })} />
        </div>
      );
    default:
      return null;
  }
}
