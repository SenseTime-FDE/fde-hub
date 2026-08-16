# FDE Hub

OFDE 官网静态站点。生产站由 GitHub Pages 直接发布仓库 `main` 分支根目录，并保留自定义域名 `allfde.com`。

## 站点结构

- 官网入口：`index.html`
- 产品与方案：`solutions.html` 及四个产品详情页
- Token Plan：`tokenplan.html`
- 市场活动：`events.html`
- 人才招聘：`careers.html`（5 个岗位需求与本地文件选择演示；不含真实登录或投递）
- 加入生态：`partners.html`
- 技术内容中心：`community/`
- 旧技术交流地址兼容：`forum.html` 跳转至 `community/`

本站是纯静态站点，不部署数据库、Node 服务或运行时密钥。VoxOne 等演示页使用浏览器内的静态演示数据；交付包中的服务端代码和数据库没有进入发布版本。

## 本地预览与校验

不要用 `file://` 直接打开，因为技术内容中心通过 `fetch` 读取 JSON。

```bash
python3 -m http.server 8767
node scripts/validate-content.mjs
node scripts/validate-site.mjs
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
