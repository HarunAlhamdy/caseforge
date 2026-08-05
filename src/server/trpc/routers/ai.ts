import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";
import { mapUseCaseToIntakeValues } from "@/lib/intake/mappers";
import {
  runCompletenessHeuristic,
  type CompletenessCheckResult,
} from "@/lib/intake/completeness-heuristic";
import { redactForLlm, redactObject } from "@/lib/ai/redaction";
import { createAiService } from "@/server/services/ai-service";
import { getPartnerDashboard } from "@/server/services/dashboard-service";

const completenessWarningSchema = z.object({
  warnings: z.array(
    z.object({
      severity: z.enum(["error", "warning", "suggestion"]),
      message: z.string(),
      section: z.string(),
      field: z.string().optional(),
    }),
  ),
  suggestedClassification: z.string().optional(),
  overallReadiness: z.string().optional(),
});

const questionsSchema = z.object({
  questions: z.array(
    z.object({
      dimension: z.string(),
      question: z.string(),
      rationale: z.string().optional(),
    }),
  ),
});

const classificationSchema = z.object({
  suggestedPattern: z.string(),
  confidence: z.string(),
  rationale: z.string(),
});

const insightsSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
  recommendations: z.array(z.string()),
});

function parseJsonContent<T>(
  content: string,
  schema: z.ZodType<T>,
): T | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? content);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export const aiRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => ({ router: "ai", ok: true })),

  completenessCheck: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }): Promise<CompletenessCheckResult> => {
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
      });
      if (!useCase) {
        return {
          warnings: [
            { severity: "error", message: "Use case not found", section: "submission" },
          ],
        };
      }

      const values = mapUseCaseToIntakeValues(useCase);
      const heuristic = runCompletenessHeuristic(values);

      if (!process.env.OPENAI_API_KEY) {
        return {
          ...heuristic,
          suggestedClassification: heuristic.suggestedClassification ?? suggestClassificationHeuristic(values),
        };
      }

      try {
        const ai = createAiService();
        const redacted = redactForLlm(values as unknown as Record<string, unknown>);
        const response = await ai.complete({
          systemPrompt:
            "You are a use case intake reviewer. Return ONLY valid JSON with warnings array, optional suggestedClassification, optional overallReadiness. Never repeat raw PII.",
          userPrompt: `Review this redacted intake:\n${redacted}`,
          model: "gpt-4o-mini",
          temperature: 0.1,
        });

        const parsed = parseJsonContent(response.content, completenessWarningSchema);
        if (parsed) return parsed;
      } catch {
        // fall through
      }

      return heuristic;
    }),

  suggestClassification: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
      });
      if (!useCase) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const values = mapUseCaseToIntakeValues(useCase);
      const heuristic = {
        suggestedPattern: suggestClassificationHeuristic(values),
        confidence: "medium",
        rationale: "Rule-based classification from intake signals",
      };

      if (!process.env.OPENAI_API_KEY) return heuristic;

      try {
        const ai = createAiService();
        const response = await ai.complete({
          systemPrompt:
            "Suggest an AI pattern classification. Return JSON: suggestedPattern, confidence, rationale.",
          userPrompt: redactForLlm({
            problemStatement: values.problemStatement,
            proposedSolution: values.proposedSolution,
            aiPattern: values.aiPattern,
            conversationalAiRequired: values.conversationalAiRequired,
          }),
          temperature: 0.2,
        });
        const parsed = parseJsonContent(response.content, classificationSchema);
        if (parsed) return parsed;
      } catch {
        // fallback
      }

      return heuristic;
    }),

  generateFeasibilityQuestions: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
        include: {
          feasibilityAssessments: true,
          hardGates: true,
        },
      });
      if (!useCase) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const fallback = generateQuestionsHeuristic(useCase);

      if (!process.env.OPENAI_API_KEY) return fallback;

      try {
        const ai = createAiService();
        const response = await ai.complete({
          systemPrompt:
            "Generate feasibility assessment questions for an AI use case. Return JSON with questions array (dimension, question, rationale).",
          userPrompt: redactForLlm({
            title: useCase.title,
            stage: useCase.currentStage,
            dataClassification: useCase.dataClassification,
            sourceSystemsText: useCase.sourceSystemsText,
            dqIssues: useCase.dqIssues,
            hardGateCount: useCase.hardGates.length,
          }),
          temperature: 0.3,
        });
        const parsed = parseJsonContent(response.content, questionsSchema);
        if (parsed) return parsed;
      } catch {
        // fallback
      }

      return fallback;
    }),

  naturalLanguageInsights: protectedProcedure
    .input(z.object({ query: z.string().min(3).max(500) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.access?.partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner cross-customer insights require partner context",
        });
      }

      const partnerData = await getPartnerDashboard(ctx.db, ctx.access.partnerId);
      const redactedSummary = redactObject({
        totalUseCases: partnerData.totalUseCases,
        customers: partnerData.customers.map((c) => ({ name: c.name })),
        stageDistribution: partnerData.stageDistribution,
        healthScores: partnerData.healthScores.map((h) => ({
          customer: h.tenantName,
          score: h.healthScore,
          count: h.useCaseCount,
        })),
      });

      const fallback = {
        summary: `Portfolio has ${partnerData.totalUseCases} active use cases across ${partnerData.customers.length} customers.`,
        highlights: partnerData.healthScores
          .slice(0, 3)
          .map((h) => `${h.tenantName}: health ${h.healthScore}/100 (${h.useCaseCount} cases)`),
        recommendations: [
          "Review customers with health scores below 60",
          "Balance consultant workload across assignments",
        ],
      };

      if (!process.env.OPENAI_API_KEY) {
        return { ...fallback, query: input.query, source: "heuristic" as const };
      }

      try {
        const ai = createAiService();
        const response = await ai.complete({
          systemPrompt:
            "Answer portfolio questions using aggregated redacted data only. Return JSON: summary, highlights[], recommendations[].",
          userPrompt: `Query: ${input.query}\n\nData:\n${JSON.stringify(redactedSummary, null, 2)}`,
          temperature: 0.2,
        });
        const parsed = parseJsonContent(response.content, insightsSchema);
        if (parsed) {
          return { ...parsed, query: input.query, source: "ai" as const };
        }
      } catch {
        // fallback
      }

      return { ...fallback, query: input.query, source: "heuristic" as const };
    }),
});

function suggestClassificationHeuristic(values: ReturnType<typeof mapUseCaseToIntakeValues>): string {
  if (values.conversationalAiRequired) return "Conversational AI / Agent";
  if (values.aiPattern) return String(values.aiPattern).replace(/_/g, " ");
  if (values.proposedSolution?.toLowerCase().includes("forecast")) return "Predictive Analytics";
  if (values.proposedSolution?.toLowerCase().includes("document")) return "Document Intelligence";
  return "Process Automation";
}

function generateQuestionsHeuristic(useCase: {
  title: string;
  dataClassification?: string | null;
  sourceSystemsText?: string | null;
  dqIssues?: string | null;
}) {
  const questions = [
    {
      dimension: "Data readiness",
      question: `What is the current quality and completeness of data sources for "${useCase.title}"?`,
      rationale: "Assess ingestion readiness",
    },
    {
      dimension: "Integration",
      question: "Which downstream systems require real-time vs batch integration?",
      rationale: "Scope integration effort",
    },
    {
      dimension: "Security",
      question: useCase.dataClassification
        ? `Confirm controls for ${useCase.dataClassification} classification.`
        : "Confirm data classification and access controls.",
      rationale: "Validate security posture",
    },
  ];

  if (useCase.dqIssues) {
    questions.push({
      dimension: "Data quality",
      question: "What remediation plan exists for known data quality issues?",
      rationale: useCase.dqIssues.slice(0, 80),
    });
  }

  return { questions };
}
