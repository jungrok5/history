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
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://one-scroll-bible.com';
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
function langsFor(slug) {
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
  return h;
}

function setLangAttrs(html, lang, pack) {
  const dir = (pack && pack.dir) || 'ltr';
  return html
    .replace(/<html lang="[^"]*"(?: dir="[^"]*")?>/, `<html lang="${lang}"${dir === 'rtl' ? ' dir="rtl"' : ''}>`)
    .replace(/<body class="[^"]*">/, `<body class="${lang}">`);
}

// Pin the page's language; inject the full pack for non-ko/en so the runtime
// hydrates the inline data (T/FACTS/LX/REGION) into the active language.
function pinLang(html, lang, pack) {
  let inject = `<script>window.__SUBLANG__=${JSON.stringify(lang)};`;
  if (pack) inject += `window.__PACK__=${JSON.stringify(pack)};`;
  inject += `</script>`;
  return html.replace(/(<body[^>]*>)/, `$1\n${inject}`);
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
    for (const lang of langs) {
      if (lang === 'ko') continue;
      const pack = loadPack(page.slug, lang);
      const get = makeGet(lang, T, pack);
      let h = prerenderBody(tpl, get);
      h = replaceTokens(h, totals);
      h = setLangAttrs(h, lang, pack);
      h = bakeHead(h, page, lang, langs, get, pack);
      h = pinLang(h, lang, pack);
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
