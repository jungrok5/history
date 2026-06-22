#!/usr/bin/env node
// 구절 링크 감사(스크립트 무관).  사용법: node audit-links.mjs <code> [repoRoot]
// index.html 의 실제 링크 함수(verseUrl/refRe/linkifyRefs/BOOKS/BOOKOPT/YV)를 그대로 추출해
// 해당 언어 콘텐츠 전체에 적용, "참조처럼 보이는데 링크 안 된" 것을 잡아낸다.
import fs from 'fs';
import path from 'path';

const code = process.argv[2];
const root = process.argv[3] || process.cwd();
if (!code) { console.error('usage: node audit-links.mjs <code> [repoRoot]'); process.exit(2); }
const p = (f) => path.join(root, f);

const lines = fs.readFileSync(p('index.html'), 'utf8').split('\n');
const startIdx = lines.findIndex(l => l.startsWith('var YV='));
// linkifyRefs 끝( ' return out; }' )까지 슬라이스
const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === 'return out; }');
if (startIdx < 0 || endIdx < 0) { console.error('링크 인프라 슬라이스 실패(var YV= ~ linkifyRefs)'); process.exit(2); }
const infra = lines.slice(startIdx, endIdx + 1).join('\n');
const sandbox = 'var document={addEventListener(){}};var gevent=function(){};\n'
  + infra + '\n;globalThis.__T={BOOKS,BOOKOPT,YV,verseUrl,refRe,linkifyRefs};';
// eslint-disable-next-line no-new-func
new Function(sandbox)();
const T = globalThis.__T;
const pack = JSON.parse(fs.readFileSync(p(`i18n/${code}.json`), 'utf8'));
// 구절-링크 데이터는 팩에 동봉됨(ko/en 만 index.html 인라인) — 런타임 doApply 와 동일하게 등록
if (code !== 'ko' && code !== 'en' && pack.books) { T.BOOKS[code] = pack.books; if (pack.yv != null) T.YV[code] = pack.yv; if (pack.bookopt) T.BOOKOPT[code] = pack.bookopt; }
if (!T.BOOKS[code]) { console.error('BOOKS.' + code + ' 없음 — 팩에 books 필드 없음(integrate 먼저 실행)'); process.exit(1); }
const fields = [];
pack.epochs.forEach((x, i) => ['q','cite','one','people','events','christ','detail','next'].forEach(k => fields.push(['epoch' + i + '.' + k, x[k]])));
pack.core.forEach((x, i) => ['body','vref','vtext'].forEach(k => fields.push(['core' + i + '.' + k, x[k]])));
pack.mis.forEach((x, i) => { if (x) { fields.push(['mis' + i + '.t', x.t]); fields.push(['mis' + i + '.w', x.w]); } });
Object.keys(pack.s).forEach(k => fields.push(['s.' + k, pack.s[k]]));

// 스크립트 무관 "인용처럼 보이는" 패턴: 글자(+결합기호/ZWNJ) … 장:절
const refLike = /([\p{L}‌‍][\p{L}\p{M}‌‍.''’ ]*?)\s*\d+\s*[:.]\s*\d+(?:[-–]\d+)?/gu;
let total = 0, linked = 0; const missed = [];
for (const [name, val] of fields) {
  if (typeof val !== 'string') continue;
  const out = T.linkifyRefs(val, code);
  let m;
  refLike.lastIndex = 0;
  while ((m = refLike.exec(val))) {
    const ref = m[0];
    total++;
    const idx = out.indexOf(ref);
    const before = out.slice(0, idx);
    if (before.lastIndexOf('<a class="vlink"') > before.lastIndexOf('</a>')) linked++;
    else missed.push([name, ref]);
  }
}
console.log(`Total ref-like: ${total} | linked: ${linked} | missed: ${missed.length}`);
missed.forEach(x => console.log('  MISSED ' + x[0] + ' : ' + JSON.stringify(x[1])));

// 앵커 균형(태그 깨짐 방지) — 가장 큰 필드 점검
const big = T.linkifyRefs(pack.s['faq.a3'] || '', code);
const o = (big.match(/<a\b/g) || []).length, c = (big.match(/<\/a>/g) || []).length;
console.log(`faq.a3 anchors open/close: ${o}/${c} ${o === c ? 'OK' : 'IMBALANCE'}`);

process.exit(missed.length || o !== c ? 1 : 0);
