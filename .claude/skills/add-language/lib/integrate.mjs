#!/usr/bin/env node
// 언어를 index.html + build-pages.mjs 에 통합.  사용법: node integrate.mjs <config.json> [repoRoot]
// 모든 삽입 지점을 한 번에 처리해 누락을 방지한다(hreflang/LANGS/YV/BOOKS/BOOKOPT/build-pages).
// config 예시는 같은 폴더의 config.example.json 참고.
import fs from 'fs';
import path from 'path';

const cfgPath = process.argv[2];
const root = process.argv[3] || process.cwd();
if (!cfgPath) { console.error('usage: node integrate.mjs <config.json> [repoRoot]'); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const p = (f) => path.join(root, f);
const { code, native, en, yv, dir = 'ltr', locale, after, bookopt, font = null } = cfg;
for (const k of ['code','native','en','yv','locale','after','bookopt']) if (cfg[k] == null) { console.error('config 누락: ' + k); process.exit(2); }

const pack = JSON.parse(fs.readFileSync(p(`i18n/${code}.json`), 'utf8'));

// ---- BOOKS 사전: 전체(typed) + 콘텐츠에서 byte-exact 추출 ----
const dict = {};
for (const [k, v] of Object.entries(cfg.books_single || {})) dict[k] = v;
for (const [b, mp] of Object.entries(cfg.books_numbered || {})) for (const [num, u] of Object.entries(mp)) dict[num + ' ' + b] = u;

const strip = (s) => s.replace(/[‌‍]/g, ''); // ZWNJ/ZWJ 제거(정규화)
const singleNorm = {}; for (const [k, v] of Object.entries(cfg.books_single || {})) singleNorm[strip(k)] = v;
const numberedNorm = {}; for (const [b, mp] of Object.entries(cfg.books_numbered || {})) numberedNorm[strip(b)] = mp;
function resolve(name) {
  const mm = name.match(/^([1-3])\s+(.+)$/);
  if (mm) return (numberedNorm[strip(mm[2])] || {})[mm[1]] || null;
  return singleNorm[strip(name)] || null;
}

// 콘텐츠 전부 모아 "인용 토큰" 추출
let blob = [];
pack.epochs.forEach(e => blob.push(e.cite));
pack.core.forEach(c => blob.push(c.vref));
pack.mis.forEach(m => { if (m) blob.push(m.t); });
Object.keys(pack.s).forEach(k => blob.push(pack.s[k]));
const text = blob.join('\n');
const tokRe = /(?:([1-3])\s+)?([\p{L}‌‍][\p{L}\p{M}‌‍ ]*?)\s+\d+\s*[:.]\s*\d+/gu;
let m, used = new Set();
while ((m = tokRe.exec(text))) used.add((m[1] ? m[1] + ' ' : '') + m[2].trim());
const unresolved = [];
for (const nm of used) { const u = resolve(nm); if (!u) { unresolved.push(nm); continue; } dict[nm] = u; }
if (unresolved.length) console.error('⚠ 미해결 토큰(대부분 앞 절 숫자로 인한 오탐 — 무시 가능): ' + JSON.stringify(unresolved));

// ---- 구절-링크 데이터를 팩에 동봉 (books/yv/bookopt). index.html 에는 ko/en 만 인라인 ----
pack.books = dict;
pack.yv = yv;
pack.bookopt = bookopt;
fs.writeFileSync(p(`i18n/${code}.json`), JSON.stringify(pack, null, 1));

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
// index.html LANGS is the SINGLE SOURCE for the language list — incl. locale (+ dir for rtl),
// which build-pages now parses from here (no separate build-pages LANGS array).
const langEntry = `{code:'${code}',native:'${esc(native)}',en:'${esc(en)}',locale:'${locale}'${dir === 'rtl' ? ",dir:'rtl'" : ''}}`;

// ---- index.html 패치 ----
let h = fs.readFileSync(p('index.html'), 'utf8');
if (new RegExp(`hreflang="${code}"`).test(h)) { console.error('이미 통합됨(hreflang=' + code + ') — 중단'); process.exit(1); }
function must(cond, msg) { if (!cond) { console.error('패치 실패: ' + msg); process.exit(1); } }

// 1) hreflang — 마지막 hreflang 링크 뒤
const hrefRe = /<link rel="alternate" hreflang="[^"]+" href="[^"]+" \/>\n/g;
let lastHref = null, mm; while ((mm = hrefRe.exec(h))) lastHref = mm;
must(lastHref, 'hreflang 블록 못 찾음');
const insAt = lastHref.index + lastHref[0].length;
h = h.slice(0, insAt) + `<link rel="alternate" hreflang="${code}" href="https://one-scroll-bible.com/${code}/" />\n` + h.slice(insAt);

// 2) LANGS(index.html) — after 코드 엔트리 뒤
const afterEntryRe = new RegExp(`(\\{code:'${after}'[^}]*\\})`);
must(afterEntryRe.test(h), `LANGS에서 after='${after}' 엔트리 못 찾음`);
h = h.replace(afterEntryRe, `$1,\n ${langEntry}`);

fs.writeFileSync(p('index.html'), h);

// ---- tools/build-pages.mjs 패치 ----
// LANGS 는 더 이상 build-pages 에 없다(index.html 단일 출처에서 파싱). 여기선 폰트 맵만 패치.
let b = fs.readFileSync(p('tools/build-pages.mjs'), 'utf8');

// 폰트(비-라틴/키릴 스크립트만) — FONT_TITLE / FONT_SUB / letter-spacing
if (font && font.title) {
  must(/'hi':'Noto Serif Devanagari[^\n]*\n/.test(b), 'FONT_TITLE 기준(hi) 못 찾음');
  b = b.replace(/( *'hi':'Noto Serif Devanagari[^\n]*\n)/, `$1  '${code}':'${font.title}',\n`);
}
if (font && font.sub) {
  must(/'hi':'Noto Sans Devanagari[^\n]*\n/.test(b), 'FONT_SUB 기준(hi) 못 찾음');
  b = b.replace(/( *'hi':'Noto Sans Devanagari[^\n]*\n)/, `$1  '${code}':'${font.sub}',\n`);
}
if (font && font.letterspacing0) {
  // letter-spacing 리스트가 있으면 추가(없으면 비치명적으로 건너뜀 — 현재 build-pages 엔 리스트 없음)
  if (/const ls = \[[^\]]*\]\.includes\(m\.code\)/.test(b)) {
    b = b.replace(/(const ls = \[)([^\]]*)(\]\.includes\(m\.code\))/, `$1$2,'${code}'$3`);
  } else { console.error('  (letter-spacing 리스트 없음 — letterspacing0 건너뜀)'); }
}
fs.writeFileSync(p('tools/build-pages.mjs'), b);

console.log(`OK: ${code} 통합 완료`);
console.log(`  i18n/${code}.json: books(${Object.keys(dict).length})/yv/bookopt 동봉 | 콘텐츠 토큰 해결 ${used.size - unresolved.length}/${used.size}`);
console.log(`  index.html: hreflang/LANGS(+locale${dir === 'rtl' ? '+dir' : ''}) ✓ — 단일 출처`);
console.log(`  build-pages: ${font ? 'FONT ✓ (LANGS는 index.html에서 파싱)' : 'LANGS는 index.html에서 파싱 — 패치 불필요'}`);
console.log(`  다음: make-qr → build-pages 실행 → validate → audit-links`);
