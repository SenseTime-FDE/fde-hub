'use strict';
/**
 * 静态资源版本号：/css/site.css → /css/site.css?v=<内容哈希前 10 位>。
 * 文件一改，地址就变，浏览器不会拿缓存里的旧样式配新页面（v1.2 更新后曾出现下拉菜单无样式、文字铺在页眉上）。
 * 按文件大小与修改时间缓存哈希，文件未变不重复计算；静态路由只看路径，查询串不影响取文件。
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const memo = new Map();

function asset(p) {
  try {
    const st = fs.statSync(path.join(PUBLIC, p));
    const key = `${p}|${st.size}|${st.mtimeMs}`;
    let v = memo.get(key);
    if (!v) {
      v = crypto.createHash('sha1').update(fs.readFileSync(path.join(PUBLIC, p))).digest('hex').slice(0, 10);
      memo.set(key, v);
    }
    return `${p}?v=${v}`;
  } catch {
    return p;
  }
}

module.exports = { asset };
