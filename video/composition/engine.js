// Deterministic motion-graphics engine: everything on screen is a pure function of t.
const K = 0.9;                       // app screenshot scale inside the browser window
const CX = 1290, CY = 560;           // camera anchor on screen
const MODES = { app: { x: 1038, y: 95, w: 504, h: 890 }, wide: { x: 790, y: 200, w: 1000, h: 680 } };
const M = window.MANIFEST;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = {
  io: p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  sine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  out: p => 1 - Math.pow(1 - p, 3),
  outq: p => 1 - Math.pow(1 - p, 5),
  lin: p => p,
};

class Track {
  constructor(init) { this.init = init; this.keys = []; this.done = false; }
  add(t, v, d = 1.2, e = 'io', arc = 0) { this.keys.push({ t, v, d: Math.max(d, 1e-4), e: ease[e] || e, arc }); this.done = false; return this; }
  set(t, v) { return this.add(t, v, 1e-4, 'lin'); }
  _fin() {
    this.keys.sort((a, b) => a.t - b.t);
    for (let i = 0; i < this.keys.length; i++) this.keys[i].from = this._eval(this.keys[i].t, i);
    this.done = true;
  }
  _eval(t, limit) {
    let k = null;
    for (let i = 0; i < limit; i++) { if (this.keys[i].t <= t) k = this.keys[i]; else break; }
    if (!k) return this.init;
    const p = k.e(clamp((t - k.t) / k.d));
    if (Array.isArray(k.v)) {
      const out = k.v.map((v, j) => lerp(k.from[j], v, p));
      if (k.arc && out.length >= 2) {
        const dx = k.v[0] - k.from[0], dy = k.v[1] - k.from[1], L = Math.hypot(dx, dy);
        const off = Math.sin(Math.PI * p) * k.arc * Math.min(L, 400);
        out[0] += -dy / (L || 1) * off; out[1] += dx / (L || 1) * off;
      }
      return out;
    }
    if (typeof k.v === 'number') return lerp(k.from, k.v, p);
    return p >= 1 ? k.v : k.from;  // step values (strings / booleans) switch at the end
  }
  at(t) { if (!this.done) this._fin(); return this._eval(t, this.keys.length); }
}

// ── timeline state ──
const TL = {
  dur: 0,
  shots: [],            // {t, name, fade}
  clicks: [],
  hls: [], chips: [], phases: [], chapters: [], selmenus: [], typers: {},
  tracks: {},
};
function tr(name, init = 0) { return TL.tracks[name] || (TL.tracks[name] = new Track(init)); }
const cam = () => tr('cam', [1, MODES.app.w / 2, MODES.app.h / 2]);
const cur = () => tr('cur', [MODES.app.w + 120, 600]);

// manifest rect (CSS px of the 560×900 app) → window coords
function R(img, key, pad = 0) {
  const m = M[img]; if (!m) throw new Error('no shot ' + img);
  const r = m.rects[key]; if (!r) throw new Error('no rect ' + img + '.' + key);
  return { x: r.x * K - pad, y: r.y * K + 80 - pad, w: r.w * K + 2 * pad, h: r.h * K + 2 * pad };
}
const ctr = r => [r.x + r.w / 2, r.y + r.h / 2];
const A = (x, y, w, h) => ({ x: x * K, y: y * K + 80, w: w * K, h: h * K });   // app coords → window
const W = (x, y, w, h) => ({ x, y: y + 80, w, h });                               // mock content → window

function typed(name, t) {
  const ty = TL.typers[name]; if (!ty) return '';
  let s = '';
  for (const k of ty) if (t >= k.t0) s = k.str.slice(0, clamp(Math.floor((t - k.t0) * k.cps) + 1, 0, k.str.length));
  return s;
}

// ── scene builder ──
let T = 0;
function scene(dur, fn) {
  const t0 = T;
  const s = {
    t0,
    shot: (t, name, fade = 0) => TL.shots.push({ t: t0 + t, name, fade }),
    seq: (t, names, step, fadeFirst = 0) => { names.forEach((n, i) => TL.shots.push({ t: t0 + t + i * step, name: n, fade: i ? 0 : fadeFirst })); return t + names.length * step; },
    cam: (t, z, focus, d = 1.6, e = 'io') => { const f = focus ? (Array.isArray(focus) ? focus : ctr(focus)) : null; cam().add(t0 + t, [z, f ? f[0] : MODES.app.w / 2, f ? f[1] : MODES.app.h / 2], d, e); },
    camWide: (t, z, focus, d = 1.6) => { const f = focus ? (Array.isArray(focus) ? focus : ctr(focus)) : [MODES.wide.w / 2, MODES.wide.h / 2]; cam().add(t0 + t, [z, f[0], f[1]], d); },
    move: (t, to, d = 1.0, arc = 0.12) => { const p = Array.isArray(to) ? to : ctr(to); cur().add(t0 + t, [p[0], p[1]], d, 'io', arc); },
    jump: (t, to) => { const p = Array.isArray(to) ? to : ctr(to); cur().set(t0 + t, [p[0], p[1]]); },
    click: t => TL.clicks.push(t0 + t),
    cursor: (t, v, d = 0.5) => tr('curA').add(t0 + t, v, d),
    hl: (ta, tb, rect, label, pos = 'above') => TL.hls.push({ t0: t0 + ta, t1: t0 + tb, rect, label, pos }),
    chip: (ta, tb, text) => TL.chips.push({ t0: t0 + ta, t1: t0 + tb, text }),
    text: (t, o) => TL.phases.push({ ...o, t0: t0 + t }),
    tr: (name, t, v, d = 0.6, e = 'io') => tr(name).add(t0 + t, v, d, e),
    step: (name, t, v) => tr(name, null).set(t0 + t, v),
    type: (name, t, str, cps = 12) => (TL.typers[name] = TL.typers[name] || []).push({ t0: t0 + t, str, cps }),
    sel: (ta, tb, rect, options, picks) => TL.selmenus.push({ t0: t0 + ta, t1: t0 + tb, rect, options, picks: picks.map(([t, i]) => [t0 + t, i]) }),
    chapter: (ta, tb, num, title, sub) => TL.chapters.push({ t0: t0 + ta, t1: t0 + tb, num, title, sub }),
  };
  fn(s);
  T += dur;
  TL.dur = T;
}

// ── DOM setup ──
const $ = id => document.getElementById(id);
const shotEls = {};
let phaseEls = [], hlEls = [], chipEls = [], rippleEls = [], segEls = [];

function buildDom() {
  const names = [...new Set(TL.shots.map(s => s.name))];
  for (const n of names) {
    const im = document.createElement('img');
    im.className = 'shot'; im.src = '../cap/' + n + '.png';
    $('shots').appendChild(im); shotEls[n] = im;
  }
  TL.shots.sort((a, b) => a.t - b.t);
  // phases
  TL.phases.sort((a, b) => a.t0 - b.t0);
  TL.phases.forEach((p, i) => {
    if (p.t1 === undefined) {
      const nextP = TL.phases[i + 1] ? TL.phases[i + 1].t0 : TL.dur;
      const chapStart = TL.chapters.map(c => c.t0).filter(c => c > p.t0).sort((a, b) => a - b)[0] ?? Infinity;
      p.t1 = Math.min(nextP, chapStart, p.end ?? Infinity);
    }
    const el = document.createElement('div'); el.className = 'phase';
    el.innerHTML = `<div class="tag"><span class="ln"></span><span>${p.tag}</span>${p.count ? `<span class="ct">${p.count}</span>` : ''}</div>
      <h2>${p.title}</h2><p>${p.body}</p>${p.tips ? `<div class="tips">${p.tips.map(x => `<span class="tip">${x}</span>`).join('')}</div>` : ''}`;
    $('panel').appendChild(el);
    p.parts = [el.querySelector('.tag'), el.querySelector('h2'), el.querySelector('p'), el.querySelector('.tips')].filter(Boolean);
    p.el = el;
  });
  // progress segments
  const labels = ['Kernefunktioner', 'Features', 'Chrome-extension'];
  const widths = [170, 170, 170];
  let x = 0;
  labels.forEach((l, i) => {
    const lb = document.createElement('div'); lb.className = 'seglbl'; lb.style.left = x + 'px'; lb.textContent = l;
    const sg = document.createElement('div'); sg.className = 'seg'; sg.style.left = x + 'px'; sg.style.width = widths[i] + 'px';
    sg.innerHTML = '<i></i>';
    $('prog').appendChild(lb); $('prog').appendChild(sg);
    segEls.push({ lb, fill: sg.firstChild, chapter: i });
    x += widths[i] + 24;
  });
  TL.chapterSpans = [0, 1, 2].map(c => {
    const ps = TL.phases.filter(p => p.chapter === c);
    return ps.length ? [ps[0].t0, ps[ps.length - 1].t1] : [0, 0];
  });
  // intro letters
  $('inName').innerHTML = [...'TaskTimer'].map(c => `<span>${c}</span>`).join('');
  Object.values(TL.tracks).forEach(t => t._fin());
}

function pool(arr, n, cls, parent) {
  while (arr.length < n) { const e = document.createElement('div'); e.className = cls; parent.appendChild(e); arr.push(e); }
  arr.forEach((e, i) => { e.style.display = i < n ? 'flex' : 'none'; });
  return arr;
}
const fadeWin = (t, t0, t1, fi = 0.6, fo = 0.5) => Math.min(clamp((t - t0) / fi), clamp((t1 - t) / fo));

// ── geometry ──
function geom(t) {
  const m = ease.io(clamp(tr('morph').at(t)));
  const a = MODES.app, b = MODES.wide;
  return { x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m) + tr('winY').at(t), w: lerp(a.w, b.w, m), h: lerp(a.h, b.h, m), m };
}
function camXf(t, g) {
  const [z, fx, fy] = cam().at(t);
  const SFx = g.x + fx, SFy = g.y + fy;
  const b = clamp((z - 1) / 0.35) * 0.85;
  const Ax = SFx + (CX - SFx) * b, Ay = SFy + (CY - SFy) * b;
  return { z, tx: Ax - z * SFx, ty: Ay - z * SFy };
}
function toScreen(p, t, g = geom(t), c = camXf(t, g)) { return [c.z * (g.x + p[0]) + c.tx, c.z * (g.y + p[1]) + c.ty]; }

// ── render ──
function render(t) {
  const g = geom(t), c = camXf(t, g);
  const active = [];

  // background drift
  $('glowA').style.transform = `translate(${-180 + 90 * Math.sin(t * 0.06)}px, ${-260 + 70 * Math.cos(t * 0.045)}px)`;
  $('glowB').style.transform = `translate(${1020 + 130 * Math.sin(t * 0.04 + 1)}px, ${330 + 90 * Math.cos(t * 0.05)}px)`;
  $('grid').style.transform = `translate(${(t * 2.2) % 96}px, 0)`;

  // window
  const winA = tr('winA').at(t);
  $('stage').style.opacity = winA;
  $('stage').style.display = winA > 0.001 ? 'block' : 'none';
  const mx = g.m > 0.5 ? 690 : 740;
  $('stage').style.webkitMaskImage = `linear-gradient(to right, transparent ${mx}px, black ${mx + 150}px)`;
  $('cam').style.transform = `translate(${c.tx}px, ${c.ty}px) scale(${c.z})`;
  Object.assign($('win').style, { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' });

  // shots
  let curI = -1;
  for (let i = 0; i < TL.shots.length; i++) { if (TL.shots[i].t <= t) curI = i; else break; }
  for (const n in shotEls) { shotEls[n].style.display = 'none'; }
  if (curI >= 0) {
    const s = TL.shots[curI];
    const p = s.fade ? clamp((t - s.t) / s.fade) : 1;
    if (p < 1 && curI > 0) { const prev = shotEls[TL.shots[curI - 1].name]; prev.style.display = 'block'; prev.style.opacity = 1; prev.style.zIndex = 1; active.push(prev); }
    const el = shotEls[s.name]; el.style.display = 'block'; el.style.opacity = ease.sine(p); el.style.zIndex = 2; active.push(el);
    // tab title from the real app
    const title = (M[s.name] && M[s.name].title) || 'TaskTimer';
    $('tab2t').textContent = title;
  }
  $('appLayer').style.transform = `scale(${K})`;
  $('appLayer').style.opacity = 1 - g.m;
  $('mockLayer').style.opacity = g.m;
  $('mockLayer').style.display = g.m > 0.001 ? 'block' : 'none';

  // tabs + toolbar
  const wide = g.m > 0.5;
  const tab1 = $('tab1'), tab2 = $('tab2');
  if (g.m < 0.02) { tab1.style.display = 'none'; Object.assign(tab2.style, { left: '82px', width: (g.w - 92) + 'px' }); tab2.classList.add('active'); }
  else {
    tab1.style.display = 'flex';
    Object.assign(tab1.style, { left: '82px', width: '230px' });
    Object.assign(tab2.style, { left: '316px', width: '230px' });
    const extActive = tr('tabExt', true).at(t);
    tab1.classList.toggle('active', !!extActive); tab2.classList.toggle('active', !extActive);
    tab1.querySelector('.tt').textContent = tr('tab1t', 'New Tab').at(t);
  }
  const addrW = g.w - 104 - 120;
  Object.assign($('addr').style, { left: '104px', width: addrW + 'px' });
  const addrMode = tr('addrMode', 'app').at(t);
  if (g.m < 0.5 || addrMode === 'app') { $('addrT').textContent = 'tasktimer.local:3001'; $('addrC').style.display = 'none'; $('addr').querySelector('.lock').style.display = ''; }
  else {
    const s = typed('addr', t); $('addrT').textContent = s || '';
    $('addrC').style.display = tr('addrCaret', false).at(t) && Math.floor(t * 2) % 2 === 0 ? 'inline-block' : 'none';
    $('addr').querySelector('.lock').style.display = 'none';
  }
  $('extIcon').style.left = (g.w - 104) + 'px'; $('extIcon').style.opacity = tr('pinA').at(t);
  $('puz').style.left = (g.w - 74) + 'px'; $('avatar').style.left = (g.w - 40) + 'px';

  // chrome extensions mock
  const set = (id, o, extra = {}) => { const e = $(id); e.style.opacity = o; e.style.display = o > 0.001 ? '' : 'none'; Object.assign(e.style, extra); };
  set('mkNewtab', 1 - tr('extPageA').at(t));
  set('mkExt', tr('extPageA').at(t));
  const dev = tr('devOn').at(t);
  const knob = $('mkDevT').firstChild;
  $('mkDevT').style.background = `rgb(${lerp(74, 124, dev)},${lerp(71, 166, dev)},${lerp(82, 239, dev)})`;
  knob.style.left = lerp(-2, 16, dev) + 'px';
  knob.style.background = `rgb(${lerp(210, 214, dev)},${lerp(206, 227, dev)},${lerp(216, 251, dev)})`;
  $('mkSub').style.height = (48 * ease.io(dev)) + 'px';
  const cardA = tr('cardA').at(t);
  set('mkCard', cardA, { transform: `translateY(${(1 - cardA) * 14}px)` });
  set('mkEmpty', (1 - cardA) * 1);
  const dlg = tr('dlgA').at(t);
  set('mkDlgShade', dlg); set('mkDlg', dlg, { transform: `scale(${lerp(0.97, 1, dlg)})` });
  $('mkRowExt').classList.toggle('sel', !!tr('rowSel', false).at(t));
  const puz = tr('puzA').at(t);
  set('puzMenu', puz, { left: (g.w - 382) + 'px', top: (84 + (1 - puz) * -6) + 'px' });
  $('pinIco').style.color = tr('pinOn', false).at(t) ? '#8ab4f8' : '#9c97a3';
  $('pinIco').style.fill = tr('pinOn', false).at(t) ? '#8ab4f8' : 'none';
  const pop = tr('popA').at(t);
  set('popup', pop, { left: (g.w - 422) + 'px', top: (84 + (1 - pop) * -8) + 'px' });
  const job = tr('jobView').at(t);
  set('pvSetup', 1 - job); set('pvJob', job);
  $('popSub').textContent = job > 0.5 ? 'Connected' : 'Settings';
  const field = (id, name, ph, mask) => {
    let s = typed(name, t);
    if (mask && s) s = s.slice(0, 8) + '•'.repeat(Math.max(0, s.length - 8));
    $(id).innerHTML = s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;') : `<span class="ph">${ph}</span>`;
    $(id).classList.toggle('focus', tr('focus', '').at(t) === id);
  };
  field('pSrv', 'srv', 'http://server:3001');
  field('pKey', 'key', 'Paste your API key', true);
  field('pJob', 'job', 'Job number and name');
  $('pOk1').style.opacity = tr('ok1').at(t);
  $('pOk2').style.opacity = tr('ok2').at(t);
  $('pChk').classList.toggle('on', !!tr('chk', false).at(t));
  $('pChk').textContent = tr('chk', false).at(t) ? '✓' : '';

  // select menus (app coords overlay)
  const ov = $('appOverlay'); ov.innerHTML = '';
  for (const sm of TL.selmenus) {
    if (t < sm.t0 || t > sm.t1) continue;
    const a = fadeWin(t, sm.t0, sm.t1, 0.25, 0.2);
    let idx = -1; for (const [pt, i] of sm.picks) if (t >= pt) idx = i;
    const [cx0, cy0] = cur().at(t), ax = cx0 / K, ay = (cy0 - 80) / K, top = sm.rect.y + sm.rect.h + 3;
    const hov = Math.floor((ay - top - 5) / 20);
    if (ax > sm.rect.x - 4 && ax < sm.rect.x + 90 && hov >= 0 && hov < sm.options.length) idx = hov;
    const d = document.createElement('div'); d.className = 'selmenu';
    Object.assign(d.style, { left: sm.rect.x + 'px', top: (sm.rect.y + sm.rect.h + 3) + 'px', opacity: a, transform: `translateY(${(1 - a) * -4}px)` });
    d.innerHTML = sm.options.map((o, i) => `<div class="${i === idx ? 'on' : ''}">${o}</div>`).join('');
    ov.appendChild(d);
  }

  // text panel
  const uiA = tr('uiA').at(t);
  $('brand').style.opacity = uiA; $('prog').style.opacity = uiA; $('panel').style.opacity = uiA;
  for (const p of TL.phases) {
    if (t < p.t0 - 0.01 || t > p.t1 + 0.01) { p.el.style.display = 'none'; continue; }
    p.el.style.display = 'block';
    const out = clamp((p.t1 - t) / 0.55);
    p.parts.forEach((el, i) => {
      const a = ease.out(clamp((t - p.t0 - 0.15 - i * 0.14) / 0.9));
      el.style.opacity = Math.min(a, ease.sine(out));
      el.style.transform = `translateY(${(1 - a) * 22 - (1 - out) * 10}px)`;
    });
  }
  segEls.forEach(s => {
    const [a, b] = TL.chapterSpans[s.chapter];
    const p = clamp((t - a) / (b - a));
    s.fill.style.width = (p * 100) + '%';
    s.lb.style.color = t >= a && t < b ? '#f3eff6' : (t >= b ? '#a49dad' : '#6a6374');
  });

  // highlights
  const hls = TL.hls.filter(h => t >= h.t0 && t <= h.t1);
  pool(hlEls, hls.length * 2, 'hl', $('hls'));
  hls.forEach((h, i) => {
    const box = hlEls[i * 2], lab = hlEls[i * 2 + 1];
    const a = fadeWin(t, h.t0, h.t1, 0.55, 0.45);
    const [x0, y0] = toScreen([h.rect.x, h.rect.y], t, g, c);
    const [x1, y1] = toScreen([h.rect.x + h.rect.w, h.rect.y + h.rect.h], t, g, c);
    const s = lerp(1.05, 1, ease.out(clamp((t - h.t0) / 0.7)));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = (x1 - x0) * s, hh = (y1 - y0) * s;
    box.className = 'hl';
    Object.assign(box.style, { left: (cx - w / 2) + 'px', top: (cy - hh / 2) + 'px', width: w + 'px', height: hh + 'px', opacity: a * winA, borderRadius: (8 * c.z) + 'px', display: 'block' });
    if (h.label) {
      lab.className = 'lbl'; lab.textContent = h.label;
      const la = ease.out(clamp((t - h.t0 - 0.25) / 0.6)) * Math.min(1, clamp((h.t1 - t) / 0.45));
      let lx = cx, ly, tx = '-50%', ty = '0';
      if (h.pos === 'above') { ly = y0 - 48; }
      else if (h.pos === 'below') { ly = y1 + 14; }
      else if (h.pos === 'left') { lx = x0 - 18; ly = cy - 17; tx = '-100%'; }
      else { lx = x1 + 18; ly = cy - 17; tx = '0'; }
      Object.assign(lab.style, { left: lx + 'px', top: ly + 'px', opacity: la * winA, transform: `translate(${tx}, ${(1 - la) * 8}px)`, display: 'flex' });
    } else lab.style.display = 'none';
  });

  // chips
  const chips = TL.chips.filter(h => t >= h.t0 && t <= h.t1);
  pool(chipEls, chips.length, 'chip', $('chips'));
  chips.forEach((h, i) => {
    const el = chipEls[i];
    const a = fadeWin(t, h.t0, h.t1, 0.5, 0.5);
    const [x, y] = toScreen([g.w / 2, 140], t, g, c);
    const rot = (t - h.t0) * 540;
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#f07c28" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 12 L12 6.5" transform="rotate(${rot} 12 12)"/><path d="M12 12 L15.5 12" transform="rotate(${rot / 12} 12 12)"/></svg>${h.text}`;
    Object.assign(el.style, { left: x + 'px', top: y + 'px', opacity: a, transform: `translate(-50%, ${(1 - a) * 10}px) scale(${lerp(0.96, 1, a)})` });
  });

  // cursor + ripples
  const cp = cur().at(t);
  const [sx, sy] = toScreen(cp, t, g, c);
  let press = 0;
  for (const ck of TL.clicks) { const d = t - ck; if (d > -0.12 && d < 0.3) press = Math.max(press, Math.sin(clamp((d + 0.12) / 0.42) * Math.PI)); }
  const curA = tr('curA').at(t) * winA;
  Object.assign($('cursor').style, { left: (sx - 3) + 'px', top: (sy - 3) + 'px', opacity: curA, transform: `scale(${1 - 0.16 * press})` });
  const rips = TL.clicks.filter(ck => t >= ck && t < ck + 0.75);
  pool(rippleEls, rips.length, 'ripple', $('ripples'));
  rips.forEach((ck, i) => {
    const p = (t - ck) / 0.75;
    const [rx, ry] = toScreen(cur().at(ck), t, g, c);
    const r = lerp(6, 34, ease.out(p));
    Object.assign(rippleEls[i].style, { display: 'block', left: (rx - r) + 'px', top: (ry - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', opacity: (1 - p) * curA, background: `rgba(240,124,40,${0.18 * (1 - p)})` });
  });

  // chapter cards
  const ch = TL.chapters.find(x => t >= x.t0 && t <= x.t1);
  $('chap').style.display = ch ? 'block' : 'none';
  if (ch) {
    const lt = t - ch.t0, out = clamp((ch.t1 - t) / 0.8);
    const fin = (d, dur = 1.0) => ease.out(clamp((lt - d) / dur)) * ease.sine(out);
    const n = $('chNum'); n.textContent = ch.num;
    const nx = 470, ny = 330;
    Object.assign(n.style, { left: nx + 'px', top: (ny - 60) + 'px', opacity: fin(0.1, 1.3) * 0.9, transform: `translateX(${(1 - fin(0.1, 1.3)) * -30}px)` });
    const k = $('chKick'); k.textContent = 'Kapitel ' + ch.num;
    Object.assign(k.style, { left: '860px', top: '402px', opacity: fin(0.35), transform: `translateY(${(1 - fin(0.35)) * 12}px)` });
    const tt = $('chTtl'); tt.textContent = ch.title;
    Object.assign(tt.style, { left: '856px', top: '432px', opacity: fin(0.5), transform: `translateY(${(1 - fin(0.5)) * 18}px)` });
    Object.assign($('chLine').style, { left: '860px', top: '554px', width: (520 * ease.io(clamp((lt - 0.8) / 1.2))) + 'px', opacity: ease.sine(out) });
    const sb = $('chSub'); sb.textContent = ch.sub;
    Object.assign(sb.style, { left: '860px', top: '580px', opacity: fin(1.0), transform: `translateY(${(1 - fin(1.0)) * 12}px)` });
  }

  // intro / outro
  const intro = tr('introT', -1).at(t);
  $('intro').style.display = t < 10 ? 'block' : 'none';
  if (t < 10) {
    const out = clamp((8.6 - t) / 1.0);
    const f = (d, dur = 1.1) => ease.out(clamp((t - d) / dur)) * ease.sine(out);
    const lg = $('intro').querySelector('.logo'), halo = $('intro').querySelector('.halo');
    Object.assign(lg.style, { opacity: f(0.5, 1.4), transform: `scale(${lerp(0.88, 1, f(0.5, 1.6)) + (1 - out) * 0.03})` });
    Object.assign(halo.style, { opacity: f(0.2, 2.2) * (0.85 + 0.15 * Math.sin(t * 1.4)), transform: `scale(${0.9 + 0.08 * Math.sin(t * 0.8)})` });
    [...$('inName').children].forEach((sp, i) => { const a = f(1.5 + i * 0.07, 0.9); sp.style.opacity = a; sp.style.transform = `translateY(${(1 - a) * 26}px)`; });
    const s2 = f(2.6); $('inSub').style.opacity = s2; $('inSub').style.transform = `translateY(${(1 - s2) * 14}px)`;
    const s3 = f(3.2); $('inPill').style.opacity = s3; $('inPill').style.transform = `translateX(-50%) translateY(${(1 - s3) * 10}px)`;
  }
  const o0 = TL.outroAt ?? 1e9;
  $('outro').style.display = t >= o0 ? 'block' : 'none';
  if (t >= o0) {
    const lt = t - o0;
    const f = (d, dur = 1.1) => ease.out(clamp((lt - d) / dur));
    const lg = $('outro').querySelector('.logo'), halo = $('outro').querySelector('.halo');
    Object.assign(lg.style, { opacity: f(0.2, 1.4), transform: `scale(${lerp(0.9, 1, f(0.2, 1.6))})` });
    Object.assign(halo.style, { opacity: f(0, 2) * (0.85 + 0.15 * Math.sin(t * 1.4)) });
    const a = f(0.9); $('outName').style.opacity = a; $('outName').style.transform = `translateY(${(1 - a) * 20}px)`;
    const b = f(1.5); $('outSub').style.opacity = b; $('outSub').style.transform = `translateY(${(1 - b) * 12}px)`;
    const d = f(2.0); $('outPill').style.opacity = d; $('outPill').style.transform = `translateX(-50%) translateY(${(1 - d) * 10}px)`;
  }

  $('black').style.opacity = tr('black', 1).at(t);
  return active;
}

window.__ready = false;
async function boot() {
  buildDom();
  await document.fonts.ready;
  await Promise.all(Object.values(shotEls).map(im => im.decode().catch(() => {})));
  window.__ready = true;
}
window.renderFrame = async t => {
  const act = render(t);
  await Promise.all(act.map(im => im.decode().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => r()));
};
