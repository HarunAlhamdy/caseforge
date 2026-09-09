import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateCredentials,
  createSessionToken,
  sessionCookieHeader,
} from "@/server/auth/credentials-login";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Credentials login that sets Firebase-compatible `__session` cookie.
 * Avoids Auth.js CSRF double-submit cookies, which Firebase Hosting strips.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
        { status: 400 },
      );
    }

    const result = await authenticateCredentials(parsed.data);
    if (!result.ok) {
      if (result.code === "EMAIL_NOT_VERIFIED") {
        return NextResponse.json(
          {
            error:
              "Your email is not verified. Check your inbox for a verification link, or resend it below.",
            code: "EMAIL_NOT_VERIFIED",
            email: result.email,
          },
          { status: 403 },
        );
      }
      if (result.code === "ACCOUNT_DISABLED") {
        return NextResponse.json(
          {
            error: "This account has been disabled. Contact an administrator.",
            code: "ACCOUNT_DISABLED",
          },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    const token = await createSessionToken(result.user);
    const res = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
    res.headers.set("Set-Cookie", sessionCookieHeader(token));
    res.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, max-age=0, must-revalidate",
    );
    return res;
  } catch (err) {
    console.error("[credentials-login]", err);
    return NextResponse.json(
      { error: "Sign in failed" },
      { status: 500 },
    );
  }
}
