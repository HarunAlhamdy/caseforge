import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { verifyEmailToken } from "@/server/services/email-verification-service";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  token: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    token: searchParams.get("token") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing verification token" },
      { status: 400 },
    );
  }

  const result = await verifyEmailToken(prisma, parsed.data.token);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, email: result.email });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
    };
    const parsed = querySchema.safeParse({ token: body.token ?? "" });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Missing verification token" },
        { status: 400 },
      );
    }

    const result = await verifyEmailToken(prisma, parsed.data.token);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, email: result.email });
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.json(
      { ok: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
