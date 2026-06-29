// Per-language static generation for the standalone sub-pages (/about/, /maps/).
// Mirrors the main site's model: ko is the committed, prerendered root page
// (about/index.html, maps/index.html); every other language is generated at
// build time into /about/<code>/ and /maps/<code>/ with a prerendered body,
// per-language <head> (title/description/OG/Twitter/canonical/hreflang/JSON-LD)
// and a pinned window.__SUBLANG__ so the page boots in its own language.
//
//   node tools/build-subpages.mjs --bake   # prerender ko body into the committed
//                                           # root pages + inject hreflang (run when
//                                           # ko content changes; idempotent)
//   node tools/build-subpages.mjs          # generate every non-ko subpage
//
// Translatable strings for ko/en live inline in each template's `const T={...}`.
// Additional languages come from i18n/<page>/<code>.json (flat {key:value} +
// optional facts/region), enabling independent, gated rollout per page.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://one-scroll-bible.com';
// short hash of og.png → ?v= cache-bust so social platforms re-fetch when the image changes
function ogVer() { try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'og.png'))).digest('hex').slice(0, 8); } catch { return ''; } }
function bustOg(html) { const v = ogVer(); return v ? html.replace(/(og:image" content="[^"]*\/og\.png)(\?v=[^"]*)?"/g, `$1?v=${v}"`).replace(/(twitter:image" content="[^"]*\/og\.png)(\?v=[^"]*)?"/g, `$1?v=${v}"`) : html; }
const BRAND = { ko: '한눈에 보는 성경 이야기', en: 'Bible in One Scroll' };

const PAGES = [
  { slug: 'about', file: 'about/index.html',
    title: { ko: '모든 민족과 방언에게 · To Every Tribe and Tongue', en: 'To Every Tribe and Tongue · Bible in One Scroll' },
    ld: 'AboutPage' },
  { slug: 'maps', file: 'maps/index.html',
    title: { ko: '지도로 보는 성경 · Bible by Map', en: 'Bible by Map · Bible in One Scroll' },
    ld: 'WebPage' },
];

// ---- helpers ----
const p = (...a) => path.join(root, ...a);
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const attrEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// Evaluate the inline `const T = { ... };` object literal from a template.
function parseT(html) {
  const start = html.indexOf('const T = {');
  if (start < 0) throw new Error('inline T not found');
  const open = html.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const body = html.slice(open, i);
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return (' + body + ')')();
}

// Languages available for a page: ko + en (inline) + any i18n/<slug>/<code>.json.
export function langsFor(slug) {
  const dir = p('i18n', slug);
  let extra = [];
  if (fs.existsSync(dir)) extra = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
  return ['ko', 'en', ...extra.filter(c => c !== 'ko' && c !== 'en')];
}

// Load a language pack (i18n/<slug>/<code>.json); null for ko/en (inline T).
function loadPack(slug, lang) {
  if (lang === 'ko' || lang === 'en') return null;
  return JSON.parse(fs.readFileSync(p('i18n', slug, lang + '.json'), 'utf8'));
}
// data-t string getter: inline T for ko/en, else pack.s (falling back to en).
function makeGet(lang, T, pack) {
  if (lang === 'ko' || lang === 'en') return (k) => (T[k] && T[k][lang] != null ? T[k][lang] : null);
  const s = (pack && pack.s) || {};
  return (k) => (s[k] != null ? s[k] : (T[k] && T[k].en != null ? T[k].en : null));
}

// Build-time counts from a page's data.json totals (auto-updating, idempotent).
// Numbers live inside comment markers so they persist across rebuilds and update
// in place: <!--LC-->214<!--/LC--> = total languages, <!--VC-->197<!--/VC--> = editions.
function pageTotals(slug) {
  const f = p(slug, 'data.json');
  if (!fs.existsSync(f)) return null;
  try { return (JSON.parse(fs.readFileSync(f, 'utf8')).totals) || null; } catch { return null; }
}
function replaceTokens(html, totals) {
  if (!totals) return html;
  let h = html;
  if (totals.languages != null)
    h = h.replace(/<!--LC-->[\s\S]*?<!--\/LC-->/g, `<!--LC-->${totals.languages}<!--/LC-->`);
  if (totals.distinctVersions != null)
    h = h.replace(/<!--VC-->[\s\S]*?<!--\/VC-->/g, `<!--VC-->${totals.distinctVersions}<!--/VC-->`);
  return h;
}

// Fill every <tag data-t="key">…</tag> with the language's string.
function prerenderBody(html, get) {
  return html.replace(/(<(\w+)\b[^>]*\bdata-t="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, openTag, _tag, key, _inner, closeTag) => {
      const v = get(key);
      return v == null ? m : openTag + v + closeTag;
    });
}

function hreflangBlock(slug, langs) {
  const href = (c) => c === 'ko' ? `${ORIGIN}/${slug}/` : `${ORIGIN}/${slug}/${c}/`;
  const lines = langs.map(c => `<link rel="alternate" hreflang="${c}" href="${href(c)}" />`);
  lines.push(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}/${slug}/" />`);
  return lines.join('\n');
}

// Replace/insert the <head> SEO for a given language.
function bakeHead(html, page, lang, langs, get, pack) {
  const slug = page.slug;
  const url = lang === 'ko' ? `${ORIGIN}/${slug}/` : `${ORIGIN}/${slug}/${lang}/`;
  const title = (pack && pack.docTitle) || page.title[lang]
    || (stripTags(get('title')) + ' · ' + (BRAND[lang] || BRAND.en));
  const desc = (pack && pack.metaDesc) || stripTags(get('purpose')) || stripTags(get('verse'));
  const locMain = lang === 'ko' ? 'ko_KR' : (lang === 'en' ? 'en_US' : lang);

  let h = html;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[\s\S]*?">/, `<meta name="description" content="${attrEsc(desc)}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  h = h.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  h = h.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${attrEsc(title)}" />`);
  h = h.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attrEsc(desc)}" />`);
  h = h.replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${locMain}" />`);
  h = h.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${attrEsc(title)}" />`);
  h = h.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${attrEsc(desc)}" />`);
  // JSON-LD: point url + name at this language's page
  h = h.replace(/("@type":"(?:AboutPage|WebPage)","name":")[^"]*(","url":")[^"]*(")/,
    `$1${attrEsc(title)}$2${url}$3`);
  // hreflang cluster (remove any existing, then inject once after canonical)
  h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  h = h.replace(/(<link rel="canonical" href="[^"]*" \/>\n)/, `$1${hreflangBlock(slug, langs)}\n`);
  return bustOg(h);
}

function setLangAttrs(html, lang, pack) {
  const dir = (pack && pack.dir) || 'ltr';
  return html
    .replace(/<html lang="[^"]*"(?: dir="[^"]*")?>/, `<html lang="${lang}"${dir === 'rtl' ? ' dir="rtl"' : ''}>`)
    .replace(/<body class="[^"]*">/, `<body class="${lang}">`);
}

// code → {native, en} from index.html LANGS (for the switcher's English-name search).
let _LANGMETA = null;
function langMeta() {
  if (_LANGMETA) return _LANGMETA;
  _LANGMETA = { ko: { native: '한국어', en: 'Korean' }, en: { native: 'English', en: 'English' } };
  try {
    const html = fs.readFileSync(p('index.html'), 'utf8');
    const blk = html.slice(html.indexOf('const LANGS=['), html.indexOf('];', html.indexOf('const LANGS=[')));
    for (const m of blk.matchAll(/\{code:'([^']+)',native:'((?:[^'\\]|\\.)*)',en:'((?:[^'\\]|\\.)*)'[^}]*\}/g))
      _LANGMETA[m[1]] = { native: m[2].replace(/\\'/g, "'"), en: m[3].replace(/\\'/g, "'") };
  } catch {}
  return _LANGMETA;
}
// Canonical language order = main index.html LANGS order (curated by reach: ko, en, zh, ja, …),
// so the 🌐 switcher reads identically on every page and in every language. Codes not in LANGS
// (sub-page-only, if any) sort after, alphabetically.
let _LANGSORDER = null;
function langsOrder() {
  if (_LANGSORDER) return _LANGSORDER;
  _LANGSORDER = new Map();
  try {
    const html = fs.readFileSync(p('index.html'), 'utf8');
    const blk = html.slice(html.indexOf('const LANGS=['), html.indexOf('];', html.indexOf('const LANGS=[')));
    [...blk.matchAll(/\{code:'([^']+)'/g)].forEach((m, i) => _LANGSORDER.set(m[1], i));
  } catch {}
  return _LANGSORDER;
}

// [ [code, native, en], … ] for every language a page is available in — drives the
// 🌐 search switcher dynamically (no hardcoded list, so it scales to the full set).
function subLangList(slug) {
  const meta = langMeta(), order = langsOrder();
  const rank = (c) => order.has(c) ? order.get(c) : 1e6;
  return langsFor(slug)
    .slice()
    .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b))
    .map(c => {
      const m = meta[c];
      if (m) return [c, m.native, m.en];
      try { return [c, JSON.parse(fs.readFileSync(p('i18n', slug, c + '.json'), 'utf8')).menuName || c, c]; }
      catch { return [c, c, c]; }
    });
}
// Inject page globals after <body>, idempotently (strip any prior injection first):
//   __SUBLANG__ (pinned language) · __PACK__ (non-ko/en hydration) · __SUBLANGS__ (switcher list)
//   · __XLANGS__ (which langs each cross-linked surface has, for the relink() helper)
function injectGlobals(html, parts) {
  html = html.replace(/\n?<script>window\.__(?:SUBLANG|PACK|SUBLANGS|XLANGS)__[\s\S]*?<\/script>/g, '');
  return html.replace(/(<body[^>]*>)/, `$1\n<script>${parts.join('')}</script>`);
}

// Cross-surface language availability for relink(): main has every language; about/maps only
// the langs with a pack. Lets each generated page localize its /about/ /maps/ / cross-links to
// the active language, falling back to the neutral (ko) page when a surface lacks that language.
function xlangsGlobal() {
  return `window.__XLANGS__=${JSON.stringify({ about: langsFor('about'), maps: langsFor('maps') })};`;
}

// Prerender ko into the committed root pages + inject hreflang (idempotent).
export function bake() {
  for (const page of PAGES) {
    const tplPath = p(page.file);
    const tpl = fs.readFileSync(tplPath, 'utf8');
    const T = parseT(tpl);
    const langs = langsFor(page.slug);
    const get = makeGet('ko', T, null);
    let h = prerenderBody(tpl, get);
    h = replaceTokens(h, pageTotals(page.slug));
    h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
    h = h.replace(/(<link rel="canonical" href="[^"]*" \/>\n)/, `$1${hreflangBlock(page.slug, langs)}\n`);
    h = injectGlobals(h, [`window.__SUBLANGS__=${JSON.stringify(subLangList(page.slug))};`, xlangsGlobal()]);
    h = bustOg(h);
    fs.writeFileSync(tplPath, h);
    console.log(`baked ko + hreflang → ${page.file}`);
  }
}

// Generate every non-ko language into <slug>/<code>/index.html.
export function generate() {
  let wrote = 0;
  for (const page of PAGES) {
    const tpl = fs.readFileSync(p(page.file), 'utf8');
    const T = parseT(tpl);
    const langs = langsFor(page.slug);
    const totals = pageTotals(page.slug);
    const sublangs = subLangList(page.slug);
    for (const lang of langs) {
      if (lang === 'ko') continue;
      const pack = loadPack(page.slug, lang);
      const get = makeGet(lang, T, pack);
      let h = prerenderBody(tpl, get);
      h = replaceTokens(h, totals);
      h = setLangAttrs(h, lang, pack);
      h = bakeHead(h, page, lang, langs, get, pack);
      h = injectGlobals(h, [
        `window.__SUBLANG__=${JSON.stringify(lang)};`,
        pack ? `window.__PACK__=${JSON.stringify(pack)};` : '',
        `window.__SUBLANGS__=${JSON.stringify(sublangs)};`,
        xlangsGlobal(),
      ]);
      const outDir = p(page.slug, lang);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), h);
      wrote++;
    }
    console.log(`${page.slug}: generated ${langs.filter(l => l !== 'ko').join(', ') || '(ko only)'}`);
  }
  console.log(`sub-pages: ${wrote} files written`);
  return wrote;
}

// All sub-page URLs (ko root + every language) for sitemap.xml.
export function subpageUrls() {
  const urls = [];
  for (const page of PAGES) {
    for (const lang of langsFor(page.slug)) {
      urls.push(lang === 'ko' ? `${ORIGIN}/${page.slug}/` : `${ORIGIN}/${page.slug}/${lang}/`);
    }
  }
  return urls;
}

// CLI: `--bake` refreshes ko roots; default generates the non-ko sub-pages.
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--bake')) bake();
  else generate();
}
