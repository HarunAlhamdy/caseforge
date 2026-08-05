/** Keep vendor/prisma-ensure/schema.prisma in sync with prisma/schema.prisma */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "prisma", "schema.prisma");
const destDir = path.join(root, "vendor", "prisma-ensure");
const dest = path.join(destDir, "schema.prisma");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("[sync-prisma-ensure] schema synced");
