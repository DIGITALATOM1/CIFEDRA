import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../..");
const pidFile = resolve(rootDir, ".local/pids.json");

if (!existsSync(pidFile)) {
  console.log("No local CIFEDRA services pid file found.");
  process.exit(0);
}

const pids = JSON.parse(readFileSync(pidFile, "utf8"));

for (const serviceName of ["api", "web"]) {
  const pid = pids[serviceName]?.pid;

  if (!pid) {
    continue;
  }

  stopProcessGroup(pid, serviceName);
}

rmSync(pidFile, { force: true });
console.log("CIFEDRA local services stopped.");

function stopProcessGroup(pid, serviceName) {
  try {
    process.kill(-pid, "SIGTERM");
    console.log(`Stopped ${serviceName} process group ${pid}`);
  } catch (groupError) {
    try {
      process.kill(pid, "SIGTERM");
      console.log(`Stopped ${serviceName} process ${pid}`);
    } catch {
      console.log(`${serviceName} process ${pid} was not running`);
    }
  }
}
