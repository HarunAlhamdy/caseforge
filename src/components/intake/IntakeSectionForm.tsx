"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeSectionId } from "@/lib/intake/sections";
import {
  AiPattern,
  DataClassification,
  NdaStatus,
  SecurityReviewStatus,
} from "@prisma/client";

const AUTONOMY_LEVELS: {
  value: number;
  label: string;
  description: string;
}[] = [
  {
    value: 1,
    label: "1 — Assistive",
    description: "AI suggests only; a human performs all actions.",
  },
  {
    value: 2,
    label: "2 — Copilot",
    description: "AI drafts or recommends; a human must approve before any action.",
  },
  {
    value: 3,
    label: "3 — Semi-autonomous",
    description:
      "AI acts within defined bounds; humans review exceptions and overrides.",
  },
  {
    value: 4,
    label: "4 — Supervised autonomy",
    description:
      "AI runs end-to-end with continuous human monitoring and instant override.",
  },
  {
    value: 5,
    label: "5 — Fully autonomous",
    description:
      "AI operates independently within policy; humans audit outcomes after the fact.",
  },
];

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
  help,
  disabled,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  help?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {help ? <p className="text-xs text-slate-500">{help}</p> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
        rows={rows}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Allows typing commas freely; commits parsed list on change; syncs from props when not focused. */
function CommaSeparatedInput({
  label,
  values,
  onChange,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(() => values.join(", "));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setText(values.join(", "));
  }, [values]);

  return (
    <Input
      label={label}
      value={text}
      disabled={disabled}
      placeholder="e.g. Sales, Finance, Operations"
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        onChange(
          raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
      onBlur={() => {
        focusedRef.current = false;
        const next = text
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        setText(next.join(", "));
        onChange(next);
      }}
    />
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
          <Input
            label="Title"
            value={values.title ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <Input
            label="Business unit"
            value={values.businessUnit ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ businessUnit: e.target.value })}
          />
          <Input
            label="Executive sponsor"
            value={values.executiveSponsorName ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ executiveSponsorName: e.target.value })}
          />
          <Input
            label="Sponsor title"
            value={values.executiveSponsorTitle ?? ""}
            disabled={readOnly}
            onChange={(e) =>
              onChange({ executiveSponsorTitle: e.target.value })
            }
          />
        </div>
      );
    case "description":
      return (
        <div className="space-y-4">
          <TextAreaField
            label="Problem statement"
            value={values.problemStatement}
            disabled={readOnly}
            onChange={(v) => onChange({ problemStatement: v })}
          />
          <TextAreaField
            label="Proposed solution"
            value={values.proposedSolution}
            disabled={readOnly}
            onChange={(v) => onChange({ proposedSolution: v })}
          />
          <TextAreaField
            label="Expected benefits"
            value={values.expectedBenefits}
            disabled={readOnly}
            onChange={(v) => onChange({ expectedBenefits: v })}
          />
          <SelectField
            label="Desired autonomy level"
            value={
              values.autonomyLevel != null
                ? String(values.autonomyLevel)
                : ""
            }
            disabled={readOnly}
            onChange={(v) =>
              onChange({ autonomyLevel: v ? Number(v) : null })
            }
            options={AUTONOMY_LEVELS.map((level) => ({
              value: String(level.value),
              label: level.label,
            }))}
            help={
              AUTONOMY_LEVELS.find((l) => l.value === values.autonomyLevel)
                ?.description ??
              "How much decision-making and action the AI is allowed to take without a human."
            }
          />
          <ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {AUTONOMY_LEVELS.map((level) => (
              <li key={level.value}>
                <span className="font-medium text-slate-700">{level.label}:</span>{" "}
                {level.description}
              </li>
            ))}
          </ul>
        </div>
      );
    case "currentState":
      return (
        <div className="space-y-4">
          <TextAreaField
            label="How work is done today"
            value={values.currentProcessDescription}
            disabled={readOnly}
            onChange={(v) => onChange({ currentProcessDescription: v })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="FTEs"
              type="number"
              disabled={readOnly}
              value={values.currentFtes ?? ""}
              onChange={(e) =>
                onChange({
                  currentFtes: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
            <Input
              label="Volume"
              disabled={readOnly}
              value={values.currentVolume ?? ""}
              onChange={(e) => onChange({ currentVolume: e.target.value })}
            />
            <Input
              label="Cycle time"
              disabled={readOnly}
              value={values.currentCycleTime ?? ""}
              onChange={(e) => onChange({ currentCycleTime: e.target.value })}
            />
            <Input
              label="Error rate (%)"
              type="number"
              disabled={readOnly}
              value={values.currentErrorRate ?? ""}
              onChange={(e) =>
                onChange({
                  currentErrorRate: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
            <Input
              label="Annual cost"
              type="number"
              disabled={readOnly}
              value={values.annualCost ?? ""}
              onChange={(e) =>
                onChange({
                  annualCost: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <TextAreaField
            label="Known pain points"
            value={values.knownPainPoints}
            disabled={readOnly}
            onChange={(v) => onChange({ knownPainPoints: v })}
          />
        </div>
      );
    case "dataLandscape":
      return (
        <div className="space-y-4">
          <TextAreaField
            label="Source systems"
            value={values.sourceSystemsText}
            disabled={readOnly}
            onChange={(v) => onChange({ sourceSystemsText: v })}
          />
          <Input
            label="Read systems"
            disabled={readOnly}
            value={values.readSystems ?? ""}
            onChange={(e) => onChange({ readSystems: e.target.value })}
          />
          <Input
            label="Write systems"
            disabled={readOnly}
            value={values.writeSystems ?? ""}
            onChange={(e) => onChange({ writeSystems: e.target.value })}
          />
          <Input
            label="Ingestion method"
            disabled={readOnly}
            value={values.ingestionMethod ?? ""}
            onChange={(e) => onChange({ ingestionMethod: e.target.value })}
          />
          <Input
            label="Frequency"
            disabled={readOnly}
            value={values.ingestionFrequency ?? ""}
            onChange={(e) => onChange({ ingestionFrequency: e.target.value })}
          />
          <Input
            label="Data volume"
            disabled={readOnly}
            value={values.dataVolume ?? ""}
            onChange={(e) => onChange({ dataVolume: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.historicalRequired ?? false}
              onChange={(e) =>
                onChange({ historicalRequired: e.target.checked })
              }
            />
            Historical data required
          </label>
          {values.historicalRequired ? (
            <Input
              label="Lookback period"
              disabled={readOnly}
              value={values.historicalLookback ?? ""}
              onChange={(e) =>
                onChange({ historicalLookback: e.target.value })
              }
            />
          ) : null}
        </div>
      );
    case "dataQuality":
      return (
        <div className="space-y-4">
          <TextAreaField
            label="Known data quality issues"
            value={values.dqIssues}
            disabled={readOnly}
            onChange={(v) => onChange({ dqIssues: v })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.remediationNeeded ?? false}
              onChange={(e) =>
                onChange({ remediationNeeded: e.target.checked })
              }
            />
            Remediation needed
          </label>
          {values.remediationNeeded ? (
            <TextAreaField
              label="Remediation plan"
              value={values.remediationPlan}
              disabled={readOnly}
              onChange={(v) => onChange({ remediationPlan: v })}
            />
          ) : null}
          <Input
            label="DQ ownership"
            disabled={readOnly}
            value={values.dqOwnership ?? ""}
            onChange={(e) => onChange({ dqOwnership: e.target.value })}
          />
        </div>
      );
    case "domainModel":
      return (
        <div className="space-y-4">
          <CommaSeparatedInput
            label="Business domains (comma-separated)"
            values={values.businessDomains ?? []}
            disabled={readOnly}
            onChange={(businessDomains) => onChange({ businessDomains })}
          />
          <TextAreaField
            label="Master / reference data"
            value={values.masterRefData}
            disabled={readOnly}
            onChange={(v) => onChange({ masterRefData: v })}
          />
          <Input
            label="Model relationship"
            disabled={readOnly}
            value={values.modelRelationship ?? ""}
            onChange={(e) => onChange({ modelRelationship: e.target.value })}
          />
        </div>
      );
    case "governance":
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.auditabilityRequired ?? false}
              onChange={(e) =>
                onChange({ auditabilityRequired: e.target.checked })
              }
            />
            Auditability required
          </label>
          {values.auditabilityRequired ? (
            <TextAreaField
              label="Auditability detail"
              value={values.auditabilityDetail}
              disabled={readOnly}
              onChange={(v) => onChange({ auditabilityDetail: v })}
            />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.policyReviewRequired ?? false}
              onChange={(e) =>
                onChange({ policyReviewRequired: e.target.checked })
              }
            />
            Policy review required
          </label>
          {values.policyReviewRequired ? (
            <TextAreaField
              label="Policy review body"
              value={values.policyReviewBody}
              disabled={readOnly}
              onChange={(v) => onChange({ policyReviewBody: v })}
            />
          ) : null}
          <SelectField
            label="NDA status"
            disabled={readOnly}
            value={values.ndaStatus}
            onChange={(v) => onChange({ ndaStatus: v as NdaStatus })}
            options={Object.values(NdaStatus).map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            }))}
          />
          <Input
            label="Data owner"
            disabled={readOnly}
            value={values.dataOwner ?? ""}
            onChange={(e) => onChange({ dataOwner: e.target.value })}
          />
          <Input
            label="Data steward"
            disabled={readOnly}
            value={values.dataSteward ?? ""}
            onChange={(e) => onChange({ dataSteward: e.target.value })}
          />
          <Input
            label="Retention policy"
            disabled={readOnly}
            value={values.retentionPolicy ?? ""}
            onChange={(e) => onChange({ retentionPolicy: e.target.value })}
          />
          <TextAreaField
            label="Regulatory considerations"
            value={values.regulatoryConsiderations}
            disabled={readOnly}
            onChange={(v) => onChange({ regulatoryConsiderations: v })}
          />
        </div>
      );
    case "security":
      return (
        <div className="space-y-4">
          <SelectField
            label="Data classification"
            disabled={readOnly}
            value={values.dataClassification}
            onChange={(v) =>
              onChange({ dataClassification: v as DataClassification })
            }
            options={Object.values(DataClassification).map((c) => ({
              value: c,
              label: c.replace(/_/g, " "),
            }))}
          />
          <TextAreaField
            label="Access control requirements"
            value={values.accessControlReqs}
            disabled={readOnly}
            onChange={(v) => onChange({ accessControlReqs: v })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.piiCuiPresent ?? false}
              onChange={(e) => onChange({ piiCuiPresent: e.target.checked })}
            />
            PII / CUI present
          </label>
          {values.piiCuiPresent ? (
            <TextAreaField
              label="PII/CUI detail"
              value={values.piiCuiDetail}
              disabled={readOnly}
              onChange={(v) => onChange({ piiCuiDetail: v })}
            />
          ) : null}
          <CommaSeparatedInput
            label="Encryption requirements (comma-separated)"
            values={values.encryptionReqs ?? []}
            disabled={readOnly}
            onChange={(encryptionReqs) => onChange({ encryptionReqs })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.govtModelAccess ?? false}
              onChange={(e) => onChange({ govtModelAccess: e.target.checked })}
            />
            Government model access required
          </label>
          <SelectField
            label="Security review / ATO status"
            disabled={readOnly}
            value={values.securityReviewStatus}
            onChange={(v) =>
              onChange({ securityReviewStatus: v as SecurityReviewStatus })
            }
            options={Object.values(SecurityReviewStatus).map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            }))}
          />
        </div>
      );
    case "consumption":
      return (
        <div className="space-y-4">
          <TextAreaField
            label="Reporting requirements"
            value={values.reportingReqs}
            disabled={readOnly}
            onChange={(v) => onChange({ reportingReqs: v })}
          />
          <TextAreaField
            label="End-user personas"
            value={values.endUserPersonas}
            disabled={readOnly}
            onChange={(v) => onChange({ endUserPersonas: v })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.conversationalAiRequired ?? false}
              onChange={(e) =>
                onChange({ conversationalAiRequired: e.target.checked })
              }
            />
            Conversational AI required
          </label>
          {values.conversationalAiRequired ? (
            <TextAreaField
              label="Conversational AI detail"
              value={values.conversationalAiDetail}
              disabled={readOnly}
              onChange={(v) => onChange({ conversationalAiDetail: v })}
            />
          ) : null}
          <CommaSeparatedInput
            label="Access channels (comma-separated)"
            values={values.accessChannels ?? []}
            disabled={readOnly}
            onChange={(accessChannels) => onChange({ accessChannels })}
          />
          <TextAreaField
            label="Downstream consumption"
            value={values.downstreamConsumption}
            disabled={readOnly}
            onChange={(v) => onChange({ downstreamConsumption: v })}
          />
        </div>
      );
    case "assessment":
      return (
        <div className="space-y-4">
          <SelectField
            label="AI pattern (optional)"
            disabled={readOnly}
            value={values.aiPattern}
            onChange={(v) =>
              onChange({ aiPattern: v as IntakeFormValues["aiPattern"] })
            }
            options={Object.values(AiPattern).map((p) => ({
              value: p,
              label: p.replace(/_/g, " "),
            }))}
            help="Suggested pattern for solution architecture and effort estimation."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Priority (context)"
              disabled={readOnly}
              value={values.submitterPriority ?? ""}
              onChange={(e) =>
                onChange({ submitterPriority: e.target.value })
              }
            />
            <Input
              label="Complexity (context)"
              disabled={readOnly}
              value={values.submitterComplexity ?? ""}
              onChange={(e) =>
                onChange({ submitterComplexity: e.target.value })
              }
            />
            <Input
              label="Estimated timeline"
              disabled={readOnly}
              value={values.estimatedTimeline ?? ""}
              onChange={(e) =>
                onChange({ estimatedTimeline: e.target.value })
              }
            />
          </div>
          <TextAreaField
            label="Dependencies & risks"
            value={values.dependenciesRisks}
            disabled={readOnly}
            onChange={(v) => onChange({ dependenciesRisks: v })}
          />
        </div>
      );
    case "nextSteps":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            label="Recommended action"
            value={values.recommendedAction}
            disabled={readOnly}
            onChange={(v) => onChange({ recommendedAction: v })}
          />
          <Input
            label="Owner"
            disabled={readOnly}
            value={values.nextStepsOwner ?? ""}
            onChange={(e) => onChange({ nextStepsOwner: e.target.value })}
          />
          <Input
            label="Follow-up date"
            type="date"
            disabled={readOnly}
            value={values.followUpDate ?? ""}
            onChange={(e) => onChange({ followUpDate: e.target.value })}
          />
        </div>
      );
    default:
      return null;
  }
}
