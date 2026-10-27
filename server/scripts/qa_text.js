'use strict';
/**
 * 文字门禁：渲染全部公开页面（含产品详情页），抽出可见文字，过两道门禁：
 *   qa_spelling.js 中文语境标点全角 · qa_terms.js 对客口径（署名、FDE、底座名、价格、状态词、小写英文词等）。
 * 两个门禁脚本与「商汤企业 AI 全栈产品套册」同源（FDE/eco_partnerships_enterprise_ai_solution/pptx_build/）。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.env.ALLFDE_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'allfde-qa-'));
const V = require('../src/views/pages');
const C = require('../src/content');

const pages = {
  home: V.home({ events: [] }), solutions: V.solutions(), cloud: V.cloudMaas(), partners: V.partners({ csrf: 'x' }),
  events: V.events({}), careers: V.careers({}), community: V.community({ csrf: 'x' }), contact: V.contact({ csrf: 'x' }), privacy: V.privacy(),
  thanks_lead: V.thanks('lead'), thanks_partner: V.thanks('partner'), thanks_community: V.thanks('community'), thanks_event: V.thanks('event'), thanks_job: V.thanks('job'), notfound: V.notFound(),
};
for (const slug of Object.keys(C.PRODUCTS)) pages[`product_${slug}`] = V.product(slug);

const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/a|\/span|\/b|\/dt|\/dd|\/th|\/td|\/option|\/label|\/small|\/em)>/g, '$&\n')
  .replace(/(content|alt|placeholder|aria-label)="([^"]*)"/g, '>$2<');
const dump = path.join(os.tmpdir(), `allfde_text_dump_${process.pid}.html`);
fs.writeFileSync(dump, '<!doctype html><html><body>' + Object.entries(pages).map(([k, h]) => `<section data-page="${k}">${strip(h)}</section>`).join('\n') + '</body></html>');

let ok = true;
for (const gate of ['qa_spelling.js', 'qa_terms.js']) {
  console.log(`=== ${gate} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, gate), dump], { stdio: 'inherit' });
  if (r.status !== 0) ok = false;
}
fs.rmSync(dump, { force: true });
fs.rmSync(process.env.ALLFDE_DATA, { recursive: true, force: true });
console.log(ok ? '文字门禁全部通过' : '文字门禁未通过');
process.exit(ok ? 0 : 1);
