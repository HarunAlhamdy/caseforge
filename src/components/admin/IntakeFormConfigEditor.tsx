"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import type { IntakeFormConfig } from "@/lib/types";

export function IntakeFormConfigEditor() {
  const { data, isLoading, refetch } = trpc.admin.getTenantSettings.useQuery();
  const update = trpc.admin.updateIntakeFormConfig.useMutation({
    onSuccess: () => void refetch(),
  });

  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    if (data?.intakeFormConfig) {
      setJsonText(JSON.stringify(data.intakeFormConfig, null, 2));
    }
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading intake form config…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Configure section visibility, mandatory fields, picklists, and custom fields.
      </p>
      <textarea
        className="min-h-[360px] w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />
      <Button
        onClick={() => {
          const parsed = JSON.parse(jsonText) as IntakeFormConfig;
          update.mutate(parsed);
        }}
        isLoading={update.isPending}
      >
        Save Intake Form Config
      </Button>
    </div>
  );
}
