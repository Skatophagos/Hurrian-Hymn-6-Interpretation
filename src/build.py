#!/usr/bin/env python3
"""Build ../index.html: one self-contained page holding the English and the
Chinese edition, with a language switch in the masthead.

    python3 src/build.py

h6/ holds the English sources. h6zh/make_zh.py derives the Chinese page,
engine and interface from them (replacement pairs in h6zh/*.py); h6/zh_data.js
translates the data at run time. Both editions go into one file: the chosen
one is inserted from a <template> and its scripts are run; switching reloads
the page in the other language on the same tab (choice kept in localStorage
and ?lang=).
"""
import os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
subprocess.run(['python3', 'h6zh/make_zh.py'], check=True)


def rd(p):
    return open(p, encoding='utf-8').read()


def split(page):
    i = page.index('<style>')
    j = page.index('</style>') + len('</style>')
    return page[:i], page[i + len('<style>'):j - len('</style>')], page[j:]


en_head, en_css, en_body = split(rd('h6/page.html'))
zh_head, zh_css, zh_body = split(rd('h6zh/page.html'))

# fonts: the Chinese link is the English one plus Noto Serif SC
font_link = re.compile(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">')
head = font_link.sub(lambda m: font_link.search(zh_head).group(0), en_head, count=1)

# CSS that differs in the Chinese edition, scoped to html[lang^="zh"]
ZH = 'html[lang^="zh"]'
zh_vars = ''.join(re.search(r'\s(--f-%s:[^;]*;)' % k, zh_css).group(1) for k in ('display', 'text'))
MARK = '/* 中文排版'
extra = zh_css[zh_css.index(MARK):] if MARK in zh_css else ''
# everything else in the Chinese CSS must equal the English CSS apart from the two font variables
check = zh_css.replace(extra, '')
for k in ('display', 'text'):
    pat = r'--f-%s:[^;]*;' % k
    check = re.sub(pat, re.search(pat, en_css).group(0), check, count=1)
assert check.strip() == en_css.strip(), 'Chinese CSS differs from the English CSS in more than the fonts'
extra = re.sub(r'/\*.*?\*/', '', extra, flags=re.S)


def scope(rule):
    sel, body = rule.group(1), rule.group(2)
    return ','.join(ZH + ' ' + s.strip() for s in sel.split(',')) + '{' + body + '}'


zh_rules = re.sub(r'([^{}]+)\{([^{}]*)\}', scope, extra.strip())
css =en_css + '\n/* Chinese edition */\n' + ZH + '{' + zh_vars + '}\n' + zh_rules + '\n' + '''
/* Language switch */
.langbar{display:flex;justify-content:flex-end;margin-top:-12px;margin-bottom:10px}
.langsw{display:inline-flex;border:1px solid var(--rule);border-radius:7px;overflow:hidden;background:var(--panel)}
.langsw button{font-family:var(--f-text);font-size:14px;line-height:1.2;padding:5px 12px;border:0;background:transparent;color:var(--ink2);cursor:pointer}
.langsw button[lang="zh-Hans"]{font-family:"Noto Serif SC","Songti SC","SimSun",serif}
.langsw button+button{border-left:1px solid var(--rule)}
.langsw button[aria-pressed="true"]{background:var(--ink);color:var(--panel);cursor:default}
.langsw button:focus-visible{outline:2px solid var(--lapis);outline-offset:-2px}
'''

SWITCH = ('\n  <div class="wrap langbar"><div class="langsw" role="group" aria-label="Language · 语言">'
          '<button type="button" data-lang="en" lang="en">English</button>'
          '<button type="button" data-lang="zh" lang="zh-Hans">中文</button></div></div>')
MAST = '<header class="mast">'
for b in (en_body, zh_body):
    assert b.count(MAST) == 1
en_body = en_body.replace(MAST, MAST + SWITCH)
zh_body = zh_body.replace(MAST, MAST + SWITCH)

BOOT = '''<script>
(function () {
  var L = null;
  try { var q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'zh') L = q; } catch (e) {}
  if (!L) { try { var s = localStorage.getItem('h6-lang'); if (s === 'en' || s === 'zh') L = s; } catch (e) {} }
  if (!L) L = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
  try { localStorage.setItem('h6-lang', L); } catch (e) {}
  window.H6_LANG = L;
  document.documentElement.lang = L === 'zh' ? 'zh-Hans' : 'en';
  if (L === 'zh') document.title = %s;
})();
</script>''' % repr(re.search(r'<title>(.*?)</title>', zh_head).group(1)).replace("'", '"')

FILES = {
    'en': [('J-en-engine', 'h6/engine.js'), ('J-appx', 'h6/appx.js'), ('J-lar', 'h6/lar.js'), ('J-en-ui', 'h6/ui.js')],
    'zh': [('J-zh-engine', 'h6zh/engine.js'), ('J-appx', 'h6/appx.js'), ('J-lar', 'h6/lar.js'),
           ('J-zh-data', 'h6/zh_data.js'), ('J-zh-ui', 'h6zh/ui.js')],
}
blocks, seen = [], set()
for lang in ('en', 'zh'):
    for sid, path in FILES[lang]:
        if sid in seen:
            continue
        seen.add(sid)
        src = rd(path)
        assert '</script' not in src.lower() and '<!--' not in src, path
        blocks.append('<script type="text/plain" id="%s">\n%s\n</script>' % (sid, src))

LOADER = '''<script>
(function () {
  var L = window.H6_LANG === 'zh' ? 'zh' : 'en';
  var tpl = document.getElementById('L-' + L);
  tpl.parentNode.insertBefore(tpl.content.cloneNode(true), tpl);
  ['L-en', 'L-zh'].forEach(function (id) { var t = document.getElementById(id); t.parentNode.removeChild(t); });
  Array.prototype.forEach.call(document.querySelectorAll('.langsw button'), function (b) {
    var on = b.getAttribute('data-lang') === L;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.addEventListener('click', function () {
      if (on) return;
      var to = b.getAttribute('data-lang');
      try { localStorage.setItem('h6-lang', to); } catch (e) {}
      var u = location.href.replace(/#.*$/, ''), h = location.hash;
      u = /[?&]lang=/.test(u) ? u.replace(/([?&]lang=)[^&]*/, '$1' + to) : u + (u.indexOf('?') < 0 ? '?' : '&') + 'lang=' + to;
      location.replace(u + h);
    });
  });
  %s.forEach(function (id) {
    var s = document.createElement('script');
    s.text = document.getElementById(id).textContent;
    document.body.appendChild(s);
  });
})();
</script>'''
loader = LOADER % ('(L === "zh" ? %s : %s)' % ([s for s, _ in FILES['zh']], [s for s, _ in FILES['en']]))

out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
       + BOOT + '\n' + head.strip() + '\n<style>' + css + '</style>\n</head>\n<body>\n'
       + '<template id="L-en">' + en_body + '</template>\n'
       + '<template id="L-zh">' + zh_body + '</template>\n'
       + '\n'.join(blocks) + '\n' + loader + '\n</body>\n</html>\n')
open('../index.html', 'w', encoding='utf-8').write(out)
print('index.html', len(out.encode('utf-8')), 'bytes')
