(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: bayangan saat scroll + progress bar ---------- */
  var header = $('.site-header');
  var bar = $('.progress');
  function onScroll() {
    var y = window.scrollY || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 8);
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Navbar desktop: pill yang mengikuti hover ---------- */
  var nav = $('.nav-desktop');
  var pill = $('.nav-pill', nav);
  var links = $$('a', nav);
  var activeLink = null;
  function movePill(a, instant) {
    if (!a) { pill.style.opacity = 0; return; }
    pill.classList.toggle('no-anim', !!instant);
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + (a.offsetLeft - links[0].offsetLeft) + 'px)';
    pill.style.opacity = 1;
  }
  function restPill() { movePill(activeLink); }
  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { movePill(a, pill.style.opacity === '0' || !pill.style.opacity); });
    a.addEventListener('focus', function () { movePill(a); });
  });
  nav.addEventListener('mouseleave', restPill);
  nav.addEventListener('focusout', restPill);
  window.addEventListener('resize', restPill);

  /* ---------- Section aktif ---------- */
  var sections = $$('main section[id]');
  var mmLinks = $$('.mm-link');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + id;
          a.classList.toggle('active', on);
          if (on) activeLink = a;
        });
        restPill();
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Menu HP (geser dari kanan) ---------- */
  var menu = $('#mobile-menu');
  var openBtn = $('.menu-btn');
  var closeBtn = $('.mm-close');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    document.body.classList.toggle('lock', open);
    openBtn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (open) closeBtn.focus(); else openBtn.focus({ preventScroll: true });
  }
  openBtn.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  mmLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      document.body.classList.remove('lock');
      openBtn.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });
  window.matchMedia('(min-width: 821px)').addEventListener('change', function (m) {
    if (m.matches && menu.classList.contains('open')) setMenu(false);
  });

  /* ---------- Reveal saat scroll ---------- */
  var revealEls = $$('.reveal, .ed-section-head');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Spotlight mengikuti kursor ---------- */
  $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Proyek: klik untuk membuka detail ---------- */
  var projs = $$('.proj');
  projs.forEach(function (p) {
    var btn = $('.proj-trigger', p);
    var label = $('.proj-toggle span', p);
    btn.addEventListener('click', function () {
      var open = !p.classList.contains('open');
      p.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      $('.proj-body', p).setAttribute('aria-hidden', !open);
      label.textContent = open ? 'Tutup detail' : 'Lihat detail';
      if (open) {
        // buka satu per satu agar fokus tetap jelas
        projs.forEach(function (o) {
          if (o !== p && o.classList.contains('open')) { $('.proj-trigger', o).click(); }
        });
      }
    });
  });

  /* ---------- Proyek: filter kategori ---------- */
  var catBtns = $$('.cat-btn');
  catBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      catBtns.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', false); });
      b.classList.add('active'); b.setAttribute('aria-pressed', true);
      var cat = b.getAttribute('data-cat');
      var n = 0;
      projs.forEach(function (p) {
        var show = cat === 'all' || p.getAttribute('data-cat') === cat;
        p.hidden = !show;
        if (show) {
          p.classList.remove('pop'); void p.offsetWidth;
          p.style.setProperty('--d', (n++ * 70) + 'ms');
          p.classList.add('pop');
        }
      });
    });
  });

  /* ---------- Sertifikasi: kartu kelompok -> dialog daftar ---------- */
  var dlg = $('#cert-dlg');
  var dlgTitle = $('.dlg-title', dlg);
  var dlgSub = $('.dlg-sub', dlg);
  var dlgKicker = $('.dlg-kicker', dlg);
  var dlgList = $('.dlg-list', dlg);
  var lastCard = null;
  $$('.group-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var tpl = document.getElementById('tpl-' + card.getAttribute('data-group'));
      dlgTitle.textContent = $('.gc-title', card).textContent;
      dlgSub.textContent = $('.gc-sub', card).textContent;
      dlgKicker.textContent = $('.gc-count', card).textContent;
      dlgList.innerHTML = '';
      dlgList.appendChild(tpl.content.cloneNode(true));
      dlgList.scrollTop = 0;
      lastCard = card;
      document.body.classList.add('lock');
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
  });
  function closeDlg() {
    if (!dlg.open) return;
    if (reduce) { dlg.close(); return; }
    dlg.classList.add('closing');
    setTimeout(function () { dlg.classList.remove('closing'); dlg.close(); }, 220);
  }
  dlg.addEventListener('close', function () {
    document.body.classList.remove('lock');
    if (lastCard) lastCard.focus({ preventScroll: true });
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDlg(); });
  $('.dlg-close', dlg).addEventListener('click', closeDlg);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });

  /* ---------- Sertifikasi: pencarian ---------- */
  var search = $('#cred-search');
  var groups = $$('.group-card');
  var empty = $('.no-result');
  if (search) {
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      var shown = 0;
      groups.forEach(function (g) {
        var ok = !q || g.getAttribute('data-text').indexOf(q) !== -1;
        g.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
    });
  }
})();
