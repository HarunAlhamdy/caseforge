import { ProfileSection } from "@prisma/client";

export const PROFILE_REVIEW_SECTIONS = [
  ProfileSection.DATA_INGESTION,
  ProfileSection.DATA_QUALITY,
  ProfileSection.SENSITIVE_DATA,
  ProfileSection.GOVERNANCE,
  ProfileSection.SECURITY,
] as const;

export type ProfileReviewSection = (typeof PROFILE_REVIEW_SECTIONS)[number];
