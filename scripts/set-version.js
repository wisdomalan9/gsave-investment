const fs = require("fs");
const { execSync } = require("child_process");

let version;

try {
  version = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  version = Date.now().toString();
}

fs.writeFileSync(
  "public/version.json",
  JSON.stringify({
    version,
    updatedAt: new Date().toISOString()
  }, null, 2) + "\n"
);

console.log(`GSAVE build version: ${version}`);
