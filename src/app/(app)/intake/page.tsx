"use client";

import { AppPage } from "@/components/layout/AppPage";
import { IntakeListTable } from "@/components/intake/IntakeListTable";

export default function Page() {
  return (
    <AppPage
      title="Intake"
      description="Browse draft and submitted use case intakes."
    >
      <IntakeListTable />
    </AppPage>
  );
}
