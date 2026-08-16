import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(scriptDir, "..");
const communityRoot = path.join(moduleRoot, "community");
const kind = process.argv[2];
const inputArg = process.argv[3];
const dryRun = process.argv.includes("--dry-run");

if (!['article', 'news'].includes(kind) || !inputArg) {
  console.error("用法：node scripts/import-content.mjs <article|news> <Markdown 文件> [--dry-run]");
  process.exit(1);
}

const inputFile = path.resolve(process.cwd(), inputArg);
if (!fs.existsSync(inputFile)) {
  console.error(`找不到输入文件：${inputFile}`);
  process.exit(1);
}

function parseDocument(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Markdown 必须以 --- 包围的元数据开头");
  const meta = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`无法解析元数据：${rawLine}`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function required(meta, fields) {
  for (const field of fields) {
    if (!meta[field]?.trim()) throw new Error(`缺少元数据字段：${field}`);
  }
}

function tags(value) {
  return String(value || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function parseSections(body) {
  const sections = [];
  let current = null;
  let paragraph = [];

  function flushParagraph() {
    if (!current || !paragraph.length) return;
    current.paragraphs.push(paragraph.join(" ").trim());
    paragraph = [];
  }

  for (const rawLine of `${body}\n`.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      flushParagraph();
      current = { heading: line.slice(3).trim(), paragraphs: [], list: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      if (line) throw new Error("正文内容必须放在二级标题（##）之后");
      continue;
    }
    if (!line) {
      flushParagraph();
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      current.list.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    paragraph.push(line);
  }
  return sections.map((section) => {
    const output = { heading: section.heading };
    if (section.paragraphs.length) output.paragraphs = section.paragraphs;
    if (section.list.length) output.list = section.list;
    return output;
  });
}

function validateId(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("id 只能使用小写英文、数字和连字符");
  }
}

function buildArticle(meta, body) {
  required(meta, ["id", "category", "title", "summary", "author", "date", "readTime", "tags", "topics"]);
  validateId(meta.id);
  const labels = {
    fde: "FDE 方法",
    skill: "Skill 库",
    practice: "场景实践",
    engineering: "技术文章",
    case: "案例分享"
  };
  if (!labels[meta.category]) throw new Error(`不支持的文章分类：${meta.category}`);
  const sections = parseSections(body);
  if (!sections.length) throw new Error("文章至少需要一个二级标题章节");
  return {
    id: meta.id,
    category: meta.category,
    typeLabel: labels[meta.category],
    title: meta.title,
    summary: meta.summary,
    author: meta.author,
    date: meta.date,
    updatedAt: meta.updatedAt || meta.date,
    readTime: meta.readTime,
    featured: String(meta.featured).toLowerCase() === "true",
    tags: tags(meta.tags),
    sections
  };
}

function buildNews(meta, body) {
  required(meta, ["id", "date", "category", "title", "summary", "editorNote", "source", "url", "tags"]);
  validateId(meta.id);
  if (!/^https:\/\//.test(meta.url)) throw new Error("资讯官方来源必须使用 HTTPS");
  const sections = parseSections(body);
  const leadSection = sections.find((section) => section.heading === "编辑导读");
  const watchSection = sections.find((section) => section.heading === "接下来关注");
  const analysis = sections.filter((section) => !["编辑导读", "接下来关注"].includes(section.heading));
  if (!leadSection?.paragraphs?.length) throw new Error("资讯必须包含“## 编辑导读”及至少一段文字");
  if (analysis.length < 2) throw new Error("资讯至少需要两个自然叙事章节");
  const watch = [...(watchSection?.list || []), ...(watchSection?.paragraphs || [])];
  if (!watch.length) throw new Error("资讯必须包含“## 接下来关注”及列表项");
  return {
    id: meta.id,
    date: meta.date,
    category: meta.category,
    title: meta.title,
    summary: meta.summary,
    editorNote: meta.editorNote,
    source: meta.source,
    url: meta.url,
    tags: tags(meta.tags),
    lead: leadSection.paragraphs.join("\n\n"),
    analysis: analysis.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs || []
    })),
    watch
  };
}

function shanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const { meta, body } = parseDocument(fs.readFileSync(inputFile, "utf8"));
const content = kind === "article" ? buildArticle(meta, body) : buildNews(meta, body);

if (dryRun) {
  console.log(pretty(content));
  process.exit(0);
}

const rollback = [];
try {
  if (kind === "article") {
    const articleRoot = path.join(communityRoot, "data/articles");
    const output = path.join(articleRoot, `${content.id}.json`);
    if (fs.existsSync(output)) throw new Error(`文章已存在：${content.id}`);
    const manifestFile = path.join(articleRoot, "index.json");
    const manifestText = fs.readFileSync(manifestFile, "utf8");
    const manifest = JSON.parse(manifestText);
    const topicsFile = path.join(communityRoot, "data/topics.json");
    const topicsText = fs.readFileSync(topicsFile, "utf8");
    const topicsConfig = JSON.parse(topicsText);
    const selectedTopics = tags(meta.topics);
    for (const topicId of selectedTopics) {
      const topic = topicsConfig.topics.find((item) => item.id === topicId);
      if (!topic) throw new Error(`专题不存在：${topicId}`);
      if (!topic.articles.includes(content.id)) topic.articles.push(content.id);
    }
    manifest.articles.push(`${content.id}.json`);
    fs.writeFileSync(output, pretty(content));
    rollback.push(() => fs.unlinkSync(output));
    fs.writeFileSync(manifestFile, pretty(manifest));
    rollback.push(() => fs.writeFileSync(manifestFile, manifestText));
    fs.writeFileSync(topicsFile, pretty(topicsConfig));
    rollback.push(() => fs.writeFileSync(topicsFile, topicsText));
  } else {
    const newsFile = path.join(communityRoot, "data/news.json");
    const newsText = fs.readFileSync(newsFile, "utf8");
    const news = JSON.parse(newsText);
    if (news.items.some((item) => item.id === content.id)) throw new Error(`资讯已存在：${content.id}`);
    news.items.push(content);
    news.items.sort((first, second) => second.date.localeCompare(first.date));
    news.updatedAt = shanghaiDate();
    fs.writeFileSync(newsFile, pretty(news));
    rollback.push(() => fs.writeFileSync(newsFile, newsText));
  }

  const validation = spawnSync(process.execPath, [path.join(scriptDir, "validate-content.mjs")], { stdio: "inherit" });
  if (validation.status !== 0) throw new Error("内容校验失败，已撤销本次导入");
  console.log(`${kind === "article" ? "文章" : "资讯"}已导入：${content.id}`);
} catch (error) {
  for (const restore of rollback.reverse()) restore();
  console.error(error.message);
  process.exit(1);
}
