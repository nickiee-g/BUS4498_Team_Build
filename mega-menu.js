(() => {
  if (window.vsMegaMenu) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const live = new Set(); let raf = 0, last = 0;
  const tick = now => {
    const dt = Math.min(.064, (now - last) / 1000 || .016); last = now;
    for (const t of live) if (!t.update(dt)) live.delete(t);
    raf = live.size ? requestAnimationFrame(tick) : 0;
  };
  const wake = t => { live.add(t); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  /* semi-implicit Euler spring at 120 Hz substeps; e = settle epsilon */
  const sp = (x, k, c, e = .05) => ({ x, v: 0, g: x, k, c, e });
  const run = (s, dt) => {
    if (reduce.matches) { s.x = s.g; s.v = 0; return false; }
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (let i = 0; i < n; i++) { s.v += (-s.k * (s.x - s.g) - s.c * s.v) * h; s.x += s.v * h; }
    if (Math.abs(s.v) < s.e && Math.abs(s.x - s.g) < s.e) { s.x = s.g; s.v = 0; return false; }
    return true;
  };
  const snap = (s, v) => { s.x = s.g = v; s.v = 0; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let uid = 0;

  function mount(nav) {
    if (nav.__vsMm) return nav.__vsMm;
    const bar = nav.querySelector('.vs-mega-menu-bar'), list = nav.querySelector('.vs-mega-menu-list');
    if (!bar || !list) return null;
    const mk = (c, t = 'div') => { const e = document.createElement(t); e.className = c; return e; };
    const hl = mk('vs-mega-menu-hl', 'span'), vp = mk('vs-mega-menu-viewport'), frame = mk('vs-mega-menu-frame');
    const edge = mk('vs-mega-menu-edge', 'span'), fill = mk('vs-mega-menu-fill', 'span'), caret = mk('vs-mega-menu-caret', 'span');
    const clip = mk('vs-mega-menu-clip'), bridge = mk('vs-mega-menu-bridge', 'span');
    [hl, edge, fill, caret, bridge].forEach(e => e.setAttribute('aria-hidden', 'true'));
    bar.prepend(hl); frame.append(edge, fill, caret, clip); vp.append(bridge, frame); nav.append(vp);
    const id = 'vs-mega-menu-' + (++uid);
    const items = [];
    list.querySelectorAll(':scope > li').forEach(li => {
      const trig = li.querySelector(':scope > .vs-mega-menu-trigger'), page = li.querySelector(':scope > .vs-mega-menu-content');
      if (!trig || !page) return;
      page.classList.add('vs-mega-menu-page'); if (!page.id) page.id = id + '-' + items.length;
      clip.append(page); page.inert = true; page.style.visibility = 'hidden';
      trig.setAttribute('aria-expanded', 'false'); trig.setAttribute('aria-controls', page.id);
      trig.insertAdjacentHTML('beforeend', '<svg class="vs-mega-menu-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.6 6 7.6l3-3"/></svg>');
      items.push({ trig, page, w: 0, h: 0, o: sp(0, 420, 40, .002), x: sp(0, 300, 32, .1) });
    });
    const tops = [...bar.querySelectorAll('.vs-mega-menu-trigger, .vs-mega-menu-top, .vs-mega-menu-cta')];
    const F = { x: sp(0, 360, 34), w: sp(0, 360, 34), h: sp(0, 360, 34), c: sp(0, 560, 40), o: sp(0, 420, 34, .002),
      hl: sp(0, 520, 38), hr: sp(0, 520, 38), ho: sp(0, 400, 36, .002) };
    let cur = -1, hot = null, Wm = 0, Hm = 0, R = 18, tOpen = 0, tClose = 0, ptr = 'mouse';
    const mode = () => nav.dataset.open === 'click' ? 'click' : 'hover';
    const visible = el => el.offsetParent !== null;

    function measure() {
      const narrow = innerWidth <= 640;
      nav.style.setProperty('--vs-mega-menu-avail', (narrow ? bar.offsetWidth : innerWidth - 24) + 'px');
      Wm = Hm = 0;
      for (const it of items) { it.w = it.page.offsetWidth; it.h = it.page.offsetHeight; Wm = Math.max(Wm, it.w); Hm = Math.max(Hm, it.h); }
      frame.style.width = Wm + 'px'; frame.style.height = Hm + 'px';
      R = parseFloat(getComputedStyle(nav).getPropertyValue('--vs-mega-menu-radius')) || 18;
    }
    function target(i) {
      const it = items[i], nr = nav.getBoundingClientRect(), tr = it.trig.getBoundingClientRect(), br = bar.getBoundingClientRect();
      const tc = tr.left + tr.width / 2 - nr.left, bl = br.left - nr.left, bw = br.width, w = it.w;
      let x = w <= bw ? clamp(tc - w / 2, bl, bl + bw - w) : bl + (bw - w) / 2;
      x = clamp(x, 12 - nr.left, innerWidth - 12 - nr.left - w);
      return { x, w, h: it.h, c: clamp(tc - x, R + 14, w - R - 14) };
    }
    function aimHl(el) {
      if (!el || !visible(el)) { F.ho.g = 0; wake(api); return; }
      const l = el.offsetLeft + (el.offsetParent === bar ? 0 : el.offsetParent.offsetLeft), r = l + el.offsetWidth;
      if (F.ho.x < .08) { snap(F.hl, l); snap(F.hr, r); } else { F.hl.g = l; F.hr.g = r; }
      F.ho.g = 1; wake(api);
    }
    const restHl = () => aimHl(hot || (cur >= 0 ? items[cur].trig : null));

    function open(i, { focus = false } = {}) {
      clearTimeout(tOpen); clearTimeout(tClose);
      if (i < 0 || i >= items.length) return;
      const it = items[i];
      if (i !== cur) {
        const prev = cur; cur = i;
        const T = target(i), fresh = prev < 0 || F.o.x < .2;
        if (fresh) {
          snap(F.x, T.x); snap(F.w, T.w); snap(F.h, T.h); snap(F.c, T.c);
          items.forEach(o => { snap(o.o, 0); snap(o.x, 0); });
          snap(it.o, 1);
        } else {
          F.x.g = T.x; F.w.g = T.w; F.h.g = T.h; F.c.g = T.c;
          const dir = Math.sign(i - prev) || 1;
          items.forEach((o, j) => { if (j !== i) { o.o.g = 0; o.o.k = 1100; o.o.c = 66; o.x.g = -dir * 30; } });
          if (it.o.x < .05) snap(it.x, dir * 36);
          it.o.g = 1; it.o.k = 240; it.o.c = 30; it.x.g = 0;
        }
        F.o.g = 1;
        items.forEach((o, j) => { o.trig.setAttribute('aria-expanded', String(j === i)); o.page.inert = j !== i; });
        nav.classList.add('is-open');
        nav.dispatchEvent(new CustomEvent('megaopen', { bubbles: true, detail: { index: i } }));
        restHl(); wake(api);
      }
      if (focus) { it.page.style.visibility = 'visible'; const f = it.page.querySelector(FOCUSABLE); f && f.focus({ preventScroll: true }); }
    }
    function close() {
      clearTimeout(tOpen); clearTimeout(tClose);
      if (cur < 0) return;
      cur = -1; F.o.g = 0;
      items.forEach(o => { o.trig.setAttribute('aria-expanded', 'false'); o.page.inert = true; });
      nav.classList.remove('is-open');
      nav.dispatchEvent(new CustomEvent('megaclose', { bubbles: true }));
      restHl(); wake(api);
    }

    const api = {
      open: i => open(i), close,
      update(dt) {
        let moving = false;
        for (const k in F) if (run(F[k], dt)) moving = true;
        for (const it of items) { if (run(it.o, dt)) moving = true; if (run(it.x, dt)) moving = true; }
        const w = F.w.x, h = F.h.x, o = clamp(F.o.x, 0, 1), hw = devicePixelRatio >= 2 ? .5 : 1;
        const ri = Wm - w, bi = Hm - h;
        edge.style.clipPath = `inset(0 ${ri.toFixed(2)}px ${bi.toFixed(2)}px 0 round ${R}px)`;
        clip.style.clipPath = fill.style.clipPath = `inset(${hw}px ${(ri + hw).toFixed(2)}px ${(bi + hw).toFixed(2)}px ${hw}px round ${Math.max(0, R - hw)}px)`;
        caret.style.transform = `translate3d(${F.c.x.toFixed(2)}px,0,0) rotate(45deg)`;
        frame.style.transformOrigin = `${F.c.x.toFixed(1)}px 0`;
        frame.style.transform = `translate3d(${F.x.x.toFixed(2)}px,${(-10 * (1 - o)).toFixed(2)}px,0) scale(${(.965 + .035 * o).toFixed(4)})`;
        frame.style.opacity = o.toFixed(3);
        bridge.style.transform = `translate3d(${F.x.x.toFixed(2)}px,0,0) scaleX(${(w / 100).toFixed(4)})`;
        vp.style.visibility = o < .005 && cur < 0 ? 'hidden' : 'visible';
        for (const it of items) {
          const po = clamp(it.o.x, 0, 1);
          it.page.style.opacity = po.toFixed(3);
          it.page.style.transform = `translate3d(${it.x.x.toFixed(2)}px,0,0)`;
          it.page.style.visibility = po < .01 ? 'hidden' : 'visible';
        }
        hl.style.clipPath = `inset(.375em ${(bar.offsetWidth - F.hr.x).toFixed(2)}px .375em ${F.hl.x.toFixed(2)}px round ${(R * .55 + 2).toFixed(1)}px)`;
        hl.style.opacity = clamp(F.ho.x, 0, 1).toFixed(3);
        return moving;
      },
    };

    nav.addEventListener('pointerdown', e => { ptr = e.pointerType; }, true);
    items.forEach((it, i) => {
      it.trig.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse' || mode() !== 'hover') return;
        clearTimeout(tClose); clearTimeout(tOpen);
        tOpen = setTimeout(() => open(i), cur < 0 ? 70 : 20);
      });
      it.trig.addEventListener('pointerleave', () => clearTimeout(tOpen));
      it.trig.addEventListener('click', e => {
        const mouseHover = mode() === 'hover' && e.detail > 0 && ptr === 'mouse';
        if (mouseHover) { open(i); return; }
        cur === i ? close() : open(i);
      });
    });
    bar.addEventListener('pointerover', e => {
      const t = e.target.closest('.vs-mega-menu-trigger, .vs-mega-menu-top, .vs-mega-menu-cta');
      if (e.pointerType !== 'mouse') return;
      hot = t; restHl();
      if (t && !t.classList.contains('vs-mega-menu-trigger') && mode() === 'hover' && cur >= 0) { clearTimeout(tClose); tClose = setTimeout(close, 90); }
    });
    bar.addEventListener('pointerleave', () => { hot = null; restHl(); });
    nav.addEventListener('pointerenter', () => { if (cur >= 0) clearTimeout(tClose); });
    nav.addEventListener('pointerleave', e => {
      if (vp.contains(document.activeElement)) return;
      if (e.pointerType === 'mouse' && mode() === 'hover' && cur >= 0) { clearTimeout(tClose); tClose = setTimeout(close, 260); }
    });
    vp.addEventListener('pointerenter', () => clearTimeout(tClose));
    document.addEventListener('pointerdown', e => { if (cur >= 0 && !nav.contains(e.target)) close(); });

    const inPage = () => cur >= 0 ? [...items[cur].page.querySelectorAll(FOCUSABLE)] : [];
    const topVisible = () => tops.filter(visible);
    nav.addEventListener('keydown', e => {
      const a = document.activeElement, T = topVisible(), ti = T.indexOf(a), ii = items.findIndex(it => it.trig === a);
      if (e.key === 'Escape' && cur >= 0) { const t = items[cur].trig; close(); t.focus(); e.preventDefault(); return; }
      if (ti >= 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const n = T[(ti + (e.key === 'ArrowRight' ? 1 : -1) + T.length) % T.length]; n.focus();
          const j = items.findIndex(it => it.trig === n);
          if (cur >= 0) j >= 0 ? open(j) : close();
          return;
        }
        if (ii >= 0 && e.key === 'ArrowDown') { e.preventDefault(); open(ii, { focus: true }); return; }
        if (ii >= 0 && e.key === 'Tab' && !e.shiftKey && cur === ii) { const f = inPage()[0]; if (f) { e.preventDefault(); f.focus(); } return; }
        return;
      }
      const P = inPage(), pi = P.indexOf(a);
      if (pi < 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); P[clamp(pi + (e.key === 'ArrowDown' ? 1 : -1), 0, P.length - 1)].focus(); return; }
      if (e.key === 'Tab') {
        const t = items[cur].trig;
        if (e.shiftKey && pi === 0) { e.preventDefault(); t.focus(); }
        else if (!e.shiftKey && pi === P.length - 1) { e.preventDefault(); const n = T[T.indexOf(t) + 1]; close(); (n || t).focus(); }
      }
    });
    nav.addEventListener('focusin', e => { const t = e.target.closest('.vs-mega-menu-trigger, .vs-mega-menu-top, .vs-mega-menu-cta'); if (t && t.matches(':focus-visible')) { hot = t; restHl(); } });
    nav.addEventListener('focusout', () => setTimeout(() => { if (!nav.contains(document.activeElement)) { hot = null; if (ptr !== 'mouse' || mode() === 'click' || !nav.matches(':hover')) close(); restHl(); } }));

    const refit = () => {
      measure();
      if (cur >= 0) { const T = target(cur); F.x.g = T.x; F.w.g = T.w; F.h.g = T.h; F.c.g = T.c; if (!live.has(api)) { snap(F.x, T.x); snap(F.w, T.w); snap(F.h, T.h); snap(F.c, T.c); } }
      wake(api);
    };
    const ro = new ResizeObserver(refit); items.forEach(it => ro.observe(it.page)); ro.observe(bar);
    addEventListener('resize', refit);
    document.fonts && document.fonts.ready.then(refit);
    measure(); api.update(0);
    nav.__vsMm = api;
    return api;
  }
  const init = () => document.querySelectorAll('.vs-mega-menu').forEach(mount);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.vsMegaMenu = { mount };
})();
