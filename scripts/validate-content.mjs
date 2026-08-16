import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(scriptDir, "..");
const communityRoot = path.join(moduleRoot, "community");
const articleRoot = path.join(communityRoot, "data/articles");
const errors = [];
const warnings = [];

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${label} 无法解析：${error.message}`);
    return null;
  }
}

function requireString(value, field, file) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${file} 的 ${field} 必须是非空字符串`);
  }
}

function requireStringArray(value, field, file) {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(`${file} 的 ${field} 必须是非空字符串数组`);
  }
}

const site = readJson(path.join(communityRoot, "data/site.json"), "data/site.json");
const topicsConfig = readJson(path.join(communityRoot, "data/topics.json"), "data/topics.json");
const newsConfig = readJson(path.join(communityRoot, "data/news.json"), "data/news.json");
const manifest = readJson(path.join(articleRoot, "index.json"), "data/articles/index.json");

if (!site || !topicsConfig || !newsConfig || !manifest) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

if (!Array.isArray(site.categories) || !site.categories.length) {
  errors.push("data/site.json 缺少 categories");
}
if (!Array.isArray(manifest.articles) || !manifest.articles.length) {
  errors.push("data/articles/index.json 缺少 articles");
}
if (!Array.isArray(topicsConfig.topics) || !topicsConfig.topics.length) {
  errors.push("data/topics.json 缺少 topics");
}
if (!Array.isArray(newsConfig.items) || !newsConfig.items.length) {
  errors.push("data/news.json 缺少 items");
}
requireString(newsConfig.updatedAt, "updatedAt", "data/news.json");
requireString(newsConfig.notice, "notice", "data/news.json");
if (typeof newsConfig.updatedAt === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(newsConfig.updatedAt)) {
  errors.push("data/news.json 的 updatedAt 必须使用 YYYY-MM-DD");
}

const newsIds = new Set();
for (const item of newsConfig.items || []) {
  const label = `data/news.json item ${item?.id || "未知"}`;
  for (const field of ["id", "date", "category", "title", "summary", "editorNote", "source", "url"]) {
    requireString(item?.[field], field, label);
  }
  requireStringArray(item?.tags, "tags", label);
  requireString(item?.lead, "lead", label);
  requireStringArray(item?.watch, "watch", label);
  if (!Array.isArray(item?.analysis) || item.analysis.length < 2) {
    errors.push(`${label} 的 analysis 必须至少包含两个解读章节`);
  } else {
    item.analysis.forEach((section, index) => {
      const sectionLabel = `${label} 解读第 ${index + 1} 节`;
      requireString(section?.heading, "heading", sectionLabel);
      requireStringArray(section?.paragraphs, "paragraphs", sectionLabel);
    });
  }
  if (newsIds.has(item?.id)) errors.push(`重复资讯 ID：${item.id}`);
  newsIds.add(item?.id);
  if (typeof item?.date === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    errors.push(`${label} 的 date 必须使用 YYYY-MM-DD`);
  }
  if (typeof item?.url === "string" && !/^https:\/\//.test(item.url)) {
    errors.push(`${label} 的 url 必须使用 HTTPS`);
  }
  if (item?.date > newsConfig.updatedAt) errors.push(`${label} 的 date 晚于资讯更新时间`);
}

requireString(site.site?.officialLabel, "officialLabel", "data/site.json site");
if (typeof site.site?.discussion?.enabled !== "boolean") {
  errors.push("data/site.json discussion.enabled 必须是布尔值");
}
if (typeof site.site?.discussion?.showPlaceholder !== "boolean") {
  errors.push("data/site.json discussion.showPlaceholder 必须是布尔值");
}
for (const field of ["label", "status", "description"]) {
  requireString(site.site?.discussion?.[field], field, "data/site.json discussion");
}
for (const field of ["visibility", "integrationStage", "handoffQuestion"]) {
  requireString(site.site?.discussion?.[field], field, "data/site.json discussion handoff");
}
if (site.site?.discussion?.visibility !== "public") {
  errors.push("data/site.json discussion.visibility 当前必须为 public");
}
if (site.site?.discussion?.searchIndexing !== true) {
  errors.push("data/site.json discussion.searchIndexing 当前必须为 true");
}
if (site.site?.discussion?.enabled && !/^https?:\/\//.test(site.site?.discussion?.url || "")) {
  errors.push("data/site.json 启用 discussion 时必须提供 HTTP/HTTPS url");
}
if (!site.site?.discussion?.enabled && site.site?.discussion?.url) {
  warnings.push("discussion 未启用但已填写 url，请确认是否应将 enabled 改为 true");
}

const categoryIds = new Set();
const categoryLabels = new Map();
for (const category of site.categories || []) {
  requireString(category?.id, "id", "data/site.json category");
  requireString(category?.label, "label", "data/site.json category");
  if (categoryIds.has(category?.id)) errors.push(`重复分类 ID：${category.id}`);
  categoryIds.add(category?.id);
  categoryLabels.set(category?.id, category?.label);
}
if (!categoryIds.has("all")) errors.push("data/site.json 必须包含 all 分类");

const manifestFiles = manifest.articles || [];
if (new Set(manifestFiles).size !== manifestFiles.length) {
  errors.push("data/articles/index.json 存在重复文件名");
}

const requiredStrings = ["id", "category", "typeLabel", "title", "summary", "author", "date", "updatedAt", "readTime"];
const articleIds = new Set();
const categoryCounts = new Map();
let sectionCount = 0;

for (const file of manifestFiles) {
  if (typeof file !== "string" || path.basename(file) !== file || !file.endsWith(".json") || file === "index.json") {
    errors.push(`文章清单文件名无效：${String(file)}`);
    continue;
  }

  const fullPath = path.join(articleRoot, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`文章清单文件不存在：${file}`);
    continue;
  }

  const article = readJson(fullPath, file);
  if (!article) continue;

  for (const field of requiredStrings) requireString(article[field], field, file);
  requireStringArray(article.tags, "tags", file);

  if (typeof article.featured !== "boolean") errors.push(`${file} 的 featured 必须是布尔值`);
  if (file !== `${article.id}.json`) errors.push(`${file} 与文章 id 不一致`);
  if (articleIds.has(article.id)) errors.push(`重复文章 ID：${article.id}`);
  articleIds.add(article.id);

  if (!categoryIds.has(article.category) || article.category === "all") {
    errors.push(`${file} 使用无效分类：${article.category}`);
  } else {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) || 0) + 1);
    const expectedLabel = categoryLabels.get(article.category);
    if (expectedLabel && article.typeLabel !== expectedLabel) {
      errors.push(`${file} 的 typeLabel 应为“${expectedLabel}”`);
    }
  }

  for (const field of ["date", "updatedAt"]) {
    if (typeof article[field] === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(article[field])) {
      errors.push(`${file} 的 ${field} 必须使用 YYYY-MM-DD`);
    }
  }
  if (article.updatedAt < article.date) errors.push(`${file} 的 updatedAt 早于 date`);

  if (!Array.isArray(article.sections) || !article.sections.length) {
    errors.push(`${file} 的 sections 必须是非空数组`);
    continue;
  }

  sectionCount += article.sections.length;
  article.sections.forEach((section, index) => {
    const label = `${file} 第 ${index + 1} 节`;
    requireString(section?.heading, "heading", label);
    const hasParagraphs = Array.isArray(section?.paragraphs) && section.paragraphs.length;
    const hasList = Array.isArray(section?.list) && section.list.length;
    if (!hasParagraphs && !hasList) errors.push(`${label} 必须包含 paragraphs 或 list`);
    if (section?.paragraphs !== undefined) requireStringArray(section.paragraphs, "paragraphs", label);
    if (section?.list !== undefined) requireStringArray(section.list, "list", label);
  });
}

for (const categoryId of categoryIds) {
  if (categoryId !== "all" && !categoryCounts.has(categoryId)) errors.push(`分类没有启用文章：${categoryId}`);
}

const topicIds = new Set();
const topicCoverage = new Set();
for (const topic of topicsConfig.topics || []) {
  const label = `data/topics.json topic ${topic?.id || "未知"}`;
  for (const field of ["id", "eyebrow", "title", "description"]) requireString(topic?.[field], field, label);
  requireStringArray(topic?.articles, "articles", label);
  if (topicIds.has(topic?.id)) errors.push(`重复专题 ID：${topic.id}`);
  topicIds.add(topic?.id);
  if (Array.isArray(topic?.articles) && new Set(topic.articles).size !== topic.articles.length) {
    errors.push(`${label} 存在重复文章`);
  }
  for (const articleId of topic?.articles || []) {
    if (!articleIds.has(articleId)) errors.push(`${label} 引用了未启用文章：${articleId}`);
    topicCoverage.add(articleId);
  }
}
for (const articleId of articleIds) {
  if (!topicCoverage.has(articleId)) warnings.push(`文章尚未加入专题：${articleId}`);
}

const disabledFiles = fs.readdirSync(articleRoot)
  .filter((file) => file.endsWith(".json") && file !== "index.json" && !manifestFiles.includes(file));
if (disabledFiles.length) warnings.push(`未启用文章 ${disabledFiles.length} 篇：${disabledFiles.join("、")}`);

const stats = {
  articles: articleIds.size,
  categories: [...categoryIds].filter((id) => id !== "all").length,
  topics: topicIds.size,
  news: newsIds.size,
  sections: sectionCount,
  disabled: disabledFiles.length,
  errors: errors.length,
  warnings: warnings.length
};

console.log(`技术内容数据校验：${stats.articles} 篇文章，${stats.categories} 个分类，${stats.topics} 个专题，${stats.news} 条资讯，${stats.sections} 个章节，${stats.errors} 个错误，${stats.warnings} 个警告。`);
for (const warning of warnings) console.warn(`- 警告：${warning}`);
if (errors.length) {
  console.error(errors.map((item) => `- 错误：${item}`).join("\n"));
  process.exit(1);
}
