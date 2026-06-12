import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../..", import.meta.url).pathname;
const installerDir = join(rootDir, ".local", "installers");
const installerPath = join(installerDir, "Docker-Desktop-arm64.dmg");
const downloadUrl = "https://desktop.docker.com/mac/main/arm64/Docker.dmg";

mkdirSync(installerDir, {
  recursive: true
});

if (!existsSync(installerPath)) {
  console.log(`[wait] Docker Desktop installer is missing: ${installerPath}`);
  console.log(`[next] Download it from ${downloadUrl} or rerun the manual download command from the project notes.`);
  process.exit(1);
}

if (existsSync("/Applications/Docker.app")) {
  console.log("[ok] /Applications/Docker.app already exists.");
  openDocker();
  process.exit(0);
}

let mounted = false;

try {
  run("hdiutil", ["attach", installerPath]);
  mounted = true;

  const installResult = spawnSync("/Volumes/Docker/Docker.app/Contents/MacOS/install", ["--accept-license"], {
    stdio: "inherit"
  });

  if (installResult.status !== 0) {
    console.log("[wait] Docker Desktop CLI install did not finish. Trying app copy fallback.");
    run("ditto", ["/Volumes/Docker/Docker.app", "/Applications/Docker.app"]);
  }
} finally {
  if (mounted) {
    run("hdiutil", ["detach", "/Volumes/Docker"]);
  }
}

if (!existsSync("/Applications/Docker.app")) {
  console.log("[wait] Docker Desktop install did not finish. Open the DMG manually if macOS asks for UI confirmation.");
  process.exit(1);
}

openDocker();

function openDocker() {
  run("open", ["-a", "Docker"]);
  console.log("[next] Finish Docker Desktop onboarding if macOS shows a dialog, then run npm run integrations:check.");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
