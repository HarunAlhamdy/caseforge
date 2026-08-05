import { NextResponse } from "next/server";

const API_KEY = process.env.CASEFORGE_API_KEY ?? "dev-api-key-change-me";

function checkApiKey(request: Request): boolean {
  const key = request.headers.get("x-api-key");
  return key === API_KEY;
}

export async function GET(request: Request) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    version: "v1",
    status: "ok",
    endpoints: [
      "GET /api/v1/health",
      "GET /api/v1/usecases",
      "GET /api/v1/portfolio/summary",
    ],
  });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
