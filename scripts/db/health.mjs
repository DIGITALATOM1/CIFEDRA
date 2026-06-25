import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");
const composeFile = "infra/postgres/docker-compose.yml";

execFileSync(
  "docker",
  [
    "compose",
    "-f",
    composeFile,
    "exec",
    "-T",
    "postgres",
    "pg_isready",
    "-U",
    "cifedra_root",
    "-d",
    "cifedra_core"
  ],
  {
    cwd: rootDir,
    stdio: "inherit"
  }
);
