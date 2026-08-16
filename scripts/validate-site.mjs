import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const errors = [];
const warnings = [];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile()) files.push(fullPath);
  }
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function assertRequired(file) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`缺少必需文件：${file}`);
}

function localTarget(sourceFile, rawUrl) {
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("//") ||
    /^[a-z]+:\/\//i.test(trimmed)
  ) return null;

  let pathname = trimmed.split("#", 1)[0].split("?", 1)[0];
  if (!pathname) return null;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    errors.push(`${relative(sourceFile)} 包含无法解码的链接：${trimmed}`);
    return null;
  }

  const resolved = pathname.startsWith("/")
    ? path.join(root, pathname)
    : path.resolve(path.dirname(sourceFile), pathname);
  return pathname.endsWith("/") ? path.join(resolved, "index.html") : resolved;
}

function validateReferences(file, source) {
  const references = [];
  for (const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    references.push(match[1]);
  }
  if (file.endsWith(".css")) {
    for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      references.push(match[1]);
    }
  }
  for (const url of references) {
    const target = localTarget(file, url);
    if (target && !fs.existsSync(target)) {
      errors.push(`${relative(file)} 引用了不存在的本地文件：${url}`);
    }
  }
}

walk(root);

for (const file of [
  "CNAME",
  "index.html",
  "solutions.html",
  "tokenplan.html",
  "events.html",
  "careers.html",
  "partners.html",
  "forum.html",
  "community/index.html",
  "community/data/articles/index.json",
  "community/data/news.json"
]) assertRequired(file);

for (const forbidden of [
  "_v2_body.html",
  "_v2_style.css",
  "ai_native_sales/deck",
  "voxone/server",
  "voxone/server/voxone.db",
  "智能需求管理平台 Demo/build_prd.py"
]) {
  if (fs.existsSync(path.join(root, forbidden))) errors.push(`发布包不应包含：${forbidden}`);
}

for (const file of files) {
  const fileName = relative(file);
  const size = fs.statSync(file).size;
  if (size > 95 * 1024 * 1024) errors.push(`文件超过 95 MB 安全阈值：${fileName}`);
  if (/\.(html|css)$/i.test(file)) {
    const source = fs.readFileSync(file, "utf8");
    validateReferences(file, source);
    if (/data:application\/[^;,]+;base64,/i.test(source)) {
      errors.push(`${fileName} 仍包含内嵌应用文件`);
    }
  }
  if (fileName.endsWith(".json")) {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      errors.push(`${fileName} 不是有效 JSON：${error.message}`);
    }
  }
}

const stats = {
  files: files.length,
  bytes: files.reduce((sum, file) => sum + fs.statSync(file).size, 0),
  errors: errors.length,
  warnings: warnings.length
};

console.log(`静态站点校验：${stats.files} 个文件，${(stats.bytes / 1024 / 1024).toFixed(1)} MB，${stats.errors} 个错误，${stats.warnings} 个警告。`);
for (const warning of warnings) console.warn(`- 警告：${warning}`);
if (errors.length) {
  console.error(errors.map((item) => `- 错误：${item}`).join("\n"));
  process.exit(1);
}
