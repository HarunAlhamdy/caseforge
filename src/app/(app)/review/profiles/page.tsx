"use client";

import { AppPage } from "@/components/layout/AppPage";
import { ProfileReviewDashboard } from "@/components/intake/ProfileReviewDashboard";

export default function Page() {
  return (
    <AppPage
      title="Profile Reviews"
      description="Specialist profile review queue assigned to you."
    >
      <ProfileReviewDashboard />
    </AppPage>
  );
}
