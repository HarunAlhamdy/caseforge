import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { SecurityRole } from "@/lib/constants/enums";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const anyAdmin: SecurityRole[] = [
    SecurityRole.PLATFORM_SUPER_ADMIN,
    SecurityRole.PARTNER_ADMIN,
    SecurityRole.CUSTOMER_ADMIN,
  ];
  if (!anyAdmin.includes(dbUser.role as SecurityRole)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
