# v1.3 静态页面源

这里保留同事交付的 v1.3 中可用于公开页面的文案层、页面模板和前端资源。

本目录不包含也不部署：

- Node HTTP 服务；
- SQLite 数据库；
- 后台账号和权限；
- 活动、招聘或伙伴申请的服务端表单；
- 简历上传。

修改 `src/content.js` 或页面模板后，在仓库根目录执行：

```bash
node scripts/export-v13-static.mjs
node scripts/validate-site.mjs
```

导出的 HTML、CSS、JS 会直接提交到仓库，GitHub Pages 只负责托管这些静态结果。

活动、招聘、技术内容中心、伙伴申请、Demo 和下载资源仍由仓库原有文件维护，不由本生成器覆盖。
