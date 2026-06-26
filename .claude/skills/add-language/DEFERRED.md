# Deferred / Held languages — with reasons

> **Policy (AGENTS.md quality gate: correctness > scale).** If a trustworthy **verbatim Bible exists anywhere we can fetch it**
> (YouVersion · eBible · OBS) **and** the language is not so low-resource that AI prose can't be trusted → **add it** (full / partial /
> bridge / OBS, whichever the source allows). Otherwise **defer here with the reason.** *A faithful "not yet" beats an unreliable AI
> translation.* Re-attempt once a human native translator or a usable edition appears.
>
> This file is the **single source of truth for deferred languages.** NOTES.md's decisions log points here. Update it whenever a
> candidate is probed.

## Categories
- **HELD** — no verbatim Bible source found anywhere we can fetch (no language page / no edition). Addable the moment a source appears.
- **DEFERRED** — a source exists, but the language is too **low-resource** to trust the AI prose (failed the quality gate). Needs a human.
- **COVERED-BY-PARENT** — adequately covered by the parent/standard language (and barely has a separate edition). No separate add needed.

## List

| code | language | category | reason | what unblocks it |
|------|----------|----------|--------|------------------|
| `knc` | Kanuri | DEFERRED | prose heavily Hausa-code-mixed + grammatically broken prayer/FAQ on blind back-translation | human native translator |
| `guq` | Aché | DEFERRED | ultra-low-resource; AI prose unreliable; never deployed | human native translator |
| `taq` | Tamasheq | DEFERRED | NT verbatim & structure complete, but the drafting agent reported it could not certify the low-resource prose. Draft preserved: `deferred-drafts/taq.json` | human native review |
| `dik` | Dinka | DEFERRED | same — prose not trustworthy (verb morphology, tone, noun-class). `deferred-drafts/dik.json` | human native review |
| `kbp` | Kabiyè | DEFERRED | same — only moderate prose confidence (FAQ apologetics condensed). `deferred-drafts/kbp.json` | human native review |
| `dzo` | Dzongkha | DEFERRED | drafting aborted (API error) + low-resource Tibetan-script, same prose risk as peers | human native review (incl. re-draft) |
| `ltg` | Latgalian | DEFERRED | NT verbatim/theology/structure clean, but native review found a cluster of broken/coined Latgalian in high-traffic prose (`apzimūgoj`, `Pōrūš`, `Sevtinīt`, name inconsistencies). Draft preserved: `deferred-drafts/ltg.json` | human native fixes + re-review |
| `wuu` | Wu Chinese (Shanghainese) | HELD | 81M speakers & a historical full Bible exists, but **not on YouVersion or eBible** (name + config re-check). Bridge-from-`zh` is possible but low value (speakers read Mandarin & share the Han script) | a fetchable edition |
| `bar` | Bavarian | HELD | not on YouVersion or eBible; bridge-from-`de` low value (speakers read German) | a fetchable edition |
| `bm` | Bambara | HELD | not on YouVersion or eBible (name-based re-check done) | a fetchable edition |
| `lij` | Ligurian | HELD | not on YV/eBible | a fetchable edition |
| `lim` | Limburgish | HELD | not on YV/eBible | a fetchable edition |
| `lmo` | Lombard | HELD | not on YV/eBible | a fetchable edition |
| `ltz` | Luxembourgish | HELD | not on YV/eBible | a fetchable edition |
| `srd` | Sardinian | HELD | not on YV/eBible | a fetchable edition |
| `szl` | Silesian | HELD | not on YV/eBible | a fetchable edition |
| `vec` | Venetian | HELD | not on YV/eBible | a fetchable edition |
| `kea` | Kabuverdianu | HELD | not on YV/eBible | a fetchable edition |
| `tzm` | Central Atlas Tamazight | HELD | not on YV/eBible | a fetchable edition |
| `ast` | Asturian | HELD | YV has only an 1861 **single-book** fragment — too few NT books to fill the template | a multi-book / full edition |
| `oci` | Occitan | HELD | YV has only an 1866 single book + Proverbs — fragment | a multi-book / full edition |
| `scn` | Sicilian | HELD | YV has only a 3-book fragment | a multi-book / full edition |
| `fur` | Friulian | HELD | YV has only an 1860 single-book fragment | a multi-book / full edition |
| `acm` | Mesopotamian Arabic | COVERED-BY-PARENT | covered by MSA (`ar`); essentially no separate edition | — |
| `acq` | Taʿizzi-Adeni Arabic | COVERED-BY-PARENT | same | — |
| `aeb` | Tunisian Arabic | COVERED-BY-PARENT | same | — |
| `ajp` | South Levantine Arabic | COVERED-BY-PARENT | same | — |
| `apc` | North Levantine Arabic | COVERED-BY-PARENT | same | — |
| `ars` | Najdi Arabic | COVERED-BY-PARENT | same | — |

> Deferred drafts live in `deferred-drafts/` (under `.claude/`, so **excluded from deploy** via .vercelignore) — this preserves the
> verbatim work without statically publishing prose we can't trust. When a human native speaker reviews/fixes the prose, move the pack
> to `i18n/<code>.json` and run integrate → deploy.

## In progress / added (not deferred)
- **et (Estonian)** — partial (PKEK / YV 3257, NT 27 books; no OT edition on YV or eBible). ✅ deployed.
- **prs (Dari)** — FULL (TDV / YV 341, 66 books). Edition 341 uses segment chapter refs (`JHN.3_1`); fetch-verse was fixed to support
  it, so verbatim is now verifiable. Prose/structure clean per native review → integrate + deploy.
- **san (Sanskrit)** — partial (BSI / YV 1875, NT). Verbatim clean; native review flagged 2 MED (align prose terms to BSI येशु/मसीह/परमेश्‍वर;
  fix one prayer relative-clause). Apply fixes → deploy.
- **ydd (Yiddish)** — partial (OYBC / YV 3457, Hebrew script). Native review in progress.

> The probe only covers **YouVersion · eBible** (sources we can fetch verbatim). A HELD language may have a Bible elsewhere, but if we
> can't fetch it verbatim, our rules don't allow adding it.
