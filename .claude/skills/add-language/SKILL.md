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

## 0. 결정 + 판본 가용성 게이트 (full vs partial 자동 판정)
1. **추가할 언어** + **YouVersion 판본 ID**(verbatim 기준). 후보 여럿이면 AskUserQuestion.
   - 검증 ID 전체 목록은 CLAUDE.md `구절 링크` 섹션 참조(en59·es149·…·ff1159 등 127개).
2. **★ 가장 먼저: 구약 완전판 여부를 fetch-verse 로 실측**(이걸로 full/partial 모드가 갈림):
   ```
   node lib/fetch-verse.mjs <YV> ISA.53.5,PSA.23.1,MAL.3.1,GEN.1.1,EXO.20.2
   ```
   - **5개 다 본문 반환 → full 모드**(구약+신약 전부 verbatim·링크).
   - **구약절이 빈칸/누락 → partial 모드**(신약만 번역된 언어. 아래 "부분 모드" 절). 예: ff(풀라 fuv1159)·Maithili.
   - **fetch 가 전부 실패(신약절 JHN.3.16 도 못 읽음) → 추출 불가 판본**. YouVersion 신포맷(챕터 HTML blob, `data-usfm` 마커)은 현 fetch-verse 가 못 읽음(예: 보지푸리 bho3621). → **그 판본은 보류**(TODO: 챕터 파서). 같은 언어 다른 판본이 구포맷이면 그것으로.
   - **언어 페이지/구약완전판 자체 부재** → 제외(기록: ky·tet·kmr·mg·ps·et·yue·bm 등).
3. **스크립트 유형** → 폰트/숫자:
   - 라틴/키릴(ru·mn 류): 기본 Noto, font=null, 숫자 ASCII.
   - 데바나가리(hi·ne)/아랍(ar)/타이(th)/CJK/크메르/미얀마/게에즈/아르메니아/조지아/싱할라 등: 전용 Noto 폰트 + letterspacing0. 참조 숫자는 ASCII로 변환.

## 1. i18n 팩 작성 (드래프팅 에이전트)
- 원어민 기독교 번역가 에이전트를 띄워 `i18n/<code>.json` 작성. 프롬프트 핵심:
  - `i18n/es.json` = **구조 템플릿**(동일 키/shape). `index.html` 의 `EN_PACK`/EPOCHS/CORE = **의미 출처**.
  - 구조: epochs[13]·core[7]·love[13]·mis[13](index **8,12 = null**), s 키는 es.json 과 동일 집합.
  - **모든 성경 인용은 해당 판본 verbatim** — 반드시 `node lib/fetch-verse.mjs <YV> <USFM[,USFM...]>` 로 추출(bible.com `__NEXT_DATA__` 원문 그대로; **WebFetch 요약 모델은 구절을 환각하므로 금지**). es.json 의 해당 필드를 보고 **인용 범위·말줄임(…) 위치를 맞출 것**.
  - 판본 가용성 먼저 확인: 본문은 구약(GEN·EXO·DEU·PSA·ISA·JER·MAL 등)을 다수 인용 → `fetch-verse <YV> ISA.53.5,PSA.23.1,MAL.3.1` 로 **구약 완전판인지** 검증(신약전용/낙장본이면 그 언어는 보류). 예: Kyrgyz·Tetum 은 YouVersion 에 구약 완전판이 없어 제외됨(2026-06).
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
  - **번호책 표면형 주의**: integrate 는 books_numbered 를 `숫자+공백+이름`("2 Samuel")로 생성. 본문이 **하이픈형**(Urdu "2-سموئیل")이나 다른 구분자를 쓰면 그 정확한 표면형을 **books_single 에 직접** 넣을 것(공백형과 불일치 시 미링크).
  - **ZWSP(U+200B) 책이름 주의**(Lao 등 띄어쓰기 없는 스크립트): 책이름 음절 사이에 ZWSP 가 박혀 있으면(예 "ເພງ​ສັນລະເສີນ"=시편) BOOKS 키도 **그 ZWSP 포함 정확 표면형**이어야 매칭. 본문 실제 표면형을 추출(참조 정규식 char class 에 ZWSP 포함)해 BOOKS 에 추가. verse-text 의 ZWSP 는 verbatim 이므로 절대 제거 금지.
  - **integrate 는 비-멱등**: 이미 통합된 언어(hreflang 존재)면 중단됨 → BOOKS 등 수정은 index.html 의 `BOOKS.<code>=` 라인을 직접 편집 후 `build-pages` 재실행.
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

## 5. 2차 검증 + 링크 감사 + verbatim 자동검증
```
node .claude/skills/add-language/lib/validate.mjs <code>          # APP_JS_OK 재확인
node .claude/skills/add-language/lib/audit-links.mjs <code>       # 표시↔USFM 정합·미링크 0·anchors OK
node .claude/skills/add-language/lib/verify-verbatim.mjs <code>   # 인용 verbatim(epoch q·core vtext) — CLEAN 목표
```
- **verify-verbatim 은 설정파일 불필요**: 책이름·YV를 배포된 index.html `BOOKS.<code>`/`YV` 에서 직접 읽어 fetch-verse 원문과 대조(대소문자·따옴표·구두점·ZW·테아밈 정규화). **FLAG 가 뜨면 실제 의역/누락 가능성** → 원문 재fetch 후 본인이 직접 verbatim 교정. (드래프팅 자체검증을 했어도 최종 게이트로 반드시 실행.)
  - 흔한 정상 FLAG(오탐) 판별: ① 인용이 산문 중간을 건너뛰는데 `…` 없이 이어붙임 → **진짜 문제(…)를 넣거나 본문 보강)**; ② 절번호 차이(사9:6/9:5)·LXX 시편번호는 cite 를 판본 자체번호로 맞추면 해소; ③ inline 산문 인용은 이 도구가 검사 안 함(원어민 검수 담당).
- 추가 수동 확인: `<code>/index.html` 의 lang/BOOTLANG/프리렌더(자국어)/canonical/hreflang/film-free, `og-<code>.png` 1200×630, sitemap 에 `/<code>/` 1줄.

## 6. 원어민 검수 (백그라운드 에이전트) + 역번역 QA
- 원어민 검수 에이전트: **판본 verbatim 대조**(전 인용 fetch) + 책이름/번호 + 산문 품질 + FAQ 영화무관 + HTML. **보고만**.
- 보고의 **진짜 verbatim 불일치는 본인이 직접 수정**(원문 재fetch로 확인 후). ZWNJ/Cyrillic 등은 코드포인트 대조로 안전 편집(스크립트 치환 권장). 수정 후 `build-pages` 재실행.
- 절번호 차이 주의: 사 9:6 vs 9:5는 번역본별 상이(CUV/ESV/Синод./АБ=9:6; TB/BTT/Luther/新共同訳=9:5).
- **★ 연결 산문(인용 아닌 본문) 의미검증 = 역번역 QA**:
  ```
  node .claude/skills/add-language/lib/backtranslate-check.mjs <code> [ko]
  ```
  구글번역 무료 엔드포인트로 산문을 ko 로 **역번역**해 의도(EN/KO)와 대조 → **의미 반전/오역**을 잡음.
  배경: 저자원 언어는 verify-verbatim(인용 전용)으로 못 잡는 **산문 오류**가 생김. 실제로 ff `about.line` 이
  "Ɗoftaaki…"(**부정 완료형** = "따르지 **않는다**")로 시작해 "복음주의·개혁주의 관점을 **안** 따른다"는 정반대 뜻이었음
  (ff 본문 내 `ɗoftaaki haɗaaki`=불순종 용례로 확정). 구글 역번역이 이 반전을 즉시 드러냄 → "E dow yiyannde…"로 교정.
  **주의**: ① 구글번역 미지원 저자원어는 결과가 비거나 엉뚱 → 그땐 원어민 검수만이 답. ② 역번역의 어휘 오류(책이름·고유어)는
  구글측 노이즈이지 우리 오류 아님 — **폴라리티(긍정↔부정)·교리 명제 반전**에만 집중해 판단. ③ 인용절(q/vtext/verse)은 제외(verbatim).
  부정형 어미(언어별: 풀라 -aaki/-aaka/-aani/-ataako 등)가 **긍정 의도 자리**에 오면 적신호.

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

## 부분 모드(partial mode) — 신약만/일부만 번역된 언어
구약 완전판이 없어도(0번 게이트에서 판정) **"성경은 이런 이야기"+유버전 연결**의 가치는 충분 → 추가한다.
- **신약 인용 = verbatim**(full 모드와 동일, verify-verbatim 으로 검증).
- **구약 핵심은 신약으로 대체**: 이사야 53:5(대속) → 벧전 2:24, 창 3:15 그리스도 실 → 롬 16:20 등.
- **구약 줄거리는 따옴표 없는 요약**(인용 아님 → verbatim 불요). epoch[0..8].q 는 요약문.
- **★ 구약 참조는 아예 뺀다**(사용자 결정 "절 표기 빼기"):
  - 구약 장면 epoch[0..8] 의 `cite` = **빈 문자열 `""`**.
  - detail/christ/mis.t 본문의 **구약 괄호·인라인 참조 제거** — 단 **같은 자리의 신약 참조는 보존**(예 ep1.christ 의 "Roomanko'en 16:20"은 유지, "Génesis 3:15"만 제거).
  - 빈 cite 렌더 가드는 이미 코드에 있음: index.html `renderEpochs` + build-pages `epochsHtml` 둘 다 `e.cite?…:''`, 장면 공유 텍스트도 cite 조건부. (다른 언어엔 무영향.)
- **안내 UI**: `s["partial.note"]`(배너) 추가 + `s["respond.read"]`(요한복음 버튼). 이 둘은 validate 의 선택키(OPT)라 통과.
- BOOKS 에는 신약 책만 넣음(구약 책이름 없음 → 혹시 남은 구약 표기는 plain).
- 첫 사례 = **ff(풀라)**. 새 partial 언어도 이 틀을 그대로 복제.

## 반복 함정 다이제스트 (실제로 겪은 것 — 새 언어 추가 시 먼저 점검)
> 새 언어마다 CLAUDE.md `현재 상태` 이력에 한 줄 추가하는 이유 = **대개 새 함정/규칙이 나오기 때문**. 아래는 그 누적분. 새 함정을 또 만나면 여기 + CLAUDE.md 에 적어 다음 세션이 안 밟게 한다.

**번호책 표면형(가장 잦음)** — integrate 는 `숫자+공백+이름`("2 Samuel")만 생성. 다르면 **정확 표면형을 books_single 에 직접** 넣어야 매칭:
- 전치 아라비아 "2 Samuel"(기본) / 후치 "Samuel 2"(hr·he NT·to NT) / 로마자 "II Samuel"(sm·ts·ilo·umb·tt) / 서수철자 "Druhá Samuelova"·"دوم سموئیل"(sk·fa·ckb·uk) / 마침표 "1. Samuel"·"1. Mosebok"(fi·no·lv·sr) / 무공백 "1Mózes"·"2.Samiyel"(hu·wo·mos) / 접미사 "Патшалықтар 2-жазба"(kk) / 하이픈 "2-سموئیل"(ur) / 어순서수 "Ucab Samuel"(quc) / 무번호 "Saray Arari"=1KI(pag). he/to 는 **전치+후치 혼용**.
- **왕국서 번호 체계**: LXX/4권왕국서면 1KI=**"3 …"**(hy·ka·tt·bg·umb·kk). 일반 2권이면 1KI="1 …".

**versification(시편/구약 번호)**:
- LXX/슬라브 시편(유배=시 136, MT 137): ru·uz·uk·tg·kk·ka·tk·tt. **cite 를 판본 자체번호로** 작성(YV는 리맵 안 함). 챕터단위 인용은 `136:1`처럼 **:1 붙여야** 링크됨.
- 사 9:6 vs 9:5: CUV/ESV/Синод/АБ=9:6; TB/BTT/Luther/新共同訳=9:5. 판본대로.
- 느 8:10 vs 8:11 등 판본 자체번호 존재(af·nl·ln). 빠진 절은 같은 뜻 다른 절로 cite 보정(fa JDG 17:6, kab 1Tim 1:16).

**스크립트/문자 함정**:
- LANGS native/en 에 아포스트로피(quc "K'iche'", gn) → integrate 의 `esc()`가 처리(native/en 둘 다). config 작성 시 정자 사용도 가능.
- BOOKS 키에 아포스트로피/역슬래시(tr "Mısır'dan Çıkış", ha "Ru'ya") → integrate 이스케이프 적용됨(확인).
- ZWNJ/ZWSP/연성하이픈/RLM/테아밈/니쿠드/ʻokina/ano teleia(U+0387)/아르메니아 ։ — **verse-text 안의 것은 verbatim 이므로 절대 제거 금지**. 참조 매칭·검증 정규화에서만 흡수(verify-verbatim 이 처리).
- 자국 숫자(데바나가리·아랍·벵골·구자라트·오디아·칸나다·타밀·텔루구·말라얄람…): **참조는 convert-digits 로 ASCII**, **verse-text 숫자는 손대지 말 것**(거의 없음, validate 가 확인).
- 각주 마커(* 또는 위첨자 숫자)는 본문이 아님 → 인용에서 제외(sg·bi·xh·mr).

**bare(콜론 생략 장단위) 끄기**: 책이름이 일반어와 충돌하면 `bookopt.bare=false`(콜론 필수). 라틴 충돌 빈발: Rum/Roma/Rut/Rasul/Juan/Para/Ndị/Iṣe/İşləri/Misala/Luusi 등 → 거의 모든 비영어 라틴/키릴은 false 가 안전.

**드래프팅 의역 경향**: 에이전트는 인용을 의역/재배열하는 경향이 있음. 대책 = ① 드래프팅 프롬프트에 **fetch-verse 대조 0건까지 자체검증** 내장, ② 그래도 최종 `verify-verbatim` 게이트 통과 필수. 흔한 의역: Gen50:20·1Tim1:15(어순)·Col2:15·Mal3:1·JHN3:18·Gal2:16. 인용이 산문 중간 건너뛰면 `…` 표기.

**도구 idempotency**: integrate 는 비-멱등(이미 통합된 언어는 중단) → 재수정은 index.html `BOOKS.<code>=`/LANGS 직접 편집 후 build-pages. OG/sitemap 은 build 가 동일바이트면 git 변화 없음(정상). index.html 인라인 JS 수정 시 14X개 하위 페이지 전부 재생성(정상).

## 완료 체크리스트 (빠짐 방지)
- [ ] **0번 게이트**: fetch-verse 로 구약 완전판 실측 → full / partial / 보류·제외 판정
- [ ] 판본 ID 확정 + 라이브 실연결 확인
- [ ] i18n/<code>.json: 구조(13/7/13/null8,12)·s키·verbatim·film-free·HTML
- [ ] (partial 이면) 구약 cite 빈문자열·구약 인라인참조 제거(신약참조 보존)·partial.note·respond.read
- [ ] (자국 숫자) 참조 ASCII 변환, verse-text 무손상
- [ ] index.html: hreflang·LANGS·YV·BOOKS.<code>·BOOKOPT
- [ ] build-pages: LANGS(+필요시 FONT·letterspacing0)
- [ ] qr-<code>.png · build 산출물(<code>/index.html·og-<code>.png·sitemap·llms)
- [ ] validate ✓ · audit-links missed 0·anchors OK · **verify-verbatim CLEAN**
- [ ] 원어민 검수 반영(진짜 불일치 0)
- [ ] **CLAUDE.md 갱신**(현재 상태 언어 수·목록·날짜·이력 + YV ID 목록) — 새 함정이면 SKILL.md 다이제스트에도 추가
- [ ] 커밋·푸시(작업 브랜치) → (허락 시) main 배포 → 라이브 확인
