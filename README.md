**English** · [한국어](README.ko.md)

# Bible in One Scroll (한눈에 보는 성경 이야기)

The whole Bible as **one story you scroll through** — from Creation to Restoration — built mobile-first so it can be understood at a glance.

🔗 **https://one-scroll-bible.com/**

## What this is
This is **not a Bible translation** (Bible societies and Wycliffe do that) and **not a Bible app** (YouVersion does that). It is the **on-ramp** in front of them.

> A free, shareable single page where most people on earth can meet — in their mother tongue, in five minutes — the big picture of the Bible's 66 books (Creation → Fall → … → Church → Second Coming) and the gospel, all the way to a prayer to receive Christ.

If a paper tract summarizes the gospel in four pages, this site holds **the whole Bible's storyline in one scroll, with every quotation linked to the real Scripture** — a "living tract."
- Scripture is quoted **verbatim from each language's official translation** — we never paraphrase.
- Every reference is tappable and opens that language's Bible (Korean Revised Version / YouVersion).
- Two audiences: **people who know the Bible but have never read it through, and people hearing it for the first time.**

## The vision — every people group in its mother tongue
There are about **7,396 living languages**. Our goal is this "big picture of the Bible + gospel on-ramp" in **all of them**.

- **Language progress: ~127 / 7,396** (the live 🌐 menu has the full list)
- **Population reach: ~90%** (we started with the largest languages) — *9 in 10 people can read it in their own language*
- The remaining ~7,270 are the long tail; many do not yet have a complete Bible (OT + NT).

Where there is no complete Bible we don't simply wait. A **partial mode** — *verbatim where it exists; otherwise substitute a NT quote or clearly label a summary* — carries the big picture into **NT-only / partially translated languages** and links to whatever YouVersion has. (Full translation itself is being accelerated by SIL, unfoldingWord, ETEN and others.)

> This is a project that **outlasts a single lifetime** — though with AI's help, that "lifetime" can be much shorter.

## What's inside
- **13 scenes** — Creation → Fall → Patriarchs → Exodus → Conquest/Judges → United Kingdom → Divided Kingdom → Exile → Return → Silent Years → Jesus → The Church → Restoration (Second Coming)
- Each scene: key people & events, a key verse, the **"Christ thread"** (how the scene points to Jesus), **"Love that won't quit,"** and a "common misconception → actually."
- **The heart of the gospel** — sin / law / grace / justification by faith / the kingdom of God / the gospel; the "mirror" (Israel = me); **"because of me"** (the cross); the objection FAQ (fairness / cheap grace / "isn't being a good person enough?"); a **prayer to receive Christ**; and **next steps** (keep praying · read the Bible · find a nearby church).
- The threefold office of Christ (true Prophet · Priest · King).

## Languages (~127)
The site auto-detects the browser/OS language and lets you switch via the 🌐 search at top right. It supports Korean, English, Chinese (Simplified/Traditional), Japanese, Spanish, Portuguese, French, German, Russian, Arabic, Hindi and **~127 languages across Europe, Asia, Africa, the Pacific and Latin America** (full list in the site's 🌐 menu).

Scripture uses each language's representative official translation — Korean Revised Version, ESV, 和合本, 新共同訳, RVR1960, Almeida, Louis Segond, Lutherbibel, Синодальный, Van Dyck, Tanakh (Delitzsch), Огієнко and more. Tapping a reference opens that language's Bible (mostly [YouVersion](https://www.bible.com)).

## Perspective
Based on the **evangelical · Reformed redemptive-historical** view shared by most of the Korean Protestant church. (This is pre–formal-review material; please check with your pastor or denominational resources before relying on it.)

## Tech / deploy
- A dependency-free **single `index.html`** (HTML / CSS / vanilla JS) plus per-language packs `i18n/<code>.json` (loaded on demand).
- **Per-language static pages** (`/en/`, `/ja/`, `/ar/` …): each carries its own `title` / OG (title · description · image · locale) / canonical / **hreflang** and a **prerendered localized body** + JSON-LD + llms.txt, so social shares preview correctly (image included) and search/AI crawlers index each language.
- **Generator** `node tools/build-pages.mjs` produces those pages plus `sitemap.xml` and `llms.txt`. **Vercel runs it on every deploy**, so the generated pages are *not* committed to git; the committed binaries are the shared OG image, the PWA icons and the per-language QR codes.
- Adding a language follows the `/add-language` skill (validation · verse-link audit · verbatim checks).
- Deployed on **Vercel** (updates on push to `main`). Includes `robots.txt`, sitemap, OG / JSON-LD and an offline PWA.

## Contribute — together, in every language
This goes faster **together**. Please add or polish your language. **You don't need to code — just the text**; the maintainer handles building, images, verse links and deployment.

- ✏️ **Fix wording (easiest)**: on GitHub, open `i18n/<code>.json`, click the pencil (Edit), change the text, then *Propose changes* → *Pull request*. Done.
- 🌍 **Add a language**: copy `i18n/en.json` to `i18n/<code>.json`, translate the values → Pull request.
- 📜 **Just two rules**: ① Bible quotes must be **verbatim from your language's official translation** — no paraphrase (copy from a real Bible). ② **Keep the keys, HTML tags and structure**; translate only the values.

Full step-by-step: **[CONTRIBUTING.md](CONTRIBUTING.md)** (English) · **[CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)** (한국어). Questions → [issues](../../issues).

## License / contact
Scripture text is copyright its respective publishers and is used here by quotation and linking. For content questions or feedback, use the contact at the bottom of the site.
