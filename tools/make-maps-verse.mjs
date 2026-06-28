// Inject the maps hero verse (2 Peter 1:16) into i18n/maps/<code>.json — VERBATIM,
// never AI-translated. Reads the language's YouVersion id + localized book name from
// the main pack (i18n/<code>.json), fetches the full verse from fetch-verse (the only
// trusted source), and writes s.verse = "<full verse>" (localized citation).
// Generic + deterministic → safe to run for any of the site's languages.
//
//   node tools/make-maps-verse.mjs <code>          # one language
//   node tools/make-maps-verse.mjs --all           # every i18n/maps/*.json (except ko/en)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FV = path.join(root, '.claude/skills/add-language/lib/fetch-verse.mjs');

function injectOne(code) {
  const mapsPath = path.join(root, 'i18n/maps', code + '.json');
  const mainPath = path.join(root, 'i18n', code + '.json');
  if (!fs.existsSync(mapsPath)) { console.log(code, '— no maps pack, skip'); return false; }
  if (!fs.existsSync(mainPath)) { console.log(code, '— no main pack (need yv/books), skip'); return false; }
  const maps = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));
  const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  const yv = main.yv;
  if (!yv) { console.log(code, '— main pack has no yv, skip'); return false; }
  // localized "2 Peter 1:16" citation: prefer the pack's own s.verseCite (set by the
  // translator), else the main pack's books map (name → USFM), else English.
  const bookName = (Object.entries(main.books || {}).find(([, u]) => u === '2PE') || [])[0];
  const citeRef = (maps.s && maps.s.verseCite) || (bookName ? bookName + ' 1:16' : '2 Peter 1:16');
  const text = execSync(`node ${FV} ${yv} 2PE.1.16`, { encoding: 'utf8' }).split('\t').slice(1).join(' ').trim();
  if (!text || /MISSING|FAIL/.test(text)) { console.log(code, '— fetch-verse failed, skip'); return false; }
  const q = code === 'ja' ? ['「', '」'] : (maps.dir === 'rtl' ? ['«', '»'] : ['“', '”']);
  const cite = code === 'ja' ? `（${citeRef}）` : ` (${citeRef})`;
  maps.s.verse = q[0] + text + q[1] + cite;
  fs.writeFileSync(mapsPath, JSON.stringify(maps, null, 1) + '\n');
  console.log(code, '✓ verse injected (' + text.length + ' chars, cite "' + citeRef + '")');
  return true;
}

const arg = process.argv[2];
if (arg === '--all') {
  const codes = fs.readdirSync(path.join(root, 'i18n/maps')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).filter(c => c !== 'ko' && c !== 'en');
  let n = 0; for (const c of codes) if (injectOne(c)) n++;
  console.log(`\n${n} verses injected.`);
} else if (arg) {
  injectOne(arg);
} else {
  console.error('usage: node tools/make-maps-verse.mjs <code> | --all');
  process.exit(1);
}
