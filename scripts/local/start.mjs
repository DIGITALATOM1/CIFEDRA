import {
  appendFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = resolve(import.meta.dirname, "../..");
const localDir = resolve(rootDir, ".local");
const logDir = resolve(localDir, "logs");
const pidFile = resolve(localDir, "pids.json");
const apiPort = Number(process.env.CIFEDRA_API_PORT ?? 3030);
const webPort = Number(process.env.CIFEDRA_WEB_PORT ?? 4177);

mkdirSync(logDir, { recursive: true });

const existing = readExistingPids();

if (existing.api && isRunning(existing.api.pid)) {
  throw new Error(`API already seems to be running on pid ${existing.api.pid}`);
}

if (existing.web && isRunning(existing.web.pid)) {
  throw new Error(`Web server already seems to be running on pid ${existing.web.pid}`);
}

await assertPortFree(apiPort, "API");
await assertPortFree(webPort, "Web");

const api = spawnManaged({
  name: "api",
  command: "npm",
  args: ["run", "dev:api"],
  env: {
    ...process.env,
    PORT: String(apiPort)
  }
});

const web = spawnManaged({
  name: "web",
  command: "python3",
  args: ["-m", "http.server", String(webPort)],
  env: process.env
});

const pids = {
  api: {
    pid: api.pid,
    url: `http://localhost:${apiPort}`,
    log: ".local/logs/api.log"
  },
  web: {
    pid: web.pid,
    url: `http://localhost:${webPort}/web/landing/`,
    log: ".local/logs/web.log"
  },
  startedAt: new Date().toISOString()
};

writeFileSync(pidFile, `${JSON.stringify(pids, null, 2)}\n`);

await waitForHttp(`http://localhost:${apiPort}/health`, "API");
await waitForHttp(`http://localhost:${webPort}/web/landing/`, "Web");

console.log("CIFEDRA local environment is running:");
console.log(`- API: ${pids.api.url}`);
console.log(`- Landing: ${pids.web.url}`);
console.log("- Logs: .local/logs/");
console.log("Run `npm run local:smoke` to test Life / Work / Skills.");
console.log("Run `npm run local:stop` to stop local services.");

function spawnManaged({ name, command, args, env }) {
  const logPath = resolve(logDir, `${name}.log`);
  appendFileSync(
    logPath,
    `\n--- ${new Date().toISOString()} starting ${name}: ${command} ${args.join(" ")} ---\n`
  );
  const logFd = openSync(logPath, "a");

  const child = spawn(command, args, {
    cwd: rootDir,
    detached: true,
    env,
    stdio: ["ignore", logFd, logFd]
  });
  child.unref();

  if (!child.pid) {
    throw new Error(`Failed to start ${name}`);
  }

  return child;
}

function readExistingPids() {
  if (!existsSync(pidFile)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(pidFile, "utf8"));
  } catch {
    return {};
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function assertPortFree(port, label) {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: "HEAD"
    });

    if (response.status < 500) {
      throw new Error(`${label} port ${port} is already in use`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("already in use")) {
      throw error;
    }
  }
}

async function waitForHttp(url, label) {
  const attempts = 30;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the local process finishes booting.
    }

    await delay(500);
  }

  throw new Error(`${label} did not become ready at ${url}`);
}
