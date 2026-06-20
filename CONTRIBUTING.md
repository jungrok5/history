# 함께 번역하기 · Contributing a translation

**한눈에 보는 성경 이야기 (Bible in One Scroll)** 의 목표는 지구상 **모든 언어**로 성경의 큰 그림과 복음을 전하는 것입니다. 당신의 언어를 더하거나 다듬어 주세요. 🙏

> 코딩 지식이 없어도 됩니다. **텍스트(번역)만** 손보면 되고, 빌드·이미지·링크·배포는 관리자가 합니다.

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
