// Runs inside the game's page (injected by tools/store-images.mjs): paints the Google Play posters on a
// canvas from the game's own art. Nothing here is a screenshot; every part is drawn by the game's
// drawing code through window.__fission (part, drawIso, cats, names), then arranged like a poster for
// kids: a starburst, stickers with white rims, big outlined type, speech bubbles and a badge.
(function () {
  const DISPLAY = '"Chakra Petch","Bahnschrift","Segoe UI",system-ui,sans-serif';
  const MONO = '"IBM Plex Mono",ui-monospace,Consolas,monospace';
  const INK = '#0a0d12';
  const cache = new Map();
  const F = () => window.__fission();
  const TAU = Math.PI * 2;

  // A part as the game draws it, with the empty-space colour cut out (or kept for board tiles).
  function part(name, k, santa, px, keep) {
    const key = [name, k, santa, px, keep].join('|');
    if (!cache.has(key)) cache.set(key, F().part(name, k, santa, px, keep));
    return cache.get(key);
  }
  // Iso (or Santa-bot) on a clear canvas, facing out.
  function iso(px, santa) {
    const key = 'iso|' + px + '|' + santa;
    if (!cache.has(key)) {
      const cv = document.createElement('canvas'); cv.width = cv.height = px;
      const c = cv.getContext('2d'); c.setTransform(px, 0, 0, px, 0, 0); F().drawIso(c, santa);
      cache.set(key, cv);
    }
    return cache.get(key);
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // A small deterministic random, so a poster comes out the same every time.
  function rng(seed) { let s = seed | 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const LOOKS = {
    nuclear: { top: '#123a63', bottom: '#060b14', ray: 'rgba(245,197,24,.09)', confetti: ['#f5c518', '#86f06a', '#ff8c2d', '#2de6ff', '#ff4f8b'], badge: '#ff4f8b', ring: '#fff', accent: '#86f06a', title: ['#fff6c2', '#ffd02e', '#ff9a1f'] },
    christmas: { top: '#123a7a', bottom: '#050c22', ray: 'rgba(255,215,90,.08)', confetti: ['#ffd34d', '#ff4b5c', '#4bd36a', '#ffffff', '#7fd4ff'], badge: '#e63946', ring: '#fff', accent: '#ffd34d', title: ['#fff6c2', '#ffd34d', '#ff8c2d'] },
  };

  function background(c, w, h, L, fx, fy) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, L.top); g.addColorStop(1, L.bottom);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // the starburst
    c.save(); c.translate(fx, fy); c.fillStyle = L.ray;
    const R = Math.hypot(w, h), n = 18;
    for (let i = 0; i < n; i++) { const a0 = i * TAU / n + .2, a1 = a0 + TAU / n / 2; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath(); c.fill(); }
    c.restore();
    // a soft glow at the focus
    const gl = c.createRadialGradient(fx, fy, 0, fx, fy, Math.min(w, h) * .7);
    gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, w, h);
    // confetti, or snow at Christmas
    const r = rng(w * 31 + h), m = Math.min(w, h);
    if (L === LOOKS.christmas) {
      c.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 140; i++) { const x = r() * w, y = r() * h, s = m * (.002 + r() * .006); c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
    } else {
      for (let i = 0; i < 70; i++) {
        c.fillStyle = L.confetti[i % L.confetti.length]; c.globalAlpha = .55 + r() * .35;
        const x = r() * w, y = r() * h, s = m * (.004 + r() * .008);
        c.save(); c.translate(x, y); c.rotate(r() * TAU);
        if (r() < .5) { c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); } else c.fillRect(-s, -s * .4, s * 2, s * .8);
        c.restore();
      }
      c.globalAlpha = 1;
    }
    // vignette
    const v = c.createRadialGradient(w / 2, h / 2, m * .4, w / 2, h / 2, Math.hypot(w, h) * .6);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }

  // Big outlined poster type. o.fill overrides the yellow gradient; o.max fits the text in a width.
  function bigText(c, text, x, y, size, L, o) {
    o = o || {};
    c.save(); c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.letterSpacing = (o.ls == null ? .04 : o.ls) + 'em';
    c.font = `700 ${size}px ${DISPLAY}`;
    if (o.max) while (size > 10 && c.measureText(text).width > o.max) { size -= 2; c.font = `700 ${size}px ${DISPLAY}`; }
    if (o.rot) { c.translate(x, y); c.rotate(o.rot * Math.PI / 180); x = 0; y = 0; }
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = size * .15; c.shadowOffsetY = size * .08;
    c.lineWidth = size * .2; c.strokeStyle = INK; c.strokeText(text, x, y);
    c.shadowColor = 'transparent';
    if (o.outline) { c.lineWidth = size * .08; c.strokeStyle = o.outline; c.strokeText(text, x, y); }
    let fill = o.fill;
    if (!fill) { const g = c.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, L.title[0]); g.addColorStop(.5, L.title[1]); g.addColorStop(1, L.title[2]); fill = g; }
    c.fillStyle = fill; c.fillText(text, x, y);
    c.restore();
    return size;
  }
  // Plain poster text with a dark edge so it reads on anything.
  function text(c, t, x, y, size, o) {
    o = o || {};
    c.save(); c.font = `${o.weight || 600} ${size}px ${o.mono ? MONO : DISPLAY}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (o.max) while (size > 8 && c.measureText(t).width > o.max) { size -= 1; c.font = `${o.weight || 600} ${size}px ${o.mono ? MONO : DISPLAY}`; }
    c.letterSpacing = (o.ls || 0) + 'em';
    c.lineWidth = size * .22; c.strokeStyle = INK; c.strokeText(t, x, y);
    c.fillStyle = o.color || '#fff'; c.fillText(t, x, y);
    c.restore();
  }
  // A sticker: white rim, dark disc, the part on top. o.tile makes it a rounded square (for floor tiles).
  function sticker(c, img, x, y, s, L, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.rotate((o.rot || 0) * Math.PI / 180);
    const r = s * .64;
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = s * .14; c.shadowOffsetY = s * .07;
    c.fillStyle = o.ring || L.ring; c.beginPath(); if (o.tile) rr(c, -r, -r, 2 * r, 2 * r, r * .32); else c.arc(0, 0, r, 0, TAU); c.fill();
    c.shadowColor = 'transparent';
    c.fillStyle = o.inner || INK; c.beginPath(); if (o.tile) rr(c, -r * .84, -r * .84, r * 1.68, r * 1.68, r * .24); else c.arc(0, 0, r * .84, 0, TAU); c.fill();
    if (o.tile) { c.beginPath(); rr(c, -r * .84, -r * .84, r * 1.68, r * 1.68, r * .24); c.clip(); c.drawImage(img, -r * .84, -r * .84, r * 1.68, r * 1.68); }
    else c.drawImage(img, -s / 2, -s / 2, s, s);
    c.restore();
  }
  // A speech bubble; (x,y) is the tip of its tail, the box sits above it, to the right (dir 'r') or left.
  function bubble(c, lines, x, y, size, o) {
    o = o || {};
    c.save(); c.font = `700 ${size}px ${DISPLAY}`; c.letterSpacing = '.02em';
    const pad = size * .7, lh = size * 1.15, w = Math.max.apply(null, lines.map(t => c.measureText(t).width)) + pad * 2, h = lines.length * lh + pad * 1.1;
    // o.below puts the box under the tip instead of above it.
    const dir = o.dir || 'r', bx = dir === 'r' ? x + size * .3 : x - w - size * .3, by = o.below ? y + size * .7 : y - h - size * .7;
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = size * .5; c.shadowOffsetY = size * .18;
    c.fillStyle = o.fill || '#fff'; c.beginPath(); rr(c, bx, by, w, h, size * .7); c.fill();
    c.beginPath(); c.moveTo(x, y);
    const t0 = dir === 'r' ? bx + size * .9 : bx + w - size * .9, t1 = dir === 'r' ? bx + size * 2 : bx + w - size * 2, ty = o.below ? by + 2 : by + h - 2;
    c.lineTo(t0, ty); c.lineTo(t1, ty); c.closePath(); c.fill();
    c.shadowColor = 'transparent'; c.fillStyle = o.color || INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((t, i) => c.fillText(t, bx + w / 2, by + pad * .55 + lh * (i + .5)));
    c.restore();
  }
  // A starburst badge with a big line and a small one.
  function badge(c, lines, x, y, r, L, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.rotate((o.rot == null ? -12 : o.rot) * Math.PI / 180);
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = r * .25; c.shadowOffsetY = r * .1;
    c.fillStyle = o.fill || L.badge; c.beginPath();
    const n = 22; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rad = i % 2 ? r : r * .87; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    c.closePath(); c.fill(); c.shadowColor = 'transparent';
    c.lineWidth = r * .05; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 ${r * .62}px ${DISPLAY}`; c.fillText(lines[0], 0, -r * .1);
    c.font = `700 ${r * .24}px ${DISPLAY}`; c.letterSpacing = '.12em'; c.fillText(lines[1], 0, r * .36);
    c.restore();
  }
  // A pill label.
  function tag(c, t, x, y, size, o) {
    o = o || {};
    c.save(); c.font = `700 ${size}px ${DISPLAY}`; c.letterSpacing = '.06em';
    const w = c.measureText(t).width + size * 1.5, h = size * 1.75;
    c.fillStyle = o.fill || INK; c.beginPath(); rr(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = size * .13; c.strokeStyle = o.border || '#ffd02e'; c.stroke();
    c.fillStyle = o.color || '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y + size * .06);
    c.restore();
    return w;
  }
  // A strip of real floor tiles, as the board shows them, in category k's colours.
  function board(c, grid, x, y, t, k, santa) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = t * .5; c.shadowOffsetY = t * .15;
    c.fillStyle = INK; c.fillRect(x, y, grid[0].length * t, grid.length * t); c.restore();
    grid.forEach((row, j) => row.forEach((name, i) => { if (name) c.drawImage(part(name, k, santa, 128, true), x + i * t, y + j * t, t + .5, t + .5); }));
  }
  function glow(c, x, y, r, col) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  /* ---------- the posters ---------- */
  // Everything is placed in fractions of the width and height, so one layout serves phones and tablets.
  function hero(c, w, h, L, X) {
    const land = w > h, m = Math.min(w, h), santa = X.xmas;
    // Portrait: name, line, Iso in the middle with stickers at the sides, a caption, the board at the
    // foot. Landscape: Iso at the left, name and line at the right, the board along the foot.
    const ix = land ? w * .25 : w * .5, iy = land ? h * .5 : h * .54, is = land ? h * .6 : w * .5;
    background(c, w, h, L, ix, iy);
    glow(c, ix, iy + is * .05, is * .95, X.xmas ? 'rgba(255,215,90,.35)' : 'rgba(245,197,24,.38)');
    c.drawImage(iso(1024, santa), ix - is / 2, iy - is * .48, is, is);
    const ring = X.xmas ? [['pellet', 0], ['gamma', 1], ['lead', 2], ['pellet', 3], ['reactor', 5]] : [['pellet', 0], ['neutron', 5], ['gamma', 1], ['lead', 2], ['red', 4]];
    // [x, y, size], in fractions of the width, height and shorter side
    const spots = land ? [[.06, .22, .18], [.06, .62, .16], [.49, .1, .13], [.46, .68, .16], [.93, .52, .15]] : [[.13, .43, .18], [.87, .45, .15], [.1, .68, .18], [.9, .68, .15]];
    spots.forEach((sp, i) => { const p = ring[i]; sticker(c, part(p[0], p[1], santa, 256), w * sp[0], h * sp[1], m * sp[2], L, { rot: (i * 37) % 30 - 15 }); });
    // what Iso says: above the head, so it never meets the name or the stickers
    if (land) bubble(c, [X.xmas ? 'Ho ho ho!' : "Let's dig!"], ix + is * .1, iy - is * .44, h * .045, { dir: 'r' });
    else bubble(c, [X.xmas ? 'Ho ho ho!' : "Let's dig!"], ix + is * .24, iy - is * .36, w * .045, { dir: 'r' });
    // the name and the line under it
    const tx = land ? w * .7 : w * .5;
    if (X.xmas) tag(c, 'CHRISTMAS MODE', tx, land ? h * .13 : h * .075, m * .028, { border: '#e63946' });
    bigText(c, 'FISSION', tx, land ? h * .32 : h * .15, land ? h * .26 : w * .2, L, { max: land ? w * .52 : w * .72, ls: .06 });
    const sub = X.xmas ? ['Help Santa-bot', 'find every gift!'] : ['Dig. Grab the fuel.', "Don't get squashed!"];
    const ss = land ? h * .065 : w * .058;
    sub.forEach((t, i) => text(c, t, tx, (land ? h * .52 : h * .255) + i * ss * 1.25, ss, { max: land ? w * .52 : w * .9 }));
    text(c, X.xmas ? 'Pine, snowballs, gifts and a tree to light' : 'Digging, dodging and chain reactions', tx, land ? h * .68 : h * .765, m * .03, { mono: true, weight: 600, color: L.accent, max: land ? w * .52 : w * .9 });
    // the board strip
    const cols = land ? 20 : 9, t = w / cols;
    const g1 = Array.from({ length: cols }, (_, i) => i % 7 === 3 ? 'pellet' : i % 5 === 1 ? 'lead' : 'graphite');
    const g2 = Array.from({ length: cols }, (_, i) => i % 6 === 2 ? 'pellet' : i % 9 === 7 ? 'red' : 'graphite');
    const g0 = Array.from({ length: cols }, () => 'concrete');
    board(c, land ? [g1, g2] : [g0, g1, g2], 0, h - (land ? 2 : 3) * t, t, 0, santa);
    badge(c, ['545', X.xmas ? 'FLOORS' : 'LEVELS'], land ? w * .93 : w * .88, land ? h * .14 : h * .075, m * .1, L);
  }

  function crew(c, w, h, L, X) {
    const land = w > h, m = Math.min(w, h), N = X.names, santa = X.xmas;
    background(c, w, h, L, w * .5, h * .12);
    bigText(c, X.xmas ? 'MEET THE NORTH POLE' : 'MEET THE PLANT', w * .5, land ? h * .11 : h * .075, land ? h * .13 : w * .12, L, { max: w * .92, ls: .04 });
    const items = [
      ['iso', 0, 'the digger', 2], ['pellet', 0, 'grab them all!', 0], ['lead', 2, 'heavy, it falls!', 2],
      ['gamma', 1, 'never touch!', 3], ['neutron', 5, 'bouncy and bad', 5], ['red', 3, 'BOOM!', 3],
    ];
    const cols = land ? 3 : 2, rows = land ? 2 : 3;
    const top = land ? h * .22 : h * .15, cw = w * .92 / cols, ch = (h * (land ? .74 : .8)) / rows, x0 = w * .04;
    items.forEach((it, i) => {
      const cx = x0 + cw * (i % cols + .5), cy = top + ch * (Math.floor(i / cols) + .36), s = Math.min(cw, ch) * .52;
      const img = it[0] === 'iso' ? iso(512, santa) : part(it[0], it[3], santa, 256);
      sticker(c, img, cx, cy, s, L, { rot: i % 2 ? 8 : -8, inner: it[0] === 'iso' ? '#1a2234' : INK });
      const nm = it[0] === 'iso' ? (X.xmas ? 'Santa-bot' : 'Iso') : (N[it[0]] ? N[it[0]].name : it[0]);
      tag(c, nm.toUpperCase(), cx, cy + s * .78, m * .028, { border: L.confetti[i % L.confetti.length] });
      text(c, it[2], cx, cy + s * .78 + m * .06, m * .03, { mono: true, weight: 600, color: '#fff', max: cw * .9 });
    });
    text(c, X.xmas ? 'Some help. Some hurt. Learn which is which!' : 'Some help. Some hurt. Learn which is which!', w * .5, h * .965, m * .028, { mono: true, color: L.accent, max: w * .9 });
  }

  function wings(c, w, h, L, X) {
    const m = Math.min(w, h), cats = X.cats, santa = X.xmas;
    background(c, w, h, L, w * .5, h * .1);
    bigText(c, '545 FLOORS', w * .5, h * .07, w * .17, L, { max: w * .92, ls: .04 });
    text(c, 'across 17 wings, each with new tricks', w * .5, h * .135, w * .042, { max: w * .9 });
    const n = 8, top = h * .175, bh = h * .06, gap = h * .011, x0 = w * .05, bw = w * .9;
    for (let i = 0; i < n; i++) {
      const k = i, y = top + i * (bh + gap);
      const col = cats[k].color, bg = cats[k].bg;
      c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = bh * .3; c.shadowOffsetY = bh * .1;
      c.fillStyle = bg; c.beginPath(); rr(c, x0, y, bw, bh, bh * .3); c.fill(); c.restore();
      c.lineWidth = m * .004; c.strokeStyle = col; c.beginPath(); rr(c, x0, y, bw, bh, bh * .3); c.stroke();
      c.fillStyle = col; c.beginPath(); rr(c, x0, y, bw * .17, bh, bh * .3); c.fill();
      c.fillRect(x0 + bw * .12, y, bw * .05, bh);
      text(c, String(cats[k].from).padStart(3, '0') + '–' + String(cats[k].to).padStart(3, '0'), x0 + bw * .085, y + bh / 2, bh * .3, { color: '#fff', mono: true, weight: 600 });
      c.save(); c.font = `700 ${bh * .4}px ${DISPLAY}`; c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.letterSpacing = '.03em';
      c.fillText(cats[k].name, x0 + bw * .2, y + bh / 2); c.restore();
      const t = bh * .78; ['graphite', 'pellet', 'lead'].forEach((nm, j) => { c.drawImage(part(nm, k, santa, 128, true), x0 + bw - t * (3 - j) - bh * .25, y + (bh - t) / 2, t, t); });
    }
    text(c, '…and nine more wings to unlock', w * .5, top + n * (bh + gap) + h * .02, m * .032, { color: '#fff', max: w * .9 });
    // Iso peeks in at the foot, with the last word
    const iy = h * .88, is = w * .24, ixx = w * .17;
    glow(c, ixx, iy, is * .8, X.xmas ? 'rgba(255,215,90,.3)' : 'rgba(245,197,24,.3)');
    c.drawImage(iso(512, santa), ixx - is / 2, iy - is / 2, is, is);
    bubble(c, ['So many floors!'], ixx + is * .32, iy - is * .22, m * .042, { dir: 'r' });
    text(c, 'Five floors open at a time.', w * .62, h * .905, m * .028, { mono: true, color: L.accent, max: w * .6 });
    text(c, 'Clear one and the next one opens.', w * .62, h * .945, m * .028, { mono: true, color: L.accent, max: w * .6 });
  }

  function gadgets(c, w, h, L, X) {
    const m = Math.min(w, h), N = X.names, santa = X.xmas;
    background(c, w, h, L, w * .5, h * .5);
    bigText(c, 'POWER UP!', w * .5, h * .08, w * .18, L, { max: w * .92, ls: .05 });
    text(c, 'Jet-packs, tractor beams, teleports, lasers…', w * .5, h * .15, w * .04, { max: w * .92 });
    const cx = w * .5, cy = h * .53, R = w * .36, is = w * .3;
    glow(c, cx, cy, is, X.xmas ? 'rgba(255,215,90,.32)' : 'rgba(245,197,24,.35)');
    c.drawImage(iso(512, santa), cx - is / 2, cy - is / 2, is, is);
    const ring = [['thruster', 4], ['tractor', 4], ['stasis', 4], ['telepad', 4], ['laser', 4], ['shield', 4], ['drone', 4], ['magnet', 5]];
    ring.forEach((p, i) => {
      const a = -Math.PI / 2 + i * TAU / ring.length, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 1.12;
      sticker(c, part(p[0], p[1], santa, 256), x, y, w * .15, L, { rot: i % 2 ? 7 : -7 });
      const nm = N[p[0]] ? N[p[0]].name : p[0];
      tag(c, nm.toUpperCase(), x, y + w * .12, m * .022, { border: L.confetti[i % L.confetti.length] });
    });
    bubble(c, ['Fly. Pull. Freeze. Zap!'], cx + is * .15, cy + is * .38, m * .036, { dir: 'l', below: true });
    text(c, 'A new gadget in every wing', w * .5, h * .965, m * .028, { mono: true, color: L.accent, max: w * .9 });
  }

  // The 1024x500 feature graphic: Iso at the left, the name and a parade of parts at the right.
  function feature(c, w, h, L, X) {
    const santa = X.xmas;
    background(c, w, h, L, w * .22, h * .5);
    const is = h * .74, ix = w * .19, iy = h * .53;
    glow(c, ix, iy, is * .8, X.xmas ? 'rgba(255,215,90,.35)' : 'rgba(245,197,24,.4)');
    c.drawImage(iso(1024, santa), ix - is / 2, iy - is * .48, is, is);
    if (X.xmas) tag(c, 'CHRISTMAS MODE', w * .64, h * .14, h * .05, { border: '#e63946' });
    bigText(c, 'FISSION', w * .64, h * .36, h * .3, L, { max: w * .6, ls: .06 });
    text(c, X.xmas ? 'Help Santa-bot find every gift!' : "Dig. Grab the fuel. Don't get squashed!", w * .64, h * .58, h * .085, { max: w * .6 });
    const parade = X.xmas ? [['pellet', 0], ['lead', 2], ['gamma', 1], ['red', 3], ['reactor', 5]] : [['pellet', 0], ['lead', 2], ['gamma', 1], ['red', 3], ['neutron', 5]];
    parade.forEach((p, i) => sticker(c, part(p[0], p[1], santa, 256), w * (.44 + i * .1), h * .82, h * .19, L, { rot: i % 2 ? 9 : -9 }));
    badge(c, ['545', X.xmas ? 'FLOORS' : 'LEVELS'], w * .93, h * .2, h * .17, L);
  }

  // The Play Store icon: Iso on the board colour with a glow (the same as the launcher icon).
  function icon(c, w, h, L, X) {
    c.fillStyle = INK; c.fillRect(0, 0, w, h);
    const u = w * .76, ox = w / 2 - .5 * u, oy = h / 2 - .475 * u;
    glow(c, w / 2, oy + .55 * u, .62 * u, X.xmas ? 'rgba(255,215,90,.26)' : 'rgba(245,197,24,.26)');
    c.drawImage(iso(1024, X.xmas), ox, oy, u, u);
  }

  const KINDS = { hero, crew, wings, gadgets, feature, icon };
  window.POSTERS = {
    render(kind, w, h, lookKey) {
      const L = LOOKS[lookKey], xmas = lookKey === 'christmas';
      const X = { xmas, names: F().names(xmas), cats: F().cats(xmas) };
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const c = cv.getContext('2d');
      KINDS[kind](c, w, h, L, X);
      const d = c.getImageData(0, 0, w, h).data; let s = '';
      for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
      return btoa(s);
    },
  };
})();
