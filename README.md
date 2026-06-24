**English** · [한국어](README.ko.md)

# Bible in One Scroll (한눈에 보는 성경 이야기)

The whole Bible as **one story you scroll through** — from Creation to Restoration — built mobile-first so it can be understood at a glance.

🔗 **https://one-scroll-bible.com/**

## What this is
This is **not a Bible translation** (Bible societies and Wycliffe do that) and **not a Bible app** (YouVersion does that). It is the **on-ramp** in front of them.

> A free, shareable single page where most people on earth can meet — in their mother tongue, in five minutes — the big picture of the Bible's 66 books (Creation → Fall → … → Church → Second Coming) and the gospel, all the way to a prayer to receive Christ.

If a paper tract summarizes the gospel in four pages, this site holds **the whole Bible's storyline in one scroll, with every quotation linked to the real Scripture** — a "living tract."

- Scripture is quoted **verbatim from each language's official translation** — never paraphrased; every reference is tappable and opens that language's Bible.
- Two audiences: **people who know the Bible but have never read it through, and people hearing it for the first time.**
- The site auto-detects your browser/OS language and lets you switch via the 🌐 search — live in **160+ languages** (the menu shows the exact, current list).

## What's inside
- **13 scenes** — Creation → Fall → Patriarchs → Exodus → Conquest/Judges → United Kingdom → Divided Kingdom → Exile → Return → Silent Years → Jesus → The Church → Restoration (Second Coming).
- Each scene: key people & events, a key verse, the **"Christ thread"** (how the scene points to Jesus), **"Love that won't quit,"** and a "common misconception → actually."
- **The heart of the gospel** — sin / law / grace / justification by faith / the kingdom of God / the gospel; the "mirror" (Israel = me); **"because of me"** (the cross); the objection FAQ (fairness / cheap grace / "isn't being a good person enough?"); a **prayer to receive Christ**; and **next steps** (keep praying · read the Bible · find a nearby church).
- The threefold office of Christ (true Prophet · Priest · King).

## How we handle Scripture
The one rule we never break: **we never invent or self-translate a verse.** Every quoted verse is **verbatim from an official published translation** — pulled from the real Bible (mostly [YouVersion](https://www.bible.com)) and checked character-by-character. Each language uses its representative version (Korean Revised Version, ESV, 和合本, 新共同訳, RVR1960, Almeida, Louis Segond, Lutherbibel, Синодальный, Van Dyck, and more). The surrounding prose (storyline, explanations, the prayer) *is* translated per language and natively reviewed — but anything shown in quotation marks is the official text, untouched.

When a language has no complete Bible, we respond in tiers — never by fabricating Scripture:

1. **Quote what exists, verbatim.** Many languages have the New Testament (sometimes part of the Old); those passages are quoted directly. *Example: Kyrgyz has the NT + Genesis + Judges, so the Creation / Fall / Promise and Judges scenes use real Kyrgyz Scripture.*
2. **Substitute a NT verse for a missing OT one.** Where an OT key verse isn't available, use a NT verse that carries the same truth (e.g. Isaiah 53:5 → 1 Peter 2:24) — still verbatim — and otherwise tell that scene as an **unquoted summary** with its reference left empty (no broken link).
3. **Widen the trusted sources.** "Not on YouVersion" ≠ "no text exists" — we also use eBible.org, the Digital Bible Library / api.bible, and unfoldingWord / Door43 (including **Open Bible Stories** for languages with no Bible at all).
4. **Bridge language.** Where there is no Scripture in the language itself, the **storyline and gospel are translated into the mother tongue** while the **quoted verses are shown in a regional/national language its speakers read**, linked and clearly labeled.
5. **Otherwise, defer honestly.** If none of the above works yet, the language is marked *coming soon* and revisited as translations, sources, and tooling improve.

All five tiers are in use today — full; partial / richer-partial (Kyrgyz, Fula); eBible-sourced full Bibles (Tibetan); Open Bible Stories (Balochi); and bridge mode (Bhojpuri←Hindi, Chittagonian←Bengali).

**Correctness before scale.** The aim is every people group in its mother tongue — but a language goes live only when its translated *prose* (storyline / FAQ / prayer — the part AI generates; the verses are copied verbatim) is **verifiably faithful**: back-translation that matches the source **and** native review with no unresolved errors. If it can't be verified faithful, it is **deferred — however many people speak it.** *A faithful "not yet" beats a fabricated verse, or an unreliable AI translation.* In practice this puts the realistic reach near the ~200 languages where reliable machine translation exists, rather than all ~7,400 — and that is intentional. (Population reach is already ~90%, via the largest languages.)

## Perspective
Based on the **evangelical · Reformed redemptive-historical** view shared by most of the Korean Protestant church.

## Tech / deploy
- A dependency-free **single `index.html`** (HTML / CSS / vanilla JS) plus per-language packs `i18n/<code>.json` (loaded on demand).
- **Per-language static pages** (`/en/`, `/ja/`, `/ar/` …): each carries its own `title` / OG (title · description · image · locale) / canonical / **hreflang** and a **prerendered localized body** + JSON-LD + llms.txt, so social shares preview correctly (image included) and search/AI crawlers index each language.
- **Generator** `node tools/build-pages.mjs` produces those pages plus `sitemap.xml` and `llms.txt`. **Vercel runs it on every deploy**, so generated pages are *not* committed to git; the committed binaries are the shared OG image, the PWA icons and the per-language QR codes.
- Adding a language follows the `/add-language` skill (mode detection · validation · verse-link audit · verbatim + prose checks).
- Deployed on **Vercel** (updates on push to `main`). Includes `robots.txt`, sitemap, OG / JSON-LD and an offline PWA.

## Contribute — together, in every language
This goes faster **together**. Please add or polish your language. **You don't need to code — just the text**; the maintainer handles building, images, verse links and deployment.

- ✏️ **Fix wording (easiest)**: on GitHub, open `i18n/<code>.json`, click the pencil (Edit), change the text, then *Propose changes* → *Pull request*. Done.
- 🌍 **Add a language**: copy `i18n/en.json` to `i18n/<code>.json`, translate the values → Pull request.
- 📜 **Just two rules**: ① Bible quotes must be **verbatim from your language's official translation** — no paraphrase (copy from a real Bible). ② **Keep the keys, HTML tags and structure**; translate only the values.

Full step-by-step: **[CONTRIBUTING.md](CONTRIBUTING.md)** (English) · **[CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)** (한국어). Questions → [issues](../../issues).

## References
Many ministries share this heart; **we are the on-ramp in front of them**, and we link out to them. A few, by focus:

**Big-picture overview** (closest to us)
- [BibleProject](https://bibleproject.com) — the Bible's storyline & themes as animations; many subtitle languages, free. *(video-first; no prayer to receive Christ)*
- [Open Bible Stories — unfoldingWord](https://www.unfoldingword.org/obs) — 50 Creation→Restoration Bible stories, CC-licensed in hundreds of languages.

**Gospel presentation + a decision** (closest to our second half)
- [Peace With God](https://peacewithgod.net) (BGEA) — the gospel + a prayer to receive Christ, many languages.
- [GodTools](https://godtoolsapp.com) (Cru) — Four Spiritual Laws / Knowing God Personally, ~119 languages.
- [KnowGod](https://knowgod.com) · [EveryStudent](https://www.everystudent.com) · [StartingWithGod](https://www.startingwithgod.com) (Cru) — evangelism sites.

**Video / oral evangelism** (every-language aim)
- [Jesus Film Project](https://www.jesusfilm.org) — the *JESUS* film in 2,000+ languages.
- [God's Story Project](https://www.gods-story.org) · [Create International](https://www.createinternational.com) · the Wordless Book — oral & picture gospel.

**Full-Bible access** (the infrastructure we link into)
- [YouVersion / Bible.com](https://www.bible.com) — Bible reading in 2,000+ languages.
- [Wycliffe](https://www.wycliffe.org) · [SIL](https://www.sil.org) · [ETEN / illumiNations](https://illuminations.bible) — Bible translation & distribution.

**Missions data / research** (used to choose which languages to add next)
- [Joshua Project](https://joshuaproject.net) — unreached people-group & language data (speakers, % evangelical, Bible-translation status); the dataset we use to pick the next languages by least-reached need and speaker count.

## License / contact
- **Code** (HTML/CSS/JS + build tooling): [MIT](LICENSE).
- **Content** (the redemptive-history / gospel text & its translations): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — reuse, translate and share freely, with attribution.
- **Scripture** quotations: copyright their respective publishers; used here by quotation and linking only.

For content questions or feedback, use the contact at the bottom of the site, or open an [issue](../../issues).
