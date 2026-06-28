# Add-language — running notes (decisions log + recurring-trap digest)

> **This is the file that grows.** The skill *procedure* lives in `SKILL.md` and rarely changes.
> When you hit a **new trap**, or make a **non-derivable decision** about a language, append it **here** —
> not in `SKILL.md` (procedure) and not in `AGENTS.md`. Read this file before starting a new language.

## Language decisions log (update HERE, never in SKILL.md / AGENTS.md)
So we don't re-investigate, and so adding a language never edits SKILL.md or AGENTS.md. The live language *list/count* is
auto-derived from `LANGS`; only these **non-derivable decisions** need a home:
- **Held / Deferred / Covered-by-parent languages → see `DEFERRED.md`** (the single source for deferred languages + reasons).
  Currently: knc·guq (deferred, low-resource prose); bm (held, no source found); the 6 colloquial-Arabic variants (covered by `ar`).
  (kg/ks/mni were re-checked and PASSED — they are live, not deferred.)
- **Deferred then re-deployed after grounding the flagged terms in the edition itself**: **ssw** (siSwati, SWT #604)
  was held for native review over 4 suspect non-Scripture spellings (`lc`/`phc`/`tjh` aren't standard siSwati). Resolved by
  attesting the fixes **inside #604** via fetch-verse, not by guessing: `liphcombi`→`buphingi` (adultery, EXO 20:14/MAT 5:27
  "Ungaphingi"), `etwesibili imibuso`→`emibuso lemibili` ("two kingdoms" verbatim in EZK 37:22 "...babe ngimibuso lemibili"),
  `balcibijolo`→`banesibindzi` ("brave", stem in 1SA 16:18 "indvodza lenesibindzi"). **One residual MODERATE item**: the UI
  toast `ui.toast` "Link copied" → `Lilinki likhophiwe` — a modern loanword with no Bible attestation; if a real siSwati
  speaker ever reviews, double-check this one string. (Pattern worth reusing: a held language's *non-Scripture* terms can
  often be cleared by finding the same word in a real verse of its own edition.)
- **Gate PASSED but with residual native-review soft-spots** (deployed — gate marked them MINOR/soft, meaning intact —
  but a native should spot-confirm, like ssw's `ui.toast`): batch bs·crh·eo·kac·nus·pap (high-resource full, blind
  back-translation = all DEPLOY-OK). **crh** (Crimean Tatar): two fixed on deploy — `адымламай`→`ашыкъмай` (mis[4]
  "God does not *hurry* even in judgment"; original read "does not *step*"), `тувуш`→`туюш` (faq.a3, non-standard "feel").
  **kac** (Jinghpaw): recurring idiom `nampan nampu` ("flower-garden") used as the metaphor for new life / God's household
  (faq.a2, respond.prayer) — internally consistent, reads deliberate, but confirm it lands as "enter God's family," not literal flowers.
  **nus** (Nuer): faq.a4 native number-words (66/1500/40) + respond.prayer lexeme `waldɛ` ("be Lord of my life") —
  meaning unambiguous from context, confirm the tokens.
- **Added despite a limited source** (non-obvious choices): bho (own edition audio-only → added as **bridge** from hi);
  yue (only the **1915 romanized** Cantonese edition #3026 — added full-mode but kept deliberately: romanized verses
  clash with the Traditional-Han prose & most Cantonese read zh-Hant, yet verses are verbatim and it gives a 廣東話 page);
  arz (YV #2429 is **Genesis-only** → added as **bridge** from ar/Van Dyck); syl (#1917 = richer-partial, Isaiah etc. absent).
- **Partial-mode**: done = ff, **ky** (NT+Genesis+Judges richer-partial), **et** (Estonian — ECV/YV 3257, NT 27 books; no OT
  edition exists on YV or eBible). Remaining candidates = tet (NT-only on YV).
- **OBS-mode** (no Bible + OBS): done = **bal** (Balochi, `fa_gl/Balochi_OBS`). Other no-Bible OBS langs in catalog: haz, shu, qxq, kaa, glk, lrc, mzn, tly, etc.
- **YV language_tag resolution (macrolanguage mismatch)**: YV catalogs some languages under an *individual* tag, not the
  639-1 macro, AND leaves `iso_639_1` null in the config — so `detect-mode <2-letter>` finds nothing even though it exists.
  Real hit: **Estonian `et` → YV tag `ekk`** ("Estonian, Standard"). Fix is built in now: detect-mode has a `YV_TAG` alias
  ({et:'ekk'}) + a `--name="English name"` fallback that searches the config by language name. If a code keeps missing,
  run `detect-mode <code> --name="<name>"` (auto-resolves) or add the alias to `YV_TAG` in detect-mode.mjs.
- **YouVersion code/version gotchas**: Malagasy = code `plt` (id 873, full Bible — the old `mg` exclusion was a code
  mismatch); kmr (id 251) is a full Bible despite its "Încîl" (NT) name; **azb** (South Azerbaijani) full Arabic-script
  Bible = YV **#4196 (SAB)** — distinct from the Latin-script eBible azb (which duplicates `az`); Hebrew Psalm numbering, Isa 9:6.
  **eu (Basque)** = use **#56 (EAB, modern Elizen Arteko Biblia)**, NOT #25 (BHNT = archaic 1571 Leizarraga — wrong register for modern readers).
  **Deuterocanon editions** (ca BCI, is, etc.): fetch-booknames can mis-map a protocanonical book to a deutero USFM —
  hit on **ca** where "Jeremies" got **LJE** (Letter of Jeremiah) instead of **JER** (verify-inline catches it as `s: MISSING`). Check JER/DAN/EST/PSA after integrate.
  **Icelandic numbered books** = spelled ordinals "Fyrri/Síðari/Fyrra/Síðara …" (not "1/2") → put each surface form in books_single.

## Recurring-trap digest (things actually hit — check these first on every new language)
> A new trap usually appears with each new language. When you hit a new one, add it here so the next
> session doesn't step on it.

**Numbered-book surface form (most frequent)** — integrate only generates `number + space + name`
("2 Samuel"). Anything else must go into **books_single** with the exact surface form:
- leading Arabic "2 Samuel" (default) / trailing "Samuel 2" (hr·he NT·to NT) / Roman "II Samuel"
  (sm·ts·ilo·umb·tt) / spelled ordinal "Druhá Samuelova"·"دوم سموئیل" (sk·fa·ckb·uk) / dotted
  "1. Samuel"·"1. Mosebok" (fi·no·lv·sr) / no-space "1Mózes"·"2.Samiyel" (hu·wo·mos) / suffixed
  "Патшалықтар 2-жазба" (kk) / hyphen "2-سموئیل" (ur) / word-order ordinal "Ucab Samuel" (quc) /
  no-number "Saray Arari" = 1KI (pag) /
  native-digit-prefix **no-space** "۱سمویئل"·"۲پادشاهلار" (azb — the edition's own display form). he/to **mix leading and trailing**.
- **Kingdoms numbering**: under LXX/4-book Kingdoms, 1KI = **"3 …"** (hy·ka·tt·bg·umb·kk). Normal 2-book → 1KI = "1 …".

**Authoritative localized book names = the version's books API, NOT the drafting agent.** The agent (a "native speaker")
picks valid-but-divergent names that don't match the edition → unlinked refs. **Run `node lib/fetch-booknames.mjs <YV> --config`**
(reads the version's books API `human` field, emits the books_single/books_numbered config + warnings) and build BOOKS from THAT;
then reconcile any body ref the agent wrote to the edition's spelling. Real azb hits: agent wrote قانونون تکراری/لاویلیلر/عبرانیلر,
edition = تثنئیه/لاوئلی‌لر/عئبرانئلره (integrate's "미해결 토큰" / unresolved-token warning also surfaces them). For Arabic-script editions the API names carry
a **native-digit prefix + no space** (۱سمویئل) — fetch-booknames keeps the base stem in `books_numbered` so integrate emits the ASCII "1 …" form
(refs stay ASCII; convert any stray Persian-digit ref like "۱ قورئنتلی‌لره" → "1 …"). fetch-booknames also auto-handles three API quirks
hit on zlm/nan/hak: ① **CJK abbreviated Gospels** — `human` gives 約翰 (John) but the body uses 約翰福音, so it prefers `human_long`
when it's a modest fuller form; ② **ALL-CAPS Latin names** (Malay `YOHANES`) — title-cased to `Yohanes` to match running-text refs;
③ **CJK numbered books** (撒母耳記上/下·哥林多前書/後書·約翰一書/二書/三書) — all go to `books_single` as full forms, `books_numbered` empty.
(If a CJK pack was integrated from `human` before this fix, its Gospel keys were truncated → add the full 福音/行傳 forms to `books`.)

**Versification (Psalm / OT numbers)**: _full authoritative checklist + traditions table → `versification.md` (grounded in STEPBible TVTMS, CC BY). Short digest below._
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
- **Merged verses** (dynamic translations join e.g. Eph 2:8-9 under one `data-usfm="EPH.2.8+EPH.2.9"`): fetch-verse now
  maps such a unit onto **each** component verse, so a single-verse request (`EPH.2.8`) returns the merged text and
  verify-verbatim passes. (First hit: zlm/#402 Eph 2:8-9 — verses 6/7/10 fetched but 8/9 were empty before the fix.)

**European thousands separator in prose trips audit-links** — faq.a4's "~1,500 years / ~1,000 years later" written with a
**period** separator (`1.500`/`1.000`, the correct local form for bs·crh·pap and any European-locale pack) is parsed as a
`chapter.verse` ref → `audit-links` reports `missed`. Fix: write 4-digit counts **without a separator** (`1500`/`1000`) —
unambiguous in every locale and not ref-like. (Comma `1,000` also clears the audit but is wrong for European locales.) sep is `:`
so a global `1.500→1500 / 1.000→1000` replace never touches a real verse ref.

**Turn off bare (colon-less chapter refs)**: if book names collide with common words, `bookopt.bare=false`
(colon required). Latin collisions are frequent: Rum/Roma/Rut/Rasul/Juan/Para/Ndị/Iṣe/İşləri/Misala/Luusi
… → almost every non-English Latin/Cyrillic is safer false.

**Drafting paraphrase tendency**: the drafting agent tends to paraphrase/reorder quotes. Counter: ① build
"self-check against fetch-verse until 0 diffs" into the drafting prompt; ② still require the final
`verify-verbatim` gate. Common paraphrases: Gen 50:20 · 1 Tim 1:15 (word order) · Col 2:15 · Mal 3:1 ·
John 3:18 · Gal 2:16. Mark a mid-sentence skip with `…`.
- **Ellipsis clause-selection (verify-verbatim's blind spot)**: both retained spans can be byte-verbatim yet the `…`
  drops the *meaning-bearing* clause → the gates pass but the point is wrong. Real azb hit: Gen 3:15 `epochs[1].q`
  ended on "you shall bruise **his heel**" (serpent's strike) instead of the protoevangelium "he shall bruise **your head**"
  that the very next `christ` field hinges on. Only the **EN-baseline / native review** catches this — check that each `…`
  quote ends where the EN ends.

**Tool idempotency**: integrate is non-idempotent (aborts if already integrated) → re-edits go directly into
the pack's `books`/`yv`/`bookopt` (verse data) and index.html `LANGS`, then build-pages. OG/sitemap show no
git change when bytes are identical (normal). Editing index.html inline JS re-derives all sub-pages (normal; gitignored anyway).

**/about/ counts auto-update from about/data.json**: the /about/ page's language count (#s_langs),
"N개 공식 역본 / N official editions" fidelity fact, "Van Dyck 외 N종 / and N others" sources line, and the
`<noscript>` language count are all derived — no hardcoded numbers. They read `about/data.json`
`totals` (`languages` = total langs, `distinctVersions` = distinct Bible editions; fewer than langs because
bridge-mode langs share a neighbor's edition). So after adding/removing a language **regenerate the snapshot**:
`JP_API_KEY=… node tools/build-about.mjs` (keyless works too — `totals` are reproducible from the committed
jp-cache; only the network-fetched `showcase` verse sample varies, so don't wire build-about into the deploy
build). Runtime numbers come from `{VER}`/`{VERX}`/`{LANG}` tokens (about/index.html `subTok`, from `D.totals`)
+ build-time comment markers `<!--LC-->N<!--/LC-->` (languages) / `<!--VC-->N<!--/VC-->` (editions) in the
`<noscript>`, updated in place by build-subpages `replaceTokens` (idempotent — markers persist across rebuilds,
unlike a one-shot `{{token}}`).

## Sub-pages (about + maps) — full procedure now lives in SKILL.md §9
"Add a language" = main **+ about + maps** (1:1, goal = all 214). The step-by-step is **SKILL.md §9**; only the
non-derivable gotchas live here:
- **Switchers are dynamic** — both about & maps read `window.__SUBLANGS__` (injected by build-subpages from each
  pack's `menuName`), and `langsFor()` auto-detects any pack in `i18n/about|maps/`. So there is **no manual list to
  edit** anymore (the old `ABOUT_LANGS` hand-sync is obsolete; same for maps). Drop the packs, build, done.
- **about RTL is supported** — the standalone template + RTL CSS handle `dir:"rtl"` (ar/fa/ur live). The old
  "RTL needs template work first" caveat is resolved.
- **about hero `s.verse` is a PARTIAL verbatim quote** of Rev 7:9 (not a full verse like maps). Slice it verbatim
  from `fetch-verse <yv> REV.7.9`; gate with `node tools/make-about-verse.mjs <code>` (verbatim-substring check,
  exit 1 if not). This is exactly the spot that got AI-paraphrased before — the helper now blocks it.
- **Match the edition's orthography exactly.** Arabic SVD on YouVersion uses **alef-wasla `ٱ`** (e.g. `ٱلْأُمَمِ`),
  not plain alef `ا` — a plain-alef copy fails make-about-verse. Re-slice from fetch-verse so it's byte-verbatim.

- **maps `s.verse` is full** — leave it for `node tools/make-maps-verse.mjs <code>` (agents paraphrase Scripture);
  the agent only translates `s.verseCite`. Structure parity (place ids / labels len / journeys keys / events len)
  is enforced by `node tools/check-i18n.mjs`.
- **maps place names use `name_<lang>` fields** (not bare `[lang]`) because language code `id` (Indonesian)
  collided with each place's `.id` key — hydrate writes `name_/book_/today_/note_/events_` + `<lang>`.
