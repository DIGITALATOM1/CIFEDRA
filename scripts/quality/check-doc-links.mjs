import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";

const rootDir = process.cwd();
const ignoredDirs = new Set([".git", ".local", "dist", "node_modules"]);
const markdownFiles = await findMarkdownFiles(rootDir);
const failures = [];

for (const filePath of markdownFiles) {
  const content = await readFile(filePath, "utf8");
  const linkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const href = match[1];

    if (!shouldCheck(href)) {
      continue;
    }

    const targetPath = resolveLinkTarget(filePath, href);

    if (!existsSync(targetPath)) {
      failures.push(`${relative(filePath)} -> ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Broken Markdown links:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Markdown links checked: ${markdownFiles.length} files.`);

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...await findMarkdownFiles(join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(join(directory, entry.name));
    }
  }

  return files;
}

function shouldCheck(href) {
  return !href.startsWith("#")
    && !href.startsWith("http://")
    && !href.startsWith("https://")
    && !href.startsWith("mailto:")
    && !href.startsWith("tel:")
    && !href.startsWith("file:");
}

function resolveLinkTarget(filePath, href) {
  const withoutAnchor = href.split("#")[0]?.split("?")[0] ?? "";
  const decoded = decodeURIComponent(withoutAnchor);

  return isAbsolute(decoded)
    ? decoded
    : resolve(dirname(filePath), decoded);
}

function relative(filePath) {
  return filePath.replace(`${rootDir}/`, "");
}
