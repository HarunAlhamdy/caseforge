/**
 * Ensures Firebase SSR function package has prisma schema + generate.
 * Firebase frameworks strips prisma/; we inject it after the local build
 * by relying on Next file tracing of src/generated/prisma (see next.config).
 * This script is a safety net: generate client before deploy.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const schema = path.join(root, "prisma", "schema.prisma");
const outDir = path.join(root, "src", "generated", "prisma");

if (!fs.existsSync(schema)) {
  console.error("Missing prisma/schema.prisma");
  process.exit(1);
}

console.log("Running prisma generate (debian + native binaries)...");
execSync("npx prisma generate", { cwd: root, stdio: "inherit" });

if (!fs.existsSync(path.join(outDir, "index.js"))) {
  console.error("Prisma generate did not produce src/generated/prisma");
  process.exit(1);
}

console.log("Prisma client ready at src/generated/prisma");
