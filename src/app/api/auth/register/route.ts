import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import {
  registerInputSchema,
  registerSelfServeAccount,
} from "@/server/services/registration-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid registration payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await registerSelfServeAccount(prisma, parsed.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Registration failed";
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";

    if (code === "CONFLICT" || message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    // Prisma init / DB connectivity — surface clearly for ops
    console.error("[register]", err);
    return NextResponse.json(
      { error: message || "Registration failed" },
      { status: 500 },
    );
  }
}
