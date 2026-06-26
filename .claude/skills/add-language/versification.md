# Versification reference — cite every verse in the edition's OWN numbering

> Why this file exists: YouVersion (and bible.com deep links) do **NOT** remap verse numbers between
> traditions. If we cite Psalm 137 but the edition follows the Greek/Slavonic tradition (where it is
> Psalm 136), the link lands on the wrong verse — or 404s. So every `cite` / inline ref must use the
> **numbering of that language's own edition**. This doc is the authoritative checklist; the running
> `NOTES.md` keeps the short per-language digest.
>
> **Authoritative source:** STEPBible **TVTMS** (Translators' Versification Traditions w/ Methodology),
> Tyndale House Cambridge / STEPBible.org, **CC BY 4.0** —
> https://github.com/STEPBible/STEPBible-Data (`Versification` folder). TVTMS maps all OT/NT
> versification differences across **Hebrew, Greek (LXX), Latin (Vulgate)** vs the **English standard**
> (NRSV ≈ KJV). Our English baseline (`en` = ESV) follows that English standard.

## The four traditions (TVTMS framing)
- **English** (NRSV/KJV-like) — our baseline. ESV, 개역개정 (mostly), CUV, Synodal, Van Dyck.
- **Hebrew / MT** — Hebrew text numbering. Luther, 新共同訳, Indonesian TB, Russian-Hebrew editions, many.
- **Greek / LXX (+ Slavonic)** — Septuagint numbering. Synodal-Slavonic Psalms, Armenian, Georgian.
- **Latin / Vulgate** — rarely the sole driver for us; overlaps LXX in Psalms.

A single edition usually **mixes** traditions (e.g. English everywhere except Hebrew Psalm titles). TVTMS's
rule of thumb: *count the verses in a chapter to tell which tradition it follows* (e.g. a Psalm whose
chapter count is "off by one" from English is on the Greek/Hebrew track).

## Divergences we actually hit (check these on every new language)

| Where | English (ESV/our baseline) | Other tradition | Which of our editions | Practical rule |
|---|---|---|---|---|
| **Psalms 10–147** | MT/English no. | **LXX −1** (Greek/Slavonic) | ru · uk · uz · tg · kk · ka · tk · tt (Synodal/Slavonic-track) | Exile psalm: English **137** = LXX **136**. Write the cite in the edition's own number; chapter-level quotes need `:1` to link (e.g. `136:1`). |
| **Isaiah 9** | **9:6** "a child is born" | **9:5** (Hebrew verse split) | 9:5 = Luther(de) · TB(id) · BTT · 新共同訳(ja). 9:6 = ESV · CUV(zh) · Synodal(ru) · 개역개정(ko) | Follow the edition. azb (Arabic-script Azeri) = Hebrew numbering → check. |
| **Samuel / Kings = "Kingdoms"** | 1–2 Samuel, 1–2 Kings | **1–4 Kingdoms** (Greek) → "1 Kings" = **"3 (Kingdoms)"** | hy · ka · (and surface-form "3 …" seen on tt · bg · umb · kk) | When the book is "Kingdoms", 1KI's surface number is **3**, 2KI = 4. Put the exact surface form in `books_single`. |
| **Joel 2/3 boundary** | Joel 2:28–32 + ch.3 | Hebrew: 2:28–32 = **3:1–5**, Eng ch.3 = Hebrew ch.4 | Hebrew-track editions | If quoting Joel "I will pour out my Spirit", verify the chapter no. in the edition. |
| **Malachi 3 / 4** | Mal 4 exists (Eng) | Hebrew: Eng ch.4 folded into **ch.3** (Mal 3:19–24) | Hebrew-track editions | MAL.4.x may be MAL.3.x. (We mainly quote Mal 3:1 — usually safe, but check Mal 4.) |
| **Nehemiah / others** | Eng | Neh 8:10 vs 8:11 etc. shift by one in some (af · nl · ln) | per edition | For a missing verse, cite a same-meaning nearby verse (precedent: fa → JDG 17:6; kab → 1Tim 1:16). |
| **2 Cor / 3 John end** | Eng | a few editions merge/!split final verses | per edition | Rare; `verify-inline` / `audit-links` will surface a `MISSING`. |

## Procedure (how to use this)
1. **Trust the edition, not memory.** Always pull the verse with `fetch-verse.mjs <YV> <USFM>` — if it returns
   the wrong text or `MISSING`, the numbering tradition differs; adjust the cite to the edition's number.
2. **Psalms**: if the language is on the Greek/Slavonic track (table above), shift Psalm cites by the LXX rule
   before writing them. Confirm with fetch-verse.
3. **Numbered "Kingdoms"**: put the exact surface form ("3 …") in `books_single` (integrate only emits "1/2 …").
4. **Gate**: `audit-links.mjs` (0 missed) + `verify-inline.mjs` (no `MISSING`) are the deterministic catch —
   a versification mismatch shows up there. This doc is the *prevention*; those gates are the *detection*.

> Not wired into fetch-verse/linkify as an automatic remapper on purpose: per-edition manual cites + the
> audit/verify gates already yield correct links, and TVTMS auto-remapping would add a large, fallible layer.
> If we ever batch-add many Slavonic/Hebrew-track languages, revisit using the TVTMS table programmatically.
