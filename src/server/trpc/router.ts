import { createTRPCRouter, publicProcedure } from "./trpc";
import { usecaseRouter } from "./routers/usecase";
import { scoringRouter } from "./routers/scoring";
import { scoringModelRouter } from "./routers/scoring-model";
import { workflowRouter } from "./routers/workflow";
import { architectureRouter } from "./routers/architecture";
import { evaluationRouter } from "./routers/evaluation";
import { financialRouter } from "./routers/financial";
import { adminRouter } from "./routers/admin";
import { partnerRouter } from "./routers/partner";
import { aiRouter } from "./routers/ai";
import { importRouter } from "./routers/import";
import { exportRouter } from "./routers/export";
import { tenantRouter } from "./routers/tenant";
import { profileReviewRouter } from "./routers/profileReview";
import { notificationRouter } from "./routers/notification";
import { dashboardRouter } from "./routers/dashboard";
import { lifecycleRouter } from "./routers/lifecycle";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    ts: new Date().toISOString(),
  })),
  tenant: tenantRouter,
  usecase: usecaseRouter,
  scoring: scoringRouter,
  scoringModel: scoringModelRouter,
  workflow: workflowRouter,
  architecture: architectureRouter,
  evaluation: evaluationRouter,
  financial: financialRouter,
  admin: adminRouter,
  partner: partnerRouter,
  ai: aiRouter,
  import: importRouter,
  export: exportRouter,
  profileReview: profileReviewRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
  lifecycle: lifecycleRouter,
});

export type AppRouter = typeof appRouter;
