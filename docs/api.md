# CaseForge API Overview

CaseForge exposes a type-safe API via **tRPC v10** and standard Next.js route handlers.

## Health

- `GET /api/health` — Returns `{ "status": "ok" }`
- `trpc.health` — Returns `{ ok: true, ts: ISO timestamp }`

## Authentication

- `GET|POST /api/auth/*` — Auth.js v5 handlers (credentials + optional Google OAuth)
- Session uses JWT with claims: `userId`, `role`, `tenantId`

## tRPC Routers

All routers expose a `ping` query for connectivity checks:

| Router | Prefix |
|--------|--------|
| usecase | `trpc.usecase.ping` |
| scoring | `trpc.scoring.ping` |
| workflow | `trpc.workflow.ping` |
| architecture | `trpc.architecture.ping` |
| evaluation | `trpc.evaluation.ping` |
| financial | `trpc.financial.ping` |
| admin | `trpc.admin.ping` |
| partner | `trpc.partner.ping` |
| ai | `trpc.ai.ping` |
| import | `trpc.import.ping` |
| export | `trpc.export.ping` |

## Client Usage

```typescript
import { trpc } from "@/trpc/react";

// In a client component
const { data } = trpc.health.useQuery();
```

## Environment

See `.env.example` for required variables: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, optional OAuth, OpenAI, S3, and Resend keys.
