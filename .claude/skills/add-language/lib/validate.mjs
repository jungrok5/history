#!/usr/bin/env node
// 언어 팩 구조·콘텐츠 검증.  사용법: node validate.mjs <code>
// repo 루트에서 실행한다고 가정(또는 첫 인자 뒤 --root 경로).
import fs from 'fs';
import path from 'path';

const code = process.argv[2];
const root = process.argv[3] || process.cwd();
if (!code) { console.error('usage: node validate.mjs <code> [repoRoot]'); process.exit(2); }

const p = (f) => path.join(root, f);
let fail = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { console.log('  ✗ ' + m); fail++; };

// 1) JSON parse + 구조
const file = p(`i18n/${code}.json`);
if (!fs.existsSync(file)) { console.error('NO FILE: ' + file); process.exit(2); }
let pack;
try { pack = JSON.parse(fs.readFileSync(file, 'utf8')); ok('JSON.parse'); }
catch (e) { bad('JSON.parse 실패: ' + e.message); process.exit(1); }

const n = (a) => Array.isArray(a) ? a.length : -1;
n(pack.epochs) === 13 ? ok('epochs === 13') : bad('epochs !== 13 (' + n(pack.epochs) + ')');
n(pack.core) === 7 ? ok('core === 7') : bad('core !== 7 (' + n(pack.core) + ')');
n(pack.love) === 13 ? ok('love === 13') : bad('love !== 13 (' + n(pack.love) + ')');
const nulls = (pack.mis || []).map((x, i) => x === null ? i : -1).filter(i => i >= 0);
(n(pack.mis) === 13 && nulls.join(',') === '8,12')
  ? ok('mis === 13, null at 8,12')
  : bad('mis 구조 이상: len=' + n(pack.mis) + ' nulls=[' + nulls.join(',') + '] (8,12 이어야 함)');

// epoch/core 객체 키
const epOk = pack.epochs.every(e => ['tag','title','date','one','people','events','q','cite','christ','detail','next'].every(k => k in e));
epOk ? ok('epoch 객체 키 완비') : bad('epoch 객체 키 누락');
const coOk = pack.core.every(c => ['title','body','vref','vtext'].every(k => k in c));
coOk ? ok('core 객체 키 완비') : bad('core 객체 키 누락');

// 2) s 키가 es.json 과 동일
try {
  const es = JSON.parse(fs.readFileSync(p('i18n/es.json'), 'utf8'));
  const a = Object.keys(es.s).sort().join(','), b = Object.keys(pack.s).sort().join(',');
  a === b ? ok('s 키 집합이 es.json 과 동일') : bad('s 키 불일치 — es 기준 누락/추가 확인');
} catch { bad('es.json 비교 실패'); }

// 3) 필수 메타
pack.htmlLang === code ? ok('htmlLang === code') : bad('htmlLang !== code (' + pack.htmlLang + ')');
pack.ui && pack.ui.version ? ok('ui.version = ' + pack.ui.version) : bad('ui.version 없음');
pack.menuName ? ok('menuName = ' + pack.menuName) : bad('menuName 없음');
['ltr','rtl'].includes(pack.dir) ? ok('dir = ' + pack.dir) : bad('dir 이상');

// 4) 영화(밀양) 의존 제거 확인
const blob = JSON.stringify(pack);
const film = /secret\s*sunshine|밀양|miryang|mily|密陽|密阳|シークレット|มิลยัง|мирян|मिलयांग/i;
film.test(blob) ? bad('영화(밀양/Secret Sunshine) 잔존 — ko 외 언어는 영화 무관이어야 함') : ok('영화 의존 없음(film-free)');

// 5) 본문 verse-text 필드에 비-ASCII 숫자 없는지(있으면 verbatim 손상 가능 / 링크 불가)
//    참조(cite/vref/inline)는 ASCII 숫자여야 링커가 인식. 본문 인용 텍스트엔 숫자가 거의 없음.
const nonAsciiDigit = /[^\x00-\x7F०-९]/; // placeholder; 실제 검사는 아래
const devDigit = /[०-९٠-٩۰-۹๐-๙၀-၉០-៩０-９]/; // Devanagari/Arabic/Persian/Thai/Myanmar/Khmer/fullwidth
let nad = [];
pack.epochs.forEach((e,i)=>{ if(devDigit.test(e.q)) nad.push('epochs['+i+'].q'); });
pack.core.forEach((c,i)=>{ if(devDigit.test(c.vtext)) nad.push('core['+i+'].vtext'); });
nad.length ? bad('verse-text에 비-ASCII 숫자: ' + nad.join(', ') + ' (verbatim 확인 필요)') : ok('verse-text 비-ASCII 숫자 없음');

// 참조 필드에 비-ASCII 숫자가 있으면 ASCII로 변환해야 링크됨(경고만)
let refNad = [];
pack.epochs.forEach((e,i)=>{ if(devDigit.test(e.cite)) refNad.push('epochs['+i+'].cite'); });
pack.core.forEach((c,i)=>{ if(devDigit.test(c.vref)) refNad.push('core['+i+'].vref'); });
if (refNad.length) console.log('  ⚠ 참조에 비-ASCII 숫자(' + refNad.join(',') + ') — convert-digits.mjs 로 ASCII 변환 권장');

// 6) index.html 앱 스크립트 파싱(APP_JS_OK)
try {
  const h = fs.readFileSync(p('index.html'), 'utf8');
  const s = h.lastIndexOf('<script>'), e = h.lastIndexOf('</script>');
  // eslint-disable-next-line no-new-func
  new Function(h.slice(s + 8, e));
  ok('index.html APP_JS_OK');
} catch (e) { bad('APP_JS 파싱 실패: ' + e.message); }

console.log(fail ? `\n검증 실패: ${fail}건` : '\n검증 통과 ✓');
process.exit(fail ? 1 : 0);
