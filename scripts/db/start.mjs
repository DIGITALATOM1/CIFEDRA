import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");
const composeFile = "infra/postgres/docker-compose.yml";

execFileSync("docker", ["compose", "-f", composeFile, "up", "-d", "--wait"], {
  cwd: rootDir,
  stdio: "inherit"
});

console.log("CIFEDRA PostgreSQL is running on 127.0.0.1:54327.");
