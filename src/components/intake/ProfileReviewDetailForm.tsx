"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AccessMethod,
  DataClassification,
  LatencyTolerance,
  NetworkAccess,
  PiiType,
  ProfileReviewStatus,
  ProfileSection,
  RequiredHandling,
  SystemType,
} from "@prisma/client";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProfileReviewDetailFormProps {
  reviewId: string;
}

function parseReviewNotes(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as Record<string, unknown>;
  } catch {
    return { legacyNotes: notes };
  }
}

export function ProfileReviewDetailForm({ reviewId }: ProfileReviewDetailFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: review, isLoading } = trpc.profileReview.get.useQuery({ id: reviewId });
  const updateReview = trpc.profileReview.update.useMutation({
    onSuccess: () => {
      void utils.profileReview.getMyQueue.invalidate();
      router.push("/review/profiles");
    },
  });

  const useCaseId = review?.useCaseId ?? "";
  const sourceSystems = trpc.profileReview.sourceSystem.list.useQuery(
    { useCaseId },
    { enabled: Boolean(useCaseId) },
  );
  const sensitiveData = trpc.profileReview.sensitiveData.list.useQuery(
    { useCaseId },
    { enabled: Boolean(useCaseId) },
  );

  const createSource = trpc.profileReview.sourceSystem.create.useMutation({
    onSuccess: () => void sourceSystems.refetch(),
  });
  const deleteSource = trpc.profileReview.sourceSystem.delete.useMutation({
    onSuccess: () => void sourceSystems.refetch(),
  });

  const createSensitive = trpc.profileReview.sensitiveData.create.useMutation({
    onSuccess: () => void sensitiveData.refetch(),
  });
  const deleteSensitive = trpc.profileReview.sensitiveData.delete.useMutation({
    onSuccess: () => void sensitiveData.refetch(),
  });

  const [notes, setNotes] = useState<Record<string, unknown>>({});
  const [infoRequest, setInfoRequest] = useState("");

  useEffect(() => {
    if (review?.reviewNotes) {
      setNotes(parseReviewNotes(review.reviewNotes));
    }
  }, [review?.reviewNotes]);

  if (isLoading || !review) {
    return <p className="text-sm text-slate-500">Loading review…</p>;
  }

  const submitStatus = (status: ProfileReviewStatus) => {
    updateReview.mutate({
      id: reviewId,
      status,
      reviewNotes: JSON.stringify(notes),
      infoRequestDetails: status === ProfileReviewStatus.INFO_REQUESTED ? infoRequest : undefined,
    });
  };

  const piiCount = (sensitiveData.data ?? []).filter((row) =>
    row.dataClassification.includes("PII"),
  ).length;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold text-slate-900">
          {review.useCase.useCaseNumber} — {review.section.replace(/_/g, " ")}
        </h1>
        <p className="text-sm text-slate-600">{review.useCase.title}</p>
      </header>

      {review.section === ProfileSection.DATA_INGESTION ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Submitter data landscape: {review.useCase.sourceSystemsText ?? "—"}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="p-2">System</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Access</th>
                  <th className="p-2">Network</th>
                  <th className="p-2">Latency</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {(sourceSystems.data ?? []).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.systemName}</td>
                    <td className="p-2">{row.systemType}</td>
                    <td className="p-2">{row.accessMethod}</td>
                    <td className="p-2">{row.networkAccess}</td>
                    <td className="p-2">{row.latencyTolerance}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSource.mutate({ id: row.id })}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="sm"
            onClick={() =>
              createSource.mutate({
                useCaseId,
                systemName: review.useCase.sourceSystemsText?.split(",")[0]?.trim() || "New system",
                systemType: SystemType.OTHER,
                accessMethod: AccessMethod.REST_API,
                networkAccess: NetworkAccess.PRIVATE_ENDPOINT,
                latencyTolerance: LatencyTolerance.SAME_DAY,
              })
            }
          >
            Add Source System
          </Button>
        </section>
      ) : null}

      {review.section === ProfileSection.DATA_QUALITY ? (
        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <Input
            label="DQ baseline score (0-100)"
            type="number"
            value={String(notes.dqBaselineScore ?? "")}
            onChange={(e) =>
              setNotes({ ...notes, dqBaselineScore: Number(e.target.value) })
            }
          />
          <label className="text-sm">
            <span className="mb-1 block font-medium">Validated issues</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={String(notes.validatedIssues ?? review.useCase.dqIssues ?? "")}
              onChange={(e) => setNotes({ ...notes, validatedIssues: e.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Remediation plan</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={String(notes.remediationPlan ?? "")}
              onChange={(e) => setNotes({ ...notes, remediationPlan: e.target.value })}
            />
          </label>
          <Input
            label="Remediation owner"
            value={String(notes.remediationOwner ?? "")}
            onChange={(e) => setNotes({ ...notes, remediationOwner: e.target.value })}
          />
          <Input
            label="Timeline"
            value={String(notes.remediationTimeline ?? "")}
            onChange={(e) => setNotes({ ...notes, remediationTimeline: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(notes.sufficientForPilot)}
              onChange={(e) => setNotes({ ...notes, sufficientForPilot: e.target.checked })}
            />
            Sufficient for pilot
          </label>
        </section>
      ) : null}

      {review.section === ProfileSection.SENSITIVE_DATA ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
            <span>Total fields: {(sensitiveData.data ?? []).length}</span>
            <span>PII count: {piiCount}</span>
            <span>
              Cross-border:{" "}
              {(sensitiveData.data ?? []).filter((r) => r.crossBorderTransfer).length}
            </span>
            <span>
              Erasure fields:{" "}
              {(sensitiveData.data ?? []).filter((r) => r.rightToErasure).length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="p-2">Field</th>
                  <th className="p-2">Classification</th>
                  <th className="p-2">PII type</th>
                  <th className="p-2">Handling</th>
                  <th className="p-2">Enters LLM</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {(sensitiveData.data ?? []).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.fieldColumnName}</td>
                    <td className="p-2">{row.dataClassification}</td>
                    <td className="p-2">{row.piiType ?? "—"}</td>
                    <td className="p-2">{row.requiredHandling ?? "—"}</td>
                    <td className="p-2 text-slate-400">Stage 4: AI Architect</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSensitive.mutate({ id: row.id })}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="sm"
            onClick={() =>
              createSensitive.mutate({
                useCaseId,
                fieldColumnName: "new_field",
                dataClassification: DataClassification.INTERNAL,
                piiType: PiiType.NONE,
                requiredHandling: RequiredHandling.NO_SPECIAL,
                consentBasis: "NOT_APPLICABLE" as const,
              })
            }
          >
            Add Sensitive Data Element
          </Button>
        </section>
      ) : null}

      {review.section === ProfileSection.GOVERNANCE ? (
        <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          {[
            "policyReviewCompleted",
            "ndaValidated",
            "regulatoryConfirmed",
            "ownershipConfirmed",
            "auditabilityConfirmed",
          ].map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(notes[key])}
                onChange={(e) => setNotes({ ...notes, [key]: e.target.checked })}
              />
              {key.replace(/([A-Z])/g, " $1")}
            </label>
          ))}
        </section>
      ) : null}

      {review.section === ProfileSection.SECURITY ? (
        <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          {[
            "classificationValidated",
            "accessControlDesigned",
            "encryptionConfirmed",
            "atoPathDefined",
            "govtEnvConfirmed",
            "networkSecurityReviewed",
            "threatModelComplete",
          ].map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(notes[key])}
                onChange={(e) => setNotes({ ...notes, [key]: e.target.checked })}
              />
              {key.replace(/([A-Z])/g, " $1")}
            </label>
          ))}
        </section>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Info request details</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          rows={3}
          value={infoRequest}
          onChange={(e) => setInfoRequest(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => submitStatus(ProfileReviewStatus.INFO_REQUESTED)}
        >
          Request Info
        </Button>
        <Button variant="danger" onClick={() => submitStatus(ProfileReviewStatus.REJECTED)}>
          Reject
        </Button>
        <Button onClick={() => submitStatus(ProfileReviewStatus.APPROVED)}>Approve</Button>
      </div>
    </div>
  );
}
