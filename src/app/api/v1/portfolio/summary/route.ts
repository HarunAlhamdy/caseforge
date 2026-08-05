import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getDashboardSummary } from "@/server/services/dashboard-service";

const API_KEY = process.env.CASEFORGE_API_KEY ?? "dev-api-key-change-me";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
