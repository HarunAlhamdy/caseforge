"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PilotTracker({ useCaseId }: { useCaseId: string }) {
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();
  const { data } = trpc.workflow.getPilot.useQuery({ useCaseId });
  const verify = trpc.workflow.verifyControl.useMutation({
    onSuccess: () => void utils.workflow.getPilot.invalidate({ useCaseId }),
  });
  const checkpoint = trpc.workflow.pilotCheckpoint.useMutation({
    onSuccess: () => void utils.workflow.getPilot.invalidate({ useCaseId }),
  });
  const updateCriteria = trpc.workflow.updatePilotCriteria.useMutation({
    onSuccess: () => void utils.workflow.getPilot.invalidate({ useCaseId }),
  });

  if (!data) return <p className="text-sm text-slate-500">Loading pilot…</p>;

  return (
    <div className="space-y-4">
      <Badge variant={data.controlsVerified ? "success" : "warning"}>
        Controls {data.controlsVerified ? "verified" : "pending"}
      </Badge>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-2 text-sm font-semibold">Success criteria</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-2">Metric</th>
              <th className="p-2">Target</th>
              <th className="p-2">Actual</th>
            </tr>
          </thead>
          <tbody>
            {data.useCase.successCriteria.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-2">{c.metricName}</td>
                <td className="p-2">{c.target}</td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-24 rounded border border-slate-300 px-1"
                    defaultValue={c.actualResult ?? ""}
                    onBlur={(e) =>
                      updateCriteria.mutate({
                        useCaseId,
                        criteria: [
                          {
                            id: c.id,
                            actualResult: Number(e.target.value),
                            status: "MEASURED",
                          },
                        ],
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-2 text-sm font-semibold">Mandatory controls (SoD)</h3>
        <ul className="space-y-2 text-sm">
          {data.useCase.mandatoryControls.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2">
              <Badge>{c.status}</Badge>
              <span>{c.controlName}</span>
              {c.status !== "VERIFIED" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    verify.mutate({
                      controlId: c.id,
                      status:
                        c.status === "REQUIRED" ? "IMPLEMENTED" : "VERIFIED",
                    })
                  }
                >
                  Advance
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <textarea
        className="w-full rounded-lg border border-slate-300 p-2 text-sm"
        rows={2}
        placeholder="Checkpoint notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {(["CONTINUE", "ADJUST", "EXTEND", "PAUSE", "GO"] as const).map((d) => (
          <Button
            key={d}
            variant={d === "GO" ? "primary" : "secondary"}
            size="sm"
            onClick={() => checkpoint.mutate({ useCaseId, decision: d, notes })}
          >
            {d}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ScaleUpPanel({ useCaseId }: { useCaseId: string }) {
  const [scope, setScope] = useState("");
  const [date, setDate] = useState("");
  const [checked, setChecked] = useState(false);
  const deploy = trpc.workflow.deployToProduction.useMutation();

  return (
    <div className="space-y-4">
      <textarea
        className="w-full rounded-lg border border-slate-300 p-2 text-sm"
        placeholder="Production scope"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
      />
      <input
        type="date"
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        Readiness checklist complete
      </label>
      <Button
        onClick={() =>
          deploy.mutate({
            useCaseId,
            deploymentDate: date,
            productionScope: scope,
            checklistComplete: checked,
          })
        }
      >
        Deploy to Production
      </Button>
    </div>
  );
}

export function OperationsDashboard() {
  const { data } = trpc.workflow.getOperationsDashboard.useQuery();
  const revalidate = trpc.workflow.startRevalidation.useMutation();
  const retire = trpc.workflow.retireUseCase.useMutation();

  if (!data) return <p className="text-sm text-slate-500">Loading operations…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        Revalidation due: {data.revalidationDue.length} use case(s)
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="p-2">Use case</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.production.map((uc) => (
            <tr key={uc.id} className="border-t border-slate-100">
              <td className="p-2">
                <a
                  href={`/operations/${uc.id}`}
                  className="font-medium text-brand-primary hover:underline"
                >
                  {uc.title}
                </a>
              </td>
              <td className="p-2">{uc.currentStage}</td>
              <td className="p-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    revalidate.mutate({
                      useCaseId: uc.id,
                      notes: "Scheduled revalidation",
                    })
                  }
                >
                  Revalidate
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="ml-2"
                  onClick={() =>
                    retire.mutate({
                      useCaseId: uc.id,
                      reason: "Retired from operations dashboard",
                    })
                  }
                >
                  Retire
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OperationsDetail({ useCaseId }: { useCaseId: string }) {
  const [metrics, setMetrics] = useState({
    accuracy: "",
    costActual: "",
    incidents: "",
    adoptionRate: "",
  });
  const { data } = trpc.workflow.getOperationsDetail.useQuery({ useCaseId });
  const record = trpc.workflow.recordMonthlyMetrics.useMutation();
  const returnArch = trpc.workflow.returnToArchitecture.useMutation();

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const metricHistory = data.actionItems.filter((a) => a.status === "METRICS");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          placeholder="Accuracy %"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={metrics.accuracy}
          onChange={(e) => setMetrics({ ...metrics, accuracy: e.target.value })}
        />
        <input
          placeholder="Cost actual"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={metrics.costActual}
          onChange={(e) => setMetrics({ ...metrics, costActual: e.target.value })}
        />
        <input
          placeholder="Incidents"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={metrics.incidents}
          onChange={(e) => setMetrics({ ...metrics, incidents: e.target.value })}
        />
        <input
          placeholder="Adoption %"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={metrics.adoptionRate}
          onChange={(e) => setMetrics({ ...metrics, adoptionRate: e.target.value })}
        />
      </div>
      <Button
        onClick={() =>
          record.mutate({
            useCaseId,
            accuracy: metrics.accuracy ? Number(metrics.accuracy) : undefined,
            costActual: metrics.costActual ? Number(metrics.costActual) : undefined,
            incidents: metrics.incidents ? Number(metrics.incidents) : undefined,
            adoptionRate: metrics.adoptionRate ? Number(metrics.adoptionRate) : undefined,
          })
        }
      >
        Record Monthly Metrics
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          returnArch.mutate({
            useCaseId,
            reason: "Major change requires architecture re-assessment",
          })
        }
      >
        Return to Architecture (major change)
      </Button>
      {metricHistory.length ? (
        <ul className="text-sm text-slate-600">
          {metricHistory.map((m) => (
            <li key={m.id}>{m.notes}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
