"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { determineControls } from "@/lib/scoring/control-inheritance";
import type { AgentToolSpec } from "@/lib/types";

const TABS = [
  "Pattern",
  "RAG",
  "Agent",
  "Guardrails",
  "Infra",
] as const;

interface ArchitectureWorkspaceProps {
  useCaseId: string;
}

export function ArchitectureWorkspace({ useCaseId }: ArchitectureWorkspaceProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pattern");
  const [llmOpen, setLlmOpen] = useState(true);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [llmContext, setLlmContext] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.architecture.get.useQuery({ useCaseId });
  const save = trpc.architecture.save.useMutation({
    onSuccess: () => void utils.architecture.get.invalidate({ useCaseId }),
  });
  const setLlm = trpc.architecture.setLlmContext.useMutation({
    onSuccess: () => void utils.architecture.get.invalidate({ useCaseId }),
  });
  const generateControls = trpc.architecture.generateControls.useMutation({
    onSuccess: () => void utils.architecture.get.invalidate({ useCaseId }),
  });
  const { data: effort } = trpc.architecture.calculateEffort.useQuery(
    { useCaseId },
    { enabled: Boolean(data?.solutionArchitecture) },
  );
  const saveEffort = trpc.architecture.saveEffort.useMutation();
  const complete = trpc.architecture.complete.useMutation({
    onSuccess: () => void utils.architecture.get.invalidate({ useCaseId }),
  });

  const hydratedArchId = useRef<string | null>(null);

  useEffect(() => {
    const archId = data?.solutionArchitecture?.id ?? null;
    if (!archId) return;
    // Only hydrate once per architecture record to avoid wiping in-progress edits
    if (hydratedArchId.current === archId) return;
    if (data?.solutionArchitecture) {
      setForm(data.solutionArchitecture as unknown as Record<string, unknown>);
    }
    const ctx: Record<string, string> = {};
    for (const el of data?.sensitiveDataElements ?? []) {
      if (el.entersLlmContext) ctx[el.id] = el.entersLlmContext;
    }
    setLlmContext(ctx);
    hydratedArchId.current = archId;
  }, [data]);

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading architecture…</p>;
  }

  const arch = data.solutionArchitecture;
  const pattern = (form.aiPattern as string) ?? data.aiPattern ?? "RAG";
  const showRag = pattern === "RAG" || pattern === "FINE_TUNED";
  const showAgent =
    pattern === "SINGLE_AGENT" || pattern === "MULTI_AGENT";

  const controlsPreview =
    data.sensitiveDataElements.length > 0 && arch
      ? determineControls(
          data.sensitiveDataElements,
          {
            aiPattern: arch.aiPattern,
            agentWriteActions: (arch.agentWriteActions ?? []) as unknown as AgentToolSpec[],
            corpusSensitiveData: arch.corpusSensitiveData,
          },
          { dataClassification: data.dataClassification },
        )
      : [];

  const effortChart = effort
    ? [
        { name: "Data Eng", hours: effort.dataEngineeringHrs },
        { name: "Integration", hours: effort.integrationHrs },
        { name: "AI Dev", hours: effort.aiDevelopmentHrs },
        { name: "Security", hours: effort.securityComplianceHrs },
        { name: "Testing", hours: effort.testingHrs },
        { name: "Infra", hours: effort.infrastructureHrs },
        { name: "Change Mgmt", hours: effort.changeMgmtHrs },
      ]
    : [];

  const update = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const elements = Object.entries(llmContext).map(
      ([id, entersLlmContext]) => ({
        id,
        entersLlmContext,
      }),
    );
    await save.mutateAsync({ useCaseId, ...form } as never);
    if (elements.length) {
      await setLlm.mutateAsync({ useCaseId, elements });
    }
  };

  const handleComplete = async () => {
    try {
      await handleSave();
      await complete.mutateAsync({ useCaseId });
    } catch {
      // errors via mutation state
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t
                ? "bg-brand-primary text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <button
          type="button"
          className="text-sm font-semibold text-red-800"
          onClick={() => setLlmOpen(!llmOpen)}
        >
          LLM Context Determination {llmOpen ? "▾" : "▸"}
        </button>
        {llmOpen ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-red-700">
              For each sensitive field, determine whether it enters LLM context — this drives
              mandatory controls.
            </p>
            {data.sensitiveDataElements.map((el) => (
              <div
                key={el.id}
                className="grid gap-2 rounded border border-red-200 bg-white p-2 md:grid-cols-3"
              >
                <span className="text-sm">
                  {el.fieldColumnName ?? el.tableObject} ({el.dataClassification})
                </span>
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={llmContext[el.id] ?? ""}
                  onChange={(e) =>
                    setLlmContext((prev) => ({ ...prev, [el.id]: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="YES_IN_PROMPT">Yes — In Prompt</option>
                  <option value="YES_IN_RAG">Yes — In RAG</option>
                  <option value="NO_PRE_PROCESS">No — Pre-processing only</option>
                  <option value="NO_NOT_USED">No — Not used</option>
                </select>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() =>
                setLlm.mutate({
                  useCaseId,
                  elements: Object.entries(llmContext).map(([id, entersLlmContext]) => ({
                    id,
                    entersLlmContext,
                  })),
                })
              }
            >
              Save LLM context
            </Button>
            {controlsPreview.length ? (
              <p className="text-xs text-slate-600">
                Preview: {controlsPreview.length} control(s) will generate
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {tab === "Pattern" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            AI Pattern
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              value={pattern}
              onChange={(e) => update("aiPattern", e.target.value)}
            >
              {["RAG", "FINE_TUNED", "SINGLE_AGENT", "MULTI_AGENT", "CLASSIFICATION", "SUMMARIZATION"].map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="text-sm">
            Model hosting
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              value={(form.modelHosting as string) ?? ""}
              onChange={(e) => update("modelHosting", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Token estimate / tx
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              value={(form.tokenEstimatePerTx as number) ?? ""}
              onChange={(e) => update("tokenEstimatePerTx", Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Daily tx volume
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              value={(form.dailyTxVolume as number) ?? ""}
              onChange={(e) => update("dailyTxVolume", Number(e.target.value))}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Monthly LLM cost (auto-calc if blank)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              value={(form.estMonthlyLlmCost as number) ?? ""}
              onChange={(e) => update("estMonthlyLlmCost", Number(e.target.value))}
            />
          </label>
        </div>
      ) : null}

      {tab === "RAG" && showRag ? (
        <div className="grid gap-3">
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="Corpus description"
            value={(form.ragCorpusDesc as string) ?? ""}
            onChange={(e) => update("ragCorpusDesc", e.target.value)}
          />
          <input
            type="number"
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="Document count"
            value={(form.ragCorpusDocCount as number) ?? ""}
            onChange={(e) => update("ragCorpusDocCount", Number(e.target.value))}
          />
        </div>
      ) : null}

      {tab === "Agent" && showAgent ? (
        <textarea
          className="w-full rounded-lg border border-slate-300 p-2 text-sm"
          placeholder="Orchestration pattern"
          value={(form.orchestrationPattern as string) ?? ""}
          onChange={(e) => update("orchestrationPattern", e.target.value)}
        />
      ) : null}

      {tab === "Guardrails" ? (
        <div className="grid gap-3">
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="Prompt injection mitigation"
            value={(form.promptInjectionMitigation as string) ?? ""}
            onChange={(e) => update("promptInjectionMitigation", e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="Hallucination mitigation"
            value={(form.hallucinationMitigation as string) ?? ""}
            onChange={(e) => update("hallucinationMitigation", e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="PII leakage prevention"
            value={(form.piiLeakagePrevention as string) ?? ""}
            onChange={(e) => update("piiLeakagePrevention", e.target.value)}
          />
        </div>
      ) : null}

      {tab === "Infra" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <textarea
            className="text-sm"
            placeholder="Compute requirements"
            value={(form.computeRequirements as string) ?? ""}
            onChange={(e) => update("computeRequirements", e.target.value)}
          />
          <input
            type="number"
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="Monthly infra cost"
            value={(form.estMonthlyInfraCost as number) ?? ""}
            onChange={(e) => update("estMonthlyInfraCost", Number(e.target.value))}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={save.isPending || setLlm.isPending}
        >
          Save architecture
        </Button>
        <Button
          variant="secondary"
          onClick={() => generateControls.mutate({ useCaseId })}
          disabled={generateControls.isPending}
        >
          Generate controls
        </Button>
        <Button
          variant="secondary"
          onClick={() => saveEffort.mutate({ useCaseId })}
          disabled={saveEffort.isPending}
        >
          Calculate & save effort
        </Button>
        <Button
          onClick={() => void handleComplete()}
          disabled={complete.isPending || save.isPending}
        >
          Complete architecture
        </Button>
      </div>

      {data.mandatoryControls.length ? (
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-semibold">Mandatory controls ({data.mandatoryControls.length})</h3>
          <ul className="space-y-1 text-sm">
            {data.mandatoryControls.map((c) => (
              <li key={c.id}>
                <Badge>{c.status}</Badge> {c.controlName}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {effort ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold">Effort summary</h3>
            <p className="text-2xl font-bold">{effort.totalEstimatedHrs} hrs</p>
            <p className="text-sm text-slate-600">Band: {effort.calculatedCostBand}</p>
            <p className="text-sm text-slate-600">
              Monthly run: ${effort.estMonthlyRunCost.toLocaleString()}
            </p>
          </div>
          <div className="h-56 rounded-lg border border-slate-200 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={effortChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
