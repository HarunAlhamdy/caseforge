import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { sendVerificationForUser } from "@/server/services/email-verification-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * Always returns a generic success message to avoid email enumeration.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerifiedAt: true,
        isActive: true,
      },
    });

    if (user?.isActive && !user.emailVerifiedAt) {
      try {
        await sendVerificationForUser(prisma, user.id);
      } catch (err) {
        console.error("[resend-verification]", err);
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an unverified account exists for that email, a verification link has been sent.",
    });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Could not resend verification email" },
      { status: 500 },
    );
  }
}
