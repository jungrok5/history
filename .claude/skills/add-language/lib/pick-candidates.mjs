#!/usr/bin/env node
// 다음에 추가할 언어 후보 랭킹 — Joshua Project(미전도·화자수·성경상태) + 저장소 추가완료 제외 + (옵션)모드.
//   두 정렬축으로 고른다: 미전도(unreached) / 화자수(speakers). 우리가 항상 쓰던 두 축.
// 사용법:
//   JP_API_KEY=... node .claude/skills/add-language/lib/pick-candidates.mjs [옵션]
//   --by=unreached|speakers   정렬축 (기본 unreached = 미전도 큰 것부터)
//   --top=N                   상위 N개 (기본 30)
//   --min-speakers=N          화자수 하한 (예: 1000000)
//   --religion=NAME           주요 종교 필터 (예: Islam, Hindu, Buddhism)
//   --mode                    상위 후보에 detect-mode 모드(full/eBible/partial/bridge/OBS) 주석 — 느림(언어당 네트워크)
//   --no-bible                성경 미보급(BibleStatus<=2)만 — "성경이 거의 없는" 언어 우선
// 데이터: JP v1 languages(미전도/성경상태) + people_groups(Population 합산=화자수). /tmp 에 6h 캐시.
// ⚠ JP_API_KEY 는 env 로만 — 저장소에 키 저장 금지. (joshuaproject.net/api/keys 무료 발급)
// ⛔ 이 툴은 "후보 제시"용 자문이다. 실제 배포 가부는 SKILL.md 의 실측 게이트(verify-prose + 원어민 검수)가 정한다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const KEY = process.env.JP_API_KEY;
if (!KEY) { console.error('✗ JP_API_KEY 환경변수가 없습니다. joshuaproject.net/api/keys 에서 무료 발급 후:\n    export JP_API_KEY=발급키\n  그리고 다시 실행하세요.'); process.exit(2); }

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const by = args.by === 'speakers' ? 'speakers' : 'unreached';
const top = +(args.top || 30);
const minSpk = +(args['min-speakers'] || 0);
const relFilter = args.religion ? String(args.religion).toLowerCase() : null;

function curlJSON(url, t = 50) {
  const out = execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', String(t), url], { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
  return JSON.parse(out);
}
function cached(name, ttlMs, fn) {                 // /tmp 캐시 (반복 실행 시 재요청 방지)
  const f = `/tmp/jp-${name}.json`;
  try { if (Date.now() - fs.statSync(f).mtimeMs < ttlMs) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  const d = fn(); try { fs.writeFileSync(f, JSON.stringify(d)); } catch {}
  return d;
}
const SIXH = 6 * 3600e3;
process.stderr.write('JP 데이터 로드(캐시 6h)… ');
const langs = cached('languages', SIXH, () => curlJSON(`https://api.joshuaproject.net/v1/languages.json?api_key=${KEY}&limit=20000`));
const pgs = cached('peoplegroups', SIXH, () => curlJSON(`https://api.joshuaproject.net/v1/people_groups.json?api_key=${KEY}&limit=20000`));
process.stderr.write(`languages ${langs.length} · people_groups ${pgs.length}\n`);

// 화자수: people_groups Population 을 ROL3(언어) 별 합산
const speakers = new Map();
for (const p of pgs) { if (p.ROL3) speakers.set(p.ROL3, (speakers.get(p.ROL3) || 0) + (+p.Population || 0)); }

// 저장소 추가완료 언어 → ROL3 집합 (YouVersion config 매핑 + 특수코드 보정)
const addedCodes = ['ko', 'en', ...fs.readdirSync(path.join(root, 'i18n')).filter(f => f.endsWith('.json') && f !== 'en.json').map(f => f.replace('.json', ''))];
const cfgMap = new Map();
try {
  const cfg = curlJSON('https://nodejs.bible.com/api/bible/configuration/3.1', 30);
  for (const L of (cfg.default_versions || [])) { const t3 = L.iso_639_3; if (!t3) continue; if (L.iso_639_1) cfgMap.set(L.iso_639_1.toLowerCase(), t3.toLowerCase()); cfgMap.set(t3.toLowerCase(), t3.toLowerCase()); }
} catch {}
const MANUAL = { 'pt-BR': ['por'], 'zh-Hans': ['cmn'], 'zh-Hant': ['cmn'] };  // 우리 특수 코드 → ROL3
// YouVersion config 에 iso_639_1 이 없어 매핑 안 되는 2글자 코드의 ISO 639-1→639-3 보정.
// 거대 어군(macrolanguage)은 "표준 대표 변종"만 제외한다 — 별개 번역이 존재하는 변종(예: azb 남부 아제리,
// 다양한 Quechua/Fulfulde)은 후보로 남겨야 하므로 macro 코드만 두고 멤버 전체를 막지 않는다.
const ISO1 = {
  ay: ['aym', 'ayr'], az: ['aze', 'azj'], ff: ['ful'], gn: ['grn', 'gug'],
  kg: ['kon', 'kng'], ks: ['kas'], om: ['orm', 'gaz'], or: ['ori', 'ory'],
  ps: ['pus', 'pbu'], qu: ['que'], ti: ['tir'], uz: ['uzb', 'uzn'], wo: ['wol'],
};
const toROL3 = c => MANUAL[c] || ISO1[c.toLowerCase()] || (cfgMap.get(c.toLowerCase()) ? [cfgMap.get(c.toLowerCase())] : null) || (c.length === 3 ? [c.toLowerCase()] : null);
const addedROL3 = new Set(addedCodes.flatMap(c => toROL3(c) || []));

// 병합 + 후보 필터(추가완료 제외)
let rows = langs.map(L => ({
  rol3: L.ROL3, name: L.Language, spk: speakers.get(L.ROL3) || 0,
  jps: L.JPScale != null && L.JPScale !== '' ? +L.JPScale : null, lr: L.LeastReached,
  ev: L.PercentEvangelical, bib: L.BibleStatus, rel: L.PrimaryReligion || '', ctry: L.HubCountry || ''
})).filter(r => r.rol3 && !addedROL3.has(r.rol3) && r.spk > 0);
if (minSpk) rows = rows.filter(r => r.spk >= minSpk);
if (relFilter) rows = rows.filter(r => r.rel.toLowerCase().includes(relFilter));
if (args['no-bible']) rows = rows.filter(r => r.bib != null && +r.bib <= 2);

// 정렬축
if (by === 'speakers') rows.sort((a, b) => b.spk - a.spk);
else { rows = rows.filter(r => r.lr === 'Y' || (r.jps != null && r.jps <= 2)); rows.sort((a, b) => (a.jps ?? 9) - (b.jps ?? 9) || b.spk - a.spk); }
rows = rows.slice(0, top);

// (옵션) 모드 주석 — detect-mode (느림)
const DM = path.join(__dirname, 'detect-mode.mjs');
const modeOf = rol3 => { try { const o = execFileSync('node', [DM, rol3], { encoding: 'utf8', maxBuffer: 64e6, timeout: 100000 }); return (o.match(/RECOMMENDED MODE: (\w+)/) || [, '?'])[1]; } catch { return '?'; } };

// 출력
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);
const bibTxt = b => b == null ? '-' : ['none', 'translation', 'portions', 'NT', 'NT+', 'full'][+b] || String(b);
console.log(`\n# 후보 ${rows.length}개 — 정렬: ${by === 'unreached' ? '미전도(JPScale↑·화자수↓)' : '화자수'} · 추가완료 ${addedROL3.size} 제외${relFilter ? ' · 종교=' + args.religion : ''}${args['no-bible'] ? ' · 성경거의없음' : ''}`);
console.log('순위 ROL3 화자수   JPS LR 복음%  성경상태     주요종교        국가              언어' + (args.mode ? '            모드' : ''));
console.log('─'.repeat(args.mode ? 110 : 96));
rows.forEach((r, i) => {
  let line = `${String(i + 1).padStart(3)} ${r.rol3}  ${fmt(r.spk).padStart(6)} ${String(r.jps ?? '-').padStart(3)} ${(r.lr || '-').padStart(2)} ${String(r.ev ?? '-').padStart(5)} ${bibTxt(r.bib).padEnd(11)} ${r.rel.padEnd(14).slice(0, 14)} ${r.ctry.padEnd(16).slice(0, 16)} ${r.name}`;
  if (args.mode) line += '  ' + modeOf(r.rol3);
  console.log(line);
});
console.log(`\n※ JPScale 1=미전도 … 5=충분히전도 · LR=LeastReached · 성경상태 0=없음~5=완역.`);
console.log(`※ 모드/배포 가부는 'node lib/detect-mode.mjs <rol3>' 와 실측 게이트(verify-prose+원어민검수)가 최종 결정.`);
