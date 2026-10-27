#!/usr/bin/env node
/**
 * 口径门禁（企业 AI 一体化解决方案 · 对客方案稿）：扫描组装后的全部文字（含讲者备注），发现禁用词即列出并以退出码 1 中止构建。
 * 规则来源：CLAUDE.md 第三节（署名、FDE 对客口径、品牌与模型命名）、第六节（客户信息与对内边界）；
 *   各模块事实包：FDE/raccoon_salesbuddy/docs/产品口径.md、FDE/eco_partnerships_raccoon_x_agent_platform/docs/口径与来源说明.md、
 *   FDE/fde_management_platform/docs/口径与来源说明.md、FDE/eco_partnerships_maas_platform_plan/docs/口径与来源说明.md、
 *   FDE/eco_partnerships_token_plan_platform_intro/docs/口径与来源说明.md。
 * 改编自 FDE/eco_partnerships_maas_platform_plan/pptx_build/qa_terms.js：本 deck 对客，底座来源平台、开源组件名、价格、内部机制一律不出现。
 * 用法：node qa_terms.js <文本文件 ...>（build.js 传入 build/_text_dump.html）
 */
const fs = require('fs');
const RULES = [
  { re: /(?<!「)待确认(?!」)|待定|命名待定|以正式[^，。；」]{0,6}为准|以实际交付为准|以伙伴(实际)?上架为准|经 ?POC 验证后定型/g, why: '不确定的内容不进对客套册（用户 2026-10-06：不确定性的不要包含进来）；产品功能「缺失项保留「待确认」」带引号可用' },
  { re: /神码|神州数码|东方大唐|通天云|创通新科|电信国际|中国电信|CTG|人民日报|健康报|妇女报|史伟莎|翼飞|创业酵母|建信|京东方|上合组织|中海油|君度|亿联|中电金信|蚂蚁数科|一只智能|科度|国金证券|北大国发院|浙商会|苏商会|浪潮|招商银行|Udesk|美洽|三节课|中智|涂鸦|WorkBuddy|意畅/g, why: '客户与伙伴名称不进对客通用方案（CLAUDE.md 第六节）' },
  { re: /韩启微|李鹏程|张家涛|金豫玮/g, why: '内部人名不进对客材料' },
  { re: /实习生|(?<![0-9])1\s*[:：]\s*[35](?![0-9])|梯队|内部组织训练|Lite\s*FDE|L1\s*[–-]\s*L3|非销售\s*FDE|四本账|三本账|七个数/g, why: 'FDE 对客只讲「商汤原厂落地陪跑 / 客户成功服务」，不讲内部机制（CLAUDE.md 第三节第 4 条）' },
  { re: /CNI|[Cc]hannel/g, why: '署名只用「商汤科技 · 大模型生态渠道部 / SenseTime · Ecosystem Partnerships」' },
  { re: /Dify|(?<!Raccoon )X\s*中台|newAPI|OneAPI|LiteLLM/g, why: '对客不提底座来源平台与开源底座名（CLAUDE.md 第三节第 6 条 Raccoon X）' },
  { re: /PaddleOCR|Docling|MinerU|Qwen|ColQwen|BGE|GME|Milvus|Qdrant|Vespa|RAGFlow|RAG-Anything|FunASR|MOSS|3D-Speaker|PySceneDetect|Elasticsearch/g, why: 'RAG 选型组件名属对内调研，对客只讲通用层名' },
  { re: /SenseAudio|S2\s*旗舰|日日新\s*S2|senseaudio/g, why: 'MaaS / Token Plan 项目口径（2026-09-28）：页面不出现 SenseAudio 与原旗舰文本模型；本 deck 模型只写「日日新」家族名' },
  { re: /SG27|PL150|PPL|Quota|利润空间|预付门槛|分润|分成比例|供货价|总代|二代|一级代理|二级代理|代理商|回款|确收|毛利|盈亏/g, why: '对内经营信息与内部代号不进对客材料' },
  { re: /FDEBuddy|FDE\s*管理平台|项目管理小浣熊|FDE\s*Buddy/gi, why: 'FDEBuddy 已更名为 ProjectBuddy（项目小浣熊），用户 2026-10-06 第五轮' },
  { re: /Muse|Rock\s*X|\bMAS\b/g, why: '对客不点名个人 Agent 类产品；Raccoon X、MaaS 照写正确拼写' },
  { re: /买油送车/g, why: '商业模式口号统一写「加油送车」（用户 2026-10-06：ISV 加入商汤生态采用加油送车模式）' },
  { re: /[0-9][0-9,.]*\s*万?\s*元|¥|￥|\$\s*[0-9]|[0-9.]+\s*折|[三四五六七八九]折|[0-9][0-9,]*\s*万?积分/g, why: '不写价格、折扣、金额与积分数值' },
  { re: /Sowork|SOWORK|Swork|sowork/g, why: '拼写统一为 SoWork（S、W 大写）' },
  { re: /RaccoonX|Raccoon-X|Raccoon\s+x\b|浣熊\s*X|浣X/g, why: '中台名照写「Raccoon X」（带空格），中文名未定不自拟' },
  { re: /RaccoonWork|Raccoon-Work|Raccoon\s+work\b|小浣熊企业版|浣熊企服版(?<!小浣熊企服版)/g, why: '桌面 AI 工具照写「Raccoon Work」；整套方案产品名为「小浣熊企服版」（用户 2026-10-06）' },
  { re: /Raccoon\s+Buddy|Salesbuddy|Sales Buddy|SaelsBuddy|FDE\s+Buddy|FdeBuddy|Fdebuddy/g, why: '品牌拼写：RaccoonBuddy 一个词，SalesBuddy 一个词，FDEBuddy 按用户写法' },
  { re: /已上线|已验收|已落地|提升\s*[0-9]+\s*%|ROI\s*[0-9]/g, why: '不写「已上线 / 已验收」与量化提升承诺（各模块事实包红线）' },
  { re: /建设中|规划中|陆续上架|已上架|（规划）|（现有）|为可售项|均可售|^\s*(可售|现有|规划)\s*$/g, why: '套册不标注状态：不写可售 / 现有 / 建设中 / 规划（用户 2026-10-06）' },
  { re: /(?<![A-Za-z_/.-])(actions?|reviews?|know-how|deliverables?)(?![A-Za-z_/.-])/g, why: '中文语境里的英文词首字母大写：Action、Review、Know-How、Deliverable（用户 2026-10-06）' },
  { re: /对客户免费|（免费）|10\s*月\s*30\s*日|10\/30/g, why: '个人 AI 工具口径为「SaaS 免费，私有化收费」；海外 MaaS 不写上线日期（用户 2026-10-06 改稿）' },
];
let hits = 0;
for (const f of process.argv.slice(2)) {
  const text = fs.readFileSync(f, 'utf8').replace(/<[^>]+>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const lines = text.split('\n');
  RULES.forEach((r) => lines.forEach((ln) => {
    for (const m of ln.matchAll(r.re)) { hits++; const i = m.index; console.log(`  「${m[0]}」 ${r.why}\n      …${ln.slice(Math.max(0, i - 24), i + 24)}…`); }
  }));
}
console.log(hits ? `[失败] 口径门禁命中 ${hits} 处` : '  通过：无禁用词');
process.exit(hits ? 1 : 0);
