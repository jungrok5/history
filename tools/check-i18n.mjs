// i18n completeness gate — catches "key/array added to the reference but not
// propagated to a language pack" before build/deploy. Covers all three surfaces:
//   • main   : i18n/<code>.json  vs  i18n/en.json   (s keys + epochs/core/love/mis lengths)
//   • about  : i18n/about/<code>.json vs i18n/about/en.json  (s keys + facts length)
//   • maps   : i18n/maps/<code>.json vs i18n/maps/en.json    (s keys + per-segment places/labels/journeys)
// Also: every LANGS code in index.html must have a main pack (or be ko, inline).
//   node tools/check-i18n.mjs            → report; exit 1 if any HARD problem
//   imported: checkI18n() → { errors:[], warnings:[] }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const list = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];

// Keys legitimately allowed to be absent in a pack (conditional / partial-mode).
// Empty for now — we WANT every gap surfaced. Add a key here only if its absence is by design.
const OPTIONAL_MAIN = new Set([]);

export function checkI18n() {
  const errors = [], warnings = [];
  const tally = {}; // key → count, for compact reporting

  // ---- main ----
  const en = J(path.join(root, 'i18n/en.json'));
  const enKeys = Object.keys(en.s || {});
  const arrRef = { epochs: 13, core: 7, love: 13, mis: 13 };
  for (const f of list(path.join(root, 'i18n')).filter(f => f !== 'en.json')) {
    const code = f.slice(0, -5), p = J(path.join(root, 'i18n', f));
    const ps = new Set(Object.keys(p.s || {}));
    for (const k of enKeys) if (!ps.has(k) && !OPTIONAL_MAIN.has(k)) tally['main s.' + k] = (tally['main s.' + k] || 0) + 1;
    for (const a of Object.keys(arrRef)) if (p[a] && p[a].length !== arrRef[a]) errors.push(`main/${code}: ${a} length ${p[a].length} ≠ ${arrRef[a]}`);
  }

  // ---- sub-pages (about, maps) ----
  for (const slug of ['about', 'maps']) {
    const dir = path.join(root, 'i18n', slug);
    const enp = path.join(dir, 'en.json');
    if (!fs.existsSync(enp)) continue;
    const ref = J(enp), refKeys = Object.keys(ref.s || {});
    for (const f of list(dir).filter(f => f !== 'en.json')) {
      const code = f.slice(0, -5), p = J(path.join(dir, f));
      const ps = new Set(Object.keys(p.s || {}));
      for (const k of refKeys) if (!ps.has(k)) tally[`${slug} s.${k}`] = (tally[`${slug} s.${k}`] || 0) + 1;
      if (slug === 'about' && (p.facts || []).length !== (ref.facts || []).length)
        errors.push(`about/${code}: facts ${(p.facts || []).length} ≠ ${(ref.facts || []).length}`);
      if (slug === 'maps') {
        for (const seg of ['ot', 'jesus', 'paul']) {
          if (!p[seg]) { errors.push(`maps/${code}: segment ${seg} missing`); continue; }
          const a = Object.keys(ref[seg].places).sort().join(), b = Object.keys(p[seg].places).sort().join();
          if (a !== b) { errors.push(`maps/${code}: ${seg} place ids differ`); continue; }
          if ((ref[seg].labels || []).length !== (p[seg].labels || []).length) errors.push(`maps/${code}: ${seg} labels length`);
          if (Object.keys(ref[seg].journeys).sort().join() !== Object.keys(p[seg].journeys).sort().join()) errors.push(`maps/${code}: ${seg} journey keys differ`);
          // per-place events array length parity (catches dropped/added bullets a translator might introduce)
          for (const id of Object.keys(ref[seg].places)) {
            const re = (ref[seg].places[id].events || []).length, pe = (p[seg].places[id] && p[seg].places[id].events || []).length;
            if (re !== pe) errors.push(`maps/${code}: ${seg}.${id}.events length ${pe} ≠ ${re}`);
          }
        }
        // hero verse must be INJECTED verbatim (make-maps-verse), not the English placeholder still equal to en.json
        if (p.s && ref.s && p.s.verse && p.s.verse === ref.s.verse)
          errors.push(`maps/${code}: s.verse still equals English — run make-maps-verse ${code}`);
      }
    }
  }

  // ---- homoglyph / cross-script contamination scan (sub-page packs) ----
  // Drafting-agent autocomplete can inject stray characters that a same-Unicode-block scan
  // misses. Two real batch-4 defects the native reviewers caught but the earlier scan did not:
  //   (a) tn "Malета" — Latin place name with a Cyrillic "ета" tail (homoglyph),
  //   (b) as maps — one Bengali RA U+09B0 "র" where Assamese uses ৰ U+09F0.
  // Scoped to about/maps packs (low-HTML surfaces) and made false-positive-free:
  //   • rule A fires only on Latin-majority packs, flagging any Cyrillic/Greek letter — so a
  //     Greek pack (el) or Cyrillic pack is skipped, and a Latin Bible pack never legitimately
  //     carries Cyrillic/Greek, so tn's "ета" is caught with zero false positives.
  //   • rule B is Assamese-specific (as never uses র). (The main as pack has 8 pre-existing
  //     stray র — surfaced separately; this gate guards new about/maps work.)
  const scriptOf = (cp) => {
    if ((cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A) || (cp >= 0xC0 && cp <= 0x24F)) return 'Latin';
    if (cp >= 0x400 && cp <= 0x4FF) return 'Cyrillic';
    if (cp >= 0x370 && cp <= 0x3FF) return 'Greek';
    return null;
  };
  const scanValues = (obj, cb) => {
    if (typeof obj === 'string') cb(obj.replace(/<[^>]*>/g, ' ')); // strip HTML tags first
    else if (Array.isArray(obj)) obj.forEach(v => scanValues(v, cb));
    else if (obj && typeof obj === 'object') Object.values(obj).forEach(v => scanValues(v, cb));
  };
  for (const slug of ['about', 'maps']) {
    const dir = path.join(root, 'i18n', slug);
    for (const f of list(dir)) {
      const code = f.slice(0, -5), pack = J(path.join(dir, f));
      const count = { Latin: 0, Cyrillic: 0, Greek: 0 };
      const foreign = new Set();
      scanValues(pack, (s) => {
        for (const ch of s) { const sc = scriptOf(ch.codePointAt(0)); if (sc) count[sc]++; }
        if (code === 'as' && s.includes('র')) errors.push(`maps/${code}: Bengali RA U+09B0 "র" — Assamese uses ৰ U+09F0 (in "${s.trim().slice(0, 30)}…")`);
      });
      const base = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
      if (base === 'Latin' && (count.Cyrillic || count.Greek)) {
        scanValues(pack, (s) => {
          for (const tok of s.split(/\s+/)) {
            if ([...tok].some(ch => { const sc = scriptOf(ch.codePointAt(0)); return sc === 'Cyrillic' || sc === 'Greek'; }) &&
                [...tok].some(ch => scriptOf(ch.codePointAt(0)) === 'Latin'))
              errors.push(`${slug}/${code}: Latin token with Cyrillic/Greek homoglyph "${tok}"`);
          }
        });
      }
    }
  }

  // ---- every LANGS code has a main pack? ----
  try {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const blk = html.slice(html.indexOf('const LANGS=['), html.indexOf('];', html.indexOf('const LANGS=[')));
    const codes = [...blk.matchAll(/\{code:'([^']+)'/g)].map(m => m[1]);
    for (const c of codes) if (c !== 'ko' && c !== 'en' && !fs.existsSync(path.join(root, 'i18n', c + '.json')))
      errors.push(`LANGS code "${c}" has no i18n/${c}.json pack`);
  } catch {}

  // missing-key tallies → warnings (compact)
  for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1]))
    warnings.push(`${k}: missing in ${n} pack(s)`);
  return { errors, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings } = checkI18n();
  if (warnings.length) { console.log('⚠ i18n missing keys:'); warnings.forEach(w => console.log('  ' + w)); }
  if (errors.length) { console.log('\n✗ i18n HARD errors:'); errors.forEach(e => console.log('  ' + e)); }
  if (!warnings.length && !errors.length) console.log('✓ i18n complete — every pack has every reference key.');
  process.exit(errors.length ? 1 : 0);
}
