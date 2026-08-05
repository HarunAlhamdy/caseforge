import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { UseCaseStatus } from "@prisma/client";
import * as XLSX from "xlsx";

export async function importPortfolioFromExcel(
  scopedDb: PrismaClient,
  tenantId: string,
  userId: string,
  base64: string,
) {
  const buffer = Buffer.from(base64, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!];
  if (!sheet) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Empty workbook" });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const title = String(row.Title ?? row.title ?? "").trim();
    const businessUnit = String(
      row.Directorate ?? row["Business Unit"] ?? row.businessUnit ?? "General",
    ).trim();
    if (!title) continue;

    try {
      const count = await scopedDb.useCase.count({ where: { tenantId } });
      await scopedDb.useCase.create({
        data: {
          tenantId,
          title,
          businessUnit,
          useCaseNumber: `UC-IMP-${String(count + 1).padStart(4, "0")}`,
          submittedById: userId,
          problemStatement: String(
            row["Problem Statement"] ?? row.problemStatement ?? title,
          ),
          proposedSolution: String(
            row["Proposed Solution"] ?? row.proposedSolution ?? "Imported via Excel",
          ),
          status: UseCaseStatus.ACTIVE,
          currentStage: "INTAKE_DRAFT",
        },
      });
      imported += 1;
    } catch (e) {
      errors.push(`${title}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return { imported, errors, totalRows: rows.length };
}

export function buildPortfolioWorkbook(
  rows: Array<Record<string, unknown>>,
): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: "No use cases" }]);
  XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildGateReportWorkbook(
  rows: Array<Record<string, unknown>>,
): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: "No gated cases" }]);
  XLSX.utils.book_append_sheet(wb, ws, "Gate Report");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
