import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getDashboardSummary } from "@/server/services/dashboard-service";

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

  const tenantHeader = request.headers.get("x-tenant-id");
  if (!tenantHeader) {
    return NextResponse.json(
      { error: "x-tenant-id header required" },
      { status: 400 },
    );
  }

  const summary = await getDashboardSummary(prisma, tenantHeader);
  return NextResponse.json({
    totalActive: summary.totalActive,
    funnel: summary.funnel,
    topUseCases: summary.topUseCases,
  });
}
