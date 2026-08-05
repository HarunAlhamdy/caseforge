/**
 * After `next build`, ensure standalone output has Prisma schema + engines
 * so Firebase frameworks packaging ships a working @prisma/client.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

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

if (!fs.existsSync(standalone)) {
  console.warn("No .next/standalone — skip prisma copy");
  process.exit(0);
}

const prismaClientSrc = path.join(root, "node_modules", ".prisma");
const prismaClientDest = path.join(standalone, "node_modules", ".prisma");
const prismaPkgSrc = path.join(root, "node_modules", "@prisma", "client");
const prismaPkgDest = path.join(standalone, "node_modules", "@prisma", "client");
const schemaSrc = path.join(root, "prisma", "schema.prisma");
const schemaDestDir = path.join(standalone, "prisma");

let ok = true;
if (!copyDir(prismaClientSrc, prismaClientDest)) {
  console.error("Missing node_modules/.prisma — run prisma generate");
  ok = false;
}
if (!copyDir(prismaPkgSrc, prismaPkgDest)) {
  console.error("Missing node_modules/@prisma/client");
  ok = false;
}
fs.mkdirSync(schemaDestDir, { recursive: true });
fs.copyFileSync(schemaSrc, path.join(schemaDestDir, "schema.prisma"));

// Marker for verification
const engineOk = fs
  .readdirSync(path.join(prismaClientDest, "client"))
  .some((f) => f.includes("debian"));
console.log(
  `Prisma copied into standalone (debian engines: ${engineOk ? "yes" : "NO"})`
);
process.exit(ok && engineOk ? 0 : 1);
