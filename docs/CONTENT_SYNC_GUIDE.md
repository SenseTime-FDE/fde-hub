# 技术文章与资讯快速同步

本仓库已是 GitHub Pages 的直接发布源。内容 PR 合并到 `main` 后，GitHub Pages 会自动重建线上版本，不需要仓库所有者再次复制或手工部署。

## 周玮需要做什么

1. 向 Codex 提供文章素材，或一条官方公告、官方文档、官方开源仓库链接。
2. 在 Draft PR 中人工确认标题、事实、编辑判断、分类、专题和发布日期。
3. 确认校验通过后，由周玮本人合并 PR。
4. GitHub Pages 完成后，打开线上页面做一次抽查。

Codex 不自动合并；没有合格内容时不创建空 PR。

## 新文章如何显示

一篇文章对应一个文件：

```text
community/data/articles/<id>.json
```

同时登记：

```text
community/data/articles/index.json
```

显示位置由数据决定：

- `category`：进入 FDE 方法、Skill 库、场景实践、技术文章或案例分享
- `topics`：通过 `community/data/topics.json` 进入一条或多条专题路径
- `featured: true`：进入“值得先读”候选，按日期取最新三篇
- `date`：决定“最新发布”顺序
- 标题、摘要、作者、标签与正文自动进入站内搜索，不维护第二份索引

## 新资讯如何显示

资讯只写入：

```text
community/data/news.json
```

系统会按 `date` 倒序，在首页“近期 AI/Agent 资讯”中展示，并生成 `?news=<id>` 的站内解读页。资讯卡不会直接跳到外部网站；官方原文链接只显示在站内解读页。

## Codex 每次应该怎么做

1. 先读根目录 `HANDOFF.md` 和本文件。
2. 检查当前分支和未提交变更，不覆盖其他人的工作。
3. 只使用官方来源；把官方事实、编辑判断、待人工确认项分开。
4. 从 `content_templates/article.md` 或 `content_templates/news.md` 生成临时稿件。
5. 运行：

```bash
node scripts/import-content.mjs article /path/to/article.md
# 或
node scripts/import-content.mjs news /path/to/news.md

node --check community/js/community.js
node scripts/validate-content.mjs
node scripts/validate-site.mjs
```

6. 创建 `codex/` 前缀分支和 Draft PR。
7. PR 说明列出新增内容、官方来源、编辑判断、待确认项、显示位置和校验结果。
8. 等待周玮人工审核和合并。

## 仓库所有者还需要做什么

日常发稿不需要仓库所有者参与。只需确保：

- 周玮持续拥有创建分支、提交 PR 和合并 PR 的权限。
- GitHub Pages 继续从 `main` 根目录发布。
- `CNAME` 保持为 `allfde.com`。
- 如设置分支保护，允许周玮在检查通过后完成合并。

## 本地手工导入

```bash
cp content_templates/article.md /tmp/ofde-article.md
node scripts/import-content.mjs article /tmp/ofde-article.md --dry-run
node scripts/import-content.mjs article /tmp/ofde-article.md
```

```bash
cp content_templates/news.md /tmp/ofde-news.md
node scripts/import-content.mjs news /tmp/ofde-news.md --dry-run
node scripts/import-content.mjs news /tmp/ofde-news.md
```

品牌、客户事实、产品能力、交付状态、讨论地址或来源可信度不明确时，不得猜测；保留 Draft PR 并列为待人工确认。
