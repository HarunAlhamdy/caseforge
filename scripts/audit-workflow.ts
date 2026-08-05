/**
 * End-to-end CaseForge workflow audit.
 * Motions: register → login → intake draft → submit → gate Pass →
 * profile approve → score → architecture stub → evaluation stub → delivery stub.
 *
 * Usage:
 *   npx tsx scripts/audit-workflow.ts
 *   BASE_URL=https://caseforge.web.app npx tsx scripts/audit-workflow.ts --live-only
 *   npx tsx scripts/audit-workflow.ts --local-only
 */
import { DataClassification, GateDecision, ProfileReviewStatus } from "@prisma/client";

type StepResult = { step: string; status: "PASS" | "FAIL" | "SKIP"; detail?: string };

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const LIVE_URL = "https://caseforge.web.app";
const args = new Set(process.argv.slice(2));
const localOnly = args.has("--local-only");
const liveOnly = args.has("--live-only");

const results: StepResult[] = [];

function record(step: string, status: StepResult["status"], detail?: string) {
  results.push({ step, status, detail });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "·";
  console.log(`${icon} [${status}] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function httpJson(
  base: string,
  path: string,
  init?: RequestInit & { cookieJar?: { cookie?: string } },
) {
  const headers = new Headers(init?.headers);
  if (init?.cookieJar?.cookie) headers.set("cookie", init.cookieJar.cookie);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (init?.cookieJar && setCookie.length) {
    const merged = new Map<string, string>();
    const existing = (init.cookieJar.cookie || "").split("; ").filter(Boolean);
    for (const c of existing) {
      const name = c.split("=")[0]!;
      merged.set(name, c);
    }
    for (const c of setCookie) {
      const part = c.split(";")[0]!;
      merged.set(part.split("=")[0]!, part);
    }
    init.cookieJar.cookie = [...merged.values()].join("; ");
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json, text };
}

/** Minimal tRPC HTTP mutation helper (non-batch). */
async function trpcMutation(
  base: string,
  path: string,
  input: unknown,
  cookieJar: { cookie?: string },
) {
  // superjson transformer wire format
  return httpJson(base, `/api/trpc/${path}`, {
    method: "POST",
    cookieJar,
    body: JSON.stringify({ json: input }),
    headers: {
      "content-type": "application/json",
    },
  });
}

async function trpcQuery(
  base: string,
  path: string,
  input: unknown,
  cookieJar: { cookie?: string },
) {
  const payload =
    input === undefined ? undefined : encodeURIComponent(JSON.stringify({ json: input }));
  const url =
    payload === undefined
      ? `/api/trpc/${path}`
      : `/api/trpc/${path}?input=${payload}`;
  return httpJson(base, url, {
    method: "GET",
    cookieJar,
  });
}

function unwrapTrpc(json: unknown): unknown {
  if (json && typeof json === "object" && "result" in json) {
    const r = (json as { result?: { data?: { json?: unknown } | unknown } }).result;
    if (r?.data && typeof r.data === "object" && r.data !== null && "json" in r.data) {
      return (r.data as { json: unknown }).json;
    }
    return r?.data;
  }
  if (Array.isArray(json) && json[0]) return unwrapTrpc(json[0]);
  return json;
}

async function loginCredentials(
  base: string,
  email: string,
  password: string,
  cookieJar: { cookie?: string },
) {
  const csrf = await httpJson(base, "/api/auth/csrf", { cookieJar });
  const csrfToken =
    csrf.json && typeof csrf.json === "object" && "csrfToken" in csrf.json
      ? String((csrf.json as { csrfToken: string }).csrfToken)
      : "";
  if (!csrfToken) throw new Error("No CSRF token");

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/dashboard`,
    json: "true",
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieJar.cookie || "",
    },
    body,
    redirect: "manual",
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const merged = new Map<string, string>();
  for (const c of (cookieJar.cookie || "").split("; ").filter(Boolean)) {
    merged.set(c.split("=")[0]!, c);
  }
  for (const c of setCookie) {
    const part = c.split(";")[0]!;
    merged.set(part.split("=")[0]!, part);
  }
  cookieJar.cookie = [...merged.values()].join("; ");

  const session = await httpJson(base, "/api/auth/session", { cookieJar });
  return { loginStatus: res.status, session };
}

const mandatoryIntake = {
  title: "Audit workflow invoice triage",
  businessUnit: "Finance",
  problemStatement: "Manual invoice triage is slow and error-prone across AP.",
  proposedSolution: "Use an LLM classifier with human approval gates.",
  expectedBenefits: "Cut cycle time 40% and reduce exceptions.",
  currentProcessDescription: "Analysts review email inboxes and ERP queues daily.",
  sourceSystemsText: "SAP, shared inbox",
  readSystems: "SAP FI, Exchange",
  dqIssues: "Vendor master duplicates; missing PO numbers",
  businessDomains: ["finance", "procurement"],
  dataOwner: "AP Director",
  dataSteward: "Data Steward Finance",
  dataClassification: DataClassification.INTERNAL,
  endUserPersonas: "AP analysts and controllers",
  submitterPriority: "High",
  estimatedTimeline: "Q3 pilot",
  recommendedAction: "Proceed to profile review after gate",
};

async function probeLiveStatic() {
  console.log("\n=== LIVE SITE PROBE ===", LIVE_URL);
  for (const path of ["/", "/signup", "/login", "/dashboard", "/api/auth/session", "/api/health"]) {
    try {
      const res = await fetch(`${LIVE_URL}${path}`, { redirect: "manual" });
      const ok =
        path === "/dashboard" || path === "/api/auth/session"
          ? res.status === 200 || res.status === 307 || res.status === 302
          : res.status >= 200 && res.status < 400;
      // dashboard may redirect unauthenticated users — 307 OK; 500 is FAIL
      const fail500 = res.status >= 500;
      record(
        `live ${path}`,
        fail500 ? "FAIL" : "PASS",
        `HTTP ${res.status}${ok ? "" : " (check)"}`,
      );
    } catch (e) {
      record(`live ${path}`, "FAIL", e instanceof Error ? e.message : String(e));
    }
  }

  // Prisma-init smoke: register endpoint should not return prisma init error
  try {
    const res = await fetch(`${LIVE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Probe",
        email: `probe-invalid-${Date.now()}@example.com`,
        password: "short",
      }),
    });
    const text = await res.text();
    if (text.includes("did not initialize yet")) {
      record("live prisma init (register)", "FAIL", "Prisma client not initialized");
    } else if (res.status === 400 || res.status === 201 || res.status === 409) {
      record(
        "live prisma init (register)",
        "PASS",
        `HTTP ${res.status} (client initialized; validation/DB may differ)`,
      );
    } else if (res.status >= 500) {
      record("live prisma init (register)", "FAIL", `HTTP ${res.status}: ${text.slice(0, 200)}`);
    } else {
      record("live prisma init (register)", "PASS", `HTTP ${res.status}`);
    }
  } catch (e) {
    record("live prisma init (register)", "FAIL", e instanceof Error ? e.message : String(e));
  }
}

async function runWorkflow(base: string, label: string) {
  console.log(`\n=== WORKFLOW AUDIT (${label}) ===`, base);
  const cookieJar: { cookie?: string } = {};
  const stamp = Date.now();
  const email = `audit.${stamp}@caseforge.test`;
  const password = "CaseForgeAudit1!";
  const name = `Audit User ${stamp}`;

  // 1. Register
  try {
    const { res, json, text } = await httpJson(base, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        organizationName: `Audit Org ${stamp}`,
      }),
    });
    if (text.includes("did not initialize yet")) {
      record(`${label} signup`, "FAIL", "Prisma not initialized");
      return;
    }
    if (!res.ok) {
      record(`${label} signup`, "FAIL", `HTTP ${res.status}: ${text.slice(0, 300)}`);
      return;
    }
    record(`${label} signup`, "PASS", `user ${(json as { userId?: string }).userId}`);
  } catch (e) {
    record(`${label} signup`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 2. Login
  try {
    const { session } = await loginCredentials(base, email, password, cookieJar);
    const user =
      session.json && typeof session.json === "object" && "user" in session.json
        ? (session.json as { user?: { email?: string } }).user
        : null;
    if (!user?.email) {
      record(`${label} login`, "FAIL", `session=${JSON.stringify(session.json).slice(0, 200)}`);
      return;
    }
    record(`${label} login`, "PASS", user.email);
  } catch (e) {
    record(`${label} login`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 3. Create intake draft
  let useCaseId = "";
  try {
    const { res, json, text } = await trpcMutation(
      base,
      "usecase.create",
      mandatoryIntake,
      cookieJar,
    );
    const data = unwrapTrpc(json) as { id?: string } | null;
    if (!res.ok || !data?.id) {
      record(`${label} intake create`, "FAIL", text.slice(0, 400));
      return;
    }
    useCaseId = data.id;
    record(`${label} intake create`, "PASS", useCaseId);
  } catch (e) {
    record(`${label} intake create`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 4. Update draft (ensure mandatory fields)
  try {
    const { res, text } = await trpcMutation(
      base,
      "usecase.update",
      { id: useCaseId, data: mandatoryIntake },
      cookieJar,
    );
    record(
      `${label} intake draft update`,
      res.ok ? "PASS" : "FAIL",
      res.ok ? undefined : text.slice(0, 300),
    );
  } catch (e) {
    record(`${label} intake draft update`, "FAIL", e instanceof Error ? e.message : String(e));
  }

  // 5. Submit
  try {
    const { res, text } = await trpcMutation(
      base,
      "usecase.submit",
      { id: useCaseId },
      cookieJar,
    );
    record(
      `${label} intake submit`,
      res.ok ? "PASS" : "FAIL",
      res.ok ? undefined : text.slice(0, 400),
    );
    if (!res.ok) return;
  } catch (e) {
    record(`${label} intake submit`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 6. Gate Pass
  try {
    const { res, text } = await trpcMutation(
      base,
      "usecase.recordGateDecision",
      {
        id: useCaseId,
        decision: GateDecision.PASS,
        rationale: "Audit script gate pass — problem and data path look sound.",
      },
      cookieJar,
    );
    record(
      `${label} gate Pass`,
      res.ok ? "PASS" : "FAIL",
      res.ok ? undefined : text.slice(0, 400),
    );
    if (!res.ok) return;
  } catch (e) {
    record(`${label} gate Pass`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 7. Profiles — approve all sections for this use case
  try {
    await trpcMutation(base, "profileReview.createAll", { useCaseId }, cookieJar);
    const queue = await trpcQuery(base, "profileReview.getMyQueue", undefined, cookieJar);
    const all = (unwrapTrpc(queue.json) as Array<{ id: string; useCaseId: string }> | null) ?? [];
    let list = all.filter((r) => r.useCaseId === useCaseId);
    if (!list.length) {
      // Fallback: queue may wrap differently
      const raw = queue.text;
      record(`${label} profiles`, "FAIL", `no reviews for use case: ${raw.slice(0, 300)}`);
      return;
    }
    for (const review of list) {
      const upd = await trpcMutation(
        base,
        "profileReview.update",
        {
          id: review.id,
          status: ProfileReviewStatus.APPROVED,
          reviewNotes: "Approved by audit script",
        },
        cookieJar,
      );
      if (!upd.res.ok) {
        record(`${label} profiles`, "FAIL", upd.text.slice(0, 300));
        return;
      }
    }
    record(`${label} profiles`, "PASS", `${list.length} sections approved`);
  } catch (e) {
    record(`${label} profiles`, "FAIL", e instanceof Error ? e.message : String(e));
    return;
  }

  // 8. Scoring
  try {
    const got = await trpcQuery(base, "scoring.getForUseCase", { useCaseId }, cookieJar);
    const payload = unwrapTrpc(got.json) as {
      drivers?: {
        value?: Array<{ driverId: string }>;
        feasibility?: Array<{ driverId: string }>;
        risk?: Array<{ driverId: string }>;
      };
      weights?: {
        valueDrivers?: Array<{ driverId: string }>;
        feasibilityDrivers?: Array<{ driverId: string }>;
        riskDrivers?: Array<{ driverId: string }>;
      };
    } | null;

    const driverIds: string[] = [];
    const buckets = [
      ...(payload?.drivers?.value ?? []),
      ...(payload?.drivers?.feasibility ?? []),
      ...(payload?.drivers?.risk ?? []),
      ...(payload?.weights?.valueDrivers ?? []),
      ...(payload?.weights?.feasibilityDrivers ?? []),
      ...(payload?.weights?.riskDrivers ?? []),
    ];
    for (const d of buckets) {
      if (d.driverId && !driverIds.includes(d.driverId)) driverIds.push(d.driverId);
    }

    if (!driverIds.length) {
      record(`${label} scoring`, "FAIL", `no drivers: ${got.text.slice(0, 300)}`);
    } else {
      const scores = driverIds.map((driverId) => ({
        driverId,
        score: 4,
        evidenceNotes: "Audit default score",
      }));
      const saved = await trpcMutation(
        base,
        "scoring.saveDriverScores",
        { useCaseId, scores },
        cookieJar,
      );
      if (!saved.res.ok) {
        record(`${label} scoring save`, "FAIL", saved.text.slice(0, 300));
      } else {
        const done = await trpcMutation(
          base,
          "scoring.completeScoring",
          { useCaseId },
          cookieJar,
        );
        record(
          `${label} scoring`,
          done.res.ok ? "PASS" : "FAIL",
          done.res.ok
            ? `${driverIds.length} drivers`
            : done.text.slice(0, 300),
        );
      }
    }
  } catch (e) {
    record(`${label} scoring`, "FAIL", e instanceof Error ? e.message : String(e));
  }

  // 9. Architecture stub
  try {
    const { res, text } = await trpcMutation(
      base,
      "architecture.save",
      {
        useCaseId,
        aiPattern: "RAG",
        modelHosting: "OPENAI_MANAGED",
        deploymentArch: "SERVERLESS",
      },
      cookieJar,
    );
    record(
      `${label} architecture`,
      res.ok ? "PASS" : "FAIL",
      res.ok ? "save stub" : text.slice(0, 300),
    );
  } catch (e) {
    record(`${label} architecture`, "FAIL", e instanceof Error ? e.message : String(e));
  }

  // 10. Evaluation stub — load questions then score first few
  try {
    const got = await trpcQuery(
      base,
      "evaluation.getAssessment",
      { useCaseId },
      cookieJar,
    );
    const payload = unwrapTrpc(got.json) as {
      dimensions?: Array<{ questions: Array<{ id: string }> }>;
    } | null;
    const questionIds =
      payload?.dimensions?.flatMap((d) => d.questions.map((q) => q.id)) ?? [];
    if (!questionIds.length) {
      record(
        `${label} evaluation`,
        got.res.ok ? "PASS" : "FAIL",
        got.res.ok ? "assessment readable (no questions yet)" : got.text.slice(0, 300),
      );
    } else {
      const scores = questionIds.slice(0, Math.min(3, questionIds.length)).map((questionId) => ({
        questionId,
        score: 4,
        evidenceNotes: "Audit stub",
      }));
      const { res, text } = await trpcMutation(
        base,
        "evaluation.saveAssessment",
        { useCaseId, scores },
        cookieJar,
      );
      record(
        `${label} evaluation`,
        res.ok ? "PASS" : "FAIL",
        res.ok ? `saved ${scores.length} scores` : text.slice(0, 300),
      );
    }
  } catch (e) {
    record(`${label} evaluation`, "FAIL", e instanceof Error ? e.message : String(e));
  }

  // 11. Delivery stub (wave plan read)
  try {
    const { res, text } = await trpcQuery(
      base,
      "workflow.getWavePlan",
      {},
      cookieJar,
    );
    record(
      `${label} delivery stub`,
      res.ok ? "PASS" : "FAIL",
      res.ok ? "wave plan readable" : text.slice(0, 300),
    );
  } catch (e) {
    record(`${label} delivery stub`, "FAIL", e instanceof Error ? e.message : String(e));
  }
}

async function main() {
  if (!localOnly) {
    await probeLiveStatic();
  }

  if (!liveOnly) {
    // Health check local
    try {
      const health = await fetch(`${BASE_URL}/api/health`);
      if (!health.ok) throw new Error(`health ${health.status}`);
      await runWorkflow(BASE_URL, "local");
    } catch (e) {
      record(
        "local server",
        "FAIL",
        `Not reachable at ${BASE_URL}: ${e instanceof Error ? e.message : String(e)}. Start Docker Postgres + npm run dev.`,
      );
    }
  }

  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  console.log(`PASS=${pass} FAIL=${fail} SKIP=${skip}`);
  for (const r of results.filter((x) => x.status === "FAIL")) {
    console.log(`  FAIL: ${r.step} — ${r.detail || ""}`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
