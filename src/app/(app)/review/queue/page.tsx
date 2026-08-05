"use client";

import { AppPage } from "@/components/layout/AppPage";
import { ReviewQueueTable } from "@/components/intake/ReviewQueueTable";

export default function Page() {
  return (
    <AppPage
      title="Review Queue"
      description="Pending use cases awaiting portfolio manager triage."
    >
      <ReviewQueueTable />
    </AppPage>
  );
}
