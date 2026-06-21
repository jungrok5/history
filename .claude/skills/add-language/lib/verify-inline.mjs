#!/usr/bin/env node
// 인라인 인용 verbatim 검증(영구 도구).  사용법: node verify-inline.mjs <code> | --all
//   verify-verbatim 은 epoch[].q·core[].vtext(별도 cite 필드)만 본다. 이 도구는 그 외 **본문 안에 박힌
//   인용+참조**(christ/detail/mis/faq/respond.verse/closing.verse/gospel.crux …)를 전수 검사한다 —
//   그동안 구조적 사각이던 영역(예: MAL3:1 «I send my messenger» 가 42개 언어에서 환언된 걸 놓침).
//   탐지: ① 괄호형  «인용» (책 3:1)   ② 대시형  "인용" — 책 1:12 · 책 10:9
//   cite 는 라이브 linkifyRefs 로 USFM 해석, fetch-verse 로 판본 원문 추출, "글자만" 키로 substring 대조.
//   cite 없는 인라인 요약(편집 재량)은 검사 안 함(인용+참조 쌍만). 빈 cite 안전.
//   ★ EN(i18n/en.json)을 베이스라인으로: EN 도 축약/강조/엘리전한 자리는 편집 의도라 제외, **EN 이 verbatim 인데
//     번역만 어긋난 것만** 플래그 → MAL3:1류 진짜 오류를 잡음. 단 **확정 아닌 검수 후보**(따옴표 친 호칭·
//     저자 표현이 성경 cite 옆에 오면 오탐 가능) → q/s 를 눈으로 보고 진짜 인용 일탈만 fetch-verse 재확인 후 교정.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const arg = process.argv[2];
if (!arg) { console.error('usage: node verify-inline.mjs <code> | --all'); process.exit(2); }
const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const fetcher = path.join(here, 'fetch-verse.mjs');

// index.html 링크 인프라(BOOKS/YV/linkifyRefs) 추출 (verify-verbatim 과 동일)
const lines = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('\n');
const s = lines.findIndex(l => l.startsWith('var YV='));
const e = lines.findIndex((l, i) => i > s && l.trim() === 'return out; }');
if (s < 0 || e < 0) { console.error('링크 인프라 슬라이스 실패'); process.exit(2); }
new Function('var document={addEventListener(){}};var gevent=function(){};\n'
  + lines.slice(s, e + 1).join('\n') + '\n;globalThis.__T={BOOKS,YV,linkifyRefs};')();
const { BOOKS, YV, linkifyRefs } = globalThis.__T;

// 정규화/대조 (verify-verbatim 과 동일 키)
const ARABIC_MARKS = /[ً-ْٰٖ-ٟۖ-ۭ]/g, HEBREW_MARKS = /[֑-ׇֽֿׁׂׅׄ]/g, ALEF = /[آأإٱ]/g, ZW = /[­​-‏]/g;
const norm = t => t.normalize('NFC').replace(ARABIC_MARKS, '').replace(HEBREW_MARKS, '').replace(ALEF, 'ا').replace(ZW, '');
const key = t => norm(t).toLowerCase().replace(/[ʻʼʽʾʿ‘’‛`´]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const disp = t => t.replace(ZW, '').replace(/\s+/g, ' ').trim();
const contains = (src, seg) => { const k = key(seg); return k.length >= 4 && key(src).includes(k); };

function refsFromText(text, code) {
  const refs = [];
  for (const part of text.split(/[·;]/).map(x => x.trim()).filter(Boolean)) {
    const linked = [...linkifyRefs(part, code).matchAll(/data-ref="([^"]+)"/g)].map(m => m[1]);
    if (!linked.length) continue;
    const nums = (part.match(/\d+/g) || []).map(Number);
    for (const r of linked) {
      const mm = r.match(/^(.+\.\d+)\.(\d+)(?:-(\d+))?$/);
      if (!mm) { refs.push(r); continue; }
      const bc = mm[1], chap = +bc.split('.').pop(), a = +mm[2], b = +(mm[3] || mm[2]);
      const bigger = nums.filter(n => n > b && n < 200 && n !== chap);
      const hi = bigger.length ? Math.max(b, ...bigger) : b;
      refs.push(bc + '.' + a + (hi > a ? '-' + hi : ''));
    }
  }
  return [...new Set(refs)];
}

// 한 언어 검사
function checkLang(code) {
  if (!BOOKS[code]) return { code, flags: ['BOOKS 없음'] };
  const yv = YV[code];
  const pack = JSON.parse(fs.readFileSync(path.join(root, `i18n/${code}.json`), 'utf8'));
  const cache = {};
  const fetchV = ref => cache[ref] !== undefined ? cache[ref]
    : (cache[ref] = (() => { try { return execFileSync('node', [fetcher, String(yv), ref], { encoding: 'utf8' }).split('\n').map(l => l.split('\t').slice(1).join(' ')).join(' ').trim() || '__EMPTY__'; } catch { return '__FAIL__'; } })());

  // 검사 대상 본문 필드 수집 (epoch q·cite, core vtext·vref 는 verify-verbatim 담당 → 제외)
  const fields = [];
  (pack.epochs || []).forEach((x, i) => ['one', 'people', 'events', 'christ', 'detail', 'next'].forEach(f => x[f] && fields.push([`epoch[${i}].${f}`, x[f]])));
  (pack.core || []).forEach((x, i) => x.body && fields.push([`core[${i}].body`, x.body]));
  (pack.mis || []).forEach((x, i) => { if (x) { if (x.w) fields.push([`mis[${i}].w`, x.w]); if (x.t) fields.push([`mis[${i}].t`, x.t]); } });
  (pack.love || []).forEach((x, i) => x && fields.push([`love[${i}]`, x]));
  for (const [k, v] of Object.entries(pack.s || {})) if (typeof v === 'string') fields.push(['s.' + k, v]);

  // 인라인 인용+참조 쌍 추출: 괄호형 / 대시형
  const Q = '«“"', QC = '»”"';
  const qcls = '«»“”"';
  const reParen = new RegExp('[' + Q + ']([^' + qcls + ']{2,}?)[' + QC + ']\\s*\\(\\s*([^)]*?\\d+\\s*[:.·]\\s*\\d+[^)]*?)\\)', 'g');
  const reDash = new RegExp('[' + Q + ']([^' + qcls + ']{2,}?)[' + QC + ']\\s*[—–]\\s*([^<]*?\\d+\\s*[:.·]\\s*\\d+[^<]*?)(?=$|<|\\s{2,})', 'g');

  const devs = [];
  for (const [label, raw] of fields) {
    const text = String(raw);
    const pairs = [];
    let m;
    while ((m = reParen.exec(text))) pairs.push([m[1], m[2]]);
    while ((m = reDash.exec(text))) pairs.push([m[1], m[2]]);
    for (const [quote, citeRaw] of pairs) {
      const refs = refsFromText(citeRaw.replace(/<[^>]+>/g, ' '), code);
      if (!refs.length) continue; // 성경 참조로 해석 안 되면 인용 아님(스킵)
      const k = label + '|' + refs.join(',');
      const got = refs.map(fetchV);
      if (got.some(x => x === '__FAIL__')) { devs.push({ key: k, label, refs, fail: true }); continue; }
      const pool = got.join('  ||  ');
      // 인용 안 엘리전: …, 그리고 — / , 도 분절점으로 허용(EN 도 쓰는 편집 생략)
      const segs = quote.replace(/<[^>]+>/g, '').split(/…|—|–/).map(x => x.trim()).filter(x => key(x).length >= 4);
      const bad = segs.filter(seg => !contains(pool, seg));
      if (bad.length) devs.push({ key: k, label, refs, quote, verse: pool, q: disp(bad[0]).slice(0, 120), s: disp(pool).slice(0, 150) });
    }
  }
  return { code, yv, devs };
}

// EN(정본) 베이스라인으로 노이즈 제거:
//  ① EN 도 일탈한 **필드**(faq.a*·mis 편집 인용 등)는 그 자체가 verbatim 대상 아님 → 필드 단위 제외.
//  ② 호칭/저자적용 cite(성경 직접인용 아님)는 ref 로 제외: «다윗의 자손»(LUK1:32-33·MAT1:1)·«나도 똑같이»(1CO10:11) 등.
const enLabels = new Set(checkLang('en').devs.map(d => d.label));
const CONCEPT_REFS = new Set(['LUK.1.32-33', 'MAT.1.1', '1CO.10.11', 'LUK.18.9-14']);
const isReal = d => !enLabels.has(d.label) && !d.refs.some(r => CONCEPT_REFS.has(r));

const JSON_OUT = process.argv.includes('--json');
const ALL = arg === '--all' || arg === '--json';
const codes = ALL
  ? fs.readdirSync(path.join(root, 'i18n')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).filter(c => YV[c])
  : [arg];

const jsonRows = [];
let totalFlag = 0;
for (const code of codes) {
  if (code === 'en') continue; // en 은 베이스라인(정본 자체)
  const r = checkLang(code);
  const real = r.devs.filter(isReal); // EN 베이스라인(필드)+호칭/적용 cite 제외 = 진짜 인용 일탈
  totalFlag += real.length;
  if (JSON_OUT) { for (const d of real) if (!d.fail) jsonRows.push({ code, yv: r.yv, label: d.label, refs: d.refs, quote: d.quote, verse: d.verse }); continue; }
  if (ALL && !real.length) { console.log(`✓ ${code} CLEAN`); continue; }
  console.log('===== ' + r.code + ' (yv' + (r.yv || '?') + ') — ' + (real.length ? real.length + ' FLAG(S)' : 'CLEAN') + ' =====');
  for (const d of real) {
    if (d.fail) { console.log(` • ${d.label} [${d.refs.join(',')}] FETCH FAIL(신포맷?)`); continue; }
    console.log(` • ${d.label} [${d.refs.join(',')}] NOT VERBATIM:\n     q: ${d.q}\n     s: ${d.s}`);
  }
}
if (JSON_OUT) { console.log(JSON.stringify(jsonRows)); process.exit(0); }
if (ALL) console.log(`\n총 FLAG: ${totalFlag} (언어 ${codes.length - 1}, EN 일탈필드 ${enLabels.size}개 + 호칭/적용 cite 제외)`);
process.exit(totalFlag ? 1 : 0);
