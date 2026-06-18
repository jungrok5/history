---
name: add-language
description: "사이트(한눈에 보는 성경 이야기)에 새 언어를 빠짐없이 추가한다. i18n 팩 작성→통합(hreflang/LANGS/YV/BOOKS/BOOKOPT/build-pages/QR)→빌드→검증→링크감사→원어민 검수→배포까지 정형 절차. '언어 추가/번역 추가/새 언어' 요청 시 사용."
---

# 언어 추가 스킬

새 언어 1개를 **누락 없이** 추가하는 절차. tl·ne·mn 추가에서 정형화됨.
헬퍼: `.claude/skills/add-language/lib/` (validate / audit-links / integrate / make-qr / convert-digits / config.example.json).
**작업·헬퍼 명령은 모두 repo 루트(`/home/user/history`)에서 실행.**

> 핵심 원칙(CLAUDE.md): 복음주의·개혁주의 구속사 관점. 성경 인용은 **각 언어 공식 번역본 verbatim**.
> ko 외 모든 언어의 FAQ q3/a3는 **영화(밀양/Secret Sunshine) 무관**으로 작성. 롬12:19는 "원수 갚음은 하나님께"(복수 정당화 아님).

---

## 0. 결정(사용자에게 확인)
1. **추가할 언어**(보통 국내 외국인노동자 패키지: tl✅ ne✅ mn✅ → my(미얀마) → km(크메르)).
2. **성경 번역본 = YouVersion 판본 ID** (verbatim 기준). 후보가 여럿이면 AskUserQuestion 으로 확정.
   - 검증된 ID: en59·es149·pt-BR212·fr93·de51·ru400·ar13·ja1819·zh-Hant46·zh-Hans48·id306·vi193·th174·hi1683·tl399(MBB RTPV05)·ne1483(NNRV)·mn369(АБ2004).
   - my(미얀마): Judson 등 / km(크메르): KCB 315 — 라이브에서 ID·책코드 실연결 확인 후 확정.
3. **스크립트 유형** → 폰트/숫자 처리 결정:
   - 라틴/키릴(ru·mn 류): 기본 Noto, font=null, 숫자 ASCII.
   - 데바나가리(hi·ne)/아랍(ar)/타이(th)/CJK/크메르/미얀마: 전용 Noto 폰트 + letterspacing0. 참조 숫자는 ASCII로 변환 필요.

## 1. i18n 팩 작성 (드래프팅 에이전트)
- 원어민 기독교 번역가 에이전트를 띄워 `i18n/<code>.json` 작성. 프롬프트 핵심:
  - `i18n/es.json` = **구조 템플릿**(동일 키/shape). `index.html` 의 `EN_PACK`/EPOCHS/CORE = **의미 출처**.
  - 구조: epochs[13]·core[7]·love[13]·mis[13](index **8,12 = null**), s 키는 es.json 과 동일 집합.
  - **모든 성경 인용은 해당 판본 verbatim** — `https://www.bible.com/bible/<YV>/<USFM>` 에서 fetch. es.json 의 해당 필드를 보고 **인용 범위·말줄임(…) 위치를 맞출 것**.
  - HTML 태그(`<b><p><h3><ul><li><span><br><em>` 등) 보존, 사람 읽는 텍스트만 번역.
  - **faq.q3/a3 = 영화 무관**(가해자가 "용서받았다"며 평안한데 피해자는 고통 — 자기완결 시나리오). 롬12:19 = "원수 갚음은 하나님께".
  - `menuName`·`htmlLang=<code>`·`dir`·`ui.version="(약칭)"`. 출력 포맷 `JSON.stringify(obj,null,1)`(공백 1칸).
  - cite/inline 참조는 **표준 책이름 + ASCII 숫자**(데바나가리 등은 본문이 자국 숫자라도 참조는 ASCII 권장). 보고에 **사용한 책이름 목록** 요청(BOOKS 사전용).

## 2. 1차 검증
```
node .claude/skills/add-language/lib/validate.mjs <code>
```
- 구조·s키·film-free·verse-text 비-ASCII숫자·APP_JS 확인.
- 참조에 비-ASCII 숫자 경고가 뜨면(데바나가리/아랍/타이 등):
  **먼저 validate 가 verse-text엔 그 숫자가 없다고 확인**한 뒤
  ```
  node .claude/skills/add-language/lib/convert-digits.mjs <code>
  ```
  (verse-text에 자국 숫자가 있으면 verbatim 손상 위험 → 수동 처리)

## 3. 통합 (index.html + build-pages)
- `lib/config.example.json` 복사 → `/tmp/lang-<code>.json` 작성:
  - code·native·en·yv·dir·locale·**after**(현재 마지막 언어 코드)·bookopt·books_single·books_numbered·font.
  - **bookopt.bare**: 책이름이 일반어와 충돌하면(예 Эхлэл=시작, प्रकाश=빛, राजा=왕) **false(콜론 필수)**. 충돌 없는 라틴/키릴/zh/id/hi 류는 true 가능. de는 sep=',', ja는 suf='章'.
  - books_*: i18n 표기와 일치(ZWNJ는 통합기가 정규화로 흡수). 다단어 책이름(예 "Египетээс гарсан нь")·numbered(1/2/3) 그대로.
```
node .claude/skills/add-language/lib/integrate.mjs /tmp/lang-<code>.json
```
- 자동 처리: hreflang · LANGS(index) · YV · **BOOKS.<code>**(전체+콘텐츠 byte-exact) · BOOKOPT · build-pages LANGS · (font 시) FONT_TITLE/SUB + letterspacing0.
- "미해결 토큰"은 보통 앞 절 숫자 오탐("3 Ром" 등) — 무시 가능. 실제 책이 빠졌으면 config 보완 후 재실행.

## 4. QR + 빌드
```
node .claude/skills/add-language/lib/make-qr.mjs <code>      # qr-<code>.png (없으면 /tmp/qrgen 에 npm i qrcode)
node tools/build-pages.mjs                                   # <code>/index.html · og-<code>.png · sitemap · llms 재생성
```

## 5. 2차 검증 + 링크 감사
```
node .claude/skills/add-language/lib/validate.mjs <code>     # APP_JS_OK 재확인
node .claude/skills/add-language/lib/audit-links.mjs <code>  # 92/92 · missed 0 · anchors OK 목표
```
- 추가 수동 확인: `<code>/index.html` 의 lang/BOOTLANG/프리렌더(자국어)/canonical/hreflang/film-free, `og-<code>.png` 1200×630, sitemap 에 `/<code>/` 1줄.

## 6. 원어민 검수 (백그라운드 에이전트)
- 원어민 검수 에이전트: **판본 verbatim 대조**(전 인용 fetch) + 책이름/번호 + 산문 품질 + FAQ 영화무관 + HTML. **보고만**.
- 보고의 **진짜 verbatim 불일치는 본인이 직접 수정**(원문 재fetch로 확인 후). ZWNJ/Cyrillic 등은 코드포인트 대조로 안전 편집(스크립트 치환 권장). 수정 후 `build-pages` 재실행.
- 절번호 차이 주의: 사 9:6 vs 9:5는 번역본별 상이(CUV/ESV/Синод./АБ=9:6; TB/BTT/Luther/新共同訳=9:5).

## 7. 커밋 (작업 브랜치)
- **커밋 전 `CLAUDE.md` 갱신**(언어 추가 시 필수): `## 현재 상태`의 언어 수·코드 목록·날짜·작업 이력에 새 언어 반영 + `구절 링크` 섹션의 `YV 버전ID(검증됨)` 목록에 `<code><id>` 추가. (CLAUDE.md는 `.vercelignore`로 배포 제외 → 사이트 영향 없음)
- 브랜치 `claude/bible-timeline-mobile-site-cb8u6x`. 한국어 커밋 메시지 + 푸터:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` / `Claude-Session: ...`.
  (모델 식별자를 산출물에 넣지 말 것)
```
git add -A && git commit -m "언어 추가: <이름>(<code>) — ..." && git push -u origin claude/bible-timeline-mobile-site-cb8u6x
```

## 8. 배포 (**사용자 명시 허락 시에만**)
```
git checkout main && git merge --ff-only claude/bible-timeline-mobile-site-cb8u6x && git push origin main
git checkout claude/bible-timeline-mobile-site-cb8u6x
```
- 라이브 확인: `curl -s -o /dev/null -w '%{http_code}' https://one-scroll-bible.com/i18n/<code>.json` → 200 + 핵심 필드.

## 완료 체크리스트 (빠짐 방지)
- [ ] 판본 ID 확정 + 라이브 실연결 확인
- [ ] i18n/<code>.json: 구조(13/7/13/null8,12)·s키·verbatim·film-free·HTML
- [ ] (자국 숫자) 참조 ASCII 변환, verse-text 무손상
- [ ] index.html: hreflang·LANGS·YV·BOOKS.<code>·BOOKOPT
- [ ] build-pages: LANGS(+필요시 FONT·letterspacing0)
- [ ] qr-<code>.png · build 산출물(<code>/index.html·og-<code>.png·sitemap·llms)
- [ ] validate ✓ · audit-links 92/92·missed 0·anchors OK
- [ ] 원어민 검수 반영(진짜 불일치 0)
- [ ] **CLAUDE.md 갱신**(현재 상태 언어 수·목록·날짜·이력 + YV ID 목록)
- [ ] 커밋·푸시(작업 브랜치) → (허락 시) main 배포 → 라이브 확인
