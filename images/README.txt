images/ 存放图片资源。

已包含：
  - sensetime-logo-white.png   商汤白色 logo（导航栏用）
  - sensetime-mark.png         商汤 ∞ 标志（备用）

需要补充的微信小程序二维码（文件名要和 js/data.js 里 qr 字段一致）：
  - 工作管理效率小助手.png

新增扫码类小程序时：
  1) 把二维码图片放进本文件夹；
  2) 在 js/data.js 的 PROJECTS 里加一项，type 设为 "qr"，
     qr 写成 "images/你的文件名.png"。

二维码建议：微信「小程序码」或体验版二维码，正方形、≥500×500px、白底。
