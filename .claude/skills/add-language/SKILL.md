---
name: add-language
description: "Add a new language to the site (Bible in One Scroll) with nothing missed: write the i18n pack → integrate (writes books/yv/bookopt into the pack; patches hreflang/LANGS + build-pages/QR) → build → validate → audit links → native review → deploy. Use when asked to add or improve a translation / add a new language (\"언어 추가\", \"새 언어\", \"번역 추가\", \"add a language\", \"translate to X\")."
---

# Add-language skill

Procedure to add one language **with nothing missed**. Helpers live in
`.claude/skills/add-language/lib/` (validate · audit-links · integrate · make-qr · convert-digits ·
fetch-verse · verify-verbatim · verify-inline · verify-prose · native-review-prompt · config.example.json).
**Run every command from the repo root.** **Setup (once):** `npm install` (installs `qrcode` for make-qr). The repo is LF-normalized via `.gitattributes`, so these Node tools run identically on Windows and Linux.

> Core principle (AGENTS.md): evangelical · Reformed redemptive-historical view. Scripture is quoted
> **verbatim from each language's official translation**. For every language except ko, FAQ q3/a3 must
> reference **no specific film or event**. Rom 12:19 = "vengeance belongs to God" (not a justification of revenge).

---

## 0. Decide + version-availability gate (auto-pick full vs partial mode)
1. **Language to add** + **YouVersion version ID** (the verbatim baseline). If several candidates, ask
   the user (AskUserQuestion). Verified IDs already in use live in `YV` in `index.html` — read them there.
2. **First, measure whether a full OT exists** with fetch-verse (this decides full vs partial):
   ```
   node lib/fetch-verse.mjs <YV> ISA.53.5,PSA.23.1,MAL.3.1,GEN.1.1,EXO.20.2
   ```
   - **All five return text → full mode** (OT + NT all verbatim and linked).
   - **OT verses blank/missing → partial mode** (NT-only language; see "Partial mode" below). E.g. ff (Fula fuv1159), Maithili.
   - **Every fetch returns empty → no usable text.** fetch-verse tries the old format (verse page
     `__NEXT_DATA__` content) and then the new format (chapter `chapterInfo.content` `data-usfm` parser),
     so both reader formats are covered. If it's still empty the edition is **audio-only** (e.g. bho3621 =
     "available in audio format") or otherwise has no text → **hold it**; use a text edition of the same language if one exists.
   - **No language page / no full-OT edition at all → exclude** (record it in this SKILL.md's *Language decisions log*).
3. **Script type** → font / digits:
   - Latin/Cyrillic (ru·mn type): default Noto, `font=null`, ASCII digits.
   - Devanagari (hi·ne) / Arabic (ar) / Thai / CJK / Khmer / Myanmar / Geʽez / Armenian / Georgian /
     Sinhala etc.: a dedicated Noto font + letter-spacing 0. Convert reference digits to ASCII.

## 1. Write the i18n pack (drafting agent)
- Spin up a native-speaker Christian-translator agent to write `i18n/<code>.json`. Prompt essentials:
  - `i18n/es.json` is the **structure template** (same keys/shape). `EN_PACK`/EPOCHS/CORE in `index.html`
    is the **meaning source**.
  - Structure: epochs[13] · core[7] · love[13] · mis[13] (index **8 & 12 = null**); `s` keys = the same set as es.json.
  - **Every Bible quote is verbatim from that edition** — always extract with
    `node lib/fetch-verse.mjs <YV> <USFM[,USFM…]>` (bible.com `__NEXT_DATA__` raw text;
    **the WebFetch/summarizing model hallucinates verses — forbidden**). Match es.json's quote range and
    the position of any ellipsis (…).
  - **Inline quotes — fetch ALL of these verbatim too** (besides epoch[].q and core[].vtext). Drafting agents
    repeatedly paraphrase the ones in **bold**, so fetch them explicitly and slice the source contiguously:
    `s.gospel.crux`(ISA.53.5) · `s.respond.verse`(JHN.1.12) · `s.closing.verse`(ROM.8.38-39) ·
    `epoch[8].christ`(MAL.3.1) · **`epoch[2].detail`(GEN.50.20)** · **`epoch[10].detail`(COL.2.15)** ·
    `mis[].t` (EXO.20.2 · EZK.33.11 · JER.29.11 · JHN.15.13 · 1TI.1.15) ·
    **`s.faq.a1`(JHN.3.18, span ends at "…condemned already")** · **`s.faq.a2`(COL.1.13)** · `s.faq.a3`(ROM.12.19).
    (verify-inline catches paren/dash forms but can miss the `<b>"…"</b> (Book c:v)` faq form — so get these right at draft time.)
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
node .claude/skills/add-language/lib/make-qr.mjs <code>   # qr-<code>.png (committed; if missing, npm i qrcode in /tmp/qrgen)
node tools/build-pages.mjs                                # regenerates pages locally; refreshes i18n/en.json + sw.js stamp
```
- `qr-<code>.png` is a **committed** binary (Vercel can't generate it).
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
  it in AGENTS.md caused a merge conflict on every PR. Only put a genuinely new cross-cutting gotcha into this SKILL.md.
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

## Language decisions log (update HERE, never in AGENTS.md)
So we don't re-investigate, and so adding a language never edits AGENTS.md. The live language *list/count* is
auto-derived from `LANGS`; only these **non-derivable decisions** need a home:
- **Held / not addable** (recorded so we don't retry): bho (audio-only — no text), bm (no YV language page),
  yue (only the 1915 romanized edition — no Han NT).
- **Partial-mode**: done = ff, **ky** (NT+Genesis+Judges richer-partial). Remaining candidates = tet, et (NT-only on YV).
- **YouVersion code/version gotchas**: Malagasy = code `plt` (id 873, full Bible — the old `mg` exclusion was a code
  mismatch); kmr (id 251) is a full Bible despite its "Încîl" (NT) name.

## Recurring-trap digest (things actually hit — check these first on every new language)
> A new trap usually appears with each new language. When you hit a new one, add it here so the next
> session doesn't step on it.

**Numbered-book surface form (most frequent)** — integrate only generates `number + space + name`
("2 Samuel"). Anything else must go into **books_single** with the exact surface form:
- leading Arabic "2 Samuel" (default) / trailing "Samuel 2" (hr·he NT·to NT) / Roman "II Samuel"
  (sm·ts·ilo·umb·tt) / spelled ordinal "Druhá Samuelova"·"دوم سموئیل" (sk·fa·ckb·uk) / dotted
  "1. Samuel"·"1. Mosebok" (fi·no·lv·sr) / no-space "1Mózes"·"2.Samiyel" (hu·wo·mos) / suffixed
  "Патшалықтар 2-жазба" (kk) / hyphen "2-سموئیل" (ur) / word-order ordinal "Ucab Samuel" (quc) /
  no-number "Saray Arari" = 1KI (pag). he/to **mix leading and trailing**.
- **Kingdoms numbering**: under LXX/4-book Kingdoms, 1KI = **"3 …"** (hy·ka·tt·bg·umb·kk). Normal 2-book → 1KI = "1 …".

**Versification (Psalm / OT numbers)**:
- LXX/Slavonic Psalms (exile = Ps 136, MT 137): ru·uz·uk·tg·kk·ka·tk·tt. **Write cite in the edition's own
  number** (YouVersion doesn't remap). Chapter-level quotes need `:1` (e.g. `136:1`) to link.
- Isa 9:6 vs 9:5: CUV/ESV/Синод/АБ = 9:6; TB/BTT/Luther/新共同訳 = 9:5. Follow the edition.
- Neh 8:10 vs 8:11 etc. exist per edition (af·nl·ln). For a missing verse, cite a same-meaning different
  verse (fa JDG 17:6, kab 1Tim 1:16).

**Script / character traps**:
- Apostrophes in LANGS native/en (quc "K'iche'", gn) → integrate's `esc()` handles both. Using the
  orthographic form in config is also fine.
- Apostrophe/backslash in BOOKS keys (tr "Mısır'dan Çıkış", ha "Ru'ya") → integrate escapes them (verified).
- ZWNJ/ZWSP/soft-hyphen/RLM/teʿamim/niqqud/ʻokina/ano teleia (U+0387)/Armenian ։ — **anything inside
  verse-text is verbatim, never strip it.** Absorb it only in reference matching / verification
  normalization (verify-verbatim handles this).
- Native digits (Devanagari·Arabic·Bengali·Gujarati·Odia·Kannada·Tamil·Telugu·Malayalam…): **convert
  references to ASCII with convert-digits**, **leave verse-text digits alone** (rare; validate confirms).
- Footnote markers (* or superscript digits) are not text → exclude from quotes (sg·bi·xh·mr).

**Turn off bare (colon-less chapter refs)**: if book names collide with common words, `bookopt.bare=false`
(colon required). Latin collisions are frequent: Rum/Roma/Rut/Rasul/Juan/Para/Ndị/Iṣe/İşləri/Misala/Luusi
… → almost every non-English Latin/Cyrillic is safer false.

**Drafting paraphrase tendency**: the drafting agent tends to paraphrase/reorder quotes. Counter: ① build
"self-check against fetch-verse until 0 diffs" into the drafting prompt; ② still require the final
`verify-verbatim` gate. Common paraphrases: Gen 50:20 · 1 Tim 1:15 (word order) · Col 2:15 · Mal 3:1 ·
John 3:18 · Gal 2:16. Mark a mid-sentence skip with `…`.

**Tool idempotency**: integrate is non-idempotent (aborts if already integrated) → re-edits go directly into
the pack's `books`/`yv`/`bookopt` (verse data) and index.html `LANGS`, then build-pages. OG/sitemap show no
git change when bytes are identical (normal). Editing index.html inline JS re-derives all sub-pages (normal; gitignored anyway).

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
- [ ] **Do NOT edit AGENTS.md** — only add a genuinely new gotcha to this SKILL.md's digest
- [ ] commit & push (work branch) → (with permission) deploy to main → live check
