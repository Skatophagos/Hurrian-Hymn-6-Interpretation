# regenerate the Chinese sources from the English ones, then build
import subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
subprocess.run(['python3', 'page_tr.py', '../h6/page.html', 'page.html'], check=True)
s = open('../h6/engine.js', encoding='utf-8').read()
for a, b in [("label: 'voice enters'", "label: '人声进入'"), ("label: 'l. ' + LINE_NUMS[li]", "label: '第 ' + LINE_NUMS[li] + ' 行'"),
             ("label: 'l. ' + sp.line", "label: '第 ' + sp.line + ' 行'"), ("!x.label.startsWith('closing')", "!(x.label.startsWith('closing') || x.label.startsWith('尾句'))")]:
    assert s.count(a) == 1, a; s = s.replace(a, b)
open('engine.js', 'w', encoding='utf-8').write(s)
s = open('../h6/ui.js', encoding='utf-8').read()
P = []
for f in ['ui_p1', 'ui_p2', 'ui_p3', 'ui_p4', 'ui_p5']:
    ns = {}; exec(open(f + '.py', encoding='utf-8').read(), ns); P += ns['P']
P += [("<b>${esc(title)}.</b> ${esc(blurb)}", "<b>${esc(title)}。</b>${esc(blurb)}"),
      ("  'Editions and collations': [", "  '版本与校勘': ["), ("  'Babylonian theory texts': [", "  '巴比伦乐理文献': ["),
      ("  'Readings of the notation': [", "  '记谱的各家读法': ["), ("  'Music at Ugarit': [", "  '乌加里特的音乐': ["), ("  'Analysis and critique': [", "  '分析与批评': [")]
miss = []
for a, b in P:
    if a not in s: miss.append(a[:100]); continue
    s = s.replace(a, b)
open('ui.js', 'w', encoding='utf-8').write(s)
known = {"cycling = false; $('#cycleBtn').textContent = 'Play the whole cycle'; }, t));", "`<b>${esc(title)}.</b> ${esc(blurb)}`"}
real = [m for m in miss if not any(m.startswith(k[:100]) for k in known) and 'joined to the previous word' not in m and "S.sound ? 'Sound on'" not in m]
print('ui pairs', len(P), 'unexpected misses:', real)
subprocess.run(['bash', 'build_zh.sh'], check=True)
