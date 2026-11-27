/* Appendices: sign-level model of h.6 and the other Hurrian fragments. Data only + pure helpers. */

/* ---------- cuneiform glyphs (Unicode 15) ---------- */
const SG = {
  a: ['𒀀', 'A'], ad: ['𒀜', 'AD'], at: ['𒀜', 'AD'], ak: ['𒀝', 'AK'], al: ['𒀠', 'AL'], am: ['𒄠', 'AM'], an: ['𒀭', 'AN'],
  'aš': ['𒀸', 'AŠ'], 'aḫ': ['𒄴', 'AḪ'], be: ['𒁁', 'BE'], bi: ['𒁉', 'BI'], bu: ['𒁍', 'BU'], pu: ['𒁍', 'BU'], da: ['𒁕', 'DA'],
  e: ['𒂊', 'E'], ga: ['𒂵', 'GA'], gi: ['𒄀', 'GI'], i: ['𒄿', 'I'], ia: ['𒅀', 'I.A'], ib: ['𒅁', 'IB'], ip: ['𒅁', 'IB'],
  id: ['𒀉', 'Á'], it: ['𒀉', 'Á'], il: ['𒅋', 'IL'], ir: ['𒅕', 'IR'], ka: ['𒅗', 'KA'], kab: ['𒆏', 'KAB'], 'qáb': ['𒆏', 'KAB'],
  ki: ['𒆠', 'KI'], ku: ['𒆪', 'KU'], la: ['𒆷', 'LA'], li: ['𒇷', 'LI'], lu: ['𒇻', 'LU'], ma: ['𒈠', 'MA'], me: ['𒈨', 'ME'],
  mi: ['𒈪', 'MI'], mu: ['𒈬', 'MU'], na: ['𒈾', 'NA'], ni: ['𒉌', 'NI'], nu: ['𒉡', 'NU'], ra: ['𒊏', 'RA'], ri: ['𒊑', 'RI'],
  ru: ['𒊒', 'RU'], sa: ['𒊓', 'SA'], ta: ['𒋫', 'TA'], tar: ['𒋻', 'TAR'], te: ['𒋼', 'TE'], ti: ['𒋾', 'TI'], 'ti₄': ['𒁲', 'DI'],
  tu: ['𒌅', 'TU'], uk: ['𒊌', 'UG'], ul: ['𒌌', 'UL'], um: ['𒌝', 'UM'], ur: ['𒌨', 'UR'], 'uš': ['𒍑', 'UŠ'],
  wa: ['𒉿', 'PI'], we: ['𒉿', 'PI'], wi: ['𒉿', 'PI'], za: ['𒍝', 'ZA'], zi: ['𒍣', 'ZI'], zu: ['𒍪', 'ZU'],
  'ú': ['𒌑', 'Ú'], u: ['𒌋', 'U'], 'ša': ['𒊭', 'ŠA'], 'šar': ['𒊬', 'SAR'], 'ši': ['𒅆', 'IGI'], 'šu': ['𒋗', 'ŠU'],
  'ḫa': ['𒄩', 'ḪA'], 'ḫu': ['𒄷', 'ḪU'], m: ['𒁹', 'DIŠ'], rum: [null, 'RUM'], qib: [null, 'KIB'], kib: [null, 'KIB']
};
const NUMG = { 1: '𒁹', 2: '𒈫', 3: '𒐈', 4: '𒐉', 5: '𒐊', 10: '𒌋' };

/* Split edited words into signs, keeping the editorial state of each; bracket state carries across words.
   [..] lost (restored when a reading stands inside), ˹..˺ damaged, ? uncertain, X illegible. */
function parseWords(words) {
  let lost = false, dam = false;
  return words.map(word => {
    const out = []; let cur = null;
    const flush = () => {
      if (!cur) return;
      const r = cur.chars.map(c => c.ch).join(''), nl = cur.chars.filter(c => c.lost).length, nd = cur.chars.filter(c => c.dam).length;
      const raw = r.replace(/\?/g, ''), q = /\?/.test(r);
      if (raw) {
        const x = /^x+$/i.test(raw), all = nl === cur.chars.filter(c => c.ch !== '?').length, some = nl > 0;
        let st = 'ok';
        if (raw === '…') st = 'gap';
        else if (x) st = some ? 'lost' : 'trace';
        else if (all) st = 'rest';
        else if (some) st = 'part';
        else if (nd) st = 'dam';
        const n = x ? raw.length : 1;
        for (let i = 0; i < n; i++) out.push({ r: x ? 'x' : raw, st, q });
      }
      cur = null;
    };
    for (const ch of word) {
      if (ch === '[') { lost = true; continue; }
      if (ch === ']') { lost = false; continue; }
      if (ch === '˹') { dam = true; continue; }
      if (ch === '˺') { dam = false; continue; }
      if (ch === '-' || ch === ' ' || ch === '*') { flush(); continue; }
      if (ch === 'ᵐ') { flush(); out.push({ r: 'm', st: lost ? 'rest' : 'ok', q: false, det: true }); continue; }
      if (!cur) cur = { chars: [] };
      cur.chars.push({ ch, lost, dam });
    }
    flush();
    return out;
  });
}
function glyphOf(r) {
  const k = r.toLowerCase().replace(/[?]/g, '');
  if (/^\d+$/.test(k)) return NUMG[+k] || null;
  if (k.includes('/')) return glyphOf(k.split('/')[0]);
  const e = SG[k]; return e ? e[0] : null;
}
function signName(r) {
  const k = r.toLowerCase().replace(/[?]/g, '');
  if (/^\d+$/.test(k)) return k === '1' ? 'DIŠ (1)' : k === '10' ? 'U (10)' : k + ' (numeral)';
  if (k.includes('/')) return k.split('/').map(signName).join(' or ');
  const e = SG[k]; return e ? e[1] : r.toUpperCase();
}

/* ---------- h.6 as a physical object ---------- */
/* Line breaks at the join and the edge, as [word, sign] where the next part starts (after Laroche 1955, 1968). */
const H6_SPLIT = {
  lyr: [ { join: [3, 2], rev: [7, 2], revJoin: [11, 2] }, { join: [2, 3], rev: [6, 0], revJoin: [10, 0] },
         { join: [3, 2], rev: [8, 0], revJoin: [11, 5], approx: true }, { join: [2, 2], rev: [6, 0], revJoin: [9, 5] } ],
  not: [[2, 3], [2, 1], [2, 3], [2, 4], [2, 3], [3, 1]],
  col: [4, 1]
};
const H6_PIECES = { L: 'RS 15.30 + 15.49', R: 'RS 17.387' };
const COLO_WORDS = ['[an-nu]-ú', 'za-am-ma-rum', 'ša', 'ni-id-qib-li', 'za-l[u]-z[i', '…]', 'ŠU', 'ᵐAm-mu-ra-bi'];
const COLO_GLOSS = [
  ['annû', 'this', 'Akkadian'], ['zammārum', 'song', 'Akkadian zamārum, “song”'], ['ša', 'of', 'Akkadian'],
  ['nīd qablim', 'the tuning (and primary pair) nīd qablim, strings 4·1; the Middle Assyrian catalogue KAR 158 likewise names a genre by it, irâtu ša nīd qabli (viii 49)', 'CBS 10996; UET VII 74; Koitabashi 1996'],
  ['zaluzi', 'a Hurrian genre or epithet; h.15 has zaluzi ša DINGIR.MEŠ, “… of the gods”', 'Laroche 1968; Dumbrill 2005'],
  ['…', 'broken: Kilmer restores [ša DINGIR.MEŠ TA ᵐUrḫiya], after h.8, h.11 and h.13', 'Kilmer 1974'],
  ['ŠU', '“hand (of)”: the scribe', 'Akkadian logogram'], ['Ammurabi', 'the scribe’s name', 'D&L 1975']
];

/* Glosses for the lyric words, by line.word (0-based). st: id = identified, prop = meaning proposed,
   opaque = read but not understood, dam = damaged, lost = broken away. */
const H6_GLOSS = {
  '0.0': ['lost', 'About three signs broken away at the corner of the tablet.', ''],
  '0.4': ['prop', 'šin- “two”? Krispijn: “two (offering loaves)”.', 'Krispijn 2002'],
  '0.7': ['dam', 'First sign read at? or ak?; the rest ḫu-ur-ni.', 'D&L 1975'],
  '0.8': ['prop', 'taš- “give, present” with the enclitic -l(la) “they”: “they give”.', 'Duchesne-Guillemin 1984'],
  '0.9': ['dam', 'One sign restored: ki-il-[l]a.', 'D&L 1975'],
  '1.2': ['prop', 'wandani “right” + directive -ta: “to the right (side)”.', 'Thiel 1977; Krispijn 2002'],
  '1.3': ['prop', 'Perhaps Hurrian ugri “foot”; Thiel renders the phrase “zum rechten Fuß (des göttlichen Thrones)”.', 'Thiel 1977'],
  '1.5': ['opaque', 'Ends in -lla, the enclitic “they”, which marks the head of a clause.', 'Laroche 1955'],
  '1.10': ['dam', 'First sign uncertain: ú?-nu-šu.', 'D&L 1975'],
  '1.11': ['prop', 'Taken as an address to the goddess, with the enclitic -l(la).', 'Laroche 1955'],
  '1.12': ['prop', 'tad- “love”, a well-attested Hurrian root: “(they) love”.', 'Laroche 1955'],
  '1.13': ['prop', 'tiša “heart”: Thiel’s “in ihrem Herzen lieben”.', 'Thiel 1977; Duchesne-Guillemin 1984'],
  '2.3': ['prop', 'un- “come”? (low confidence).', 'Krispijn 2002'],
  '2.5': ['prop', 'un- “come”? with -at (low confidence).', 'Krispijn 2002'],
  '2.7': ['id', 'Sesame: cf. Akkadian šamaššammū. Thiel: “Sesam-Öl mögen sie (als Opfer) hinführen”.', 'Thiel 1977'],
  '2.9': ['opaque', 'Ends in -al: the head of a new clause.', 'Laroche 1955'],
  '2.11': ['dam', 'sa? and four illegible signs, then ka.', 'D&L 1975'],
  '2.13': ['id', 'Nikkal, the moon god’s consort (Ugaritic Nkl), to whom the hymn is addressed.', 'Laroche 1955; Thiel 1977'],
  '3.2': ['dam', 'Two signs half preserved: ni-ḫ[u]-r[a]-ša-al. Ends in -al: a clause begins.', 'D&L 1975'],
  '3.3': ['prop', 'ḫan- “bear (a child)”.', 'Thiel 1977; Krispijn 2002'],
  '3.4': ['prop', 'ḫan- “bear”: Thiel’s “Unfruchtbare(s) mögen sie fruchtbar sein lassen”.', 'Thiel 1977'],
  '3.5': ['prop', 'atta(i) “father” + ašti “wife”: the married couples. Krispijn: “She let the married couples have children”.', 'Thiel 1977; Duchesne-Guillemin 1984; Krispijn 2002'],
  '3.8': ['prop', 'ḫan- “bear”.', 'Thiel 1977; Krispijn 2002'],
  '3.9': ['lost', 'X-zu?- then three or so signs lost, then -aš?-ša-a-ti.', 'D&L 1975'],
  '3.10': ['prop', 'we- is the Hurrian second-person possessive: “your”? This is a grammatical guess, not an editor’s gloss.', 'Hurrian grammar (this page)'],
  '3.11': ['prop', 'ḫan- “bear”.', 'Thiel 1977; Krispijn 2002']
};
H6_GLOSS['1.0'] = H6_GLOSS['0.12'] = ['opaque', 'Part of the seven syllables that end l. 1 and open l. 2.', ''];
H6_GLOSS['1.1'] = H6_GLOSS['0.13'] = ['opaque', 'End of the repeated group ḫumaruḫat uwari.', ''];
H6_GLOSS['2.0'] = H6_GLOSS['1.11']; H6_GLOSS['2.1'] = H6_GLOSS['1.12']; H6_GLOSS['2.2'] = H6_GLOSS['1.13'];
H6_GLOSS['3.1'] = H6_GLOSS['2.13']; H6_GLOSS['3.0'] = H6_GLOSS['2.12'] = ['opaque', 'Part of the repeated group kalitanil nikala.', ''];
/* clause heads (words carrying the enclitic -l(la)), after Laroche 1955 and Duchesne-Guillemin 1984 */
const H6_CLAUSES = [[0, 0], [0, 8], [1, 5], [1, 11], [2, 9], [3, 2], [3, 5]];
const H6_TRANSL = [
  ['Thiel 1977', 'zum rechten Fuß (des göttlichen Thrones)', 'l. 2'],
  ['Thiel 1977', 'in ihrem Herzen lieben', 'll. 2–3'],
  ['Thiel 1977', 'Sesam-Öl mögen sie (als Opfer) hinführen', 'l. 3'],
  ['Thiel 1977', 'Unfruchtbare(s) mögen sie fruchtbar sein lassen', 'l. 4'],
  ['Krispijn 2002', 'prepare two offering loaves in their bowls', 'l. 1'],
  ['Krispijn 2002', 'at the right side (of your throne)', 'l. 2'],
  ['Krispijn 2002', 'You love those who come in order to be covered', 'l. 3'],
  ['Krispijn 2002', 'It is Nikkal, who will strengthen them', 'll. 3–4'],
  ['Krispijn 2002', 'She let the married couples have children', 'l. 4']
];

/* ---------- the other Hurrian pieces ---------- */
/* Readings after Dumbrill 2005 (Archaeomusicology, pp. 134–73), who follows Laroche 1955/1968;
   string sequences after West 1994. slot: [term, numeral, transliteration, uncertainty, qualifier, alternative]
   term '?' = not identified, '@' = Hurrian word, '@u' = uštamari, '|' = lacuna between unconnected sequences. */
const QS = { up: 'ašḫuwe “upper”', down: 'turie “lower”' };
const FRAG = [
  { id: 'h.2', rs: '', pg: '134–38', lyrN: 20,
    lyr: ['te-zu-ub-be a-ti-mi ti-[', 'e-ku-še pì-ša-i-i[š', 'uš-ḫu-un-ni-te-x[', 'ma-ša-ar-ra na-aḫ-[', 'ma-ša-ar-ra na-aḫ-[', 'ma-ša-ar-ra šu-uš-x[', 'ú-mu-lu-uš-du-mal-x[', 'ú-mu-lu-uš-du-mal-uš?[', 'ši-i-e ki-iš-ša-an[', 'ši-i-e ki-iš-ša-an[', 'ta-ti-la-e te-zu-[', 'aš-mu-um ta-a-li [', 'ši-i-ra-ma-an-di-e-x[', 'a-ga-ḫi-iš-ḫè ḫa-x[', 'ka-na-ki-it-ḫè na-ḫu[', 'a-ga-ta-ra-ap-ḫè [', 'ki-ir-ki-ri-ja-an-ni-x[', 'ša-at-ta te-ḫè-er-ḫè [', 'ši-ra-du-up-we na-aḫ-ḫi[', 'e-we-er-ni we-ši-wa-an['],
    mus: [
      [21, [['nidqablim', 2, 'na-at-qáb-li'], ['sherum', null, 'ša-a[ḫ-ri']]],
      [22, [['titurqablitim', 1, 'ti-ti-ir-qáb-li'], ['titurishartim', null, 'ti-[ti-mi-šar-te]']]],
      [23, [['titurqablitim', 1, 'ti-ti-ir-qáb-li'], ['titurishartim', null, 'ti-[ti-mi-šar-te]']]],
      [24, [['titurishartim', 2, 'ti-ti-mi-šar-te'], ['zerdum', null, 'z[i-ir-te']]],
      [25, [['rebutum', 1, 'ir-bu-te'], ['@', null, 'ka-za-e']]],
      [26, [['qablitum', 1, 'qáb-li-te'], ['isqum', 1, 'eš-gi']]],
      [27, [['@', null, 'e-ta-ma-še-a-ni']]],
      [28, [['kitmum', 2, 'ki-it-me'], ['titurishartim', null, 'ti-ti-[mi-šar-te']]],
      [29, [['titurishartim', 2, 'ti-ti-mi-šar-te'], ['@', null, 'ḫ[a-ap-še-ma']]],
      [30, [['zerdum', 1, 'zi-ir-te'], ['sherum', null, 'ša-a[ḫ-ri']]],
      [31, [['@', null, 'be-en-ta-ma'], ['qablitum', null, 'qáb-l[i-te]']]],
      [32, [['@', null, 'pa-ḫi-ta'], ['kitmum', null, 'ki-it-[me']]]
    ],
    words: [['te-zu-ub-be', 'Teššub-be, “of Teššub”, the storm god to whom the hymn is addressed', 'Dumbrill 2005'], ['e-ku-še pì-ša-i-i[š', 'two mountains, Ekuše and Pišaiš (Pišaiš also names a wood)', 'Dumbrill 2005, after von Brandenstein'], ['ši-i-e', '“river”', 'Dumbrill 2005'], ['e-we-er-ni', '“lord”, perhaps an epithet of Teššub', 'Dumbrill 2005']],
    note: 'Left edge preserved, so line openings can be compared: h.2 and h.10 open nadqabli – šaḫri, h.6 and h.7 qablite – irbute; in every case a primary (falling fifth) then a secondary (rising third). The four new terms kazae, etamašeani, bentamma and paḫita all occur here. Dumbrill thinks h.2 was about twice as long as h.6.',
    west: '41. 75. – 35. 46. – 52. 13. – 46. 75.' },
  { id: 'h.3', rs: '', pg: '138–39',
    lyr: ['] x [', ']du-un-tu-ba[', ']šu-ra ša-šar[-te', ']ḫe-le-eš-ta x[', 'a]š? ti-tu-um g[i?', ']tu-uḫ-ḫu-uš be[-', '(obv.) -]ḫu-uš[', '(obv.) -]zu-ḫa-aš zu-u[š-'],
    mus: [
      [7, [['sherum', 2, ']ša-aḫ-ri'], ['zerdum', null, 'z[i-ir-te']]],
      [8, [['@', null, ']be-en-ta-am-ma[']]],
      [9, [['sherum', 'x', 'ša-a]ḫ-ri']]]
    ],
    words: [],
    note: 'šaḫri – zirte spans f–b, a tritone, on the descending scale; Dumbrill reads bentamma as a Hurrianised pītum, the tritone pair, so the two would echo each other.',
    west: '75. 46.' },
  { id: 'h.4', rs: 'RS 14.15', pg: '139–41',
    lyr: [],
    mus: [
      [1, [['sherum', null, '[ša-aḫ-ri', '', 'down']]],
      [2, [['@', null, 'ḫiza-]wa-ša'], ['@', null, 'ḫa-ap-še-ma'], ['?', null, 'a?-x']]],
      [3, [['?', '5?', ']'], ['nidqablim', 5, 'na-at-qáb-li'], ['@', null, 'ḫi-za-w[a-ša']]],
      [4, [['?', '1?', ']'], ['sherum', 1, 'ša-aḫ-ri', '', 'down'], ['?', null, 'x']]],
      [5, [['?', null, ']x'], ['titurishartim', 1, 'ti-ti-i-šar-te'], ['zerdum', null, 'z[i-ir-te']]],
      [6, [['?', null, ']x'], ['sherum', null, 'ša-aḫ-ri', '', 'down']]],
      [7, [['sherum', null, 'š]a-aḫ-r[i']]],
      [8, [['@', null, 'be-en-ta-am]-ma']]],
      [9, [['@', 2, ']gi-eš-ša']]],
      [10, [['@', null, 'gi-]eš-ša']]]
    ],
    words: [['ḫizawaša', 'unexplained; Dumbrill pairs it with kazae (h.2) as opposites', 'Dumbrill 2005'], ['gi-eš-ša', 'perhaps ÈŠ.SA “upper” (a logogram at Ugarit), or part of ešgi', 'West 1994, n. 24']],
    note: 'Three šaḫri are qualified, all by turie (once written tu-ti-e). Dumbrill’s printed transliteration also contains three lines identical to h.3 (apparently carried over), so only the music is given here.',
    west: '35. 46.' },
  { id: 'h.5', rs: 'RS 14.18', pg: '141–43',
    lyr: [']x wa-?ir-x[', ']x-x ti?-x-x-wa-x[ ]ib-ri-ja-aš', ']ri?-mu-w[a ]e-ja-an-e-we-er-n[i?', ']x-x-(o)-x ma-da-al e-ja-da-an[', ']x-ma-še x-te a-we-en e-ja-wa t[e?-', ']a-ni ši-ig-gi-ni a-lu a-wi-in e[-', '-]da ḫu-ur-ḫu-ri ni-e za-ra-ni za-am m[i?', ']uš še-pi-te ḫe-el-li ni-e ḫi-iš-na[', ']x-ir-ḫe zu-zu-un-nu-uš di-in-na-ja?-ma?[', ']x-we-en a-ra a-ni pi-sa-an-ti-x[', 'z]e-eḫ-ḫi ki-in-na-ri a-ni ši-i-r[i', '-t]i?-ib ša-la-ar-ti ši-ir-ri ku-li-du[', '(rev.) ]x-še ḫe-el-li ku-un-da-ri di?-ru-uš e-x[', ']x-šu-gal-li a-ni-wa tu-ḫa-še [', ']x-ti-e ti-du-un e-ḫu-[u]š sa-a-ra x[', ']ḫu-du ku-ni-wa-aš pa-x[ ]', '-]e ša-ra aḫ-ra-am-[ ]a?-wa-ja['],
    mus: [
      [18, [['shalshatum', 3, ']ša-ša-te'], ['rebutum', null, 'ir-bu-te['], ['?', null, ']we-x[ ]x'], ['nidqablim', null, 'na-at[-qáb-li?']]],
      [19, [['titurqablitim', null, 'ti]-tar-qáb-li'], ['@', null, 'pu-gar-na'], ['titurishartim', null, 'ti-x[', '', '', 'West reads ti[timišarte]']]],
      [20, [['sherum', null, 'ša-aḫ]-ri', '', 'up'], ['@', null, 'pu-gar-[na']]],
      [21, [['rebutum', 2, 'ir-bu]-te'], ['shalshatum', 3, 'ša-ša-te'], ['?', null, 'x[']]],
      [22, [['@', null, 'p]u-gar-na']]]
    ],
    colo: { text: ']3? DINGIR.MEŠ x-x-pu-ḫi-ja na?[', composer: '…-puḫiya?', scribe: '', tuning: '' },
    words: [['e-we-er-n[i', '“lord”', 'Dumbrill 2005'], ['ḫe-el-li', '“rejoice”?', 'Dumbrill 2005'], ['ki-in-na-ri', 'cf. kinnōr, kinnara “lyre”', 'Dumbrill 2005'], ['za-am m[i?', 'cf. zà.mì / sammû, a harp', 'Dumbrill 2005'], ['pu-gar-na', 'stands where a numeral would; unexplained', 'Hagel 2005, n. 117']],
    note: 'pugarna takes the numeral’s place after titarqabli and šaḫri ašḫuwa. Seventeen lyric lines survive; Dumbrill hears temple vocabulary: “lord”, “rejoice”, “home of the gods”.',
    west: '16. 27. – 24. 35.' },
  { id: 'h.7', rs: 'RS 19.155', pg: '143–44',
    lyr: ['Traces', ']-ni-wa-x[', ']x-at z[i?-', '-]nu-ḫat-at [', '-a]l-la-at ḫ[a?-', 'x-wa-ni-wa-al a?[-'],
    mus: [
      [7, [['@', null, 'az-za-mi-ra'], ['@', null, 'be-ni-[']]],
      [8, [['qablitum', 3, 'qáb-li-te'], ['rebutum', 1, 'ir-bu-te']]],
      [9, [['sherum', 1, 'ša-aḫ-ri'], ['shalshatum', '2?', 'ša-aš-ša-t[e]'], ['sherum', null, 'ša-[aḫ-ri']]],
      [10, [['nidqablim', 4, 'ni-[i]t-kib-li'], ['titurqablitim', 1, 'ti-tar-qáb-li'], ['titurishartim', null, 'ti-t[i-mi-šar-te']]],
      [11, [['shalshatum', 2, 'ša-aš-ša-te'], ['rebutum', 3, 'ir-bu-te'], ['kitmum', 1, 'ki-it-me']]]
    ],
    colo: { text: '[a]n-nu-u za-am-ma-rum ša ni-it-kib-li za-lu-zi [', composer: '', scribe: '', tuning: 'nīd qablim' },
    words: [],
    note: 'Opens like h.6 (qablite 3 irbute 1) and shares runs with it: šaḫri šaššate, nitkibli titarqabli titimišarte, šaššate irbute kitme. Four music lines instead of six and different words, so not a copy. Same colophon formula and tuning as h.6.',
    west: '52. 27. – 75. 16. – 41. 24. 35. – 16. 27. 63.' },
  { id: 'h.8', rs: 'RS 19.84', pg: '144–46',
    lyr: [']el-li ta-ti-ib [ú-bi ši-du-ri]', 'ši-du-]ri', 'el-]li ta-ti-ib [ú-bi ši-du-]ri', 'ta-t]i-ib ú-bi š[i]-du-ri', 'ú-bi ši-du-ri', 'el-]li [t]a-ti-ib ú-bi ši-du-ri', '] ši-du-ri', 'el-]li ta-ti-i[b] ú-bi ši-du-ri', 'ú-]bi ši-du-ri', 'ta-t]i-ib ú-bi ši-du-ri', 'ši-d]u-ri', ']x-ma el-li ta-ti-ib ú-bi ši-du-ri', 'ta-ti-i]b ú-bi ši-du-ri'],
    mus: [
      [14, [['?', 2, '-t]e?'], ['sherum', 2, 'ša-aḫ-ri'], ['zerdum', '[x]', 'zi-ir-te']]],
      [15, [['sherum', 2, 'ša]-aḫ-ri'], ['zerdum', 2, 'zi-ir-te'], ['sherum', '2?', 'ša-aḫ-ri']]],
      [16, [['zerdum', 1, 'zi-ir-]te'], ['rebutum', 1, 'ir-bu-te'], ['shalshatum', 2, 'ša-aš-ša-te']]],
      [17, [['nidqablim', 1, ']na-at-qáb-li']]],
      [18, [['zerdum', 10, 'zi-i]r-te'], ['sherum', 3, 'ša-aḫ-ri']]],
      [19, [['?', 4, ']'], ['|'], ['?', '2?', ']'], ['shalshatum', 3, 'ša-aš-ša-te']]],
      [20, [['?', null, ']x-x['], ['embubum', 1, '[um-bu]-bi', '', '', 'restored by West'], ['rebutum', 1, 'ir-bu-te']]]
    ],
    colo: { text: 'TA ᵐU]r-ḫi-ya [ŠU X-]X-wa', composer: 'Urḫiya', scribe: '…-wa', tuning: '' },
    words: [['el-li ta-ti-ib ú-bi ši-du-ri', 'a refrain; G. Wilhelm (oral, 1995): “this silly girl (šiduri) loved”. šiduri, “young woman”, also names the ale-wife of Gilgameš', 'Dumbrill 2005']],
    note: 'Like h.6 it keeps line ends for both text and music: 13 lyric lines for 7 of music. The repeated šaḫri – zirte mirrors the repeated refrain, and h.8 has the second of the three 10s in the corpus (zirte 10).',
    west: '85 [sic]. 46. – 75. 46. 75. – 46. 27. 16. – 46. 75. – 37. 27.' },
  { id: 'h.9', rs: 'RS 19.146', pg: '146–47',
    lyr: ['-]pu-uš ša-nu-le-e ḫi-x[ · ]x ša-ša-al ša-wu-uš a-ru-ša su-[ru-un?-na', '-]ni-ib e-lu-wa šu-ú-n[i? · ]x ša-ša-al ša-wu-[uš a]-ru-ša šu-[ru-un?-na', ']ta-at-ta ḫa-am-ba ki-x [ · ]ša-ša-al ša-wu-[uš] a-ru-ša š[u-ru-un?-na', ']x-ri ki-iz-zu-um e-x · š[a-ša-al ša-wu-uš a-ru-ša su[-ru-un?-na', ']e-li-iš i-ti na-wa-[ · ša]-ša-al ša-wu-[uš a-ru-š]a šu-[ru-un?-na]-e-li x[', ']x-la-an-ni i-ti na-wa-x[ · š]a-ša-al ša-wu-[uš a-ru-ša] šu-[ru-un?-na e-li-x['],
    mus: [
      [7, [['nidqablim', 3, 'na-a]t-qáb-li'], ['isqum', 1, 'iš-gi'], ['titurqablitim', null, 'ti-ta[r-qáb-li']]],
      [8, [['?', null, '] x x'], ['sherum', 1, 'ša-aḫ-ri'], ['?', null, 'x [']]]
    ],
    words: [['ša-ša-al ša-wu-uš a-ru-ša', 'a refrain closing each line, with varied openings', 'Dumbrill 2005']],
    note: 'Repetitive text again, like h.8. nadqabli – ešgi – titarqabli recurs on h.19.',
    west: '41. 13. 24.' },
  { id: 'h.10', rs: 'RS 19.148', pg: '147–48',
    lyr: ['] x-at [', 'š[a]-at-tu-um [', 'ge-el-ge-le-eš[', 'al-la-ni ku-um-me-ni-wa e-x['],
    mus: [
      [5, [['nidqablim', 2, 'n[a-a]t-qáb-li'], ['sherum', null, 'ša-aḫ-ri', '', 'down']]],
      [6, [['nidqablim', 1, '[na-at]-qáb-li'], ['rebutum', '1?', 'ir-bu-te', '', 'up']]],
      [7, [['?', 10, ']x'], ['titurishartim', 2, 'ti-ti-i-šar-te'], ['zerdum', null, 'zi-[ir-te?']]],
      [8, [['qablitum', 2, 'qáb-li-]te'], ['rebutum', null, 'ir-bu-te', '', 'down']]],
      [9, [['?', 2, ']'], ['@', null, 'e-ta-m[a-še-a-ni']]],
      [11, [['titurqablitim', null, 'ti-ta]r-qáb-l[i']]]
    ],
    words: [['al-la-ni ku-um-me-ni-wa', '“the lady of Kummi”, Ḫebat, Teššub’s consort', 'Dumbrill 2005']],
    note: 'Both qualifiers on one tablet: šaḫri durie, irbute ašḫue, irbute durie. Hagel compares nadqabli – šaḫri durie here with nadqabli – šaḫri on h.6 l. 8, and nadqabli – irbute ašḫue with h.6 l. 7, where only an f♯ makes the parallel exact. The third 10 of the corpus stands at l. 7.',
    west: '41. 75. – 41. 27. – 35. 46.' },
  { id: 'h.11', rs: 'RS 19.150', pg: '148–49',
    lyr: ['Traces', '-]ba-še-na wu-ú-ra a-ru-u-[š?', '-]ba-še-na wu-ú-ra a-ru-u-[š?', ']x-ba-še-na wu-ú-ra MIN', '-ba-še-na wu-ú-ra MIN', '-n]a [wu-ú-ra MIN', '-ba]-še-na wu-ú-r[a MIN]'],
    mus: [[8, [['rebutum', null, ']ir-b[u-te']]]],
    colo: { text: 'DIN]GIR.MEŠ TA ᵐUr-[ḫi-ya', composer: 'Urḫiya', scribe: '', tuning: '' },
    words: [['MIN', '“ditto”: the scribe abbreviates the repeated verb', 'Dumbrill 2005']], note: 'Mostly text; MIN shows the scribe saving effort on a repeated phrase.', west: '' },
  { id: 'h.12', rs: 'RS 19.147', pg: '149–50',
    lyr: ['-n]a?-am-ta [i]p?-pu-li-ma', '[x]-ti-gal-li [x]-pu-l[i]-ma e-x[', '[x]-un-bu x-[x]-li al-la-šu ?-x', '[x]-up-x[ ]x-ti-it a-[', '[x]-x[ -t]a-lu-la [', ']ba-šu-ḫa[', ']ba-šu-ḫa x[', '-u]n ?-še-ni x [', '-]še-ni ka-x [', '-]iš-ba-ri-[', '-n]i ši-ta[-ar-ni ??', '] iš-ba-r[i-', ']ni['],
    mus: [
      [1, [['?', '1?', ']'], ['titurishartim', null, 'ti-ti[-mi-šar-te']]],
      [2, [['rebutum', 1, 'ir-bu-]te'], ['shalshatum', null, 'ša-aš-[ša-te']]],
      [3, [['embubum', 2, 'em-b]u-be'], ['rebutum', null, 'ir-bu[-te']]],
      [4, [['@', 2, 'ḫa-ap]-še-ma'], ['?', null, 'x [']]]
    ],
    colo: { text: '[an-nu-u za-am-ma-rum ša na-at-kib-l[i za-lu-zi] [ša DINGIR.MEŠ TA ᵐx-x-]ya [Š]U ᵐIp-ša-li', composer: '…-ya', scribe: 'Ipšali', tuning: 'nīd qablim' },
    words: [['ḫa-ap-še-ma', 'with a numeral (2): perhaps a single string, ḫamšum “the fifth”', 'West 1994']],
    note: 'The colophon confirms nīd qablim again. ḫapšema stands in a term’s place and takes a numeral, the best case for a single-string term.',
    west: '37. 27.' },
  { id: 'h.13', rs: 'RS 19.164 d', pg: '150–51',
    lyr: [],
    mus: [
      [1, [['zerdum', 2, 'zi-ir]-te'], ['sherum', 2, '[ša?-aḫ?-r]i?', '', 'up'], ['?', null, 'x[']]],
      [2, [['titurqablitim', 2, 'ti-t]ar-qáb-li'], ['kitmum', 2, 'ki-it-mi']]]
    ],
    colo: { text: 'T]A ᵐUr-ḫi-ya ŠU ᵐIp-ša-li', composer: 'Urḫiya', scribe: 'Ipšali', tuning: '' },
    words: [], note: 'Composer and scribe both named: “from Urḫiya, hand of Ipšali”. Hagel notes that Ipšali’s tablets use the extended notation with qualifiers.', west: '24. 63.' },
  { id: 'h.14', rs: 'RS 19.156', pg: '151',
    lyr: ['-]nu-um', '-]ar-ri', '-]wa', '] x ba x [ ]-ni', ']x ḫu-ut-ta (-?) e-ni-x-x', ']ša-wa-ra-še', '] am-mu-un u-ri', '] x-x ka-wu-uš'],
    mus: [
      [9, [['titurqablitim', 1, 'ti-tar-qáb]-li', '', '', 'West: na-at-qáb]-li'], ['kitmum', 1, 'ki-it-mi']]],
      [10, [['rebutum', 1, 'ir-b]u-te'], ['nidqablim', null, 'na-at-qáb-li']]]
    ],
    colo: { text: '] x-x TA Pu-ḫi-y[a', composer: 'Puḫiya', scribe: '', tuning: '' },
    words: [], note: 'Only “-li” survives of the first term: Dumbrill restores titarqabli, West nadqabli (41).', west: '41. 63. – 27. 41.' },
  { id: 'h.15', rs: 'RS 19.143', pg: '152',
    lyr: [']x-a-ya wu-ut-ki ku-um[-', ']ḫi-a wu-ut-ki [', ']-ub wu-un-x[', ']x at-t[a-?'],
    mus: [[1, [['sherum', null, 'š]a-a[ḫ-ri']]]],
    colo: { text: 'za-lu-z]i ŠA DINGIR.MEŠ Tap-ši-ḫu-ni[', composer: 'Tapšiḫuni', scribe: '', tuning: '' },
    words: [['zaluzi ša DINGIR.MEŠ', '“zaluzi of the gods”: the formula restored in h.6', 'Dumbrill 2005']], note: 'A third composer, Tapšiḫuni.', west: '' },
  { id: 'h.16', rs: 'RS 19.164 a', pg: '152–53',
    lyr: ['Traces', '-e]n ta-la-[', ']x-al-tu-uk-k[u ]na-za-[', '-]mu-ku zi-ir-ru-uḫ-ḫa-a[l?', '-]u ir-wa-aḫ-ḫa-al ma-[', '-]gi ḫa-ze-ni-en e-še-ni [', '-]x-na? [ ]a-ru x['],
    mus: [
      [8, [['shalshatum', 1, 'š]a-aš-ša-te']]],
      [9, [['zerdum', 1, 'z]i-ir-te']]],
      [10, [['@u', null, 'uš-ta-ma-]a-ri'], ['rebutum', 'x', 'ir-bu-te']]],
      [11, [['?', 4, ']x']]],
      [12, [['nidqablim', 5, 'na-]at-qáb-li']]],
      [13, [['?', '1?', ']'], ['isqum', 1, 'eš-gi']]],
      [14, [['titurishartim', 1, 'ti-ti-m]i-šar-te']]],
      [15, [['@', null, '] x be-ni-in-ni-ma']]],
      [16, [['@', null, ']x še-a-ni ak-ki-im']]]
    ],
    words: [], note: 'uštamari appears again, here before a term rather than after a 10. ]še-a-ni may be the end of etamašeani.', west: '' },
  { id: 'h.17', rs: 'RS 19.157 d', pg: '153–54',
    lyr: [']-ḫa wu-ur-ni-na a-ú-wa-ri dup-pì-ti x[', ']x-šu-ib-be ar-nu-ni-ib-b[e] ka[-', 'b]i-ya-[r]i aš-ti-eš ḫa-ni-eš ḫa-ni-eš AN?-ša-x[', '-m]a? si-e[l]-li še-ḫu-ur-na še-[', '] x [ ]x'],
    mus: [[6, [['embubum', null, 'em-b]u-be?'], ['@u', null, '[uš-t]a-ma-a-r[i]']]]],
    words: [['aš-ti-eš', 'cf. ašti “wife”, as in h.6 l. 4', 'Thiel 1977 (for h.6)'], ['ḫa-ni-eš', 'cf. ḫan- “bear”, as in h.6 l. 4', 'Thiel 1977 (for h.6)']], note: 'Shares ašti- and ḫan- with h.6 l. 4; uštamari after (perhaps) umbube.', west: '' },
  { id: 'h.18', rs: 'RS 19.15 c', pg: '154',
    lyr: [']x pu-un-ḫu-[x-]x ta-al-mi-li ši-ir-ri ḫa-x[', '-]ib-wa ti-[x-t]a?-ri tal-ma-u', ']x šu-mi-ni [x-]ḫa-aš-e', ']x-ka-ru a-i-ib ti-ya-ri-ib par-ni-ib [', ']x-ip?-ta-še n[i-x-]kab-še ni-tu-ur-ta [', ']x-x-um ḫu-ti-lu-re-eš [', ']x ar-re-[e]š', '-w]a? ta[- -]ib ḫu-['],
    mus: [], words: [], note: 'Text only.', west: '' },
  { id: 'h.19', rs: 'RS 19.149', pg: '154–55',
    lyr: [']we-ḫa-ri-wa k[a]-an-zi n[a]-sa-an', 'gi]u-li x-ri ta ka-zi-na-sa-a[n', ']x-wa-ta gi-u-li zu-ni-ta ka-an-zi-n[a-ša-an', ']x gi-wa-li ni-ri-ta ka-an-zi-n[a-ša-an', ']ta-ta-e ka-an-zi-na-ša-an t[a?-'],
    mus: [
      [6, [['nidqablim', 3, 'ni-i[t-kib-li'], ['isqum', 1, 'iš-gi'], ['titurqablitim', null, 'ti-tar-qáb-li']]],
      [7, [['?', 1, ']x'], ['zerdum', 5, 'zi-ir-te'], ['sherum', null, 'ša-aḫ-ri', '', 'up']]],
      [8, [['?', 2, ']x'], ['rebutum', 2, 'ir-bu-te'], ['embubum', null, 'um-bu-b[e]']]],
      [9, [['sherum', 1, '[ša-aḫ-ri] aš-ḫ]u-wa', '', 'up', 'šaḫri restored by West'], ['zerdum', 1, 'zi-ir-te'], ['?', null, 'x[']]],
      [10, [['?', null, ']x-li']]]
    ],
    words: [['ka-an-zi-na-ša-an', 'refrain word closing four lines', '']],
    note: 'nitkibli 3 – išgi 1 – titarqabli, exactly as on h.9. West uses the two qualified šaḫri for his “upper” = melody on the usual string.',
    west: '41. 13. 24. – 46. 75. – 27. 37.' },
  { id: 'h.20', rs: 'RS 19.142', pg: '155–56',
    lyr: [']ta?-al[', ']-ḫa ni-ri-u [', ']ru-li-ra-ma be-x[', 'i]l-li-ša-al ba-sa-[', ']x-e-ya-an te-eš-ḫ[u?-', ']x[ ]-du-ša(-?)wa-ḫu ku-ba-[', '(rev.) ]x-ku?-ba-bu-gi-be-li-wa e-ra-x[', ']x-pa-ya-e x[', '-]ḫa-ap-te-na š[e?-', ']ni-wa-ag-ga [', '-]ni ši-lu-la-am-x[', ']x ša-ti-i [1'],
    mus: [
      [13, [['rebutum', null, ']ir-bu-te [']]],
      [14, [['shalshatum', null, ']ša-aš-ša-te [']]],
      [15, [['?', '1?', ']'], ['rebutum', null, 'ir-bu-te [']]],
      [16, [['@', null, 'e]-ta-[ma-še-a-ni']]]
    ],
    words: [['te-eš-ḫ[u?-', 'perhaps Teššub', '']], note: 'Only the openings of four music lines survive.', west: '' },
  { id: 'h.21', rs: 'RS 19.154', pg: '156–57',
    lyr: ['-ḫ]a? ['],
    mus: [
      [2, [['?', '2?', '['], ['rebutum', null, 'ir-bu-t[e']]],
      [3, [['?', 1, '] x'], ['rebutum', null, 'ir-bu-te [']]],
      [4, [['titurishartim', 1, 'ti-ti]-i-šar-te'], ['shalshatum', 'x', 'ša-aš-ša[-te]']]],
      [5, [['shalshatum', 2, ']ša-aš-ša-te'], ['rebutum', '[x]', 'ir-bu-te'], ['shalshatum', null, 'ša-aš-ša-te [']]],
      [6, [['nidqablim', null, 'n]a-at-qáb-li', '', '', 'the one term in the corpus with no numeral (West 1994, n. 3)'], ['titurqablitim', 2, 'ti-tar-qáb-li'], ['titurishartim', null, 'ti-ti-[i-šar-te']]],
      [7, [['rebutum', 1, 'ir-b]u-te'], ['shalshatum', 1, 'ša-aš-ša-te'], ['embubum', 1, 'um-bu-be']]],
      [8, [['shalshatum', 1, 'š]a-aš-ša-te'], ['embubum', null, 'um-bu-be']]]
    ],
    words: [], note: 'The richest music after h.6 and h.2 with almost no text. nadqabli – titarqabli – titimišarte is the formula of h.6 l. 7 and h.7 l. 10; Hagel notes it is always followed by titur išartim.',
    west: '35. 16. – 16. 27. 16. – 41. 24. 35. – 27. 16. 37. – 16. 37.' },
  { id: 'h.22', rs: 'RS 19.164 c', pg: '157–58',
    lyr: ['(a)-]la-an[ … (a)]ta[', '(a)]ni-ru-uš … (b)-]a il-lu-te-la[ … (a)a]r?-ka š[u', '(a)]x-uš e-x[ … (b)b]a?-an-ti-ib ku-ba-bu [ ]-ya (a)-ma-ap', '(a)]ba-an … (b)-a]š-ta-ar wi-il-li-it [ ]e-ta a-w[a? … (a)]iš-te['],
    mus: [
      [5, [['@u', null, 'uš-]ta-ma-ri [']]],
      [6, [['sherum', 4, 'ša-aḫ-]ri']]],
      [7, [['sherum', 1, ']ša-aḫ-ri']]],
      [8, [['rebutum', null, ']ir-bu-t[e'], ['|'], ['qablitum', 3, ']qáb-li-te']]],
      [9, [['qablitum', 1, '-l]i-te', '', '', '-li-te: qablite'], ['?', null, 'š[a?-'], ['|'], ['?', 1, '-t]e?'], ['qablitum', 1, 'qáb-li-[t]e']]]
    ],
    words: [], note: 'Two pieces of one tablet (a, b). uštamari opens the music, as it closes l. 5 of h.6.', west: '' },
  { id: 'h.23', rs: 'RS 18.282', pg: '158–59',
    lyr: ['-]ni an[-'],
    mus: [
      [2, [['nidqablim', 4, 'na-a]t-qáb-li']]],
      [3, [['sherum', 1, 'š]a-aḫ-ri'], ['zerdum', null, 'z[i-ir-te']]],
      [4, [['sherum', 2, 'š]a-aḫ-ri'], ['zerdum', null, 'z[i-ir-te']]],
      [5, [['rebutum', 1, ']ir-bu-te'], ['nidqablim', null, 'na-a[t-qáb-li']]],
      [6, [['sherum', 2, 'ša-]aḫ-ri'], ['zerdum', null, 'z[ir-te']]],
      [7, [['nidqablim', null, 'na-a]t-qáb-l[i']]]
    ],
    words: [], note: 'šaḫri – zirte three times: the figure of h.6 ll. 6 and 8, h.8 and h.3.', west: '75. 46. – 75. 46. – 27. 41. – 75. 46.' },
  { id: 'h.24', rs: 'RS 19.144', pg: '159',
    lyr: ['Traces', 'a-ša]-aš-ti-ib [', '-]en ta-a-u-n[a', ']x a-da-aš-ti-ib', '-]ḫa-ri-ni-ru-uš [', 'n]i-ru-uš ['], mus: [], words: [], note: 'Text only.', west: '' },
  { id: 'h.25', rs: 'RS 19.145', pg: '159–60',
    lyr: ['ú-zu-ni [ ]x[', 'a-ri-la-zu-ra [', 'ša-wu-un aš-tu-ḫu-ur[', '[x-x]aš ú-ri-ni-ra [', 'ḫ]u-un-na ši-ra-x [', ']ši-ti-en-si x x[', '] x-na-up-du-um ni [', ']x zi-zu-n[u?', '] ši-im[-', ']ḫu-x[', '] ir-ma[-', '(rev.) e-ni i[p-', '] še-ḫu-ur-na a-x['],
    mus: [
      [14, [['?', '1?', ']x-li']]],
      [15, [['?', 1, ']x-li']]],
      [16, [['rebutum', 1, '[i]r-bu-te']]],
      [17, [['@', null, 'be-en-ta[-am-ma']]]
    ],
    words: [], note: 'Two terms ending -li (qablite? nadqabli? titarqabli?) and bentamma after an unqualified irbute, which is why Hagel rules out bentamma as a modulation sign.', west: '' },
  { id: 'h.26', rs: 'RS 19.151', pg: '160–61',
    lyr: ['Traces', ']x ḫa-[', '(rev.) ]ḫa-ba?-bi?[', '', 'Traces', '', '', '', '-u]n?-na x['],
    mus: [
      [4, [['shalshatum', null, 'ša-a]š-ša-t[e']]],
      [10, [['@', null, 'pu-]gar-nu'], ['@', null, 'ḫur-x[']]],
      [11, [['@', null, ']im?-za-aḫ[-']]],
      [12, [['?', '1?', ']'], ['titurqablitim', null, 'ti-tar-qá[b-li']]],
      [13, [['?', null, '-]šar-te', '', '', 'titimišarte or išarte'], ['@', null, 'pu-[gar-nu']]],
      [14, [['@', null, ']x mi-iš[-', '', '', 'nīš?']]],
      [15, [['@', null, 'p]u-gar-nu']]],
      [16, [['nidqablim', null, 'n]a-at-kib-l[i']]]
    ],
    words: [['mi-iš[-', 'perhaps nīš, the CBS 10996 term for strings 1·5, otherwise absent at Ugarit', 'cf. Hagel 2005, n. 79']], note: 'pugarnu three times: Hagel’s example of a tablet heavy with non-standard remarks, where the qualifiers would be expected.', west: '' },
  { id: 'h.27', rs: 'RS 19.153', pg: '161',
    lyr: [']x-ri še-el-l[u-', '-]it-te-ni ḫi-x[', 'z]u-ug-ga', ']ku-ub-bi-ib [', ']x ma-li-ku-ta-x[', ']x-re-eš ta-še-ni ta[-', ']x zu-lu-ni-e ti-la-u [', ']x-la-nu-um ti-la-u x][', '[ta-at-ta šar-ri-ni-eš na[-i-na', 't]a-at-ta šar-ri-ni-eš na-i-na['],
    mus: [[12, [['?', 4, '-t]e?']]], [13, [['@', null, ']še-a-n[i ]x[']]]],
    words: [['šar-ri-ni-eš', 'cf. šarri “king” / “god”', '']], note: 'One numeral and perhaps [etama]šeani.', west: '' },
  { id: 'h.28', rs: 'RS 10.1576', pg: '162',
    lyr: ['Traces', ']qáb?-ḫ[u? ]zi-li-u', '', ']x-te ta-ni-ni-sa ['],
    mus: [
      [5, [['qablitum', 1, 'qá]b-li-te']]],
      [6, [['titurqablitim', 1, 'ti-ta]r-qáb-li']]],
      [7, [['qablitum', 1, ']qáb-li-te']]],
      [8, [['sherum', null, ']ša-aḫ-[ri'], ['|'], ['embubum', 1, 'um]-bu-bu'], ['rebutum', 1, 'ir-bu-te']]]
    ],
    words: [], note: 'qablite – titarqabli – qablite: Hagel’s “bridge” titur qablītim between the d and b triads.', west: '75. 37. 27.' },
  { id: 'h.29', rs: 'RS 19.157 a', pg: '162–63',
    lyr: [']šar-ri-iš un-š[i-iš', 'u]n-ši-iš bi-[', 'u]n-ši-iš bi-[', ']šar-ri-i[š un-š[i-iš', 'šar-ri-i[š un-š[i-iš'],
    mus: [[6, [['@', null, 'p]u-gar-nu [']]], [7, [['?', null, 'ti[']]]],
    words: [], note: 'Repetitive text and pugarnu.', west: '' },
  { id: 'h.30', rs: 'RS 19.164 b', pg: '163',
    lyr: [],
    mus: [
      [1, [['zerdum', 1, 'z]i-ir-te']]],
      [2, [['zerdum', null, 'zi-i]r-te', '', 'down', 'Hagel: ir-b]u-te', 'rebutum']]],
      [3, [['?', '5?', ']'], ['zerdum', 2, 'zi-ir-te']]],
      [4, [['titurqablitim', 1, 'ti-]tar-qáb-li'], ['@', null, 'ud-ga[-']]],
      [5, [['?', 3, '-]te'], ['qablitum', null, 'qáb-li-t[e']]],
      [6, [['?', null, ']qáb-li [']]],
      [7, [['?', null, 'qáb-li [']]],
      [8, [['?', '2?', ''], ['@', null, 'mi-i[š-', '', '', 'nīš?']]]
    ],
    colo: { text: '-y]a ŠU[', composer: '…-ya', scribe: '', tuning: '' },
    words: [],
    note: 'zirte durie would be the only qualified dichord without string 7 (f). Hagel looks at Laroche’s copy and suggests reading ir-b]u-te durie instead, so that every qualified term contains f.',
    west: '' },
  { id: 'RS 19.164 n', rs: 'RS 19.164 n', pg: '166', lyr: [], small: true,
    mus: [[1, [['rebutum', null, 'irbute'], ['shalshatum', null, 'šaššate']]]], words: [], note: 'Known here only from West’s string list (Dumbrill prints the copy without a transliteration).', west: '27. 16.' },
  { id: 'RS 19.164 p', rs: 'RS 19.164 p', pg: '167', lyr: [], small: true,
    mus: [[1, [['shalshatum', null, 'šaššate'], ['embubum', null, 'umbube']]]], words: [], note: 'Known here only from West’s string list.', west: '16. 37.' }
];
const FRAG_TERMS = [
  ['ašḫuwe, ašḫue, ašḫuwa', 'Hurrian ašḫ- “high”: “upper”. Always after a term, before its numeral.', [['Laroche; West 1994', 'Hurrian “high, upper”'], ['Dumbrill 2005', 'perhaps an inversion of the pair, or an octave position'], ['West 1994', 'the normal reading, melody on the second string'], ['Hagel 2005', 'the modulated form: f raised to f♯, a pure fourth with b (tentative)']]],
  ['turie, durie', 'Hurrian tur- “low”: “lower”.', [['Laroche; West 1994', 'Hurrian “low, lower”'], ['Dumbrill 2005', 'perhaps an inversion or an octave position'], ['West 1994', 'melody on the first string: 75 lower = 57'], ['Hagel 2005', 'the natural f (tentative)']]],
  ['etamašeani', 'In a term’s place, without a numeral (h.2, h.10, h.20; h.16 and h.27 perhaps).', [['Laroche', 'Hurrianised Ea-banût, “made by Ea”: string 4'], ['West 1994', 'a single string, 4'], ['Dumbrill 2005', 'a change to the fourth string, a passing “tritonisation”']]],
  ['ḫapšema', 'In a term’s place; once with a numeral (h.12).', [['West 1994', 'Hurrianised ḫamšum, “the fifth”: string 5 alone']]],
  ['bentamma, pentamma', 'Without numeral (h.2, h.3, h.4, h.25).', [['West 1994', 'pant- “right hand” (+ -ma, perhaps negative): a fingering'], ['Dumbrill 2005', 'Hurrianised pītum, the tritone pair'], ['Hagel 2005', 'not a modulation sign: it sits beside unqualified šaḫri and irbute']]],
  ['paḫita', 'h.2, before kitme.', [['West 1994', 'paḫ-, a part of the body: the forefinger?'], ['Dumbrill 2005', '“towards the head” of the instrument']]],
  ['kazae, ḫizawaša', 'h.2 and h.4.', [['West 1994', 'kazae has the adverbial suffix -ae'], ['Dumbrill 2005', 'perhaps opposites']]],
  ['pugarna, pugarnu', 'Where a numeral would stand (h.5, h.26, h.29).', [['Hagel 2005', 'one of three structural slots for extra words; meaning unknown']]],
  ['uštamari', 'After 10 on h.6; also h.16, h.17, h.22.', [['Kümmel, in Krispijn 2002', '“not sung”'], ['Vitale 1982', 'the voice enters'], ['Dumbrill 2005', 'a descending scale']]]
];

/* convert a fragment to engine lines; alt readings switched on by Hagel */
function fragLines(f, cfg) {
  const lines = [], nums = [];
  f.mus.forEach(([n, slots], i) => {
    const prev = i ? f.mus[i - 1][0] : null;
    const line = [];
    if (i && n !== prev + 1) line.push(['|', null, 'gap-lines']);
    for (const s of slots) {
      if (s[0] === '|') { line.push(['|', null, 'lacuna']); continue; }
      let k = s[0];
      if (s[6] && cfg && cfg.qual === 'hagel') k = s[6];
      line.push([k, s[1], s[2], undefined, s[4]]);
    }
    lines.push(line); nums.push(n);
  });
  return { lines, nums };
}
/* West 1994: second string of successive terms moving by one step (8, 9 = 1, 2) */
function westSteps(f) {
  let pairs = 0, steps = 0, prev = null;
  f.mus.forEach(([n, slots], i) => {
    if (i && n !== f.mus[i - 1][0] + 1) prev = null;
    for (const s of slots) {
      const D = DICH[s[0]];
      if (!D) { prev = null; continue; }
      const b = D.pair[1];
      if (prev != null) { pairs++; const d = Math.abs(b - prev); if (d === 1 || d === 6) steps++; }
      prev = b;
    }
  });
  return { pairs, steps };
}
function fragStats(f) {
  let p = 0, s = 0, q = 0, qf = 0, special = new Set();
  for (const [, slots] of f.mus) for (const x of slots) {
    const D = DICH[x[0]];
    if (D) { if (D.cls === 'p') p++; else s++; if (x[4]) { q++; if (D.pair.includes(7)) qf++; } }
    else if (x[0][0] === '@') special.add(x[2].replace(/[\[\]˹˺?]/g, '').replace(/^[-x ]+/, ''));
  }
  return { p, s, q, qf, special: [...special] };
}

if (typeof module !== 'undefined') module.exports = { SG, NUMG, parseWords, glyphOf, signName, H6_SPLIT, H6_GLOSS, H6_CLAUSES, COLO_WORDS, FRAG, FRAG_TERMS, fragLines, westSteps, fragStats };
