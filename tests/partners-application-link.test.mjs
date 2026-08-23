import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../partners.html", import.meta.url), "utf8");

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1].match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "",
    className: match[1].match(/\bclass=["']([^"']+)["']/i)?.[1] ?? "",
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }));
}

test("top and bottom partner application CTAs use the same HTTPS landing page", () => {
  const links = anchors(source);
  const topApplication = links.find((link) => link.className.split(/\s+/).includes("nav-cta"));
  const bottomApplication = links.find((link) => link.text.startsWith("申请加入生态渠道"));

  assert.ok(topApplication, "missing top application CTA");
  assert.ok(bottomApplication, "missing bottom application CTA");
  assert.match(topApplication.href, /^https:\/\//);
  assert.equal(bottomApplication.href, topApplication.href);
});
