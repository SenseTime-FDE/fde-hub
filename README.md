# 商汤 FDE · 对外宣传页

商汤 FDE（Forward Deployed Engineer）团队对外宣传站 —— 介绍团队定位与能力，并集中展示交付的 Agent 作品 Demo。采用商汤官网 VI 浅色风格（暖白底 `#FBFAF7`、白卡片、主红 `#F02E27`、红橙暖色渐变、克制留白、温暖科技感）。

> **Slogan：把 AI 部署到业务最前线**

## 页面板块

1. **首屏 Hero** —— 品牌头部、Slogan、一句话定义、CTA。
2. **关于 FDE** —— 什么是 FDE + 三大定位（翻译器 / 验证器 / 推动者）。
3. **核心能力 · 六大角色** —— 数据驱动的六张角色卡。
4. **作品 Demo** —— 5 个 Agent Demo，网页类点击直达、小程序类扫码体验。
5. **客户价值** —— FDE 对客户的六项价值。
6. **联系 / CTA** —— 产品咨询入口。

## 目录结构

```
sensetime-fde-demo-hub/
├── index.html          # 页面结构（各板块）
├── css/
│   └── style.css       # 全部样式，主题色集中在 :root（商汤 VI）
├── js/
│   ├── data.js         # ★ 维护数据：Demo / 分类 / 六大角色 / 客户价值
│   └── main.js         # 渲染与交互逻辑（一般无需改动）
├── images/
│   ├── sensetime-logo.png         # 商汤彩色 logo（浅色底用）
│   ├── sensetime-logo-white.png   # 白色 logo（深色底备用）
│   ├── sensetime-mark.png         # 商汤 ∞ 标志
│   ├── 工作管理效率小助手.png       # ← 待补充的小程序二维码
│   └── README.txt
├── package.json
├── .gitignore
└── README.md
```

## 本地预览

纯静态站点，无需构建。任选其一：

```bash
npm start                       # = npx serve . → http://localhost:3000
# 或
python3 -m http.server 8080     # → http://localhost:8080
```
也可直接双击 `index.html`（但本地文件下 iframe 预览可能受限，用服务器更稳）。

## 日常维护：只改 `js/data.js`

### 新增网页类 Demo

```js
{
  cat:"expo", badge:"会展 Expo", title:"新的展位 Agent",
  desc:"一句话简介。", tags:["Agent","推荐系统"],
  url:"https://your-demo-url",   // 含中文先 encodeURI 编码
  hue:18, live:true,
}
```

### 新增小程序类 Demo（扫码）

把二维码图片放进 `images/`，然后在 `PROJECTS` 加：

```js
{
  cat:"sales", type:"qr", badge:"销售 Sales", title:"工作管理效率小助手",
  desc:"微信扫码即可体验。", tags:["小程序","体验版"],
  qr:"images/工作管理效率小助手.png", hue:32,
}
```

### 其它

- **六大角色 / 客户价值**：改 `data.js` 的 `ROLES`、`VALUES` 数组。
- **分类标签**：改 `CATEGORIES`。
- **配色 / 圆角 / 宽度**：改 `css/style.css` 顶部 `:root` 变量（已对齐商汤 VI 色值）。
- **标题 / Slogan / 文案 / 各板块说明**：改 `index.html` 对应文字。

## 商汤 VI 色值（已内置于 :root）

| 用途 | 色值 |
| --- | --- |
| 主红（CTA / 强调） | `#F02E27` |
| 页面底色（暖白） | `#FBFAF7` |
| 内容白（卡片） | `#FFFFFF` |
| 正文黑 | `#000000` |
| 辅助灰（说明文） | `#667085` |
| 分割线 | `#E7DFD4` |

> 渐变原则：左上保留暖白，右下叠加红橙；保持暖红品牌识别。

## 部署

纯静态，把整个目录作为站点根目录发布即可（GitHub Pages / Netlify / Vercel / 内网 Nginx）。
GitHub Pages 注意：`index.html` 与 `css/`、`js/`、`images/` 必须保持同级一起上传。

---

© 2026 商汤科技 SenseTime · Forward Deployed Engineering
