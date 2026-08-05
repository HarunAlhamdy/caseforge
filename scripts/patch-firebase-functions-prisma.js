/**
 * Patch Firebase frameworks SSR functions package so Cloud Functions
 * has prisma schema + generated client (and can regenerate on install).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const functionsDir = path.join(root, ".firebase", "caseforge", "functions");

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

if (!fs.existsSync(functionsDir)) {
  console.error("Missing .firebase/caseforge/functions — run firebase build/deploy first");
  process.exit(1);
}

const schemaSrc = path.join(root, "prisma", "schema.prisma");
fs.mkdirSync(path.join(functionsDir, "prisma"), { recursive: true });
fs.copyFileSync(schemaSrc, path.join(functionsDir, "prisma", "schema.prisma"));

copyDir(
  path.join(root, "node_modules", ".prisma"),
  path.join(functionsDir, "node_modules", ".prisma")
);
copyDir(
  path.join(root, "node_modules", "@prisma", "client"),
  path.join(functionsDir, "node_modules", "@prisma", "client")
);

// Also nest under .next/standalone if present (Firebase layouts vary)
const nestedStandalone = path.join(functionsDir, ".next", "standalone");
if (fs.existsSync(nestedStandalone)) {
  copyDir(
    path.join(root, "node_modules", ".prisma"),
    path.join(nestedStandalone, "node_modules", ".prisma")
  );
  fs.mkdirSync(path.join(nestedStandalone, "prisma"), { recursive: true });
  fs.copyFileSync(
    schemaSrc,
    path.join(nestedStandalone, "prisma", "schema.prisma")
  );
}

const pkgPath = path.join(functionsDir, "package.json");
const rootPkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8")
);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts.postinstall = "prisma generate";
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies.prisma =
  rootPkg.dependencies.prisma || rootPkg.devDependencies?.prisma || "5.22.0";
pkg.dependencies["@prisma/client"] =
  rootPkg.dependencies["@prisma/client"] || "5.22.0";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const clientJs = path.join(
  functionsDir,
  "node_modules",
  ".prisma",
  "client",
  "index.js"
);
const schemaOk = fs.existsSync(
  path.join(functionsDir, "prisma", "schema.prisma")
);
console.log(
  `Patched functions: schema=${schemaOk} client=${fs.existsSync(clientJs)}`
);
if (!schemaOk || !fs.existsSync(clientJs)) process.exit(1);
