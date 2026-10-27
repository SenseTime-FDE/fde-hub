# FDE Hub

OFDE 官网静态站点。生产站由 GitHub Pages 直接发布仓库 `main` 分支根目录，并保留自定义域名 `allfde.com`。

## 站点结构

- 官网入口：`index.html`（v1.3 视觉与内容结构的静态导出）
- 产品与方案：`solutions.html`、`solutions/` 及 10 个产品详情目录
- 云端 MaaS：`cloud-maas/`；旧入口 `tokenplan.html` 保留并展示同一份静态内容
- 市场活动：`events.html`
- 人才招聘：`careers.html`（5 个岗位需求与本地文件选择演示；不含真实登录或投递）
- 加入生态：`partners.html`
- 技术内容中心：`community/`
- 旧技术交流地址兼容：`forum.html` 跳转至 `community/`
- 既有产品 Demo、VoxOne、活动图片与下载材料继续保留原路径

GitHub Pages 发布模式仍是纯静态站点：不依赖数据库、Node 服务、真实账号登录、后台管理、简历上传或运行时密钥。仓库同时保留一个可选的自托管模式：在同一份静态前端上启动 `server/` 的 Node + SQLite 服务，可承接后台、线索、活动报名和简历投递。两种模式的部署边界不同，不能把 GitHub Pages 当成动态后端。

自托管部署、数据目录、systemd/Nginx、备份与回滚说明见 [SELFHOST_HANDOFF.md](SELFHOST_HANDOFF.md)。默认 GitHub Pages 发布不需要执行其中的服务器步骤。

## v1.3 静态页面维护

首页、方案总览、10 个产品页、云端 MaaS 与隐私页由以下目录生成：

```text
static_source/v13/
```

修改其中的 `src/content.js`、页面模板或前端资源后执行：

```bash
node scripts/export-v13-static.mjs
```

导出结果会直接写入可发布的 HTML、`css/site.css`、`js/site.js` 和 `img/`。GitHub Pages 只托管导出结果，不会在服务器运行该脚本。活动、招聘、伙伴页、技术内容中心、Demo 和下载资源不由这个生成器覆盖。

## 本地预览与校验

不要用 `file://` 直接打开，因为技术内容中心通过 `fetch` 读取 JSON。

```bash
python3 -m http.server 8767
node scripts/export-v13-static.mjs
node scripts/validate-content.mjs
node scripts/validate-site.mjs
node --test
```

然后访问 `http://127.0.0.1:8767/`。

## 更新技术文章或资讯

文章保持一文一 JSON：

```text
community/data/articles/<id>.json
community/data/articles/index.json
community/data/topics.json
```

资讯统一维护在：

```text
community/data/news.json
```

可以从 `content_templates/` 创建 Markdown 稿件，再使用导入器：

```bash
node scripts/import-content.mjs article /path/to/article.md
node scripts/import-content.mjs news /path/to/news.md
node scripts/validate-content.mjs
node scripts/validate-site.mjs
```

完整协作规则见 [HANDOFF.md](HANDOFF.md) 和 [docs/CONTENT_SYNC_GUIDE.md](docs/CONTENT_SYNC_GUIDE.md)。

## 可选：自托管前后端

自托管模式使用仓库根目录作为静态文件根，并由 Node 进程提供 `/api/*`、`/admin` 和 `/healthz`。启动时设置 `ALLFDE_STATIC_SITE=1`；运行时数据必须放到未纳入 Git 的 `ALLFDE_DATA` 目录。具体命令和生产发布约束以 [SELFHOST_HANDOFF.md](SELFHOST_HANDOFF.md) 为准。
