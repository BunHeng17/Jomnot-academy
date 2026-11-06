(() => {
  'use strict';

  /* ---------- Dark mode ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme, animate) => {
    if (animate) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 500);
    }
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // follow the system setting until the visitor picks a theme themselves
  systemDark.addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', true);
  });

  /* ---------- Header: scrolled state, back-to-top ---------- */
  const header = document.querySelector('.site-header');
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 20);
    toTop.classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('.count');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => { c.textContent = '0'; countObserver.observe(c); });

  /* ---------- Course filters ---------- */
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('#courseGrid .card');
  const emptyNote = document.getElementById('emptyNote');

  const matches = (card, f) => {
    if (f === 'all') return true;
    if (f === 'free-online') return card.dataset.free === 'yes' && card.dataset.mode === 'online';
    return card.dataset.cat === f;
  };

  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    let shown = 0;
    cards.forEach(card => {
      card.classList.remove('fade-in');
      const ok = matches(card, f);
      card.classList.toggle('hide', !ok);
      if (ok) {
        card.classList.add('reveal', 'in'); // keep visible even if not yet observed
        void card.offsetWidth;              // restart animation
        card.style.setProperty('--d', '0s');
        card.classList.add('fade-in');
        card.style.animationDelay = `${shown * 0.06}s`;
        shown++;
      }
    });
    emptyNote.hidden = shown !== 0;
  }));

  /* ---------- "Apply now" pre-selects the course ---------- */
  const courseSelect = document.getElementById('courseSelect');
  document.querySelectorAll('.apply').forEach(link => {
    link.addEventListener('click', () => {
      const name = link.dataset.course;
      [...courseSelect.options].forEach(opt => {
        if (opt.textContent.trim() === name) courseSelect.value = opt.value || opt.textContent;
      });
      const card = link.closest('.card');
      const formatSelect = document.querySelector('select[name="format"]');
      if (card && formatSelect) {
        const free = card.dataset.free === 'yes';
        const online = card.dataset.mode === 'online';
        formatSelect.value = online ? (free ? 'Free Online' : 'Paid Online') : 'In Person';
      }
    });
  });

  /* ---------- Form validation + fake submit ---------- */
  const form = document.getElementById('applyForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const bad = !field.value.trim();
      field.classList.remove('invalid');
      if (bad) {
        void field.offsetWidth;
        field.classList.add('invalid');
        valid = false;
      }
    });
    const email = form.elements.email;
    if (email.value && !/^\S+@\S+\.\S+$/.test(email.value)) {
      email.classList.add('invalid');
      valid = false;
    }
    if (!valid) {
      status.classList.add('err');
      status.textContent = 'Please fill in the highlighted fields.';
      return;
    }

    const label = form.querySelector('.btn-label');
    const original = label.textContent;
    label.textContent = 'Sending…';

    // TODO: replace this timeout with a real request, e.g.
    // fetch('/api/apply', { method: 'POST', body: new FormData(form) })
    setTimeout(() => {
      label.textContent = original;
      status.classList.add('ok');
      status.textContent = 'Thank you! The Jomnot team will get in touch soon.';
      form.reset();
    }, 900);
  });
  form.querySelectorAll('input, select, textarea').forEach(f =>
    f.addEventListener('input', () => f.classList.remove('invalid')));

  /* ---------- Image fallback (gradient placeholder stays visible) ---------- */
  document.querySelectorAll('img').forEach(img => {
    const mark = () => img.classList.add('broken');
    img.addEventListener('error', mark);
    if (img.complete && img.naturalWidth === 0) mark();
  });

  /* ---------- Subtle parallax on hero collage ---------- */
  const banner = document.querySelector('.hero-banner');
  const collage = document.querySelector('.collage');
  if (banner && collage && window.matchMedia('(hover: hover)').matches) {
    banner.addEventListener('mousemove', (e) => {
      const r = banner.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      collage.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
    });
    banner.addEventListener('mouseleave', () => { collage.style.transform = ''; });
    collage.style.transition = 'transform .4s ease-out';
  }
})();