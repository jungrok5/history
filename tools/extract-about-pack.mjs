// One-off: extract about/index.html inline T + LX + FACTS + REGION into
// i18n/about/<ko|en>.json — the translation template (en) + reference (ko).
// Other languages are created by translating en.json and dropping it in i18n/about/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'about/index.html'), 'utf8');

function sliceLiteral(src, marker, open, close) {
  const i = src.indexOf(marker); const o = src.indexOf(open, i);
  let d = 0, j = o;
  for (; j < src.length; j++) { if (src[j] === open) d++; else if (src[j] === close) { d--; if (!d) { j++; break; } } }
  return Function('"use strict";return (' + src.slice(o, j) + ')')();
}
const T = sliceLiteral(html, 'const T = {', '{', '}');
const LX = sliceLiteral(html, 'const LX = {', '{', '}');
const FACTS = sliceLiteral(html, 'const FACTS = [', '[', ']');
const REGION = sliceLiteral(html, 'const REGION = {', '{', '}');

const META = {
  ko: { menuName: '한국어', htmlLang: 'ko', dir: 'ltr', locale: 'ko-KR',
        docTitle: '모든 민족과 방언에게 · 한눈에 보는 성경 이야기',
        metaDesc: '복음이 모든 방언에 닿는 길 — 한 이야기를 여러 언어로 옮기며 마주한 진귀한 사실들과 번역 현황.' },
  en: { menuName: 'English', htmlLang: 'en', dir: 'ltr', locale: 'en-US',
        docTitle: 'To Every Tribe and Tongue · Bible in One Scroll',
        metaDesc: 'How the gospel reaches every tongue — rare facts and translation reach gathered while carrying one story into many languages.' },
};

for (const lang of ['ko', 'en']) {
  const s = {};
  for (const k in T) if (T[k] && T[k][lang] != null) s[k] = T[k][lang];
  for (const k in LX) if (LX[k] && LX[k][lang] != null) s[k] = LX[k][lang];
  for (const r in REGION) if (REGION[r] && REGION[r][lang] != null) s['region.' + r] = REGION[r][lang];
  const facts = FACTS.map(f => {
    const o = { tag: f.tag[lang], h: f.h[lang], p: f.p[lang] };
    if (f.multi != null) o.multi = f.multi;
    return o;
  });
  const pack = { ...META[lang], s, facts };
  fs.writeFileSync(path.join(root, 'i18n/about', lang + '.json'), JSON.stringify(pack, null, 1) + '\n');
  console.log(`i18n/about/${lang}.json — ${Object.keys(s).length} strings · ${facts.length} facts`);
}
