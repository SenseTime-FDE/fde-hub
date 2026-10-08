/* allfde.com 前端交互：页眉滚动态、移动端菜单、导航下拉、入场动画、表单防重复提交与简历大小校验、
   「体验身份」（有客户 / 有产品 / 有团队 → 推荐伙伴身份并预填申请表）、「体验简历选择」（推荐岗位方向）。不依赖第三方库。 */
(function () {
  'use strict';
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('nav-open')) toggle.click(); });
    header.querySelectorAll('.main-nav a').forEach(function (a) { a.addEventListener('click', function () { if (header.classList.contains('nav-open')) toggle.click(); }); });
  }

  // 导航下拉（产品与方案 · 云端 MaaS）：桌面悬停或聚焦即展开；箭头按钮点击展开 / 收起（触屏与手机菜单）；Esc、点外部、选中后关闭
  var menus = document.querySelectorAll('[data-menu]');
  var closeMenu = function (m) { m.classList.remove('open'); var b = m.querySelector('.menu-toggle'); if (b) b.setAttribute('aria-expanded', 'false'); };
  menus.forEach(function (m) {
    var btn = m.querySelector('.menu-toggle');
    if (btn) btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !m.classList.contains('open');
      menus.forEach(function (x) { if (x !== m) closeMenu(x); });
      m.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    m.querySelectorAll('.nav-menu a').forEach(function (a) { a.addEventListener('click', function () { closeMenu(m); a.blur(); }); });
  });
  document.addEventListener('click', function (e) { menus.forEach(function (m) { if (!m.contains(e.target)) closeMenu(m); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (m) {
      var inside = m.contains(document.activeElement);
      if (m.classList.contains('open') || inside) { closeMenu(m); if (inside) { var link = m.querySelector('.nav-link'); if (link) { link.focus(); link.blur(); } } }
    });
  });

  // 入场动画：不支持 IntersectionObserver 或偏好减少动效时直接显示
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.section .h-section, .section .card, .flow li, .stat, .team-points li, .job-list li, .op-col, .cat-group, .eco-col, .p-steps li, .arch-row');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el, i) { el.classList.add('reveal'); el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  }

  // 表单：提交后禁用按钮防重复；简历超过 10 MB 直接提示；多选组至少选一项
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var file = form.querySelector('input[type=file]');
      if (file && file.files && file.files[0] && file.files[0].size > 10 * 1024 * 1024) { e.preventDefault(); alert('简历附件不能超过 10 MB'); return; }
      var need = form.querySelector('fieldset[data-checks="partner_type"]');
      if (need && !need.querySelector('input:checked')) { e.preventDefault(); alert('请至少选择一种伙伴身份'); need.scrollIntoView({ block: 'center' }); return; }
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '提交中…'; }
    });
  });
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('button[type=submit][disabled]').forEach(function (b) { b.disabled = false; if (b.dataset.label) b.textContent = b.dataset.label; });
  });

  // 体验身份
  var idBtns = document.querySelectorAll('[data-id]');
  if (idBtns.length) {
    var TYPE = { channel: 'FDE 渠道伙伴', isv: 'FDE 生态伙伴（ISV）', service: 'FDE 服务伙伴' };
    var HAVE = { channel: '有客户', isv: '有产品', service: '有团队' };
    var title = document.querySelector('[data-id-title]');
    var items = document.querySelectorAll('[data-id-item]');
    var cards = document.querySelectorAll('[data-ptype]');
    var picked = function () { return Array.prototype.filter.call(idBtns, function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.getAttribute('data-id'); }); };
    var render = function () {
      var keys = picked();
      items.forEach(function (li) { var k = li.getAttribute('data-id-item'); li.classList.toggle('hit', keys.indexOf(k) > -1); li.classList.toggle('dim', keys.length > 0 && keys.indexOf(k) < 0); });
      cards.forEach(function (c) { c.classList.toggle('on', keys.indexOf(c.getAttribute('data-ptype')) > -1); });
      if (title) title.textContent = keys.length ? '推荐身份：' + keys.map(function (k) { return TYPE[k]; }).join(' ＋ ') : '先选一个，看看适合你的身份';
    };
    idBtns.forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); render(); }); });
    var apply = document.querySelector('[data-id-apply]');
    if (apply) apply.addEventListener('click', function () {
      var keys = picked();
      if (!keys.length) return;
      document.querySelectorAll('input[name="partner_type"]').forEach(function (i) { i.checked = keys.some(function (k) { return TYPE[k] === i.value; }); });
      document.querySelectorAll('input[name="has_what"]').forEach(function (i) { i.checked = keys.some(function (k) { return HAVE[k] === i.value; }); });
    });
  }

  // 体验简历选择
  var roleBtns = document.querySelectorAll('[data-role-opt]');
  if (roleBtns.length) {
    var out = document.querySelector('[data-role-result]');
    roleBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-role-opt');
        roleBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        document.querySelectorAll('[data-role]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-role') === key); });
        var card = document.querySelector('[data-role="' + key + '"]');
        if (card && out) {
          var name = card.querySelector('h3').textContent; var link = card.querySelector('a');
          out.innerHTML = '';
          out.appendChild(document.createTextNode('推荐方向：' + name + ' —— ' + card.querySelector('p').textContent + ' '));
          if (link) { var a = document.createElement('a'); a.href = link.getAttribute('href'); a.textContent = '看相关岗位 →'; out.appendChild(a); }
        }
      });
    });
  }
})();
