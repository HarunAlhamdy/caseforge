import { NextResponse } from "next/server";

const API_KEY = process.env.CASEFORGE_API_KEY ?? "dev-api-key-change-me";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
