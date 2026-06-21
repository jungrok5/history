# CLAUDE.md — Project memory

> A concise summary so the next session can pick up fast. Read this before working.
> This file is written in English. **Communicate with the maintainer in Korean.**

## Project
**Bible in One Scroll (한눈에 보는 성경 이야기)** — the whole Bible's redemptive history
(Creation → Fall → … → Church → Restoration/Second Coming) told as a single mobile scroll,
leading from understanding the gospel to a **prayer to receive Christ**.
- Live: **https://one-scroll-bible.com/**
- Repo: `jungrok5/one-scroll-bible` (formerly `jungrok5/history`, renamed 2026-06-21; old URLs redirect)
- Maintainer's working language: **Korean** — reply in Korean.

## Content perspective (the standard for every edit — must follow)
**The evangelical · Reformed redemptive-historical (구속사) view shared by most of the Korean
Protestant church; Korean Revised Version (개역개정) as the Korean baseline.**
- Quote Scripture **verbatim from each language's representative official translation** — never
  paraphrase or invent. (ko 개역개정 · en ESV · zh 和合本/CUV · ja 新共同訳 · es RVR1960 ·
  pt-BR Almeida · fr LSG · de Lutherbibel(1912) · ru Синодальный · ar Van Dyck/SVD · etc. The
  exact version per language lives in `YV` / each pack's `ui.version` — never hard-code a second list.)
- Keep sensitive topics gently worded (murderer / "cheap grace" / "just be a good person";
  for non-ko, FAQ q3/a3 must reference **no specific films or events**). Rom 12:19 = "vengeance
  belongs to God," not a justification of revenge.

## File structure
- `index.html` — single-file app (HTML/CSS/vanilla JS). **ko & en content is inline**
  (KO_PACK/EN_PACK; EPOCHS/CORE/MIS/LOVE arrays), plus render functions, `LANGS`, the verse-link
  data (`BOOKS`/`BOOKOPT`/`YV`), NAV_MAP, and GA4.
- `i18n/<code>.json` — **every other language pack**, loaded at runtime via `fetch`. Keys:
  menuName, share, ui, labels, s.{…}, epochs[13], love[13], mis[13] (index **8 & 12 = null**), core[7].
- `i18n/en.json` — English template for contributors (kept in sync from EN_PACK by build-pages; **committed**).
- `tools/build-pages.mjs` — static page generator (uses index.html as the template). For each
  non-ko language it **prerenders the localized body** (so search/AI crawlers see real text without
  JS), bakes in per-language `<title>`/OG/canonical/hreflang + JSON-LD (WebSite + FAQPage), and
  writes `sitemap.xml` + `llms.txt`. It also stamps the service-worker cache name from the
  index.html hash and refreshes `i18n/en.json`.
- **Generated output is NOT committed** (Vercel regenerates it every deploy via the buildCommand):
  `/<code>/index.html`, `sitemap.xml`, `llms.txt`. See `.gitignore`.
- **Committed binaries** (Vercel can't generate these — no rsvg/fonts at build time):
  `og.png` (a **single shared OG image** for all languages), `icon-192/512.png`, `qr-<code>.png`.
  Every page's `og:image` points to the shared `/og.png`; `og:title`/`og:description` stay per-language.
- PWA: `manifest.webmanifest` + `sw.js` (navigate = network-first, assets = cache-first, same-origin only).
- Share: global + per-scene adaptive UI (mobile native + copy/image/QR; desktop social + copy/image/QR),
  canvas verse-image, QR modal (loads `qr-<code>.png` **lazily**, only when opened), deep links `#s1`–`#s13`.
- GA4 events: language_select · share{method} · scene_view · section_view · prayer_view · read_more.
- `vercel.json` (`buildCommand = node tools/build-pages.mjs` + security/cache headers), `robots.txt`.
  **`.vercelignore` keeps `CLAUDE.md` and `.claude` out of the deploy.**
- `.claude/skills/add-language/` — the **/add-language skill**. Follow its `SKILL.md` when adding a
  language. Helpers in `lib/`: validate · audit-links · integrate · make-qr · convert-digits ·
  fetch-verse · verify-verbatim · verify-inline · verify-prose · native-review-prompt.

## Single source of truth — do NOT track per-language state in this file
The language list, codes, and YouVersion version IDs live in **`index.html`** (`LANGS`, `BOOKS`, `YV`)
and `tools/build-pages.mjs` (`LANGS`). **Derive them from code; never keep a duplicate list here** —
duplicating it is what caused a merge conflict on every language PR.
- **When adding/changing a language, do NOT edit CLAUDE.md.** New cross-cutting gotchas go in
  `SKILL.md` (maintainer-owned, rarely touched), not here.
- Count languages: `node -e "console.log(require('fs').readdirSync('i18n').filter(f=>f.endsWith('.json')).length)"` (+ ko inline).

## Multilingual behavior
- For non-ko/en pages the **body is fetched at runtime from `i18n/<code>.json`** → verify live
  content against the **JSON file, not the HTML** (e.g. `curl .../i18n/th.json`). head/OG/meta carry
  per-language values baked in at build time.
- `window.__BOOTLANG__` boots each language page; browser-language auto-detect + 🌐 search switcher.

## Build & deploy pipeline
1. After editing content (index.html / i18n), run `node tools/build-pages.mjs`. Its page output is
   gitignored, so locally the run is to **confirm it succeeds** and to refresh the **committed**
   side-effects: `i18n/en.json` and the `sw.js` cache stamp. (OG/icon image steps need
   `rsvg-convert` + Noto/Nanum fonts; without them they are skipped and the committed PNGs are used.)
   - The generator uses index.html as the template, so editing index.html (en inline) re-derives all
     language pages — expected.
2. Pass validation (below), then commit.
3. **Deploy**: push the work branch → checkout `main` → `git merge --ff-only <branch>` →
   `git push origin main` → **Vercel auto-deploys** (it runs build-pages.mjs and serves the freshly
   generated pages — live output is identical whether or not the pages were committed).

## Git rules
- Work branch: **`claude/bible-timeline-mobile-site-cb8u6x`** (work & push here).
- Merge/push to `main` **only with explicit user permission** (it triggers a deploy). Prefer ff-only.
- Commits: Korean message; footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  and `Claude-Session: …`. **Never put a model identifier (e.g. `claude-opus-4-8`) in commits, code,
  or any artifact** — chat only.
- Open PRs only when asked.

## Validation (before commit) — run from repo root
```
node .claude/skills/add-language/lib/validate.mjs <code>        # structure, s-keys, HTML, film-free, native-digit, APP_JS — offline gate
node .claude/skills/add-language/lib/audit-links.mjs <code>     # display↔USFM, 0 missed links, anchors
node .claude/skills/add-language/lib/verify-verbatim.mjs <code> # epoch q + core vtext quotes verbatim
node .claude/skills/add-language/lib/verify-inline.mjs <code>   # inline quotes in body, EN baseline
node .claude/skills/add-language/lib/verify-prose.mjs <code>    # prose meaning via back-translation (candidates only)
```
`fetch-verse.mjs <YV> <USFM,…>` pulls verbatim verse text from bible.com — **the only trusted source;
WebFetch hallucinates verses.** `validate` is the deterministic offline gate; the verify-* tools are
advisory (they hit the network). Full procedure for a new language: see `SKILL.md`.

## Gotchas / pitfalls
- **Read a file in-session before you Edit it** (grep alone errors out).
- **Don't undo linter/user formatting**: i18n JSON uses `JSON.stringify(p,null,1)` (1-space indent);
  sitemap is one `<url>` per line; keep robots/README formatting as-is.
- zh-Hant uses **Taiwan standard glyphs** (為/裡/啟/吃/背); watch simplified→traditional miscoversions.
- Versification differs by translation: Isa 9:6 (CUV/ESV/Синод.) vs 9:5 (TB/BTT/Luther/新共同訳);
  LXX/Slavonic Psalms (exile = Ps 136, MT 137) for ru/uz/uk/tg/kk/ka/tk/tt — write each `cite` in the
  translation's own numbering (YouVersion does not remap). Per-language details are in SKILL.md's gotcha digest.
- Verse links: `verseUrl(usfm,code)` → ko → bskorea (개역개정); all others → YouVersion
  (`bible.com/bible/<YV>/<USFM>`). `linkifyRefs` is a tag-safe parser over `BOOKS[code]`/`BOOKOPT[code]`;
  `bookopt.bare` (colon-less chapter refs) is enabled only where book names don't collide with common words.
- Native-script prose can't be guaranteed by the model — use `lib/native-review-prompt.md` to run a
  per-language reviewer agent (it **reports only**; the main session applies real fixes after re-fetching verses).

## Partial mode (NT-only / partially translated languages)
Languages without a full OT are still added: NT quotes verbatim; OT key verses substituted from the NT
(e.g. Isa 53:5 → 1 Pet 2:24); OT storyline as unquoted summary; **OT references dropped**
(epoch[0..8].cite = "", OT inline refs removed, but NT refs in the same spot kept). `s["partial.note"]`
banner + `s["respond.read"]` (John button). First case = **ff (Fula)**.

## Current status
100+ languages (mostly full mode + a few partial like ff), ~90% population reach. The exact count is
auto-derived on the site from `LANGS` (build-pages fills the meta) — don't hand-maintain a number here.
The long-term goal (see README) is
every living language (~7,396). Most languages with 5M+ speakers and a full YouVersion OT are done; the
remaining large ones generally lack a full OT on YouVersion. Excluded for lack of a usable
YouVersion text edition (recorded so we don't retry): ky, tet, kmr, mg, ps, et, yue, bm, bho (audio-only — no text).
`fetch-verse.mjs` reads both YouVersion reader formats (old verse-page `__NEXT_DATA__` + new chapter
`chapterInfo.content` `data-usfm` parser), so "new format" alone no longer blocks a language.
