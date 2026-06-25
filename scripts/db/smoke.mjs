import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");

execFileSync("npm", ["run", "db:start"], {
  cwd: rootDir,
  stdio: "inherit"
});
execFileSync("npm", ["run", "db:migrate"], {
  cwd: rootDir,
  stdio: "inherit"
});
execFileSync("npm", ["-w", "@cifedra/postgres", "run", "smoke"], {
  cwd: rootDir,
  stdio: "inherit"
});
