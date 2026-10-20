import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadData() {
  const context = { window: {} };
  vm.runInNewContext(read("js/data.js"), context);
  return context.window.FDE_DATA;
}

test("restored demo inventory remains a single data-driven list", () => {
  const { CATEGORIES, PROJECTS } = loadData();

  assert.equal(PROJECTS.length, 23);
  assert.equal(PROJECTS.filter((project) => project.spotlight).length, 2);
  assert.deepEqual(
    Array.from(PROJECTS.filter((project) => project.spotlight), (project) => project.title),
    ["点餐推荐助手 Agent", "智媒平台"]
  );

  const categoryKeys = new Set(Array.from(CATEGORIES, (category) => category.key));
  for (const project of PROJECTS) {
    assert.ok(categoryKeys.has(project.cat), `${project.title} uses an unknown category`);
    if (project.type !== "qr") assert.match(project.url, /^https:\/\//, `${project.title} needs an HTTPS URL`);
  }
});

test("login-gated external content is not presented as anonymously accessible", () => {
  const { PROJECTS } = loadData();
  const gated = Array.from(PROJECTS).filter((project) => /(?:my\.)?feishu\.cn/.test(project.url || ""));

  assert.equal(gated.length, 3);
  for (const project of gated) assert.equal(project.access, "login", `${project.title} must disclose its login boundary`);
});

test("public inventory keeps customer names out of public labels", () => {
  const { PROJECTS } = loadData();
  const publicCopy = JSON.stringify(PROJECTS);

  assert.doesNotMatch(publicCopy, /WAGAS/i);
  assert.doesNotMatch(publicCopy, /人民日报/);
});

test("restored QR asset and generated gallery shell are publishable", () => {
  const { PROJECTS } = loadData();
  const qr = PROJECTS.find((project) => project.type === "qr");
  assert.ok(qr, "the recovered mini-program entry is missing");
  assert.ok(fs.existsSync(path.join(root, qr.qr)), "the recovered QR image is missing");

  const html = read("demos.html");
  assert.match(html, /id="demoFeatured"/);
  assert.match(html, /id="demoGrid"/);
  assert.match(html, /src="\/js\/data\.js"/);
  assert.match(html, /src="\/js\/demos\.js"/);
  assert.match(html, /不代表真实客户信息/);

  assert.match(read("css/demos.css"), /\.demo-card\[hidden\]\s*{\s*display:\s*none;/);
});
