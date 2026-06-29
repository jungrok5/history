// Which languages still need a sub-page pack (maps or about), in the canonical reach order
// (index.html LANGS). Makes batch selection deterministic — no ad-hoc one-liners, same pick for
// any session/contributor. Used in SKILL.md §9.
//   node tools/next-langs.mjs maps            → all missing maps codes, reach order
//   node tools/next-langs.mjs about 10        → next 10 missing about codes (+ menuName/yv hints)
//   node tools/next-langs.mjs maps 10 --json  → JSON array of the next 10 codes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const slug = process.argv[2];
if (slug !== 'maps' && slug !== 'about') { console.error('usage: node tools/next-langs.mjs <maps|about> [N] [--json]'); process.exit(2); }
const n = parseInt(process.argv.find(a => /^\d+$/.test(a)) || '0', 10);
const asJson = process.argv.includes('--json');

// reach order from index.html LANGS (single source)
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const blk = html.slice(html.indexOf('const LANGS=['), html.indexOf('];', html.indexOf('const LANGS=[')));
const order = [...blk.matchAll(/\{code:'([^']+)'/g)].map(m => m[1]);

const have = new Set(fs.readdirSync(path.join(root, 'i18n', slug)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)));
const missing = order.filter(c => c !== 'ko' && !have.has(c));
const pick = n ? missing.slice(0, n) : missing;

if (asJson) { console.log(JSON.stringify(pick)); process.exit(0); }

console.log(`${slug}: have ${have.size} · missing ${missing.length}`);
console.log(`next ${pick.length}: ${pick.join(' ')}`);
// hints (menuName + yv + dir) for drafting/verse-injection
for (const c of pick) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(root, 'i18n', c + '.json'), 'utf8'));
    console.log(`  ${c.padEnd(7)} ${m.menuName || ''}  | yv:${m.yv}  dir:${m.dir || 'ltr'}`);
  } catch { console.log(`  ${c}  (no main pack!)`); }
}
