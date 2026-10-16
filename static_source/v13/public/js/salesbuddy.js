/* 仅增强 SalesBuddy 产品页；不依赖外部库、账号、API 或浏览器存储。 */
(function () {
  'use strict';
  var root = document.querySelector('.sb-page');
  if (!root) return;

  // 首屏录屏独立于下方旋转展台；用户暂停后保持暂停，离屏时释放播放资源。
  var heroVideo = root.querySelector('[data-sb-video]');
  var heroVideoToggle = root.querySelector('[data-sb-video-toggle]');
  if (heroVideo && heroVideoToggle) {
    var heroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var heroVideoIntent = !heroMotion.matches;
    var heroVideoVisible = !('IntersectionObserver' in window);
    heroVideo.muted = true;
    heroVideo.controls = false;
    heroVideoToggle.hidden = false;

    function heroVideoLabel() {
      heroVideoToggle.textContent = heroVideo.paused ? '播放演示' : '暂停演示';
      heroVideoToggle.setAttribute('aria-label', heroVideo.paused ? '播放小程序演示视频' : '暂停小程序演示视频');
    }
    function heroVideoSync() {
      if (heroVideoIntent && heroVideoVisible && !document.hidden) {
        if (heroVideo.paused) {
          var playing = heroVideo.play();
          if (playing) playing.catch(function (error) {
            // 浏览器限制自动播放时保留明确的手动播放入口。
            if (error.name !== 'AbortError') heroVideoIntent = false;
            heroVideoLabel();
          });
        }
      } else {
        heroVideo.pause();
      }
      heroVideoLabel();
    }
    heroVideoToggle.addEventListener('click', function () {
      heroVideoIntent = heroVideo.paused;
      heroVideoSync();
    });
    heroVideo.addEventListener('play', heroVideoLabel);
    heroVideo.addEventListener('pause', heroVideoLabel);
    heroVideo.addEventListener('error', function () {
      heroVideoIntent = false;
      heroVideo.controls = true;
      heroVideoToggle.hidden = true;
    });
    document.addEventListener('visibilitychange', heroVideoSync);
    heroMotion.addEventListener('change', function () {
      heroVideoIntent = !heroMotion.matches;
      heroVideoSync();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVideoVisible = entries[0].isIntersecting;
        heroVideoSync();
      }).observe(heroVideo);
    }
    heroVideoSync();
  }

  // 可选后端/路由接入点：外部监听 salesbuddy:action 并 preventDefault()，
  // 接管入口。未接管时始终使用原生链接；这里只传动作与地址，不发送数据。
  root.querySelectorAll('[data-sb-action]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      var action = new CustomEvent('salesbuddy:action', {
        bubbles: true,
        cancelable: true,
        detail: { action: link.dataset.sbAction, href: link.getAttribute('href') }
      });
      if (!link.dispatchEvent(action)) event.preventDefault();
    });
  });

  var tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      var panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });

  // 小程序展台：CSS 透视排布，事件只更新选中项，无第三方动画或 WebGL 依赖。
  var mini = root.querySelector('[data-mini-showcase]');
  if (mini) {
    var miniCards = Array.from(mini.querySelectorAll('[data-mini-card]'));
    var miniSelectors = Array.from(mini.querySelectorAll('[data-mini-select]'));
    var miniStage = mini.querySelector('[data-mini-stage]');
    var miniZoom = mini.querySelector('[data-mini-zoom]');
    var miniCaption = mini.querySelector('[data-mini-caption]');
    var miniMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var miniIndex = 0;
    var miniAuto = !miniMotion.matches;
    var miniHover = false;
    var miniVisible = false;
    var miniTimer;
    function miniSchedule() {
      window.clearTimeout(miniTimer);
      miniCaption.setAttribute('aria-live', miniAuto ? 'off' : 'polite');
      if (!miniAuto || !miniVisible || miniHover || document.hidden || miniMotion.matches) return;
      miniTimer = window.setTimeout(function () { miniRender(miniIndex + 1); }, 5200);
    }
    function miniRender(index) {
      miniIndex = (index + miniCards.length) % miniCards.length;
      miniCards.forEach(function (card, i) {
        var offset = (i - miniIndex + miniCards.length) % miniCards.length;
        if (offset > miniCards.length / 2) offset -= miniCards.length;
        var active = i === miniIndex;
        card.style.setProperty('--mini-offset', offset);
        card.style.setProperty('--mini-depth', Math.abs(offset));
        card.style.setProperty('--mini-angle', -Math.sign(offset) * 32 + 'deg');
        card.dataset.distance = String(Math.abs(offset));
        card.tabIndex = active ? 0 : -1;
        card.setAttribute('aria-hidden', String(!active));
        card.setAttribute('aria-label', (active ? '放大查看：' : '切换到：') + card.dataset.miniTitle);
      });
      miniSelectors.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === miniIndex)); });
      var card = miniCards[miniIndex];
      var shot = card.querySelector('img');
      miniCaption.querySelector('[data-mini-title]').textContent = card.dataset.miniTitle;
      miniCaption.querySelector('[data-mini-description]').textContent = card.dataset.miniText;
      miniCaption.querySelector('[data-mini-number]').textContent = String(miniIndex + 1).padStart(2, '0');
      miniZoom.href = shot.getAttribute('src');
      miniZoom.dataset.caption = shot.alt;
      miniZoom.dataset.alt = shot.alt;
      miniSchedule();
    }
    function miniSelect(index) { miniAuto = false; miniRender(index); }
    miniCards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (i !== miniIndex) miniSelect(i);
        else { miniAuto = false; miniSchedule(); miniZoom.click(); }
      });
    });
    miniSelectors.forEach(function (button, i) { button.addEventListener('click', function () { miniSelect(i); }); });
    mini.querySelector('[data-mini-prev]').addEventListener('click', function () { miniSelect(miniIndex - 1); });
    mini.querySelector('[data-mini-next]').addEventListener('click', function () { miniSelect(miniIndex + 1); });
    // 仅在图片上悬停暂停，移出后继续；手动切换则保留当前界面。
    miniStage.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse') { miniHover = true; miniSchedule(); } });
    miniStage.addEventListener('pointerleave', function (event) { if (event.pointerType === 'mouse') { miniHover = false; miniSchedule(); } });
    mini.addEventListener('focusin', function (event) {
      if (!mini.contains(event.relatedTarget)) { miniAuto = false; miniSchedule(); }
    });
    mini.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowLeft') next = miniIndex - 1;
      if (event.key === 'ArrowRight') next = miniIndex + 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = miniCards.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      miniSelect(next);
      if (event.target.closest('[data-mini-card]')) miniCards[miniIndex].focus({ preventScroll: true });
      else if (event.target.matches('[data-mini-select]')) miniSelectors[miniIndex].focus({ preventScroll: true });
    });

    // 横向拖动才接管指针；竖向手势继续交给页面滚动。
    var miniPointer;
    var miniIgnoreClickUntil = 0;
    miniStage.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || event.button !== 0) return;
      miniPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dragging: false };
    });
    miniStage.addEventListener('pointermove', function (event) {
      if (!miniPointer || event.pointerId !== miniPointer.id) return;
      var dx = event.clientX - miniPointer.x;
      var dy = event.clientY - miniPointer.y;
      if (!miniPointer.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) { miniPointer = null; return; }
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        miniPointer.dragging = true;
        miniPointer.dx = dx;
        miniStage.setPointerCapture(event.pointerId);
        miniStage.classList.add('is-dragging');
        miniStage.style.setProperty('--mini-drag', Math.max(-65, Math.min(65, dx * .24)) + 'px');
        miniAuto = false;
        miniSchedule();
      }
    });
    function miniRelease(event) {
      if (!miniPointer || miniPointer.id !== event.pointerId) return;
      var pointer = miniPointer;
      miniPointer = null;
      miniStage.classList.remove('is-dragging');
      miniStage.style.setProperty('--mini-drag', '0px');
      if (miniStage.hasPointerCapture(event.pointerId)) miniStage.releasePointerCapture(event.pointerId);
      if (pointer.dragging) {
        miniIgnoreClickUntil = Date.now() + 400;
        if (event.type !== 'pointercancel' && Math.abs(pointer.dx) > 45) miniSelect(miniIndex + (pointer.dx < 0 ? 1 : -1));
      }
    }
    miniStage.addEventListener('pointerup', miniRelease);
    miniStage.addEventListener('pointercancel', miniRelease);
    miniStage.addEventListener('click', function (event) {
      if (Date.now() < miniIgnoreClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    document.addEventListener('visibilitychange', miniSchedule);
    miniMotion.addEventListener('change', function () {
      miniAuto = false;
      miniSchedule();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        miniVisible = entries[0].intersectionRatio >= .25;
        miniSchedule();
      }, { threshold: .25 }).observe(mini);
    } else { miniVisible = true; }
    miniRender(0);
  }

  var dialog = root.querySelector('.sb-lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    var trigger;
    var image = dialog.querySelector('img');
    root.querySelectorAll('[data-sb-zoom]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        trigger = link;
        image.src = link.getAttribute('href');
        image.alt = link.dataset.alt || link.querySelector('img').alt;
        dialog.querySelector('#sb-lightbox-title').textContent = link.dataset.caption;
        dialog.showModal();
      });
    });
    dialog.querySelector('[data-sb-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
      image.removeAttribute('src');
      if (trigger) trigger.focus({ preventScroll: true });
    });
  }

  var navLinks = Array.from(root.querySelectorAll('.sb-nav-links a'));
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    navLinks.forEach(function (link) {
      var section = document.getElementById(link.hash.slice(1));
      if (section) observer.observe(section);
    });
  }
})();
