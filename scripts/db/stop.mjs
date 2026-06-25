import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");
const composeFile = "infra/postgres/docker-compose.yml";

execFileSync("docker", ["compose", "-f", composeFile, "down"], {
  cwd: rootDir,
  stdio: "inherit"
});

console.log("CIFEDRA PostgreSQL container stopped. Volume is preserved.");
