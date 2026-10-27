'use strict';

/**
 * 自托管静态模式冒烟测试：确认仓库根目录、健康检查、同源 API 和后台入口
 * 在同一个 Node 进程下可以被访问。它以子进程运行，避免影响历史 SSR 测试的环境变量。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'allfde-static-test-'));
let child;
let base;

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

async function waitFor(url) {
  for (let i = 0; i < 40; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`静态模式服务未启动：${url}`);
}

test.before(async () => {
  const port = await freePort();
  const env = {
    ...process.env,
    ALLFDE_STATIC_SITE: '1',
    ALLFDE_STATIC_ROOT: ROOT,
    ALLFDE_DATA: DATA,
    ALLFDE_ADMIN_PASSWORD: 'StaticSmoke1234',
    HOST: '127.0.0.1',
    PORT: String(port),
  };
  const init = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/scripts/init.js'], { cwd: ROOT, env, encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr || init.stdout);
  child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/src/server.js'], { cwd: ROOT, env, stdio: 'ignore' });
  base = `http://127.0.0.1:${port}`;
  await waitFor(`${base}/healthz`);
});

test.after(() => {
  if (child && !child.killed) child.kill('SIGTERM');
  fs.rmSync(DATA, { recursive: true, force: true });
});

test('静态模式提供根目录、技术内容、API 状态和后台入口', async () => {
  for (const p of ['/', '/community/', '/careers.html', '/admin/login']) {
    const r = await fetch(`${base}${p}`);
    assert.equal(r.status, 200, p);
  }
  const health = await fetch(`${base}/healthz`);
  assert.equal(await health.text(), 'ok');
  const status = await fetch(`${base}/api/status`).then((r) => r.json());
  assert.deepEqual(status, { ok: true, service: 'allfde', version: 'selfhost-dev', storage: 'sqlite', static: true });
  const csrf = await fetch(`${base}/api/csrf`);
  assert.equal(csrf.status, 200);
  assert.match((await csrf.json()).csrf, /^[A-Za-z0-9_-]{20,64}$/);
});
