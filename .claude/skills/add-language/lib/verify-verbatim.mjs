#!/usr/bin/env node
// 인용 verbatim 검증(영구 도구·설정파일 불필요).  사용법: node verify-verbatim.mjs <code>
//   책이름→USFM·YouVersion ID·해석을 **배포된 index.html(BOOKS.<code>/YV/linkifyRefs)** 에서 직접 사용
//   → /tmp config(중간 초안)·세션상태에 의존하지 않으므로 컴팩트/세션리셋 후에도 항상 배포 실상과 일치.
// 검증 대상:
//   · epoch[i].q   ↔ epoch[i].cite   (장면 핵심 인용)
//   · core[i].vtext ↔ core[i].vref   (복음 핵심 인용)
//   cite/vref 는 라이브 linkifyRefs 로 USFM 해석(sep ','·suf '章'·후치/로마자/서수 번호책·LXX 리맵·범위 동일),
//   fetch-verse 로 판본 원문 추출, "글자만" 키로 대조(따옴표·구두점·공백·대소문자·발음기호 차이는 흡수, 단어 차이는 검출).
//   빈 cite(부분 모드 구약 장면)는 건너뜀.  inline 산문 인용은 드래프팅 자체검증/원어민 검수가 담당.
// 한계: fetch-verse 가 못 읽는 판본(신포맷 챕터 blob 등)은 FETCH FAIL(자동검증 불가). 절번호 차이/LXX 는 cite 를 판본 자체번호로.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const code = process.argv[2];
if (!code) { console.error('usage: node verify-verbatim.mjs <code>'); process.exit(2); }
const root = process.cwd();
const here = path.dirname(new URL(import.meta.url).pathname);
const fetcher = path.join(here, 'fetch-verse.mjs');

// index.html 에서 링크 인프라(BOOKS/YV/linkifyRefs) 추출
const lines = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('\n');
const s = lines.findIndex(l => l.startsWith('var YV='));
const e = lines.findIndex((l, i) => i > s && l.trim() === 'return out; }');
if (s < 0 || e < 0) { console.error('링크 인프라 슬라이스 실패(var YV= ~ linkifyRefs)'); process.exit(2); }
new Function('var document={addEventListener(){}};var gevent=function(){};\n'
  + lines.slice(s, e + 1).join('\n') + '\n;globalThis.__T={BOOKS,YV,linkifyRefs};')();
const { BOOKS, YV, linkifyRefs } = globalThis.__T;
if (!BOOKS[code]) { console.error('BOOKS.' + code + ' 없음 — integrate 먼저 실행'); process.exit(1); }
const yv = YV[code];
const pack = JSON.parse(fs.readFileSync(path.join(root, `i18n/${code}.json`), 'utf8'));

const cache = {};
const fetchV = (ref) => {
  if (cache[ref]) return cache[ref];
  try { return cache[ref] = execFileSync('node', [fetcher, String(yv), ref], { encoding: 'utf8' })
    .split('\n').map(l => l.split('\t').slice(1).join(' ')).join(' ').trim() || '__EMPTY__'; }
  catch { return cache[ref] = '__FAIL__'; }
};

// 비교 키: NFC → 아랍 하라카트/히브리 니쿠드·테아밈 제거 → 알레프 변형 통일 → ZW 제거 → 소문자 → 글자·숫자만.
//   따옴표/구두점/공백/대소문자/발음기호/CJK간격 차이는 흡수, 단어 차이(의역·누락)는 검출(인도계 마트라는 보존).
const ARABIC_MARKS = /[ً-ْٰٖ-ٟۖ-ۭ]/g;
const HEBREW_MARKS = /[֑-ׇֽֿׁׂׅׄ]/g;
const ALEF = /[آأإٱ]/g;
const ZW = /[­​-‏]/g;
const norm = t => t.normalize('NFC').replace(ARABIC_MARKS, '').replace(HEBREW_MARKS, '').replace(ALEF, 'ا').replace(ZW, '');
const key = t => norm(t).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const disp = t => t.replace(ZW, '').replace(/\s+/g, ' ').trim();
const stripq = t => t.replace(/^[\s"“«»”'‚„‹›]+|[\s"“«»”'‚„‹›]+$/g, '');
function contains(src, seg) { const k = key(seg); return k.length >= 4 && key(src).includes(k); }

// cite/vref → USFM: linkifyRefs 가 흘리는 동일장 연속절("3:10-12, 23")은 ·-세그먼트 내 큰 절번호로 범위 확장(과fetch=관대).
function refsFromText(text) {
  const refs = [];
  for (const part of text.split(/[·;]/).map(x => x.trim()).filter(Boolean)) {
    const linked = [...linkifyRefs(part, code).matchAll(/data-ref="([^"]+)"/g)].map(m => m[1]);
    if (!linked.length) { refs.push({ err: 'no-link:' + part }); continue; }
    const nums = (part.match(/\d+/g) || []).map(Number);
    for (const r of linked) {
      const mm = r.match(/^(.+\.\d+)\.(\d+)(?:-(\d+))?$/);
      if (!mm) { refs.push({ ref: r }); continue; }
      const bc = mm[1], chap = +bc.split('.').pop(), a = +mm[2], b = +(mm[3] || mm[2]);
      const bigger = nums.filter(n => n > b && n < 200 && n !== chap);
      const hi = bigger.length ? Math.max(b, ...bigger) : b;
      refs.push({ ref: bc + '.' + a + (hi > a ? '-' + hi : '') });
    }
  }
  return refs;
}

function checkSegs(label, text, refs, flags) {
  const errs = refs.filter(x => x.err); if (errs.length) flags.push(label + ' ' + errs.map(x => x.err).join(';'));
  const ok = refs.filter(x => x.ref).map(x => fetchV(x.ref));
  if (ok.some(x => x === '__FAIL__')) { flags.push(label + ' FETCH FAIL (' + refs.map(x => x.ref).join(',') + ') — 판본 추출 불가(신포맷?)'); return; }
  const pool = ok.join('  ||  ');
  const clean = (text || '').replace(/<[^>]+>/g, '');
  for (const seg of clean.split('…').map(x => x.trim()).filter(x => key(x).length >= 4)) {
    if (!contains(pool, seg))
      flags.push(label + ' NOT VERBATIM:\n     q: ' + disp(stripq(seg)).slice(0, 120) + '\n     s: ' + disp(pool).slice(0, 150));
  }
}

const flags = [];
pack.epochs.forEach((x, i) => { if (x.cite) checkSegs('epoch[' + i + '].q [' + x.cite + ']', x.q, refsFromText(x.cite), flags); });
pack.core.forEach((x, i) => { if (x.vref) checkSegs('core[' + i + '].vtext [' + x.vref + ']', x.vtext, refsFromText(x.vref), flags); });

console.log('===== ' + code + ' (yv' + yv + ') — ' + (flags.length ? flags.length + ' FLAG(S)' : 'CLEAN') + ' =====');
flags.forEach(f => console.log(' • ' + f));
process.exit(flags.length ? 1 : 0);
