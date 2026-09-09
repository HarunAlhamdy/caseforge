import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { SecurityRole } from "@/lib/constants/enums";

export async function requireAdminRoles(allowed: SecurityRole[]) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true },
  });
  if (!dbUser?.isActive) {
    redirect("/login?disabled=1");
  }
  if (!allowed.includes(dbUser.role as SecurityRole)) {
    redirect("/dashboard");
  }
  return session;
}
