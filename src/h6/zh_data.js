/* 中文版：数据层的译文（覆盖 engine.js / appx.js 中的英文说明；转写与学者姓名保留原文） */
(() => {
const set = (o, k, v) => { if (o && o[k] !== undefined) o[k] = v; };

/* 弦名（Nabnītu XXXII） */
['', '前弦', '次弦（第二弦）', '第三弦，“细弦”', '第四弦，“小弦”，Ea 所造', '第五弦，“中弦”', '后数第四弦', '后数第三弦', '后数第二弦', '最后一弦'].forEach((v, i) => { if (i) STRING_NAMES[i] = v; });

/* 十四个音对 */
const DG = {
  nish: ['抬起脚跟', '旧读 nīš GABA.RI，“抬起对应者”；Mirelman 与 Krispijn 2009 改读为 nīš tuḫrim。', 'h.6 中未见（h.30 上或有 miš-tuḫri?）'],
  sherum: ['歌、曲调'], ishartum: ['直、正、有序'], shalshatum: ['（第）三'], embubum: ['芦笛'], rebutum: ['（第）四'],
  nidqablim: ['“中间的下抛”'], isqum: ['份、签', '除 Duchesne-Guillemin 在第 5 行补出的 [ešgi] 外，h.6 中未见。'],
  qablitum: ['中间'], titurqablitim: ['中间之桥'], kitmum: ['覆盖、关闭'], titurishartim: ['išartum 之桥'],
  pitum: ['开启', '', '乌加里特未见'], zerdum: ['词义有争议']
};
for (const k in DG) { const d = DICH[k]; if (!d) continue; d.gloss = DG[k][0]; if (DG[k][1]) d.note = DG[k][1]; if (DG[k][2]) d.gib = DG[k][2]; }

/* 各版本 */
const RD = {
  DL: [null, '在泥板上校勘；Thiel、Černý、Krispijn 与 Gibson 所用的底本。'],
  L: [null, 'Ugaritica V，第 463 页。读于 Güterbock 辨认出这些术语之前，是最早几种转谱的依据。'],
  Wu: ['Wulstan 1971（据 Laroche）', 'Wulstan 转谱时所用的 Laroche 1968：他在第 6 行把 “X-X-te” 补作 [šaššate]，并给第 7 行的 tup-pu-nu 一个音；第 5 行未读出的那个术语没有音。'],
  Ki: [null, 'RA 68，图 4。在 D&L 后来读作 ša-aḫ-ri 1 i-šar-te 的地方，她读 ˹ša/ši?-ni?˺（“重复”）。'],
  DG: [null, 'Laroche 1968，加上她的改读 em-bu-be（替代 tup-pu-nu）、第 5 行补出的 [ešgi]（= isqum，弦 1·3）、第 6 行补出的 [šaššate]，以及第 7 行两个残缺数字补作 [1]（见她 1984 年小册子图 9）。'],
  Du: ['Dumbrill 1998/2005（图版 5）', '他本人演绎所用的数字（1998 年著作 2005 年版的图版 5）。他的图 5 在第 7 行印作 šaššate 2 … titimišarte 2，第 10 行以 kitme 4 qablite 4 结束；图版则奏 šaššate 1 … titimišarte 4，并止于 kitme 2。uštamari 为一条下行音阶。'],
  Du14: [null, 'ARAM 26（2014），“Author’s interpretation of H6”：每行 36 个八分音符。第 5 行以 titimišarte 3 结束，uštamari 只标出引子结束；第 10 行只有五个术语。'],
  T: [null, '从 D&L；把 uštamari 分作 uš-ta-ma a-ri。'],
  Kr: [null, '从 D&L，采用胡里语的 -e/-le 词尾。'],
  Gi: [null, 'D&L，并据照片复核：第 8–10 行的 4 或为 5；第 7 行 irbute 为 1[+x]；最后一个数字受损。']
};
for (const k in RD) { const r = READINGS[k]; if (!r) continue; if (RD[k][0]) r.name = RD[k][0]; r.note = RD[k][1]; }

/* 细调 */
set(TEMPER.pyth, 'name', '毕达哥拉斯式（3:2 五度链）');
set(TEMPER.hagelK, 'name', 'Hagel 2005，纯 kitmu（c 在 g 上方 4:3）');
set(TEMPER.hagelE, 'name', 'Hagel 2005，纯 embūbu（c 在 f 上方 3:2；他的 MIDI 文件所用）');
set(TEMPER.hagelM, 'name', 'Hagel 2005，c 取两者之间');

/* 希腊调式名（附原名） */
const GK = { Dorian: '多利亚', Phrygian: '弗里吉亚', Lydian: '吕底亚', Mixolydian: '混合吕底亚', Hypodorian: '副多利亚', Hypophrygian: '副弗里吉亚', Hypolydian: '副吕底亚' };
for (const k in GREEK) GREEK[k] = GK[GREEK[k]] + '（' + GREEK[k] + '）';

/* 音程名：在显示时翻译，内部判断仍用英文名 */
const IV = { 'diatonic semitone': '自然半音', 'large semitone': '大半音', 'minor tone': '小全音', 'pure minor third': '纯律小三度', 'pure major third': '纯律大三度', 'wide minor third': '宽小三度', 'wide fourth (wolf)': '宽四度（狼音）', 'narrow fifth (wolf)': '窄五度（狼音）', 'augmented fourth': '增四度', 'diminished fifth': '减五度', 'pure minor sixth': '纯律小六度', 'pure major sixth': '纯律大六度', 'wide minor sixth': '宽小六度', limma: '小半音（limma）', apotome: '大半音（apotome）', tone: '全音', 'minor third': '小三度', 'ditone (major third)': '双全音（大三度）', 'perfect fourth': '纯四度', 'perfect fifth': '纯五度', 'minor sixth': '小六度', 'major sixth': '大六度', 'minor seventh': '小七度', 'major seventh': '大七度', octave: '八度', interval: '音程' };
const GEN = { unison: '同度', semitone: '半音', tone: '全音', 'minor third': '小三度', 'major third': '大三度', fourth: '四度', tritone: '三全音', fifth: '五度', 'minor sixth': '小六度', 'major sixth': '大六度', 'minor seventh': '小七度', 'major seventh': '大七度', octave: '八度' };
const _iv = intervalOf;
window.intervalOf = function (cfg, k, a, b) { const r = _iv(cfg, k, a, b); if (IV[r.name]) r.name = IV[r.name]; else if (/, tempered$/.test(r.name)) r.name = '折中的' + (GEN[r.name.replace(/, tempered$/, '')] || r.name); return r; };

/* 原谱来源 */
set(PUB.wulstan, 'src', 'Wulstan 1971 的 h.6 转谱（八分音符；Laroche 文本）');
set(PUB.vitale, 'src', 'Vitale 1982，表 XIV（第 5、10 行为 2/4 拍，其余为 3/4 拍）');
set(PUB.dumbrill, 'src', 'Dumbrill 2005，图版 5（其 1998 年著作的第二版）');
set(PUB.dumbrill14, 'src', 'Dumbrill 2014，“Author’s interpretation of H6”（每行 36/8）');
set(PUB.kilmer, 'src', 'Kilmer 1974，图 7–8（二音和弦，一个音节一个）');
PUB.vitale.lines[0][4] = PUB.vitale.lines[0][4].replace('!voice_enters', '!人声进入');
PUB.wulstan.lines[0][4] = PUB.wulstan.lines[0][4].replace('!10_?', '!10_？');
for (const sg of PUB.kilmer.order) sg.lab = sg.lab.replace(/^lyr\. (\d)/, '歌词第 $1 行').replace(/^refrain/, '叠句').replace(/^closing/, '尾句');

/* 各学者预设的说明 */
const BL = {
  wulstan: '第一份五线谱转写，用八分音符，依据 Laroche 的文本。主音对从五度的低音向上走完这个五度，次音对从三度的高音向下走完这个三度，必要时折到弦 8–9；数字表示取几个音，不够时越过这一对弦继续走（titimišarte 4 = g′ f′ e′ d′）。数字 10 他打了问号。他在第 6 行补出 [šaššate]，并给 tup-pu-nu 一个音（e″）。他的原谱第 9 行把 šaḫri 标作“2”，下面却只有一个音。',
  kilmer: '二音和弦，一个音节配一个，音阶从弦 1 向上，数字表示重复次数。各行不按泥板顺序演唱：第 5 行是叠句，承载那三处重复出现的七个音节（其中 titimišarte 10 拆作 5 + 5，是给 “wewa ḫanuku” 的尾句）；第 6–8 行唱歌词第 1、4 行，第 9–10 行唱歌词第 2、3 行（图 7–8）。',
  dg: '从第一根弦走到第二根弦；数字表示在走句末尾来回加几个装饰音（kablite 3：g′ f′ e′ d′ + e′ d′ e′），所以 titimišarte 后的 10 成了一串颤音。她在第 5 行补出 [ešgi]，第 6 行补出 [šaššate]，第 7 行两处补作 [1]（图 9）。节奏作了简化：走句用四分音符，装饰音用八分音符，大致与她的图 11 一致。',
  vitale: '第一个用降序音阶的读法，依据 D&L 文本（他读 IŠARTU 10）。每个数字表示走句铺开的小节数：器乐的第 5 行（直到 išartu 10 中途人声进入）和第 10 行用 2/4 拍，其余每小节三个音节，用 3/4 拍。按他的表 XIV 播放。',
  cerny: '二音和弦重复，依据 D&L 文本；涉及弦 1 或 2 的四、五度在弦 8 或 9 上加八度重叠。',
  west: '降序音阶；数字表示每对弦中第二根弦的重复次数，旋律由第二根弦承载（相邻两个第二弦有 70% 是级进）。弦 1、2 与 8、9 同时发声，低音作为人声旋律。不给节奏：“there is no point in trying to make a performing version”（没有必要去做演奏版本）。',
  dumbrill: '降序的“九声” e″–d′。主音对是从第一根弦起下行的五音走句（qablite = a′ g′ f′ e′ d′；kitme 会降到琴弦以下的 c′），次音对是上行的三音走句；走句音为八分音符，数字每一单位把最后一个音延长两个八分音符。uštamari 是从 d″ 起的下行音阶。按 2005 年版（该书 1998 年初版）的图版 5 播放，图版在第 7、10 行与他自己的图 5 不一致。',
  monzo: '未正式发表的网络读法。低音谱号上的二音和弦（kablite = A + d），每个按数字延长若干个四分音符。',
  krispijn: '降序音阶上的二音和弦重复，uštamari 取 Kümmel 的解释“不唱”。他倾向于认为人声唱的是每个和弦的上方音（Hagel 2005，注 14）。Gibson 说他的音高框架是降序的 A 多利亚；可自行移调。',
  hagel: 'Hagel 自己的演绎：他网站 Music of the Ancient Near East（奥地利科学院）上的 MIDI 文件，每个文件都标有“Copyright Stefan Hagel 1998”，所在网页标注 2006 年。他说这些“by no means intended to represent a reconstruction”（绝非意在代表一种重构），但“can, perhaps, give an idea of the ‘harmonic’ progression”（或许能让人对“和声”进行有点概念）。h.6 他用 D&L 的文本：降序音阶，每对弦作为二音和弦同时发声，弦 1、2 总在低八度由弦 8、9 重叠，数字是时值。读作 10 的那个符号延长七个单位（h.8 上也是如此），uštamari 不发声，最后一个 qablite 延长六个单位。引擎生成的版本与他的 h.6 文件逐个二音和弦完全一致；残片他依据 Laroche 的文本（见附录 B）。2005 年的文章提供的是理论，而不是第二个版本：建立在两个纯律三和弦上的纯律调弦，他的文件用的是其中 c 与 f 成纯五度的那一种（其余几种见“细调”）；数字是重复还是时值，10 是吟诵音还是延长记号，并认为数字的分布不利于时值说；以及 ašḫuwe 表示把 f 升为 f♯，而他的文件并没有这样处理（附录 B 中可选）。',
  dumbrill14: 'ARAM 26（2014）。规则相同，但现在每行都是 36 个八分音符：第 5 行以 titimišarte 3 结束，uštamari 不再演奏，第 7、10 行重新读过。印出来的谱是全音阶的；maqām 的色彩（bayātī、ḥijāz）来自他 2011 年大马士革首演和 2012 年录音时的乐手，谱面上并没有。',
  koitabashi: '不是演奏版本：Koitabashi 没有给出演奏版本（1996：19–20；1998：378–79）。依照希伯来圣经的诵读重音符号（teʿamim）类推，每个术语指一个旋律型，从它的第一根弦开始，到第二根弦结束；数字表示这个旋律型重复几次；他还提出，或许每个词配一个旋律型。起音与终音之间是什么，他没有说，所以本页用级进把旋律型填满（qablite 5–2 = g′ f′ e′ d′）。用升序音阶，因为他依从 Kilmer、Crocker 与 Brown，把 nīd qabli 当作吕底亚；时值是本页设定的。',
  gibson: '只给弦号谱：弦号以 ± 相连，同时或先后弹；数字不作解释。播放时每对弦试听三种方式（a、b、a + b）。'
};
for (const k in BL) if (PRESETS[k]) PRESETS[k].blurb = BL[k];

/* 附录 A：词义 */
const GL = {
  '0.0': '泥板一角约有三个符号断失。',
  '0.4': 'šin- “二”？Krispijn 译作“两个（祭饼）”。',
  '0.7': '第一个符号读作 at? 或 ak?；其余为 ḫu-ur-ni。',
  '0.8': 'taš- “给、献”，加附着代词 -l(la)“他们”：“他们献上”。',
  '0.9': '补出一个符号：ki-il-[l]a。',
  '1.2': 'wandani “右” 加方向格 -ta：“向右（边）”。',
  '1.3': '或为胡里语 ugri “脚”；Thiel 把这一短语译作 “zum rechten Fuß (des göttlichen Thrones)”（至〔神座的〕右脚）。',
  '1.5': '以 -lla（附着代词“他们”）结尾，标志一个分句的开头。',
  '1.10': '第一个符号不确定：ú?-nu-šu。',
  '1.11': '被理解为对女神的称呼，带附着代词 -l(la)。',
  '1.12': 'tad- “爱”，胡里语中可靠的词根：“（他们）爱”。',
  '1.13': 'tiša “心”：Thiel 译作 “in ihrem Herzen lieben”（在心中爱）。',
  '2.3': 'un- “来”？（把握不大）',
  '2.5': 'un- “来”？加 -at（把握不大）',
  '2.7': '芝麻：参看阿卡德语 šamaššammū。Thiel 译作 “Sesam-Öl mögen sie (als Opfer) hinführen”（愿他们献上芝麻油）。',
  '2.9': '以 -al 结尾：新分句的开头。',
  '2.11': 'sa? 加四个无法辨认的符号，然后是 ka。',
  '2.13': 'Nikkal，月神的配偶（乌加里特语 Nkl），这首颂歌的对象。',
  '3.2': '两个符号只存一半：ni-ḫ[u]-r[a]-ša-al。以 -al 结尾：分句开头。',
  '3.3': 'ḫan- “生（孩子）”。',
  '3.4': 'ḫan- “生”：Thiel 译作 “Unfruchtbare(s) mögen sie fruchtbar sein lassen”（愿他们使不育者生育）。',
  '3.5': 'atta(i) “父亲” + ašti “妻子”：已婚的夫妇。Krispijn 译作 “She let the married couples have children”（她让夫妇有了孩子）。',
  '3.8': 'ḫan- “生”。', '3.11': 'ḫan- “生”。',
  '3.9': 'X-zu?-，随后约三个符号缺失，然后是 -aš?-ša-a-ti。',
  '3.10': 'we- 是胡里语第二人称所有格：“你的”？这是按语法的推测，不是编者的释义。'
};
const SRCZH = { 'Hurrian grammar (this page)': '胡里语语法（本页推测）' };
for (const k in GL) if (H6_GLOSS[k]) H6_GLOSS[k] = [H6_GLOSS[k][0], GL[k], SRCZH[H6_GLOSS[k][2]] || H6_GLOSS[k][2]];
const REP = { 'Part of the seven syllables that end l. 1 and open l. 2.': '属于第 1 行末尾、又在第 2 行开头重复的七个音节。', 'End of the repeated group ḫumaruḫat uwari.': '重复音节组 ḫumaruḫat uwari 的结尾。', 'Part of the repeated group kalitanil nikala.': '属于重复音节组 kalitanil nikala。' };
for (const k in H6_GLOSS) { const g = H6_GLOSS[k]; if (REP[g[1]]) H6_GLOSS[k] = [g[0], REP[g[1]], g[2]]; }
H6_GLOSS['2.0'] = H6_GLOSS['1.11']; H6_GLOSS['2.1'] = H6_GLOSS['1.12']; H6_GLOSS['2.2'] = H6_GLOSS['1.13']; H6_GLOSS['3.1'] = H6_GLOSS['2.13'];

const CG = [['annû', '这', '阿卡德语'], ['zammārum', '歌', '阿卡德语 zamārum，“歌”'], ['ša', '……的', '阿卡德语'], ['nīd qablim', '调律（也是主音对）nīd qablim，弦 4·1；中亚述的歌曲目录 KAR 158 也用它来命名一种体裁：irâtu ša nīd qabli（viii 49）', 'CBS 10996；UET VII 74；Koitabashi 1996'], ['zaluzi', '胡里语的一种体裁或称号；h.15 有 zaluzi ša DINGIR.MEŠ，“众神的 ……”', 'Laroche 1968；Dumbrill 2005'], ['…', '残缺：Kilmer 据 h.8、h.11、h.13 补作 [ša DINGIR.MEŠ TA ᵐUrḫiya]', 'Kilmer 1974'], ['ŠU', '“（……之）手”：即书吏', '阿卡德语表意字'], ['Ammurabi', '书吏的名字', 'D&L 1975']];
CG.forEach((c, i) => { if (COLO_GLOSS[i]) COLO_GLOSS[i] = c; });

const TZ = ['至（神座的）右脚', '在心中爱', '愿他们（作为祭品）献上芝麻油', '愿他们使不育者生育', '在碗中备好两个祭饼', '在（你宝座的）右边', '你爱那些前来求庇护的人', '是 Nikkal，她将使他们强壮', '她让夫妇们有了孩子'];
H6_TRANSL.forEach((t, i) => { t[3] = TZ[i]; t[2] = t[2].replace(/^ll?\. /, '第 ') + ' 行'; });

/* 附录 B：残片 */
const FN = {
  'h.2': '左边缘保存完好，各行开头可以对比：h.2 和 h.10 以 nadqabli – šaḫri 开头，h.6 和 h.7 以 qablite – irbute 开头；无一例外，都是先一个主音对（下行五度），再一个次音对（上行三度）。kazae、etamašeani、bentamma、paḫita 四个新术语都出现在这里。Dumbrill 认为 h.2 原本约有 h.6 两倍长。',
  'h.3': '在降序音阶上，šaḫri – zirte 跨越 f–b，是三全音；Dumbrill 把 bentamma 读作胡里化的 pītum，也就是三全音那一对，两者正好呼应。',
  'h.4': '有三处 šaḫri 带修饰词，都是 turie（有一处写作 tu-ti-e）。Dumbrill 印出的转写里还混进了三行与 h.3 完全相同的文字（看来是误抄进来的），所以这里只给乐谱部分。',
  'h.5': 'pugarna 出现在 titarqabli 和 šaḫri ašḫuwa 之后数字的位置上。歌词保存了十七行；Dumbrill 从中读出神庙用语：“主”“欢喜”“众神之家”。',
  'h.7': '开头与 h.6 相同（qablite 3 irbute 1），并有几段走向与 h.6 共用：šaḫri šaššate、nitkibli titarqabli titimišarte、šaššate irbute kitme。乐谱只有四行，歌词也不同，所以不是抄本。题记格式与调律都和 h.6 一样。',
  'h.8': '和 h.6 一样，歌词和乐谱的行尾都保存下来：歌词 13 行，乐谱 7 行。反复出现的 šaḫri – zirte 对应反复出现的叠句；这里还有全部材料中三个 10 里的第二个（zirte 10）。',
  'h.9': '又是重复性很强的歌词，和 h.8 一样。nadqabli – ešgi – titarqabli 在 h.19 上重现。',
  'h.10': '两种修饰词出现在同一块泥板上：šaḫri durie、irbute ašḫue、irbute durie。Hagel 把这里的 nadqabli – šaḫri durie 与 h.6 第 8 行的 nadqabli – šaḫri 相比，把 nadqabli – irbute ašḫue 与 h.6 第 7 行相比，后者只有加上 f♯ 才完全平行。全部材料中的第三个 10 在第 7 行。',
  'h.11': '以歌词为主；MIN 表明书吏遇到重复的短语就省略不写。',
  'h.12': '题记再次确认 nīd qablim。ḫapšema 占了一个术语的位置，后面还带数字，是“单弦术语”说最有力的例子。',
  'h.13': '作曲者和书吏都有名字：“出自 Urḫiya，Ipšali 之手”。Hagel 指出，Ipšali 抄写的泥板都用带修饰词的扩展记谱。',
  'h.14': '第一个术语只剩 “-li”：Dumbrill 补作 titarqabli，West 补作 nadqabli（41）。',
  'h.15': '第三位作曲者 Tapšiḫuni。',
  'h.16': 'uštamari 再次出现，这里在一个术语之前，而不是在 10 之后。]še-a-ni 可能是 etamašeani 的结尾。',
  'h.17': '与 h.6 第 4 行共用 ašti- 和 ḫan-；uštamari 前面（或许）是 umbube。',
  'h.18': '只有歌词。',
  'h.19': 'nitkibli 3 – išgi 1 – titarqabli，与 h.9 完全一样。West 用这里两处带修饰词的 šaḫri 支持他的说法：“upper”（上）就是旋律在通常那根弦上。',
  'h.20': '只保存了四行乐谱的开头。',
  'h.21': '除 h.6 和 h.2 之外乐谱最丰富的一块，几乎没有歌词。nadqabli – titarqabli – titimišarte 是 h.6 第 7 行和 h.7 第 10 行的固定组合；Hagel 指出它后面总是接 titur išartim。',
  'h.22': '同一块泥板的两片（a、b）。uštamari 在这里开启乐谱，正如它在 h.6 结束第 5 行。',
  'h.23': '三次 šaḫri – zirte：与 h.6 第 6、8 行，以及 h.8、h.3 相同的音型。',
  'h.24': '只有歌词。',
  'h.25': '两个以 -li 结尾的术语（qablite？nadqabli？titarqabli？），以及跟在不带修饰词的 irbute 之后的 bentamma；正因如此，Hagel 排除了 bentamma 是转调记号的可能。',
  'h.26': 'pugarnu 出现三次：Hagel 用它作例子，说明非标准注记多的泥板，也是会出现修饰词的泥板。',
  'h.27': '一个数字，或许还有 [etama]šeani。',
  'h.28': 'qablite – titarqabli – qablite：Hagel 所说的“桥” titur qablītim，连接 d 与 b 两个三和弦。',
  'h.29': '重复性的歌词和 pugarnu。',
  'h.30': 'zirte durie 会是唯一一个不含弦 7（f）的带修饰词音对。Hagel 查看 Laroche 的摹本后，建议改读为 ir-b]u-te durie，这样所有带修饰词的术语都含 f。',
  'RS 19.164 n': '这里只能根据 West 的弦号列表收录（Dumbrill 印出了摹本，但没有转写）。',
  'RS 19.164 p': '这里只能根据 West 的弦号列表收录。'
};
const FW = {
  'h.2': ['Teššub-be，“Teššub 的”，这首颂歌献给的风暴神', '两座山，Ekuše 与 Pišaiš（Pišaiš 也是一种木材的名字）', '“河”', '“主”，或许是 Teššub 的称号'],
  'h.4': ['未解释；Dumbrill 把它和 kazae（h.2）看作一对反义词', '或为 ÈŠ.SA “上”（乌加里特的一个表意字），或为 ešgi 的一部分'],
  'h.5': ['“主”', '“欢喜”？', '参看 kinnōr、kinnara “里拉琴”', '参看 zà.mì / sammû，一种竖琴', '占据数字的位置；未解释'],
  'h.8': ['叠句；G. Wilhelm（1995 年口头）：“这傻姑娘（šiduri）爱过”。šiduri 意为“年轻女子”，也是《吉尔伽美什》中那位酒馆女主人的名字'],
  'h.9': ['每行结尾的叠句，开头各不相同'],
  'h.10': ['“Kummi 的女主人”，即 Teššub 的配偶 Ḫebat'],
  'h.11': ['“同上”：书吏把重复的动词省略了'],
  'h.12': ['带数字（2）：或许是单弦，ḫamšum “第五（弦）”'],
  'h.15': ['“众神的 zaluzi”：h.6 中补出的正是这一格式'],
  'h.17': ['参看 ašti “妻子”，同 h.6 第 4 行', '参看 ḫan- “生”，同 h.6 第 4 行'],
  'h.19': ['四行结尾的叠句词'],
  'h.20': ['或为 Teššub'],
  'h.26': ['或为 nīš，CBS 10996 中弦 1·5 的术语，在乌加里特别处未见'],
  'h.27': ['参看 šarri “王”／“神”']
};
const FA = { 'West reads ti[timišarte]': 'West 读作 ti[timišarte]', 'restored by West': 'West 补出', 'West: na-at-qáb]-li': 'West：na-at-qáb]-li', 'šaḫri restored by West': 'šaḫri 为 West 补出', 'the one term in the corpus with no numeral (West 1994, n. 3)': '全部材料中唯一没有数字的术语（West 1994，注 3）', '-li-te: qablite': '-li-te：即 qablite', 'titimišarte or išarte': 'titimišarte 或 išarte', 'nīš?': 'nīš？', 'Hagel: ir-b]u-te': 'Hagel：ir-b]u-te', 'only umbube ends in -be / -bi': '只有 umbube 以 -be / -bi 结尾', 'tup-pu-nu: Laroche’s reading; read um-bu-be since Dietrich & Loretz (h.6 l. 7)': 'tup-pu-nu：Laroche 的读法；自 Dietrich & Loretz（h.6 第 7 行）以来读作 um-bu-be', '-li-te: only qablite ends so': '-li-te：只有 qablite 这样结尾' };
const SRC2 = { 'Dumbrill 2005, after von Brandenstein': 'Dumbrill 2005，据 von Brandenstein', 'Thiel 1977 (for h.6)': 'Thiel 1977（针对 h.6）', 'West 1994, n. 24': 'West 1994，注 24', 'Hagel 2005, n. 117': 'Hagel 2005，注 117', 'cf. Hagel 2005, n. 79': '参看 Hagel 2005，注 79' };
for (const f of FRAG) {
  if (FN[f.id]) f.note = FN[f.id];
  (FW[f.id] || []).forEach((g, i) => { if (f.words[i]) { f.words[i][1] = g; f.words[i][2] = SRC2[f.words[i][2]] || f.words[i][2]; } });
  f.lyr = f.lyr.map(l => l === 'Traces' ? '残迹' : l.replace(/^\(obv\.\) /, '（正面）').replace(/^\(rev\.\) /, '（背面）'));
  for (const [, slots] of f.mus) for (const s of slots) if (s[5] && FA[s[5]]) s[5] = FA[s[5]];
}
if (typeof LAR !== 'undefined') for (const id in LAR) for (const [, slots] of LAR[id].mus) for (const s of slots) if (s[5] && FA[s[5]]) s[5] = FA[s[5]];
QS.up = 'ašḫuwe “上”'; QS.down = 'turie “下”';
const FT = [
  ['胡里语 ašḫ- “高”：“上”。总在术语之后、数字之前。', ['胡里语“高、上”', '或指音对倒转，或指八度位置', '常规读法，旋律在第二根弦上', '转调形式：f 升为 f♯，与 b 成纯四度（试探性）']],
  ['胡里语 tur- “低”：“下”。', ['胡里语“低、下”', '或指倒转，或指八度位置', '旋律在第一根弦上：75 lower = 57', '还原的 f（试探性）']],
  ['占据术语的位置，不带数字（h.2、h.10、h.20；h.16 和 h.27 或许也有）。', ['胡里化的 Ea-banût，“Ea 所造”：弦 4', '单弦，弦 4', '第四弦的变化，一种临时的“三全音化”']],
  ['占据术语的位置；有一次带数字（h.12）。', ['胡里化的 ḫamšum，“第五”：单独的弦 5']],
  ['不带数字（h.2、h.3、h.4、h.25）。', ['pant- “右手”（+ -ma，或为否定）：一种指法', '胡里化的 pītum，三全音那一对', '不是转调记号：它出现在不带修饰词的 šaḫri 和 irbute 旁边']],
  ['h.2，在 kitme 之前。', ['paḫ-，身体的一个部位：食指？', '“朝向（乐器的）头部”']],
  ['h.2 和 h.4。', ['kazae 带有副词后缀 -ae', '或许是一对反义词']],
  ['出现在数字的位置上（h.5、h.26、h.29）。', ['附加词出现的三种结构位置之一；词义不明']],
  ['h.6 上在 10 之后；另见 h.16、h.17、h.22。', ['“不唱”', '人声进入', '一条下行音阶']]
];
FRAG_TERMS.forEach((t, i) => { if (!FT[i]) return; t[1] = FT[i][0]; t[2].forEach((r, j) => { if (FT[i][1][j]) r[1] = FT[i][1][j]; }); });
})();
