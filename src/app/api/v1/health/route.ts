import { NextResponse } from "next/server";

function requireApiKey(request: Request): NextResponse | null {
  const configured = process.env.CASEFORGE_API_KEY;
  if (!configured) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 503 },
    );
  }
  const key = request.headers.get("x-api-key");
  if (key !== configured) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
