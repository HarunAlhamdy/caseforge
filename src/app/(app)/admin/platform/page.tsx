import { SecurityRole } from "@/lib/constants/enums";
import { requireAdminRoles } from "@/lib/auth/require-admin";
import { PlatformAdminClient } from "./PlatformAdminClient";

export default async function Page() {
  await requireAdminRoles([SecurityRole.PLATFORM_SUPER_ADMIN]);
  return <PlatformAdminClient />;
}
