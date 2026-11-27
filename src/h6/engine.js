/* ============================================================
   h.6 engine — pure data + functions, no DOM.
   ============================================================ */
const C_T = 1200 * Math.log2(9 / 8);       // 203.910  tone
const C_S = 1200 * Math.log2(256 / 243);   //  90.225  limma
const C_A = 1200 * Math.log2(2187 / 2048); // 113.685  apotome
const mod = (a, n) => ((a % n) + n) % n;

/* ---------- the fourteen dichords of CBS 10996 ---------- */
const DICH = {
  nish:          { akk: 'nīš tuḫrim',     gloss: 'raising of the heel', pair: [1, 5], cls: 'p', h6: null, cf: '', gib: 'not on h.6 (miš-tuḫri? on h.30)', note: 'Formerly read nīš GABA.RI, “raising of the counterpart”; reread as nīš tuḫrim by Mirelman & Krispijn 2009.' },
  sherum:        { akk: 'šērum',          gloss: 'song, tune',          pair: [7, 5], cls: 's', h6: 'ša-aḫ-ri', cf: '𒊭𒄴𒊑', gib: 'šaḫri / šaḫre (šaġri)' },
  ishartum:      { akk: 'išartum',        gloss: 'straight, in order',  pair: [2, 6], cls: 'p', h6: 'i-šar-te', cf: '𒄿𒊬𒋼', gib: 'išarte (išarde)' },
  shalshatum:    { akk: 'šalšatum',       gloss: '(the) third',         pair: [1, 6], cls: 's', h6: 'ša-aš-ša-te', cf: '𒊭𒀸𒊭𒋼', gib: 'šaššate (šaššade)' },
  embubum:       { akk: 'embūbum',        gloss: 'reed pipe',           pair: [3, 7], cls: 'p', h6: 'um-bu-be', cf: '𒌝𒁍𒁁', gib: 'umbube / umbubi' },
  rebutum:       { akk: 'rebûtum',        gloss: '(the) fourth',        pair: [2, 7], cls: 's', h6: 'ir-bu-te', cf: '𒅕𒁍𒋼', gib: 'irbute / erbute (erbude)' },
  nidqablim:     { akk: 'nīd qablim',     gloss: 'casting down of the middle', pair: [4, 1], cls: 'p', h6: 'na-ad-qáb-li', cf: '𒈾𒀜𒆏𒇷', gib: 'nad kabli' },
  isqum:         { akk: 'isqum',          gloss: 'lot, share',          pair: [1, 3], cls: 's', h6: null, cf: '', gib: 'ešgi (eški)?', note: 'Absent from h.6 except in Duchesne-Guillemin’s restoration [ešgi] in l. 5.' },
  qablitum:      { akk: 'qablītum',       gloss: 'middle',              pair: [5, 2], cls: 'p', h6: 'qáb-li-te', cf: '𒆏𒇷𒋼', gib: 'kablite (kablide)' },
  titurqablitim: { akk: 'titur qablītim', gloss: 'bridge of the middle', pair: [2, 4], cls: 's', h6: 'ti-tar-qáb-li', cf: '𒋾𒋻𒆏𒇷', gib: 'titar kabli' },
  kitmum:        { akk: 'kitmum',         gloss: 'covering, closing',   pair: [6, 3], cls: 'p', h6: 'ki-it-me', cf: '𒆠𒀉𒈨', gib: 'kitme (kidme)' },
  titurishartim: { akk: 'titur išartim',  gloss: 'bridge of išartum',   pair: [3, 5], cls: 's', h6: 'ti-ti-mi-šar-te', cf: '𒋾𒋾𒈪𒊬𒋼', gib: 'titim-išarte (tidim-ižarde)' },
  pitum:         { akk: 'pītum',          gloss: 'opening',             pair: [7, 4], cls: 'p', h6: null, cf: '', gib: 'not attested at Ugarit' },
  zerdum:        { akk: 'ṣerdum / zerdum', gloss: 'meaning debated',    pair: [4, 6], cls: 's', h6: 'zi-ir-te', cf: '𒍣𒅕𒋼', gib: 'zirte (sirde)' }
};
/* CBS 10996 sets the terms out two by two: a primary, then a secondary sharing one string */
const CBS_PAIRS = [['nish', 'sherum'], ['ishartum', 'shalshatum'], ['embubum', 'rebutum'], ['nidqablim', 'isqum'], ['qablitum', 'titurqablitim'], ['kitmum', 'titurishartim'], ['pitum', 'zerdum']];
const SHORT = { sherum: 'šaḫ', ishartum: 'išar', shalshatum: 'šaš', embubum: 'umb', rebutum: 'irb', nidqablim: 'nad', isqum: 'ešg', qablitum: 'qab', titurqablitim: 't.qab', kitmum: 'kit', titurishartim: 't.išar', zerdum: 'zir', nish: 'nīš', pitum: 'pīt' };
const H6NAME = { sherum: 'šaḫri', ishartum: 'išarte', shalshatum: 'šaššate', embubum: 'umbube', rebutum: 'irbute', nidqablim: 'nadqabli', isqum: 'ešgi', qablitum: 'qablite', titurqablitim: 'titarqabli', kitmum: 'kitme', titurishartim: 'titimišarte', zerdum: 'zirte', nish: 'nīš tuḫrim', pitum: 'pītum' };

/* Nabnītu XXXII (UET VII 126): palindromic string names (after Kilmer 1965; Gibson 2026) */
const STRING_NAMES = [null, 'front', 'next (second)', 'third, “thin”', 'fourth, “small”, made by Ea', 'fifth, “middle”', 'fourth from the back', 'third from the back', 'second from the back', 'rearmost'];

/* ---------- UET VII 74 retuning cycle ---------- */
/* CYCLE[k] = tuning reached after k tightenings from nīd qablim */
const CYCLE = ['nidqablim', 'pitum', 'embubum', 'kitmum', 'ishartum', 'qablitum', 'nish'];
const TIGHTEN = [7, 3, 6, 2, 5, 1, 4];  // string tightened on the step CYCLE[k] → CYCLE[k+1]
const NQ_STEPS = ['T', 'T', 'S', 'T', 'T', 'T', 'S', 'T']; // nīd qablim, string 1→2 … 8→9
const FIFTHS_RING = [2, 6, 3, 7, 4, 1, 5]; // strings in chain-of-primaries order

function alterations(k) {
  const alt = Array(10).fill(0);
  if (k > 0) for (let j = 0; j < k; j++) { const s = TIGHTEN[j % 7]; alt[s]++; if (s <= 2) alt[s + 7]++; }
  if (k < 0) for (let j = -1; j >= k; j--) { const s = TIGHTEN[mod(j, 7)]; alt[s]--; if (s <= 2) alt[s + 7]--; }
  return alt;
}
const tuningName = k => CYCLE[mod(k, 7)];
const unclearOf = k => CYCLE[mod(k + 1, 7)];
const stepString = k => TIGHTEN[mod(k, 7)];          // string to tighten to go k → k+1
const loosenString = k => TIGHTEN[mod(k - 1, 7)];     // string to loosen to go k → k−1

function stepPattern(k) { // T/S sequence string 1→8 in tuning k
  const c = centsOf({ dir: 'desc' }, k);
  const out = [];
  for (let i = 1; i <= 7; i++) out.push(Math.abs(c[i] - c[i + 1]) > 150 ? 'T' : 'S');
  return out;
}

/* ---------- pitch ---------- */
const LETTERS = 'CDEFGAB';
const NAT = [0, C_T, 2 * C_T, 2 * C_T + C_S, 3 * C_T + C_S, 4 * C_T + C_S, 5 * C_T + C_S];
const PC12 = [0, 2, 4, 5, 7, 9, 11];
function parseFrame(fr) { return { L: LETTERS.indexOf(fr[0]), o: parseInt(fr.slice(1), 10) }; }
function frameHz(fr) { const f = parseFrame(fr); const midi = 12 * (f.o + 1) + PC12[f.L]; return 440 * Math.pow(2, (midi - 69) / 12); }

/* Hagel 2005: 'triadic' just tuning of nīd qabli (e–g–b and d–f–a pure, linked by a pure titur qablītu d–b).
   Steps in cents from string i to i+1; string 3 (c) is a pure kitmu, a pure embūbu, or a compromise. */
const JI = r => 1200 * Math.log2(r);
const TEMPER = {
  pyth:   { name: 'Pythagorean (3:2 chain)', steps: null },
  hagelK: { name: 'Hagel 2005, pure kitmu (c = 4:3 above g)', steps: [JI(10/9), JI(9/8), JI(16/15), JI(10/9), JI(9/8), JI(10/9), JI(27/25), JI(10/9)] },
  hagelE: { name: 'Hagel 2005, pure embūbu (c = 3:2 above f; his MIDI files)', steps: [JI(10/9), JI(10/9), JI(27/25), JI(10/9), JI(9/8), JI(10/9), JI(27/25), JI(10/9)] },
  hagelM: { name: 'Hagel 2005, c between the two', steps: [JI(10/9), (JI(9/8) + JI(10/9)) / 2, (JI(16/15) + JI(27/25)) / 2, JI(10/9), JI(9/8), JI(10/9), JI(27/25), JI(10/9)] }
};
function centsOf(cfg, k) { // cents of strings 1..11 relative to string 1 in nīd qablim (10, 11 = virtual octaves of 3, 4)
  const sgn = cfg.dir === 'desc' ? -1 : 1;
  const T = TEMPER[cfg.temper || 'pyth'] || TEMPER.pyth;
  const base = [null, 0];
  for (let i = 1; i <= 8; i++) base[i + 1] = base[i] + sgn * (T.steps ? T.steps[i - 1] : (NQ_STEPS[i - 1] === 'T' ? C_T : C_S));
  const alt = alterations(k), tight = cfg.dir === 'desc' ? 1 : -1;
  const out = [null];
  for (let i = 1; i <= 9; i++) out[i] = base[i] + tight * alt[i] * C_A;
  out[10] = out[3] + sgn * 1200; out[11] = out[4] + sgn * 1200;
  return out;
}
function noteOf(cfg, k, i) {
  const sgn = cfg.dir === 'desc' ? -1 : 1, f = parseFrame(cfg.frame);
  const D1 = f.o * 7 + f.L, Di = D1 + sgn * (i - 1);
  const nat = D => Math.floor(D / 7) * 1200 + NAT[mod(D, 7)];
  const c = centsOf(Object.assign({}, cfg, { temper: 'pyth' }), k)[i];
  const acc = Math.round((c - (nat(Di) - nat(D1))) / C_A);
  return { L: mod(Di, 7), o: Math.floor(Di / 7), acc };
}
const ACC = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };
function helm(n) {
  const l = LETTERS[n.L], a = ACC[String(Math.max(-2, Math.min(2, n.acc)))] ?? (n.acc > 0 ? '♯×' + n.acc : '♭×' + (-n.acc));
  if (n.o >= 3) return l.toLowerCase() + a + ['', '′', '″', '‴', '⁗'][Math.min(4, n.o - 3)];
  if (n.o === 2) return l + a;
  return l + a + '₁';
}
function sci(n) { const a = n.acc > 0 ? '♯'.repeat(n.acc) : '♭'.repeat(-n.acc); return LETTERS[n.L] + a + n.o; }
function freqs(cfg, k, transpose) {
  const f1 = frameHz(cfg.frame) * Math.pow(2, (transpose || 0) / 12);
  return centsOf(cfg, k).map(c => c == null ? null : f1 * Math.pow(2, c / 1200));
}

const IVL = [
  [111.73, 'diatonic semitone', '16:15'], [133.24, 'large semitone', '27:25'], [182.40, 'minor tone', '10:9'],
  [315.64, 'pure minor third', '6:5'], [386.31, 'pure major third', '5:4'], [364.81, 'wide minor third', '100:81'],
  [519.55, 'wide fourth (wolf)', '27:20'], [680.45, 'narrow fifth (wolf)', '40:27'], [568.72, 'augmented fourth', '25:18'], [631.28, 'diminished fifth', '36:25'],
  [813.69, 'pure minor sixth', '8:5'], [884.36, 'pure major sixth', '5:3'], [835.19, 'wide minor sixth', '81:50'],
  [90.22, 'limma', '256:243'], [113.69, 'apotome', '2187:2048'], [203.91, 'tone', '9:8'],
  [294.13, 'minor third', '32:27'], [407.82, 'ditone (major third)', '81:64'],
  [498.04, 'perfect fourth', '4:3'], [588.27, 'diminished fifth', '1024:729'], [611.73, 'augmented fourth', '729:512'],
  [701.96, 'perfect fifth', '3:2'], [792.18, 'minor sixth', '128:81'], [905.87, 'major sixth', '27:16'],
  [996.09, 'minor seventh', '16:9'], [1109.78, 'major seventh', '243:128'], [1200, 'octave', '2:1']
];
function intervalOf(cfg, k, a, b) {
  const c = centsOf(cfg, k), d = Math.abs(c[a] - c[b]);
  let best = IVL[0], bd = 1e9;
  for (const v of IVL) { const e = Math.abs(v[0] - d); if (e < bd) { bd = e; best = v; } }
  const tritone = best[1] === 'augmented fourth' || best[1] === 'diminished fifth';
  const wolf = /wolf/.test(best[1]);
  if (bd < 3) return { cents: d, name: best[1], ratio: best[2], tritone, wolf };
  const G = ['unison', 'semitone', 'tone', 'minor third', 'major third', 'fourth', 'tritone', 'fifth', 'minor sixth', 'major sixth', 'minor seventh', 'major seventh', 'octave'];
  const g = G[Math.round(d / 100)] || 'interval', off = d - Math.round(d / 100) * 100;
  return { cents: d, name: g + ', tempered', ratio: '', tritone: g === 'tritone', wolf: false, tempered: true };
}
const GREEK = { 'TTSTTTS': 'Dorian', 'TSTTTST': 'Phrygian', 'STTTSTT': 'Lydian', 'TTTSTTS': 'Mixolydian', 'TTSTTST': 'Hypodorian', 'TSTTSTT': 'Hypophrygian', 'STTSTTT': 'Hypolydian' };
/* Greek species are conventionally read downward; under the ascending convention the same
   step sequence runs upward, so we reverse it before looking it up. */
function greekOf(cfg, k) {
  const p = stepPattern(k).join('');
  if (cfg.dir === 'desc') return GREEK[p];
  return GREEK[p.split('').reverse().join('')];
}

/* ---------- readings of the notation (tablet ll. 5–10) ---------- */
/* slot: [key, number, transliteration, uncertainty]
   key '@' = non-dichord word, '?' = illegible / unidentified
   number: integer, null (no numeral), or string with editorial marks */
const Q = 'qablitum', R = 'rebutum', SH = 'sherum', I = 'ishartum', TI = 'titurishartim', Z = 'zerdum', SS = 'shalshatum', E = 'embubum', N = 'nidqablim', TQ = 'titurqablitim', K = 'kitmum', IS = 'isqum';
const DL_LINES = [
  [[Q, 3, 'qáb-li-te'], [R, 1, 'ir-bu-te'], [Q, 3, 'qáb-li-te'], [SH, 1, 'ša-aḫ-ri'], [I, 10, 'i-šar-te'], ['@', null, 'uš-ta-ma-a-ri']],
  [[TI, 2, 'ti-ti-mi-šar-te'], [Z, 1, 'zi-ir-te'], [SH, 2, 'ša-[a]ḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [R, 2, 'ir-bu-te']],
  [[E, 1, 'um-bu-be'], [SS, 2, 'ša-aš-ša-te'], [R, '1[+x]', 'ir-bu-te', 'plusx'], [N, 1, 'na-ad-qáb-li'], [TQ, 1, 'ti-tar-qáb-li'], [TI, 4, 'ti-ti-mi-šar-te']],
  [[Z, 1, 'zi-ir-te'], [SH, 2, 'ša-aḫ-ri'], [SS, 4, 'ša-aš-ša-te', 'four5'], [R, 1, 'ir-bu-te'], [N, 1, 'na-ad-qáb-li'], [SH, 1, 'ša-aḫ-ri']],
  [[SS, 4, 'ša-aš-ša-te', 'four5'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [R, 2, 'ir-bu-te']],
  [[K, 2, 'ki-it-me'], [Q, 3, 'qáb-li-te'], [K, 1, 'ki-it-m[e]'], [Q, 4, 'qáb-li-te', 'four5'], [K, 1, 'ki-it-me'], [Q, 2, 'qáb-li-te', 'final']]
];
function variant(lines, edits) { // deep copy with edits {"line.slot": [k,n,tl,unc]} or partial {tl}
  const out = lines.map(l => l.map(s => s.slice()));
  for (const key in edits) { const [li, si] = key.split('.').map(Number); const e = edits[key]; if (Array.isArray(e)) out[li][si] = e; else Object.assign(out[li][si], e); }
  return out;
}
const READINGS = {
  DL: { name: 'Dietrich & Loretz 1975', short: 'D&L', year: 1975, note: 'Collated on the tablet; the base text used by Thiel, Černý, Krispijn and Gibson.', lines: DL_LINES },
  L: { name: 'Laroche 1968', short: 'Laroche', year: 1968, note: 'Ugaritica V, p. 463. Read before Güterbock identified the terms; the basis of the earliest transcriptions.', lines: [
    [[Q, 3, 'kab-li-te'], [R, 1, 'ir-bu-te'], [Q, '2?', 'kab-li-te'], ['?', null, 'X-X-X'], [TI, 10, '[ti]-ti-mi-šar-te'], ['@', null, 'uš-ta-ma-a-ri']],
    [[TI, 2, 'ti-ti-mi-šar-ta'], [Z, 1, 'zi-ir-te'], [SH, 2, 'ša-[a]ḫ-ri'], ['?', 2, 'X-X-te'], [R, 2, 'ir-bu-te']],
    [['?', 1, 'tup-pu-nu'], [SS, 2, 'ša-aš-ša-ta'], [R, 'x', 'irbute'], [SS, 'x', '[š]a-[aš-š]a-t[e]'], [TQ, 1, 'ti-tar-kab-li'], [TI, 4, 'ti-ti-mi-šar-te']],
    [[Z, 1, 'zi-it-te'], [SH, 2, 'ša-aḫ-ri'], [SS, 4, 'ša-aš-ša-t[e]'], [R, 1, 'ir-bu-te'], [N, 1, 'na-at-kab-li'], [SH, '[1]', 'ša-aḫ-ri']],
    [[SS, 4, 'ša-aš-ša-te'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-š[a-t]e'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [R, 2, 'ir-[b]u-[te]']],
    [[K, 2, 'ki-it-me'], [Q, 3, 'kab-li-te'], [K, 1, 'ki-it-[me]'], [Q, 4, 'kab-li-te'], [K, 1, 'ki-it-me'], [Q, '5?', 'kab-li-te', 'final']]
  ] },
  Ki: { name: 'Kilmer 1974', short: 'Kilmer', year: 1974, note: 'RA 68, Fig. 4. Reads ˹ša/ši?-ni?˺ (“repeat”) where D&L later read ša-aḫ-ri 1 i-šar-te.', lines: [
    [[Q, 3, 'qáb-li-te'], [R, 1, 'ir-bu-te'], [Q, '˹3˺', 'qáb-li-te'], ['@', null, '˹ša/ši?-ni?˺'], [TI, 10, 't[i-]ti-mi-šar-te'], ['@', null, 'uš-ta-˹ma-a-ri˺']],
    [[TI, 2, 'ti-ti-mi-šar-te'], [Z, 1, 'zi-ir-te'], [SH, 2, 'ša-[a]ḫ-ri'], [Z, 2, '˹zi˺-[ir-t]e'], [R, 2, 'ir-bu-te']],
    [[E, 1, 'um-bu-be'], [SS, 2, 'ša-aš-ša-te'], [R, '[1]', 'ir-bu-te'], [SS, '˹2˺', '[š]a-[aš-š]a-t[e]'], [TQ, 1, 'ti-tar-qáb-li'], [TI, 4, 'ti-ti-mi-šar-te']],
    [[Z, 1, 'zi-ir-te'], [SH, 2, 'ša-aḫ-ri'], [SS, 4, 'ša-aš-ša-t[e]'], [R, 1, 'ir-bu-te'], [N, 1, 'na-ad-qáb-li'], [SH, '[2]', 'ša-aḫ-ri']],
    [[SS, 4, 'ša-aš-ša-te'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-š[a-t]e'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [R, 2, 'ir-[b]u-[te]']],
    [[K, 2, 'ki-it-me'], [Q, 3, 'qáb-li-te'], [K, 1, 'ki-it-[me]'], [Q, 4, 'qáb-li-te'], [K, 1, 'ki-it-me'], [Q, '˹3˺', 'qáb-li-te', 'final']]
  ] },
  DG: { name: 'Duchesne-Guillemin 1975–84', short: 'D-G', year: 1984, note: 'Laroche 1968 with her emendation em-bu-be (for tup-pu-nu), her restorations [ešgi] (= isqum, strings 1·3) in l. 5 and [šaššate] in l. 6, and [1] for the two lost numerals of l. 7 (Fig. 9 of her 1984 booklet).', lines: [
    [[Q, 3, 'kab-li-te'], [R, 1, 'ir-bu-te'], [Q, '2?', 'kab-li-te'], [IS, null, '[eš-gi]'], [TI, 10, '[ti]-ti-mi-šar-te'], ['@', null, 'uš-ta-ma-a-ri']],
    [[TI, 2, 'ti-ti-mi-šar-te'], [Z, 1, 'zi-ir-te'], [SH, 2, 'ša-[a]ḫ-ri'], [SS, 2, '[ša-aš-ša-te]'], [R, 2, 'ir-bu-te']],
    [[E, 1, 'em-bu-be'], [SS, 2, 'ša-aš-ša-te'], [R, '[1]', 'ir-bu-te'], [SS, '[1]', '[š]a-[aš-š]a-t[e]'], [TQ, 1, 'ti-tar-kab-li'], [TI, 4, 'ti-ti-mi-šar-te']],
    [[Z, 1, 'zi-ir-te'], [SH, 2, 'ša-aḫ-ri'], [SS, 4, 'ša-aš-ša-t[e]'], [R, 1, 'ir-bu-te'], [N, 1, 'na-at-kab-li'], [SH, '[1]', 'ša-aḫ-ri']],
    [[SS, 4, 'ša-aš-ša-te'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-š[a-t]e'], [SH, 1, 'ša-aḫ-ri'], [SS, 2, 'ša-aš-ša-te'], [R, 2, 'ir-[b]u-[te]']],
    [[K, 2, 'ki-it-me'], [Q, 3, 'kab-li-te'], [K, 1, 'ki-it-[me]'], [Q, 4, 'kab-li-te'], [K, 1, 'ki-it-me'], [Q, '3/5', 'kab-li-te', 'final']]
  ] },
  Du: { name: 'Dumbrill 1998/2005 (Plate 5)', short: 'Dumbrill', year: 2005, note: 'The numerals of his own realisation (Plate 5 of the 2005 edition of his 1998 book). His Fig. 5 prints l. 7 šaššate 2 … titimišarte 2 and ends l. 10 kitme 4 qablite 4; the plate plays šaššate 1 … titimišarte 4 and stops at kitme 2. uštamari is a falling scale.', lines: [
    [[Q, 3, 'qablite'], [R, 1, 'irbute'], [Q, 3, 'qablite'], [SH, 1, 'šaḫri'], [TI, 10, 'titimišarte'], ['@u', '[10]', 'uštamari']],
    [[TI, 2, 'titimišarte'], [Z, 1, 'zirte'], [SH, 2, 'šaḫri'], [SS, 2, 'šaššate'], [R, 3, 'irbute'], [SS, 2, 'šaššate']],
    [[E, 1, 'embube'], [SS, 1, 'šaššate'], [R, 3, 'irbute'], [N, 1, 'nidqabli'], [TQ, 1, 'titar qabli'], [TI, 4, 'titimišarte']],
    [[Z, 1, 'zirte'], [SH, 2, 'šaḫri'], [SS, 4, 'šaššate'], [R, 1, 'irbute'], [N, 1, 'nidqabli'], [SH, 2, 'šaḫri']],
    [[SS, 2, 'šaššate'], [SH, 1, 'šaḫri'], [SS, 2, 'šaššate'], [SH, 1, 'šaḫri'], [SS, 2, 'šaššate'], [R, 4, 'irbute']],
    [[K, 2, 'kitme'], [Q, 3, 'qablite'], [K, 1, 'kitme'], [Q, 4, 'qablite'], [K, 2, 'kitme']]
  ] },
  Du14: { name: 'Dumbrill 2014', short: 'Dumbrill 2014', year: 2014, note: 'ARAM 26 (2014), “Author’s interpretation of H6”: every line 36 quavers. Line 5 ends titimišarte 3, uštamari only marks the end of the introduction; l. 10 has five terms.', lines: [
    [[Q, 3, 'qablite'], [R, 1, 'irbute'], [Q, 3, 'kablite'], [SH, 1, 'šaḫri'], [TI, 3, 'titimišarte'], ['@', null, 'uštamari']],
    [[TI, 2, 'titimišarte'], [Z, 1, 'zirte'], [SH, 2, 'šaḫri'], [SS, 2, 'šaššate'], [R, 3, 'irbute'], [SS, 2, 'šaššate']],
    [[E, 1, 'umbube'], [SS, 1, 'šaššate'], [R, 2, 'irbute'], [N, 1, 'nadqabli'], [TQ, 1, 'titar qabli'], [TI, 4, 'titimišarte']],
    [[Z, 1, 'zirte'], [SH, 2, 'šaḫri'], [SS, 4, 'šaššate'], [R, 1, 'irbute'], [N, 1, 'nadqabli'], [SH, 2, 'šaḫri']],
    [[SS, 2, 'šaššate'], [SH, 1, 'šaḫri'], [SS, 2, 'šaššate'], [SH, 1, 'šaḫri'], [SS, 2, 'šaššate'], [R, 4, 'irbute']],
    [[K, 2, 'kitme'], [Q, 1, 'qablite'], [K, 2, 'kitme'], [Q, 2, 'qablite'], [K, 1, 'kitme']]
  ] },
  T: { name: 'Thiel 1977', short: 'Thiel', year: 1977, note: 'Follows D&L; divides uš-ta-ma a-ri.', lines: variant(DL_LINES, { '0.5': { 2: 'uš-ta-ma a-ri' } }) },
  Kr: { name: 'Krispijn 2002', short: 'Krispijn', year: 2002, note: 'Follows D&L with Hurrian -e/-le endings.', lines: variant(DL_LINES, {
    '0.0': { 2: 'kab-li-te' }, '0.2': { 2: 'kab-li-te' }, '0.3': { 2: 'ša-aḫ-re' }, '0.5': { 2: 'uš-ta-ma-a-re' },
    '1.2': { 2: 'ša-[a]ḫ-re' }, '2.2': { 1: '1+[x]' }, '2.3': { 2: 'na-ad-kab-le' }, '2.4': { 2: 'ti-tar-kab-le' },
    '3.1': { 2: 'ša-aḫ-re' }, '3.4': { 2: 'na-ad-kab-le' }, '3.5': { 2: 'ša-aḫ-re' },
    '4.1': { 2: 'ša-aḫ-re' }, '4.3': { 2: 'ša-aḫ-re' },
    '5.1': { 2: 'kab-li-te' }, '5.3': { 2: 'kab-li-te' }, '5.5': { 2: 'kab-li-te' } }) },
  Gi: { name: 'Gibson 2026', short: 'Gibson', year: 2026, note: 'D&L, rechecked on photographs: 4 may be 5 in ll. 8–10; l. 7 irbute 1[+x]; the last numeral is damaged.', lines: DL_LINES }
};
READINGS.Wu = { name: 'Wulstan 1971 (on Laroche)', short: 'Wulstan', year: 1971, note: 'Laroche 1968 as Wulstan transcribes it: he supplies [šaššate] for “X-X-te” in l. 6 and gives a note to tup-pu-nu in l. 7. The unread term in l. 5 gets no note.', lines: variant(READINGS.L.lines, { '1.3': [SS, 2, '[ša-aš-ša-te]'] }) };
{ const order = ['DL', 'L', 'Wu', 'Ki', 'DG', 'Du', 'Du14', 'T', 'Kr', 'Gi']; const copy = Object.assign({}, READINGS); for (const k of Object.keys(READINGS)) delete READINGS[k]; for (const k of order) READINGS[k] = copy[k]; }
const LINE_NUMS = [5, 6, 7, 8, 9, 10];

function parseNum(raw) { // → {v, d, alt}
  if (raw === null || raw === undefined) return { v: null, d: '—' };
  if (typeof raw === 'number') return { v: raw, d: String(raw) };
  if (raw === 'x') return { v: null, d: 'x' };
  if (raw.includes('/')) { const [a, b] = raw.split('/').map(Number); return { v: a, d: a + ' or ' + b, alt: b }; }
  const m = raw.match(/\d+/); return { v: m ? Number(m[0]) : null, d: raw };
}
function resolveNum(slot, cfg) {
  const p = parseNum(slot[1]); const unc = slot[3];
  let v = p.v, changed = false;
  if (unc === 'plusx' && cfg.plusx === 2) { v = 2; changed = true; }
  if (unc === 'four5' && cfg.four5 === 5) { v = 5; changed = true; }
  if (unc === 'final' && cfg.final && cfg.final !== 'r') { v = Number(cfg.final); changed = v !== p.v; }
  return { v, d: p.d, changed, unc, edUnc: /[?\[x]|or/.test(p.d) };
}

/* ---------- scholar presets ---------- */
const PRESETS = {
  wulstan:  { name: 'Wulstan', year: '1971', cfg: { reading: 'Wu', dir: 'asc', frame: 'C4', mode: 'run', path: 'wulstan', num: 'select', use89: true, tenRest: true, unit: 0.5, pub: 'wulstan' },
              blurb: 'First staff transcription, in quavers, on Laroche’s text. A primary pair rises through its fifth from the lower note, a secondary falls through its third from the upper note, folding onto strings 8–9; the numeral says how many notes to take, running on past the pair if needed (titimišarte 4 = g′ f′ e′ d′). The 10 is left as a query. He restores [šaššate] in l. 6 and gives tup-pu-nu a note (e″). His print labels l. 9 šaḫri “2” over a single note.' },
  kilmer:   { name: 'Kilmer', year: '1974', cfg: { reading: 'Ki', dir: 'asc', frame: 'C4', mode: 'dyad', num: 'repeat', use89: false, unit: 1, pub: 'kilmer' },
              blurb: 'Dyads, one per syllable, on a scale rising from string 1, the numeral counting repetitions. The lines are not sung in tablet order: l. 5 is a refrain carrying the seven repeated syllables (its titimišarte 10 is a closing phrase of 5 + 5 for “wewa ḫanuku”), ll. 6–8 carry lyric lines 1 and 4, ll. 9–10 carry lines 2 and 3 (Figs 7–8).' },
  dg:       { name: 'Duchesne-Guillemin', year: '1975–84', cfg: { reading: 'DG', dir: 'asc', frame: 'C4', mode: 'run', path: 'direct', num: 'embellish', use89: false, unit: 1, embDur: 0.5, ustRest: 3 },
              blurb: 'Runs from the first string to the second; the numeral adds that many ornament notes rocking on the end of the run (kablite 3: g′ f′ e′ d′ + e′ d′ e′), so the 10 after titimišarte becomes a trill. She restores [ešgi] in l. 5, [šaššate] in l. 6 and [1] twice in l. 7 (Fig. 9). Rhythm simplified: run notes as crotchets, ornaments as quavers, as mostly in her Fig. 11.' },
  vitale:   { name: 'Vitale', year: '1982', cfg: { reading: 'DL', dir: 'desc', frame: 'E5', mode: 'run', path: 'direct', num: 'bars', vitale: true, use89: false, unit: 1, pub: 'vitale' },
              blurb: 'First descending scale, on the D&L text (he reads IŠARTU 10). Each numeral counts bars over which the run is spread, in 2/4 for the instrumental l. 5 (until half-way through išartu 10, where the voice enters) and l. 10, in 3/4 where three syllables go to a bar. Played from his Tableau XIV.' },
  cerny:    { name: 'Černý', year: '1987/2004', cfg: { reading: 'DL', dir: 'asc', frame: 'C4', mode: 'dyad', num: 'repeat', double: true, use89: true, unit: 1 },
              blurb: 'Dyads repeated, on the D&L text; fourths and fifths that touch strings 1 or 2 are doubled at the octave on 8 or 9.' },
  west:     { name: 'West', year: '1994', cfg: { reading: 'DL', dir: 'desc', frame: 'E5', mode: 'second', num: 'repeat', use89: true, unit: 1 },
              blurb: 'Descending scale; the numeral counts repetitions of the second string of each pair, which carries the melody (70% of successive second strings move by step). Strings 1 and 2 sound with 8 and 9, the low notes taken as the vocal line. No rhythm: “there is no point in trying to make a performing version”.' },
  koitabashi: { name: 'Koitabashi', year: '1996/1998', cfg: { reading: 'DL', dir: 'asc', frame: 'C4', mode: 'run', path: 'direct', num: 'repeat', use89: false, unit: 0.5 },
              blurb: 'Not a rendition: Koitabashi gives none (1996: 19–20; 1998: 378–79). After the Hebrew accents (teʿamim), each term names a melodic formula that starts on its first string and ends on its second, and the numeral counts how often the formula is repeated; he adds that one formula may go to each word. He does not say what lies between the first and last notes, so the page fills the formula by step (qablite 5–2 = g′ f′ e′ d′). Ascending scale, since he follows Kilmer, Crocker and Brown in taking nīd qabli for Lydian; the durations are the page’s.' },
  dumbrill: { name: 'Dumbrill', year: '1998/2005', cfg: { reading: 'Du', dir: 'desc', frame: 'E5', mode: 'run', path: 'dumbrill', num: 'hold', use89: true, unit: 0.5, pub: 'dumbrill' },
              blurb: 'Descending “enneatonic” e″–d′. Primaries are falling five-note runs from the first string (qablite = a′ g′ f′ e′ d′; kitme reaches a c′ below the lyre), secondaries rising three-note runs; run notes are quavers, and the numeral holds the last note for two quavers per unit. uštamari is a falling scale from d″. Played from Plate 5 of the 2005 edition (the book first appeared in 1998), which differs from his own Fig. 5 in ll. 7 and 10.' },
  dumbrill14: { name: 'Dumbrill', year: '2014', cfg: { reading: 'Du14', dir: 'desc', frame: 'E5', mode: 'run', path: 'dumbrill', num: 'hold', use89: true, unit: 0.5, pub: 'dumbrill14' },
              blurb: 'ARAM 26 (2014). The same rules, but every line now comes to 36 quavers: l. 5 ends titimišarte 3 and uštamari is no longer played, l. 7 and l. 10 are re-read. The printed version is diatonic; the maqām colouring (bayātī, ḥijāz) came from the musicians at his 2011 Damascus presentation and 2012 recording, and is not in the score.' },
  monzo:    { name: 'Monzo', year: '2000', cfg: { reading: 'DL', dir: 'asc', frame: 'G2', mode: 'dyad', num: 'hold', use89: false, unit: 1 },
              blurb: 'Unpublished web reading. Dyads in bass clef (kablite = A + d), each held for the numeral’s number of crotchets.' },
  krispijn: { name: 'Krispijn', year: '2002', cfg: { reading: 'Kr', dir: 'desc', frame: 'E5', mode: 'dyad', num: 'repeat', use89: false, unit: 1 },
              blurb: 'Dyads repeated on a descending scale, with Kümmel’s uštamari = “not sung”. He tentatively takes the sung note to be the upper note of each dyad (Hagel 2005, n. 14). Gibson describes his frame as a descending A-Dorian; transpose to taste.' },
  hagel:    { name: 'Hagel', year: '1998/2006', cfg: { reading: 'DL', dir: 'desc', frame: 'E5', mode: 'dyad', num: 'hold', use89: true, double: 'all', temper: 'hagelE', tenAs: 7, finalHold: 6, qual: 'none', skipUnread: true, lineGap: 8, unit: 0.5 },
              blurb: 'Hagel’s own realisation: the MIDI files on his site Music of the Ancient Near East (ÖAW), each marked “Copyright Stefan Hagel 1998” on a page dated 2006, which he says are “by no means intended to represent a reconstruction” but “can, perhaps, give an idea of the ‘harmonic’ progression”. For h.6 he uses the D&L text: each pair sounds as a dyad on a descending scale, strings 1 and 2 always doubled an octave below by 8 and 9, the numeral a duration. The sign read 10 is held for seven units (also on h.8), uštamari is silent, and the last qablite is held for six. The engine’s version matches his h.6 file dyad for dyad; for the fragments he follows Laroche’s text (Appendix B). The 2005 article supplies the theory rather than a second version: a just tuning on two pure triads, of which the files use the variant with c a pure fifth above f (the others are under Fine tuning); repetition or duration for the numerals, with 10 a reciting note or a fermata, the distribution counting against duration; and ašḫuwe as f raised to f♯, which the files do not use (an option in Appendix B).' },
  gibson:   { name: 'Gibson', year: '2026', cfg: { reading: 'Gi', dir: 'desc', frame: 'E5', mode: 'tab', num: 'none', use89: false, unit: 1 },
              blurb: 'Tablature only: string numbers joined by ±, together or in turn; numerals left uninterpreted. Playback auditions each pair three ways (a, b, a + b).' }
};
const PRESET_ORDER = ['wulstan', 'kilmer', 'dg', 'vitale', 'cerny', 'west', 'koitabashi', 'hagel', 'dumbrill', 'monzo', 'krispijn', 'dumbrill14', 'gibson'];
const DEFAULT_CFG = { reading: 'DL', dir: 'desc', frame: 'E5', mode: 'dyad', path: 'direct', num: 'repeat', use89: false, double: false, tenAs: 0, finalHold: 0, skipUnread: false, lineGap: 0, tenRest: false, vitale: false, unit: 1, plusx: 1, four5: 4, final: 'r', temper: 'pyth', qual: 'octave', singles: false, pub: null, embDur: 0, ustRest: 0 };

/* ---------- realization ---------- */
function DICHclsOf(a, b) { const d = Math.min(Math.abs(a - b), 7 - Math.abs(a - b)); return d === 3 ? 'p' : d === 2 ? 's' : 'n'; }
const seg = (x, y) => { const r = [], st = x < y ? 1 : -1; for (let i = x; i !== y + st; i += st) r.push(i); return r; };
function runPath(a, b, cls, cfg) {
  const dirSign = cfg.dir === 'desc' ? -1 : 1; // pitch movement for +1 string index
  const pd = (x, y) => Math.sign((y - x) * dirSign);
  if (cfg.path === 'dumbrill') { // primaries: five strings from the first, falling; secondaries: the three-string span, rising
    if (cls === 'p') return dirSign < 0 ? seg(a, a + 4) : seg(a, a - 4 > 0 ? a - 4 : a + 4);
    let [x, y] = [a, b]; if (Math.abs(x - y) > 2) { if (x <= 2) x += 7; else y += 7; }
    const lo = Math.min(x, y), hi = Math.max(x, y);
    return dirSign < 0 ? seg(hi, lo) : seg(lo, hi);
  }
  if (cfg.path === 'wulstan') { // Wulstan 1971: primaries rise through the fifth from its lower note, secondaries fall through the third from its upper note
    const span = cls === 'p' ? 4 : 2; let lo = Math.min(a, b), hi = Math.max(a, b);
    if (hi - lo !== span) { lo = hi; hi = Math.min(a, b) + 7; }
    const up = dirSign > 0 ? seg(lo, hi) : seg(hi, lo);
    return cls === 'p' ? up : up.slice().reverse();
  }
  const cands = [[a, b]];
  if (cfg.use89) { if (b <= 2) cands.push([a, b + 7]); if (a <= 2) cands.push([a + 7, b]); }
  let pick = [a, b];
  if (cfg.path === 'down') { const c = cands.find(([x, y]) => pd(x, y) === -1); if (c) pick = c; }
  return seg(pick[0], pick[1]);
}
function upperOf(a, b, cfg) { return cfg.dir === 'desc' ? Math.min(a, b) : Math.max(a, b); }

const SINGLE = { 'ḫa-ap-še-ma': 5, 'ḫapšema': 5, 'e-ta-ma-še-a-ni': 4, 'etamašeani': 4 };
function unitsOf(lines, cfg, lineNums) {
  const out = [];
  lines.forEach((line, li) => line.forEach((s, si) => {
    out.push({ idx: out.length, li, si, line: lineNums ? lineNums[li] : li + 1, k: s[0], tl: s[2], raw: s[1], unc: s[3], qual: s[4], num: resolveNum(s, cfg) });
  }));
  return out;
}
function units(cfg) { return unitsOf(READINGS[cfg.reading].lines, cfg, LINE_NUMS); }

/* realize a list of lines; opt.h6 enables Vitale's h.6-specific frame */
function realizeLines(cfgIn, lines, opt = {}) {
  const cfg = Object.assign({}, DEFAULT_CFG, cfgIn);
  const us = unitsOf(lines, cfg, opt.lineNums), ev = [], marks = [];
  let t = 0;
  const U = cfg.unit || 1;
  const push = (d, s, kind, u, extra) => { ev.push(Object.assign({ t, d, s, kind, u }, extra || {})); t += d; };
  let prevLi = null, sounded = false;
  for (const u of us) {
    if (!opt.h6 && cfg.lineGap && prevLi != null && u.li !== prevLi && sounded) { const k = opt.lineNums ? Math.max(1, opt.lineNums[u.li] - opt.lineNums[prevLi]) : 1; push(cfg.lineGap * U * k, [], 'rest', u.idx); }
    prevLi = u.li;
    u.start = t;
    const qx = u.qual && cfg.qual === 'octave' ? { oct: u.qual === 'up' ? 1 : -1 } : u.qual === 'up' && cfg.qual === 'hagel' ? { sharp7: true } : null;
    if (u.k === '@u' && cfg.path === 'dumbrill' && cfg.mode === 'run') { // Dumbrill: uštamari as a falling scale from d″
      const n = u.num.v || 1, p = seg(2, 9);
      p.forEach((s, i) => push(i === p.length - 1 ? n : U, [s], 'note', u.idx));
      u.end = t; continue;
    }
    if (u.k === '|') { marks.push({ t, label: '…', kind: 'gap' }); if (!cfg.lineGap) push(1, [], 'rest', u.idx); else if (u.tl !== 'gap-lines' && sounded) push(cfg.lineGap * U, [], 'rest', u.idx); u.end = t; continue; }
    if ((u.k === '@' || u.k === '@u') && cfg.ustRest && /u[šs]-?ta/.test(u.tl)) { marks.push({ t, label: '[uštamari]', kind: 'word' }); push(cfg.ustRest, [], 'rest', u.idx); u.end = t; continue; }
    if (u.k === '@' || u.k === '@u') {
      const single = cfg.singles && SINGLE[u.tl.replace(/[\[\]˹˺?]/g, '')];
      if (single && cfg.mode !== 'tab') { const n = u.num.v || 1; for (let r = 0; r < (cfg.num === 'repeat' ? n : 1); r++) push(cfg.num === 'hold' ? n * U : U, [single], 'note', u.idx); u.end = t; continue; }
      marks.push({ t, label: u.tl, kind: 'word' }); u.end = t; continue;
    }
    if (u.k === '?') { if (!cfg.skipUnread) push(1, [], 'rest', u.idx); u.end = t; continue; }
    sounded = true;
    const D = DICH[u.k], [a, b] = D.pair;
    const n = u.num.v == null ? 1 : (u.num.v === 10 && cfg.tenAs ? cfg.tenAs : u.num.v);
    if (cfg.mode === 'tab') {
      push(1, [a], 'aud', u.idx, qx); push(1, [b], 'aud', u.idx, qx); push(1, [a, b], 'aud', u.idx, qx);
    } else if (cfg.mode === 'dyad') {
      const ch = [a, b];
      if (cfg.double && cfg.use89 && (cfg.double === 'all' || D.cls === 'p')) for (const s of [a, b]) if (s <= 2) ch.push(s + 7);
      if (cfg.num === 'hold') push(n * U, ch, 'dyad', u.idx, qx);
      else if (cfg.num === 'repeat') for (let r = 0; r < n; r++) push(U, ch, 'dyad', u.idx, qx);
      else push(U, ch, 'dyad', u.idx, qx);
    } else if (cfg.mode === 'upper' || cfg.mode === 'second') {
      const mel = cfg.mode === 'upper' ? upperOf(a, b, cfg) : (cfg.qual === 'west' && u.qual === 'down' ? a : b); // West: “lower” moves the tune to the first string
      const low = (cfg.use89 && mel <= 2) ? mel + 7 : null; // West: 1, 2 sound with 8, 9; the low note carries the voice
      const reps = cfg.num === 'repeat' ? n : 1, dur = cfg.num === 'hold' ? n * U : U;
      for (let r = 0; r < reps; r++) {
        if (low && cfg.mode === 'second') { ev.push(Object.assign({ t, d: dur, s: [mel], kind: 'drone', u: u.idx }, qx || {})); push(dur, [low], 'note', u.idx, qx); }
        else { if (low && cfg.dir === 'desc') ev.push(Object.assign({ t, d: dur, s: [low], kind: 'drone', u: u.idx }, qx || {})); push(dur, [mel], 'note', u.idx, qx); }
      }
    } else { // run
      const path = runPath(a, b, D.cls, cfg);
      if (cfg.num === 'select') {
        if (cfg.tenRest && n >= 10) { for (const s of path) push(U, [s], 'note', u.idx, qx); push(2, [], 'rest', u.idx); }
        else { const p = path.slice(); const st = p.length > 1 ? Math.sign(p[p.length - 1] - p[p.length - 2]) : 1; while (p.length < n) p.push(p[p.length - 1] + st); for (const s of p.slice(0, Math.max(1, n))) push(U, [s], 'note', u.idx, qx); }
      } else if (cfg.num === 'embellish') {
        for (const s of path) push(U, [s], 'note', u.idx, qx);
        const L = path.length, nEmb = u.num.v == null ? 0 : n;
        for (let e = 0; e < nEmb; e++) push(cfg.embDur || U, [path[e % 2 === 0 ? L - 2 : L - 1]], 'emb', u.idx, qx);
      } else if (cfg.num === 'hold') {
        path.forEach((s, i) => push(i === path.length - 1 ? (u.num.v == null ? U : n) : U, [s], 'note', u.idx, qx));
      } else if (cfg.num === 'bars') {
        const sung = !opt.h6 || !(u.li === 5 || (u.li === 0 && u.si < 4));
        const bars = (dur, meter) => { const each = dur * meter / path.length; for (const s of path) push(each, [s], 'note', u.idx, qx); };
        if (opt.h6 && cfg.vitale && u.li === 0 && n === 10) { bars(5, 2); marks.push({ t, label: 'voice enters', kind: 'voice' }); bars(5, 3); }
        else bars(n, cfg.vitale && opt.h6 ? (sung ? 3 : 2) : 3);
      } else if (cfg.num === 'repeat') {
        for (let r = 0; r < n; r++) for (const s of path) push(U, [s], 'note', u.idx, qx);
      } else for (const s of path) push(U, [s], 'note', u.idx, qx);
    }
    u.end = t;
  }
  if (cfg.lineGap) while (ev.length && ev[ev.length - 1].kind === 'rest') { const e = ev.pop(); t -= e.d; }
  if (opt.h6 && cfg.finalHold) { const e = ev[ev.length - 1], lu = us[us.length - 1]; if (e && e.kind !== 'rest') { const add = cfg.finalHold * U - e.d; if (add > 0) { e.d += add; t += add; if (lu) lu.end = t; } } }
  const lineSpans = lines.map((_, li) => { const uu = us.filter(x => x.li === li); return { line: opt.lineNums ? opt.lineNums[li] : li + 1, start: uu.length ? uu[0].start : t, end: uu.length ? uu[uu.length - 1].end : t }; });
  const onsets = new Set(ev.filter(e => e.kind !== 'rest' && e.kind !== 'drone').map(e => e.t.toFixed(4))).size;
  const notes = ev.filter(e => e.kind !== 'rest').reduce((a, e) => a + e.s.length, 0);
  const maxS = ev.reduce((m, e) => Math.max(m, ...e.s, 0), 0);
  return { cfg, units: us, events: ev, marks, total: t, lineSpans, onsets, notes, uses89: maxS > 7, maxS };
}

/* ---------- published transcriptions, note for note ---------- */
/* token: pitch[+pitch]:beats (crotchet = 1), r:beats = rest, !label = mark. One string per slot of the preset's reading. */
const PUB = {
  wulstan: { src: 'Wulstan 1971, transcription of h.6 (quavers; Laroche’s text)', lines: [
    ['g4:.5 a4:.5 b4:.5', 'd5:.5', 'g4:.5 a4:.5', '', 'g4:.5 f4:.5 e4:.5 !10_? r:2', ''],
    ['g4:.5 f4:.5', 'a4:.5', 'b4:.5 a4:.5', 'c5:.5 b4:.5', 'd5:.5 c5:.5'],
    ['e5:.5', 'c5:.5 b4:.5', 'd5:.5', 'c5:.5', 'f4:.5', 'g4:.5 f4:.5 e4:.5 d4:.5'],
    ['a4:.5', 'b4:.5 a4:.5', 'c5:.5 b4:.5 a4:.5 g4:.5', 'd5:.5', 'f4:.5', 'b4:.5'],
    ['c5:.5 b4:.5 a4:.5 g4:.5', 'b4:.5', 'c5:.5 b4:.5', 'b4:.5', 'c5:.5 b4:.5', 'd5:.5 c5:.5'],
    ['a4:.5 b4:.5', 'g4:.5 a4:.5 b4:.5', 'a4:.5', 'g4:.5 a4:.5 b4:.5 c5:.5', 'a4:.5', 'g4:.5 a4:.5 b4:.5 c5:.5 d5:.5']
  ] },
  vitale: { src: 'Vitale 1982, Tableau XIV (bars of 2/4 in ll. 5 and 10, 3/4 elsewhere)', lines: [
    ['a4:2 b4:1 c5:1 d5:2', 'd5:1/3 c5:1/3 b4:1/3 a4:1/3 g4:1/3 f4:1/3', 'a4:2 b4:1 c5:1 d5:2', 'f4:1 g4:.5 a4:.5', 'd5:2 d5:2 c5:2 c5:2 b4:2 !voice_enters b4:3 a4:3 a4:3 g4:3 g4:3', ''],
    ['c5:2 b4:1 a4:3', 'b4:1 a4:1 g4:1', 'f4:2 g4:1 a4:3', 'e5:1 d5:1 c5:1 b4:1 a4:1 g4:1', 'd5:1 c5:1 b4:1 a4:1 g4:1 f4:1'],
    ['c5:1 b4:.5 a4:.5 g4:.5 f4:.5', 'e5:1 d5:1 c5:1 b4:1 a4:1 g4:1', 'd5:.5 c5:.5 b4:.5 a4:.5 g4:.5 f4:.5', 'b4:1 c5:.5 d5:.5 e5:1', 'd5:1 c5:1 b4:1', 'c5:3 c5:3 b4:3 a4:3'],
    ['b4:1 a4:1 g4:1', 'f4:2 g4:1 a4:3', 'e5:2 d5:1 c5:3 b4:2 a4:1 g4:3', 'd5:.5 c5:.5 b4:.5 a4:.5 g4:.5 f4:.5', 'b4:1 c5:.5 d5:.5 e5:1', 'f4:1 g4:1 a4:1'],
    ['e5:2 d5:1 c5:3 b4:2 a4:1 g4:3', 'f4:1 g4:1 a4:1', 'e5:1 d5:1 c5:1 b4:1 a4:1 g4:1', 'f4:1 g4:1 a4:1', 'e5:1 d5:1 c5:1 b4:1 a4:1 g4:1', 'd5:1 c5:1 b4:1 a4:1 g4:1 f4:1'],
    ['g4:1 a4:1 b4:1 c5:1', 'a4:2 b4:1 c5:1 d5:2', 'g4:.5 a4:.5 b4:.5 c5:.5', 'a4:2 b4:2 c5:2 d5:2', 'g4:.5 a4:.5 b4:.5 c5:.5', 'a4:1 b4:1 c5:1 d5:1']
  ] },
  dumbrill: { src: 'Dumbrill 2005, Plate 5 (second edition of his 1998 book)', lines: [
    ['a4:.5 g4:.5 f4:.5 e4:.5 d4:3', 'd4:.5 e4:.5 f4:1', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:3', 'f4:.5 g4:.5 a4:1', 'a4:.5 b4:.5 c5:10', 'd5:.5 c5:.5 b4:.5 a4:.5 g4:.5 f4:.5 e4:.5 d4:.5 r:.5'],
    ['a4:.5 b4:.5 c5:2', 'g4:.5 a4:.5 b4:1', 'f4:.5 g4:.5 a4:2', 'e4:.5 f4:.5 g4:2', 'd4:.5 e4:.5 f4:3', 'e4:.5 f4:.5 g4:2'],
    ['c5:.5 b4:.5 a4:.5 g4:.5 f4:1', 'e4:.5 f4:.5 g4:1', 'd4:.5 e4:.5 f4:3', 'b4:.5 a4:.5 g4:.5 f4:.5 e4:1', 'b4:.5 c5:.5 d5:1', 'a4:.5 b4:.5 c5:4'],
    ['g4:.5 a4:.5 b4:1', 'f4:.5 g4:.5 a4:2', 'e4:.5 f4:.5 g4:4', 'd4:.5 e4:.5 f4:1', 'b4:.5 a4:.5 g4:.5 f4:.5 e4:1', 'f4:.5 g4:.5 a4:2'],
    ['e4:.5 f4:.5 g4:2', 'f4:.5 g4:.5 a4:1', 'e4:.5 f4:.5 g4:2', 'f4:.5 g4:.5 a4:1', 'e4:.5 f4:.5 g4:2', 'd4:.5 e4:.5 f4:4'],
    ['g4:.5 f4:.5 e4:.5 d4:.5 c4:2', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:3', 'g4:.5 f4:.5 e4:.5 d4:.5 c4:1', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:4', 'g4:.5 f4:.5 e4:.5 d4:.5 c4:2']
  ] },
  dumbrill14: { src: 'Dumbrill 2014, “Author’s interpretation of H6” (36/8 per line)', lines: [
    ['a4:.5 g4:.5 f4:.5 e4:.5 d4:3', 'd4:.5 e4:.5 f4:1', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:3', 'f4:.5 g4:.5 a4:1', 'a4:.5 b4:.5 c5:3', ''],
    ['a4:.5 b4:.5 c5:2', 'g4:.5 a4:.5 b4:1', 'f4:.5 g4:.5 a4:2', 'e4:.5 f4:.5 g4:2', 'd4:.5 e4:.5 f4:3', 'e4:.5 f4:.5 g4:2'],
    ['c5:.5 b4:.5 a4:.5 g4:.5 f4:1', 'e4:.5 f4:.5 g4:1', 'd4:.5 e4:.5 f4:2', 'b4:.5 a4:.5 g4:.5 f4:.5 e4:1', 'b4:.5 c5:.5 d5:1', 'a4:.5 b4:.5 c5:4'],
    ['g4:.5 a4:.5 b4:1', 'f4:.5 g4:.5 a4:2', 'e4:.5 f4:.5 g4:4', 'd4:.5 e4:.5 f4:1', 'b4:.5 a4:.5 g4:.5 f4:.5 e4:1', 'f4:.5 g4:.5 a4:2'],
    ['e4:.5 f4:.5 g4:2', 'f4:.5 g4:.5 a4:1', 'e4:.5 f4:.5 g4:2', 'f4:.5 g4:.5 a4:1', 'e4:.5 f4:.5 g4:2', 'd4:.5 e4:.5 f4:4'],
    ['g4:.5 f4:.5 e4:.5 d4:.5 c4:2', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:1', 'g4:.5 f4:.5 e4:.5 d4:.5 c4:2', 'a4:.5 g4:.5 f4:.5 e4:.5 d4:2', 'g4:.5 f4:.5 e4:.5 d4:.5 c4:1']
  ] },
  /* Kilmer 1974, Figs 7–8: one dyad per syllable, the notation lines re-ordered under the four lyric lines */
  kilmer: { src: 'Kilmer 1974, Figs 7–8 (dyads, one per syllable)', order: [
    { li: 1, lab: 'lyr. 1 · [x]-ḫa-nu-ta ni-ya-ša zi-we' }, { li: 2, lab: 'lyr. 1 · ši-nu-te zu-tu-ri-ya u-bu-ga-ra' }, { li: 3, lab: 'lyr. 1 · ḫu-bur-ni ta-šal kil-la zi-li šip-ri' }, { li: 0, slots: [0, 1, 2], lab: 'refrain · ḪU-MA-RU-ḪAT U-WA-RI' },
    { li: 0, slots: [0, 1, 2], lab: 'refrain · ḪU-MA-RU-ḪAT U-WA-RI' }, { li: 4, lab: 'lyr. 2 · wan-da-ni-ta u-ku-ri kur-kur-ta (i)šal-la' }, { li: 5, lab: 'lyr. 2 · u-la-li kab-gi al-lib-gi ši-rit mur-nu-šu' }, { li: 0, slots: [0, 1, 2], lab: 'refrain · WE-ŠAL TA-TIB TI-ŠI-YA' },
    { li: 0, slots: [0, 1, 2], lab: 'refrain · WE-ŠAL TA-TIB TI-ŠI-YA' }, { li: 4, lab: 'lyr. 3 · u-nu-ga kab-ši-li u-nu-gat ak-li' }, { li: 5, lab: 'lyr. 3 · šam-šam me-lil uk-lal tu-nu-ni-ta-ka ḫa-nu-ka' }, { li: 0, slots: [0, 1, 2], lab: 'refrain · KA-LI-TA-NIL NI-KA-LA' },
    { li: 0, slots: [0, 1, 2], lab: 'refrain · KA-LI-TA-NIL NI-KA-LA' }, { li: 1, lab: 'lyr. 4 · niḫ(u)-ra-šal ḫa-na ḫa-nu-te-ti' }, { li: 2, lab: 'lyr. 4 · att-(a)yaš-tal at-ta-ri ḫwe-ti ḫa-nu-ka' }, { li: 3, lab: 'lyr. 4 · x x x x x x x x x ša-ti' },
    { li: 0, slots: [4], count: 5, lab: 'closing · WE-WA-ḪA-NU-KU' }, { li: 0, slots: [4], count: 5, lab: 'closing · WE-WA-ḪA-NU-KU' }
  ] }
};
function pitchD(p) { const m = /^([a-g])(\d)$/.exec(p); return m ? Number(m[2]) * 7 + 'cdefgab'.indexOf(m[1]) : null; }
function stringOfPitch(cfg, p) { const f = parseFrame(cfg.frame), D1 = f.o * 7 + f.L, D = pitchD(p); return cfg.dir === 'desc' ? 1 + (D1 - D) : 1 + (D - D1); }
function realizePub(cfg, pub) {
  const us = unitsOf(READINGS[cfg.reading].lines, cfg, LINE_NUMS), ev = [], marks = [], segs = [];
  let t = 0;
  const at = (li, si) => us.find(u => u.li === li && u.si === si);
  const term = (u, str) => {
    for (const tok of String(str || '').trim().split(/\s+/).filter(Boolean)) {
      if (tok[0] === '!') { marks.push({ t, label: tok.slice(1).replace(/_/g, ' '), kind: 'voice' }); continue; }
      const [ps, ds] = tok.split(':'), d = ds.includes('/') ? ds.split('/').reduce((a, b) => a / b) : Number(ds);
      if (ps === 'r') ev.push({ t, d, s: [], kind: 'rest', u: u.idx });
      else { const ss = ps.split('+').map(p => stringOfPitch(cfg, p)); ev.push({ t, d, s: ss, kind: ss.length > 1 ? 'dyad' : 'note', u: u.idx }); }
      t += d;
    }
  };
  if (pub.lines) pub.lines.forEach((line, li) => { const s0 = t; line.forEach((str, si) => { const u = at(li, si); if (u) term(u, str); }); segs.push({ li, label: 'l. ' + LINE_NUMS[li], start: s0, end: t }); });
  else for (const sg of pub.order) {
    const s0 = t, slots = sg.slots || us.filter(u => u.li === sg.li).map(u => u.si);
    for (const si of slots) { const u = at(sg.li, si); if (!u || !DICH[u.k]) continue; const n = sg.count || u.num.v || 1; for (let r = 0; r < n; r++) { ev.push({ t, d: 1, s: DICH[u.k].pair.slice(), kind: 'dyad', u: u.idx }); t += 1; } }
    segs.push({ li: sg.li, label: sg.lab, start: s0, end: t });
  }
  for (const u of us) { const e = ev.filter(x => x.u === u.idx); if (e.length) { u.start = e[0].t; let end = e[0].t; for (const x of e) { if (x.t > end + 1e-9) break; end = x.t + x.d; } u.end = end; } else { const nx = ev.find(x => x.u > u.idx); u.start = u.end = nx ? nx.t : t; } }
  const lineSpans = LINE_NUMS.map((ln, li) => { const sg = segs.find(x => x.li === li && (!pub.order || !x.label.startsWith('closing'))) || { start: t, end: t }; return { line: ln, start: sg.start, end: sg.end }; });
  const all = ev.flatMap(e => e.s);
  return { cfg, units: us, events: ev, marks, total: t, lineSpans, segs, pub: pub.src, onsets: new Set(ev.filter(e => e.kind !== 'rest').map(e => e.t.toFixed(4))).size, notes: all.length, uses89: Math.max(...all) > 7, maxS: Math.max(...all), minS: Math.min(...all) };
}
/* frequency and spelling of any string number, extending the nine strings by octaves */
function freqAt(fr, cfg, s) { let k = s, m = 1; const down = cfg.dir === 'desc'; while (k > 9) { k -= 7; m *= down ? 0.5 : 2; } while (k < 1) { k += 7; m *= down ? 2 : 0.5; } return fr[k] * m; }
function noteAt(cfg, k, s) { let j = s, o = 0; const down = cfg.dir === 'desc'; while (j > 11) { j -= 7; o += down ? -1 : 1; } while (j < 1) { j += 7; o += down ? 1 : -1; } const n = noteOf(cfg, k, j); return { L: n.L, o: n.o + o, acc: n.acc }; }
function realize(cfgIn) { const cfg = Object.assign({}, DEFAULT_CFG, cfgIn); if (cfg.pub && PUB[cfg.pub]) return realizePub(cfg, PUB[cfg.pub]); const R = realizeLines(cfg, READINGS[cfg.reading].lines, { h6: true, lineNums: LINE_NUMS }); R.segs = R.lineSpans.map((sp, li) => ({ li, label: 'l. ' + sp.line, start: sp.start, end: sp.end })); R.minS = R.events.reduce((m, e) => Math.min(m, ...e.s), 99); if (R.minS === 99) R.minS = 1; return R; }

function lineSums(cfg) {
  const us = units(Object.assign({}, DEFAULT_CFG, cfg));
  return LINE_NUMS.map((ln, li) => us.filter(u => u.li === li && u.k[0] !== '@').reduce((a, u) => a + (u.num.v || 0), 0));
}
const VITALE_SYLL = [null, 42, 30, 30, 36, null]; // per notation line, after Vitale 1982 (lyric ll. 1–4)

function occurrences(cfg) { // dichord → {n, sum, lines}
  const us = units(Object.assign({}, DEFAULT_CFG, cfg)); const o = {};
  for (const u of us) { if (!DICH[u.k]) continue; const r = o[u.k] || (o[u.k] = { n: 0, sum: 0, lines: new Set() }); r.n++; r.sum += u.num.v || 0; r.lines.add(u.line); }
  return o;
}

/* ---------- lyrics: aligned readings (after Goranson’s comparative table) ---------- */
/* each slot: "D&L|Laroche|Kilmer|D-G|Thiel|Krispijn"; * marks the repeated seven syllables */
const LYR_EDS = ['D&L 1975', 'Laroche 1968', 'Kilmer 1974', 'D-G 1984', 'Thiel 1977', 'Krispijn 2002'];
const LYR = [
  ['[XXX]|[X-X]|[x (x)]|[xxx]|[XXX]|[x-a-aš]-ḫa-aš-ta-ni-ya-ša', 'ḫa-aš-ta|ḫa-nu?-ta|ḫan[u]ta|-ḫanuta|ḫa-aš-ta|→', 'ni-ia-ša|ni-ya-ša|niyaša|niyaša|ni-ya-ša|→', 'zi-ú-e|zi-ú-e|ziwe|ziwe|zi-ú-e|zi-ú-e', 'ši-nu-te|š[i?]-nu-te|š[i]nute|šinute|ši-nu-te|ši-nu-te', 'zu-tu-ri-ia|zu-tu-ri-ya|˹zutu˺riya|zuturiya|zu-tu-ri-ya|zu-tu-ri-ya', 'ú-pu-ga-ra|ú-pu-X-ra|ubugara|ubugara|ú-pu-ga-ra|ú-pu-ga-ra-ra', 'at?/ak??-ḫu-ur-ni|[X-X-X-]-ur-ni|˹kud˺urni|ḫuburni|at?/ak??-ḫu-ur-ni|at/ak-ḫu-ur-ni', 'ta-ša-al|ta-ša-al|tašal|tašal|ta-ša-al|ta-ša-al', 'ki-il-[l]a|ki-il-[l]a|killa|killa|ki-il-[l]a|ki-il-la', 'mu-li|[z]i?-li|[z]ili|zili|mu-li|mu-li', 'ši-ip-ri|ši-i[p?-X]|šipri|šipri|ši-ip-ri|ši-ip-ri', '*ḫu-ma-ru-ḫa-at|ḫu-ma-ru-ḫa-at|ḫumaruḫat|(ḫumaruḫat|ḫu-ma-ru-ḫa-at|(ḫu-ma-ru-ḫa-at', '*ú-wa-r[i]|ú-wa-ri|uwa[ri]|uwari)|ú-wa-r[i]|ú-wa-ri)'],
  ['*ḫu-ma-ru-ḫa-at|ḫu-ma-ru-ḫa-at|ḫumaruḫat|ḫumaruḫat|ḫu-ma-ru-ḫa-at|ḫu-ma-ru-ḫa-at', '*ú-wa-ri|ú-wa-ri|uwari|uwari|ú-wa-ri|ú-wa-ri', 'wa-an-da-ni-ta|wa-an-da-[n]i-ta|wanda[n]ita|wandanita|wa-an-da-ni-ta|wa-an-da-ni-ta', 'ú-ku-ri|ú?-ku-ri|ukuri|ukuri|ú-ku-ri|ú-ku-ri', 'ku-ur-ku-ur-ta|ku-ur-ku-ur-ta|kurkurta|kurkurta|ku-ur-ku-ur-ta|ku-ur-ku-ur-ta', 'i-ša-al-la|i-ša-al-la|išalla|išalla|i-ša-al-la|i-ša-al-la', 'ú-la-li|ú-la-li|ulali|ulali|ú-la-li|ú-la-li', 'kab-gi|kab-gi|kabgili|kabgili|kab-gi|kab-gi', 'ú-li-ú-gi|a[l]-li-X-gi|a[l]li[x]gi|alligi|ú-li-ú-gi|ú-li-ú-gi', 'ši-ir-it|ši-ri-it?|širit|širit|ši-ir-it|ši-ir-it', 'ú?-nu-šu|X-[X]-nu-šu|[mur?]nušu|[xx]-nušu|ú?-nu-šu|ú?-nu-šu', '*wa-ša-al|wə-ša-al|wešal|(wešal|wa-ša-al|(we-ša-al', '*ta-ti-ib|ta-ti-ib|tatib|tatib|ta-ti-ib|ta-ti-ib', '*ti-ši-a|ti-ši-a|tišiya|tišiya)|ti-ši-a|ti-ši-a)'],
  ['*wa-ša-al|wə-ša-al|wešal|wešal|wa-ša-al|we-ša-al', '*ta-ti-ib|ta-ti-ib|tatib|tatib|ta-ti-ib|ta-ti-ib', '*ti₄-ši-a|ti₄-ši-a|tišia|tišia|ti₄-ši-a|di-ši-ya', 'ú-nu-ul|ú-nu-[g]a?|unu[g]a|unuga|ú-nu-ul|ú-nu-ul', 'kab-ši-li|kap-ši-li|kabšili|kabšili|kab-ši-li|kab-ši-li', 'ú-nu-ul-at|ú-nu-ga?-at|unugat|unugat|ú-nu-ul-al|ú-nu-ul-al', 'ak-li|ak-li|akli|akli|ak-li|ak-li', 'ša-am-ša-am-me-ni|ša-am-ša-am-me-X-|šamšam|šamšamme|ša-am-ša-am-me-en-ga-li-il|ša-am-ša-am-me-ni', 'ta-li-il|-li-il|me[x]-lil|[x]-lil|→|ta-li-il', 'uk-la-al|uk-la-al|uklal|uklal|uk-la-al|uk-la-al', 'tu-nu-ni-ta|tu-nu-ni-ta-X|tununita˹ka?˺|tununita|tu-nu-ni-ta|tu-nu-ni-ta', 'sa?-X-X-X-X-ka|[X-X]-ka|[ḫanu?]ka|[xxx]-ka|sa?-X-X-X-X-ka|sa?-x-x-x-x-ka', '*ka-li-ta-ni-il|ka-li-ta-ni-il|kalitanil|(kalitanil|ka-li-ta-ni-il|(ka-li-ta-ni-il', '*ni-ka-la|ni-ka-la|nikala|nikala)|ni-ka-la|ni-ka-la)'],
  ['*ka-li-ta-ni-il|ka-li-ta-ni-il|kalitanil|kalitanil|ka-li-ta-ni-il|ka-li-ta-ni-il', '*ni-ka-la|ni-ka-la|nikala|nikala|ni-ka-la|ni-ka-la', 'ni-ḫ[u]-r[a]-ša-al|ni-ḫ[u?-r]a?-ša-al|ni[ḫura?]šal|niḫurašal|ni-ḫ[u]-r[a]-ša-al|ni-ḫ[u]-r[a]-ša-al', 'ḫa-na|ḫa-na|ḫana|ḫana|ḫa-na|ḫa-na', 'ḫa-nu-te-ti|ḫa-nu-te-ti|ḫanuteti|ḫanuteti|ḫa-nu-te-ti|ḫa-nu-te-ti', 'at-ta-ia-aš-ta-al|at-ta-ya-aš-ta-al?|attayaštal|attayaštal|at-ta-ya aš-ta-al|at-ta-ya-aš-ta-al', 'a-tar-ri|a-tar-ri|attari|attari|a-tar-ri|a-tar-ri', 'ḫu-e-ti|ḫu-e-ti|ta(?)eti|ḫueti|ḫu-e-ti|ḫu-e-ti', 'ḫa-nu-ka|ḫa-nu-ka|ḫanuka|ḫanuka|ḫa-nu-ka|ḫa-nu-ka', 'X-zu?-[X-X-X-a]š?-ša-a-ti|[… -a]š-ša-a-ti|[xxxxxxxx]-šati|[xxxxxxx]-aš šati|X-zu?-[X-X-X-a]š?-ša-a-ti|X-zu [x-x-x-a]š-ša-a-ti', 'we-e-we|we-e-wə|wewe|wewe|we-e-we|we-e-we', 'ḫa-nu-ku|ḫa-nu-ku|ḫanuku|ḫanuku|ḫa-nu-ku|ḫa-nu-ku']
];
const COLOPHON = [
  ['D&L 1975', '[an-nu]-ú za-am-ma-rum ša ni-id-qib-li za-l[u]-z[i …] ŠU ᵐAm-mu-ra-bi'],
  ['Laroche 1968', '[an-nu]-ú za-am-ma-aš-ša ni-it-kib-li za-[lu-zi …] ŠU ᵐAm-mu-ra-bi'],
  ['Kilmer 1974', '[ann]û zammaru nidqibli za[luzi ša DINGIR.MEŠ TA ᵐUrḫiya] ŠU ᵐAmmu-rapi'],
  ['Krispijn 2002', '[an-nu]-ú za-am-ma-rum ša ni-id-kib-li za-l[u]-z[i …] šu ᴵam-mu-ra-bi']
];

if (typeof module !== 'undefined') module.exports = { PUB, realizePub, freqAt, noteAt, stringOfPitch, TEMPER, realizeLines, unitsOf, DICH, CBS_PAIRS, CYCLE, TIGHTEN, FIFTHS_RING, READINGS, PRESETS, PRESET_ORDER, DEFAULT_CFG, alterations, tuningName, unclearOf, stepString, loosenString, stepPattern, centsOf, noteOf, helm, sci, freqs, intervalOf, greekOf, realize, lineSums, occurrences, units, runPath, LYR, C_A };
