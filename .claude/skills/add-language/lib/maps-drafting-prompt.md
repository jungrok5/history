# Drafting prompt template — **maps sub-page pack** (`i18n/maps/<code>.json`)

> Canonical translation prompt for SKILL.md §9. Spawn one drafting agent per language with this, filling
> the `«language»` / `«code»` / `«edition»` slots. Keeps every batch identical regardless of session/contributor.
> (Companion: `maps-drafting-prompt`= this · verbatim verse = `tools/make-maps-verse.mjs` · gate = `tools/check-i18n.mjs` · review = `native-review-maps-prompt.md`.)

---

Repo root has the site. Create the **maps** sub-page language pack for **«language» (code: «code»)** for one-scroll-bible.com/maps/. Perspective: **evangelical/Reformed redemptive-historical**; use the language's **standard/official Bible terminology** («edition»).

READ FIRST:
- `i18n/maps/en.json` — the English template = the EXACT structure to mirror.
- `i18n/«code».json` — the MAIN site pack for this language. Use it for Bible **book names**, established **Christian terminology** (God/Jesus/Christ/sin/grace/Spirit/gospel/covenant…), and **place-name** conventions. Copy its `menuName`.

WRITE: `i18n/maps/«code».json` — valid JSON, serialized as `JSON.stringify(pack, null, 1) + "\n"` (1-space indent, trailing newline). Write ONLY this file; do NOT create scratch/helper files anywhere in the repo.

STRUCTURE — must match `en.json` EXACTLY; translate **VALUES only**, never change keys/ids:
- top-level keys: `menuName, htmlLang, dir, locale, brand, docTitle, metaDesc, s, ot, jesus, paul`.
  - `menuName` = the language's endonym (copy from the main pack). `htmlLang`/`locale` correct. `dir` = `"rtl"` for RTL scripts (Arabic/Hebrew/Syriac…), else `"ltr"`.
- `s` = exactly these 19 keys: `kicker,title,verse,purpose,ot_kick,ot_h,ot_lead,je_kick,je_h,je_lead,pa_kick,pa_h,pa_lead,foot,contact,play,pause,today,verseCite`.
- `ot`/`jesus`/`paul` each = `{ places:{…}, labels:[…], journeys:{…} }`.
  - PRESERVE every place id —
    - ot (17): eden,noah,babel,ur,haran,shechem,egypt,sinai,kadesh,jericho,shiloh,jerusalem,samaria,nineveh,babylon,susa,return
    - jesus (11): bethlehem,nazareth,jordan,cana,sychar,capernaum,galilee,caesarea_p,jericho,bethany,jerusalem
    - paul (26): antioch,seleucia,salamis,paphos,perga,pantioch,iconium,lystra,derbe,troas,philippi,thess,berea,athens,corinth,ephesus,miletus,caesarea,jerusalem,myra,fairhaven,crete,malta,syracuse,puteoli,rome
  - each place = `{ name, book, today, note, events:[…] }` — **PRESERVE each `events` array's LENGTH** (don't add/drop bullets; transit-only stops keep their empty `[]`).
  - `labels` array lengths: ot 4, jesus 7, paul 5 (translate items, same length).
  - `journeys` keys: ot `{flow}`, jesus `{life}`, paul `{j1,j2,j3,rome,j5}` (same keys, translate values).

TRANSLATION RULES:
- `book` = the Bible book name + chapter range using THIS language's Bible book names (from the main pack); keep the edition's own versification/numbering.
- `today` = the modern-day location phrase.
- `note`/`events` = faithful prose; short quoted allusions (e.g. "it was very good", "you must be born again", "the offspring of the woman will crush the serpent's head", Peter's confession, 2 Tim 4:7) → render with **this language's Bible wording**.
- `s.verseCite` = the localized "2 Peter 1:16" (the edition's numbered-book surface form, e.g. "2 Petro 1:16").
- **CRITICAL — leave `s.verse` EXACTLY as the English value from en.json. Do NOT translate it.** A separate verbatim tool (`make-maps-verse`) injects the real verse from the trusted source; translating Scripture here is forbidden.
- Terminology must match the quoted Bible (no different religious register). Sensitive wording stays gentle.

BEFORE FINISHING, self-verify (and report):
- File parses as valid JSON; format is `JSON.stringify(pack, null, 1) + "\n"`.
- All place ids present (ot 17 / jesus 11 / paul 26); every `events` length matches en.json; labels 4/7/5; journeys keys intact.
- `s.verse` is byte-identical to en.json (untouched). `s.verseCite` localized.
- **No stray characters from other scripts** (autocomplete can insert a CJK/Thai/Latin char into a name — scan and remove). No scratch files left in the repo.
Report: done + any place where terminology/transliteration was uncertain (for the native reviewer).
