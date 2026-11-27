/* Laroche's transliterations of the notation on the other Hurrian pieces:
   h.2–h.5 from PRU III (1955), 329–32; h.6–h.30 from Ugaritica V (1968), 462–76.
   Same slot format as FRAG: [key, numeral, transliteration as printed, , qualifier, note, Hagel-2005 key].
   Laroche's spellings are kept (kab, kib, tup-pu-nu). A term is identified only where the
   preserved signs leave one candidate; otherwise it is '?'. Line entries may carry a display label. */
const LA_BI = 'only umbube ends in -be / -bi';
const LA_TUP = 'tup-pu-nu: Laroche’s reading; read um-bu-be since Dietrich & Loretz (h.6 l. 7)';
const LA_LITE = '-li-te: only qablite ends so';
const LAR = {
  'h.2': { src: 'Laroche 1955', ref: 'PRU III, 329', mus: [
    [21, [['nidqablim', 2, 'na-at-kab-li'], ['sherum', null, 'ša-aḫ-[ri']]],
    [22, [['titurqablitim', 1, 'ti-ti-ir-kab-li'], ['?', null, 'ti-[']]],
    [23, [['titurqablitim', 1, 'ti-ti-ir-kab-li'], ['?', null, 'ti-[']]],
    [24, [['titurishartim', 2, 'ti-ti-mi-šar-te'], ['zerdum', null, 'z[i-ir-te']]],
    [25, [['rebutum', 1, 'ir-bu-te'], ['@', null, 'ka-za-e [']]],
    [26, [['qablitum', 1, 'kab-li-te'], ['isqum', 1, 'eš-gi']]],
    [27, [['@', null, 'e-ta-ma(-?)še-a-ni [']]],
    [28, [['kitmum', 2, 'ki-it-me'], ['?', null, 'ti-ti-[x']]],
    [29, [['titurishartim', 2, 'ti-ti-mi-šar-te'], ['?', null, 'za-[']]],
    [30, [['zerdum', 1, 'zi-ir-te'], ['sherum', null, 'ša-aḫ-[ri']]],
    [31, [['@', null, 'be-en-ta-ma'], ['qablitum', null, 'kab-l[i']]],
    [32, [['@', null, 'pá-ḫi-ta'], ['kitmum', null, 'ki-it-[me']]]
  ] },
  'h.3': { src: 'Laroche 1955', ref: 'PRU III, 330', mus: [
    [7, [['sherum', 2, ']ša-aḫ-ri'], ['zerdum', null, 'z[i?']]],
    [8, [['@', null, '] be-en-ta-am-ma [']]],
    [9, [['?', null, ']a?-ri']]]
  ] },
  'h.4': { src: 'Laroche 1955', ref: 'PRU III, 331', mus: [
    [1, [['sherum', null, ']ša-aḫ-ri tú[-ri-e', '', 'down']]],
    [3, [['?', '5?', ']'], ['nidqablim', 5, 'na-at-kab-li'], ['?', null, 'ḫ[']]],
    [4, [['?', '1?', ']'], ['sherum', 1, 'ša-aḫ-ri tú-ri-e', '', 'down'], ['?', null, 'x[']]],
    [5, [['?', null, ']x'], ['titurishartim', 1, 'ti-ti-i-šar-te'], ['zerdum', null, 'z[i?']]],
    [6, [['?', null, ']x'], ['sherum', null, 'ša-aḫ-ri tú-ri-e [', '', 'down']]],
    [7, [['sherum', null, 'š]a-aḫ-r[i']]],
    [9, [['@', 2, ']gi-eš-ša'], ['?', null, 'x x[']], 'Vo 2']
  ] },
  'h.5': { src: 'Laroche 1955', ref: 'PRU III, 332', mus: [
    [18, [['shalshatum', 3, ']ša-ša-te'], ['rebutum', null, 'ir-bu-te['], ['|'], ['?', null, ']me-x[ ]x'], ['nidqablim', null, 'na-at[-kab-li?']]],
    [19, [['titurqablitim', null, ']-tar-kab-li'], ['@', null, 'pu-gár-na'], ['?', null, 'ti-x [']]],
    [20, [['sherum', null, 'ša-aḫ-]ri aš-ḫu-wə', '', 'up'], ['@', null, 'pu-gár-[na']]],
    [21, [['?', 2, ']-te'], ['shalshatum', 3, 'ša-ša-te'], ['?', null, 'x [']]],
    [22, [['@', null, 'p]u-gár-na']]]
  ] },
  'h.7': { src: 'Laroche 1968', ref: 'Ugaritica V, 465', mus: [
    [7, [['@', null, 'az-za-mi-ra'], ['@', null, 'be-ni-[']]],
    [8, [['qablitum', 3, 'kab-li-te'], ['rebutum', 1, 'ir-bu-te']]],
    [9, [['sherum', 1, 'ša-aḫ-ri'], ['shalshatum', '2?', 'ša-aš-ša-t[e]'], ['?', null, 'ša-[']]],
    [10, [['nidqablim', 4, 'ni-[i]t-kib-li'], ['titurqablitim', 1, 'ti-tar-kab-li'], ['?', null, 'ti-t[i?-']]],
    [11, [['shalshatum', 2, 'ša-aš-ša-te'], ['rebutum', 3, 'ir-bu-te'], ['kitmum', 1, 'ki-it-me']]]
  ] },
  'h.8': { src: 'Laroche 1968', ref: 'Ugaritica V, 466', mus: [
    [14, [['?', 2, '-t]e?'], ['sherum', 2, 'ša-aḫ-ri'], ['zerdum', '[x]', 'zi-ir-te']]],
    [15, [['sherum', 2, 'ša-]aḫ-ri'], ['zerdum', 2, 'zi-ir-te'], ['sherum', '2?', 'ša-aḫ-ri']]],
    [16, [['zerdum', 1, 'zi-ir-]te'], ['rebutum', 1, 'ir-bu-te'], ['shalshatum', 2, 'ša-aš-ša-te']]],
    [17, [['nidqablim', 1, '] na-at-kab-li']]],
    [18, [['zerdum', 10, 'zi-i]r-te'], ['sherum', 3, 'ša-aḫ-ri']]],
    [19, [['?', 4, ']'], ['|'], ['?', '2?', ']'], ['shalshatum', 3, 'ša-aš-ša-te']]],
    [20, [['?', null, ']x-x['], ['embubum', 1, '-]bi', '', '', LA_BI], ['rebutum', 1, 'ir-bu-te']]]
  ] },
  'h.9': { src: 'Laroche 1968', ref: 'Ugaritica V, 466', mus: [
    [7, [['nidqablim', 3, 'na-a]t-kab-li'], ['isqum', 1, 'iš-gi'], ['titurqablitim', null, 'ti-ta[r-kab-li']]],
    [8, [['?', null, '] x x'], ['sherum', 1, 'ša-aḫ-ri'], ['?', null, 'x [']]]
  ] },
  'h.10': { src: 'Laroche 1968', ref: 'Ugaritica V, 467', mus: [
    [5, [['nidqablim', 2, 'n[a-a]t-kab-li'], ['sherum', null, 'ša-aḫ-ri du-ri-[e', '', 'down']]],
    [6, [['nidqablim', 1, '[na-at]-kab-li'], ['rebutum', '1?', 'ir-bu-te aš-ḫu-e', '', 'up']]],
    [7, [['?', 10, '] x'], ['titurishartim', 2, 'ti-ti-i-šar-te'], ['zerdum', null, 'zi-[ir-te?']]],
    [8, [['?', 2, '-]te'], ['rebutum', null, 'ir-bu-te du-[ri-e', '', 'down']]],
    [9, [['?', 2, ']du-ri-e'], ['?', null, 'ša-[']]],
    [10, [['?', 2, ']'], ['@', null, 'e-ta-m[a-']]],
    [11, [['titurqablitim', null, 'ti-ta]r-kab-l[i']]]
  ] },
  'h.11': { src: 'Laroche 1968', ref: 'Ugaritica V, 467', mus: [
    [8, [['rebutum', null, ']ir-b[u-te']], '8′']
  ] },
  'h.12': { src: 'Laroche 1968', ref: 'Ugaritica V, 468', mus: [
    [1, [['?', '1?', ']'], ['titurishartim', null, 'ti-ti[-mi-šar-te']], 'Vo 1'],
    [2, [['?', 1, '-]te'], ['shalshatum', null, 'ša-aš-[ša-te']], 'Vo 2'],
    [3, [['embubum', 2, ']x-be', '', '', LA_BI], ['rebutum', null, 'ir-bu[-te']], 'Vo 3'],
    [4, [['@', 2, ']-še-ma'], ['?', null, 'x [']], 'Vo 4']
  ] },
  'h.13': { src: 'Laroche 1968', ref: 'Ugaritica V, 468', mus: [
    [1, [['?', 2, ']-te'], ['sherum', 2, '[ša?-aḫ?-r]i? aš-ḫu-wə', '', 'up'], ['?', null, 'x [']]],
    [2, [['titurqablitim', 2, 'ti-t]ar-kab-li'], ['kitmum', 2, 'ki-it-mi']]]
  ] },
  'h.14': { src: 'Laroche 1968', ref: 'Ugaritica V, 469', mus: [
    [9, [['?', 1, ']-li'], ['kitmum', 1, 'ki-it-mi']]],
    [10, [['rebutum', 1, 'ir-b]u-te'], ['nidqablim', null, 'na-at-kab-li [']]]
  ] },
  'h.15': { src: 'Laroche 1968', ref: 'Ugaritica V, 469', mus: [
    [1, [['sherum', null, 'š]a-aḫ-[ri']], 'Vo 1']
  ] },
  'h.16': { src: 'Laroche 1968', ref: 'Ugaritica V, 469–70', mus: [
    [8, [['shalshatum', 1, 'š]a-aš-ša-te']]],
    [9, [['zerdum', 1, 'z]i-ir-te']]],
    [10, [['?', null, ']x-ri'], ['rebutum', 'x', 'ir-bu-te']]],
    [11, [['?', 4, ']x']]],
    [12, [['nidqablim', 5, 'na-]at-kab-li']]],
    [13, [['?', '1?', ']'], ['isqum', 1, 'eš-gi']]],
    [14, [['titurishartim', 1, 'ti-ti-]i-šar-te']]],
    [15, [['@', null, ']x be-ni-in-ni-ma']]],
    [16, [['@', null, ']x še-a-ni ak-ki-im']]]
  ] },
  'h.17': { src: 'Laroche 1968', ref: 'Ugaritica V, 470', mus: [
    [6, [['embubum', null, ']x-be?', '', '', LA_BI], ['@u', null, '[uš-t]a-ma-a-r[i]']]]
  ] },
  'h.19': { src: 'Laroche 1968', ref: 'Ugaritica V, 471', mus: [
    [6, [['nidqablim', 3, 'ni-i]t-kib-li'], ['isqum', 1, 'iš-gi'], ['titurqablitim', null, 'ti-tar-kab-li [']]],
    [7, [['?', 1, ']x'], ['zerdum', 5, 'zi-ir-te'], ['sherum', null, 'ša-aḫ-ri aš-[ḫu-wə', '', 'up']]],
    [8, [['?', 2, ']x'], ['rebutum', 2, 'ir-bu-te'], ['embubum', null, 'dup-pu-n[u]', '', '', LA_TUP]]],
    [9, [['?', 1, 'aš-ḫ]u-wə'], ['zerdum', 1, 'zi-ir-te'], ['?', null, 'x [']]],
    [10, [['?', null, ']x-li']]]
  ] },
  'h.20': { src: 'Laroche 1968', ref: 'Ugaritica V, 472', mus: [
    [13, [['rebutum', null, '] ir-bu-te [']]],
    [14, [['shalshatum', null, '] ša-aš-ša-te [']]],
    [15, [['?', '1?', ']'], ['rebutum', null, 'ir-bu-te [']]],
    [16, [['?', null, '] x ta-x [']]]
  ] },
  'h.21': { src: 'Laroche 1968', ref: 'Ugaritica V, 472', mus: [
    [2, [['?', '2?', ']'], ['rebutum', null, 'ir-bu-t[e']]],
    [3, [['?', 1, '] x'], ['rebutum', null, 'ir-bu-te [']]],
    [4, [['titurishartim', 1, 'ti-ti]-i-šar-te'], ['shalshatum', null, 'ša-aš-ša[-te'], ['?', null, ']x[']]],
    [5, [['shalshatum', 2, ']ša-aš-ša-te'], ['rebutum', '[x]', 'ir-bu-te'], ['shalshatum', null, 'ša-aš-ša-te [']]],
    [6, [['nidqablim', null, 'n]a-at-kab-li'], ['titurqablitim', 2, 'ti-tar-kab-li'], ['titurishartim', null, 'ti-ti-[i-šar-te']]],
    [7, [['rebutum', 1, 'ir-b]u-te'], ['shalshatum', 1, 'ša-aš-ša-te'], ['embubum', 1, 'tup-pu-nu', '', '', LA_TUP]]],
    [8, [['shalshatum', 1, 'š]a-aš-ša-te'], ['embubum', null, 'tup-p[u-nu', '', '', LA_TUP]]]
  ] },
  'h.22': { src: 'Laroche 1968', ref: 'Ugaritica V, 473', mus: [
    [5, [['@u', null, 'uš-]ta-ma-a-ri [']]],
    [6, [['?', 4, '-]ri']]],
    [7, [['sherum', 1, ']ša-aḫ-ri']]],
    [8, [['rebutum', null, '] ir-bu-t[e'], ['|'], ['?', 1, ']'], ['qablitum', 3, 'kab-li-te']]],
    [9, [['qablitum', 1, '-l]i?-te', '', '', LA_LITE], ['?', null, 'š[a?-'], ['|'], ['?', 1, '-t]e?'], ['qablitum', 1, 'kab-li-[t]e']]]
  ] },
  'h.23': { src: 'Laroche 1968', ref: 'Ugaritica V, 473', mus: [
    [2, [['nidqablim', 4, 'na-a]t-kab-li']]],
    [3, [['sherum', 1, 'š]a-aḫ-ri'], ['zerdum', null, 'z[i-ir-te']]],
    [4, [['sherum', 2, 'š]a-aḫ-ri'], ['zerdum', null, 'z[i-ir-te']]],
    [5, [['rebutum', 1, ']ir-bu-te'], ['nidqablim', null, 'na-a[t-kab-li']]],
    [6, [['sherum', 2, 'ša-]aḫ-ri'], ['zerdum', null, 'zi[-ir-te']]],
    [7, [['nidqablim', null, 'na-a]t-kab-l[i']]]
  ] },
  'h.25': { src: 'Laroche 1968', ref: 'Ugaritica V, 474', mus: [
    [15, [['?', '1?', ']x-li']]],
    [16, [['rebutum', 1, '[i]r-bu-te']]],
    [17, [['@', null, 'be-en-ta[-am-ma']]]
  ] },
  'h.26': { src: 'Laroche 1968', ref: 'Ugaritica V, 474', mus: [
    [4, [['shalshatum', null, 'ša-a]š-ša-t[e']], 'Vo 4'],
    [10, [['@', null, 'pu-]gàr-nu ḫé-x[']]],
    [11, [['@', null, ']im?-za-aḫ[-']]],
    [12, [['?', '1?', ']'], ['titurqablitim', null, 'ti-tar-ka[b-li']]],
    [13, [['?', null, '-]šar-te'], ['@', null, 'pu-[gàr-nu']]],
    [14, [['@', null, ']x mi-iš[-']]],
    [15, [['@', null, 'p]u-gàr-nu']]],
    [16, [['nidqablim', null, 'n]a-at-kib-l[i']]]
  ] },
  'h.27': { src: 'Laroche 1968', ref: 'Ugaritica V, 475', mus: [
    [12, [['?', 4, '-t]e?']]]
  ] },
  'h.28': { src: 'Laroche 1968', ref: 'Ugaritica V, 475', mus: [
    [5, [['qablitum', 1, 'ka]b-li-te']]],
    [6, [['titurqablitim', 1, 'ti-ta]r-kab-li']]],
    [7, [['qablitum', 1, ']kab-li-te']]],
    [8, [['sherum', null, '] ša-aḫ-[ri'], ['|'], ['embubum', 1, 'tup]-pu-nu', '', '', LA_TUP], ['rebutum', 1, 'ir-bu-te']]]
  ] },
  'h.29': { src: 'Laroche 1968', ref: 'Ugaritica V, 476', mus: [
    [6, [['@', null, 'p]u-gàr-nu [']]],
    [7, [['?', null, ']ti[']]]
  ] },
  'h.30': { src: 'Laroche 1968', ref: 'Ugaritica V, 476', mus: [
    [1, [['zerdum', 1, 'z]i-ir-te']]],
    [2, [['zerdum', null, 'zi-i]r-te du-ri-e [', '', 'down', 'Hagel: ir-b]u-te', 'rebutum']]],
    [3, [['?', '5?', ']'], ['zerdum', 2, 'zi-ir-te']]],
    [4, [['titurqablitim', 1, 'ti-]tar-kab-li'], ['@', null, 'ud-ga[-']]],
    [5, [['?', 3, '-]te'], ['qablitum', null, 'kab-li-t[e']]],
    [6, [['?', null, '] kab-li [']]],
    [7, [['?', null, '] kab-li [']]],
    [8, [['?', '2?', ']'], ['@', null, 'mi-i[š-']], 'Vo 8']
  ] }
};
if (typeof module !== 'undefined') module.exports = Object.assign(module.exports || {}, { LAR });
