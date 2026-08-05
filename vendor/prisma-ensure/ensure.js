/**
 * Runs during `npm i` inside Firebase's functions package.
 * Copies the bundled schema and generates the Prisma client with
 * debian query engines so SSR no longer hits the init stub.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bundledSchema = path.join(__dirname, "schema.prisma");
// node_modules/caseforge-prisma-ensure -> functions root
const functionsRoot = path.join(__dirname, "..", "..");
const schemaDir = path.join(functionsRoot, "prisma");
const schemaDest = path.join(schemaDir, "schema.prisma");

function log(...args) {
  console.log("[caseforge-prisma-ensure]", ...args);
}

try {
  if (!fs.existsSync(bundledSchema)) {
    log("bundled schema missing — skip");
    process.exit(0);
  }

  fs.mkdirSync(schemaDir, { recursive: true });
  fs.copyFileSync(bundledSchema, schemaDest);
  log("schema copied to", schemaDest);

  // Prefer local prisma binary from the functions install
  const prismaBin = path.join(
    functionsRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );
  const cmd = fs.existsSync(prismaBin)
    ? `node "${prismaBin}" generate --schema="${schemaDest}"`
    : `npx --yes prisma@5.22.0 generate --schema="${schemaDest}"`;

  log("running", cmd);
  execSync(cmd, { cwd: functionsRoot, stdio: "inherit", env: process.env });

  const clientIndex = path.join(
    functionsRoot,
    "node_modules",
    ".prisma",
    "client",
    "index.js",
  );
  if (fs.existsSync(clientIndex)) {
    const text = fs.readFileSync(clientIndex, "utf8");
    if (text.includes("did not initialize yet")) {
      log("WARNING: client still uninitialized after generate");
      process.exitCode = 1;
    } else {
      log("Prisma client generated OK");
    }
  } else {
    log("WARNING: .prisma/client/index.js missing after generate");
    process.exitCode = 1;
  }
} catch (err) {
  log("generate failed:", err && err.message ? err.message : err);
  // Do not hard-fail npm install if generate races before prisma is extracted;
  // deploy wrapper still patches as a backup.
  process.exitCode = 0;
}
