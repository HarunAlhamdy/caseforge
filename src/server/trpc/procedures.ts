import { t } from "./trpc";
import {
  auditMiddleware,
  authMiddleware,
  tenantMiddleware,
} from "./middleware";

export const protectedProcedure = t.procedure
  .use(authMiddleware)
  .use(tenantMiddleware);

export const auditedProcedure = protectedProcedure.use(auditMiddleware);
