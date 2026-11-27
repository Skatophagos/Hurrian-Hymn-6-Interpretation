#!/bin/bash
cd "$(dirname "$0")"
{ cat page.html; echo '<script>'; cat engine.js; echo '</script>'; echo '<script>'; cat ../h6/appx.js; echo '</script>'; echo '<script>'; cat ../h6/lar.js; echo '</script>'; echo '<script>'; cat ../h6/zh_data.js; echo '</script>'; echo '<script>'; cat ui.js; echo '</script>'; } > ../hurrian-h6-zh.html
python3 - <<'PY'
s=open('../hurrian-h6-zh.html',encoding='utf-8').read()
i=s.index('</style>')+len('</style>')
head=s[:i]; rest=s[i:]
out='<!doctype html>\n<html lang="zh-Hans">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+head+'\n</head>\n<body>\n'+rest+'\n</body>\n</html>\n'
open('../index-zh.html','w',encoding='utf-8').write(out)
PY
ls -la ../hurrian-h6-zh.html ../index-zh.html
