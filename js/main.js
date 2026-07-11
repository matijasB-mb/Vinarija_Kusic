/* ===== Vinarija Kušić — interakcije ===== */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- reveal on scroll --- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* --- mobilni izbornik --- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* --- degustacije: zum grozda pri scrollu --- */
  const grozd = document.getElementById('grozd');
  if (grozd && !reduced) {
    let ticking = false;
    function updateZoom() {
      const r = grozd.getBoundingClientRect();
      const vh = window.innerHeight;
      /* napredak: 0 kad grozd ulazi odozdo, 1 kad mu je sredina u sredini ekrana */
      const progress = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55 + r.height * 0.5)));
      const zoom = 0.78 + 0.22 * easeOut(progress);
      grozd.style.setProperty('--zoom', zoom.toFixed(3));
      ticking = false;
    }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateZoom); ticking = true; }
    }, { passive: true });
    updateZoom();
  } else if (grozd) {
    grozd.style.setProperty('--zoom', '1');
  }

  /* --- carousel proslave --- */
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const track = carousel.querySelector('.car-track');
    const slides = track.children;
    const dotsBox = carousel.querySelector('.car-dots');
    let idx = 0, timer = null;

    for (let i = 0; i < slides.length; i++) {
      const d = document.createElement('button');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Fotografija ' + (i + 1));
      d.addEventListener('click', () => go(i, true));
      dotsBox.appendChild(d);
    }
    const dots = dotsBox.children;

    function go(i, user) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      for (let k = 0; k < dots.length; k++) dots[k].classList.toggle('active', k === idx);
      if (user) restart();
    }
    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(() => go(idx + 1, false), 5000);
    }
    carousel.querySelector('.prev').addEventListener('click', () => go(idx - 1, true));
    carousel.querySelector('.next').addEventListener('click', () => go(idx + 1, true));

    /* swipe */
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }, { passive: true });

    go(0, false); restart();
  }

  /* --- galerija: parallax scroll grid --- */
  const ps = document.getElementById('gal-parallax');
  if (ps && !reduced) {
    const colA = ps.querySelector('.ps-col-a');
    const colC = ps.querySelector('.ps-col-c');
    let psTick = false;
    function updatePs() {
      const r = ps.getBoundingClientRect();
      const vh = window.innerHeight;
      /* 0 dok grid ulazi odozdo → 1 kad je proscrollan */
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const m = window.innerWidth <= 760 ? 0.25 : 1; /* blaže na mobitelu */
      /* blagi pomak i nagib — dovoljno za dubinu, bez preklapanja stupaca */
      const x = 70 * p * m, y = -90 * p * m, rot = 4 * p * m;
      colA.style.transform = 'translate(' + (-x).toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (-rot).toFixed(2) + 'deg)';
      colC.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
      psTick = false;
    }
    window.addEventListener('scroll', () => {
      if (!psTick) { requestAnimationFrame(updatePs); psTick = true; }
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!psTick) { requestAnimationFrame(updatePs); psTick = true; }
    }, { passive: true });
    updatePs();
  }

  /* --- lightbox --- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');
  const items = Array.from(document.querySelectorAll('[data-lightbox]'));
  /* grupiranje po sekciji: klik na diplomu lista samo diplome, na galeriju samo galeriju… */
  const groupOf = el => { const s = el.closest('section'); return (s && s.id) || 'stranica'; };
  let lbList = items;
  let lbIdx = 0;

  function openLb(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const el = lbList[lbIdx];
    lbImg.src = el.src;
    lbImg.alt = el.alt || '';
    lbCap.textContent = el.getAttribute('data-lightbox') || '';
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 300);
  }
  items.forEach(el => el.addEventListener('click', () => {
    const g = groupOf(el);
    lbList = items.filter(x => groupOf(x) === g);
    openLb(lbList.indexOf(el));
  }));
  lb.querySelector('.lb-close').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); openLb(lbIdx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); openLb(lbIdx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIdx - 1);
    if (e.key === 'ArrowRight') openLb(lbIdx + 1);
  });

  /* swipe u lightboxu */
  let lx0 = null;
  lb.addEventListener('touchstart', e => { lx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (lx0 === null) return;
    const dx = e.changedTouches[0].clientX - lx0;
    if (Math.abs(dx) > 40) openLb(lbIdx + (dx < 0 ? 1 : -1));
    lx0 = null;
  }, { passive: true });

  /* --- priznanja: bento galerija s modalom i dockom --- */
  const bento = document.getElementById('dip-bento');
  const bmodal = document.getElementById('dip-modal');
  if (bento && bmodal) {
    const bItems = Array.from(bento.querySelectorAll('.bento-item'));
    const bmImg = document.getElementById('bm-img');
    const bmTitle = document.getElementById('bm-title');
    const bmDesc = document.getElementById('bm-desc');
    const dock = document.getElementById('bm-dock');
    let bIdx = 0;

    /* dock sličice */
    bItems.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', it.dataset.title + ' — ' + it.dataset.desc);
      const im = document.createElement('img');
      im.src = it.querySelector('img').src;
      im.alt = '';
      b.appendChild(im);
      b.addEventListener('click', e => { e.stopPropagation(); showB(i); });
      dock.appendChild(b);
    });
    const dockBtns = Array.from(dock.children);

    function showB(i) {
      bIdx = (i + bItems.length) % bItems.length;
      const it = bItems[bIdx];
      bmImg.src = it.querySelector('img').src;
      bmImg.alt = it.querySelector('img').alt;
      bmTitle.textContent = it.dataset.title;
      bmDesc.textContent = it.dataset.desc;
      dockBtns.forEach((d, k) => d.classList.toggle('active', k === bIdx));
      dockBtns[bIdx].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function openB(i) {
      showB(i);
      bmodal.hidden = false;
      requestAnimationFrame(() => bmodal.classList.add('open'));
      document.body.style.overflow = 'hidden';
    }
    function closeB() {
      bmodal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { bmodal.hidden = true; }, 300);
    }
    bItems.forEach((it, i) => it.addEventListener('click', () => openB(i)));
    bmodal.querySelector('.bm-close').addEventListener('click', closeB);
    bmImg.addEventListener('click', closeB);
    bmodal.addEventListener('click', e => { if (e.target === bmodal) closeB(); });
    document.addEventListener('keydown', e => {
      if (bmodal.hidden) return;
      if (e.key === 'Escape') closeB();
      if (e.key === 'ArrowLeft') showB(bIdx - 1);
      if (e.key === 'ArrowRight') showB(bIdx + 1);
    });
  }

  /* --- CTA typewriter --- */
  const tw = document.getElementById('cta-typewriter');
  if (tw) {
    const phrase = 'Svaka čaša priča priču.';
    const cursor = document.createElement('span');
    cursor.className = 'cta-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    let started = false;

    function typePhrase() {
      let i = 0;
      tw.textContent = '';
      tw.appendChild(cursor);
      const interval = reduced ? 0 : 65;
      if (reduced) { tw.insertBefore(document.createTextNode(phrase), cursor); return; }
      const t = setInterval(() => {
        tw.insertBefore(document.createTextNode(phrase[i]), cursor);
        i++;
        if (i >= phrase.length) clearInterval(t);
      }, interval);
    }

    const ctaObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        setTimeout(typePhrase, 300);
        ctaObs.disconnect();
      }
    }, { threshold: 0.4 });
    ctaObs.observe(tw);
  }

  /* --- godina u podnožju --- */
  document.getElementById('god').textContent = new Date().getFullYear();
})();
