import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "index.html",
  "solutions.html",
  "tokenplan.html",
  "events.html",
  "careers.html",
  "community/index.html",
  "partners.html"
];
const labels = ["产品与方案", "Token Plan", "市场活动", "人才招聘", "技术交流", "加入生态"];
const navigationCss = fs.readFileSync(path.join(root, "css/navigation.css"), "utf8");
const navigationDesktopCss = navigationCss.slice(0, navigationCss.indexOf("@media"));

function readPage(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function stylesheetTags(head) {
  return [...head.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attribute(tag, "rel").toLowerCase() === "stylesheet");
}

test("global navigation pages load the shared navigation contract after page styles", () => {
  for (const file of pages) {
    const head = readPage(file).match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
    const stylesheets = stylesheetTags(head);
    const finalStylesheet = stylesheets.at(-1);

    assert.ok(finalStylesheet, `${file} has no stylesheet`);
    assert.match(attribute(finalStylesheet, "href"), /css\/navigation\.css$/i, `${file} must load navigation.css last`);
    assert.ok(head.lastIndexOf(finalStylesheet) > head.lastIndexOf("<style"), `${file} loads inline styles after navigation.css`);
  }
});

test("global navigation pages load the same Open Sans font source", () => {
  for (const file of pages) {
    assert.match(readPage(file), /fonts\.googleapis\.com\/css2\?family=Open\+Sans/i, `${file} is missing the shared navigation font`);
  }
});

test("global navigation pages expose the same ordered menu labels", () => {
  for (const file of pages) {
    const nav = readPage(file).match(/<nav\s+id=["']nav["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
    const actual = [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter((text) => labels.includes(text));

    assert.deepEqual(actual, labels, `${file} navigation labels differ`);
  }
});

test("global navigation pages load the shared identity slot", () => {
  for (const file of pages) {
    assert.match(readPage(file), /(?:\.\.\/|\.\/)?js\/auth\.js/i, `${file} is missing the shared identity slot`);
  }
});

test("shared navigation collapses before fixed desktop controls can overlap", () => {
  assert.match(
    navigationCss,
    /@media\s*\(max-width:\s*1060px\)\s*{[\s\S]*?#navUser\s*{\s*display:\s*none;/,
    "the optional identity slot must collapse before it can crowd the menu"
  );
  assert.match(
    navigationCss,
    /@media\s*\(max-width:\s*880px\)\s*{[\s\S]*?#nav \.nav-links\s*{\s*display:\s*none;/,
    "navigation links must remain available at common laptop widths"
  );
  assert.match(
    navigationDesktopCss,
    /#nav \.user-chip b\s*{[^}]*display:\s*none;/,
    "the optional user name must not consume navigation width"
  );
  assert.match(
    navigationCss,
    /@media\s*\(max-width:\s*1240px\)\s*{[\s\S]*?#nav \.fde-cap\s*{\s*display:\s*none;/,
    "the long brand caption must collapse before the navigation reaches its max width"
  );
});

test("shared navigation uses navigation-owned color tokens", () => {
  assert.doesNotMatch(
    navigationCss,
    /var\(--(?:ink|gray|gray-2|line|line-2|red|red-dark)(?:,|\))/,
    "page-level color variables must not change the shared navigation"
  );
});
