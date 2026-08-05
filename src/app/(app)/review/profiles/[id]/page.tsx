"use client";

import { useParams } from "next/navigation";
import { AppPage } from "@/components/layout/AppPage";
import { ProfileReviewDetailForm } from "@/components/intake/ProfileReviewDetailForm";

export default function Page() {
  const params = useParams<{ id: string }>();

  return (
    <AppPage
      title="Profile Review"
      description="Complete the specialist review form for this section."
    >
      <ProfileReviewDetailForm reviewId={params.id} />
    </AppPage>
  );
}
