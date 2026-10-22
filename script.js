/* ==========================================================================
   Stillmind — section 2 interactions
   Always on: heading reveal, circles converge on scroll, dot orbit that
   follows the cursor on hover, stats count-up.
   Switchable (.fx-switch, keys 0–4): how the circle image enters on hover.
   ========================================================================== */
(() => {
  const section = document.querySelector('.section_about');
  if (!section) return;

  const $ = (sel) => section.querySelector(sel);
  const $$ = (sel) => [...section.querySelectorAll(sel)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Calls cb(true/false) whenever el enters/leaves the viewport
  const watch = (el, cb, threshold) => {
    new IntersectionObserver(([entry]) => cb(entry.isIntersecting), { threshold }).observe(el);
  };

  section.classList.add('has-fx');

  // ---------- Heading: lines rise out of their masks ----------
  watch($('.about_top'), (inView) => section.classList.toggle('is-heading-in', inView), 0.6);

  // ---------- Circles: converge on scroll + dot orbit / cursor follow ----------
  {
    const items = $$('.about_circle').map((el, i) => ({
      el,
      dot: el.querySelector('.about_circle-inner'),
      hover: false,
      cursorA: 0,
      cur: i * 120,
    }));
    const [left, center, right] = items.map((o) => o.el);
    const main = $('.about_main');
    const SPREAD = 140; // px each side circle starts away from its final spot
    const ORBIT_SPEED = 14; // deg/s while idle
    const SCROLL_BOOST = 0.2; // extra deg/s per px/s of scroll speed
    const MAX_BOOST = 400; // deg/s cap so a hard flick doesn't turn into a blur
    let last = performance.now();
    let lastY = window.scrollY;
    let boost = 0;
    let p = 0;
    let pIn = 0; // entry-only progress: drives opacity, so circles don't fade on the way out

    // Pointer position relative to the circle: angle (deg clockwise from 12 o'clock),
    // offset from center (px) and position inside the box (%)
    const read = (o, e) => {
      const r = o.el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      o.cursorA = (Math.atan2(dx, -dy) * 180) / Math.PI;
      o.el.style.setProperty('--rx', `${((e.clientX - r.left) / r.width) * 100}%`);
      o.el.style.setProperty('--ry', `${((e.clientY - r.top) / r.height) * 100}%`);
      return { dx, dy };
    };

    items.forEach((o) => {
      o.el.addEventListener('pointerenter', (e) => {
        read(o, e);
        o.hover = true;
        o.el.style.setProperty('--from', `${o.cursorA}deg`);
      });
      o.el.addEventListener('pointermove', (e) => {
        const { dx, dy } = read(o, e);
        o.el.style.setProperty('--tx', `${dx * 0.06}px`);
        o.el.style.setProperty('--ty', `${dy * 0.06}px`);
      });
      o.el.addEventListener('pointerleave', (e) => {
        read(o, e); // exit point, so reveals can collapse toward where the pointer left
        o.hover = false;
        o.el.style.setProperty('--tx', '0px');
        o.el.style.setProperty('--ty', '0px');
      });
    });

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1); // cap so a background tab doesn't jump
      last = now;

      // Scroll speed in either direction speeds the orbit up, then eases back to idle
      const scrollSpeed = dt > 0 ? Math.abs(window.scrollY - lastY) / dt : 0;
      lastY = window.scrollY;
      boost += (Math.min(scrollSpeed * SCROLL_BOOST, MAX_BOOST) - boost) * 0.1;

      // p = how "together" the circles are: 0 → 1 as they scroll into view,
      // back to 0 as they scroll up and out (bottom edge from 55% to 5% of the viewport)
      const vh = window.innerHeight;
      const r = main.getBoundingClientRect();
      const enter = clamp((vh * 0.95 - r.top) / (vh * 0.6));
      const exit = clamp((vh * 0.55 - r.bottom) / (vh * 0.5));
      const target = Math.min(enter, 1 - exit);
      const pPrev = p;
      p += (target - p) * 0.12;
      pIn += (enter - pIn) * 0.12;
      const e = easeOut(p);
      const d = (1 - e) * SPREAD;

      left.style.transform = `translate3d(${-d}px, 0, 0)`;
      right.style.transform = `translate3d(${d}px, 0, 0)`;
      center.style.transform = `scale(${0.88 + 0.12 * e})`;
      const opacity = 0.25 + 0.75 * easeOut(pIn);
      items.forEach((o) => { o.el.style.opacity = opacity; });

      // How far the idle orbit moved this frame (time + boost + converge progress)
      // abs(): separating on the way out still pushes the orbit forward, never backwards
      const step = (ORBIT_SPEED + boost) * dt + Math.abs(p - pPrev) * 120;
      const follow = !section.classList.contains('follow-off');
      items.forEach((o, i) => {
        o.idle = (o.idle ?? i * 120) + step;
        const chasing = o.hover && follow;
        const tgt = chasing ? o.cursorA : o.idle;
        const diff = ((((tgt - o.cur) % 360) + 540) % 360) - 180; // shortest way round
        // Idle dots ride along with the orbit and only lerp away the leftover gap,
        // so a fast orbit never lags behind (or wraps the wrong way round)
        o.cur += chasing ? diff * 0.2 : step + diff * 0.06;
        o.dot.style.setProperty('--a', `${o.cur}deg`);
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- Stats: count up + rule draws in ----------
  {
    const items = $$('.about_stat').map((stat) => {
      const num = stat.querySelector('.heading-style-h2');
      const [, digits, suffix] = num.textContent.trim().match(/^([\d,]+)(.*)$/);
      return { stat, num, suffix, to: parseInt(digits.replace(/,/g, ''), 10), comma: digits.includes(',') };
    });
    const fmt = (i, v) => (i.comma ? v.toLocaleString('en-US') : String(v)) + i.suffix;

    // Lock widths so changing digit counts don't push the neighbours around
    items.forEach((i) => { i.stat.style.width = `${i.stat.offsetWidth}px`; });

    let raf;
    const reset = () => items.forEach((i) => { i.num.textContent = fmt(i, 0); });
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        let running = false;
        items.forEach((i, k) => {
          const t = clamp((now - t0 - k * 140) / 1600);
          const v = t === 1 ? i.to : Math.round(i.to * (1 - Math.pow(2, -10 * t)));
          i.num.textContent = fmt(i, v);
          if (t < 1) running = true;
        });
        if (running) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    reset();
    watch($('.about_stats'), (inView) => {
      cancelAnimationFrame(raf);
      section.classList.toggle('is-stats-in', inView);
      if (inView) run(); else reset();
    }, 0.5);
  }

  // ---------- Tuning switcher: zoom direction (.zoom-*), easing (.ease-*),
  // dot follows cursor (.follow-*) ----------
  const params = new URLSearchParams(location.search);

  ['zoom', 'ease', 'follow'].forEach((group) => {
    const buttons = [...document.querySelectorAll(`.fx-switch [data-${group}]`)];
    const keys = buttons.map((b) => b.dataset[group]);

    const activate = (key) => {
      if (!keys.includes(key)) key = keys[0];
      keys.forEach((k) => section.classList.remove(`${group}-${k}`));
      section.classList.add(`${group}-${key}`);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[group] === key)));
      params.set(group, key);
      history.replaceState(null, '', `?${params}`);
    };

    buttons.forEach((b) => b.addEventListener('click', () => activate(b.dataset[group])));
    activate(params.get(group));
  });

  // Out · Photo start scale slider → --zoom-from
  const range = document.getElementById('zoom-from');
  if (range) {
    const output = range.nextElementSibling;
    const apply = () => {
      section.style.setProperty('--zoom-from', range.value);
      output.textContent = `${Number(range.value).toFixed(2)}×`;
      params.set('from', range.value);
      history.replaceState(null, '', `?${params}`);
    };
    if (params.has('from')) range.value = params.get('from');
    range.addEventListener('input', apply);
    apply();
  }
})();
