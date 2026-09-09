import { SecurityRole } from "@/lib/constants/enums";
import { requireAdminRoles } from "@/lib/auth/require-admin";
import { CustomerAdminClient } from "./CustomerAdminClient";

export default async function Page() {
  await requireAdminRoles([
    SecurityRole.PLATFORM_SUPER_ADMIN,
    SecurityRole.PARTNER_ADMIN,
    SecurityRole.CUSTOMER_ADMIN,
  ]);
  return <CustomerAdminClient />;
}
