# FDE Hub 合并与发布交接

本文件是维护人和接手本仓库的 AI 的第一入口。

## 当前结论

- 仓库：`SenseTime-FDE/fde-hub`
- 默认分支：`main`
- GitHub Pages：Legacy branch publishing，来源为 `main` 根目录
- 自定义域名：`allfde.com`，根目录 `CNAME` 必须保留
- 发布方式：Pull Request 合并进入 `main` 后由 GitHub Pages 自动重建
- 内容负责人：周玮，已具备仓库管理员权限
- 合并规则：Codex 只创建 Draft PR；周玮人工审核并合并，不允许 Codex 自动合并

## 本次替换包含什么

新版以收到的 `allfde_site` 静态交付包为主体，包含官网页面、AI Native HR、AI Native Sales、VoxOne 静态演示和智能需求管理演示；同时将周玮负责的技术内容中心合入：

```text
forum.html
community/
```

技术内容中心当前包含 25 篇独立文章、5 个分类、6 条专题路径和 6 条资讯。每篇文章仍是一文一 JSON，不把正文写进 HTML 或 JavaScript。

## 发布包主动排除了什么

以下文件不属于浏览器运行依赖，或不适合公开静态托管，因此没有进入新版：

- 活动页制作中间文件：`_v2_body.html`、`_v2_style.css`
- 销售方案 PPT 制作工程与 QA 产物：`ai_native_sales/deck/`
- VoxOne Node 服务、SQLite 数据库、启动脚本和本地工具配置
- 智能需求管理平台的 Python 制作脚本与临时壳页
- 各子项目内部 README、绝对本地路径说明和交付制作笔记

`events.html` 原先把图片和 5 份 PPTX 全部内嵌，单文件超过 GitHub 100 MB 限制。新版已将它们拆分到：

```text
images/events/
downloads/events/
```

页面功能和下载入口保持不变。

## 合并前人工检查

1. 确认 Draft PR 的 base 是 `main`，head 是替换分支。
2. 确认 `CNAME` 仍为 `allfde.com`。
3. 检查 PR 中没有 `voxone/server/`、`voxone.db`、`_v2_body.html` 或单文件超过 95 MB。
4. 查看首页、产品与方案、市场活动、人才招聘、加入生态和技术内容中心。
5. 运行：

```bash
node --check community/js/community.js
node scripts/validate-content.mjs
node scripts/validate-site.mjs
```

6. 周玮人工确认后合并；不要启用自动合并。

## 回滚

替换前的 `main` 提交为 `5e03b807632dc4a663088e35fa089401155bb029`。发布前应保留分支：

```text
codex/backup-before-site-replacement-20260816
```

如新版出现严重问题，从该分支创建回滚 PR，不要强推或改写 `main` 历史。

## 后续内容发布

技术内容的最终数据路径已经固定：

- 新文章：新增 `community/data/articles/<id>.json`
- 启用文章：登记 `community/data/articles/index.json`
- 专题顺序：更新 `community/data/topics.json`
- 新资讯：更新 `community/data/news.json`

日常内容流程和 Codex 定时任务边界见 `docs/CONTENT_SYNC_GUIDE.md` 与 `docs/CODEX_SCHEDULED_CONTENT.md`。

## 仍待人工确认

- GitHub Discussions 完整地址尚未提供，技术内容中心继续隐藏讨论入口，不影响上线。
- 自定义域名当前尚未强制 HTTPS；证书与域名校验状态需在 GitHub Pages 设置中人工复核。
- AI/Agent 资讯自动检查的官方来源白名单和执行频率仍需由周玮确认。

## 招聘页面身份边界

招聘页面当前只有浏览器本机的“体验身份”，不是账号登录：

- 不校验密码，不连接身份提供方，任何访客都可切换候选人或 HR 流程视角。
- 模拟申请只写入当前浏览器的 `localStorage`，不会进入商汤招聘系统，也不能跨设备查询。
- 该能力只用于公开交互演示，不能承担真实投递、权限控制、候选人数据管理或招聘进度通知。

如后续需要真实登录，必须先确认身份提供方、服务端/API、候选人数据存储、招聘系统接口与隐私合规方案；不得把客户端密钥放进 GitHub Pages。
