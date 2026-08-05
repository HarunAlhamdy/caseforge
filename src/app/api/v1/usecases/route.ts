import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

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
