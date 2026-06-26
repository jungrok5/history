---
name: add-language
description: "Add a new language to the site (Bible in One Scroll) with nothing missed: write the i18n pack → integrate (writes books/yv/bookopt into the pack; patches hreflang/LANGS + build-pages/QR) → build → validate → audit links → native review → deploy. Use when asked to add or improve a translation / add a new language (\"언어 추가\", \"새 언어\", \"번역 추가\", \"add a language\", \"translate to X\")."
---

# Add-language skill

Procedure to add one language **with nothing missed**. Helpers live in
`.claude/skills/add-language/lib/` (pick-candidates · detect-mode · validate · audit-links · integrate · make-qr · convert-digits ·
fetch-verse · fetch-booknames · verify-verbatim · verify-inline · verify-prose · native-review-prompt · config.example.json).
**Run every command from the repo root.** **Setup (once):** `npm install` (installs `qrcode` for make-qr). The repo is LF-normalized via `.gitattributes`, so these Node tools run identically on Windows and Linux.

> Core principle (AGENTS.md): evangelical · Reformed redemptive-historical view. Scripture is quoted
> **verbatim from each language's official translation**. For every language except ko, FAQ q3/a3 must
> reference **no specific film or event**. Rom 12:19 = "vengeance belongs to God" (not a justification of revenge).

---

## ⛔ Deploy quality gate (the bar — correctness > scale, read first)
**A language ships only if its translated *prose* is verifiably faithful.** After drafting, it must pass BOTH:
(1) **`verify-prose`** back-translation faithfully matches the English source, AND (2) **native review** has
**no unresolved BLOCKER/MAJOR**. If either fails and can't be fixed → **DEFER** (record in `DEFERRED.md` with the reason,
"coming soon — needs a human/native translator"); do **not** deploy, however many speakers. Verbatim Scripture is
always safe (copied) — this gate is only about the AI-generated prose (storyline/FAQ/prayer/UI). Resource proxies
(FLORES-200 / Wikipedia size in `detect-mode`) are **advisory only** — a "scrutinize harder" flag, never an auto-exclude
(they false-exclude bal/ctg/dwr and false-include knc/kg). The empirical gate decides. (See memory `translation-quality-gate`.)

## 0a. Pick the next language (which one?) — `pick-candidates`
Don't guess from memory. Rank real candidates from **Joshua Project** data (the two axes we always use:
**unreached** and **speaker count**), with repo-added languages already excluded:
```
JP_API_KEY=$(cat /tmp/jp_key) node lib/pick-candidates.mjs --by=unreached --top=20   # unreached-first (JPScale↑ · fewer speakers)
JP_API_KEY=$(cat /tmp/jp_key) node lib/pick-candidates.mjs --by=speakers  --top=20   # most speakers first
```
- Flags: `--min-speakers=N` · `--religion=Islam|Hindu|Buddhism|…` · `--no-bible` (only languages with little/no Bible, BibleStatus≤2)
  · `--mode` (annotate each top candidate with `detect-mode`'s full/eBible/partial/bridge/OBS verdict — slow, one network call per language).
- **`JP_API_KEY` is env-only — never commit the key.** Free key: joshuaproject.net/api/keys (REST path `/v1/languages/<rol3>.json`).
  Speaker counts = JP `people_groups` Population summed by ROL3; macrolanguage codes exclude only the **standard member**
  (so distinct varieties like `azb` (South Azeri) · each Quechua/Fulfulde stay as valid candidates).
- This is **advisory** — it proposes targets only. Final go/defer is still the empirical gate (verify-prose + native review) in §0/§Quality.
- Then take the chosen ROL3/code into §0 below (`detect-mode <code>`) to lock the mode and version ID.

## 0. Decide + version-availability gate (auto-pick the mode via the source cascade)
**The mode is decided by one fixed cascade — `detect-mode` runs it for you, so don't guess:**
> **YouVersion full → YouVersion NT(partial) → eBible full → eBible NT(partial) → OBS → bridge → defer.**
> (i.e. always prefer a full Bible; if none, a NT-only edition = partial mode; only if no Bible text anywhere
> does it fall to OBS/bridge; if nothing usable + prose can't be trusted → defer to DEFERRED.md.)

0. **Fastest path — run `detect-mode` first** (probes all sources and prints the cascade's verdict):
   ```
   node lib/detect-mode.mjs <code> [code2 …]
   node lib/detect-mode.mjs <code> --name="<English name>"   # if a code returns "no versions" but you believe YV has it
   ```
   It resolves the YV `language_tag` (handles macrolanguage mismatches like Estonian `et`→`ekk`; if the code
   alone misses, `--name` searches the YV config by language name), lists each YouVersion version with a
   **FULL / NT-only / OT-only** probe, eBible editions (full/NT/redistributable), OBS, then prints the
   **RECOMMENDED MODE** + the verified `yv` id. **That output's mode/yv/script are the slot values you feed the
   drafting template in §1.** (Edge case: if a known code keeps missing, add it to `YV_TAG` in detect-mode.mjs.)
1. **Language to add** + **YouVersion version ID** (the verbatim baseline). If several candidates, ask
   the user (AskUserQuestion). Verified IDs already in use live in `YV` in `index.html` — read them there.
2. **Confirm the OT/NT split** with fetch-verse (detect-mode already did this; re-check the chosen ID):
   ```
   node lib/fetch-verse.mjs <YV> ISA.53.5,PSA.23.1,MAL.3.1,GEN.1.1,EXO.20.2
   ```
   - **All five return text → full mode** (OT + NT all verbatim and linked).
   - **OT verses blank/missing → partial mode** (NT-only language; see "Partial mode" below). E.g. ff (Fula fuv1159), Maithili.
   - **Every fetch returns empty → no usable text.** fetch-verse tries the old format (verse page
     `__NEXT_DATA__` content) and then the new format (chapter `chapterInfo.content` `data-usfm` parser),
     so both reader formats are covered. If it's still empty the edition is **audio-only** (e.g. bho3621 =
     "available in audio format") or otherwise has no text → **hold it**; use a text edition of the same language if one exists.
   - **No language page / no verbatim source anywhere → hold/exclude** (record it in `DEFERRED.md` with the reason).
3. **Script type** → font / digits:
   - Latin/Cyrillic (ru·mn type): default Noto, `font=null`, ASCII digits.
   - Devanagari (hi·ne) / Arabic (ar) / Thai / CJK / Khmer / Myanmar / Geʽez / Armenian / Georgian /
     Sinhala etc.: a dedicated Noto font + letter-spacing 0. Convert reference digits to ASCII.

## 1. Write the i18n pack (drafting agent)
- **Use the reusable brief: `lib/drafting-prompt.md`.** Subagents don't inherit this skill's context, so that
  template is the **self-contained** drafting brief (verbatim rules · inline-quote slots · structure · film-free ·
  terminology · per-mode handling · output format · self-check). Fill its `«…»` slots from §0's `detect-mode`
  output (`«code» «yv» «mode» «dir» «menuName» «script/font» «edition-abbrev»`) and hand it to a native-speaker
  Christian-translator agent (Task/Agent tool). For several languages, run them in parallel. **Don't re-transcribe
  the rules here** — edit the template if the rules change. The essentials below are a quick reference / index:
  - `i18n/es.json` is the **structure template** (same keys/shape). `i18n/en.json` (= `EN_PACK`) is the **meaning source**.
  - Structure: epochs[13] · core[7] · love[13] · mis[13] (index **8 & 12 = null**); `s` keys = the same set as es.json.
  - **Every Bible quote is verbatim from that edition** — always extract with
    `node lib/fetch-verse.mjs <YV> <USFM[,USFM…]>` (bible.com `__NEXT_DATA__` raw text;
    **the WebFetch/summarizing model hallucinates verses — forbidden**). Match es.json's quote range and
    the position of any ellipsis (…).
  - **Inline quotes — fetch ALL of these verbatim too** (besides epoch[].q and core[].vtext). Drafting agents
    repeatedly paraphrase the ones in **bold**, so fetch them explicitly and slice the source contiguously:
    `s.gospel.crux`(ISA.53.5) · `s.respond.verse`(JHN.1.12) · `s.closing.verse`(ROM.8.38-39) ·
    `epoch[8].christ`(MAL.3.1) · **`epoch[2].detail`(GEN.50.20)** · **`epoch[10].detail`(COL.2.15)** ·
    **`epoch[7].christ`(JER.31.31 — the quoted "new covenant" must use the edition's own words, not a synonym/
    word-order variant; drafts repeatedly missed it — kln/tiv/ca/gl/ga all needed fixing. verify-inline catches it)** ·
    `mis[].t` (EXO.20.2 · EZK.33.11 · JER.29.11 · JHN.15.13 · 1TI.1.15) ·
    **`s.faq.a1`(JHN.3.18, span ends at "…condemned already")** · **`s.faq.a2`(COL.1.13)** · `s.faq.a3`(ROM.12.19) ·
    **`s.faq.a4`(ROM.10.17 — "faith comes from hearing … the word of Christ")**.
    (verify-inline catches paren/dash forms but can miss the `<b>"…"</b> (Book c:v)` faq form — so get these right at draft time.
    **`s.faq.a4`/ROM.10.17 is the most-missed**: paraphrased & undetected in fon, tiv (tiv even swapped "word of **Christ**"→"word of **God**") — always re-fetch it and the faq.a1/a2/a3 quotes at native-review time.)
  - Check edition availability first: the body quotes many OT books (GEN·EXO·DEU·PSA·ISA·JER·MAL…) →
    `fetch-verse <YV> ISA.53.5,PSA.23.1,MAL.3.1` confirms a **full OT** (hold NT-only / lacunae editions).
  - Preserve HTML tags (`<b><p><h3><ul><li><span><br><em>` …); translate only human-readable text.
  - **faq.q3/a3 = film-free** (a self-contained scenario: an offender feels at peace claiming forgiveness
    while the victim still suffers). Rom 12:19 = "vengeance belongs to God."
  - Set `menuName` · `htmlLang=<code>` · `dir` · `ui.version="(abbrev)"`. Output format `JSON.stringify(obj,null,1)` (1-space).
  - cite/inline references use **standard book names + ASCII digits** (even where the body uses native
    digits, keep references ASCII). Ask the agent to report **the list of book names it used** (for the BOOKS dictionary).

## 2. First validation
```
node .claude/skills/add-language/lib/validate.mjs <code>
```
- Checks structure · s-keys · film-free · non-ASCII digits in verse-text · APP_JS.
- If it warns about non-ASCII digits in references (Devanagari/Arabic/Thai…):
  **first confirm validate says the verse-text has none**, then
  ```
  node .claude/skills/add-language/lib/convert-digits.mjs <code>
  ```
  (Native digits inside verse-text would break verbatim → handle manually.)

## 3. Integrate (index.html + build-pages)
- **First get the authoritative book names** (don't trust the drafting agent's list — it drifts):
  `node lib/fetch-booknames.mjs <YV> --config` prints ready-to-paste `books_single`/`books_numbered` from the
  version's own books API, auto-deriving numbered-book base stems and **warning** when the edition's surface form
  isn't a plain ASCII `<n> <name>` (native-digit/ordinal/hyphen). Paste those into the config below, and make the
  pack's body cite/inline refs use the same spelling. (`node lib/fetch-booknames.mjs <YV>` alone = plain USFM⇆name list.)
- Copy `lib/config.example.json` → `/tmp/lang-<code>.json` and fill:
  - code · native · en · yv · dir · locale · **after** (the current last language code) · bookopt ·
    books_single · books_numbered · font.
  - **bookopt.bare**: if book names collide with everyday words (e.g. Эхлэл = "beginning", प्रकाश = "light",
    राजा = "king") set **false** (colon required). Latin/Cyrillic/zh/id/hi without collisions can use true.
    de uses `sep=','`; ja uses `suf='章'`.
  - books_*: match the in-text spelling (the integrator normalizes ZWNJ). Keep multi-word book names
    (e.g. "Египетээс гарсан нь") and numbered (1/2/3) as written.
  - **Numbered-book surface form (most common trap)**: integrate generates `number + space + name`
    ("2 Samuel"). If the text uses a **hyphen form** (Urdu "2-سموئیل") or another separator, put that exact
    surface form **directly in books_single** (a space-form mismatch = unlinked).
  - **ZWSP (U+200B) in book names** (Lao etc., scripts without spaces): if a ZWSP sits between syllables
    (e.g. "ເພງ​ສັນລະເສີນ" = Psalms) the BOOKS key must be that **exact ZWSP-bearing surface form**. Extract the
    real in-text form (include ZWSP in the reference regex char class) and add it to BOOKS. **Never strip
    ZWSP from verse-text — it is verbatim.**
  - **integrate is non-idempotent**: if the language is already integrated (hreflang present) it aborts →
    edit the pack's `books`/`yv`/`bookopt` fields in `i18n/<code>.json` directly, then re-run build-pages.
```
node .claude/skills/add-language/lib/integrate.mjs /tmp/lang-<code>.json
```
- Auto-handles: **writes `books`(full+byte-exact)/`yv`/`bookopt` into `i18n/<code>.json`**; patches index.html
  hreflang · LANGS, and build-pages LANGS · (if font) FONT_TITLE/SUB + letter-spacing 0.
  (Per-language verse-link data lives in the **pack**, not index.html — only ko/en are inline there.)
- "Unresolved token" warnings are usually a false positive on a preceding number ("3 Ром" etc.) — ignore.
  If a real book is missing, fix the config and re-run.

## 4. QR + build
```
node tools/build-pages.mjs                                # regenerates pages + AUTO-BACKFILLS any missing qr-<code>.png (qrcode devDep); refreshes i18n/en.json + sw.js stamp
node .claude/skills/add-language/lib/make-qr.mjs <code>   # (optional) explicit single-language QR; build-pages already backfills missing ones
```
- `qr-<code>.png` is **committed** (source of truth). **build-pages now auto-generates any missing QR** when
  `qrcode` is loadable (repo `npm install`, or `/tmp/qrgen`); if qrcode isn't installed it prints a `⚠ 누락` (missing) warning
  and never fails the build — so install qrcode (`npm install` at repo root) before building, then commit the new PNG.
- build-pages' page output (`<code>/index.html`, sitemap.xml, llms.txt) is **gitignored** — Vercel
  regenerates it on every deploy. Run it here to **verify it succeeds** and to inspect the generated
  `<code>/index.html` locally; its committed side-effects are `i18n/en.json` and the `sw.js` cache stamp.
- OG image is a **single shared `og.png`** for all languages (no per-language og-<code>.png anymore);
  build-pages points each page's og:image to `/og.png`.

## 5. Second validation + link audit + verbatim auto-checks
```
node .claude/skills/add-language/lib/validate.mjs <code>          # re-confirm APP_JS_OK
node .claude/skills/add-language/lib/audit-links.mjs <code>       # display↔USFM, 0 missed links, anchors OK
node .claude/skills/add-language/lib/verify-verbatim.mjs <code>   # quotes (epoch q · core vtext) — target CLEAN
node .claude/skills/add-language/lib/verify-inline.mjs <code>     # inline quotes in body (christ/detail/mis/faq/respond.verse/closing.verse/gospel.crux), EN baseline
```
- **verify-verbatim needs no config file**: it reads the link infra from `index.html` and registers the pack's
  `books`/`yv` (same as the runtime doApply), then compares against fetch-verse raw text (case/quotes/punctuation/ZW/teʿamim
  normalized). **A FLAG means a likely paraphrase/omission** → re-fetch the verse and fix it verbatim
  yourself. (Run it as the final gate even if the drafting agent self-checked.)
  - Common benign FLAGs: ① a quote skips mid-sentence without `…` → add the `…` (or restore text);
    ② verse-number differences (Isa 9:6/9:5) or LXX Psalm numbers → set `cite` to the edition's own number.
- **verify-inline** (covers verify-verbatim's blind spot): scans **inline quotes + references in the body**
  (paren form `«…»(Book c:v)` + dash form `"…" — Book c:v`). It uses `i18n/en.json` (the canonical pack) as
  the **baseline** — where EN itself abbreviates/elides, that's editorial intent and is excluded; it flags
  only where **EN is verbatim but the translation diverges** (e.g. MAL 3:1 «I send my messenger» was
  paraphrased in 42 languages). **A flag is a review candidate, not a verdict** (a quoted title/epithet next
  to a cite is a false positive) → eyeball q/s, re-fetch only true divergences, then fix. `--all` sweeps every language.
- Extra manual checks: `<code>/index.html` lang/BOOTLANG/prerender(native)/canonical/hreflang/film-free;
  sitemap has a `/<code>/` line (both regenerated locally even though gitignored).

## 6. Native-speaker review (background agent) + automatic prose check
- **How to run the reviewer** (reusable prompt): fill the `«…»` slots in `lib/native-review-prompt.md` and
  launch a **per-language background agent** (Agent/Task tool, a capable model). For several languages, run
  them **in parallel**. The agent **reports only** (must not edit files).
  - Fill: `«language»` · `«code»` · `«version name»` · `«YVid»` (the verified YV id from index.html's `YV`).
  - Scope: **verbatim check against the edition** (every quote via fetch-verse) + book names/numbers +
    prose quality / doctrinal fidelity + sensitive-topic softening + HTML.
  - Run it **after** the automatic checks (step 5 verify-verbatim and verify-prose below) — it catches the
    fluency/idiom/doctrinal-nuance/inline-quote issues the automatic tools can't.
- **The main session (you) applies any real verbatim fix** after re-confirming with fetch-verse. For
  ZWNJ/Cyrillic etc., edit by code point (a scripted substitution is safest). Re-run build-pages after fixing.
- Verse-number caveat: Isa 9:6 vs 9:5 varies by edition (CUV/ESV/Синод./АБ = 9:6; TB/BTT/Luther/新共同訳 = 9:5).
- **★ Connecting prose (non-quote body) meaning check = automatic prose check**:
  ```
  node .claude/skills/add-language/lib/verify-prose.mjs <code>          # prints flagged candidates only (+ summary); exit 1 if any
  node .claude/skills/add-language/lib/verify-prose.mjs <code> --all     # every field with scores
  node .claude/skills/add-language/lib/verify-prose.mjs <code> --dump    # back-translations only (no comparison)
  ```
  It back-translates prose fields to English (Google Translate) and **auto-compares** against the canonical
  `EN_PACK` field, surfacing candidates:
  - **POLARITY** — a negator (not/no/never/without/n't…) flips vs. the canonical = **suspected meaning
    reversal** (top priority).
  - **LOW-SIM** — back-translation↔canonical char-bigram Dice < 0.30 = suspected mistranslation/omission
    (short idioms < 24 chars excluded).
  - **LEN** — length ratio < 0.45 or > 2.3 = suspected whole drop/duplication.
  Why: low-resource prose has errors that verify-verbatim (quotes-only) can't catch. Real example: ff
  `about.line` started "Ɗoftaaki…" (**negative perfective** = "does **not** follow") — the exact opposite
  meaning; this tool caught it via POLARITY and it was fixed to "E dow yiyannde…".
  **Notes**: ① a flag is a **review candidate, not a confirmed error** — GT paraphrase (undeserving↔not
  deserve, never↔unfailing) and short idioms cause false positives (more so in low-resource langs). Read
  **POLARITY first**, eyeball BT↔REF, fix only true reversals/omissions. ② GT-unsupported languages give
  GT-FAIL / garbage → only native review works there. ③ Quote fields (q/vtext/verse) are excluded
  (verify-verbatim owns them). Negative endings (per language: Fula -aaki/-aaka/-aani/-ataako, …) in a
  **positive-intent slot** are a red flag.

## 7. Commit (work branch)
- **Do NOT edit AGENTS.md when adding a language.** The language list/codes are in `LANGS` (index.html);
  per-language verse data (`books`/`yv`/`bookopt`) lives in the `i18n/<code>.json` pack. Duplicating any of
  it in AGENTS.md caused a merge conflict on every PR. Only put a genuinely new cross-cutting gotcha into `NOTES.md`.
- A language addition commits: `i18n/<code>.json` (content **+ its `books`/`yv`/`bookopt`**), the `index.html`
  edits (**hreflang/LANGS only**), `tools/build-pages.mjs` LANGS, `qr-<code>.png`, and any refreshed `i18n/en.json` / `sw.js` stamp /
  `og.png`. It does **not** commit `<code>/index.html`, `sitemap.xml`, or `llms.txt` (gitignored — Vercel
  regenerates them).
- Branch `claude/bible-timeline-mobile-site-cb8u6x`. Korean commit message + footer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` / `Claude-Session: …`.
  (Never put a model identifier in any artifact.)
```
git add -A && git commit -m "언어 추가: <name>(<code>) — …" && git push -u origin claude/bible-timeline-mobile-site-cb8u6x
```

## 8. Deploy (**only with explicit user permission**)
```
git checkout main && git merge --ff-only claude/bible-timeline-mobile-site-cb8u6x && git push origin main
git checkout claude/bible-timeline-mobile-site-cb8u6x
```
- Vercel runs build-pages.mjs on deploy and serves the freshly generated pages. Live check:
  `curl -s -o /dev/null -w '%{http_code}' https://one-scroll-bible.com/i18n/<code>.json` → 200 + key fields
  (verify live body against the **JSON**, since non-ko/en bodies are fetched at runtime).

## Partial mode — NT-only / partially translated languages
Even without a full OT (decided at gate 0), "the Bible is this story" + a link into YouVersion is worth
shipping → add it.
- **NT quotes = verbatim** (same as full mode; checked by verify-verbatim).
- **OT key verses replaced by NT ones**: Isa 53:5 (atonement) → 1 Pet 2:24; Gen 3:15 Christ-thread → Rom 16:20, etc.
- **OT storyline as unquoted summary** (not a quote → no verbatim). epoch[0..8].q are summaries.
- **★ Drop OT references entirely** (user decision):
  - epoch[0..8].cite = **empty string `""`**.
  - Remove OT paren/inline references in detail/christ/mis.t — but **keep NT references in the same spot**
    (e.g. keep "Roomanko'en 16:20" in ep1.christ, remove only "Génesis 3:15").
  - The empty-cite render guards already exist: index.html `renderEpochs` + build-pages `epochsHtml` both
    use `e.cite?…:''`, and per-scene share text is cite-conditional. (No effect on other languages.)
- **Guidance UI**: add `s["partial.note"]` (banner) + `s["respond.read"]` (John button); both are optional
  keys (OPT) in validate, so they pass.
- BOOKS holds NT books only (no OT names → any stray OT mention stays plain text).
- First case = **ff (Fula)**. Clone this shape for any new partial language.

**Per-epoch OT availability (richer partial)** — an otherwise-partial edition may include *some* OT books.
At gate 0, run fetch-verse over **every** OT epoch ref (not just Isa/Psa), e.g. for the 9 OT epochs
`GEN.1.1,GEN.3.15,GEN.12.2,EXO.6.7,JDG.21.25,2SA.7.16,1KI.12.19,PSA.137.1,NEH.8.10` — then handle each epoch
by its own ref's availability, **not** a blanket OT-off:
- ref **present** → real **verbatim** `q` + real `cite` (and add that OT book to BOOKS so it links). Treat exactly like full mode for that epoch.
- ref **absent** → `cite=""` + unquoted summary `q` (the partial rule above).
- Same per-ref test for inline OT quotes (e.g. `epoch[2].detail` GEN.50.20: keep verbatim if Genesis is present).
- Example: **ky (Kyrgyz КЫРИ 2328)** = NT + **Genesis + Judges** → ep0/1/2 (GEN) & ep4 (JDG) get real quotes;
  ep3/5/6/7/8 (Exo/2Sa/1Ki/Psa/Neh absent) stay summary+empty-cite. BOOKS.ky carries Genesis & Judges + the NT books.

## eBible.org source (languages not on YouVersion)
For a language with no usable YouVersion edition, check **eBible.org** (~1,500 redistributable Bibles, public-domain/CC, no API key):
- Find the translation: `curl -s https://ebible.org/Scriptures/translations.csv` → grep your language. Columns:
  languageCode, **translationId**, …englishName…, OTbooks, …, NTbooks, **Redistributable**. Use the **translationId**
  (e.g. Tibetan = `bodn`, NOT `bod`) and require Redistributable=True + the books you need.
- Gate 0 / fetch / verify all use the token **`ebible:<translationId>`** wherever a YouVersion number would go:
  `node lib/fetch-verse.mjs ebible:bodn ISA.53.5,GEN.1.1,JHN.3.16` (OT present → full mode). fetch-verse parses
  ebible.org chapter HTML (excludes footnotes/notemark/popup; 100+ chapter books like Psalms use 3-digit PSA023.htm; cuts at the chapter-end tnav).
- Config: set **`"yv": "ebible:<translationId>"`** (a **string**, not a number). integrate/gates/verseUrl all handle it
  automatically — `verseUrl` links to `https://ebible.org/<id>/<BOOK><CC>.htm#V<v>` (PSA → 3-digit chapter).
- **★ Check the actual script before committing** — the catalog name can mislead: eBible `azb` ("South Azerbaijani")
  is in **Latin** (duplicates `az`, wrong for Arabic-script Iranian readers), not what the name implies. Fetch a verse and look.
- First eBible language = **bo (Tibetan, `bodn`)**.

## API.Bible source (scripture.api.bible — languages on neither YV nor eBible)
American Bible Society's API.Bible. **Free key required** (env `APIBIBLE_KEY` or `/tmp/apibible_key` — **never commit the key**).
- Free tier = ~240 bibles / ~140 languages accessible (mostly public-domain + a default set; you can add up to 3 more in the dashboard).
  List what your key can see: `curl -s -H "api-key: $KEY" https://rest.api.bible/v1/bibles` → each entry has `id` (bibleId) + `language.id` (639-3).
- Gate 0 / fetch / verify use the token **`apibible:<bibleId>`** wherever a YouVersion number would go:
  `node lib/fetch-verse.mjs apibible:494329fa9b8f2892-01 JHN.3.16,GEN.1.1` (404 on a verse → that book absent → NT-only/partial).
- **★ Verse-link caveat**: API.Bible has no clean public reader URL, so `verseUrl` can't link these (like OBS). Either add an
  `apibible:` branch to `verseUrl` returning `null` (refs render as plain text) or only use it when link-less refs are acceptable.
- Coverage note (probed): the free default set does **not** include the colloquial-Arabic dialects or Wu; its genuinely-new viable
  languages are mainly **Romani** varieties (rmy Vlax `494329fa9b8f2892-01`, rmn Balkan, rmc Carpathian — all NT-only) + many ultra-low-resource langs (which usually fail the prose gate).

## Bridge mode (languages with NO Scripture in any text source)
When a language has no Bible anywhere fetchable (not YouVersion, not eBible, not OBS) but its speakers read a nearby
**bridge language** (national/regional) that we already support:
- **Prose** (storyline, gospel, prayer, FAQ, UI) → the **mother tongue**.
- **Scripture quotes + cites** → the **bridge language**, verbatim (copy them from the bridge pack `i18n/<bridge>.json`).
  Speakers read the bridge language, so this is honest + useful.
- Config: `yv` / `bookopt` / `books_single` = the **bridge language's** (so cites link to the bridge Bible and
  verify-verbatim checks against the bridge source). `htmlLang`/`dir`/`menuName`/`font` = the **mother tongue**.
- Add `s["bridge.note"]` — a mother-tongue banner ("no Bible in <lang> yet; verses shown in <bridge>"). It is an
  OPT key (validate) and renders in the same banner element as `partial.note` (index.html doApply: `partial.note || bridge.note`).
- First case = **bho (Bhojpuri)** prose + **hi (Hindi)** quotes (yv 1683) — Bhojpuri & Hindi share Devanagari and Bhojpuri speakers read Hindi.

## OBS mode (no Bible anywhere, but Open Bible Stories exists in the language)
For a language with **no Bible** (not YV, not eBible) **and no good bridge**, use **Open Bible Stories** (unfoldingWord,
50 narrative stories Creation→Return, hundreds of languages, **CC BY-SA**). OBS is a *retelling*, not verses — so we quote it
**verbatim but clearly labelled as OBS, not Scripture**, and that page becomes **CC BY-SA** (the rest of the site stays CC BY).
- **Catalog**: `git.door43.org/api/v1/catalog/search?subject=Open Bible Stories&stage=prod`. Each lang → a repo `<owner>/<repo>`.
  **Two on-disk layouts — fetch-verse handles BOTH**: old per-frame `<SS>/<FF>.txt` (e.g. `fa_gl/Balochi_OBS`) and newer
  markdown `content/<SS>.md` (Door43-Catalog/* repos, frames split on `![..]` image lines). Per-story reader (both): `door43.org/u/<repo>/master/<SS>.html`.
- **Pack config**: `yv:"obs:<owner>/<repo>"`, **no** `books`/`bookopt`. `ui.version:"(OBS)"`. `dir`/`htmlLang`/`menuName`/font = mother tongue.
  `s["bridge.note"]` = a mother-tongue banner lead ("no Bible in <lang> yet; these stories are from") — render appends the OBS
  link + `© unfoldingWord · CC BY-SA 4.0` (visible + static-baked by build-pages, so crawlers/no-JS see the attribution).
- Each epoch: `q` = a **verbatim OBS frame**, `cite` = the OBS **story title** (links to that story's reader). `core[i].vtext`/`vref` = `""`
  (no verses → renderCore/coreHtml skip the `.v` box). The "read more" button (`respond.read`) links to the OBS reader, not John.
- **Frame mapping**: index.html + build-pages share `EP_OBS=[1,2,4,12,16,17,18,20,20,21,23,43,50]` (13 eras → representative
  story). Pick the key **frame number** per era from English OBS (`unfoldingWord/en_obs/content/<NN>.md`) by meaning, then pull
  the mother-tongue frame: `fetch-verse.mjs obs:<repo> "1/1,2/9,…"` (refs are **comma-joined in one arg**, not space-separated).
- **★ Re-inject q/cite after any agent edit**: saving the JSON renormalizes Arabic combining marks (e.g. damma U+064F ↔ shadda
  U+0651 reorder), so a drafting/fix agent silently drifts the frames off verbatim. After the framing translation, **re-fetch the
  frames and overwrite `q`/`cite`** (then they're byte-exact). Verify by re-fetching + comparing all 13.
- **Terminology = OBS's own words** (per terminology policy): fetch praying/gospel frames to learn them (e.g. Balochi OBS prays
  with **دْوا**, God=هُدا, Jesus=ایسّا — match these, don't "correct" to another register).
- `verseUrl` returns `null` for an `obs:` yv (no Bible verse links); `obsRepo()`/`obsUrl()` build OBS links; `doApply` registers
  `yv` even when a pack has no `books`. First case = **bal (Balochi, `fa_gl/Balochi_OBS`)**, 137th language.

## Terminology policy (objective — no per-language debate)
**Prose religious terms = the words the quoted Bible uses.** Render God, Jesus/Christ, sin, grace, salvation, prayer,
heaven/hell, prophet, and proper names (Abraham, Moses…) with the **same forms as the Scripture you quote on that page**.
Do NOT introduce a different religious register (e.g. Islamic-idiom আল্লা/ইসা/গুনাহ when the quoted Bible reads ঈশ্বর/যীশু/পাপ).
- full/partial/eBible → that language's own quoted translation's terms.
- **bridge mode → the bridge language's** translation's terms (mother-tongue grammar, bridge-Bible terms). E.g. **ctg**
  (Chittagonian, Bengali bridge): Chittagonian grammar, but ঈশ্বর/যীশু/পাপ (Bengali Christian terms), matching the bn quotes.
- **OBS mode → the OBS edition's own terms** (mother tongue). E.g. **bal**: هُدا/ایسّا/گُناه + دْوا (pray), as Balochi OBS uses them.
- Rationale: each page stays internally consistent (prose ↔ quotes), and the contextualization choice is deferred to the
  official Bible translators (if a language's *own* official Bible uses আল্লা, then matching it is automatically consistent).

## Notes: decisions log + recurring-trap digest → `NOTES.md`
The **language-decisions log** and the **recurring-trap digest** now live in `NOTES.md` (same folder), so
*using* this skill no longer edits the procedure itself. Read `NOTES.md` before starting; when you hit a
**new trap** or make a **non-derivable language decision**, append it to `NOTES.md` — do **not** edit this
SKILL.md or AGENTS.md for that.


## Completion checklist (don't miss anything)
- [ ] **Gate 0**: fetch-verse confirms a full OT → full / partial / hold·exclude
- [ ] Version ID fixed + live link confirmed
- [ ] i18n/<code>.json: structure (13/7/13/null@8,12) · s-keys · verbatim · film-free · HTML
- [ ] (if partial) OT cite empty · OT inline refs removed (NT refs kept) · partial.note · respond.read
- [ ] (native digits) references converted to ASCII, verse-text untouched
- [ ] i18n/<code>.json: `books`/`yv`/`bookopt` written (by integrate) | index.html: hreflang · LANGS
- [ ] build-pages: LANGS (+ FONT · letter-spacing 0 if needed)
- [ ] qr-<code>.png · build runs clean (pages regenerated locally; en.json/sw.js refreshed)
- [ ] validate ✓ · audit-links missed 0 · anchors OK · **verify-verbatim CLEAN** · **verify-inline flags
      triaged** (inline quotes, EN baseline) · **verify-prose flags triaged** (POLARITY first; fix only real reversals/omissions)
- [ ] native review (run a per-language agent via `lib/native-review-prompt.md`, report only) → apply real fixes yourself (0 divergences)
- [ ] **Do NOT edit AGENTS.md or SKILL.md** — append any genuinely new gotcha/decision to `NOTES.md`
- [ ] commit & push (work branch) → (with permission) deploy to main → live check
