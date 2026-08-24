/* ============================================================
   Portfolio — Lucas Rodrigues Albino
   JS sem dependencias: menu, reveal, typing, listagem de posts
   ============================================================ */

(function () {
  'use strict';

  /* ---------- ano no rodape ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- link ativo no menu ---------- */
  var sections = document.querySelectorAll('section[id], header[id]');
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- efeito de digitacao no hero ---------- */
  var typed = document.getElementById('typed');
  if (typed) {
    var roles = (typed.dataset.roles || '').split('|').filter(Boolean);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!roles.length) {
      /* nada a fazer */
    } else if (reduce) {
      typed.textContent = roles[0];
    } else {
      var cursor = typed.querySelector('.cursor');
      var out = document.createTextNode('');
      typed.insertBefore(out, cursor);

      var ri = 0, ci = 0, erasing = false;
      (function tick() {
        var word = roles[ri];
        if (!erasing) {
          out.nodeValue = word.slice(0, ++ci);
          if (ci === word.length) { erasing = true; return setTimeout(tick, 1700); }
          return setTimeout(tick, 55);
        }
        out.nodeValue = word.slice(0, --ci);
        if (ci === 0) { erasing = false; ri = (ri + 1) % roles.length; return setTimeout(tick, 320); }
        setTimeout(tick, 28);
      })();
    }
  }

  /* ============================================================
     Write-ups: carrega data/posts.json
     ============================================================ */

  var listEl = document.getElementById('post-list');       /* pagina writeups.html */
  var latestEl = document.getElementById('latest-posts');  /* secao da home */
  if (!listEl && !latestEl) return;

  var base = listEl || latestEl;
  var jsonPath = base.dataset.src || 'data/posts.json';

  fetch(jsonPath, { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (posts) {
      posts = (posts || []).slice().sort(function (a, b) {
        // conteúdo finalizado primeiro; "em produção" sempre no fim
        var aw = a.status === 'producao' ? 1 : 0;
        var bw = b.status === 'producao' ? 1 : 0;
        if (aw !== bw) return aw - bw;
        return (b.data || '').localeCompare(a.data || '');
      });

      if (latestEl) render(latestEl, posts.slice(0, 3));

      if (listEl) {
        render(listEl, posts);
        buildFilters(posts);
      }
    })
    .catch(function (err) {
      var msg = '<div class="empty">' + T.error + String(err) + '</div>';
      if (listEl) listEl.innerHTML = msg;
      if (latestEl) latestEl.innerHTML = msg;
    });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // i18n dos rótulos renderizados pelo JS (idioma vem de <html lang>)
  var EN = (document.documentElement.lang || 'pt').toLowerCase().slice(0, 2) === 'en';
  var T = EN ? {
    months: ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
    wip: 'in progress', draft: 'draft', soon: '// coming soon',
    read: 'read write-up &rarr;', all: 'all',
    empty: 'no write-ups published yet.',
    error: 'could not load data/posts.json &mdash; open the site through the local server (not file://).<br>'
  } : {
    months: ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],
    wip: 'em produção', draft: 'rascunho', soon: '// em breve',
    read: 'ler write-up &rarr;', all: 'todos',
    empty: 'nenhum write-up publicado ainda.',
    error: 'nao foi possivel carregar data/posts.json &mdash; abra o site pelo servidor local (nao pelo file://).<br>'
  };

  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length < 3) return iso;
    return p[2] + ' ' + T.months[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  function render(container, posts) {
    if (!posts.length) {
      container.innerHTML = '<div class="empty">' + T.empty + '</div>';
      return;
    }
    container.innerHTML = posts.map(function (p) {
      var tags = (p.tags || []).map(function (t) {
        return '<span class="chip ' + esc(t.classe || '') + '">' + esc(t.nome || t) + '</span>';
      }).join('');
      var wip = p.status === 'producao';
      var selo = wip
        ? '<span class="chip" style="color:var(--warn);border-color:rgba(240,178,50,.35)">' + T.wip + '</span>'
        : (p.rascunho ? '<span class="chip" style="color:var(--warn);border-color:rgba(240,178,50,.35)">' + T.draft + '</span>' : '');
      var meta =
        '<div class="post-meta">' +
          '<span>' + esc(fmtDate(p.data)) + '</span>' + tags + selo +
          (p.leitura && !wip ? '<span>' + esc(p.leitura) + '</span>' : '') +
        '</div>';
      var body = '<h3>' + esc(p.titulo) + '</h3><p>' + esc(p.resumo) + '</p>';

      if (wip) {
        return '<div class="post wip rv in">' + meta + body +
               '<span class="more" style="color:var(--txt-faint)">' + T.soon + '</span></div>';
      }
      return '<a class="post rv in" href="' + esc(p.url) + '">' + meta + body +
             '<span class="more">' + T.read + '</span></a>';
    }).join('');
  }

  function buildFilters(posts) {
    var box = document.getElementById('post-filters');
    if (!box) return;

    var nomes = [];
    posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        var n = t.nome || t;
        if (nomes.indexOf(n) === -1) nomes.push(n);
      });
    });

    box.innerHTML = ['<button class="filter on" data-f="*">' + T.all + '</button>']
      .concat(nomes.map(function (n) {
        return '<button class="filter" data-f="' + esc(n) + '">' + esc(n) + '</button>';
      })).join('');

    box.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      box.querySelectorAll('.filter').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');

      var f = btn.dataset.f;
      render(listEl, f === '*' ? posts : posts.filter(function (p) {
        return (p.tags || []).some(function (t) { return (t.nome || t) === f; });
      }));
    });
  }
})();

/* ============================================================
   RED TEAM — chuva de hex no fundo (#matrix)
   ============================================================ */
(function () {
  'use strict';
  var cv = document.getElementById('matrix');
  if (!cv) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = cv.getContext('2d');
  var chars = '0123456789ABCDEF</>{}[]#$*';
  var font = 14, cols, drops;

  function w() { return window.innerWidth || document.documentElement.clientWidth || 1280; }
  function h() { return window.innerHeight || document.documentElement.clientHeight || 720; }

  function resize() {
    cv.width = w();
    cv.height = h();
    cols = Math.floor(cv.width / font);
    drops = new Array(cols).fill(0).map(function () {
      return Math.floor(Math.random() * -50);
    });
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  var last = 0;
  function draw(t) {
    requestAnimationFrame(draw);
    if (t - last < 60) return;   // ~16 fps, leve
    last = t;
    if (cv.width < 2 && w() > 2) resize();   // auto-corrige se iniciou sem tamanho

    ctx.fillStyle = 'rgba(7,7,9,0.16)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = font + 'px monospace';

    for (var i = 0; i < cols; i++) {
      var ch = chars[Math.floor(Math.random() * chars.length)];
      var x = i * font, y = drops[i] * font;
      ctx.fillStyle = Math.random() > 0.972 ? '#ff6b3d' : '#ff2b3d';
      ctx.fillText(ch, x, y);
      if (y > cv.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  requestAnimationFrame(draw);
})();
