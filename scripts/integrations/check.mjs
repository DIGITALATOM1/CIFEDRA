import { execFileSync } from "node:child_process";

const services = [
  {
    name: "Plane CE",
    kind: "tasks",
    url: "http://localhost:8082"
  },
  {
    name: "Chatwoot CE",
    kind: "chat",
    url: "http://localhost:8083"
  }
];

const dockerPath = findDocker();
const dockerVersion = dockerPath ? commandOutput(dockerPath, ["--version"]) : null;
const composeVersion = dockerPath ? commandOutput(dockerPath, ["compose", "version"]) : null;
const dockerInfo = dockerPath ? commandOutput(dockerPath, ["info", "--format", "{{.ServerVersion}}"]) : null;

printRuntimeStatus({
  dockerPath,
  dockerVersion,
  composeVersion,
  dockerInfo
});

for (const service of services) {
  const status = await checkUrl(service.url);
  const marker = status.reachable ? "ok" : "wait";
  const detail = status.reachable ? `HTTP ${status.status}` : status.error;
  console.log(`[${marker}] ${service.name} (${service.kind}) ${service.url} - ${detail}`);
}

function printRuntimeStatus(status) {
  if (!status.dockerPath) {
    console.log("[wait] Docker CLI is not installed or is not in PATH.");
    console.log("[hint] Install and start Docker Desktop, then run npm run integrations:check.");
    return;
  }

  console.log(`[ok] Docker CLI: ${status.dockerVersion}`);

  if (status.composeVersion) {
    console.log(`[ok] Docker Compose: ${status.composeVersion}`);
  } else {
    console.log("[wait] Docker Compose plugin is not available.");
  }

  if (status.dockerInfo) {
    console.log(`[ok] Docker Engine is running: ${status.dockerInfo}`);
  } else {
    console.log("[wait] Docker Engine is not reachable. Start Docker Desktop.");
  }
}

function commandPath(command) {
  try {
    return execFileSync("sh", ["-lc", `command -v ${command}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function findDocker() {
  return commandPath("docker") ?? appBundleDocker();
}

function appBundleDocker() {
  const path = "/Applications/Docker.app/Contents/Resources/bin/docker";
  const version = commandOutput(path, ["--version"]);

  return version ? path : null;
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(2500)
    });

    return {
      reachable: true,
      status: response.status
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : "not reachable"
    };
  }
}
