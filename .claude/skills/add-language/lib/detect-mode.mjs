#!/usr/bin/env node
// 언어 코드 → 권장 모드 자동 판정.  사용법: node detect-mode.mjs <code> [code2 …]
//   YouVersion(버전+완역/NT 프로브) · eBible.org(완역/NT) · OBS(있음+포맷)을 조사해
//   full / partial / eBible / OBS / bridge(또는 defer) 중 무엇으로 추가할지 알려준다.
// 모드 결정의 근거(SKILL.md 0절)를 코드 한 줄로 — 컨트리뷰터·메인테이너의 "모드 판별" 마찰 제거.
//
// 주의: 소스마다 코드 체계가 다를 수 있다(우리 2글자 vs ISO 639-3). 인자로 준 코드를 각 소스에
//   그대로 조회한다. YV/eBible/OBS가 다른 코드를 쓰면(예: Malagasy plt≠mg) 후보 코드를 더 넘겨보라.
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FV = path.join(__dirname, 'fetch-verse.mjs');
const codes = process.argv.slice(2);
if (!codes.length) { console.error('usage: node detect-mode.mjs <code> [code2 …]'); process.exit(2); }

function curlText(url, t = 25) {
  for (let i = 0; i < 3; i++) {
    try { return execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', String(t), url], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }); }
    catch (e) { if (i === 2) return ''; }
  }
  return '';
}

// ---- YouVersion: 언어페이지 __NEXT_DATA__ 의 버전 목록 ----
function yvVersions(code) {
  const html = curlText(`https://www.bible.com/languages/${code}`);
  const m = html && html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  let j; try { j = JSON.parse(m[1]); } catch { return []; }
  const seen = new Map();
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (o.id && (o.local_title || o.title) && (o.local_abbreviation || o.abbreviation))
      seen.set(o.id, { id: o.id, title: (o.local_title || o.title).slice(0, 30), abbr: o.local_abbreviation || o.abbreviation });
    for (const k in o) walk(o[k]);
  })(j);
  return [...seen.values()];
}
// 한 YV 버전의 범위: GEN.1.1(구약 처음) + MAL.3.1(구약 끝) + JHN.1.1(신약) 프로브.
//  full = 구약(말라기까지) + 신약 둘 다.  nt = 신약만(완전 구약 없음) → partial 모드.
//  ot-partial = 구약 일부만, 신약 없음(예: 창세기만 있는 EAT) → full/partial 어느 쪽도 못 씀.
//  (GEN 하나만 보면 창세기-only 판본이 full 로 오판되므로 MAL·JHN 도 본다.)
function classifyYV(id) {
  let out = '';
  try { out = execFileSync('node', [FV, String(id), 'GEN.1.1,ISA.53.5,MAL.3.1,JHN.1.1'], { encoding: 'utf8', maxBuffer: 64e6 }); } catch { return 'none'; }
  const has = (r) => new RegExp('^' + r.replace(/\./g, '\\.') + '\\t(?!MISSING)\\S', 'm').test(out);
  const otEarly = has('GEN.1.1'), otMid = has('ISA.53.5'), otLate = has('MAL.3.1'), nt = has('JHN.1.1');
  if (nt && otMid && otLate) return 'full';   // 신약 + 구약(이사야·말라기까지) = 완역
  if (nt) return 'nt';                          // 신약(+구약 일부) → partial / richer-partial (예: syl = 오경+신약, 이사야 결락)
  if (otEarly || otMid || otLate) return 'ot-partial';
  return 'none';
}

// ---- eBible.org: translations.csv (col0 = languageCode, BOM 주의) ----
let _ebCache = null;
function ebibleRows(code) {
  if (_ebCache === null) {
    const csv = curlText('https://ebible.org/Scriptures/translations.csv', 40);
    _ebCache = csv ? csv.split(/\r?\n/) : [];
  }
  const pc = (l) => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { c += ch; i++; } else q = !q; } else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  const rows = [];
  for (let i = 1; i < _ebCache.length; i++) {
    if (!_ebCache[i]) continue;
    const c = pc(_ebCache[i]);
    if ((c[0] || '').replace(/﻿/g, '') === code) rows.push({ id: c[1], ot: +c[12] || 0, nt: +c[15] || 0, redist: /true/i.test(c[8] || ''), name: c[2] });
  }
  return rows;
}

// ---- OBS: door43 gitea 카탈로그 + 포맷(.txt 구 / content/NN.md 신) ----
function obsInfo(code) {
  const j = curlText(`https://git.door43.org/api/v1/catalog/search?lang=${code}&subject=Open%20Bible%20Stories&stage=prod`);
  let repo = null; try { const d = JSON.parse(j).data || []; if (d[0]) repo = d[0].repo.full_name; } catch {}
  if (!repo) return null;
  const md = curlText(`https://git.door43.org/${repo}/raw/branch/master/content/01.md`, 15);
  const fmt = (md && md.trim() && md.trim() !== 'Not found.') ? 'markdown' : 'txt';
  return { repo, fmt };
}

for (const code of codes) {
  console.log(`\n=== detect-mode: ${code} ===`);
  // YouVersion
  const vs = yvVersions(code);
  let yvFull = null, yvNT = null;
  if (!vs.length) console.log('YouVersion: (no versions / not on YV under this code)');
  else {
    console.log(`YouVersion: ${vs.length} version(s)`);
    for (const v of vs.slice(0, 6)) {
      const cl = classifyYV(v.id);
      const lbl = cl === 'full' ? 'FULL Bible' : cl === 'nt' ? 'NT-only' : cl === 'ot-partial' ? 'OT-only/incomplete (NOT usable as full or partial — NT absent)' : 'no text fetched';
      console.log(`  #${v.id} "${v.title}" (${v.abbr}) → ${lbl}`);
      if (cl === 'full' && !yvFull) yvFull = v;
      if (cl === 'nt' && !yvNT) yvNT = v;
    }
    if (vs.length > 6) console.log(`  …(${vs.length - 6} more not probed)`);
  }
  // eBible
  const eb = ebibleRows(code);
  let ebFull = null, ebNT = null;
  if (!eb.length) console.log('eBible: none');
  else {
    console.log(`eBible: ${eb.length} edition(s)`);
    for (const r of eb) {
      const kind = r.ot >= 39 && r.nt >= 27 ? 'FULL' : r.nt >= 27 ? 'NT' : 'partial';
      console.log(`  [${r.id}] OT${r.ot} NT${r.nt} ${r.redist ? 'redistributable' : '⚠NOT-redistributable'} — ${kind}`);
      if (kind === 'FULL' && r.redist && !ebFull) ebFull = r;
      if (kind === 'NT' && r.redist && !ebNT) ebNT = r;
    }
  }
  // OBS
  const obs = obsInfo(code);
  console.log(obs ? `OBS: ${obs.repo} (${obs.fmt} format) → yv:"obs:${obs.repo}"` : 'OBS: none');

  // ---- 권장 ----
  let rec;
  if (yvFull) rec = `FULL mode — YouVersion #${yvFull.id} (${yvFull.abbr}). yv:${yvFull.id}`;
  else if (ebFull) rec = `FULL mode via eBible — yv:"ebible:${ebFull.id}" (OT${ebFull.ot} NT${ebFull.nt})`;
  else if (yvNT) rec = `PARTIAL mode — YouVersion #${yvNT.id} (NT-only). OT→NT substitution + empty OT cites.`;
  else if (ebNT) rec = `PARTIAL mode via eBible — yv:"ebible:${ebNT.id}" (NT-only).`;
  else if (obs) rec = `OBS mode — no Bible found; Open Bible Stories exists. yv:"obs:${obs.repo}". (Or BRIDGE if speakers read a major language we already have.)`;
  else rec = `BRIDGE mode (mother-tongue prose + a bridge language's verses) — no Bible/OBS found under this code. If none works, defer ("coming soon"). NB: try the ISO 639-3 code too if this was a 2-letter code.`;
  console.log(`→ RECOMMENDED: ${rec}`);
}
