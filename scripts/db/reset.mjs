import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");
const composeFile = "infra/postgres/docker-compose.yml";

execFileSync("docker", ["compose", "-f", composeFile, "down", "-v"], {
  cwd: rootDir,
  stdio: "inherit"
});

console.log("CIFEDRA PostgreSQL container and local volume were removed.");
