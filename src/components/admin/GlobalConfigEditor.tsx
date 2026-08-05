"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";

export function GlobalConfigEditor() {
  const { data, isLoading, refetch } = trpc.admin.getGlobalConfig.useQuery();
  const updateConfig = trpc.admin.updateGlobalConfig.useMutation({
    onSuccess: () => void refetch(),
  });

  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setJsonText(JSON.stringify(data, null, 2));
    }
  }, [data]);

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading global config…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Default scoring template, intake sections, hard gates, and subscription tiers.
        Updated {new Date(data.updatedAt).toLocaleString()}.
      </p>
      <textarea
        className="min-h-[420px] w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setParseError(null);
        }}
      />
      {parseError ? <p className="text-sm text-red-600">{parseError}</p> : null}
      <Button
        onClick={() => {
          try {
            const parsed = JSON.parse(jsonText) as Record<string, unknown>;
            updateConfig.mutate(parsed);
          } catch {
            setParseError("Invalid JSON");
          }
        }}
        isLoading={updateConfig.isPending}
      >
        Save Global Config
      </Button>
    </div>
  );
}
