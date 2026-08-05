"use client";

import { AppPage } from "@/components/layout/AppPage";
import { IntakeWizard } from "@/components/intake/IntakeWizard";

export default function Page() {
  return (
    <AppPage
      title="New Intake"
      description="Complete all mandatory sections, then review and submit."
    >
      <IntakeWizard />
    </AppPage>
  );
}
