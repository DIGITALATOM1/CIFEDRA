import {
  appendFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = resolve(import.meta.dirname, "../..");
const localDir = resolve(rootDir, ".local");
const logDir = resolve(localDir, "logs");
const pidFile = resolve(localDir, "pids.json");
const apiPort = Number(process.env.CIFEDRA_API_PORT ?? 3030);
const webPort = Number(process.env.CIFEDRA_WEB_PORT ?? 4177);
const localIntegrationEnv = loadLocalIntegrationEnv();

mkdirSync(logDir, { recursive: true });

execFileSync("npm", ["-w", "@cifedra/core", "run", "build"], {
  cwd: rootDir,
  stdio: "inherit"
});

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
    ...localIntegrationEnv.values,
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
if (localIntegrationEnv.files.length > 0) {
  console.log(`- Loaded integration env: ${localIntegrationEnv.files.join(", ")}`);
}
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

function loadLocalIntegrationEnv() {
  const files = [
    resolve(localDir, "integrations", "chatwoot", "cifedra.env"),
    resolve(localDir, "integrations", "plane", "cifedra.env")
  ];
  const values = {};
  const loadedFiles = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    Object.assign(values, parseEnvFile(readFileSync(file, "utf8")));
    loadedFiles.push(file);
  }

  return {
    values,
    files: loadedFiles
  };
}

function parseEnvFile(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    values[key] = unquoteEnvValue(line.slice(separatorIndex + 1).trim());
  }

  return values;
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
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
