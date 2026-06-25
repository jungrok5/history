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
// 인자: 코드들 + 선택 플래그. --name="English/local name"(코드로 YV 태그를 못 찾을 때 이름으로 검색),
//   --tag=<yv_language_tag>(태그 직접 지정, 해석 건너뜀). 이름에 공백이 있으면 따옴표로.
const argv = process.argv.slice(2);
const flags = {};
const codes = [];
for (const a of argv) { const m = a.match(/^--([^=]+)=(.*)$/); if (m) flags[m[1]] = m[2]; else codes.push(a); }
if (!codes.length) { console.error('usage: node detect-mode.mjs <code> [code2 …] [--name="English name"] [--tag=<yv_language_tag>]'); process.exit(2); }

function curlText(url, t = 25) {
  for (let i = 0; i < 3; i++) {
    try { return execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', String(t), url], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }); }
    catch (e) { if (i === 2) return ''; }
  }
  return '';
}

// ---- 번역가능성: 자원 자문(advisory) — 실제 한계점은 실측 게이트 ----
//  한계점(deploy 여부)은 **실측 게이트**가 정한다: verify-prose 역번역이 영어 원문과 충실히 일치 +
//  원어민 검수에 미해결 BLOCKER/MAJOR 없음. 둘 중 하나라도 실패 → 배포 안 함(defer, "사람 번역 대기").
//  성경 구절(verbatim)은 무관 — "틀 산문"(해설·FAQ·영접기도)만의 문제.
//  아래 FLORES-200/Wikipedia 는 **자문용 프록시일 뿐**(자동 제외 아님): 우리 롱테일에선 예측력이 약함 —
//  저자원이라도 번역되는 언어(bal·ctg·dwr)를 오제외하고, FLORES에 이름만 있는 부실 언어(knc·kg)는 통과시킴.
//  그래서 "자원 부족" 표시는 "더 엄격히 실측 검수하라"는 신호로만 쓰고, 최종 판정은 실측 게이트가 한다.
const FLORES200 = new Set(('ace acm acq aeb afr ajp aka als amh apc arb ars ary arz asm ast awa ayr azb azj bak bam ban bel bem ben bho bjn bod bos bug bul cat ceb ces cjk ckb crh cym dan deu dik dyu dzo ell eng epo est eus ewe fao fij fin fon fra fur fuv gaz gla gle glg grn guj hat hau heb hin hne hrv hun hye ibo ilo ind isl ita jav jpn kab kac kam kan kas kat kaz kbp kea khk khm kik kin kir kmb kmr knc kon kor lao lij lim lin lit lmo ltg ltz lua lug luo lus lvs mag mai mal mar min mkd mlt mni mos mri mya nld nno nob npi nso nus nya oci ory pag pan pap pbt pes plt pol por prs quy ron run rus sag san sat scn shn sin slk slv smo sna snd som sot spa srd srp ssw sun swe swh szl tam taq tat tel tgk tgl tha tir tpi tsn tso tuk tum tur twi tzm uig ukr umb urd uzn vec vie war wol xho ydd yor yue zho zsm zul').split(' '));
// 우리 코드(주로 639-1) → FLORES 639-3 별칭(불일치 보정)
const ISO3 = { sw:'swh', uz:'uzn', fa:'pes', ne:'npi', mg:'plt', om:'gaz', mn:'khk', az:'azj', lv:'lvs', ms:'zsm', ar:'arb', zh:'zho', et:'est', or:'ory', pa:'pan', ps:'pbt', kg:'kon', ks:'kas', ku:'kmr', yi:'ydd', 'zh-Hans':'zho', 'zh-Hant':'zho', 'pt-BR':'por' };
// 게이트가 오제외하면 안 되는 검증된 예외(예: 영어 기반 크리올 — 자원지표는 낮아도 모델이 잘 번역). 이미 배포된 양질.
const FORCE_OK = new Set(['pcm']);
function wikiArticles(code) {
  const out = curlText(`https://${code}.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json`, 15);
  try { return JSON.parse(out).query.statistics.articles || 0; } catch { return 0; }
}
function translatability(code) {
  if (FORCE_OK.has(code)) return { ok: true, why: 'allowlisted (verified-good creole/edge case)' };
  const inF = FLORES200.has(code) || FLORES200.has(ISO3[code] || '');
  const wiki = wikiArticles(code);
  const ok = inF || wiki >= 10000;
  return { ok, why: ok ? (inF ? 'in FLORES-200' : `Wikipedia ${wiki}≥10k`) : `NOT in FLORES-200 & Wikipedia ${wiki}<10k` };
}

// ---- YouVersion 코드→language_tag 해석기 (configuration API, 1회 캐시) ----
//  www.bible.com/languages/<code> 는 봇 차단(Client Challenge)되어 못 씀 → nodejs.bible.com JSON API 사용.
//  config 의 default_versions[]가 iso_639_1(2글자)·iso_639_3(3글자)·language_tag 매핑을 줌.
// 우리 코드 → YV language_tag 별칭. YV config 가 그 언어의 iso_639_1 을 비워둬 자동매핑이 안 되는 경우
//  (대개 macrolanguage 의 표준 변종을 별도 individual 코드로 카탈로그함: 에스토니아 et→ekk 등).
//  새 미스를 만나면: config 에서 이름으로 실제 language_tag 를 찾아(아래 --name 폴백이 자동으로 함) 여기 한 줄 추가.
const YV_TAG = { et: 'ekk' };
let _yvLangMap = null, _yvNameMap = null;
function _ensureYvMaps() {
  if (_yvLangMap !== null) return;
  _yvLangMap = new Map(); _yvNameMap = new Map();
  try {
    const j = JSON.parse(curlText('https://nodejs.bible.com/api/bible/configuration/3.1', 30));
    for (const L of (j.default_versions || [])) {
      if (!L.language_tag) continue;
      for (const k of [L.iso_639_1, L.iso_639_3, L.language_tag]) if (k) _yvLangMap.set(String(k).toLowerCase(), L.language_tag);
      for (const n of [L.name, L.local_name]) if (n) _yvNameMap.set(String(n).toLowerCase(), L.language_tag);
    }
  } catch {}
}
// 코드(또는 이름)로 YV language_tag 해석. 순서: 별칭 → config 직접매칭 → (이름 주어지면) 이름 검색.
function yvLangTag(code, name) {
  _ensureYvMaps();
  if (YV_TAG[code]) return YV_TAG[code];
  const direct = _yvLangMap.get(String(code).toLowerCase());
  if (direct) return direct;
  if (name) {                                   // 코드로 못 찾으면 이름으로(예: "Estonian" → "Estonian, Standard" = ekk)
    const nl = String(name).toLowerCase();
    if (_yvNameMap.get(nl)) return _yvNameMap.get(nl);
    for (const [n, tag] of _yvNameMap) if (n === nl || n.startsWith(nl + ',') || n.startsWith(nl + ' ')) return tag;
  }
  return code;                                   // 못 찾으면 코드 그대로(이미 tag 일 수 있음)
}
// ---- YouVersion: 언어의 버전 목록 (versions API; language_tag 기준) ----
function yvVersions(code, name) {
  const tag = flags.tag || yvLangTag(code, name);
  let j = null;
  try { j = JSON.parse(curlText(`https://nodejs.bible.com/api/bible/versions/3.1?language_tag=${encodeURIComponent(tag)}&type=all`, 25)); } catch {}
  const vs = (j && j.versions) || [];
  return vs.map(v => ({ id: v.id, title: (v.local_title || v.title || '').slice(0, 30), abbr: v.local_abbreviation || v.abbreviation || '' }));
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
  const vs = yvVersions(code, flags.name);
  let yvFull = null, yvNT = null;
  if (!vs.length) console.log(`YouVersion: (no versions under tag "${flags.tag || yvLangTag(code, flags.name)}") — if you believe it exists, find its real language_tag in the config and rerun with --name="<English name>" or --tag=<tag>`);
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

  // ---- 번역가능성 게이트(한계점) + 권장 ----
  const t = translatability(code);
  let rec;
  if (yvFull) rec = `FULL mode — YouVersion #${yvFull.id} (${yvFull.abbr}). yv:${yvFull.id}`;
  else if (ebFull) rec = `FULL mode via eBible — yv:"ebible:${ebFull.id}" (OT${ebFull.ot} NT${ebFull.nt})`;
  else if (yvNT) rec = `PARTIAL mode — YouVersion #${yvNT.id} (NT-only). OT→NT substitution + empty OT cites.`;
  else if (ebNT) rec = `PARTIAL mode via eBible — yv:"ebible:${ebNT.id}" (NT-only).`;
  else if (obs) rec = `OBS mode — no Bible found; Open Bible Stories exists. yv:"obs:${obs.repo}". (Or BRIDGE if speakers read a major language we already have.)`;
  else rec = `BRIDGE mode (mother-tongue prose + a bridge language's verses) — no Bible/OBS found under this code. If none works, defer ("coming soon"). NB: try the ISO 639-3 code too if this was a 2-letter code.`;
  console.log(`Resource note (advisory): ${t.ok ? 'has MT resources (' + t.why + ')' : '⚠ LOW-RESOURCE (' + t.why + ') — scrutinize the prose harder'}`);
  console.log(`→ RECOMMENDED MODE: ${rec}`);
  console.log(`  ⛔ DEPLOY GATE (this decides — not the resource note): after drafting, verify-prose back-translation must be FAITHFUL to the English source AND native review must have NO unresolved BLOCKER/MAJOR. Else DEFER — don't deploy; record "coming soon (needs a human/native translator)".`);
}
