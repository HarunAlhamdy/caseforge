"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GateDecision } from "@prisma/client";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { IntakeCollapsibleSummary } from "@/components/intake/IntakeReadOnlySummary";
import type { IntakeFormValues } from "@/lib/intake/schema";
import type { IntakeFormConfig } from "@/lib/types";

const GATE_OPTIONS: { value: GateDecision; label: string; help: string }[] = [
  {
    value: GateDecision.PASS,
    label: "Pass — Cleared",
    help: "This is an AI/agentic problem, scoped for this engagement, with enough information to score. Advances to specialist profile reviews.",
  },
  {
    value: GateDecision.GATE_A,
    label: "Gate A — Too easy",
    help: "Already solved by a prompt, copilot, or existing tool. Returned to submitter with guidance.",
  },
  {
    value: GateDecision.GATE_B,
    label: "Gate B — Wrong tool",
    help: "Better solved by conventional analytics, RPA, or middleware. Redirected with a named alternative.",
  },
  {
    value: GateDecision.GATE_C,
    label: "Gate C — Too far",
    help: "Real AI opportunity but exceeds engagement scope or depends on prerequisites that have not landed. Parked at ROM estimate for later revisit.",
  },
  {
    value: GateDecision.GATE_D,
    label: "Gate D — Needs redesign",
    help: "Fails human-in-command test as described, or autonomy level is unacceptable without redesign. Returned with specific redesign requirements.",
  },
  {
    value: GateDecision.HOLD,
    label: "Hold — Incomplete",
    help: "Described as a symptom, a bundle, or too vague to evaluate. Returned with a request for SME detail or scope split.",
  },
];

interface GateDecisionPanelProps {
  useCaseId: string;
  values: IntakeFormValues;
  config?: IntakeFormConfig | null;
}

export function GateDecisionPanel({
  useCaseId,
  values,
  config,
}: GateDecisionPanelProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<GateDecision>(GateDecision.PASS);
  const [rationale, setRationale] = useState("");

  const recordDecision = trpc.usecase.recordGateDecision.useMutation({
    onSuccess: () => router.push("/review/queue"),
  });
  const infoRequest = trpc.usecase.createInfoRequest.useMutation({
    onSuccess: () => router.push("/review/queue"),
  });

  const selected = GATE_OPTIONS.find((o) => o.value === decision);

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="min-h-[480px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Intake evidence</h2>
        <IntakeCollapsibleSummary values={values} config={config} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Gate decision</h2>
        <label className="mt-4 block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Decision</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={decision}
            onChange={(e) => setDecision(e.target.value as GateDecision)}
          >
            {GATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <p className="mt-2 text-xs text-slate-500">{selected.help}</p>
        ) : null}
        <label className="mt-4 block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Rationale</span>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={5}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Minimum one sentence explaining the decision…"
          />
        </label>
        <Button
          className="mt-4 w-full"
          isLoading={recordDecision.isPending || infoRequest.isPending}
          disabled={rationale.trim().length < 10}
          onClick={() => {
            if (decision === GateDecision.HOLD) {
              infoRequest.mutate({ id: useCaseId, rationale });
            } else {
              recordDecision.mutate({ id: useCaseId, decision, rationale });
            }
          }}
        >
          Record Decision
        </Button>
      </div>
    </div>
  );
}
