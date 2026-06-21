# 함께 번역하기 · Contributing a translation

**한눈에 보는 성경 이야기 (Bible in One Scroll)** 의 목표는 지구상 **모든 언어**로 성경의 큰 그림과 복음을 전하는 것입니다. 당신의 언어를 더하거나 다듬어 주세요. 🙏

> 코딩 지식이 없어도 됩니다. **텍스트(번역)만** 손보면 되고, 빌드·이미지·링크·배포는 관리자가 합니다.

---

## 🛠️ 두 가지 방법 · Two ways to contribute

| | **길 1 · 손으로 (Manual)** | **길 2 · Claude(AI)로** |
|---|---|---|
| 누구 / Who | 그 언어를 아는 사람 (코딩 불필요) | 프로그래밍을 알거나 Claude를 쓰는 사람 |
| 방법 / How | `en.json` 복사 → 직접 번역 → PR | 리포 클론 → Claude의 `/add-language` 스킬로 초안+검증 → PR |
| 도구 / Tools | GitHub 웹 편집만 | Node + Claude (스킬·검증도구가 리포에 포함) |
| 성경 인용 / Quotes | 실제 성경(YouVersion)에서 복사 | Claude가 `fetch-verse`로 판본 원문 추출·대조 |

- **길 1** → 아래 **🇰🇷 한국어 / 🇬🇧 English** 절. **길 2** → **🤝 Claude(AI)로 기여하기** 절.
- 어느 길이든 핵심은 같습니다: **성경 인용은 공인 번역본 verbatim**, **키·HTML·구조 보존**.
- ⭐ **가장 좋은 건 둘의 결합** — Claude가 초안+verbatim 검증, 그 언어 **원어민이 자연스러움 검수**.

*Two kinds of people do this together — pick one: **(1) by hand** (a speaker of the language, no coding — copy `en.json`, translate, PR) or **(2) with Claude/AI** (clone the repo, let Claude draft + verify via the built-in `add-language` skill, PR). Either way: Bible quotes verbatim, keep keys/HTML/structure. Best of all: Claude drafts & verifies, a native speaker reviews naturalness.*

---

## 🇰🇷 한국어

### A. 이미 있는 언어의 문구 고치기 (가장 쉬움 — 설치 불필요, GitHub 웹에서)

1. GitHub에서 `i18n/<언어코드>.json` 파일을 엽니다. (예: 스와힐리어 = `i18n/sw.json`)
2. 오른쪽 위 **연필(✏️ Edit) 아이콘**을 누릅니다.
3. 고칠 문구를 수정합니다. **이때 지킬 것:**
   - **키(따옴표 왼쪽의 이름)는 그대로**, 값(따옴표 오른쪽 문장)만 고칩니다.
   - `<b>`, `<p>`, `<br>` 같은 **HTML 태그는 그대로** 둡니다.
   - **성경 인용문**(따옴표 안의 구절)은 **당신 언어의 공인 번역본 그대로** 옮깁니다(의역 금지). [YouVersion](https://www.bible.com) 등 실제 성경에서 복사하세요.
4. 아래 **Commit changes → Propose changes → Create pull request** 를 누르면 끝입니다.

관리자가 검증(verbatim·링크·구조)하고 사이트에 반영합니다.

### B. 새 언어 추가하기

1. 당신 언어의 **코드**를 찾습니다(ISO 639 / BCP-47, 예: `vi`, `sw`, `am`).
2. **`i18n/en.json` 을 복사**해 `i18n/<당신코드>.json` 으로 만듭니다. (영어가 번역 출발점입니다)
3. 모든 **값(문장)** 을 당신 언어로 번역합니다. **구조·키는 절대 바꾸지 마세요.**
   - `"htmlLang"` 값을 당신 코드로 바꿉니다.
   - `"ui"` 안의 `"version"` 을 당신이 쓴 성경 번역본 이름으로 바꿉니다.
   - **성경 인용은 verbatim**(공인 번역본 그대로) — 절대 새로 번역하지 말고 실제 성경에서 복사하세요.
   - `epochs`(13개)·`core`(7개)·`love`(13개)·`mis`(13개, 8·12번은 `null` 유지) 개수를 그대로 둡니다.
4. **Pull Request** 를 올립니다. 관리자가 책이름 링크·OG 이미지·검증·배포를 처리합니다.

### 꼭 지켜주세요 (원칙)
- **관점**: 한국 개신교 대다수가 공유하는 **복음주의·개혁주의 구속사(救贖史)** 관점.
- **성경 인용 = verbatim**: 당신 언어의 대표 공인 번역본을 **그대로**. 우리가 의역하지 않습니다.
- **따뜻하게**: 민감한 FAQ(공정성·값싼 용서·“착하게 살면”)는 완화된 어조를 유지하고, 특정 영화·사건을 직접 언급하지 않습니다.
- **HTML 태그 보존**, 자국 숫자 대신 참조(장:절)는 가능하면 아라비아 숫자.

질문이 있으면 [이슈](../../issues)를 열어 주세요.

---

## 🇬🇧 English

The goal is to bring the Bible’s big picture and the gospel into **every language on earth**. Please add or improve yours. You don’t need to code — **just the text**; the maintainer handles building, images, links and deployment.

### A. Fix wording in an existing language (easiest — no setup, right in GitHub)

1. Open `i18n/<code>.json` on GitHub (e.g. Swahili = `i18n/sw.json`).
2. Click the **pencil (✏️ Edit)** button.
3. Edit the text. **Please keep:**
   - the **keys** (left of the colon) unchanged — only change the **values** (the sentences).
   - HTML tags like `<b>`, `<p>`, `<br>` intact.
   - **Bible quotes verbatim** from your language’s official translation — copy from a real Bible (e.g. [YouVersion](https://www.bible.com)); never paraphrase.
4. **Commit changes → Propose changes → Create pull request.** Done.

The maintainer verifies (verbatim, links, structure) and ships it.

### B. Add a new language

1. Find your language **code** (ISO 639 / BCP-47, e.g. `vi`, `sw`, `am`).
2. **Copy `i18n/en.json`** to `i18n/<your-code>.json` (English is the source to translate from).
3. Translate every **value**. **Never change the structure or keys.**
   - Set `"htmlLang"` to your code; set `"ui"."version"` to your Bible’s name.
   - **Bible quotes must be verbatim** — copy from the real official translation, don’t re-translate.
   - Keep the counts: `epochs` (13), `core` (7), `love` (13), `mis` (13, keep index 8 and 12 as `null`).
4. Open a **Pull Request.** The maintainer wires up verse-link book names, OG images, validation and deployment.

### Please follow (principles)
- **Perspective**: the evangelical · Reformed redemptive-historical view shared by most of the Korean Protestant church.
- **Bible quotes = verbatim** from your language’s representative official translation. We do not paraphrase Scripture.
- **Stay gentle**: keep the sensitive FAQs (fairness · “cheap grace” · “just be a good person”) softened, and never reference specific films or events.
- **Preserve HTML tags**; use Arabic numerals for chapter:verse references where possible.

Open an [issue](../../issues) if you have questions.

---

## 🤝 Claude(AI)로 기여하기 · Contribute with Claude

프로그래밍을 알거나 [Claude](https://claude.ai) / [Claude Code](https://www.claude.com/product/claude-code)를 쓰면, 번역 초안부터 **성경 인용 verbatim 검증**까지 Claude가 해줄 수 있습니다 — 지금 이 사이트를 만드는 방식과 똑같습니다.

**준비물:** Node.js + Claude Code(권장). **별도 설치·패키지 없음** — 스킬과 검증 도구가 리포 안에 들어 있습니다(`.claude/skills/add-language/`).

1. 리포를 포크·클론하고 **Claude Code로 엽니다**.
2. Claude에게 시킵니다 — 예: *"`/add-language` 스킬로 «언어명»을 추가해줘. 판본은 «YouVersion 판본명 / ID»."*
3. Claude가 자동으로:
   - `i18n/en.json`을 출발점으로 해당 언어 초안 작성
   - **성경 인용은 `fetch-verse`로 판본 원문을 그대로 추출**(의역·환각 금지)
   - `validate` · `verify-verbatim` · `verify-inline`로 자가 검증(CLEAN까지 반복)
4. 결과 `i18n/<code>.json`을 **PR로 올립니다**. (책이름 링크·OG·빌드·배포는 관리자 몫 — Claude가 그 부분까지 한 PR을 만들어도 됩니다.)
5. PR을 열면 **자동검증 Action**이 한 번 더 점검합니다.

**중요 / Important:** Claude는 **인용 verbatim·구조는 객관적으로 정확히** 맞추지만, **저자원 언어의 자연스러움(naturalness)은 보증하지 못합니다.** 가능하면 그 언어 **원어민이 한 번 검수**해 주세요(`lib/native-review-prompt.md` 프롬프트 활용 가능).

*If you can code or use Claude/Claude Code, Claude can draft the translation and verify every Bible quote verbatim — exactly how this site is built. Requirements: Node.js + Claude Code (no packages — the skill and tools live in the repo). Fork & clone → open in Claude Code → ask it to run the `/add-language` skill for your language and Bible version. It drafts from `i18n/en.json`, pulls quotes verbatim via `fetch-verse`, and self-checks with `validate`/`verify-verbatim`/`verify-inline`; then open a PR (integration/build/deploy is the maintainer's part). Note: Claude nails verbatim quotes and structure, but **cannot guarantee naturalness in low-resource languages — please have a native speaker review.***

---

## 🤖 자동 검증 · Automated checks
PR을 열면 GitHub Action이 **바뀐 언어만** 자동 점검합니다 — 구조·키·HTML·민감주제(게이트)와 인용 verbatim 대조(참고용). 통과 못 해도 겁먹지 마세요; 관리자가 함께 봅니다.
*When you open a PR, a GitHub Action auto-checks only the changed languages — structure/keys/HTML (gate) and Bible-quote verbatim (informational). Don't worry if it isn't all green; the maintainer reviews with you.*

---

## 🔑 언어 코드 찾기 · Finding your language code

이 프로젝트는 브라우저·Unicode CLDR·YouVersion이 쓰는 표준 코드(**BCP-47 = ISO 639**)를 그대로 씁니다. 파일 이름이 `i18n/<코드>.json` 이므로 코드를 정확히 골라야 합니다.

**규칙 (rules):**
1. **2글자(ISO 639-1)가 있으면 그걸 씁니다** — 예: 한국어 `ko`, 스와힐리어 `sw`, 베트남어 `vi`.
2. **2글자가 없으면 3글자(ISO 639-3)** — 예: 세부아노 `ceb`, 톡피신 `tpi`, 키체 `quc`.
3. **문자(script)가 여럿이면 `-` 뒤에 4글자 문자코드** — 예: 중국어 간체 `zh-Hans`, 번체 `zh-Hant`.
4. **지역 구분이 필요할 때만 `-` 뒤에 지역코드** — 예: 브라질 포르투갈어 `pt-BR`.
5. 소문자 우선(문자코드는 첫 글자 대문자: `Hans`, `Latn`).

**찾는 순서 (how to look it up):**
1. **이미 있는지 확인** — `i18n/` 폴더 목록이나 사이트 우측 상단 🌐 메뉴에 당신 언어가 이미 있을 수 있습니다(있으면 “수정” 경로로).
2. **표에서 찾기** — 아래 중 하나에서 언어 이름으로 검색:
   - 위키백과: **“List of ISO 639 language codes”** (이름 → 639-1 2글자 있으면 그것, 없으면 639-3 3글자)
   - SIL 공식 등록부: **https://iso639-3.sil.org/code_tables/639/data** (이름으로 검색)
   - 또는 구글에 **“(언어 이름) ISO 639 code”**
3. **YouVersion 확인** — 인용은 [bible.com](https://www.bible.com)으로 링크되므로, 거기에 당신 언어 성경이 있는지 보고 코드를 맞춥니다(대개 위 표준과 동일).
4. **모르겠으면 그냥 [이슈](../../issues)를 여세요** — “새 언어 요청”으로 이름만 적어주시면 코드를 정해 드립니다.

---

This project uses the same standard codes as browsers, Unicode CLDR and YouVersion (**BCP-47 = ISO 639**). Since the file is named `i18n/<code>.json`, pick the code carefully.

**Rules:** ① use the 2-letter **ISO 639-1** code if one exists (`ko`, `sw`, `vi`); ② otherwise the 3-letter **ISO 639-3** (`ceb`, `tpi`, `quc`); ③ add a 4-letter script subtag only if the language uses several scripts (`zh-Hans`, `zh-Hant`); ④ add a region subtag only when needed (`pt-BR`); ⑤ lowercase, with the script capitalized (`Hans`, `Latn`).

**How to look it up:** ① check `i18n/` or the site’s 🌐 menu (it may exist already → use the “fix” path); ② search your language name in Wikipedia **“List of ISO 639 language codes”**, the SIL registry **https://iso639-3.sil.org/code_tables/639/data**, or Google “*(language) ISO 639 code*” — prefer the 2-letter, else the 3-letter; ③ confirm your Bible exists on [bible.com](https://www.bible.com); ④ **unsure? just open an [issue](../../issues)** and we’ll assign the code.

---

## 파일 구조 한눈에 · The file at a glance

```jsonc
{
 "menuName": "Kiswahili",          // 메뉴에 보일 언어 이름 · language name in the menu
 "htmlLang": "sw",                 // 언어 코드 · your code
 "dir": "ltr",                     // ltr 또는 rtl (아랍어·히브리어 등은 rtl)
 "ui": { "version": "(SUV)", ... },// version = 사용한 성경 번역본 이름 · the Bible version you used
 "s": { "hero.title": "...", ... },// 화면 UI 문구 · interface strings
 "epochs": [ /* 13 scenes */ {
    "q": "성경 인용 — verbatim!",   // Bible quote — verbatim!
    "cite": "Mwanzo 1:1",          // 출처 (책 장:절) · reference
    "detail": "<p>...</p>", ...    // HTML 태그 보존 · keep HTML
 } ],
 "core": [ /* 7 */ ], "love": [ /* 13 */ ], "mis": [ /* 13, null at 8 & 12 */ ]
}
```

감사합니다 — 한 언어가 더해질 때마다 한 민족이 자기 말로 복음을 만납니다.
*Thank you — every language you add lets one more people hear the gospel in their mother tongue.*
