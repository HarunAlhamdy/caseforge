import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

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

  const useCases = await prisma.useCase.findMany({
    where: { tenantId: tenantHeader },
    select: {
      id: true,
      useCaseNumber: true,
      title: true,
      currentStage: true,
      priorityScore: true,
      rank: true,
    },
    take: 100,
    orderBy: { rank: "asc" },
  });

  return NextResponse.json({ data: useCases, count: useCases.length });
}
