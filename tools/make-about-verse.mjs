// Verbatim GATE for the about hero verse (Revelation 7:9) in i18n/about/<code>.json.
// Unlike the maps verse (a FULL verse → make-maps-verse.mjs injects it), the about hero quotes
// only the FIRST clause of Rev 7:9 ("…from every nation, from all tribes and peoples and
// languages …"), so it can't be machine-sliced across languages. This tool therefore VERIFIES
// (it never rewrites — the translator's quote chars, ellipsis and localized citation, incl.
// conventions like German "7,9", are left untouched): it fetches the full Rev 7:9 from
// fetch-verse (the only trusted source) and checks that the pack's quoted slice is a verbatim
// substring of it. If it is NOT (e.g. AI-paraphrased, or copied from a different edition),
// it prints the full verbatim verse and FAILS, so the translator/native-reviewer re-slices
// from real Scripture. Generic + deterministic → safe for any of the site's languages.
//
//   node tools/make-about-verse.mjs <code>      # verify one language (exit 1 if not verbatim)
//   node tools/make-about-verse.mjs --all       # every i18n/about/*.json (except ko/en)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FV = path.join(root, '.claude/skills/add-language/lib/fetch-verse.mjs');

// Collapse whitespace + drop the leading/trailing ellipsis so a partial quote compares
// cleanly against the full verse. Does NOT touch inner punctuation (verbatimness depends on it).
const norm = (s) => (s || '').replace(/[…]|\.\.\./g, ' ').replace(/\s+/g, ' ').trim();

function checkOne(code) {
  const aboutPath = path.join(root, 'i18n/about', code + '.json');
  const mainPath = path.join(root, 'i18n', code + '.json');
  if (!fs.existsSync(aboutPath)) { console.log(code, '— no about pack, skip'); return null; }
  if (!fs.existsSync(mainPath)) { console.log(code, '— no main pack (need yv/books), skip'); return null; }
  const about = JSON.parse(fs.readFileSync(aboutPath, 'utf8'));
  const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  const yv = main.yv;
  if (!yv) { console.log(code, '— main pack has no yv, skip'); return null; }

  // Fetch the full verbatim Rev 7:9.
  const full = execSync(`node ${FV} ${yv} REV.7.9`, { encoding: 'utf8' }).split('\t').slice(1).join(' ').trim();
  if (!full || /MISSING|FAIL/.test(full)) { console.log(code, '— fetch-verse failed, skip'); return null; }

  // Pull the quoted slice out of the current s.verse: drop the trailing "(citation)" and the
  // outer quote marks (a comprehensive set incl. German „ “ ‚ ‟, guillemets, CJK brackets).
  const cur = (about.s && about.s.verse) || '';
  const noCite = cur.replace(/\s*[（(][^（()）]*[)）]\s*$/, '').trim();
  const QUOTES = '“”„‟"«»‹›「」『』〈〉＂';
  const stripRe = new RegExp(`^[${QUOTES}]+|[${QUOTES}]+$`, 'g');
  const slice = noCite.replace(stripRe, '').trim();

  const verbatim = norm(slice).length > 0 && norm(full).includes(norm(slice));

  if (!verbatim) {
    console.log(`\n${code} ✗ about s.verse is NOT a verbatim slice of Rev 7:9.`);
    console.log(`  stored slice:  ${slice}`);
    console.log(`  full verbatim (${yv} REV.7.9):\n  ${full}`);
    console.log(`  → re-slice the opening clause (up to "…peoples and languages") VERBATIM from the above.`);
    return false;
  }
  console.log(`${code} ✓ verbatim slice of Rev 7:9 confirmed`);
  return true;
}

const arg = process.argv[2];
if (arg === '--all') {
  const codes = fs.readdirSync(path.join(root, 'i18n/about')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).filter(c => c !== 'ko' && c !== 'en');
  let ok = 0, bad = 0;
  for (const c of codes) { const r = checkOne(c); if (r === true) ok++; else if (r === false) bad++; }
  console.log(`\n${ok} verbatim · ${bad} need re-slicing.`);
  process.exit(bad ? 1 : 0);
} else if (arg) {
  const r = checkOne(arg);
  process.exit(r === false ? 1 : 0);
} else {
  console.error('usage: node tools/make-about-verse.mjs <code> | --all');
  process.exit(1);
}
