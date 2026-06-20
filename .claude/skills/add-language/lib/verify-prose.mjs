#!/usr/bin/env node
// 산문 자동 점검(저자원 언어 연결-산문 의미검증).  사용법:
//   node verify-prose.mjs <code> [--all] [--dump] [--sim=0.30]
//
// 무엇을: i18n/<code>.json 의 **연결 산문**(성경 인용 제외)을 구글번역(무료 엔드포인트)으로
//   **영어로 역번역**한 뒤, 정본인 index.html 의 EN_PACK 같은 필드와 자동 대조한다.
//   - POLARITY: 부정어(not/no/never/without…) 유무가 정본과 뒤집힘 → **의미 반전 의심**(ff about.line "ɗoftaaki" 사례).
//   - LOW-SIM : 역번역↔정본 문자 바이그램 Dice 유사도가 낮음 → 오역/누락 의심.
//   - LEN     : 길이비가 크게 벗어남 → 통째 누락/중복 의심.
//   기본은 **플래그된 필드만** 출력(+요약). 플래그 있으면 exit 1(게이트로 사용 가능).
//
// ⚠ 성경 인용(epochs.q·core.vtext·respond.verse·closing.verse)은 verbatim 이라 제외(verify-verbatim 담당).
// ⚠ 구글번역 품질에 의존 → 플래그는 **확정 오류가 아니라 검수 후보**. 폴라리티/교리명제 반전에 집중해 판단.
// ⚠ 비공식 엔드포인트(레이트리밋) → 필드당 지연+재시도. QA 한정.
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const code = args.find(a => !a.startsWith('-'));
const ALL = args.includes('--all');      // 플래그 외 필드도 점수와 함께 출력
const DUMP = args.includes('--dump');     // 역번역 원문만 나열(대조 없이)
const SIM_LO = parseFloat((args.find(a => a.startsWith('--sim=')) || '').slice(6)) || 0.30;
if (!code) { console.error('usage: node verify-prose.mjs <code> [--all] [--dump] [--sim=0.30]'); process.exit(2); }
const root = process.cwd();

// ---- 정본 EN_PACK 추출(build-pages 와 동일 슬라이스) ----
let EN_PACK;
try {
  const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const a = src.indexOf('const EPOCHS=['), b = src.indexOf('function hasLang');
  if (a < 0 || b < 0) throw new Error('EN_PACK 마커 못 찾음');
  const dataSrc = src.slice(a, b)
    .replace("const coreWrap=document.getElementById('core');", '')
    .replace("const main=document.getElementById('epochs');", '');
  ({ EN_PACK } = new Function(dataSrc + '\nreturn {EN_PACK};')());
} catch (e) { console.error('정본 EN_PACK 추출 실패:', e.message); process.exit(2); }

const pack = JSON.parse(fs.readFileSync(path.join(root, `i18n/${code}.json`), 'utf8'));

// ---- 점검 대상 필드(정본 EN 과 target 을 path 로 짝지음, 인용 제외) ----
const SKIP_S = new Set(['respond.verse', 'closing.verse']); // verbatim 인용
const EPOCH_F = ['one', 'people', 'events', 'christ', 'detail', 'next'];
const CORE_F = ['title', 'body'];
function collect(p) {
  const out = new Map();
  for (const [k, v] of Object.entries(p.s || {})) if (!SKIP_S.has(k) && typeof v === 'string') out.set('s.' + k, v);
  (p.epochs || []).forEach((e, i) => e && EPOCH_F.forEach(f => e[f] != null && out.set(`epoch[${i}].${f}`, e[f])));
  (p.core || []).forEach((c, i) => c && CORE_F.forEach(f => c[f] != null && out.set(`core[${i}].${f}`, c[f])));
  (p.mis || []).forEach((m, i) => { if (m) { out.set(`mis[${i}].w`, m.w); out.set(`mis[${i}].t`, m.t); } });
  (p.love || []).forEach((l, i) => l != null && out.set(`love[${i}]`, l));
  return out;
}
const REF = collect(EN_PACK), TGT = collect(pack);

// ---- 텍스트 유틸 ----
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim(); // 곡선부호 정규화(부정어 매칭 일관)
const letters = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
function diceBigram(a, b) {            // 문자 바이그램 멀티셋 Dice(영↔영 비교)
  a = letters(a); b = letters(b);
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const mk = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = mk(a), B = mk(b); let inter = 0, na = 0, nb = 0;
  A.forEach((c, g) => { na += c; if (B.has(g)) inter += Math.min(c, B.get(g)); });
  B.forEach(c => nb += c);
  return (2 * inter) / (na + nb);
}
// 영어 부정어 개수(역번역 결과는 영어이므로 영어 기준이 안정적).
//   핵심 부정어 + 축약형(n't)만 — reject/without 등은 의역에서 폴라리티 오탐을 일으켜 제외.
const NEG = /\b(not|no|never|neither|nor|none|cannot|without|nobody|nothing|nowhere)\b|n't\b/gi;
const negCount = s => (s.match(NEG) || []).length;

// ---- 구글번역(target → en) ----
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function gt(text) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + code + '&tl=en&dt=t&q=' + encodeURIComponent(text);
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return (j[0] || []).map(seg => seg[0]).join('');
    } catch (e) { if (i === 3) return null; await sleep(800 * (i + 1)); }
  }
}

// ---- 실행 ----
const rows = [];
for (const [p, rawT] of TGT) {
  const ref = REF.has(p) ? strip(REF.get(p)) : '';
  const tgt = strip(rawT);
  if (tgt.length < 2) continue;
  const raw = await gt(tgt);
  await sleep(140);
  if (raw == null) { rows.push({ p, ref, bt: '', sim: NaN, reasons: ['GT-FAIL'] }); continue; }
  const bt = strip(raw); // 역번역 결과도 곡선부호 정규화(부정어 매칭 일관)
  const sim = ref ? diceBigram(bt, ref) : NaN;
  const nR = negCount(ref), nB = negCount(bt);
  const lr = ref ? bt.length / ref.length : 1;
  const reasons = [];
  if (ref && ((nR === 0) !== (nB === 0))) reasons.push(`POLARITY(ref ${nR}↔bt ${nB})`);
  if (ref && letters(ref).length >= 24 && sim < SIM_LO) reasons.push(`LOW-SIM(${sim.toFixed(2)})`); // 짧은 관용구는 bigram 불안정 → 제외
  if (ref && (lr < 0.45 || lr > 2.3)) reasons.push(`LEN(${lr.toFixed(2)}x)`);
  if (!ref) reasons.push('NO-REF'); // 정본에 없는 필드(검사 불가)
  rows.push({ p, ref, bt, sim, nR, nB, reasons });
}

if (DUMP) {
  console.log(`# 역번역 덤프(${code}→en, ${rows.length} 필드)\n`);
  for (const r of rows) { console.log('■ ' + r.p); console.log('  BT : ' + r.bt); console.log('  REF: ' + r.ref + '\n'); }
  process.exit(0);
}

const sev = r => (r.reasons.some(x => x.startsWith('POLARITY')) ? 0 : r.reasons.includes('GT-FAIL') ? 1 : 2);
const flagged = rows.filter(r => r.reasons.length && !r.reasons.includes('NO-REF'))
  .sort((a, b) => sev(a) - sev(b) || (a.sim || 1) - (b.sim || 1));

console.log(`# 산문 자동 점검: ${code} (역번역 en ↔ EN_PACK 정본, sim<${SIM_LO})`);
if (ALL) {
  for (const r of rows.sort((a, b) => (a.sim || 1) - (b.sim || 1))) {
    const tag = r.reasons.length ? '  ⚑ ' + r.reasons.join(' ') : '';
    console.log(`\n[${isNaN(r.sim) ? ' -- ' : r.sim.toFixed(2)}] ${r.p}${tag}`);
    console.log('  BT : ' + r.bt);
    console.log('  REF: ' + r.ref);
  }
}
console.log(`\n검사 ${rows.length} · 플래그 ${flagged.length}` + (flagged.length ? '' : ' → CLEAN ✓'));
for (const r of flagged) {
  console.log(`\n⚑ ${r.p}  [${r.reasons.join(', ')}]`);
  console.log('  BT : ' + r.bt);
  console.log('  REF: ' + r.ref);
}
process.exit(flagged.length ? 1 : 0);
