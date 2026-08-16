# Codex 定时内容任务契约

定时任务只负责发现候选、生成稿件、校验和创建 Draft PR，不自动合并。

## 固定边界

- 只修改 `community/data/` 中的内容数据；需要改模板、样式或逻辑时另建功能 PR。
- 文章一文一 JSON，并登记文章索引；资讯统一写入 `community/data/news.json`。
- 只使用周玮确认的官方来源白名单。
- 区分官方事实、编辑判断与待人工确认项。
- 不修改产品、活动、招聘、伙伴、共享导航或其他演示目录。
- 不提交服务端、数据库、Token、Secret 或本地绝对路径。
- 没有合格新内容时，以无变更结束。

## 推荐执行顺序

```text
检查官方来源
→ 按 URL、发布日期和内容哈希去重
→ 生成候选稿
→ 导入到确定的数据路径
→ 运行内容与站点校验
→ 创建 Draft PR
→ 周玮人工审核和合并
```

运行命令：

```bash
node --check community/js/community.js
node scripts/validate-content.mjs
node scripts/validate-site.mjs
```

PR 必须说明官方来源、页面显示位置、待人工确认项和校验统计。不得把 Draft PR 描述为已上线。
