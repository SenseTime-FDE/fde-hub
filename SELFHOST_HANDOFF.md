# ALLFDE 自托管前后端交接

本文是自托管版本的维护入口。GitHub Pages 纯静态发布仍然保留；自托管模式是在同一份仓库上增加 Node + SQLite 服务，不把数据库、上传文件或密钥提交到 Git。

## 1. 代码边界

```text
仓库根目录/                       静态前端（HTML、CSS、JS、图片、Demo、技术内容）
server/src/server.js               Node HTTP 入口
server/src/routes/static-api.js    同源表单 API（SQLite 写入）
server/src/routes/admin.js         管理后台、角色和导出
server/src/db.js                   SQLite schema、WAL、数据目录
server/src/auth.js                 后台账号、会话、CSRF
server/scripts/init.js             创建数据库与首个管理员
data/                              运行时目录，禁止提交
deploy/                            systemd、Nginx 和环境变量模板
```

前端默认由仓库根目录直接提供。服务端启动时设置 `ALLFDE_STATIC_SITE=1`，会把根目录作为静态站点，同时保留 `/admin` 和 `/api/*`。不设置该变量时，`server/` 仍可运行历史 v1.3 SSR 测试模式，便于执行原有 9 项测试；生产必须使用静态模式。

技术内容仍遵循“一文一 JSON”：

```text
community/data/articles/<id>.json
community/data/articles/index.json
community/data/topics.json
community/data/news.json
```

这部分不依赖 SQLite；文章/资讯的增量更新仍走 Git 分支和人工审核。活动、招聘和线索类数据才进入自托管 SQLite 后台。

## 2. 本地验证

要求 Node.js 22.13 或以上。生产建议固定 Node 22 LTS 的明确小版本。

```bash
cd fde-hub
npm test

# 静态前后端模式：使用临时数据目录，不污染仓库
tmp_data="$(mktemp -d)"
ALLFDE_STATIC_SITE=1 \
ALLFDE_STATIC_ROOT="$PWD" \
ALLFDE_DATA="$tmp_data" \
ALLFDE_ADMIN_PASSWORD='仅本机临时使用的强密码' \
npm run init

ALLFDE_STATIC_SITE=1 \
ALLFDE_STATIC_ROOT="$PWD" \
ALLFDE_DATA="$tmp_data" \
HOST=127.0.0.1 PORT=3000 \
npm start
```

验证：

```bash
curl -fsS http://127.0.0.1:3000/healthz
curl -fsS http://127.0.0.1:3000/api/status
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/community/
```

浏览器访问 `/`、`/community/`、`/events.html`、`/careers.html`、`/admin/login`。若修改了静态页面，必须同时运行仓库既有内容和站点校验：

```bash
node scripts/validate-content.mjs
node scripts/validate-site.mjs
npm test
```

## 3. 服务器安装（由具备 sudo 权限的人执行）

服务器不需要暴露 Node 端口。推荐目录：

```text
/srv/allfde/current         当前发布版本软链接
/srv/allfde-releases/<sha>/  不可变发布目录
/srv/allfde/data/            SQLite、WAL、简历与活动封面
/etc/allfde/allfde.env      仅 root 可读的运行环境变量
```

首次准备：

```bash
sudo adduser --system --group --home /srv/allfde allfde
sudo install -d -o allfde -g allfde -m 750 /srv/allfde/data
sudo install -d -o root -g root -m 755 /srv/allfde-releases
sudo install -d -m 750 /etc/allfde
sudo cp deploy/allfde.env.example /etc/allfde/allfde.env
sudo chmod 640 /etc/allfde/allfde.env
```

部署代码时不要把 `data/`、真实环境文件或任何私钥放入压缩包。建议每个版本解压到新的 `<sha>` 目录，确认文件完整后再更新 `/srv/allfde/current` 软链接；这样可以快速回滚上一版，`/srv/allfde/data` 不随代码版本切换。

systemd 与 Nginx 模板：

```bash
sudo install -m 644 deploy/allfde.service /etc/systemd/system/allfde.service
sudo install -m 644 deploy/nginx-allfde.conf /etc/nginx/sites-available/allfde.conf
sudo ln -s /etc/nginx/sites-available/allfde.conf /etc/nginx/sites-enabled/allfde.conf
sudo systemctl daemon-reload
sudo nginx -t
sudo systemctl enable --now allfde
sudo systemctl reload nginx
```

执行前必须把 Nginx 证书路径和域名记录替换为已确认值。公网只开放 80/443；Node 监听 `127.0.0.1:3000`，不要对公网放行 3000。SSH 只使用密钥，禁止把控制台密码写入脚本。

当前服务器验收阶段使用 Nginx 的 HTTP 默认站点，访问服务器公网 IP 即可查看自托管候选版本；`allfde.com` 的 DNS 仍可能指向 GitHub Pages，不能把 IP 验收误认为正式域名切换。确认 DNS 与证书后，再启用下方 HTTPS 配置并切换解析。

## 4. 管理员初始化与数据

生产初始化不能使用本地启动脚本里的演示密码。使用受控环境变量创建管理员：

```bash
sudo -u allfde env \
  ALLFDE_DATA=/srv/allfde/data \
  ALLFDE_ADMIN=admin \
  ALLFDE_ADMIN_PASSWORD='一次性强密码' \
  node /srv/allfde/current/server/scripts/init.js
```

初始化完成后立即修改密码，并从 shell 历史、临时文件和聊天记录中清除明文凭据。数据库默认启用 WAL；备份必须覆盖 `site.db`、`site.db-wal`、`site.db-shm` 和 `uploads/`，并使用一致性备份或停服快照。只复制单个 `site.db` 不算可靠备份。

当前存储位置和限制：

- `ALLFDE_DATA/site.db`：账号、会话、线索、伙伴申请、活动、报名、职位、投递和审计；
- `ALLFDE_DATA/uploads/`：简历，单文件 10 MB，权限 0600；
- `ALLFDE_DATA/uploads/events/`：活动封面，单文件 5 MB，权限 0644；
- 当前代码没有自动清理、容量告警或备份任务，必须由运维补充 cron/systemd timer、远端备份和恢复演练。

## 5. API 与后续扩展

```text
GET  /api/csrf
GET  /api/status
POST /api/contact
POST /api/community
POST /api/partners
POST /api/events/:slug
POST /api/careers/:id   multipart，简历 ≤10 MB
GET  /admin             后台登录与管理
GET  /healthz           存活检查
```

所有 POST API 需要先获取同源 CSRF token，并在 `_t` 字段提交；服务端还会做字段校验、蜜罐和按 IP 限流。当前静态页面仍有部分外部落地页或本地演示，接入真实表单时必须逐页验证字段映射，不要把未接入的按钮描述成“已入库”。

后续若迁移对象存储，先在 `server/src` 增加 `local / S3-compatible` storage adapter，再迁移 `resume_file` 和 `cover` 保存的 object key；不要直接在路由中散落对象存储 SDK 调用。简历必须继续经过后台鉴权读取或短时签名 URL。

## 6. 发布、回滚和同事维护

推荐流程：

1. 从远程 `main` 拉取最新代码，建立 `codex/` 分支；
2. 修改页面、文章、资讯或后端；
3. 本地运行 `node scripts/validate-content.mjs`、`node scripts/validate-site.mjs`、`npm test` 和静态模式健康检查；
4. 只创建 Draft PR，不自动合并；
5. 人工审核后合并并在服务器创建新的不可变 release 目录；
6. 重启服务，检查 `/healthz`、首页、技术内容、`/admin/login` 和最近修改功能；
7. 若异常，恢复 `/srv/allfde/current` 上一个 release 软链接并重启，不要 force push 或删除旧 release。

交给 Codex 的启动提示词示例：

> 请先阅读根目录 `README.md`、`HANDOFF.md`、`SELFHOST_HANDOFF.md` 和 `deploy/`。从远程 `main` 拉取最新代码，确认当前分支和服务器版本；只在 `codex/` 分支修改。先运行静态内容校验、Node 测试和本地静态模式健康检查，再创建 Draft PR。不要读取、打印或提交 `/etc/allfde/allfde.env`、数据库、上传文件、SSH 私钥和任何密码；不要自动合并、force push 或删除旧 release。上线前由人工执行服务器发布和回滚确认。

## 7. 安全边界

- 任何私钥、控制台密码、管理员密码、环境文件、SQLite 数据和简历都不进 Git、不进交付压缩包；
- 本次聊天中如果曾出现真实私钥或密码，任务完成后必须轮换；
- 服务器 SSH 端口不限来源时，更要坚持密钥认证、禁 root、最小 sudo 和登录审计；
- 正式启用简历/手机号/邮箱收集前，确认隐私说明、保留周期、磁盘加密和备份访问权限；
- 2 vCPU/4 GiB/10 Mbps 只适合低流量单节点，不开启多实例、PM2 cluster 或双活。
