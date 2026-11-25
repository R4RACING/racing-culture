/* Guia Circuit — interaction layer
   - draws the circuit on load
   - scroll-spy over the corner list, drives the red progress stroke
   - marker <-> card two-way linking, accordion
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* viewBox 1000 x 552.3, positions measured on the drawn centreline */
  var PTS = [
    { n: '01', cn: '起点／终点',     t: 0.003, x: 682.5, y: 412.7 },
    { n: '02', cn: '文华东方弯',     t: 0.184, x: 248.0, y: 279.8 },
    { n: '03', cn: '葡京弯',         t: 0.294, x: 36.5,  y: 91.4  },
    { n: '04', cn: '嘉思栏弯',       t: 0.338, x: 120.6, y: 39.1  },
    { n: '05', cn: '岭南中学',       t: 0.401, x: 276.9, y: 81.6, small: true },
    { n: '06', cn: '铲房弯',         t: 0.417, x: 315.2, y: 97.4  },
    { n: '07', cn: '劏狗环',         t: 0.578, x: 618.7, y: 217.2 },
    { n: '08', cn: '摩啰园街的桥',   t: 0.620, x: 702.4, y: 155.1, small: true },
    { n: '09', cn: '海角游魂弯',     t: 0.696, x: 843.4, y: 230.4 },
    { n: '10', cn: '摩啰园·发夹弯',  t: 0.742, x: 807.7, y: 124.4 },
    { n: '11', cn: '渔翁弯',         t: 0.845, x: 960.1, y: 336.1 },
    { n: '12', cn: '水塘北角弯',     t: 0.945, x: 788.7, y: 516.1 }
  ];

  var VW = 1000, VH = 552.3;

  /* ---------- hero: measure + draw ---------- */
  var hero = document.getElementById('heroTrack');
  if (hero) {
    hero.querySelectorAll('path').forEach(function (p) {
      p.style.setProperty('--len', p.getTotalLength().toFixed(1));
    });
  }

  /* ---------- lap map: markers ---------- */
  var frame = document.getElementById('lapMap');
  var list = document.getElementById('cnList');
  var prog = document.getElementById('progPath');
  var nowIdx = document.getElementById('nowIdx');
  var nowName = document.getElementById('nowName');
  var nowKm = document.getElementById('nowKm');
  var cards = list ? Array.prototype.slice.call(list.querySelectorAll('.cn')) : [];
  var markers = [];

  if (frame && prog && cards.length) {
    var L = prog.getTotalLength();
    prog.setAttribute('stroke-dasharray', L.toFixed(1));
    prog.setAttribute('stroke-dashoffset', L.toFixed(1));

    PTS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mk' + (p.small ? ' is-small' : '');
      b.style.setProperty('--x', (p.x / VW * 100).toFixed(3));
      b.style.setProperty('--y', (p.y / VH * 100).toFixed(3));
      b.innerHTML = '<span>' + p.n + '</span>';
      b.setAttribute('aria-label', p.n + ' ' + p.cn);
      b.addEventListener('click', function () { go(i, true); });
      frame.appendChild(b);
      markers.push(b);
    });
  }

  /* ---------- accordion ---------- */
  cards.forEach(function (card) {
    var head = card.querySelector('.cn-head');
    head.addEventListener('click', function () {
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- active state ---------- */
  var current = -1;

  function paint(i) {
    if (i === current || !cards[i]) return;
    current = i;
    var p = PTS[i];
    markers.forEach(function (m, k) { m.classList.toggle('is-on', k === i); });
    cards.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });

    if (prog) {
      var L = parseFloat(prog.getAttribute('stroke-dasharray')) || prog.getTotalLength();
      prog.style.transitionDuration = reduced ? '0s' : '.7s';
      prog.setAttribute('stroke-dashoffset', (L * (1 - p.t)).toFixed(1));
    }
    if (nowIdx) nowIdx.textContent = p.n;
    if (nowName) nowName.textContent = p.cn;
    if (nowKm) nowKm.textContent = (p.t * 6.12).toFixed(2) + ' KM';
  }

  function go(i, scroll) {
    var card = cards[i];
    if (!card) return;
    paint(i);
    if (!card.classList.contains('open')) {
      card.classList.add('open');
      card.querySelector('.cn-head').setAttribute('aria-expanded', 'true');
    }
    if (scroll) {
      var y = card.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.32;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ---------- scroll spy ---------- */
  var ticking = false;
  function spy() {
    ticking = false;
    if (!cards.length) return;
    var line = window.innerHeight * 0.46;
    var best = 0;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (r.top <= line) best = i;
    }
    /* don't activate until the section is actually near the viewport */
    var first = cards[0].getBoundingClientRect();
    if (first.top > window.innerHeight * 0.9) return;
    paint(best);
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();

  /* ---------- reveal ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.strip-cell, .tl-row, .card, .quote, .rec, .side-note, .widths, .lede')
      .forEach(function (el, i) {
        el.classList.add('rise');
        el.style.transitionDelay = Math.min(i % 6, 5) * 45 + 'ms';
        io.observe(el);
      });
  }

  /* ---------- true north ---------- */
  var north = document.querySelector('.map-ink .north');
  if (north) north.style.transform = 'rotate(62.8deg)';
})();
