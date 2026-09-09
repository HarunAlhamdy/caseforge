/**
 * Firebase web frameworks runs `npm i --omit dev` inside
 * `.firebase/<site>/functions` AFTER stripping root scripts.
 * That leaves a stub `@prisma/client` ("did not initialize yet")
 * because prisma/schema.prisma is not copied into the functions package.
 *
 * This deploy wrapper:
 * 1. Ensures prisma generate (debian + native engines)
 * 2. Watches the functions package and copies schema + generated client
 *    as soon as npm install creates the stub (and keeps re-applying)
 * 3. Runs firebase deploy
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const siteId = "caseforge";
const functionsDir = path.join(root, ".firebase", siteId, "functions");
const schemaSrc = path.join(root, "prisma", "schema.prisma");
const prismaClientSrc = path.join(root, "node_modules", ".prisma");
const prismaPkgSrc = path.join(root, "node_modules", "@prisma", "client");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
  return true;
}

function isStubPrisma(clientIndexPath) {
  if (!fs.existsSync(clientIndexPath)) return true;
  const text = fs.readFileSync(clientIndexPath, "utf8");
  return text.includes("did not initialize yet");
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

/** Prefer .env.production over root .env for Cloud Function runtime secrets. */
function patchFunctionsEnv(reason) {
  const envPath = path.join(functionsDir, ".env");
  if (!fs.existsSync(functionsDir)) return false;
  const prod = parseEnvFile(path.join(root, ".env.production"));
  const rootEnv = parseEnvFile(path.join(root, ".env"));
  const current = parseEnvFile(envPath);
  const merged = { ...rootEnv, ...current, ...prod };
  // Never ship localhost DB to Cloud Functions
  const db = merged.DATABASE_URL || "";
  if (/localhost|127\.0\.0\.1/.test(db)) {
    console.warn(
      `[env-patch] ${reason}: refusing localhost DATABASE_URL — set .env.production`,
    );
    return false;
  }
  if (!merged.DATABASE_URL) return false;
  const lines = Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const next = lines + "\n";
  const prev = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (prev === next) return true;
  fs.writeFileSync(envPath, next);
  console.log(`[env-patch] ${reason}: wrote functions .env (DATABASE_URL host ok)`);
  return true;
}

function patchFunctionsPrisma(reason) {
  if (!fs.existsSync(functionsDir)) return false;

  try {
    patchFunctionsEnv(reason);
  } catch {
    /* ignore mid-build env races */
  }

  try {
    fs.mkdirSync(path.join(functionsDir, "prisma"), { recursive: true });
    if (fs.existsSync(schemaSrc)) {
      fs.copyFileSync(
        schemaSrc,
        path.join(functionsDir, "prisma", "schema.prisma"),
      );
    }
  } catch (err) {
    console.warn(
      `[prisma-patch] ${reason}: schema copy skipped`,
      err && err.message ? err.message : err,
    );
    return false;
  }

  const clientIndex = path.join(
    functionsDir,
    "node_modules",
    ".prisma",
    "client",
    "index.js",
  );

  // Copy schema early so @prisma/client postinstall can generate if it runs
  if (!fs.existsSync(path.join(functionsDir, "node_modules", "@prisma", "client"))) {
    return false;
  }

  if (!isStubPrisma(clientIndex) && fs.existsSync(path.join(
    functionsDir,
    "node_modules",
    ".prisma",
    "client",
    "schema.prisma",
  ))) {
    return false;
  }

  const okPrisma = copyDir(
    prismaClientSrc,
    path.join(functionsDir, "node_modules", ".prisma"),
  );
  copyDir(prismaPkgSrc, path.join(functionsDir, "node_modules", "@prisma", "client"));

  // Patch package.json so future installs keep prisma CLI
  const pkgPath = path.join(functionsDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.dependencies = pkg.dependencies || {};
      const rootPkg = JSON.parse(
        fs.readFileSync(path.join(root, "package.json"), "utf8"),
      );
      pkg.dependencies.prisma =
        rootPkg.dependencies.prisma || "5.22.0";
      // Keep a generate script even though frameworks strips scripts on rebuild
      pkg.scripts = { ...(pkg.scripts || {}), postinstall: "prisma generate" };
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch {
      /* ignore */
    }
  }

  const fixed = !isStubPrisma(clientIndex);
  if (okPrisma && fixed) {
    console.log(`[prisma-patch] ${reason}: generated client applied`);
  } else {
    console.warn(`[prisma-patch] ${reason}: incomplete patch (okPrisma=${okPrisma})`);
  }
  return fixed;
}

function ensureLocalGenerate() {
  const { execSync } = require("child_process");
  console.log("[deploy] prisma generate…");
  execSync("npx prisma generate", { cwd: root, stdio: "inherit" });
  const engine = fs
    .readdirSync(path.join(prismaClientSrc, "client"))
    .some((f) => f.includes("debian"));
  if (!engine) {
    throw new Error("Missing debian Prisma query engines — check binaryTargets");
  }
}

ensureLocalGenerate();

let patchCount = 0;
const timer = setInterval(() => {
  if (patchFunctionsPrisma(`poll#${++patchCount}`)) {
    // keep polling — npm i may rewrite stubs again
  }
}, 250);

// Also watch for directory creation
try {
  fs.mkdirSync(path.dirname(functionsDir), { recursive: true });
  fs.watch(path.dirname(functionsDir), { recursive: true }, (_e, filename) => {
    if (!filename) return;
    if (
      filename.includes("package.json") ||
      filename.includes(".prisma") ||
      filename.includes("@prisma")
    ) {
      patchFunctionsPrisma(`watch:${filename}`);
    }
  });
} catch {
  /* watch optional */
}

const args = [
  "deploy",
  "--only",
  "hosting:caseforge",
  "--project",
  "andventure-map",
  ...process.argv.slice(2),
];

console.log("[deploy] firebase", args.join(" "));
const child = spawn("firebase", args, {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  // Final patch attempt (in case upload already happened this still helps local verify)
  patchFunctionsPrisma("final");
  clearInterval(timer);

  const clientIndex = path.join(
    functionsDir,
    "node_modules",
    ".prisma",
    "client",
    "index.js",
  );
  const schemaOk = fs.existsSync(
    path.join(functionsDir, "prisma", "schema.prisma"),
  );
  const clientOk = fs.existsSync(clientIndex) && !isStubPrisma(clientIndex);
  console.log(
    `[deploy] post-check schema=${schemaOk} clientInitialized=${clientOk}`,
  );

  // If deploy succeeded but client still stub, fail loudly
  if (code === 0 && !clientOk) {
    console.error(
      "[deploy] WARNING: functions bundle still has uninitialized Prisma client.",
    );
    console.error(
      "[deploy] Re-running targeted functions upload after forced patch…",
    );
    if (patchFunctionsPrisma("force-retry")) {
      // Try deploying just the prepared functions artifact is not exposed;
      // re-run full deploy once more with patcher already warm.
      const retry = spawn(
        "firebase",
        ["deploy", "--only", "hosting:caseforge", "--project", "andventure-map"],
        { cwd: root, stdio: "inherit", shell: true, env: process.env },
      );
      const retryTimer = setInterval(() => patchFunctionsPrisma("retry-poll"), 200);
      retry.on("exit", (retryCode) => {
        clearInterval(retryTimer);
        patchFunctionsPrisma("retry-final");
        const ok =
          fs.existsSync(clientIndex) && !isStubPrisma(clientIndex);
        console.log(`[deploy] retry clientInitialized=${ok}`);
        process.exit(retryCode === 0 && ok ? 0 : retryCode || 1);
      });
      return;
    }
  }

  process.exit(code ?? 1);
});
