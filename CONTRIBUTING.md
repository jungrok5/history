[English](CONTRIBUTING.md) · [한국어](CONTRIBUTING.ko.md)

# Contributing a translation

The goal of **Bible in One Scroll** is to carry the Bible's big picture and the gospel into **every language on earth**. Please add or improve yours. 🙏

**You don't need to code — just the text.** The maintainer handles building, images, verse links and deployment.

## Two rules (this is the whole job)
1. **Bible quotes are verbatim.** Copy them from your language's official translation (e.g. on [YouVersion](https://www.bible.com)). Never paraphrase or re-translate Scripture.
2. **Keep the keys, HTML tags and structure.** Translate only the *values* (the sentences). Don't rename keys or remove `<b>`, `<p>`, `<br>`, etc.

Everything below is just *how*.

## Pick your path

### A · Fix wording in an existing language — easiest, no setup
1. On GitHub, open `i18n/<code>.json` (e.g. Swahili = `i18n/sw.json`).
2. Click the **pencil (✏️ Edit)**.
3. Edit the text, following the two rules above.
4. **Commit changes → Propose changes → Create pull request.** Done.

### B · Add a new language — by hand
1. Find your language **code** (see *Finding your code* below; e.g. `vi`, `sw`, `am`).
2. **Copy `i18n/en.json`** to `i18n/<your-code>.json` — English is the source you translate from.
3. Translate every **value**, keeping the structure:
   - Set `htmlLang` to your code, and `ui.version` to your Bible's name.
   - **Bible quotes verbatim** — copy from the real translation.
   - Keep the counts: `epochs` 13 · `core` 7 · `love` 13 · `mis` 13 (leave index 8 and 12 as `null`).
4. Open a **Pull Request.** The maintainer wires up the book-name verse links, the OG image and validation.

### C · With Claude / AI — fastest
If you use [Claude](https://claude.ai) / [Claude Code](https://www.claude.com/product/claude-code), it can draft the translation **and verify every Bible quote verbatim** — exactly how this site is built. The skill and tools already live in the repo (`.claude/skills/add-language/`); you only need Node.js + Claude Code.

1. Fork & clone the repo, open it in Claude Code.
2. Paste this prompt (fill the two blanks):

   > Add **«language name»** to this site using the `/add-language` skill.
   > Bible version: **«YouVersion version name / ID»**.
   > Draft from `i18n/en.json`, pull every Bible quote verbatim with `fetch-verse`, self-check with `validate` / `verify-verbatim` / `verify-inline` until clean, then open a PR.

3. Claude drafts `i18n/<code>.json`, extracts the quotes verbatim, and self-checks. Review it and open the PR.

> **Important:** Claude gets the **verbatim quotes and structure** objectively right, but **cannot guarantee natural phrasing in low-resource languages.** Please have a **native speaker** read it once (you can reuse `.claude/skills/add-language/lib/native-review-prompt.md`).

⭐ **Best of all:** Claude drafts + verifies, and a native speaker checks that it reads naturally.

## Please follow (principles)
- **Perspective**: the evangelical · Reformed redemptive-historical view shared by most of the Korean Protestant church.
- **Verbatim Scripture** — we never paraphrase the Bible.
- **Stay gentle**: keep the sensitive FAQs (fairness · "cheap grace" · "just be a good person") softened, and reference no specific films or events.
- Use Arabic numerals for chapter:verse references where possible.

## Finding your language code
The file is named `i18n/<code>.json`, so pick the right code — the same **BCP-47 / ISO 639** codes browsers and YouVersion use:
1. Use the **2-letter ISO 639-1** code if one exists (`ko`, `sw`, `vi`); otherwise the **3-letter ISO 639-3** (`ceb`, `tpi`, `quc`).
2. Add a 4-letter script subtag only for multi-script languages (`zh-Hans`, `zh-Hant`); a region subtag only when needed (`pt-BR`). Lowercase, with the script capitalized.
3. Look it up on Wikipedia "List of ISO 639 codes" or the SIL registry <https://iso639-3.sil.org/code_tables/639/data>.
4. **Already there?** Check `i18n/` or the site's 🌐 menu — if your language exists, use path A instead.
5. **Unsure?** Just [open an issue](../../issues) and we'll assign the code.

## The file at a glance
```jsonc
{
 "menuName": "Kiswahili",           // language name shown in the menu
 "htmlLang": "sw",                  // your code
 "dir": "ltr",                      // "ltr" or "rtl" (Arabic, Hebrew, … = rtl)
 "ui": { "version": "(SUV)", ... }, // version = the Bible translation you used
 "s": { "hero.title": "...", ... }, // interface strings
 "epochs": [ /* 13 scenes */ {
    "q": "Bible quote — verbatim!",
    "cite": "Mwanzo 1:1",           // reference (Book chapter:verse)
    "detail": "<p>...</p>"          // keep the HTML tags
 } ],
 "core": [ /* 7 */ ], "love": [ /* 13 */ ], "mis": [ /* 13, null at index 8 & 12 */ ]
}
```

## Automated checks
When you open a PR, a GitHub Action auto-checks only the changed languages — structure / keys / HTML (a gate) and Bible-quote verbatim (informational). **Don't worry if it isn't all green; the maintainer reviews it with you.**

---

Thank you — every language you add lets one more people hear the gospel in their mother tongue.
