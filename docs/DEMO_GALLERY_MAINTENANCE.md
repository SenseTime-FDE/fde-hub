# Demo 展示页恢复与维护

## 当前结构

- 展示页：`demos.html`
- 页面源模板：`static_source/v13/src/views/pages.js` 中的 `demos()`
- 数据清单：`js/data.js`
- 页面交互：`js/demos.js`
- 页面样式：`css/demos.css`
- 小程序二维码：`images/img_v3_0212v_ac39fd3f-63ff-42e7-aebf-99f4b8b9c6dg.jpg`

Demo 源码和本仓库中的官网展示页分开维护。官网只保留清单、说明和可访问入口；既有网页 Demo 继续从官方 `SenseTime-FDE/Demo` GitHub Pages 或已经确认的外部地址加载，不在 `fde-hub` 里复制一份。

## 恢复依据

旧版官网提交 `06a82dafca4d` 中仍有 `demos.html`、Demo 分类、数据清单和二维码素材；后续整站替换提交 `f6b4698b4ba8` 删除了 `demos.html`，但 `js/data.js`、交互代码和大部分样式仍留在仓库中。当前恢复做了三件事：

1. 把 Demo 入口重新加入新版顶部导航和旧版静态页面导航。
2. 使用当前 v1.3 视觉体系重新生成 `demos.html`，不把旧页面外壳原样搬回。
3. 沿用现存 `js/data.js` 的清单，并从 Git 历史恢复唯一缺失的二维码图片。

因此，恢复的是历史上真实存在的入口和素材，不是根据截图重新虚构内容。

## 新增或更新一个 Demo

在 `js/data.js` 的 `PROJECTS` 数组中新增或修改一个对象：

```js
{
  cat: "retail",
  badge: "餐饮零售",
  title: "点餐推荐助手 Agent",
  desc: "说明它解决什么问题，不写未经确认的客户事实。",
  tags: ["点餐推荐", "小程序", "个性化推荐"],
  url: "https://example.com/demo/",
  hue: 28,
  live: true,
  featured: true
}
```

字段含义：

- `cat`：必须对应 `CATEGORIES` 中的 `key`。
- `badge`、`title`、`desc`、`tags`：列表展示和本地搜索使用。
- `url`：公开体验地址；含中文路径时必须使用正确的 URL 编码。
- `hue`：卡片装饰色，取 `0` 到 `360`。
- `live`：公开网页 Demo 使用 `true`；视频等非实时内容使用 `false`。
- `featured`：在全部列表中优先排序。
- `spotlight`：只用于少量重点场景；首页首屏固定展示前两条。
- `access: "login"`：外部内容需要登录时必须显式标记，不能显示为公开可访问。
- `type: "doc"`：文档型内容。
- `type: "qr"` 与 `qr`：二维码型内容；`qr` 指向仓库内图片路径。

如果新增分类，同时更新 `CATEGORIES`。不要把 Demo 正文、截图或客户资料硬编码进 `demos.html`。

## 公开口径

- 对外标题使用已确认可公开的产品名或通用场景名。
- 客户名称、客户 Logo、合作关系和上线状态没有书面确认时，不写入公开页面。
- Demo 数据、流程和页面只用于方案沟通，不代表真实客户数据、当前产品承诺或客户背书。
- 客户名称与通用场景的内部映射应保存在非公开项目记录中，不进入公共仓库。
- 需要登录的飞书文档或视频必须标注“需登录”；HTTP 200 不能当成匿名访客可直接访问。

## 提交前检查

```bash
node scripts/export-v13-static.mjs
node --check js/data.js
node --check js/demos.js
node scripts/validate-content.mjs
node scripts/validate-site.mjs
node --test
git diff --check
```

再用本地 HTTP 预览检查：

1. 顶部导航可以进入“案例 Demo”。
2. 两个重点场景预览正常；预览失败时，卡片仍可点击打开原 Demo。
3. 搜索、分类切换、空结果和结果数量正确。
4. 手机端分类可以横向滚动，卡片不溢出。
5. 外部公开链接可在无登录窗口打开；需登录内容的状态标记正确。

完成后只创建 `codex/` 分支和 Draft PR，由人审核后合并，不自动合并 `main`。
