"use client";

import { AppPage } from "@/components/layout/AppPage";
import { GateReportView } from "@/components/intake/GateReportView";

export default function Page() {
  return (
    <AppPage
      title="Gate Report"
      description="Gated-out use cases grouped by gate decision with Excel export."
    >
      <GateReportView />
    </AppPage>
  );
}
