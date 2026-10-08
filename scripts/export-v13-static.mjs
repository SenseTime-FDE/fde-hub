#!/usr/bin/env node

/**
 * 将同事交付的 v1.3 页面模板导出成 GitHub Pages 可直接托管的静态文件。
 *
 * 这里只复用公开页面的文案层、模板、CSS 和浏览器脚本；不会引入服务端、
 * SQLite、后台、账号体系或表单提交接口。生成结果会保留现有活动、招聘、
 * 技术内容中心、伙伴页面、Demo 和下载资源，并把新版导航指向这些静态入口。
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'static_source', 'v13');
const pages = require(path.join(sourceRoot, 'src', 'views', 'pages.js'));
const content = require(path.join(sourceRoot, 'src', 'content.js'));

const joinUrl = 'https://app.jingsocial.com/mF/commonLandingPage/CTA/6d34eaf60a434d7d8600094418b7a044?pushId=Das2J4qeZ5X6xGo4A5L7xn1';

function staticLinks(html) {
  let out = html;

  // 动态站里的服务端入口改回当前仓库中已经存在的静态页面。
  const exact = [
    ['/partners#apply', '/partners.html#join'],
    ['/partners#identity', '/partners.html#partners'],
    ['/partners#model', '/partners.html#partners'],
    ['/partners#isv', '/partners.html#partners'],
    ['/partners', '/partners.html'],
    ['/events', '/events.html'],
    ['/careers', '/careers.html'],
    ['/community', '/community/'],
    ['/privacy', '/privacy.html'],
  ];
  for (const [from, to] of exact) {
    out = out.replaceAll(`href="${from}"`, `href="${to}"`);
  }

  // 动态联系表单不进入 GitHub Pages；统一落到现有伙伴联系区。
  out = out.replace(/href="\/contact(?:\?[^"#]*)?(?:#[^"]*)?"/g, 'href="/partners.html#contact"');

  // 目录式输出显式保留结尾斜杠，本地 http.server 与 GitHub Pages 行为一致。
  out = out.replace(/href="\/solutions\/([a-z0-9-]+)(#[^"]*)?"/g, (_m, slug, hash = '') => `href="/solutions/${slug}/${hash}"`);
  out = out.replace(/href="\/solutions(#[^"]*)?"/g, (_m, hash = '') => `href="/solutions/${hash}"`);
  out = out.replace(/href="\/cloud-maas(#[^"]*)?"/g, (_m, hash = '') => `href="/cloud-maas/${hash}"`);

  // Header 中的申请按钮仍沿用已上线的公开落地页，不产生本地假提交。
  out = out.replace(/(<a\b[^>]*class="[^"]*btn-red btn-sm[^"]*"[^>]*?)href="\/partners\.html#join"/g, `$1href="${joinUrl}" target="_blank" rel="noopener"`);

  return out.replace('<!doctype html>', '<!doctype html>\n<!-- 本文件由 scripts/export-v13-static.mjs 生成，请修改 static_source/v13 后重新导出。 -->');
}

function write(relativePath, html) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, staticLinks(html).replace(/[ \t]+$/gm, ''));
}

function copyAsset(relativePath) {
  const from = path.join(sourceRoot, 'public', relativePath);
  const to = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

copyAsset('css/site.css');
copyAsset('js/site.js');
copyAsset('img/favicon.svg');
copyAsset('img/sensetime_logo_color.png');

const home = pages.home({ events: [] });
const solutions = pages.solutions();
const cloud = pages.cloudMaas();
const privacy = pages.privacy();

write('index.html', home);
write('solutions.html', solutions);
write('solutions/index.html', solutions);
write('cloud-maas.html', cloud);
write('cloud-maas/index.html', cloud);
write('tokenplan.html', cloud);
write('privacy.html', privacy);
write('privacy/index.html', privacy);

for (const slug of Object.keys(content.PRODUCTS)) {
  write(path.join('solutions', slug, 'index.html'), pages.product(slug));
}

console.log(`已导出首页、方案总览、${Object.keys(content.PRODUCTS).length} 个产品页、云端 MaaS 与隐私页。`);
