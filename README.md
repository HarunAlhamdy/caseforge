# CaseForge

AI use-case portfolio management platform with multi-tenant scoring, lifecycle workflow, partner dashboards, and AI-assisted intake review.

**Production target:** [https://caseforge.web.app](https://caseforge.web.app)

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Firebase CLI (`npm i -g firebase-tools`) for hosting deploy

## Quick start

```bash
# 1. Install dependencies
npm ci

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Configure environment
cp .env.example .env
# Edit DATABASE_URL, AUTH_SECRET, optional OPENAI_API_KEY / RESEND_API_KEY

# 4. Push schema & seed demo data
npm run db:push
npm run db:seed

# 5. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Platform admin | admin@caseforge.local | CaseForge123! |
| Partner admin | partner.admin@parkplace.example | CaseForge123! |
| Consultant | consultant@parkplace.example | CaseForge123! |
| Customer admin (Acme) | admin@acme-federal.example | CaseForge123! |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Start production server |
| `npm test` | Run Vitest unit tests |
| `npm run db:push` | Apply Prisma schema to Postgres |
| `npm run db:seed` | Seed demo partner, customers, use cases |
| `npm run db:studio` | Prisma Studio |
| `npm run deploy:firebase` | Build + deploy Firebase hosting/App Hosting |

## Docker

```bash
# Postgres only (default)
docker compose up -d postgres

# Full stack (app + Postgres)
docker compose --profile full up -d
```

The `Dockerfile` builds a standalone Next.js image suitable for Cloud Run or local production.

## Firebase deployment (caseforge.web.app)

CaseForge uses **Next.js standalone SSR** with PostgreSQL. Recommended deployment path:

### Option A — Firebase App Hosting (preferred)

1. Create Firebase project `caseforge` and link hosting site `caseforge.web.app`
2. Configure secrets in Firebase: `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `CASEFORGE_API_KEY`
3. Point Cloud SQL or external Postgres at `DATABASE_URL`
4. Deploy:

```bash
firebase login
firebase use caseforge
npm run deploy:firebase
```

`apphosting.yaml` defines build/run commands and environment. App Hosting runs the standalone Node server.

### Option B — Cloud Run + Firebase Hosting rewrites

1. Build and push Docker image to Artifact Registry
2. Deploy Cloud Run service named `caseforge` in `us-central1`
3. `firebase.json` rewrites all routes to the Cloud Run service
4. Run `firebase deploy --only hosting`

### Static export note

Full SSR features (tRPC, auth, API routes) require the Node server. Static `next export` is **not** recommended for production; use App Hosting or Cloud Run instead.

## Public API (v1 stubs)

All routes require header `x-api-key: <CASEFORGE_API_KEY>`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1` | API discovery |
| `GET /api/v1/health` | Health check |
| `GET /api/v1/usecases` | List use cases (`x-tenant-id` required) |
| `GET /api/v1/portfolio/summary` | Portfolio summary (`x-tenant-id` required) |

## Testing

```bash
npm test
npm run build
```

## Architecture highlights

- **Workflow:** 15-stage lifecycle with guards, transitions, timeline UI
- **Notifications:** In-app + Resend email with partner-level broadcasts
- **Dashboards:** 11 Recharts widgets, executive & partner views
- **AI:** Completeness check, classification, feasibility questions, NL insights (with PII redaction)
- **Import/export:** Excel portfolio & gate reports via tRPC
