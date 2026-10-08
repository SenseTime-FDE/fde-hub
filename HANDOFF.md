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
- 当前架构决策：继续使用 GitHub Pages 纯静态部署，不迁移 Node + SQLite 动态站

## v1.3 静态适配包含什么

同事交付的 `allfde_site_v1.3_local.zip` 原本是 Node + SQLite 动态站，不能直接部署到 GitHub Pages。本仓库只提取它的公开页面文案层、模板、CSS 和浏览器脚本，并预生成以下静态页面：

```text
index.html
solutions.html
solutions/
cloud-maas.html
cloud-maas/
tokenplan.html
privacy.html
privacy/
```

生成源位于 `static_source/v13/`，导出脚本是 `scripts/export-v13-static.mjs`。产品文案或页面模板调整后必须重新导出，并把生成结果一并提交。

原站以下资产全部保留，没有被 v1.3 覆盖：

- 技术内容中心 `community/`：25 篇独立文章、5 个分类、6 条专题路径、6 条资讯；
- 市场活动 `events.html`、活动图片和 5 份 PPTX 下载；
- 人才招聘 `careers.html`：5 个岗位需求与纯本地文件选择演示；
- 伙伴页 `partners.html` 及已上线的外部申请落地页；
- AI Native HR、AI Native Sales、VoxOne 和智能需求管理 Demo；
- 原有 `.html` 地址及 `forum.html` 兼容跳转。

每篇技术文章仍是一文一 JSON，不把正文写进 HTML 或 JavaScript。

人才招聘页当前展示 5 个完整岗位需求：FDE 交付工程师、生态招商经理、FDE 实习生、市场与内容运营、线索与私域运营。岗位状态、工作地点和正式投递入口均继续标记为“待 HR 确认”，不得擅自改成正式在招。

## 发布包主动排除了什么

以下内容不属于浏览器运行依赖，或不适合公开静态托管，因此没有进入发布版本：

- 活动页制作中间文件：`_v2_body.html`、`_v2_style.css`
- 销售方案 PPT 制作工程与 QA 产物：`ai_native_sales/deck/`
- VoxOne Node 服务、SQLite 数据库、启动脚本和本地工具配置
- 智能需求管理平台的 Python 制作脚本与临时壳页
- 各子项目内部 README、绝对本地路径说明和交付制作笔记
- v1.3 的 Node HTTP 服务、SQLite 数据库、后台账号与权限、动态路由
- v1.3 的活动/招聘/伙伴申请数据库表单、简历上传和本地固定管理员密码

`events.html` 原先把图片和 5 份 PPTX 全部内嵌，单文件超过 GitHub 100 MB 限制。新版已将它们拆分到：

```text
images/events/
downloads/events/
```

页面功能和下载入口保持不变。

## 合并前人工检查

1. 确认 Draft PR 的 base 是 `main`，head 是 `codex/` 开头的静态适配分支。
2. 确认 `CNAME` 仍为 `allfde.com`。
3. 检查 PR 中没有 `voxone/server/`、`voxone.db`、`_v2_body.html` 或单文件超过 95 MB。
4. 查看首页、产品与方案、市场活动、人才招聘、加入生态和技术内容中心。
5. 运行：

```bash
node scripts/export-v13-static.mjs
node --check community/js/community.js
node scripts/validate-content.mjs
node scripts/validate-site.mjs
node --test
```

6. 生成后执行 `git diff --exit-code`，确认不存在漏提交的生成结果。

7. 周玮人工确认后合并；不要启用自动合并。

## 回滚

本轮 v1.3 静态适配的基线 `main` 提交为 `14d494c80ee7ed29759dbe21b708a86d45b9840d`。如上线后出现严重问题，从该提交创建回滚 PR，不要强推或改写 `main` 历史。

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
- v1.3 新增的产品能力、商业口径和部署表述来自同事交付包；正式对外前仍需对应负责人做最终人工口径确认。

## 招聘页面身份边界

全站导航当前只有浏览器本机的“体验身份”，不是账号登录；招聘页也不依赖该身份：

- 不校验密码，不连接身份提供方，任何访客都可切换体验角色。
- 招聘页不再模拟 AI 初筛、HR 复核、Offer 或申请进度，也不会在 `localStorage` 中创建模拟申请。
- 简历区域仅演示浏览器本地文件选择和格式校验：不读取、不解析、不保存、不上传文件内容，刷新页面即清除。
- 页面没有真实投递功能；正式岗位、地点和投递入口都必须由 HR 确认后再发布。

如后续需要真实登录，必须先确认身份提供方、服务端/API、候选人数据存储、招聘系统接口与隐私合规方案；不得把客户端密钥放进 GitHub Pages。
