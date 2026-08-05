import { PrismaClient, TenantType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { provisionTenant } from "@/server/services/scoring-model-service";

export const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(2).max(160).optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export async function registerSelfServeAccount(
  db: PrismaClient,
  input: RegisterInput,
) {
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  }

  const orgName =
    input.organizationName?.trim() ||
    `${input.name.trim()}'s workspace`;

  const { tenant, admin } = await provisionTenant(db, {
    name: orgName,
    type: TenantType.SELF_SERVE,
    adminEmail: email,
    adminName: input.name.trim(),
    password: input.password,
    subscriptionTier: "STARTER",
  });

  return {
    userId: admin.id,
    tenantId: tenant.id,
    email: admin.email,
    name: admin.name,
  };
}
