(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isW = k => typeof k === 'string' && k[0] === '@';
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const LS = {
  get(k, d) { try { const v = localStorage.getItem('h6:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('h6:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};

/* ---------------- state ---------------- */
const S = { preset: LS.get('preset', 'krispijn'), cfg: null, k: 0, bpm: LS.get('bpm', 84), zoom: LS.get('zoom', 1), line: 'all', sel: null, tab: 'score', sound: LS.get('sound', true), showCf: LS.get('cf', true), multLine: 0, real: null, playing: null, lyWord: null, tabSel: null };
if (S.preset !== 'custom' && !PRESETS[S.preset]) S.preset = 'krispijn';
S.cfg = Object.assign({}, DEFAULT_CFG, PRESETS[S.preset === 'custom' ? 'krispijn' : S.preset].cfg);
if (S.preset === 'custom') { const c = LS.get('cfg', null); if (c) S.cfg = Object.assign({}, DEFAULT_CFG, c); }
const cfgFull = c => Object.assign({}, DEFAULT_CFG, c);
const noteName = (cfg, k, s) => helm(noteAt(cfg, k, s));
const curFreqs = () => freqs(S.cfg, S.k, 0);

/* ---------------- audio: Karplus–Strong plucked string ---------------- */
const AU = {
  ctx: null, out: null, cache: new Map(), live: new Set(),
  ensure() {
    if (!S.sound) return null;
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    const ctx = this.ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(ctx.destination);
    const master = ctx.createGain(); master.gain.value = 0.62;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 55;
    const b1 = ctx.createBiquadFilter(); b1.type = 'peaking'; b1.frequency.value = 230; b1.Q.value = 1.1; b1.gain.value = 4;
    const b2 = ctx.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = 1400; b2.Q.value = 0.9; b2.gain.value = 2.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6800;
    master.connect(hp); hp.connect(b1); b1.connect(b2); b2.connect(lp); lp.connect(comp);
    const conv = ctx.createConvolver(); conv.buffer = this.ir(ctx); const wet = ctx.createGain(); wet.gain.value = 0.2; lp.connect(conv); conv.connect(wet); wet.connect(comp);
    this.out = master; return ctx;
  },
  ir(ctx) {
    const sr = ctx.sampleRate, len = Math.floor(sr * 1.8), b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4) * (i < sr * 0.012 ? i / (sr * 0.012) : 1); }
    return b;
  },
  ks(freq) {
    const ctx = this.ctx, sr = ctx.sampleRate, N = Math.max(4, Math.round(sr / freq - 0.5));
    const hit = this.cache.get(N); if (hit) return hit;
    const f0 = sr / (N + 0.5);
    const T60 = Math.max(1.0, Math.min(3.3, 3.3 - Math.log2(Math.max(f0, 80) / 80) * 0.55));
    const len = Math.floor(sr * Math.min(T60 * 1.05, 3.5));
    const buf = ctx.createBuffer(1, len, sr), y = buf.getChannelData(0);
    const rho = Math.pow(0.001, 1 / (T60 * f0));
    let prev = 0; const exc = new Float32Array(N);
    for (let i = 0; i < N; i++) { prev = prev * 0.42 + (Math.random() * 2 - 1) * 0.58; exc[i] = prev; }
    const P = Math.max(1, Math.round(N * 0.17));
    for (let i = 0; i < N; i++) y[i] = exc[i] - (i >= P ? exc[i - P] * 0.85 : 0);
    for (let i = N; i < len; i++) y[i] = rho * 0.5 * (y[i - N] + (i - N - 1 >= 0 ? y[i - N - 1] : 0));
    let pk = 0; for (let i = 0; i < Math.min(len, N * 8); i++) pk = Math.max(pk, Math.abs(y[i]));
    const g = pk > 0 ? 0.9 / pk : 1, fade = Math.floor(sr * 0.06);
    for (let i = 0; i < len; i++) y[i] *= g * (i > len - fade ? (len - i) / fade : 1);
    const r = { buf, f0 }; this.cache.set(N, r); return r;
  },
  pluck(freq, when, vel, s, glideTo) {
    const ctx = this.ctx; if (!ctx || !freq) return;
    const { buf, f0 } = this.ks(freq);
    const src = ctx.createBufferSource(); src.buffer = buf;
    src.playbackRate.setValueAtTime(freq / f0, when);
    if (glideTo) { src.playbackRate.setValueAtTime(freq / f0, when + 0.25); src.playbackRate.exponentialRampToValueAtTime(glideTo / f0, when + 0.85); }
    const g = ctx.createGain(); g.gain.value = vel;
    let node = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = ((s || 5) - 5) * 0.06; g.connect(p); node = p; }
    src.connect(g); node.connect(this.out);
    src.start(when); this.live.add(src); src.onended = () => this.live.delete(src);
  },
  stopAll() { for (const s of this.live) { try { s.stop(); } catch (e) { /* already stopped */ } } this.live.clear(); }
};
const now = () => (AU.ctx ? AU.ctx.currentTime : 0);

/* ---------------- lyre ---------------- */
const LY = { xs: [null], bridge: 322, yL: 0, yR: 0, el: {} };
for (let i = 1; i <= 9; i++) LY.xs.push(92 + (i - 1) * 27);
const yokeEnds = dir => dir === 'desc' ? [160, 70] : [70, 160];
const yokeY = x => LY.yL + (LY.yR - LY.yL) * (x - 50) / 300;
const VIB = new Map(); let pendingVis = [];

function buildLyre() {
  const svg = $('#lyre');
  let h = '';
  h += `<path class="ly-arm" id="lyArmL" d=""/><path class="ly-arm" id="lyArmR" d=""/><path class="ly-arm2" id="lyArmL2" d=""/><path class="ly-arm2" id="lyArmR2" d=""/>`;
  h += `<line class="ly-yoke" id="lyYoke"/>`;
  h += `<rect class="ly-box" x="34" y="300" width="332" height="90" rx="12"/>`;
  for (let i = 0, x = 44; x < 352; i++, x += 11) h += `<rect class="${['ly-in-a', 'ly-in-b', 'ly-in-c', 'ly-in-b', 'ly-in-d', 'ly-in-b'][i % 6]}" x="${x}" y="306" width="8" height="8" rx="1"/>`;
  h += `<rect class="ly-bridge" x="80" y="${LY.bridge}" width="240" height="7" rx="2"/>`;
  for (let i = 1; i <= 9; i++) {
    const x = LY.xs[i];
    h += `<g class="ly-g" data-s="${i}" tabindex="0" role="button" aria-label="Pluck string ${i}">`
      + `<path class="ly-str" id="lyS${i}" d=""/><line class="ly-hit" id="lyH${i}" x1="${x}" x2="${x}" y1="0" y2="${LY.bridge}"/>`
      + `<g id="lyP${i}"><circle class="ly-peg" r="6.5" cx="0" cy="0"/><line class="ly-notch" id="lyN${i}" x1="0" y1="0" x2="0" y2="-5.5"/></g>`
      + `<text class="ly-note" id="lyT${i}" x="${x}" y="0"></text>`
      + `<text class="ly-num" x="${x}" y="358">${i}</text></g>`;
  }
  h += `<g id="lyUnc"></g>`;
  svg.innerHTML = h;
  [LY.yL, LY.yR] = yokeEnds(S.cfg.dir);
  layoutLyre();
  bindLyre(svg);
}
function layoutLyre() {
  const yl = LY.yL, yr = LY.yR;
  $('#lyYoke').setAttribute('x1', 50); $('#lyYoke').setAttribute('y1', yl); $('#lyYoke').setAttribute('x2', 350); $('#lyYoke').setAttribute('y2', yr);
  $('#lyArmL').setAttribute('d', `M44 302 C38 ${(302 + yl) / 2} 46 ${yl + 30} 56 ${yl - 4}`);
  $('#lyArmR').setAttribute('d', `M356 302 C362 ${(302 + yr) / 2} 354 ${yr + 30} 344 ${yr - 4}`);
  $('#lyArmL2').setAttribute('d', `M44 302 C38 ${(302 + yl) / 2} 46 ${yl + 30} 56 ${yl - 4}`);
  $('#lyArmR2').setAttribute('d', `M356 302 C362 ${(302 + yr) / 2} 354 ${yr + 30} 344 ${yr - 4}`);
  for (let i = 1; i <= 9; i++) {
    const x = LY.xs[i], yt = yokeY(x) + 7;
    if (!VIB.has(i)) $('#lyS' + i).setAttribute('d', `M${x} ${yt} L${x} ${LY.bridge}`);
    $('#lyH' + i).setAttribute('y1', yt);
    $('#lyP' + i).setAttribute('transform', `translate(${x} ${yokeY(x)})`);
    $('#lyT' + i).setAttribute('y', yokeY(x) - 15);
  }
}
function animateYoke(dir) {
  const [tl, tr] = yokeEnds(dir), [fl, fr] = [LY.yL, LY.yR];
  if (fl === tl && fr === tr) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now(), D = reduce ? 1 : 520;
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / D), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    LY.yL = fl + (tl - fl) * e; LY.yR = fr + (tr - fr) * e; layoutLyre();
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function updateLyreLabels() {
  const alt = alterations(S.k);
  for (let i = 1; i <= 9; i++) {
    const t = $('#lyT' + i); t.textContent = noteName(S.cfg, S.k, i);
    t.classList.toggle('alt', alt[i] !== 0);
    $('#lyN' + i).setAttribute('transform', `rotate(${alt[i] * 50})`);
  }
  const [a, b] = DICH[unclearOf(S.k)].pair, xa = LY.xs[a], xb = LY.xs[b], y = 404;
  $('#lyUnc').innerHTML = `<path class="ly-unclear" d="M${xa} ${y - 6} L${xa} ${y} L${xb} ${y} L${xb} ${y - 6}"/>`
    + `<text class="ly-note" x="${(xa + xb) / 2}" y="${y + 18}" style="font-size:13px;fill:var(--carn);font-style:italic">${esc(DICH[unclearOf(S.k)].akk)} · la zakû</text>`;
}
function stringInfo(s) {
  const f = curFreqs()[s];
  return `<b>String ${s}</b> · “${esc(STRING_NAMES[s])}” · <b>${esc(noteName(S.cfg, S.k, s))}</b> · ${f.toFixed(1)} Hz`;
}
function pluckString(s, vel = 0.8) {
  const ctx = AU.ensure();
  if (ctx) AU.pluck(curFreqs()[s], ctx.currentTime + 0.01, vel, s);
  vibrateNow(s, vel);
  $('#benchInfo').innerHTML = stringInfo(s);
}
function vibrateNow(s, amp) { if (s > 9 || s < 1) return; VIB.set(s, { t0: performance.now(), amp: amp || 0.8 }); kick(); }
function vibrateAt(s, when, amp) { if (s > 9 || s < 1) return; pendingVis.push({ s, at: performance.now() + Math.max(0, when - now()) * 1000, amp }); kick(); }
function bindLyre(svg) {
  let down = false, lastX = null;
  const pt = svg.createSVGPoint();
  const toSvg = ev => { pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
  const nearest = p => { let best = null, bd = 13; for (let i = 1; i <= 9; i++) { const d = Math.abs(p.x - LY.xs[i]); if (d < bd && p.y > yokeY(LY.xs[i]) - 4 && p.y < LY.bridge + 6) { bd = d; best = i; } } return best; };
  svg.addEventListener('pointerdown', ev => {
    const p = toSvg(ev); down = true; lastX = p.x; svg.setPointerCapture(ev.pointerId);
    const s = nearest(p); if (s) pluckString(s); hideTip();
  });
  svg.addEventListener('pointermove', ev => {
    const p = toSvg(ev);
    if (down) {
      if (lastX != null && p.y > 40 && p.y < LY.bridge + 10) {
        const lo = Math.min(lastX, p.x), hi = Math.max(lastX, p.x);
        const crossed = range(1, 9).filter(i => LY.xs[i] > lo && LY.xs[i] <= hi);
        if (p.x < lastX) crossed.reverse();
        crossed.forEach(i => pluckString(i, 0.6));
      }
      lastX = p.x;
    } else if (ev.pointerType === 'mouse') {
      const s = nearest(p); if (s) showTip(ev, stringInfo(s) + `<br><i>key ${s}</i>`); else hideTip();
    }
  });
  const end = () => { down = false; lastX = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('pointerleave', () => { if (!down) hideTip(); });
  svg.addEventListener('keydown', ev => { const g = ev.target.closest('.ly-g'); if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); pluckString(+g.dataset.s); } });
}

/* ---------------- animation loop ---------------- */
let raf = 0;
function kick() { if (!raf) raf = requestAnimationFrame(loop); }
function loop() {
  raf = 0; let busy = false;
  const t = performance.now();
  if (pendingVis.length) {
    busy = true;
    pendingVis = pendingVis.filter(p => { if (t >= p.at) { VIB.set(p.s, { t0: t, amp: p.amp }); return false; } return true; });
  }
  for (const [s, v] of VIB) {
    busy = true;
    const age = (t - v.t0) / 1000, x = LY.xs[s], yt = yokeY(x) + 7, mid = (yt + LY.bridge) / 2;
    const el = $('#lyS' + s);
    if (age > 1.5) { VIB.delete(s); el.setAttribute('d', `M${x} ${yt} L${x} ${LY.bridge}`); el.classList.remove('hot'); continue; }
    const off = v.amp * 7 * Math.exp(-age * 3.1) * Math.sin(age * 2 * Math.PI * (11 + s * 0.7));
    el.setAttribute('d', `M${x} ${yt} Q${x + off} ${mid} ${x} ${LY.bridge}`);
    el.classList.toggle('hot', age < 0.35);
  }
  if (S.playing) { busy = true; tickPlayback(); }
  if (busy) kick();
}

/* ---------------- tooltip ---------------- */
const tip = $('#tip');
function showTip(ev, html) { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth, h = tip.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = ev.clientY - h - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
function hideTip() { tip.hidden = true; }

/* ---------------- bench ---------------- */
function renderBench() {
  $('#benchTuning').textContent = DICH[tuningName(S.k)].akk;
  const drift = Math.floor(S.k / 7);
  const f1 = helm({ ...parseFrameUI(S.cfg.frame), acc: 0 });
  $('#benchMeta').innerHTML = `${S.cfg.dir === 'desc' ? 'Descending: string 1 highest' : 'Ascending: string 1 lowest'} · string 1 = ${esc(f1)} in <i>nīd qablim</i>${drift ? ` · ${drift > 0 ? '+' : ''}${drift} apotome` : ''}`;
  const unc = unclearOf(S.k), occ = occurrences({ reading: 'DL' })[unc];
  $('#benchFoot').innerHTML = `<span class="chip carn">unclear: ${esc(DICH[unc].akk)} ${DICH[unc].pair.join('·')}</span><span class="chip">${occ ? `used ${occ.n}× in h.6` : 'never used in h.6'}</span>${S.k !== 0 ? `<button class="btn small" id="benchReset" type="button">Back to nīd qablim</button>` : `<span class="chip gold">the colophon’s tuning</span>`}`;
  const rb = $('#benchReset'); if (rb) rb.onclick = () => setK(0, { strum: true });
  updateLyreLabels();
}
function parseFrameUI(fr) { return { L: 'CDEFGAB'.indexOf(fr[0]), o: parseInt(fr.slice(1), 10) }; }
$('#soundBtn').onclick = () => {
  S.sound = !S.sound; LS.set('sound', S.sound);
  $('#soundBtn').textContent = S.sound ? 'Sound on' : 'Sound off'; $('#soundBtn').setAttribute('aria-pressed', String(S.sound));
  if (!S.sound) { stopPlayback(); AU.stopAll(); }
};

/* ---------------- tabs ---------------- */
const TABS = ['score', 'tuning', 'dichords', 'tablet', 'scholars', 'signs', 'fragments', 'sources'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'score';
  S.tab = name;
  for (const t of TABS) { $('#view-' + t).hidden = t !== name; $('#t-' + t).setAttribute('aria-selected', String(t === name)); }
  renderView(name);
}
addEventListener('hashchange', () => showTab(location.hash.slice(1)));
function renderView(name) {
  if (name === 'score') renderScore();
  if (name === 'tuning') renderTuning();
  if (name === 'dichords') renderDichords();
  if (name === 'tablet') renderTablet();
  if (name === 'scholars') renderScholars();
  if (name === 'signs') renderSigns();
  if (name === 'fragments') renderFragments();
  if (name === 'sources') renderSources();
}

/* ---------------- score view ---------------- */
const MODE_TXT = { dyad: 'pair sounds together', run: 'run of strings', upper: 'upper note + drone', second: 'second string carries the tune', tab: 'tablature only' };
const NUM_TXT = { repeat: 'numeral = repetitions', hold: 'numeral = beats held', bars: 'numeral = bars', select: 'numeral = notes taken', embellish: 'numeral = ornaments added', none: 'numeral not used' };
const PATH_TXT = { direct: 'straight run', wulstan: 'via 8–9: primaries up, secondaries down', down: 'via 8–9, downward', dumbrill: 'five down, three up (Dumbrill)' };
function frameOptions() { const o = []; for (let oc = 2; oc <= 5; oc++) for (let L = 0; L < 7; L++) { const v = 'CDEFGAB'[L] + oc; o.push([v, helm({ L, o: oc, acc: 0 })]); } return o; }
const FIELDS = [
  { key: 'reading', label: 'Edition of the signs', opts: () => Object.keys(READINGS).map(k => [k, READINGS[k].name]) },
  { key: 'dir', label: 'String order', opts: () => [['desc', 'Descending: string 1 highest'], ['asc', 'Ascending: string 1 lowest']] },
  { key: 'frame', label: 'String 1 in nīd qablim', opts: frameOptions },
  { key: 'temper', label: 'Fine tuning', opts: () => Object.keys(TEMPER).map(k => [k, TEMPER[k].name]) },
  { key: 'mode', label: 'A term sounds as', opts: () => [['dyad', 'both strings together'], ['run', 'a run from first to second string'], ['upper', 'the upper note (+ octave drone)'], ['second', 'the second string (West); 1, 2 doubled by 8, 9'], ['tab', 'tablature only (audition a, b, a + b)']] },
  { key: 'path', label: 'Route of a run', opts: () => [['direct', 'straight, within strings 1–7'], ['wulstan', 'via 8–9: primaries up, secondaries down'], ['down', 'via 8–9: downward where possible'], ['dumbrill', 'primaries five strings down, secondaries three up (Dumbrill)']], dis: c => c.mode !== 'run' },
  { key: 'num', label: 'The numeral counts', opts: () => [['repeat', 'repetitions'], ['hold', 'beats the (last) note is held'], ['bars', 'bars (Vitale)'], ['select', 'notes taken from the run'], ['embellish', 'ornament notes added'], ['none', 'nothing: ignored']], dis: c => c.mode === 'tab' },
  { key: 'unit', label: 'Basic note value', type: 'num', opts: () => [['0.5', 'half a beat'], ['1', 'one beat']], dis: c => c.mode === 'tab' || c.num === 'bars' },
  { key: 'use89', label: 'Strings 8 and 9', type: 'bool', opts: () => [['false', 'not used'], ['true', 'used, as octaves of 1 and 2']] },
  { key: 'double', label: 'Octave doubling', type: 'tri', opts: () => [['false', 'off'], ['true', 'add 8/9 to primaries on 1–2 (Černý)'], ['all', 'add 8/9 to every pair on 1–2 (Hagel)']], dis: c => c.mode !== 'dyad' || !c.use89 },
  { key: 'tenRest', label: 'The numeral 10', type: 'bool', opts: () => [['false', 'counted like the others'], ['true', 'a pause (Wulstan)']], dis: c => c.mode !== 'run' || c.num !== 'select' },
  { key: 'vitale', label: 'Instrumental frame', type: 'bool', opts: () => [['false', 'off: all bars triple'], ['true', 'duple outside the sung lines (Vitale)']], dis: c => c.num !== 'bars' },
  { sub: 'Damaged numerals' },
  { key: 'plusx', label: 'l. 7, irbute 1[+x]', type: 'num', opts: () => [['1', 'read 1'], ['2', 'read 2']] },
  { key: 'four5', label: 'll. 8–10, 4 or 5 (Gibson)', type: 'num', opts: () => [['4', 'read 4'], ['5', 'read 5']] },
  { key: 'final', label: 'l. 10, last numeral', opts: () => [['r', 'as the edition reads'], ['2', '2'], ['3', '3'], ['5', '5']] }
];

function recompute() { S.real = realize(S.cfg); }
function applyPreset(key) {
  stopPlayback();
  S.preset = key; LS.set('preset', key);
  S.cfg = cfgFull(PRESETS[key].cfg); S.sel = null;
  animateYoke(S.cfg.dir);
  setK(0, { quiet: true });
  recompute(); renderBench(); renderScore();
}
function setCfg(key, val) {
  stopPlayback();
  const before = S.cfg.dir;
  S.cfg[key] = val; S.cfg.pub = null; S.preset = 'custom'; LS.set('preset', 'custom'); LS.set('cfg', S.cfg);
  if (S.cfg.dir !== before) animateYoke(S.cfg.dir);
  recompute(); renderBench(); renderScore();
}
function renderPresets() {
  const chips = PRESET_ORDER.map(k => `<button type="button" class="preset" role="radio" aria-checked="${S.preset === k}" data-p="${k}"><b>${esc(PRESETS[k].name)}</b><span>${esc(PRESETS[k].year)}</span></button>`);
  if (S.preset === 'custom') chips.push(`<button type="button" class="preset custom" role="radio" aria-checked="true" data-p="custom"><b>Your settings</b><span>custom</span></button>`);
  $('#presets').innerHTML = chips.join('');
  $('#presets').querySelectorAll('.preset').forEach(b => b.onclick = () => { if (b.dataset.p !== 'custom') applyPreset(b.dataset.p); });
}
function summaryChips(cfg) {
  const c = cfgFull(cfg), f = helm({ ...parseFrameUI(c.frame), acc: 0 });
  const out = [`<span class="chip">${esc(READINGS[c.reading].short)}</span>`, `<span class="chip">${c.dir === 'desc' ? '↓ string 1 highest' : '↑ string 1 lowest'}</span>`, `<span class="chip">string 1 = ${esc(f)}</span>`, `<span class="chip lapis">${MODE_TXT[c.mode]}</span>`];
  if (c.mode === 'run') out.push(`<span class="chip">${PATH_TXT[c.path]}</span>`);
  if (c.mode !== 'tab') out.push(`<span class="chip gold">${NUM_TXT[c.num]}</span>`);
  if (c.use89) out.push(`<span class="chip">strings 8–9</span>`);
  if (c.double) out.push(`<span class="chip">octave doubling</span>`);
  if (c.temper && c.temper !== 'pyth') out.push(`<span class="chip carn">just tuning (Hagel)</span>`);
  if (c.tenRest) out.push(`<span class="chip">10 = pause</span>`);
  if (c.tenAs) out.push(`<span class="chip">10 = ${c.tenAs} units</span>`);
  if (c.vitale) out.push(`<span class="chip">duple frame</span>`);
  return out.join('');
}
function renderPresetCard() {
  const p = PRESETS[S.preset];
  const title = p ? `${p.name} ${p.year}` : 'Your settings';
  const blurb = p ? p.blurb : 'A combination of your own. Pick a scholar above to return to a published reading.';
  const src = S.real && S.real.pub ? `<p class="pub-note"><span class="chip gold">published transcription</span> Played note for note from ${esc(S.real.pub)}. <button class="btn small ghost" type="button" id="toRules">Hear the rule-based approximation</button></p>` : (p && p.cfg.pub ? '' : `<p class="pub-note muted">Generated from the rules above; no staff transcription of this reading is entered.</p>`);
  $('#presetCard').innerHTML = `<p><b>${esc(title)}.</b> ${esc(blurb)}</p><div class="chips">${summaryChips(S.cfg)}</div>${src}`;
  const tr = $('#toRules'); if (tr) tr.onclick = () => setCfg('pub', null);
}
function renderHyp() {
  const c = S.cfg;
  $('#hypGrid').innerHTML = FIELDS.map(f => {
    if (f.sub) return `<div class="hyp-sub kicker">${esc(f.sub)}</div>`;
    const v = String(c[f.key]);
    const dis = f.dis && f.dis(c);
    return `<div class="field"><label for="f-${f.key}">${esc(f.label)}</label><select id="f-${f.key}" data-k="${f.key}" ${dis ? 'disabled' : ''}>${f.opts().map(([ov, ol]) => `<option value="${esc(ov)}" ${ov === v ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select></div>`;
  }).join('');
  $('#hypGrid').querySelectorAll('select').forEach(sel => sel.onchange = () => {
    const f = FIELDS.find(x => x.key === sel.dataset.k);
    let v = sel.value; if (f.type === 'bool') v = v === 'true'; else if (f.type === 'num') v = Number(v); else if (f.type === 'tri') v = v === 'true' ? true : v === 'false' ? false : v;
    setCfg(f.key, v);
  });
}
function renderLineSel() {
  const R = S.real, spb = 60 / S.bpm, fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const opts = [['all', `all (${fmt(R.total * spb)})`]].concat(R.segs.map((sp, i) => [String(i), `${sp.label} (${fmt((sp.end - sp.start) * spb)})`]));
  $('#lineSel').innerHTML = opts.map(([v, l]) => `<option value="${v}" ${v === S.line ? 'selected' : ''}>${l}</option>`).join('');
  $('#durOut').textContent = `${R.onsets} onsets · ${R.notes} notes`;
}
function isVar(u) {
  const d = READINGS.DL.lines[u.li][u.si];
  if (!d) return true;
  return d[0] !== u.k || parseNum(d[1]).d !== u.num.d;
}
function tileHTML(u) {
  const cls = ['tile'];
  if (S.cfg.reading !== 'DL' && isVar(u)) cls.push('var');
  if (S.sel === u.idx) cls.push('sel');
  if (isW(u.k)) return `<button type="button" class="${cls.join(' ')} word" data-u="${u.idx}"><span class="tl">${esc(u.tl)}</span><span class="meta">${u.num.v != null ? 'word · ' + esc(u.num.d) : 'word'}</span></button>`;
  if (u.k === '?') return `<button type="button" class="${cls.join(' ')} illeg" data-u="${u.idx}"><span class="tl">${esc(u.tl)}</span><span class="meta">${esc(u.num.d)} · not identified</span></button>`;
  const D = DICH[u.k], [a, b] = D.pair;
  const numCls = u.num.changed ? 'num chg' : (u.num.edUnc || u.unc ? 'num unc' : 'num');
  const nv = u.num.changed ? `${u.num.v}` : esc(u.num.d);
  const notes = `${noteName(S.cfg, S.k, a)} ${noteName(S.cfg, S.k, b)}`;
  return `<button type="button" class="${cls.join(' ')}" data-u="${u.idx}" aria-label="${esc(u.tl)}, strings ${a} and ${b}, numeral ${esc(u.num.d)}"><span class="cf">${D.cf}</span><span class="tl">${esc(u.tl)}</span><span class="meta"><span>${a}·${b}</span><span class="${numCls}">${nv}</span></span><span class="nn">${esc(notes)}</span></button>`;
}
function renderTiles() {
  const R = S.real;
  $('#tiles').innerHTML = LINE_NUMS.map((ln, li) => `<div class="tline"><button type="button" class="tl-num" data-line="${li}" title="Play line ${ln}"><b>${ln}</b>▶</button><div class="tl-row">${R.units.filter(u => u.li === li).map(tileHTML).join('')}</div></div>`).join('');
  $('#tiles').classList.toggle('no-cf', !S.showCf);
  $('#tiles').querySelectorAll('.tile').forEach(t => t.onclick = () => { const i = +t.dataset.u; inspect(i); if (S.real.events.some(e => e.u === i)) play({ unit: i }); });
  $('#tiles').querySelectorAll('.tl-num').forEach(b => b.onclick = () => play({ line: +b.dataset.line }));
}
function realSummary(u) {
  const evs = S.real.events.filter(e => e.u === u.idx);
  if (!evs.length) return '—';
  const nm = s => noteName(S.cfg, S.k, s);
  const parts = []; let last = null, count = 0;
  const flush = () => { if (last) parts.push(count > 1 ? `${last} ×${count}` : last); };
  for (const e of evs) {
    if (e.kind === 'drone') continue;
    const unit = S.cfg.unit || 1;
    let lab = e.kind === 'rest' ? 'pause' : e.s.map(nm).join(' + ');
    if (e.kind === 'emb') lab = '(' + lab + ')';
    if (e.kind !== 'rest' && Math.abs(e.d - unit) > 0.01) lab += `·${+e.d.toFixed(2)}`;
    if (e.kind === 'rest') lab += `·${e.d}`;
    if (lab === last) count++; else { flush(); last = lab; count = 1; }
  }
  flush();
  const drone = evs.find(e => e.kind === 'drone');
  return parts.join('  ') + (drone ? `  over drone ${nm(drone.s[0])}` : '');
}
function apparatus(li, si) {
  return Object.keys(READINGS).map(code => {
    const s = READINGS[code].lines[li] && READINGS[code].lines[li][si];
    if (!s) return '';
    const d = READINGS.DL.lines[li][si], diff = d[0] !== s[0] || parseNum(d[1]).d !== parseNum(s[1]).d;
    let n = parseNum(s[1]).d; if (code === 'Gi') n = gibsonNum(s);
    return `<span class="${diff ? 'diff' : ''}"><b>${esc(READINGS[code].short)}</b><i>${esc(s[2])}</i> ${esc(n === '—' ? '' : n)}</span>`;
  }).join('');
}
function gibsonNum(s) { const n = parseNum(s[1]).d; if (s[3] === 'four5') return n + ' (5?)'; if (s[3] === 'final') return n + ' (damaged)'; return n; }
function inspect(idx) {
  S.sel = idx; const u = S.real.units[idx], box = $('#insp');
  $('#tiles').querySelectorAll('.tile').forEach(t => t.classList.toggle('sel', +t.dataset.u === idx));
  let h = '';
  if (isW(u.k)) {
    const ust = /uš/.test(u.tl);
    h = `<div class="insp-top"><span class="tl">${esc(u.tl)}</span><span class="kicker">l. ${u.line} · not a string pair</span></div>`
      + (ust ? `<dl class="insp-grid"><div><dt>Kilmer 1971</dt><dd>“I do slowly”: a tempo mark (later abandoned).</dd></div><div><dt>Kümmel, in Krispijn 2002</dt><dd>A Hurrianised <i>ul</i> / <i>lā zamāri</i>, “not sung”.</dd></div><div><dt>Thiel 1977</dt><dd>Via Urartian <i>ušta=ma=a=ri</i>: “give the notes without adding text”.</dd></div><div><dt>Vitale 1982</dt><dd>“Don’t hear, give”: the instrumental prelude ends and the voice comes in half-way through <i>išarte</i> 10.</dd></div><div><dt>Dumbrill 2005</dt><dd>A falling scale from string 2 to string 9, the last note held; he gives it a numeral 10.</dd></div></dl><p class="muted" style="margin:0">The word recurs on other Hurrian fragments, usually after a numeral (Wulstan 1971).</p>`
        : `<p style="margin:0">Kilmer 1974 read <i>˹ša? šini?˺</i> here and took it as “repeat”. Since the collation of Dietrich &amp; Loretz 1975 the place reads <i>ša-aḫ-ri</i> 1.</p>`);
  } else if (u.k === '?') {
    h = `<div class="insp-top"><span class="tl">${esc(u.tl)}</span><span class="kicker">l. ${u.line} · not identified in ${esc(READINGS[S.cfg.reading].name)}</span></div><p style="margin:0">${S.real.events.some(e => e.u === u.idx && e.kind !== 'rest') ? 'Unidentified, but the transcription gives it notes: ' + esc(realSummary(u)) + '.' : 'The engine leaves a gap here.'}</p>`;
  } else {
    const D = DICH[u.k], [a, b] = D.pair, iv = intervalOf(S.cfg, S.k, a, b), occ = occurrences(S.cfg)[u.k];
    h = `<div class="insp-top"><span class="cf">${D.cf}</span><span class="tl">${esc(u.tl)}</span><span class="pairnum">${esc(u.num.d)}</span><span class="kicker">tablet l. ${u.line}, term ${u.si + 1}</span></div>
      <dl class="insp-grid">
        <div><dt>Babylonian term</dt><dd><i>${esc(D.akk)}</i>, “${esc(D.gloss)}”</dd></div>
        <div><dt>CBS 10996</dt><dd>strings ${a} · ${b} · ${D.cls === 'p' ? 'primary' : 'secondary'} (${Math.abs(a - b) + 1} strings)</dd></div>
        <div><dt>In ${esc(DICH[tuningName(S.k)].akk)}</dt><dd>${esc(noteName(S.cfg, S.k, a))} · ${esc(noteName(S.cfg, S.k, b))}: ${esc(iv.name)} ${iv.ratio}, ${iv.cents.toFixed(1)}¢${D.cls === 'p' ? (iv.tritone ? ' · <span class="bad">not clear</span>' : ' · <span class="ok">clear</span>') : ''}</dd></div>
        <div><dt>In this edition</dt><dd>${occ ? `${occ.n}× in ll. ${[...occ.lines].join(', ')}, numerals total ${occ.sum}` : '—'}</dd></div>
        <div style="grid-column:1/-1"><dt>Realised as (${esc(PRESETS[S.preset] ? PRESETS[S.preset].name : 'your settings')})</dt><dd>${esc(realSummary(u))}</dd></div>
      </dl>`;
  }
  h += `<div><span class="kicker">Apparatus</span><div class="app-list" style="margin-top:6px">${apparatus(u.li, u.si)}</div></div>`;
  if (DICH[u.k]) {
    const [a, b] = DICH[u.k].pair;
    h += `<div class="insp-actions"><button class="btn small" type="button" id="iTog">Hear ${a} + ${b} together</button><button class="btn small" type="button" id="iTurn">Hear ${a} then ${b}</button><button class="btn small" type="button" id="iUnit">Play this term</button></div>`;
  }
  box.innerHTML = h; box.hidden = false;
  if ($('#iTog')) { const [a, b] = DICH[u.k].pair; $('#iTog').onclick = () => playPair(a, b, 'together'); $('#iTurn').onclick = () => playPair(a, b, 'turn'); $('#iUnit').onclick = () => play({ unit: idx }); }
  highlightBand(idx);
}
function playPair(a, b, how, cfg, k) {
  const ctx = AU.ensure(); const fr = cfg ? freqs(cfg, k || 0, 0) : curFreqs(); const t = (ctx ? ctx.currentTime : 0) + 0.03;
  const seq = how === 'together' ? [[a, b]] : how === 'turn' ? [[a], [b]] : [[a], [b], [a, b]];
  seq.forEach((grp, i) => grp.forEach((s, j) => { if (ctx) AU.pluck(fr[s], t + i * 0.55 + j * 0.015, grp.length > 1 ? 0.55 : 0.75, s); vibrateAt(s, t + i * 0.55, 0.7); }));
}

/* ---- roll ---- */
const ROW = 18, TOP = 42;
function rollRange(R) { const c = R.cfg; return [Math.min(1, R.minS == null ? 1 : R.minS), Math.max(R.maxS || 7, (c.use89 || R.uses89) ? 9 : 7)]; }
function rollOrder(cfg, lo, hi) { return cfg.dir === 'desc' ? range(lo, hi) : range(lo, hi).reverse(); }
function bandsOf(R) { const out = []; for (const e of R.events) { const last = out[out.length - 1]; if (last && last.u === e.u && Math.abs(last.end - e.t) < 1e-9) last.end = e.t + e.d; else out.push({ u: e.u, start: e.t, end: e.t + e.d }); } return out; }
function renderRoll() {
  const R = S.real, cfg = R.cfg, [lo, hi] = rollRange(R), order = rollOrder(cfg, lo, hi), n = order.length;
  const ppb = 16 * S.zoom, W = Math.ceil(R.total * ppb) + 40, H = TOP + n * ROW + 10;
  const y = s => TOP + order.indexOf(s) * ROW;
  let h = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="r-row" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>`;
  let alt = 0;
  for (const bd of bandsOf(R)) {
    const u = R.units[bd.u], x = bd.start * ppb, w = (bd.end - bd.start) * ppb;
    const bc = alt++ % 2 ? 'r-band-b' : 'r-band-a';
    h += `<rect class="${S.sel === u.idx ? 'r-band-sel' : bc}" data-c="${bc}" data-u="${u.idx}" x="${x}" y="0" width="${w}" height="${H}" style="cursor:pointer"/>`;
    const lab = u.k === '?' ? '?' : isW(u.k) ? 'ušt' : (w >= 46 ? `${SHORT[u.k]} ${u.num.changed ? u.num.v : u.num.d}` : (u.num.changed ? u.num.v : u.num.d));
    if (w >= 12) h += `<text class="r-term" x="${x + 3}" y="${TOP - 8}" pointer-events="none">${esc(lab)}</text>`;
  }
  order.forEach((s, i) => { h += `<line class="r-row${s === 5 ? ' mid' : ''}${s < 1 || s > 9 ? ' virt' : ''}" x1="0" x2="${W}" y1="${TOP + i * ROW + ROW / 2}" y2="${TOP + i * ROW + ROW / 2}"/>`; });
  R.segs.forEach(sp => { const x = sp.start * ppb, room = (sp.end - sp.start) * ppb; const lab = sp.label.length * 7.2 > room - 8 ? sp.label.slice(0, Math.max(3, Math.floor((room - 14) / 7.2))) + '…' : sp.label; h += `<line class="r-line" x1="${x}" x2="${x}" y1="0" y2="${H}"/><text class="r-lab ln" x="${x + 3}" y="13"><title>${esc(sp.label)}</title>${esc(lab)}</text>`; });
  for (const e of R.events) {
    if (e.kind === 'rest') { h += `<rect class="r-rest" x="${e.t * ppb + 1}" y="${TOP}" width="${Math.max(2, e.d * ppb - 2)}" height="${n * ROW}" opacity=".6"/>`; continue; }
    const x = e.t * ppb + 1, w = Math.max(3, e.d * ppb - 2);
    const ys = e.s.filter(s => s >= lo && s <= hi).map(y);
    if (e.s.length > 1 && ys.length > 1) h += `<line class="r-stem" x1="${x + 1}" x2="${x + 1}" y1="${Math.min(...ys) + ROW / 2}" y2="${Math.max(...ys) + ROW / 2}"/>`;
    ys.forEach(yy => { h += `<rect class="r-${e.kind}" x="${x}" y="${yy + 3}" width="${w}" height="${ROW - 6}" rx="2"/>`; });
  }
  for (const m of R.marks) { const x = m.t * ppb; h += `<line class="r-mark" x1="${x}" x2="${x}" y1="${TOP - 4}" y2="${H}"/><text class="r-mark-t" x="${x + 4}" y="${H - 4}">${esc(m.label)}</text>`; }
  h += `<line class="r-ph" id="ph" x1="0" x2="0" y1="0" y2="${H}" visibility="hidden"/>`;
  const svg = $('#roll'); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = h;
  svg.querySelectorAll('rect[data-u]').forEach(r => r.onclick = () => { const i = +r.dataset.u; inspect(i); play({ unit: i }); });
  let lh = ''; order.forEach((s, i) => { const yy = TOP + i * ROW + ROW / 2 + 4; const v = s < 1 || s > 9; lh += `<text class="r-slab${v ? ' virt' : ''}" x="${s > 9 || s < 0 ? 3 : 8}" y="${yy}">${v ? '·' : s}</text><text class="r-snote${v ? ' virt' : ''}" x="24" y="${yy}">${esc(noteName(cfg, S.k, s))}</text>`; });
  lh += `<text class="r-lab" x="8" y="13">${R.segs.length === LINE_NUMS.length ? 'line' : 'part'}</text><text class="r-lab" x="8" y="${TOP - 8}">term</text>`;
  const ls = $('#rollLabels'); ls.setAttribute('width', 62); ls.setAttribute('height', H); ls.setAttribute('viewBox', `0 0 62 ${H}`); ls.innerHTML = lh;
  const total = R.total * 60 / S.bpm, virt = lo < 1 || hi > 9;
  $('#rollCap').textContent = cfg.mode === 'tab' ? 'Each pair auditioned three ways: first string, second string, both. No rhythm is implied.' : `${R.total.toFixed(R.total % 1 ? 1 : 0)} beats · ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')} at ${S.bpm} bpm (crotchet) · highest string at the top${virt ? ' · rows marked · lie outside the nine strings' : ''}`;
  S.ppb = ppb;
}
function highlightBand(idx) {
  $('#roll').querySelectorAll('rect[data-u]').forEach(r => r.setAttribute('class', +r.dataset.u === idx ? 'r-band-sel' : r.dataset.c));
  const u = S.real.units[idx]; if (u && S.ppb) { const sc = $('#rollScroll'); const x = u.start * S.ppb; if (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 60) sc.scrollLeft = Math.max(0, x - 80); }
}
$('#zoomIn').onclick = () => { S.zoom = Math.min(4, S.zoom * 1.4); LS.set('zoom', S.zoom); renderRoll(); };
$('#zoomOut').onclick = () => { S.zoom = Math.max(0.35, S.zoom / 1.4); LS.set('zoom', S.zoom); renderRoll(); };

/* ---- fit panel ---- */
function renderFit() {
  const R = S.real, sums = lineSums(S.cfg);
  const has10 = S.real.units.some(u => u.li === 0 && u.num.v === 10);
  const shifted = sums.map((v, i) => i === 0 && has10 ? v - 5 : i === 1 && has10 ? v + 5 : v);
  const rows = LINE_NUMS.map((ln, i) => {
    const vs = VITALE_SYLL[i], x3 = shifted[i] * 3, ok = vs != null ? x3 === vs : null;
    return `<tr><td class="mono">${ln}</td><td class="num">${sums[i]}</td><td class="num">${shifted[i]}</td><td class="num">${vs != null ? x3 : '—'}</td><td class="num">${vs != null ? vs : '<span class="muted">instr.</span>'}</td><td>${ok == null ? '' : ok ? '<span class="ok">matches</span>' : '<span class="bad">off</span>'}</td></tr>`;
  }).join('');
  const per = R.cfg.mode === 'tab' ? null : R.onsets / 138;
  $('#fit').innerHTML = `<div class="card"><span class="kicker">Notes against syllables</span>
      ${per == null ? '<p style="margin-top:8px">Tablature makes no claim about how many notes carry the text.</p>' : `<div style="display:flex;gap:18px;align-items:baseline;margin:8px 0 10px"><div><div class="big">${R.onsets}</div><span class="kicker">onsets</span></div><div><div class="big">138</div><span class="kicker">sung syllables</span></div><div><div class="big">${per.toFixed(2)}</div><span class="kicker">onsets per syllable</span></div></div>`}
      <p>The syllable count is Vitale’s for lyric ll. 1–4 without the repeated syllables (159 with them). Güterbock (1970) tried a two-note and a run reading against the text and found “too few notes in the first, too many in the second”.</p></div>
    <div class="card"><span class="kicker">Vitale’s arithmetic, on ${esc(READINGS[S.cfg.reading].short)}</span>
      <div style="overflow-x:auto;margin-top:6px"><table><thead><tr><th>l.</th><th class="num">Σ numerals</th><th class="num">5 of the 10 moved</th><th class="num">× 3</th><th class="num">syllables</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin-top:8px">Vitale has the voice enter half-way through <i>išarte</i> 10, so five of its units count with the next line. The equation holds only on the numerals of Dietrich &amp; Loretz.</p></div>`;
}

function renderScore() {
  if (!S.real) recompute();
  renderPresets(); renderPresetCard(); renderHyp(); renderLineSel(); renderTiles(); renderRoll(); renderFit();
  $('#bpm').value = S.bpm; $('#bpmOut').textContent = S.bpm; $('#cfToggle').checked = S.showCf;
  if (S.sel != null && S.real.units[S.sel]) inspect(S.sel); else $('#insp').hidden = true;
}
$('#bpm').oninput = () => { S.bpm = +$('#bpm').value; $('#bpmOut').textContent = S.bpm; LS.set('bpm', S.bpm); renderLineSel(); renderRoll(); };
$('#lineSel').onchange = () => { S.line = $('#lineSel').value; };
$('#cfToggle').onchange = () => { S.showCf = $('#cfToggle').checked; LS.set('cf', S.showCf); $('#tiles').classList.toggle('no-cf', !S.showCf); };
$('#playBtn').onclick = () => { if (S.playing && S.playing.kind === 'score') stopPlayback(); else play(S.line === 'all' ? 'all' : +S.line); };

/* ---------------- playback ---------------- */
const VEL = { dyad: 0.55, note: 0.78, emb: 0.55, drone: 0.32, aud: 0.65 };
function schedule(evs, t0, cfg, k) {
  const ctx = AU.ensure(); const spb = 60 / S.bpm; const start = (ctx ? ctx.currentTime : 0) + 0.12; const fr = freqs(cfg, k, 0);
  if (!ctx) return { start, spb, ctx };
  for (const e of evs) {
    if (e.kind === 'rest') continue;
    const when = start + (e.t - t0) * spb;
    e.s.forEach((s, j) => { const w = when + j * 0.013; let f = freqAt(fr, cfg, s); if (e.sharp7 && s === 7) f = fr[4] * Math.pow(2, (cfg.dir === 'desc' ? -1 : 1) * 498.045 / 1200); if (e.oct) f *= Math.pow(2, e.oct); AU.pluck(f, w, VEL[e.kind] * (e.s.length > 2 ? 0.85 : 1), Math.max(1, Math.min(s, 9))); vibrateAt(s, w, e.kind === 'drone' ? 0.4 : 0.75); });
  }
  return { start, spb, ctx };
}
function play(range) {
  stopPlayback();
  const R = S.real; let evs = R.events, t0 = 0, t1 = R.total;
  if (range && range.unit != null) { const u = R.units[range.unit]; evs = evs.filter(e => e.u === range.unit && e.t >= u.start - 1e-9 && e.t < u.end - 1e-9); t0 = u.start; t1 = u.end; }
  else if (range && range.line != null) { const sp = R.lineSpans[range.line]; evs = evs.filter(e => e.t >= sp.start - 1e-9 && e.t < sp.end - 1e-9); t0 = sp.start; t1 = sp.end; }
  else if (range !== 'all') { const sp = R.segs[range] || R.lineSpans[range]; evs = evs.filter(e => e.t >= sp.start - 1e-9 && e.t < sp.end - 1e-9); t0 = sp.start; t1 = sp.end; }
  const { start, spb, ctx } = schedule(evs, t0, S.cfg, S.k);
  if (!ctx) { $('#benchInfo').textContent = S.sound ? 'This browser has no Web Audio; the roll still shows the realisation.' : 'Sound is off. Turn it on above the lyre.'; return; }
  S.playing = { kind: 'score', start, spb, t0, t1, unitOnly: range && (range.unit != null || range.line != null) };
  $('#ph') && $('#ph').setAttribute('visibility', 'visible');
  updatePlayBtn(); kick();
}
function stopPlayback() {
  if (S.playing) { AU.stopAll(); pendingVis = []; }
  const was = S.playing; S.playing = null;
  if (cycleTimer.length) { cycleTimer.forEach(clearTimeout); cycleTimer = []; }
  if (cycling) { cycling = false; $('#cycleBtn').textContent = 'Play the whole cycle'; }
  document.querySelectorAll('.tile.now').forEach(t => t.classList.remove('now'));
  const ph = $('#ph'); if (ph) ph.setAttribute('visibility', 'hidden');
  document.querySelectorAll('.mph').forEach(l => l.setAttribute('visibility', 'hidden'));
  if (was) updatePlayBtn();
}
function updatePlayBtn() { const on = S.playing && S.playing.kind === 'score'; $('#playBtn').innerHTML = on ? '<span class="ico">■</span> Stop' : '<span class="ico">▶</span> Play'; }
function tickPlayback() {
  const P = S.playing; if (!P || !AU.ctx) return;
  const beat = P.t0 + (AU.ctx.currentTime - P.start) / P.spb;
  if (beat > P.t1 + 0.6) { stopPlayback(); return; }
  if (P.kind === 'score') {
    const ph = $('#ph');
    if (ph && beat >= P.t0) { const x = beat * S.ppb; ph.setAttribute('x1', x); ph.setAttribute('x2', x); ph.setAttribute('visibility', 'visible'); const sc = $('#rollScroll'); if (!P.unitOnly && (x > sc.scrollLeft + sc.clientWidth * 0.75 || x < sc.scrollLeft)) { sc.style.scrollBehavior = 'auto'; sc.scrollLeft = x - sc.clientWidth * 0.25; } }
    const ev = S.real.events; let lo2 = 0, hi2 = ev.length - 1, hit = -1; while (lo2 <= hi2) { const m = (lo2 + hi2) >> 1; if (ev[m].t <= beat) { hit = m; lo2 = m + 1; } else hi2 = m - 1; }
    const id = hit >= 0 && beat < ev[hit].t + ev[hit].d + 1e-9 ? ev[hit].u : -1;
    if (P.cur !== id) { P.cur = id; document.querySelectorAll('.tile').forEach(t => t.classList.toggle('now', +t.dataset.u === id)); }
  } else if (P.kind === 'mini') {
    const l = document.getElementById('mph-' + P.key); if (l) { const a = P.span ? P.span[0] : P.t0, b = P.span ? P.span[1] : P.t1; const x = (beat - a) / (b - a) * 1000; l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('visibility', 'visible'); }
  }
}

/* ---------------- tuning view ---------------- */
let cycleTimer = [], cycling = false;
function setK(k, opt = {}) {
  const old = curFreqs(); S.k = k; const nw = curFreqs();
  if (opt.glide) { const ctx = AU.ensure(); for (let s = 1; s <= 9; s++) if (Math.abs(old[s] - nw[s]) > 0.01) { if (ctx) AU.pluck(old[s], ctx.currentTime + 0.02, 0.85, s, nw[s]); vibrateNow(s, 0.9); } }
  if (opt.strum) strum();
  renderBench();
  if (!opt.quiet) { if (S.tab === 'tuning') renderTuning(); if (S.tab === 'dichords') renderDichords(); if (S.tab === 'score') { renderTiles(); renderRoll(); if (S.sel != null) inspect(S.sel); } }
}
function strum() { const ctx = AU.ensure(); const fr = curFreqs(); const order = S.cfg.dir === 'desc' ? range(1, 9).reverse() : range(1, 9); order.forEach((s, i) => { const w = (ctx ? ctx.currentTime : 0) + 0.05 + i * 0.11; if (ctx) AU.pluck(fr[s], w, 0.6, s); vibrateAt(s, w, 0.6); }); }
function pairKey(a, b) { return Object.keys(DICH).find(k => { const p = DICH[k].pair; return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
function renderWheel() {
  document.querySelectorAll('[data-wm]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.wm === S.wheel)));
  $('#thirdsLab').hidden = S.wheel !== 'star'; $('#thirdsTog').checked = S.thirds;
  if (S.wheel === 'star') return renderStar();
  $('#wheelCap').textContent = 'Strings arranged by the chain of primary pairs (2·6·3·7·4·1·5). Gold: the pair the tuning is named after. Dashed: the unclear pair. Faint lines: the seven secondary pairs. Click an edge to hear it; click a string to pluck it.';
  const cx = 220, cy = 214, R = 146, k = S.k, named = tuningName(k), unc = unclearOf(k), nxt = stepString(k);
  const pos = FIFTHS_RING.map((s, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 7; return { s, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }; });
  const P = s => pos.find(p => p.s === s);
  let h = '';
  for (const key of Object.keys(DICH)) { if (DICH[key].cls !== 's') continue; const [a, b] = DICH[key].pair, A = P(a), B = P(b); h += `<line class="w-sec" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><line class="w-hit" data-d="${key}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`; }
  for (let i = 0; i < 7; i++) {
    const A = pos[i], B = pos[(i + 1) % 7], key = pairKey(A.s, B.s), cls = key === named ? 'named' : key === unc ? 'unclear' : '';
    h += `<line class="w-edge ${cls}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = mx - cx, dy = my - cy, L = Math.hypot(dx, dy), ox = cx + dx / L * (L + 24), oy = cy + dy / L * (L + 24);
    const anchor = Math.abs(dx) < 30 ? 'middle' : dx > 0 ? 'start' : 'end';
    h += `<text class="w-elab ${cls}" x="${ox}" y="${oy + 5}" text-anchor="${anchor}">${esc(DICH[key].akk)}</text>`;
    h += `<line class="w-hit" data-d="${key}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
  }
  const alt = alterations(k);
  for (const p of pos) {
    const isNext = p.s === nxt;
    if (isNext) h += `<circle class="w-pulse" cx="${p.x}" cy="${p.y}" r="20"/>`;
    h += `<circle class="w-node${isNext ? ' next' : ''}" data-s="${p.s}" cx="${p.x}" cy="${p.y}" r="20"/><text class="w-num" x="${p.x}" y="${p.y + 5}" text-anchor="middle">${p.s}</text>`;
    const nx = cx + (R - 42) * Math.cos(p.a), ny = cy + (R - 42) * Math.sin(p.a);
    h += `<text class="w-note${alt[p.s] ? ' alt' : ''}" x="${nx}" y="${ny + 5}" text-anchor="middle">${esc(noteName(S.cfg, k, p.s))}</text>`;
  }
  h += `<circle class="w-disc" cx="${cx}" cy="${cy + 8}" r="74"/>`;
  h += `<text class="w-center" x="${cx}" y="${cy - 4}" text-anchor="middle">${esc(DICH[named].akk)}</text>`;
  h += `<text class="w-sub" x="${cx}" y="${cy + 20}" text-anchor="middle">unclear: ${esc(DICH[unc].akk)} (${DICH[unc].pair.join('·')})</text>`;
  const gk = greekOf(S.cfg, k); h += `<text class="w-sub" x="${cx}" y="${cy + 40}" text-anchor="middle" style="fill:var(--ink3)">${gk ? 'Greek species: ' + gk : ''}</text>`;
  const svg = $('#wheel'); svg.innerHTML = h;
  svg.querySelectorAll('.w-hit').forEach(l => {
    const key = l.dataset.d, [a, b] = DICH[key].pair;
    l.addEventListener('click', () => playPair(a, b, 'three'));
    l.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; const iv = intervalOf(S.cfg, S.k, a, b); showTip(ev, `<i>${esc(DICH[key].akk)}</i>, ${a}·${b}<br>${esc(noteName(S.cfg, S.k, a))} – ${esc(noteName(S.cfg, S.k, b))}: ${esc(iv.name)} ${iv.ratio}`); });
    l.addEventListener('pointerleave', hideTip);
  });
  svg.querySelectorAll('.w-node').forEach(c => c.addEventListener('click', () => pluckString(+c.dataset.s)));
}

/* ---- CBS 1766 star: strings 1–7 clockwise, primaries as the 7/3 star ---- */
const CBS_NAMES = [null, 'qudmu', 'šamuššu', '[šalšu qatnu]', 'Ea-banû', 'ḫamšu', 'rebi uḫri', 'šalšu uḫri'];
const CHAIN = [2, 6, 3, 7, 4, 1, 5];
S.wheel = LS.get('wheel', 'star'); S.thirds = LS.get('thirds', false); S.starHl = [];
function renderStar() {
  $('#wheelCap').innerHTML = 'After CBS 1766: the seven strings in their own order round a double circle, the primary pairs as a seven-pointed star drawn in one line (2·6·3·7·4·1·5·2). Gold: the pair the tuning is named after; dashed: the unclear pair. The outer heptagon joins neighbouring strings, marked T or S in this tuning: the unclear pair is the star side lying between the two semitones (Friberg 2011). Click a line to hear it, a string to pluck it.';
  const cx = 220, cy = 194, R = 114, k = S.k, named = tuningName(k), unc = unclearOf(k), nxt = stepString(k), c = centsOf(S.cfg, k), alt = alterations(k);
  const pos = [null]; for (let i = 1; i <= 7; i++) { const a = -Math.PI / 2 + (i - 1) * 2 * Math.PI / 7; pos.push({ s: i, a, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }); }
  const hl = (a, b) => S.starHl.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  let h = `<circle class="s-circ" cx="${cx}" cy="${cy}" r="${R}"/><circle class="s-circ" cx="${cx}" cy="${cy}" r="${R + 16}"/>`;
  for (let i = 1; i <= 7; i++) { // heptagon: neighbouring strings
    const j = i % 7 + 1, A = pos[i], B = pos[j], step = Math.abs(c[i] - c[i + 1]), T = step > 150;
    h += `<line class="s-hept ${T ? 'T' : 'S'}${hl(i, j) ? ' trace' : ''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = mx - cx, dy = my - cy, L = Math.hypot(dx, dy);
    h += `<text class="s-hlab ${T ? 'T' : 'S'}" x="${cx + dx / L * (L - 13)}" y="${cy + dy / L * (L - 13) + 4}" text-anchor="middle">${T ? 'T' : 'S'}</text>`;
  }
  if (S.thirds || S.starHl.some(x => x[2] === 's')) for (const key of Object.keys(DICH)) { if (DICH[key].cls !== 's') continue; const [a, b] = DICH[key].pair; h += `<line class="s-third${hl(a, b) ? ' trace' : ''}" x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}"/>`; }
  for (const key of Object.keys(DICH)) {
    if (DICH[key].cls !== 'p') continue;
    const [a, b] = DICH[key].pair, A = pos[a], B = pos[b], cls = key === named ? 'named' : key === unc ? 'unclear' : '';
    h += `<line class="w-edge ${cls}${hl(a, b) ? ' trace' : ''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
  }
  for (const key of Object.keys(DICH)) { const [a, b] = DICH[key].pair; if (DICH[key].cls === 's' && !S.thirds) continue; h += `<line class="w-hit" data-d="${key}" x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}"/>`; }
  for (let i = 1; i <= 7; i++) {
    const p = pos[i], isNext = i === nxt || (nxt > 7 && nxt - 7 === i);
    if (isNext) h += `<circle class="w-pulse" cx="${p.x}" cy="${p.y}" r="17"/>`;
    h += `<circle class="w-node${isNext ? ' next' : ''}" data-s="${i}" cx="${p.x}" cy="${p.y}" r="17"/><text class="w-num" x="${p.x}" y="${p.y + 5}" text-anchor="middle">${i}</text>`;
    const ox = cx + (R + 30) * Math.cos(p.a), oy = cy + (R + 30) * Math.sin(p.a), anchor = Math.abs(Math.cos(p.a)) < 0.3 ? 'middle' : Math.cos(p.a) > 0 ? 'start' : 'end';
    const dy = Math.sin(p.a) < -0.9 ? -10 : 0;
    h += `<text class="s-name" x="${ox}" y="${oy + dy}" text-anchor="${anchor}">${esc(CBS_NAMES[i])}</text><text class="w-note${alt[i] ? ' alt' : ''}" x="${ox}" y="${oy + dy + 16}" text-anchor="${anchor}">${esc(noteName(S.cfg, k, i))}${i <= 2 ? ' · ' + esc(noteName(S.cfg, k, i + 7)) : ''}</text>`;
  }
  h += `<circle class="w-disc" cx="${cx}" cy="${cy}" r="34"/><text class="w-sub" x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-style:italic;font-size:15px;fill:var(--ink)">${esc(DICH[named].akk)}</text><text class="w-sub" x="${cx}" y="${cy + 15}" text-anchor="middle" style="font-size:11px">unclear ${DICH[unc].pair.join('·')}</text>`;
  const svg = $('#wheel'); svg.innerHTML = h;
  svg.querySelectorAll('.w-hit').forEach(l => {
    const key = l.dataset.d, [a, b] = DICH[key].pair;
    l.addEventListener('click', () => playPair(a, b, 'three'));
    l.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; const iv = intervalOf(S.cfg, S.k, a, b); showTip(ev, `<i>${esc(DICH[key].akk)}</i>, ${a}·${b}<br>${esc(noteName(S.cfg, S.k, a))} – ${esc(noteName(S.cfg, S.k, b))}: ${esc(iv.name)} ${iv.ratio}`); });
    l.addEventListener('pointerleave', hideTip);
  });
  svg.querySelectorAll('.w-node').forEach(n => n.addEventListener('click', () => pluckString(+n.dataset.s)));
}
let traceTimers = [];
function traceStop() { traceTimers.forEach(clearTimeout); traceTimers = []; S.starHl = []; document.querySelectorAll('.cbs td.on').forEach(td => td.classList.remove('on')); if (S.tab === 'tuning') renderWheel(); }
function traceSteps(steps, gap = 650) { // steps: [{lines:[[a,b,type]], play:[a,b], cells:[...]}]
  traceStop(); AU.ensure();
  if (S.wheel !== 'star') { S.wheel = 'star'; LS.set('wheel', 'star'); }
  steps.forEach((st, i) => traceTimers.push(setTimeout(() => {
    S.starHl = st.lines; renderWheel();
    document.querySelectorAll('.cbs td.on').forEach(td => td.classList.remove('on'));
    (st.cells || []).forEach(id => { const td = document.getElementById(id); if (td) td.classList.add('on'); });
    if (st.play) playPair(st.play[0], st.play[1], st.how || 'together');
  }, i * gap)));
  traceTimers.push(setTimeout(traceStop, steps.length * gap + 900));
}
function chainFrom(s0) { const i = CHAIN.indexOf(s0); return CHAIN.slice(i).concat(CHAIN.slice(0, i)); }
function traceChain(s0, col) { const ch = chainFrom(s0); traceSteps(ch.map((a, i) => { const b = ch[(i + 1) % 7]; return { lines: [[a, b, 'p']], play: [a, b], cells: col ? [`cbs-${col}-${i}`] : [] }; })); }
$('#traceBtn').onclick = () => traceChain(2, 'A');
document.querySelectorAll('[data-wm]').forEach(b => b.onclick = () => { S.wheel = b.dataset.wm; LS.set('wheel', S.wheel); traceStop(); renderWheel(); });
$('#thirdsTog').onchange = () => { S.thirds = $('#thirdsTog').checked; LS.set('thirds', S.thirds); renderWheel(); };

/* the table of CBS 1766 (Horowitz 2006; emendations of Waerzeggers & Siebes 2007, followed by Friberg 2011) */
const CBS_TAB = { A: [2, 6, 3, 7, 4, 1, [5, 6]], B: [6, 3, 7, 4, 1, 5, 2], C: [1, 5, 2, 6, 3, 7, [4, 5]], D: [7, 4, 1, 5, 2, 6, 3], E: [5], F: [4], G: [[7, null]], H: [2] };
function cbsVal(v) { return Array.isArray(v) ? v[0] : v; }
function renderCbs() {
  const cols = Object.keys(CBS_TAB);
  let h = `<thead><tr><th></th>${cols.map(c => `<th><button type="button" data-col="${c}" title="Trace column ${c} on the star">${c}</button></th>`).join('')}</tr></thead><tbody>`;
  for (let r = 0; r < 7; r++) {
    h += `<tr data-row="${r}"><td class="gap">${r + 1}</td>`;
    for (const c of cols) { const v = CBS_TAB[c][r]; if (v === undefined) { h += `<td class="gap" id="cbs-${c}-${r}">·</td>`; continue; } const em = Array.isArray(v); h += `<td id="cbs-${c}-${r}" class="${em ? 'em' : ''}" title="${em ? (v[1] == null ? 'read 7; Waerzeggers & Siebes expect 3 (or 5?)' : 'Horowitz reads ' + v[1] + '; emended to ' + v[0]) : ''}">${em ? (v[1] == null ? v[0] + '?' : v[0] + '<sup>' + v[1] + '</sup>') : v}</td>`; }
    h += '</tr>';
  }
  $('#cbsTab').innerHTML = h + `</tbody><caption class="muted" style="caption-side:bottom;text-align:left;font-size:12.5px;padding:8px 10px">Red: emended. Horowitz reads 6 and 5 in row 7 of A and C (small figures); Waerzeggers &amp; Siebes and Friberg read 5 and 4, which completes the chain. Columns E–H have only their first row.</caption>`;
  $('#cbsTab').querySelectorAll('[data-col]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const c = b.dataset.col, v = cbsVal(CBS_TAB[c][0]); traceChain(c === 'G' ? 3 : v, c); });
  $('#cbsTab').querySelectorAll('tr[data-row]').forEach(tr => tr.onclick = () => {
    const r = +tr.dataset.row, A = cbsVal(CBS_TAB.A[r]), B = cbsVal(CBS_TAB.B[r]), C = cbsVal(CBS_TAB.C[r]), D = cbsVal(CBS_TAB.D[r]);
    const steps = [{ lines: [[A, B, 'p']], play: [A, B], cells: [`cbs-A-${r}`, `cbs-B-${r}`] }, { lines: [[A, B, 'p'], [C, D, 'h']], play: [C, D], how: 'turn', cells: [`cbs-A-${r}`, `cbs-B-${r}`, `cbs-C-${r}`, `cbs-D-${r}`] }];
    if (r === 0) steps.push({ lines: [[5, 4, 'h'], [7, 2, 's']], play: [7, 2], cells: ['cbs-E-0', 'cbs-F-0', 'cbs-G-0', 'cbs-H-0'] });
    traceSteps(steps, 1100);
  });
  $('#cbsCards').innerHTML = `
    <div class="card"><h3>What the tablet adds to U.7/80</h3><p>UET VII 74 gives the procedure, one string at a time; CBS 10996 gives the names of the fourteen pairs; Nabnītu XXXII gives the names of the strings. CBS 1766 puts these together in one picture. Its star lists the primary pairs in exactly the order of the retuning cycle (<i>išartu, kitmu, embūbu, pītu, nīd qabli, nīš, qablītu</i>), which is also the order of the Assur catalogue VAT 10101 that sorts songs by tuning. Read as a chain, it is a recipe for tuning from scratch: 2, then 6 from 2, 3 from 6 and so on round to 5, leaving 5·2 unclear (Friberg). The seven points on one circle also treat string 8 as string 1 again, the octave identity the tuning text assumes when it says “1 and 8”.</p></div>
    <div class="card"><h3>Readings</h3><p><b>Horowitz 2006</b>: labels read as <i>da-mu</i>, <i>u₄-mu-sum</i> …; pairs with equal sums mod 7; rotating circles, perhaps a board game; dated Late Babylonian. <b>Waerzeggers &amp; Siebes 2007</b>: the labels are the names of strings 1–7; each column is the star’s chain begun at a different string, for <i>išartu</i> (2), <i>kitmu</i> (6), <i>nīš</i> (1), <i>pītu</i> (7), then <i>qablītu</i> (5), <i>nīd qabli</i> (4), [<i>embūbu</i>, 3, though the tablet seems to have 7] and <i>išartu</i> again (2). <b>Friberg 2011</b>: column ii lists the star’s sides, column iii the sides of a heptagon parallel to them, the first line of v–vi a heptagon side parallel to a side of the 7/2 star of thirds; heading “directions · pairs · the stakes are close together”; a last column “its name” with traces of <i>išartum</i>, <i>kitmum</i>; layout like Plimpton 322, so Old Babylonian Larsa, c. 1790–1780. <b>Shnider</b> (JANES 32): every column steps by +4 mod 7, like the progressions of astronomical tables. <b>Dumbrill</b> (essays on academia.edu): a rotating dial for the seven modes, which would need a second disc that leaves no trace on the tablet.</p></div>
    <div class="card"><h3>What it does not add</h3><p>No ratios, no absolute pitch, no direction of the scale: the star works the same whether string 1 is highest or lowest. Several labels and the heading are emended or unread, column G does not fit, and the date is disputed (Late Babylonian for Horowitz, Old Babylonian for Friberg). Horowitz &amp; Shnider’s collation (NABU 2009/1) and Crickmore’s study (<i>Music Theory Spectrum</i> 30, 2008) are cited here from Shnider, not seen.</p></div>`;
}
function renderInstr() {
  const k = S.k, X = tuningName(k), U = unclearOf(k), nT = stepString(k), nL = loosenString(k), [ua, ub] = DICH[U].pair;
  const t8 = s => s <= 2 ? `${s} and ${s + 7}` : String(s);
  const asc = S.cfg.dir === 'asc';
  $('#instr').innerHTML = `<span class="kicker">Tightening chapter · UET VII 74, ll. 1–12</span>
    <p class="q">If the <i>sammûm</i> is <b>${esc(DICH[X].akk)}</b> and <b>${esc(DICH[U].akk)}</b> (strings ${ua}·${ub}) is not clear, you tighten string${nT <= 2 ? 's' : ''} <b>${t8(nT)}</b>, and ${esc(DICH[U].akk)} will be clear. The <i>sammûm</i> is now <b>${esc(DICH[U].akk)}</b>.</p>
    <span class="kicker">Loosening chapter · ll. 13 ff.; UET VI/3 899</span>
    <p class="q" style="font-size:16.5px">If the <i>sammûm</i> is <b>${esc(DICH[X].akk)}</b> and you have played the unclear <b>${esc(DICH[U].akk)}</b>, you loosen string${nL <= 2 ? 's' : ''} <b>${t8(nL)}</b>, and the <i>sammûm</i> will be <b>${esc(DICH[tuningName(k - 1)].akk)}</b>.</p>
    <p class="akkline">Key words: <i>zakû</i> “clear”, <i>la zakû</i> “not clear”, <i>nussuḫum</i> “tightening” (Krispijn’s reading of l. 12), <i>nê’um</i> “to loosen”. Paradigm after Gurney 1994.</p>
    ${asc ? `<div class="warn">Ascending order is selected. To clear ${esc(DICH[U].akk)} here string ${nT} has to go <b>down</b>, so “tighten” must be read as “loosen”, as the text was read before Krispijn 1990. The buttons follow the text’s order and move the pitch the way the ascending convention requires.</div>` : ''}`;
  $('#tightenBtn').innerHTML = `Tighten ${t8(nT)} <span class="ico">▸</span>`;
  $('#loosenBtn').innerHTML = `<span class="ico">◂</span> Loosen ${t8(nL)}`;
  const d = Math.floor(k / 7), within = mod(k, 7);
  $('#drift').innerHTML = `Step ${within} of 7 in the cycle from <i>nīd qablim</i>${d ? `; the whole instrument now sits <b>${Math.abs(d)} apotome${Math.abs(d) > 1 ? 's' : ''} (${(Math.abs(d) * C_A).toFixed(1)}¢) ${(d > 0) === (S.cfg.dir === 'desc') ? 'higher' : 'lower'}</b> than where it started, because seven adjustments move every string once` : ''}.`;
}
function renderSteps() {
  const alt = alterations(S.k), c = centsOf(S.cfg, S.k);
  let h = '';
  for (let s = 1; s <= 9; s++) {
    h += `<div class="st-node${alt[s] ? ' alt' : ''}"><span class="n">${s}</span><span class="p">${esc(noteName(S.cfg, S.k, s))}</span></div>`;
    if (s < 9) { const d = Math.abs(c[s] - c[s + 1]), T = d > 150, iv = intervalOf(S.cfg, S.k, s, s + 1); h += `<div class="st-gap ${T ? 'T' : 'S'}"><b>${T ? 'T' : 'S'}</b>${iv.ratio || d.toFixed(0) + '¢'}</div>`; }
  }
  $('#steps').innerHTML = h;
}
function renderTunTable() {
  const head = `<thead><tr><th>Tuning</th><th>Unclear pair</th>${range(1, 9).map(s => `<th>${s}</th>`).join('')}<th>Greek species</th><th>in h.6</th></tr></thead>`;
  const occ = occurrences({ reading: 'DL' });
  const rows = range(-3, 3).map(k => {
    const alt = alterations(k), cur = tuningName(k) === tuningName(S.k), U = unclearOf(k), o = occ[U];
    return `<tr data-k="${k}" class="${cur ? 'cur' : ''}"><td><i>${esc(DICH[tuningName(k)].akk)}</i></td><td><i>${esc(DICH[U].akk)}</i> <span class="mono muted">${DICH[U].pair.join('·')}</span></td>${range(1, 9).map(s => `<td class="${alt[s] ? 'alt' : ''}">${esc(noteName(S.cfg, k, s))}</td>`).join('')}<td>${esc(greekOf(S.cfg, k) || '')}</td><td class="mono">${o ? o.n + '×' : '<span class="ok">0</span>'}</td></tr>`;
  }).join('');
  $('#tunTable').innerHTML = head + `<tbody>${rows}</tbody>`;
  $('#tunTable').querySelectorAll('tr[data-k]').forEach(r => r.onclick = () => { stopPlayback(); setK(+r.dataset.k, { strum: true }); });
}
function renderTuneCards() {
  const occ = occurrences({ reading: 'DL' });
  const zero = range(-3, 3).filter(k => !occ[unclearOf(k)]).map(k => `<i>${esc(DICH[tuningName(k)].akk)}</i>`);
  $('#tuneCards').innerHTML = `
    <div class="card"><h3>The colophon’s tuning, tested</h3><p>The colophon names <i>nīd qablim</i>. In that tuning the only unclear primary pair is <i>pītum</i> (7·4), a term h.6 never uses, so every fourth and fifth the hymn calls for is clear. On the D&amp;L text this is true of two tunings: ${zero.join(' and ')}. The right-hand column of the table counts how often each tuning’s unclear pair appears.</p></div>
    <div class="card"><h3>Which way do the strings run?</h3><p>Under a descending order (string 1 highest) every step of the first chapter is literally a tightening. Krispijn read <i>nu-us-su-ḫ[u-um]</i>, “tightening”, in l. 12 where earlier editors had NU.SU.U[D]; Gurney (1994) and West took this as confirming the descending order Vitale had argued from Nabnītu XXXII, where the front strings 3 and 4 are “thin” and “small”. Kilmer, Černý (2004) and others keep an ascending order; Crocker held that “scales do not go up or down, they just sit there”.</p></div>
    <div class="card"><h3>Strings 8 and 9</h3><p>The text twice moves two strings at once: “1 and 8” when <i>nīš tuḫrim</i> is reached, “2 and 9” for <i>išartum</i>. Strings 8 and 9 therefore stand in a fixed relation to 1 and 2, usually taken as the octave, which is how the lyre here treats them. They never appear in CBS 10996 or in the notation itself.</p></div>
    <div class="card"><h3>One cycle, a semitone up</h3><p>Seven tightenings move each string once by an apotome (2187:2048, 113.7¢). The names come round again, but the whole instrument has risen. That is why the text continues with a loosening chapter that runs the cycle back. Press Tighten seven times to hear it.</p></div>
    <div class="card"><h3>Is <i>nīd qablim</i> Dorian?</h3><p>Read downward from string 1, <i>nīd qablim</i> has the step pattern of the Greek Dorian species (Hagel 2005); under the ascending convention the same tuning reads as Lydian. The Greek names are offered as a key, not a claim: as Mirelman put it, the resulting picture “seems uncomfortably familiar and Eurocentric”.</p></div>
    <div class="card"><h3>String names</h3><p class="muted">Nabnītu XXXII (UET VII 126) names nine strings palindromically, after Kilmer 1965 and Gibson 2026.</p><table><tbody>${range(1, 9).map(s => `<tr><td class="mono">${s}</td><td>${esc(STRING_NAMES[s])}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderTuning() { renderWheel(); renderInstr(); renderSteps(); renderTunTable(); renderTuneCards(); renderCbs(); }
$('#tightenBtn').onclick = () => { stopPlayback(); setK(S.k + 1, { glide: true }); };
$('#loosenBtn').onclick = () => { stopPlayback(); setK(S.k - 1, { glide: true }); };
$('#resetBtn').onclick = () => { stopPlayback(); setK(0, { strum: true }); };
function beforeAfter(delay = 0) {
  const k = S.k, U = unclearOf(k), [a, b] = DICH[U].pair, ms = x => cycleTimer.push(setTimeout(x[1], delay + x[0]));
  ms([0, () => { playPair(a, b, 'turn'); }]);
  ms([1200, () => { playPair(a, b, 'together'); }]);
  ms([2100, () => { setK(k + 1, { glide: true }); }]);
  ms([3200, () => { playPair(a, b, 'together'); }]);
  return 4300;
}
$('#beforeAfterBtn').onclick = () => { stopPlayback(); AU.ensure(); beforeAfter(); };
$('#cycleBtn').onclick = () => {
  if (cycling) { stopPlayback(); return; }
  stopPlayback(); AU.ensure(); cycling = true;
  $('#cycleBtn').textContent = 'Stop the cycle';
  let t = 0;
  for (let i = 0; i < 7; i++) { cycleTimer.push(setTimeout(() => beforeAfter(0), t)); t += 4400; }
  cycleTimer.push(setTimeout(() => { strum(); cycleTimer = []; cycling = false; $('#cycleBtn').textContent = 'Play the whole cycle'; }, t));
};

/* ---------------- dichords view ---------------- */
const MSHORT = { nish: 'nīš tuḫ.', titurqablitim: 'titur q.', titurishartim: 'titur i.', zerdum: 'ṣerdum', nidqablim: 'nīd q.' };
function renderMatrix() {
  const cell = 56, x0 = 46, y0 = 28; let h = '';
  const unc = unclearOf(S.k);
  for (let j = 2; j <= 7; j++) h += `<text class="m-ax" x="${x0 - 12}" y="${y0 + (j - 2) * cell + cell / 2 + 4}" text-anchor="end">${j}</text>`;
  for (let i = 1; i <= 6; i++) h += `<text class="m-ax" x="${x0 + (i - 1) * cell + cell / 2}" y="${y0 + 6 * cell + 18}" text-anchor="middle">${i}</text>`;
  for (let j = 2; j <= 7; j++) for (let i = 1; i < j; i++) {
    const x = x0 + (i - 1) * cell, y = y0 + (j - 2) * cell, key = pairKey(i, j), cls = key ? DICH[key].cls : 'n';
    h += `<rect class="m-cell ${cls}${key === unc ? ' unclear' : ''}" data-a="${i}" data-b="${j}" x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" rx="4"/>`;
    if (key) { const [a, b] = DICH[key].pair; h += `<text class="m-name" x="${x + cell / 2}" y="${y + 25}" text-anchor="middle">${esc(MSHORT[key] || DICH[key].akk)}</text><text class="m-pair" x="${x + cell / 2}" y="${y + 41}" text-anchor="middle">${a}·${b}</text>`; }
    else h += `<text class="m-pair" x="${x + cell / 2}" y="${y + 33}" text-anchor="middle">${i}·${j}</text>`;
  }
  h += `<text class="m-ax" x="${x0 + 3.2 * cell}" y="${y0 - 10}" text-anchor="middle">pairs of strings 1–7</text>`;
  const svg = $('#matrix'); svg.innerHTML = h;
  svg.querySelectorAll('.m-cell').forEach(r => {
    const a = +r.dataset.a, b = +r.dataset.b, key = pairKey(a, b);
    r.addEventListener('click', () => { const p = key ? DICH[key].pair : [a, b]; playPair(p[0], p[1], 'three'); });
    r.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; const iv = intervalOf(S.cfg, S.k, a, b); showTip(ev, key ? `<i>${esc(DICH[key].akk)}</i>, “${esc(DICH[key].gloss)}”<br>${esc(iv.name)} in ${esc(DICH[tuningName(S.k)].akk)}` : `Neighbouring strings ${a}·${b}: ${esc(iv.name)}<br>unnamed in CBS 10996`); });
    r.addEventListener('pointerleave', hideTip);
  });
}
function renderDichNotes() {
  $('#dichNotes').innerHTML = `<h3>How the fourteen fit together</h3>
    <p><span class="chip lapis">primary</span> Seven pairs four or five strings apart: fourths and fifths in a diatonic tuning. Their names double as the names of the seven tunings.</p>
    <p><span class="chip gold">secondary</span> Seven pairs three or six strings apart: thirds and sixths. CBS 10996 lists each after a primary with which it shares one string (1·5 then 7·5; 2·6 then 1·6, and so on).</p>
    <p><span class="chip">unnamed</span> The seven pairs of neighbouring strings have no term in CBS 10996. Colburn (2018) identifies <i>siḫpu</i> for sevenths in other Babylonian texts; nothing similar appears at Ugarit.</p>
    <p class="muted" style="margin:0">Red outline: the pair that is unclear in the lyre’s current tuning. Click a cell to hear it in turn and together.</p>`;
}
function renderDtab() {
  const occ = occurrences(S.cfg), X = DICH[tuningName(S.k)].akk;
  const head = `<thead><tr><th>CBS 10996</th><th>Term</th><th>Meaning</th><th>At Ugarit (h.6)</th><th>Span</th><th>In ${esc(X)}</th><th>Status</th><th>In h.6 (${esc(READINGS[S.cfg.reading].short)})</th><th></th></tr></thead>`;
  let rows = '';
  CBS_PAIRS.forEach((pr, pi) => pr.forEach((key, j) => {
    const D = DICH[key], [a, b] = D.pair, iv = intervalOf(S.cfg, S.k, a, b), o = occ[key], span = Math.abs(a - b) + 1;
    const spanName = { 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth' }[span];
    rows += `<tr class="${D.cls}${j === 0 ? ' pairtop' : ''}">
      <td><span class="pairnum">${a} · ${b}</span></td>
      <td><i>${esc(D.akk)}</i></td>
      <td class="wrap">“${esc(D.gloss)}”${D.note ? `<br><span class="muted" style="font-size:13px">${esc(D.note)}</span>` : ''}</td>
      <td>${D.h6 ? `<span class="cf">${D.cf}</span> <i>${esc(D.h6)}</i><br><span class="muted" style="font-size:13px">${esc(D.gib)}</span>` : `<span class="absent">${esc(D.gib)}</span>`}</td>
      <td>${span} strings<br><span class="muted">${spanName}</span></td>
      <td>${esc(noteName(S.cfg, S.k, a))} – ${esc(noteName(S.cfg, S.k, b))}<br><span class="muted">${esc(iv.name)} ${iv.ratio} · ${iv.cents.toFixed(1)}¢</span></td>
      <td>${iv.tritone ? '<span class="chip carn">not clear</span>' : iv.wolf ? '<span class="chip carn">impure (wolf)</span>' : iv.tempered ? '<span class="chip gold">tempered</span>' : D.cls === 'p' ? '<span class="chip lapis">clear</span>' : '<span class="muted">—</span>'}</td>
      <td>${o ? `${o.n}× · Σ ${o.sum}<br><span class="muted">ll. ${[...o.lines].join(', ')}</span>` : '<span class="absent">absent</span>'}</td>
      <td><button class="btn small" type="button" data-a="${a}" data-b="${b}">▶</button></td></tr>`;
  }));
  $('#dtab').innerHTML = head + `<tbody>${rows}</tbody>`;
  $('#dtab').querySelectorAll('button[data-a]').forEach(b => b.onclick = () => playPair(+b.dataset.a, +b.dataset.b, 'three'));
}
function renderDichords() { renderMatrix(); renderDichNotes(); renderDtab(); }

/* ---------------- tablet view ---------------- */
function renderTablet() {
  let h = `<div class="tb-sec"><span class="kicker">ll. 1–4 · Hurrian text · underlined: the seven syllables repeated at the next line’s start</span>`;
  LYR.forEach((line, li) => {
    h += `<div class="tb-line"><span class="ln">${li + 1}</span><div class="tb-words">${line.map((slot, si) => { const rep = slot[0] === '*', dl = (rep ? slot.slice(1) : slot).split('|')[0]; return `<button type="button" class="w${rep ? ' rep' : ''}${S.tabSel === 'l' + li + '.' + si ? ' sel' : ''}" data-w="${li}.${si}">${esc(dl)}</button>`; }).join('')}</div></div>`;
  });
  h += `</div><div class="rule2"></div><div class="tb-sec"><span class="kicker">ll. 5–10 · notation (D&amp;L 1975)</span>`;
  READINGS.DL.lines.forEach((line, li) => {
    h += `<div class="tb-line"><span class="ln">${LINE_NUMS[li]}</span><div class="tb-words">${line.map((s, si) => `<button type="button" class="w${S.tabSel === 'n' + li + '.' + si ? ' sel' : ''}" data-n="${li}.${si}">${esc(s[2])}${s[1] != null ? `<span class="n">${esc(String(s[1]))}</span>` : ''}</button>`).join('')}</div></div>`;
  });
  h += `</div><div class="rule1"></div><div class="tb-sec"><span class="kicker">ll. 11–12 · Akkadian colophon</span><div class="tb-line"><span class="ln">col.</span><div class="tb-words"><button type="button" class="w" data-c="1">${esc(COLOPHON[0][1])}</button></div></div></div>`;
  $('#tablet').innerHTML = h;
  $('#tablet').querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const [li, si] = b.dataset.w.split('.').map(Number); S.tabSel = 'l' + li + '.' + si; renderTablet(); showLyrApp(li, si); });
  $('#tablet').querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const [li, si] = b.dataset.n.split('.').map(Number); S.tabSel = 'n' + li + '.' + si; renderTablet(); showNotApp(li, si); });
  $('#tablet').querySelectorAll('[data-c]').forEach(b => b.onclick = () => { S.tabSel = 'c'; showColApp(); });
  if (!$('#tabSide').dataset.ready) { renderTabSide(); $('#tabSide').dataset.ready = '1'; }
  renderCollation();
}
function renderTabSide(app) {
  $('#tabSide').innerHTML = `<div class="card" id="appCard">${app || '<span class="kicker">Apparatus</span><p style="margin-top:6px">Select a word, term or the colophon on the tablet to compare the editions.</p>'}</div>
    <div class="card"><h3>Seven syllables, three times</h3><p>The last seven syllables of lyric ll. 1–3 open the next line: <i>ḫumaruḫat uwari</i>, <i>wešal tatib tišia</i>, <i>kalitanil nikala</i>. Laroche took them for catch-lines like those that link Babylonian tablets. Güterbock and Kilmer, noting that catch-lines never occur inside a single tablet, read them as refrains. Duchesne-Guillemin replied that the spiral layout, unknown in Babylonia, is reason enough for such guides; Vitale saw a cue for the singer turning from reverse to obverse. Koitabashi (1996, 1998) made the same case with the custos (<i>guidon</i>) of chant notation, which carries one line into the next.</p></div>
    <div class="card"><h3>What the words say</h3><p>The Hurrian is a local Ugarit dialect and only partly understood. Thiel (1977) and Krispijn (2002) read a prayer with offerings to Nikkal (<i>ni-ka-la</i>, ll. 3–4) turning on fertility: sesame oil (<i>ša-am-ša-am-me-ni</i>, l. 3; cf. Akkadian <i>šamaššammū</i>) is brought, and in Krispijn’s reading the last lines voice a wife who has borne no children. Both translations are provisional.</p></div>`;
}
function setApp(html) { const c = $('#appCard'); if (c) c.innerHTML = html; else renderTabSide(html); }
function showLyrApp(li, si) {
  const raw = LYR[li][si], rep = raw[0] === '*', parts = (rep ? raw.slice(1) : raw).split('|');
  setApp(`<span class="kicker">Lyric l. ${li + 1}, word ${si + 1}${rep ? ' · repeated syllables' : ''}</span><table class="app-table" style="margin-top:6px"><tbody>${parts.map((p, i) => `<tr><td class="mono" style="white-space:nowrap">${esc(LYR_EDS[i])}</td><td>${esc(p === '→' ? '(joined to the previous word)' : p)}</td></tr>`).join('')}</tbody></table>`);
}
function showNotApp(li, si) {
  const d = READINGS.DL.lines[li][si];
  const head = d[0] === '@' ? `<i>${esc(d[2])}</i>` : `<span class="cf" style="font-size:22px">${DICH[d[0]].cf}</span> <i>${esc(d[2])}</i> ${esc(String(d[1]))} = <i>${esc(DICH[d[0]].akk)}</i>, strings ${DICH[d[0]].pair.join('·')}`;
  setApp(`<span class="kicker">Tablet l. ${LINE_NUMS[li]}, term ${si + 1}</span><p style="margin:6px 0 8px">${head}</p><table class="app-table"><tbody>${Object.keys(READINGS).filter(code => READINGS[code].lines[li][si]).map(code => { const s = READINGS[code].lines[li][si]; const n = code === 'Gi' ? gibsonNum(s) : parseNum(s[1]).d; return `<tr><td class="mono" style="white-space:nowrap">${esc(READINGS[code].name)}</td><td>${esc(s[2])} ${n === '—' ? '' : esc(n)}</td></tr>`; }).join('')}</tbody></table>`);
}
function showColApp() {
  setApp(`<span class="kicker">Colophon</span><p style="margin:6px 0 8px">“This (is) a song (<i>zammārum</i>) of the <i>nid qibli</i>, a <i>zaluzi</i> […]; hand of Ammurabi.” <i>Nid qibli</i> is <i>nīd qablim</i>, the tuning. Ammurabi is the scribe; Kilmer restores a composer, Urḫiya, who is named on h.8, h.11 and h.13 (Appendix B). Koitabashi compares Mesopotamian hymn colophons, which also give a genre and then the copyist’s name.</p><table class="app-table"><tbody>${COLOPHON.map(([e, t]) => `<tr><td class="mono" style="white-space:nowrap">${esc(e)}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>`);
}
function renderCollation() {
  const codes = Object.keys(READINGS);
  let h = `<thead><tr><th>l.</th><th>#</th>${codes.map(c => `<th>${esc(READINGS[c].short)} ${READINGS[c].year}</th>`).join('')}</tr></thead><tbody>`;
  READINGS.DL.lines.forEach((line, li) => line.forEach((d, si) => {
    h += `<tr class="${si === 0 ? 'lstart' : ''}"><td class="mono">${si === 0 ? LINE_NUMS[li] : ''}</td><td class="mono muted">${si + 1}</td>`;
    for (const c of codes) {
      const s = READINGS[c].lines[li][si]; if (!s) { h += '<td class="d"><span class="muted">—</span></td>'; continue; }
      const n = c === 'Gi' ? gibsonNum(s) : parseNum(s[1]).d;
      const diff = s[0] !== d[0] || parseNum(s[1]).d !== parseNum(d[1]).d;
      h += `<td class="${diff ? 'd' : ''}"><span class="tl">${esc(s[2])}</span> ${n === '—' ? '' : `<span class="mono">${esc(n)}</span>`}</td>`;
    }
    h += '</tr>';
  }));
  $('#collation').innerHTML = h + '</tbody>';
}

/* ---------------- scholars view ---------------- */
function renderScholars() {
  $('#multLine').innerHTML = LINE_NUMS.map((ln, i) => `<option value="${i}" ${i === S.multLine ? 'selected' : ''}>l. ${ln}</option>`).join('');
  $('#mult').innerHTML = PRESET_ORDER.map(key => {
    const P = PRESETS[key], cfg = cfgFull(P.cfg), R = realize(cfg), sp = R.lineSpans[S.multLine];
    const [lo, hi] = rollRange(R), order = rollOrder(cfg, lo, hi), n = order.length, rh = 70 / n, W = 1000, sc = W / Math.max(0.5, sp.end - sp.start);
    let g = '';
    for (const bd of bandsOf(R)) if (bd.start >= sp.start - 1e-9 && bd.start < sp.end - 1e-9) { const x = (bd.start - sp.start) * sc; g += `<line x1="${x}" x2="${x}" y1="0" y2="70" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".18"/>`; }
    for (const e of R.events) { if (e.t < sp.start - 1e-9 || e.t >= sp.end - 1e-9 || e.kind === 'rest') continue; for (const s of e.s) { if (s < lo || s > hi) continue; g += `<rect class="r-${e.kind}" x="${(e.t - sp.start) * sc + 1}" y="${order.indexOf(s) * rh + 1}" width="${Math.max(4, e.d * sc - 3)}" height="${Math.max(2, rh - 2)}"/>`; } }
    g += `<line class="r-ph mph" id="mph-${key}" x1="0" x2="0" y1="0" y2="70" vector-effect="non-scaling-stroke" visibility="hidden"/>`;
    return `<div class="mrow"><div><h4>${esc(P.name)}<span>${esc(P.year)}</span></h4><div class="msub">${esc(READINGS[cfg.reading].short)} · ${cfg.dir === 'desc' ? '↓' : '↑'} · ${esc(MODE_TXT[cfg.mode])}${cfg.mode !== 'tab' ? ' · ' + esc(NUM_TXT[cfg.num].replace('numeral = ', '')) : ''}${cfg.pub ? ' · <b>from the print</b>' : ''}</div></div>
      <svg viewBox="0 0 ${W} 70" preserveAspectRatio="none" style="color:var(--ink)" aria-label="${esc(P.name)} realisation of line ${LINE_NUMS[S.multLine]}">${g}</svg>
      <div class="acts"><button class="btn small" type="button" data-play="${key}" aria-label="Play ${esc(P.name)}">▶</button><button class="btn small ghost" type="button" data-load="${key}">Load</button></div></div>`;
  }).join('');
  $('#mult').querySelectorAll('[data-play]').forEach(b => b.onclick = () => playMini(b.dataset.play));
  $('#mult').querySelectorAll('[data-load]').forEach(b => b.onclick = () => { applyPreset(b.dataset.load); location.hash = 'score'; });
  renderCmp(); renderNotModelled();
}
$('#multLine').onchange = () => { S.multLine = +$('#multLine').value; stopPlayback(); renderScholars(); };
function playMini(key) {
  stopPlayback();
  const cfg = cfgFull(PRESETS[key].cfg), R = realize(cfg), sp = R.lineSpans[S.multLine];
  const evs = R.events.filter(e => e.t >= sp.start - 1e-9 && e.t < sp.end - 1e-9);
  const { start, spb, ctx } = schedule(evs, sp.start, cfg, 0);
  if (!ctx) return;
  S.playing = { kind: 'mini', key, start, spb, t0: sp.start, t1: sp.end }; kick();
}
function renderCmp() {
  const rows = PRESET_ORDER.map(key => { const P = PRESETS[key], c = cfgFull(P.cfg); return `<tr><td>${esc(P.name)} ${esc(P.year)}</td><td>${esc(READINGS[c.reading].name)}</td><td>${c.dir === 'desc' ? 'descending' : 'ascending'}</td><td>${esc(MODE_TXT[c.mode])}${c.mode === 'run' ? ` (${esc(PATH_TXT[c.path])})` : ''}</td><td>${c.mode === 'tab' ? 'left open' : esc(NUM_TXT[c.num].replace('numeral = ', ''))}</td><td>${c.use89 ? 'yes' : 'no'}</td><td>${esc(helm({ ...parseFrameUI(c.frame), acc: 0 }))}</td></tr>`; }).join('');
  $('#cmp').innerHTML = `<thead><tr><th>Reading</th><th>Edition used</th><th>String 1 is</th><th>A term sounds as</th><th>The numeral counts</th><th>8–9</th><th>String 1</th></tr></thead><tbody>${rows}</tbody>`;
}
function renderNotModelled() {
  $('#notModelled').innerHTML = `
    <div class="card"><h3>Hagel: one realisation and an article</h3><p>Hagel made one realisation of the Hurrian pieces: the MIDI files of h.6 and sixteen fragments on his site <a href="https://www.oeaw.ac.at/kal/mane/" target="_blank" rel="noopener">Music of the Ancient Near East</a>, each marked “Copyright Stefan Hagel 1998” on a page dated 2006. They are dyads in a just tuning, the two highest strings doubled an octave below, with the numerals as durations, h.6 on the D&amp;L text and the fragments on Laroche’s; “by no means intended to represent a reconstruction”, only “an idea of the ‘harmonic’ progression”, since the vocal note “cannot unambiguously be deduced”. The 2005 article says outright that its purpose “is not to put forth another hypothetical rendition” and gives the theory instead: <i>nīd qablim</i> as Dorian read downward; a just tuning on two pure triads (e–g–b, d–f–a) bridged by a pure <i>titur qablītim</i>, with c pure to g, pure to f (as in the files) or tempered between; repetition or duration for the numerals, with 10 a reciting note or a fermata (the files hold it for seven units), the distribution of the numbers counting against duration; and, for the fragments, <i>ašḫuwe</i> as f raised to f♯, which the files do not use. The Hagel preset plays the files; the article’s alternatives are settings: Fine tuning, The numeral counts, and the qualifier option in Appendix B.</p></div>
    <div class="card"><h3>Koitabashi 1996/1998: formulas and counts</h3><p>Koitabashi lists six problems (what the terms denote, what the numerals count, <i>uštamari</i>, whether the repeated syllables are refrains, the two pairs of small wedges on the double ruling, and how the words fit the notes) and answers four. The wedges are not peculiar to h.6: Laroche (1968: 462 n. 3) describes a double oblique wedge marking the double ruling at its start, and sometimes along it, also on h.3, h.10, h.20, h.23 and h.28. Each term is a melodic formula known by its first and final note, as the Hebrew accents call up stock formulas; the numeral is the number of repetitions; one formula may go to each word; the repeated syllables are a reading aid, like the custos (<i>guidon</i>) of chant. The Koitabashi preset takes the first two answers and fills each formula by step, which he does not specify.</p></div>
    <div class="card"><h3>Not modelled here</h3><p><b>Güterbock 1970</b> identified the terms and tested both counts against the syllables without result. <b>Thiel 1977–78</b> studied text and structure without a transcription. <b>Halperin 1992</b> and <b>Rahn 2011</b> analyse tuning and the whole corpus rather than proposing a single score.</p></div>
    <div class="card"><h3>Versions beyond the score</h3><p>Kilmer’s performing version (<i>Sounds from Silence</i>, 1976) and Krispijn’s three verses depend on fitting the text. Dumbrill’s maqām version, first sung at the Damascus Opera House in 2011 and recorded at Byblos in 2012, came from musicians who “felt the need to emphasize certain pitches” and spoke of <i>bayātī</i> and <i>ḥijāz</i> (Dumbrill 2014, 334). His printed 2014 score, entered here, is plain diatonic; the inflections belong to the performance, and nothing in the notation or the tuning texts specifies them.</p></div>
    <div class="card"><h3>Critiques</h3><p><b>Bayer 2014</b>: each proponent “brought to the task his own current theory-of-Mesopotamian-music”, and the problem is not solved. <b>Gibson 2026</b> argues that staff notation itself closes the question, and proposes string-number tablature as the neutral layer: here, the tiles.</p></div>`;
}

/* ---------------- sources ---------------- */
const BIB = {
  'Editions and collations': [
    'Laroche, E. 1955. “Les textes hourrites.” In J. Nougayrol (ed.), <i>Le Palais royal d’Ugarit</i> III, 327–35. Paris.',
    'Laroche, E. 1968. “Documents en langue hourrite provenant de Ras Shamra.” <i>Ugaritica</i> V, 447–544 (h.6: 463, copy 487; h.7–h.30: 465–76, copies 488–96).',
    'Laroche, E. 1973. “Études hourrites.” <i>RA</i> 67: 119–38 (notation terms 124–29).',
    'Güterbock, H. G. 1970. “Musical Notation in Ugarit.” <i>RA</i> 64: 45–52.',
    'Dietrich, M. and O. Loretz 1975. “Kollationen zum Musiktext aus Ugarit.” <i>UF</i> 7: 521–22.',
    'Thiel, H.-J. 1977. “Der Text und die Notenfolgen des Musiktextes aus Ugarit.” <i>SMEA</i> 18: 109–36; 1978, “Zur Gliederung des ‘Musik-Textes’ aus Ugarit.” <i>RHA</i> 36: 189–98.',
    'Goranson, C. “Hurrian Hymn No. 6” (web article with aligned readings). <a href="https://web.archive.org/web/20250303115722/http://individual.utoronto.ca/seadogdriftwood/Hurrian/Website_article_on_Hurrian_Hymn_No._6.html" target="_blank" rel="noopener">archived copy</a>.'
  ],
  'Babylonian theory texts': [
    'Kilmer, A. D. 1960. “Two New Lists of Key Numbers for Mathematical Operations.” <i>Orientalia</i> NS 29: 273–308 (CBS 10996).',
    'Kilmer, A. D. 1965. “The Strings of Musical Instruments: Their Names, Numbers, and Significance.” <i>AS</i> 16: 261–68.',
    'Gurney, O. R. 1968. “An Old Babylonian Treatise on the Tuning of the Harp.” <i>Iraq</i> 30: 229–33.',
    'Wulstan, D. 1968. “The Tuning of the Babylonian Harp.” <i>Iraq</i> 30: 215–28.',
    'Kümmel, H. M. 1970. “Zur Stimmung der babylonischen Harfe.” <i>Orientalia</i> 39: 252–63.',
    'Crocker, R. L. 1978. “Remarks on the Tuning Text UET VII 74 (U. 7/80).” <i>Orientalia</i> 47: 99–104.',
    'Krispijn, T. J. H. 1990. “Beiträge zur altorientalischen Musikforschung 1. Šulgi und die Musik.” <i>Akkadica</i> 70: 1–27.',
    'Gurney, O. R. 1994. “Babylonian Music Again.” <i>Iraq</i> 56: 101–6.',
    'Crocker, R. L. 1997. “Mesopotamian Tonal Systems.” <i>Iraq</i> 59: 189–202; Gurney, O. R. and M. L. West 1998, “Mesopotamian Tonal Systems: A Reply.” <i>Iraq</i> 60: 223–27.',
    'Mirelman, S. 2008. “Tuḫru ‘Achilles’ Tendon’?” <i>NABU</i> 2008/65.',
    'Mirelman, S. and T. J. H. Krispijn 2009. “The Old Babylonian Tuning Text UET VI/3 899.” <i>Iraq</i> 71: 43–52.',
    'Mirelman, S. 2013. “Tuning Procedures in Ancient Iraq.” <i>Analytical Approaches to World Music</i> 2: 43–56.',
    'Friberg, J. 2011. “Seven-Sided Star Figures and Tuning Algorithms in Mesopotamian, Greek, and Islamic Texts.” <i>AfO</i> 52: 121–55.',
    'Horowitz, W. 2006. “A Late Babylonian Tablet with Concentric Circles from the University Museum (CBS 1766).” <i>JANES</i> 30: 37–53.',
    'Waerzeggers, C. and R. Siebes 2007. “An Alternative Interpretation of the Seven-Pointed Star on CBS 1766.” <i>NABU</i> 2007/40.',
    'Shnider, S. “Some Comments on W. Horowitz, ‘A Late Babylonian Tablet with Concentric Circles’.” <i>JANES</i> 32: 133–37.',
    'Dumbrill, R. J. n.d. “The Earliest Evidence of Heptatonism in a Late Old Babylonian Text: CBS 1766” and “Is the Heptagram in CBS 1766 a Dial?” (academia.edu).',
    'Duchesne-Guillemin, M. 1963. “Découverte d’une gamme babylonienne.” <i>Revue de musicologie</i> 49: 3–17 (cited from Kilmer 1971).',
    'Kilmer, A. D. 1984. “A Music Tablet from Sippar(?): BM 65217 + 66616.” <i>Iraq</i> 46: 69–79 (cited from Payne 2010).',
    'Payne, E. E. 2010. “A New Addition to the Musical Corpus.” In S. C. Melville and A. L. Slotsky (eds.), <i>Opening the Tablet Box: Near Eastern Studies in Honor of Benjamin R. Foster</i>, 291–300. Leiden (YBC 11381).',
    'Dumbrill, R. J. n.d. “YBC 11381: New Evidence for Neo-Babylonian Enneatonism in Music Theory.”',
    'Gibson, D. L. 2021. <i>A Re-examination of Ancient Near-Eastern Music-Theoretical Tablets and Notation, concerning a Tablaturisation for the Hurrian H6 Cuneiform Tablet</i>. Master’s thesis, Stellenbosch University.'
  ],
  'Readings of the notation': [
    'Wulstan, D. 1971. “The Earliest Musical Notation.” <i>Music &amp; Letters</i> 52: 365–82.',
    'Kilmer, A. D. 1971. “The Discovery of an Ancient Mesopotamian Theory of Music.” <i>PAPS</i> 115: 131–49.',
    'Kilmer, A. D. 1974. “The Cult Song with Music from Ancient Ugarit: Another Interpretation.” <i>RA</i> 68: 69–82.',
    'Kilmer, A. D., R. L. Crocker and R. R. Brown 1976. <i>Sounds from Silence</i>. Berkeley.',
    'Duchesne-Guillemin, M. 1975. “Les problèmes de la notation hourrite.” <i>RA</i> 69: 159–73; 1977, <i>Déchiffrement de la musique babylonienne</i> (Accademia dei Lincei, Quaderno 236); 1980, “Sur la restitution de la musique hourrite.” <i>Revue de Musicologie</i> 66: 5–26; 1984, <i>A Hurrian Musical Score from Ugarit: The Discovery of Mesopotamian Music</i> (Sources from the Ancient Near East 2/2). Malibu (Figs 9 and 11).',
    'Vitale, R. G. 1982. “La musique suméro-accadienne: gamme et notation musicale.” <i>UF</i> 14: 241–63 (Tableaux XIV–XV, 261–63).',
    'Černý, M. K. 1987. “Das altmesopotamische Tonsystem.” <i>ArOr</i> 55: 41–57; 2004, “Another Look at the Mesopotamian ‘Tonal’ System.” <i>ArOr</i> 72: 25–32.',
    'West, M. L. 1994. “The Babylonian Musical Notation and the Hurrian Melodic Texts.” <i>Music &amp; Letters</i> 75: 161–79.',
    'Dumbrill, R. J. 1998. <i>The Musicology and Organology of the Ancient Near East</i>. London: Tadema Press. 2nd ed. 2005 as <i>The Archaeomusicology of the Ancient Near East</i> (Trafford): h.6 at 117–33 (Fig. 5 and Plate 5), the other pieces h.2–h.30 at 134–73.',
    'Dumbrill, R. J. 2014. “The Hurrian Musical Text H6: A New Interpretation.” <i>ARAM</i> 26: 327–34.',
    'Monzo, J. 2000. “A New Reconstruction of the Hurrian Hymn.” <a href="http://www.tonalsoft.com/monzo/babylonian/hurrian/monz-h6.aspx" target="_blank" rel="noopener">tonalsoft.com</a>.',
    'Krispijn, T. J. H. 2002. “Musik in Keilschrift: Beiträge zur altorientalischen Musikforschung 2.” <i>Studien zur Musikarchäologie</i> III: 465–79.',
    'Hagel, S. n.d. <i>Music of the Ancient Near East</i>: MIDI realisations of h.6 and sixteen fragments (files © 1998). Vienna, ÖAW. <a href="https://www.oeaw.ac.at/kal/mane/" target="_blank" rel="noopener">oeaw.ac.at/kal/mane</a>.',
    'Koitabashi, M. 1996. 小板橋又久「ウガリト出土の楽譜」 [The Musical Score from Ugarit]. <i>Oriento</i> 39/2: 16–32 (in Japanese, English abstract).'
  ],
  'Music at Ugarit': [
    'Koitabashi, M. 1985. 小板橋又久「ウガリト出土文書に現われる伶人」 [Singers in the Cuneiform Texts from Ugarit]. <i>Oriento</i> 28/1: 55–64 (in Japanese, English abstract).',
    'Koitabashi, M. 1992. “The Deification of the ‘Lyre’ in Ancient Ugarit.” <i>Orient</i> 28: 106–10.',
    'Koitabashi, M. 1998. “Music in the Texts from Ugarit.” <i>UF</i> 30: 363–96 (h.6: 377–80; from his 1996 Keio dissertation).'
  ],
  'Analysis and critique': [
    'Hagel, S. 2005. “Is nīd qabli Dorian? Tuning and Modality in Greek and Hurrian Music.” <i>Baghdader Mitteilungen</i> 36: 287–348 (triadic tuning 312–17; numerals 309–10; qualifiers and modulation 331–40).',
    'Rahn, J. 2011. “The Hurrian Pieces, ca. 1350 BCE: Part One.” <i>AAWM</i> 1: 93–151.',
    'Bayer, B. 2014. “The Mesopotamian Theory of Music and the Ugarit Notation: A Reexamination.” In <i>Music in Antiquity</i>, 15–91.',
    'Campbell, D. 2016. “Observations on the Lyrical Structure of Hurrian Songs.” <i>Res Antiquae</i> 13: 59–80.',
    'Gibson, D. L. 2026. “Rethinking Ancient Music Interpretation through Hurrian Hymn H6: A Tablaturization.” <i>Early Music</i>, advance article. <a href="https://academic.oup.com/em/advance-article/doi/10.1093/em/caaf042/8442961" target="_blank" rel="noopener">doi:10.1093/em/caaf042</a>.'
  ]
};
function renderSources() {
  if ($('#biblio').dataset.ready) return;
  $('#biblio').innerHTML = Object.entries(BIB).map(([h, items]) => `<div><h3 style="margin-top:0">${esc(h)}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  $('#biblio').dataset.ready = '1';
}

/* ---------------- Appendix A: h.6 sign by sign ---------------- */
const SA = { sel: LS.get('sgSel', null), tr: LS.get('sgTr', true), clause: null };
const ST_TXT = { ok: 'clear', dam: 'damaged but readable (˹ ˺)', part: 'partly broken, rest restored ([ ] inside the sign)', rest: 'broken away, restored by the editor ([ ])', lost: 'broken away, not restored', trace: 'traces only, not identified (x)', gap: 'a break of unknown length' };
const GL_TXT = { id: 'identified', prop: 'meaning proposed', opaque: 'read, meaning unknown', dam: 'damaged', lost: 'lost' };
const GL_CHIP = { id: 'lapis', prop: 'gold', opaque: '', dam: 'carn', lost: 'carn' };
let H6S = null;
function buildH6Signs() {
  if (H6S) return H6S;
  const lyr = LYR.map(line => parseWords(line.map(s => s.split('|')[0].replace(/^\*/, ''))));
  const not = READINGS.DL.lines.map(line => line.map(s => {
    const sg = parseWords([s[2]])[0];
    if (s[1] != null) { const ns = parseWords([String(s[1]).replace('+', '-')])[0]; ns.forEach(x => { x.num = true; }); sg.push(...ns); }
    return sg;
  }));
  const col = parseWords(COLO_WORDS);
  H6S = { lyr, not, col };
  return H6S;
}
/* flat list of [wordKey, wi, signIndex, sign] for one row, cut at [word, sign] split points */
function rowSigns(words, key) { const out = []; words.forEach((w, wi) => w.forEach((sg, k) => out.push({ w: key + wi, wi, k, sg }))); return out; }
function cutAt(flat, at) { if (!at) return flat.length; const i = flat.findIndex(x => x.wi === at[0] && x.k >= at[1]); return i < 0 ? flat.length : i; }
function sgHTML(x) {
  const g = x.sg.r === 'x' || x.sg.r === '…' ? null : glyphOf(x.sg.r);
  const id = `${x.w}.${x.k}`;
  const cls = ['sg', 'st-' + x.sg.st]; if (x.sg.q) cls.push('q'); if (x.sg.num) cls.push('num'); if (!g && x.sg.r !== 'x' && x.sg.r !== '…') cls.push('nog'); if (SA.sel === id) cls.push('sel');
  const read = x.sg.det ? 'ᵐ' : x.sg.r;
  const lab = `${read}${x.sg.q ? '?' : ''}, ${ST_TXT[x.sg.st]}`;
  return `<button type="button" class="${cls.join(' ')}" data-s="${id}" aria-label="${esc(lab)}"><span class="g">${g || (x.sg.r === '…' ? '…' : x.sg.r === 'x' ? '' : '□')}</span><span class="r">${esc(read)}${x.sg.q ? '?' : ''}</span></button>`;
}
function partHTML(list) {
  let h = '', cur = null;
  for (const x of list) { if (x.w !== cur) { if (cur) h += '</span>'; h += `<span class="sw" data-w="${x.w}">`; cur = x.w; } h += sgHTML(x); }
  if (cur) h += '</span>';
  return h;
}
function facsRow(ln, L, R, extra) { return `<div class="fx-row"><span class="fx-ln">${ln}</span><span class="fx-part L">${partHTML(L)}</span><span class="fx-seam"></span><span class="fx-part R">${partHTML(R)}${extra || ''}</span></div>`; }
function renderFacs() {
  const D = buildH6Signs();
  let ob = '', rv = '';
  D.lyr.forEach((words, li) => {
    const flat = rowSigns(words, `l${li}.`), sp = H6_SPLIT.lyr[li];
    const j = cutAt(flat, sp.join), r = cutAt(flat, sp.rev), rj = cutAt(flat, sp.revJoin);
    ob += facsRow(li + 1, flat.slice(0, j), flat.slice(j, r), '<span class="fx-over" title="continues over the edge onto the reverse">↷</span>');
    rv += facsRow(li + 1, flat.slice(r, rj), flat.slice(rj), sp.approx ? '<span class="fx-over" title="position of the edge approximate">≈</span>' : '');
  });
  ob += '<div class="fx-rule2" aria-hidden="true"></div>';
  D.not.forEach((words, li) => {
    const flat = rowSigns(words, `n${li}.`), j = cutAt(flat, H6_SPLIT.not[li]);
    ob += facsRow(LINE_NUMS[li], flat.slice(0, j), flat.slice(j));
  });
  ob += '<div class="fx-rule1" aria-hidden="true"></div>';
  { const flat = rowSigns(D.col, 'c'), j = cutAt(flat, H6_SPLIT.col); ob += facsRow('11–12', flat.slice(0, j), flat.slice(j)); }
  rv += '<div class="fx-blank">uninscribed</div>';
  const head = (side, a, b) => `<div class="facs-head"><span class="kicker">${side}</span><span class="fx-pieces"><span class="pc L">${a}</span><span class="pc R">${b}</span></span></div>`;
  $('#facsObv').innerHTML = head('Obverse', H6_PIECES.L, H6_PIECES.R) + `<div class="facs-scroll"><div class="facs-clay${SA.tr ? '' : ' no-tr'}">${ob}<svg class="fx-crack" aria-hidden="true"></svg></div></div>`;
  $('#facsRev').innerHTML = head('Reverse (turned left to right)', H6_PIECES.R + ' rev.', H6_PIECES.L + ' rev.') + `<div class="facs-scroll"><div class="facs-clay rev${SA.tr ? '' : ' no-tr'}">${rv}<svg class="fx-crack" aria-hidden="true"></svg></div></div>`;
  document.querySelectorAll('#view-signs .sg').forEach(b => b.onclick = () => { SA.quiet = performance.now(); selectSign(b.dataset.s); });
  document.querySelectorAll('#view-signs .facs-scroll').forEach(sc => sc.addEventListener('scroll', () => { if (performance.now() - (SA.quiet || 0) > 400) closePop(); }, { passive: true }));
  requestAnimationFrame(drawCracks);
  if (SA.clause != null) markClause(SA.clause);
}
function drawCracks() {
  document.querySelectorAll('#view-signs .facs-clay').forEach(clay => {
    const svg = clay.querySelector('.fx-crack'), box = clay.getBoundingClientRect();
    const W = clay.scrollWidth, H = clay.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pts = [];
    clay.querySelectorAll('.fx-seam').forEach((s, i) => { const r = s.getBoundingClientRect(); const x = r.left - box.left + clay.scrollLeft + 1, y0 = r.top - box.top, y1 = r.bottom - box.top; pts.push([x + (i % 2 ? 2 : -2), y0], [x + (i % 3 ? -1 : 2), (y0 + y1) / 2], [x, y1]); });
    if (!pts.length) return;
    pts.unshift([pts[0][0], 0]); pts.push([pts[pts.length - 1][0], H]);
    svg.innerHTML = `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/>`;
  });
}
addEventListener('resize', () => { if (S.tab === 'signs') { drawCracks(); if (!$('#sgCard').hidden && SA.sel) placePop(SA.sel); } });
function findSign(id) {
  const D = buildH6Signs(); const m = id.match(/^([lnc])(\d+)\.(\d+)(?:\.(\d+))?$/); if (!m) return null;
  const t = m[1];
  if (t === 'c') { const wi = +m[2], k = +m[3]; return { t, wi, k, sg: D.col[wi][k], word: D.col[wi] }; }
  const li = +m[2], wi = +m[3], k = +m[4]; const word = (t === 'l' ? D.lyr : D.not)[li][wi];
  return { t, li, wi, k, sg: word[k], word };
}
function wordStr(word, k) { return word.map((s, i) => { const t = (s.det ? 'ᵐ' : s.r) + (s.q ? '?' : ''); const h = i === k ? `<b class="hl">${esc(t)}</b>` : esc(t); const sep = !i || word[i - 1].det ? '' : s.num ? (word[i - 1].num ? '+' : ' ') : '<span class="dash">-</span>'; return sep + h; }).join(''); }
function placeOf(f) {
  if (f.t === 'c') { const flat = rowSigns(buildH6Signs().col, 'c'), j = cutAt(flat, H6_SPLIT.col), i = flat.findIndex(x => x.wi === f.wi && x.k === f.k); return `Obverse, colophon, ${i < j ? H6_PIECES.L : H6_PIECES.R}`; }
  if (f.t === 'n') { const flat = rowSigns(buildH6Signs().not[f.li], ''), j = cutAt(flat, H6_SPLIT.not[f.li]), i = flat.findIndex(x => x.wi === f.wi && x.k === f.k); return `Obverse, l. ${LINE_NUMS[f.li]}, ${i < j ? H6_PIECES.L : H6_PIECES.R}`; }
  const flat = rowSigns(buildH6Signs().lyr[f.li], ''), sp = H6_SPLIT.lyr[f.li], i = flat.findIndex(x => x.wi === f.wi && x.k === f.k);
  const j = cutAt(flat, sp.join), r = cutAt(flat, sp.rev), rj = cutAt(flat, sp.revJoin);
  return i < j ? `Obverse, l. ${f.li + 1}, ${H6_PIECES.L}` : i < r ? `Obverse, l. ${f.li + 1}, ${H6_PIECES.R}` : i < rj ? `Reverse, l. ${f.li + 1}, ${H6_PIECES.R}` : `Reverse, l. ${f.li + 1}, ${H6_PIECES.L}`;
}
function leadReps(li) { if (!li) return 0; let n = 0; while (n < LYR[li].length && LYR[li][n][0] === '*') n++; return n; }
function clauseOf(li, si) {
  const n = leadReps(li);
  if (si < n) return clauseOf(li - 1, LYR[li - 1].length - n + si);
  let c = 0; H6_CLAUSES.forEach(([l, s], i) => { if (l < li || (l === li && s <= si)) c = i; }); return c;
}
function selectSign(id, open = true) {
  SA.sel = id; LS.set('sgSel', id);
  document.querySelectorAll('#view-signs .sg').forEach(b => b.classList.toggle('sel', b.dataset.s === id));
  const f = findSign(id); if (!f) return;
  const g = f.sg.r === 'x' || f.sg.r === '…' ? null : glyphOf(f.sg.r);
  let h = `<div class="sg-big"><span class="cf">${g || '<span class="nog-box">□</span>'}</span><div><div class="sg-read"><i>${esc(f.sg.det ? 'ᵐ (determinative before a man’s name)' : f.sg.r === 'x' ? 'x' : f.sg.r)}</i>${f.sg.q ? ' <span class="chip carn">uncertain</span>' : ''}</div><div class="kicker">${f.sg.r === 'x' || f.sg.r === '…' ? 'no sign identified' : 'sign ' + esc(signName(f.sg.r))}${!g && f.sg.r !== 'x' && f.sg.r !== '…' ? ' · no Unicode glyph used' : ''}</div></div></div>
    <p class="sg-state st-${f.sg.st}"><span class="sw-${f.sg.st}"></span>${esc(ST_TXT[f.sg.st])}</p>
    <dl class="insp-grid"><div><dt>Word</dt><dd class="sg-word">${wordStr(f.word, f.k)}</dd></div><div><dt>Place</dt><dd>${esc(placeOf(f))}</dd></div>`;
  if (f.t === 'l') {
    const gl = H6_GLOSS[f.li + '.' + f.wi] || ['opaque', 'Read, but no meaning has been proposed in the editions used here.', ''];
    const raw = LYR[f.li][f.wi], rep = raw[0] === '*';
    h += `<div style="grid-column:1/-1"><dt>Meaning</dt><dd><span class="chip ${GL_CHIP[gl[0]]}">${GL_TXT[gl[0]]}</span> ${esc(gl[1])}${gl[2] ? ` <span class="muted">(${esc(gl[2])})</span>` : ''}</dd></div>
      <div><dt>Clause</dt><dd>${clauseOf(f.li, f.wi) + 1} of ${H6_CLAUSES.length}${rep ? ' · part of the repeated syllables' : ''}</dd></div></dl>
      <span class="kicker">Six editions</span><table class="app-table" style="margin-top:4px"><tbody>${(rep ? raw.slice(1) : raw).split('|').map((p, i) => `<tr><td class="mono" style="white-space:nowrap">${esc(LYR_EDS[i])}</td><td>${esc(p === '→' ? '(joined to the previous word)' : p)}</td></tr>`).join('')}</tbody></table>`;
  } else if (f.t === 'n') {
    const d = READINGS.DL.lines[f.li][f.wi];
    if (isW(d[0])) h += `<div style="grid-column:1/-1"><dt>Meaning</dt><dd><i>uštamari</i>: not a string pair. “Not sung” (Kümmel), the voice’s entry (Vitale), a falling scale (Dumbrill). See the reading engine.</dd></div></dl>`;
    else {
      const D2 = DICH[d[0]], [a, b] = D2.pair;
      h += `<div style="grid-column:1/-1"><dt>${f.sg.num ? 'Numeral' : 'Term'}</dt><dd>${f.sg.num ? `the numeral after <i>${esc(d[2])}</i>: ${esc(String(d[1]))}` : `<i>${esc(D2.akk)}</i>, “${esc(D2.gloss)}”: strings ${a}·${b}, ${D2.cls === 'p' ? 'a primary pair' : 'a secondary pair'}`}; in ${esc(PRESETS[S.preset] ? PRESETS[S.preset].name : 'your settings')}’s frame ${esc(noteName(S.cfg, 0, a))} · ${esc(noteName(S.cfg, 0, b))}</dd></div></dl>
        <div class="insp-actions" style="margin:2px 0 8px"><button class="btn small" type="button" id="sgHear">▶ Hear ${a} · ${b}</button></div>
        <span class="kicker">Editions</span><div class="app-list" style="margin-top:6px">${apparatus(f.li, f.wi)}</div>`;
    }
  } else {
    const c = COLO_GLOSS[f.wi];
    h += `<div style="grid-column:1/-1"><dt>Meaning</dt><dd><i>${esc(c[0])}</i>: ${esc(c[1])} <span class="muted">(${esc(c[2])})</span></dd></div></dl>
      <span class="kicker">Editions</span><table class="app-table" style="margin-top:4px"><tbody>${COLOPHON.map(([e, t]) => `<tr><td class="mono" style="white-space:nowrap">${esc(e)}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>`;
  }
  if (!open) return;
  $('#sgCard').innerHTML = '<button type="button" class="x" id="sgClose" aria-label="Close">×</button>' + h;
  placePop(id);
  $('#sgClose').onclick = closePop;
  const hb = $('#sgHear'); if (hb) { const [a, b] = DICH[READINGS.DL.lines[f.li][f.wi][0]].pair; hb.onclick = () => playPair(a, b, 'three', S.cfg, 0); }
}
function placePop(id) {
  const card = $('#sgCard'), host = $('#sgTabs'), btn = document.querySelector(`#view-signs .sg[data-s="${id}"]`);
  card.hidden = false;
  if (!btn || matchMedia('(max-width:620px)').matches) return;
  const hb = host.getBoundingClientRect(), bb = btn.getBoundingClientRect(), cw = card.offsetWidth;
  let left = bb.left - hb.left + bb.width / 2 - cw / 2; left = Math.max(0, Math.min(left, hb.width - cw));
  let top = bb.bottom - hb.top + 10;
  const below = innerHeight - bb.bottom, ch = card.offsetHeight;
  if (below < ch + 20 && bb.top > ch + 80) top = bb.top - hb.top - ch - 10;
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
function closePop() { $('#sgCard').hidden = true; }
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && S.tab === 'signs') closePop(); });
document.addEventListener('pointerdown', ev => { if (S.tab !== 'signs' || $('#sgCard').hidden) return; if (ev.target.closest('#sgCard') || ev.target.closest('.sg') || ev.target.closest('#glossTab')) return; closePop(); });
function markClause(ci) {
  SA.clause = ci;
  const keys = new Set();
  LYR.forEach((line, li) => line.forEach((_, si) => { if (clauseOf(li, si) === ci) keys.add(`l${li}.${si}`); }));
  document.querySelectorAll('#view-signs .sw').forEach(w => w.classList.toggle('hl', keys.has(w.dataset.w)));
  document.querySelectorAll('#clauses [data-c]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.c === ci)));
}
function renderSigns() {
  $('#sgTr').checked = SA.tr;
  renderFacs();
  closePop();
  if (SA.sel && findSign(SA.sel)) selectSign(SA.sel, false);
  // glossary
  const rows = [];
  LYR.forEach((line, li) => line.forEach((raw, si) => {
    if (si < leadReps(li)) return;
    const parts = raw.replace(/^\*/, '').split('|'), gl = H6_GLOSS[li + '.' + si] || ['opaque', '', ''];
    const diff = new Set(parts.map(p => p.replace(/[\[\]˹˺?\-]/g, '').toLowerCase().replace(/ə/g, 'a'))).size > 1;
    rows.push(`<tr data-go="l${li}.${si}.0"><td class="mono">${li + 1}</td><td><i>${esc(parts[0])}</i></td><td><span class="chip ${GL_CHIP[gl[0]]}">${GL_TXT[gl[0]]}</span></td><td class="wrap">${esc(gl[1])}</td><td class="wrap muted">${esc(gl[2])}</td><td>${diff ? '<span class="chip gold">editions differ</span>' : ''}</td></tr>`);
  }));
  $('#glossTab').innerHTML = `<thead><tr><th>l.</th><th>Word (D&amp;L)</th><th>Status</th><th>Meaning, notes</th><th>After</th><th></th></tr></thead><tbody>${rows.join('')}</tbody>`;
  $('#glossTab').querySelectorAll('tr[data-go]').forEach(r => r.onclick = () => { const b = document.querySelector(`#view-signs .sg[data-s="${r.dataset.go}"]`); SA.quiet = performance.now(); if (b) b.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' }); selectSign(r.dataset.go); });
  const counts = {}; Object.keys(GL_TXT).forEach(k => counts[k] = 0); $('#glossTab').querySelectorAll('tbody tr').forEach(r => { const k = Object.keys(GL_TXT).find(x => r.children[2].textContent === GL_TXT[x]); counts[k]++; });
  $('#glossCount').innerHTML = Object.keys(GL_TXT).map(k => `<span class="chip ${GL_CHIP[k]}">${counts[k]} ${GL_TXT[k]}</span>`).join(' ');
  // clauses
  $('#clauses').innerHTML = H6_CLAUSES.map((c, ci) => {
    const ws = []; LYR.forEach((line, li) => line.forEach((raw, si) => { if (si < leadReps(li)) return; if (clauseOf(li, si) === ci) ws.push(raw.replace(/^\*/, '').split('|')[0]); }));
    return `<button type="button" class="clause" data-c="${ci}" aria-pressed="${SA.clause === ci}"><span class="mono">${ci + 1}</span><i>${esc(ws.join(' '))}</i></button>`;
  }).join('');
  $('#clauses').querySelectorAll('[data-c]').forEach(b => b.onclick = () => markClause(SA.clause === +b.dataset.c ? null : +b.dataset.c));
  $('#translEx').innerHTML = H6_TRANSL.map(([who, q, where]) => `<li><span class="mono muted">${esc(where)}</span> “${esc(q)}” <span class="muted">(${esc(who)})</span></li>`).join('');
}
$('#sgTr').onchange = () => { SA.tr = $('#sgTr').checked; LS.set('sgTr', SA.tr); document.querySelectorAll('#view-signs .facs-clay').forEach(c => c.classList.toggle('no-tr', !SA.tr)); requestAnimationFrame(drawCracks); };

/* ---------------- Appendix B: the other pieces ---------------- */
const FB = { rule: String(LS.get('frRule', 'west')).replace('hagel98', 'hagel'), qual: null, singles: null, text: LS.get('frText', 'L') };
/* the fragment as read in the chosen edition: Laroche 1955/1968 where he transliterates it, otherwise Dumbrill 2005 */
function fx(f) { const L = FB.text === 'L' && LAR[f.id]; return L ? Object.assign({}, f, { mus: L.mus, west: '', lar: L }) : Object.assign({}, f, { lar: null, noLar: FB.text === 'L' && f.mus.length > 0 }); }
const HAG_CMP = { 'h.3': 'the same notes, with one more pause, before z[i?', 'h.7': 'plays ša-aš-ša-t[e] 2? once and reads ti-t[i?- as titimišarte', 'h.10': 'holds the last term, ti-ta]r-kab-l[i, for five units', 'h.13': 'passes over Laroche’s queried [ša?-aḫ?-r]i? aš-ḫu-wə 2', 'h.21': 'passes over Laroche’s restored ti-ti-[i-šar-te in l. 6' };
const HAGEL98 = new Set(['h.2', 'h.3', 'h.4', 'h.5', 'h.7', 'h.8', 'h.9', 'h.10', 'h.12', 'h.13', 'h.14', 'h.19', 'h.21', 'h.23', 'h.28', 'RS 19.164 p']); // pieces realised on Hagel’s MANE site
function frDefaults() { if (!PRESETS[FB.rule] || FB.rule === 'gibson') FB.rule = 'west'; if (FB.qual == null) FB.qual = FB.rule === 'west' ? 'west' : FB.rule === 'hagel' ? 'none' : 'octave'; if (FB.singles == null) FB.singles = FB.rule === 'west'; }
function frCfg() { frDefaults(); return cfgFull(Object.assign({}, PRESETS[FB.rule].cfg, { reading: 'DL', qual: FB.qual, singles: FB.singles })); }
function frReal(f) { const cfg = frCfg(), fl = fragLines(f, cfg); return realizeLines(cfg, fl.lines, { lineNums: fl.nums }); }
function frTile(s, fi, ui) {
  if (s[0] === '|') return `<span class="ft gap" title="the lines are not continuous here">…</span>`;
  const qb = s[4] ? `<span class="qb ${s[4]}" title="${esc(QS[s[4]])}">${s[4] === 'up' ? '↑' : '↓'}</span>` : '';
  const alt = s[5] ? ` title="${esc(s[5])}"` : '';
  const n = parseNum(s[1]).d;
  if (s[0][0] === '@') return `<button type="button" class="ft word" data-f="${fi}" data-u="${ui}"${alt}><span class="tl">${esc(s[2])}</span>${n !== '—' ? `<span class="nm">${esc(n)}</span>` : ''}</button>`;
  if (s[0] === '?') return `<span class="ft illeg"${alt}><span class="tl">${esc(s[2] || '…')}</span>${n !== '—' ? `<span class="nm">${esc(n)}</span>` : ''}</span>`;
  const D = DICH[s[0]], [a, b] = D.pair;
  return `<button type="button" class="ft ${D.cls}${s[5] ? ' alt' : ''}" data-f="${fi}" data-u="${ui}"${alt}><span class="tl">${esc(s[2])}</span><span class="pr">${a}·${b}${qb}</span><span class="nm${/[?\[x]/.test(n) ? ' unc' : ''}">${n === '—' ? '–' : esc(n)}</span></button>`;
}
function frRoll(f, fi, R) {
  const cfg = R.cfg, [lo, hi] = rollRange(R), order = rollOrder(cfg, lo, hi), n = order.length, rh = 64 / n, W = 1000, sc = W / Math.max(1, R.total);
  let g = '';
  for (const m of R.marks) if (m.kind === 'gap') { const x = m.t * sc; g += `<rect x="${x}" y="0" width="${sc}" height="64" fill="url(#frHatch${fi})" opacity=".7"/>`; }
  for (const e of R.events) { if (e.kind === 'rest') continue; for (const s of e.s) { if (s < lo || s > hi) continue; g += `<rect class="r-${e.kind}${e.sharp7 && s === 7 ? ' r-sharp' : ''}" x="${e.t * sc + 0.5}" y="${order.indexOf(s) * rh + 0.5}" width="${Math.max(3, e.d * sc - 2)}" height="${Math.max(2, rh - 1)}"/>`; } }
  g += `<line class="r-ph mph" id="mph-fr${fi}" x1="0" x2="0" y1="0" y2="64" vector-effect="non-scaling-stroke" visibility="hidden"/>`;
  return `<svg viewBox="0 0 ${W} 64" preserveAspectRatio="none" class="fr-roll" aria-label="Realisation of ${esc(f.id)}"><defs><pattern id="frHatch${fi}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="1" opacity=".35"/></pattern></defs>${g}</svg>`;
}
function frNotes(R) {
  const cfg = R.cfg, nm = s => noteName(cfg, 0, s) + (s > 9 ? '' : '');
  const per = new Map();
  for (const e of R.events) {
    if (e.kind === 'drone') continue;
    const u = R.units[e.u]; if (!u) continue;
    const key = u.line; if (!per.has(key)) per.set(key, []);
    const lab = e.kind === 'rest' ? (u.k === '|' ? '…' : '·') : e.s.map(s => (e.sharp7 && s === 7 ? nm(s).replace(/^([a-g])/i, '$1♯') : nm(s)) + (e.oct ? (e.oct > 0 ? '↑8' : '↓8') : '')).join('+');
    per.get(key).push(lab);
  }
  return [...per.entries()].map(([ln, xs]) => { const out = []; let last = null, c = 0; const fl = () => { if (last) out.push(c > 1 ? `${last}×${c}` : last); }; for (const x of xs) { if (x === last) c++; else { fl(); last = x; c = 1; } } fl(); return `<div><span class="mono muted">${ln}</span> ${esc(out.join(' '))}</div>`; }).join('');
}
function renderFragments() {
  frDefaults();
  $('#frRule').innerHTML = PRESET_ORDER.filter(k => k !== 'gibson').map(k => `<option value="${k}" ${k === FB.rule ? 'selected' : ''}>${esc(PRESETS[k].name)} ${esc(PRESETS[k].year)}</option>`).join('');
  $('#frQual').value = FB.qual; $('#frSingles').value = String(FB.singles); $('#frText').value = FB.text;
  const cfg = frCfg();
  $('#frRuleNote').innerHTML = `${esc(PRESETS[FB.rule].name)}’s rules from h.6, applied unchanged: ${esc(cfg.dir === 'desc' ? 'string 1 highest' : 'string 1 lowest')}, ${esc(MODE_TXT[cfg.mode])}${cfg.mode !== 'tab' ? ', ' + esc(NUM_TXT[cfg.num]) : ''}. A lost numeral is played once; a break between unconnected lines is a hatched gap.${FB.rule === 'hagel' ? (FB.text === 'L' ? ' These are the rules of Hagel’s own files, which follow Laroche’s text: signs that cannot be identified are passed over and each line break is a silence of eight units. On this text they reproduce eleven of his sixteen fragment files exactly; the cards say where he departs. The qualifiers change nothing.' : ' Hagel’s own files follow Laroche’s text rather than Dumbrill’s, so they differ in places from these versions; switch the text to Laroche to compare. The qualifiers change nothing.') : ''}`;
  // corpus summary
  let P = 0, Sx = 0, Q = 0, QF = 0, WS = 0, WP = 0;
  for (const f of FRAG.map(fx)) { const st = fragStats(f), w = westSteps(f); P += st.p; Sx += st.s; Q += st.q; QF += st.qf; WS += w.steps; WP += w.pairs; }
  const h6w = westSteps({ mus: READINGS.DL.lines.map((l, i) => [5 + i, l]) });
  const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
  $('#frSum').innerHTML = `
    <div class="card"><span class="kicker">Primaries against secondaries</span><div class="big-row"><div><div class="big">${P}</div><span class="kicker">fourths/fifths</span></div><div><div class="big">${Sx}</div><span class="kicker">thirds/sixths</span></div><div><div class="big">${pct(P, P + Sx)}</div><span class="kicker">primary</span></div></div><p>Dumbrill counts 27% “descending fifths” and 73% “ascending thirds” across the corpus. The fragments here, restorations included, give much the same proportion.</p></div>
    <div class="card"><span class="kicker">West’s test: does the second string step?</span><div class="big-row"><div><div class="big">${WS}/${WP}</div><span class="kicker">fragments</span></div><div><div class="big">${h6w.steps}/${h6w.pairs}</div><span class="kicker">h.6</span></div><div><div class="big">${pct(WS + h6w.steps, WP + h6w.pairs)}</div><span class="kicker">together</span></div></div><p>West found 62 of 88 successions (70%) moving to a neighbouring second string, counting 8 and 9 as 1 and 2. This catalogue includes restored terms, which he left out.</p></div>
    <div class="card"><span class="kicker">Hagel’s test: what do the qualifiers touch?</span><div class="big-row"><div><div class="big">${Q}</div><span class="kicker">qualified terms</span></div><div><div class="big">${QF}</div><span class="kicker">contain string 7 (f)</span></div></div><p>Every qualified term but one contains string 7; the exception, <i>zirte durie</i> on h.30, Hagel rereads as <i>irbute durie</i>. Hence his idea that <i>ašḫuwe</i> marks f raised to f♯, the first step of modulation, and that h.6 uses the simpler style.</p></div>
    <div class="card"><span class="kicker">People and tunings</span><p style="margin-top:6px"><b>Composers</b> (TA, “from”): Urḫiya on h.8, h.11 and h.13 (and restored on h.6 by Kilmer); Puḫiya on h.14; Tapšiḫuni on h.15. <b>Scribes</b> (ŠU, “hand”): Ammurabi on h.6, Ipšali on h.12 and h.13. <b>Tuning</b>: only <i>nīd qablim</i> is ever named (h.6, h.7, h.12).</p><p><b>The three 10s</b> stand on h.6 l. 5, h.8 l. 18 and h.10 l. 7. Hagel shows they cannot belong to the same series as 1–5: a reciting note or a fermata.</p></div>`;
  // catalogue table
  $('#frTab').innerHTML = `<thead><tr><th>Piece</th><th>Museum no.</th><th class="num">Lyric lines</th><th class="num">Terms</th><th>Qualifiers</th><th>Other words</th><th>Colophon</th><th>${FB.text === 'L' ? 'Edition' : 'Dumbrill 2005'}</th></tr></thead><tbody>${FRAG.map(fx).map((f, fi) => { const st = fragStats(f); const qs = []; f.mus.forEach(([, sl]) => sl.forEach(s => { if (s[4]) qs.push(s[4] === 'up' ? 'ašḫuwe' : 'turie'); })); return `<tr data-go="${fi}"><td><b>${esc(f.id)}</b></td><td class="mono">${esc(f.rs || '—')}</td><td class="num">${f.lyr.filter(x => x && x !== 'Traces').length || '—'}</td><td class="num">${st.p + st.s || '—'}</td><td>${qs.length ? esc([...new Set(qs)].join(', ')) + ` ×${qs.length}` : ''}</td><td class="wrap"><i>${esc(st.special.map(x => x.trim()).filter(Boolean).join(', '))}</i></td><td class="wrap">${f.colo ? esc([f.colo.composer && 'TA ' + f.colo.composer, f.colo.scribe && 'ŠU ' + f.colo.scribe, f.colo.tuning].filter(Boolean).join(' · ') || '(damaged)') : ''}</td><td class="mono">${f.lar ? esc(f.lar.ref) : 'p. ' + esc(f.pg)}</td></tr>`; }).join('')}</tbody>`;
  $('#frTab').querySelectorAll('tr[data-go]').forEach(r => r.onclick = () => { const c = document.getElementById('fr-' + r.dataset.go); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  // cards
  $('#frList').innerHTML = FRAG.map(fx).map((f, fi) => {
    const has = f.mus.length > 0, R = has ? frReal(f) : null, st = fragStats(f), w = westSteps(f);
    let ui = 0;
    const lines = f.mus.map(([n, slots, lab], li) => { const prev = li ? f.mus[li - 1][0] : null; const gap = li && n !== prev + 1; const startU = ui + (gap ? 1 : 0); ui = startU; const tiles = slots.map(s => { const h = frTile(s, fi, ui); ui++; return h; }).join(''); return `${gap ? '<div class="fr-gap" aria-hidden="true"></div>' : ''}<div class="fr-line"><span class="mono">${esc(lab || n)}</span><div class="fr-tiles">${tiles}</div></div>`; }).join('');
    const chips = [];
    if (f.colo && f.colo.composer) chips.push(`<span class="chip lapis">TA ${esc(f.colo.composer)}</span>`);
    if (f.colo && f.colo.scribe) chips.push(`<span class="chip">ŠU ${esc(f.colo.scribe)}</span>`);
    if (f.colo && f.colo.tuning) chips.push(`<span class="chip gold">${esc(f.colo.tuning)}</span>`);
    if (st.q) chips.push(`<span class="chip carn">qualifiers ×${st.q}</span>`);
    if (!has) chips.push(`<span class="chip">text only</span>`);
    if (f.small) chips.push(`<span class="chip">small fragment</span>`);
    if (f.noLar) chips.push(`<span class="chip" title="Laroche gives this piece in copy only">Dumbrill’s text</span>`);
    if (HAGEL98.has(f.id)) chips.push(`<a class="chip lapis" href="https://www.oeaw.ac.at/kal/mane/" target="_blank" rel="noopener" title="Stefan Hagel, Music of the Ancient Near East (ÖAW)">Hagel 1998 MIDI ↗</a>`);
    const lyr = f.lyr.filter(x => x !== '');
    return `<article class="fcard" id="fr-${fi}">
      <header><h4>${esc(f.id)}</h4><span class="mono muted">${esc(f.rs || '')}${f.rs ? ' · ' : ''}${f.lar ? `${esc(f.lar.src)}, ${esc(f.lar.ref)}` : `Dumbrill pp. ${esc(f.pg)}`}</span><div class="chips">${chips.join('')}</div></header>
      <div class="fcard-body">
        <div class="fcard-mus">${has ? `<div class="fr-lines">${lines}</div>
          <div class="fr-play"><button class="btn small" type="button" data-play="${fi}">▶ Play</button><span class="muted">${R.onsets} onset${R.onsets === 1 ? '' : 's'}${w.pairs ? ` · West: ${w.steps}/${w.pairs} steps` : ''}${f.west ? ` · string list <span class="mono">${esc(f.west)}</span>` : ''}</span></div>
          ${frRoll(f, fi, R)}
          <details class="fr-notes"><summary>Notes as played</summary>${frNotes(R)}</details>` : '<p class="muted">No notation survives.</p>'}</div>
        <div class="fcard-txt">
          <p>${esc(f.note)}</p>
          ${FB.rule === 'hagel' && f.lar && HAGEL98.has(f.id) ? `<p class="muted">Hagel’s own file: ${HAG_CMP[f.id] ? esc(HAG_CMP[f.id]) + '; otherwise the same as here.' : 'the same notes and silences as here.'}</p>` : ''}
          ${f.words.length ? `<ul class="fr-words">${f.words.map(([w2, g2, src]) => `<li><i>${esc(w2)}</i>: ${esc(g2)}${src ? ` <span class="muted">(${esc(src)})</span>` : ''}</li>`).join('')}</ul>` : ''}
          ${lyr.length ? `<details class="fr-lyr"${lyr.length <= 4 ? ' open' : ''}><summary>Lyrics, ${lyr.length} line${lyr.length > 1 ? 's' : ''}</summary><ol>${lyr.map(x => `<li><i>${esc(x)}</i></li>`).join('')}</ol></details>` : ''}
          ${f.colo ? `<p class="fr-colo"><span class="kicker">Colophon</span><br><i>${esc(f.colo.text)}</i></p>` : ''}
        </div>
      </div></article>`;
  }).join('');
  $('#frList').querySelectorAll('[data-play]').forEach(b => b.onclick = () => playFrag(+b.dataset.play));
  $('#frList').querySelectorAll('button.ft').forEach(b => b.onclick = () => playFrag(+b.dataset.f, +b.dataset.u));
  $('#frTerms').innerHTML = `<thead><tr><th>Word</th><th>Where, and how it is used</th><th>Readings</th></tr></thead><tbody>${FRAG_TERMS.map(([t, w2, rs]) => `<tr><td><i>${esc(t)}</i></td><td class="wrap">${esc(w2)}</td><td class="wrap">${rs.map(([who, r]) => `<div><b>${esc(who)}</b>: ${esc(r)}</div>`).join('')}</td></tr>`).join('')}</tbody>`;
}
function playFrag(fi, unit) {
  stopPlayback();
  const f = fx(FRAG[fi]), R = frReal(f);
  let evs = R.events, t0 = 0, t1 = R.total;
  if (unit != null) { const u = R.units[unit]; if (!u) return; evs = evs.filter(e => e.u === unit); t0 = u.start; t1 = u.end; if (!evs.length) return; }
  const { start, spb, ctx } = schedule(evs, t0, R.cfg, 0);
  if (!ctx) return;
  S.playing = { kind: 'mini', key: 'fr' + fi, start, spb, t0, t1, span: [0, R.total] };
  kick();
}
$('#frRule').onchange = () => { FB.rule = $('#frRule').value; LS.set('frRule', FB.rule); FB.qual = null; FB.singles = null; stopPlayback(); renderFragments(); };
$('#frQual').onchange = () => { FB.qual = $('#frQual').value; stopPlayback(); renderFragments(); };
$('#frText').onchange = () => { FB.text = $('#frText').value; LS.set('frText', FB.text); stopPlayback(); renderFragments(); };
$('#frSingles').onchange = () => { FB.singles = $('#frSingles').value === 'true'; stopPlayback(); renderFragments(); };

/* ---------------- keyboard ---------------- */
addEventListener('keydown', ev => {
  const tag = (ev.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (/^[1-9]$/.test(ev.key)) { pluckString(+ev.key); ev.preventDefault(); }
  else if (ev.key === ' ' && (ev.target === document.body) && S.tab === 'score') { ev.preventDefault(); $('#playBtn').click(); }
});

/* ---------------- boot ---------------- */
$('#soundBtn').textContent = S.sound ? 'Sound on' : 'Sound off'; $('#soundBtn').setAttribute('aria-pressed', String(S.sound));
recompute(); buildLyre(); renderBench();
showTab(location.hash.slice(1) || 'score');
})();
