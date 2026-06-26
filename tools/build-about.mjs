#!/usr/bin/env node
// Builds about/data.json — the static data snapshot for the /about/ sub-page.
// Sources: index.html LANGS + i18n packs (mode/version) + Joshua Project (speaker pop, env JP_API_KEY)
//          + DEFERRED.md (prayer list) + a curated John 3:16 showcase fetched verbatim.
// Output is a COMMITTED snapshot (the page is static; Vercel network policy may block JP/YV at build).
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const p = (f) => path.join(root, f);
const curlJSON = (u, t = 60) => JSON.parse(execSync(`curl -sS --max-time ${t} '${u}'`, { encoding: 'utf8', maxBuffer: 1 << 28 }));

// ---- 1) LANGS from index.html ----
const html = fs.readFileSync(p('index.html'), 'utf8');
const langsBlock = html.slice(html.indexOf('const LANGS=['), html.indexOf('];', html.indexOf('const LANGS=[')));
const LANGS = [...langsBlock.matchAll(/\{code:'([^']+)',native:'((?:[^'\\]|\\.)*)',en:'((?:[^'\\]|\\.)*)'\}/g)]
  .map(m => ({ code: m[1], native: m[2].replace(/\\'/g, "'"), en: m[3].replace(/\\'/g, "'") }));

// ---- 2) per-language mode + version from i18n packs (ko/en are full, inline) ----
function modeOf(pk) {
  if (String(pk.yv || '').startsWith('obs:')) return 'obs';          // sourced from Open Bible Stories
  if (pk.s && pk.s['bridge.note']) return 'bridge';
  if (pk.epochs && pk.epochs[0] && pk.epochs[0].cite === '') return 'partial';
  return 'full';
}
const meta = {};
for (const L of LANGS) {
  if (L.code === 'ko') { meta[L.code] = { mode: 'full', ver: '개역개정', yv: null }; continue; }
  if (L.code === 'en') { meta[L.code] = { mode: 'full', ver: 'ESV', yv: null }; continue; }
  const f = p(`i18n/${L.code}.json`);
  if (!fs.existsSync(f)) { meta[L.code] = { mode: 'full', ver: '', yv: null }; continue; }
  const pk = JSON.parse(fs.readFileSync(f, 'utf8'));
  meta[L.code] = { mode: modeOf(pk), ver: (pk.ui && pk.ui.version ? String(pk.ui.version).replace(/^\(|\)$/g, '') : ''), yv: pk.yv || null };
}

// ---- 3) Joshua Project speaker population by ROL3 (same logic as pick-candidates) ----
// Joshua Project people-group data. With a key we fetch live and write a slim cache
// (only the fields we use) so rebuilds are reproducible WITHOUT a key — same idea as the
// open dataset data-poems/joshua-project-data, but trimmed to exactly what this page needs.
const KEY = process.env.JP_API_KEY;
const CACHE = p('tools/jp-cache.json');
let groups = [];
if (KEY) {
  const pgs = curlJSON(`https://api.joshuaproject.net/v1/people_groups.json?api_key=${KEY}&limit=20000`);
  groups = pgs.map(g => ({ r: g.ROL3, p: +g.Population || 0, c: g.Continent || '', la: +g.Latitude, lo: +g.Longitude }));
  fs.writeFileSync(CACHE, JSON.stringify(groups));
  process.stderr.write(`JP fetched ${groups.length} groups → cached tools/jp-cache.json\n`);
} else if (fs.existsSync(CACHE)) {
  groups = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  process.stderr.write(`JP cache loaded ${groups.length} groups (no key — reproducible build)\n`);
} else {
  process.stderr.write('⚠ no JP_API_KEY and no cache — populations/coords will be 0\n');
}
let speakers = new Map(), jpWorld = 0, byCont = new Map(), geo = new Map();
for (const g of groups) {
  const pop = g.p || 0; jpWorld += pop;
  if (!g.r) continue;
  speakers.set(g.r, (speakers.get(g.r) || 0) + pop);
  if (g.c) { const m = byCont.get(g.r) || {}; m[g.c] = (m[g.c] || 0) + pop; byCont.set(g.r, m); }
  if (pop > 0 && isFinite(g.la) && isFinite(g.lo) && !(g.la === 0 && g.lo === 0)) {
    const e = geo.get(g.r);        // keep the single LARGEST group's location (mean drifts global langs into the ocean)
    if (!e || pop > e.p) geo.set(g.r, { p: pop, la: g.la, lo: g.lo });
  }
}
const regionOf = (rs) => {
  const tot = {};
  for (const r of rs) { const m = byCont.get(r); if (m) for (const k in m) tot[k] = (tot[k] || 0) + m[k]; }
  let best = '', bv = -1; for (const k in tot) if (tot[k] > bv) { bv = tot[k]; best = k; }
  return best || '';
};
const geoOf = (rs) => {            // location of the largest people-group across the chosen ROL3 set
  let best = null;
  for (const r of rs) { const e = geo.get(r); if (e && (!best || e.p > best.p)) best = e; }
  return best ? { lat: +best.la.toFixed(2), lng: +best.lo.toFixed(2) } : null;
};
const cfgMap = new Map();
try {
  const cfg = curlJSON('https://nodejs.bible.com/api/bible/configuration/3.1', 30);
  for (const L of (cfg.default_versions || [])) { const t3 = L.iso_639_3; if (!t3) continue; if (L.iso_639_1) cfgMap.set(L.iso_639_1.toLowerCase(), t3.toLowerCase()); cfgMap.set(t3.toLowerCase(), t3.toLowerCase()); }
} catch {}
const MANUAL = { 'pt-BR': ['por'], 'zh-Hans': ['cmn'], 'zh-Hant': ['cmn'] };
const ISO1 = { ay: ['aym', 'ayr'], az: ['aze', 'azj'], ff: ['ful'], gn: ['grn', 'gug'], kg: ['kon', 'kng'], ks: ['kas'], om: ['orm', 'gaz'], or: ['ori', 'ory'], ps: ['pus', 'pbu'], qu: ['que'], ti: ['tir'], uz: ['uzb', 'uzn'], wo: ['wol'] };
const OVR = { bs: ['bos'], et: ['ekk'], yi: ['ydd'], no: ['nor'], nn: ['nor'], sq: ['aln'], twi: ['aka'], ff: ['fuv'], qu: ['quz'], bal: ['bgp', 'bcc', 'bgn'], kln: ['sgc', 'niq', 'eyo', 'pko', 'spy', 'tuy'], raj: ['gju', 'wbr', 'rwr', 'mtr', 'mup'] };
const toROL3 = c => MANUAL[c] || ISO1[c.toLowerCase()] || (cfgMap.get(c.toLowerCase()) ? [cfgMap.get(c.toLowerCase())] : null) || (c.length === 3 ? [c.toLowerCase()] : null);

const seen = new Set(); let covered = 0;
const languages = LANGS.map(L => {
  const rs = OVR[L.code.toLowerCase()] || toROL3(L.code) || [];
  let pop = 0; for (const r of rs) { if (seen.has(r)) continue; const s = speakers.get(r) || 0; if (s > 0) { seen.add(r); pop += s; } }
  covered += pop;
  const g = geoOf(rs);
  return { code: L.code, native: L.native, en: L.en, mode: meta[L.code].mode, ver: meta[L.code].ver, pop, region: regionOf(rs), lat: g ? g.lat : null, lng: g ? g.lng : null };
});
// region aggregate (languages reached + their mother-tongue speakers, per continent)
const regions = {};
for (const l of languages) { const r = l.region || 'Other'; (regions[r] = regions[r] || { count: 0, pop: 0 }), regions[r].count++, regions[r].pop += l.pop; }

// ---- 4) DEFERRED.md → prayer/held list ----
const def = fs.readFileSync(p('.claude/skills/add-language/DEFERRED.md'), 'utf8');
const defRows = [...def.matchAll(/^\|\s*`?([^|`]+?)`?\s*\|\s*([^|]+?)\s*\|\s*(DEFERRED|HELD|COVERED-BY-PARENT)\s*\|\s*([^|]+?)\s*\|/gm)]
  .map(m => ({ code: m[1].trim(), language: m[2].trim(), category: m[3].trim(), reason: m[4].trim().replace(/`/g, '') }))
  .filter(r => r.code !== 'code');

// ---- 5) curated John 3:16 showcase (verbatim, diverse scripts) ----
const SHOW = [
  { code: 'ko', yv: null, label: '한국어 · 개역개정', usfm: 'JHN.3.16', text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
  { code: 'en', yv: 59, label: 'English · ESV', usfm: 'JHN.3.16', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
];
const FETCH = [
  ['el', 'Ελληνικά'], ['he', 'עברית'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'],
  ['th', 'ไทย'], ['my', 'မြန်မာ'], ['am', 'አማርኛ'], ['ka', 'ქართული'], ['hy', 'Հայերեն'],
  ['ru', 'Русский'], ['zh-Hant', '繁體中文'], ['ja', '日本語'], ['bn', 'বাংলা'], ['si', 'සිංහල'],
  ['km', 'ភាសាខ្មែរ'], ['lo', 'ລາວ'], ['or', 'ଓଡ଼ିଆ'],
];
for (const [code, label] of FETCH) {
  const yv = meta[code] && meta[code].yv; if (!yv) continue;
  try {
    const out = execSync(`node .claude/skills/add-language/lib/fetch-verse.mjs ${yv} JHN.3.16`, { encoding: 'utf8' }).trim();
    const text = out.split('\t').slice(1).join(' ').trim();
    if (text && !/MISSING|FAIL/.test(text)) SHOW.push({ code, yv, label: label + ' · ' + (meta[code].ver || 'YV' + yv), usfm: 'JHN.3.16', text });
    process.stderr.write(`showcase ${code} ✓\n`);
  } catch { process.stderr.write(`showcase ${code} ✗\n`); }
}

// ---- 6) aggregate + write ----
const counts = languages.reduce((a, l) => (a[l.mode] = (a[l.mode] || 0) + 1, a), {});
const versions = new Set(languages.map(l => l.ver).filter(Boolean));
const data = {
  generatedNote: 'Committed static snapshot. Regenerate with: JP_API_KEY=… node tools/build-about.mjs',
  totals: {
    languages: languages.length,
    modeCounts: counts,
    distinctVersions: versions.size,
    coveredSpeakers: Math.round(covered),
    jpWorld: Math.round(jpWorld),
    coveragePct: jpWorld ? +(covered / jpWorld * 100).toFixed(1) : null,
  },
  // Wycliffe Global Alliance — 2024/2025 Global Scripture Access (https://www.wycliffe.net/global-scripture-access/)
  world: {
    livingLanguages: 7396,
    fullBible: 776,
    newTestament: 1798,
    portions: 1433,
    inProgressLanguages: 3526,
    inProgressPeople: 1260000000,
    stillNeedLanguages: 544,
    stillNeedPeople: 36800000,
    asOf: '2024–2025',
    source: 'Wycliffe Global Alliance — Global Scripture Access',
    sourceUrl: 'https://www.wycliffe.net/global-scripture-access/',
  },
  languages: languages.sort((a, b) => b.pop - a.pop),
  regions,
  deferred: defRows,
  showcase: SHOW,
};
fs.mkdirSync(p('about'), { recursive: true });
fs.writeFileSync(p('about/data.json'), JSON.stringify(data, null, 1));
console.log(`about/data.json written — ${languages.length} languages · ${versions.size} versions · ${data.totals.coveragePct}% · showcase ${SHOW.length} · deferred ${defRows.length}`);
