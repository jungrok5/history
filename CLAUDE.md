# CLAUDE.md — 프로젝트 메모리

> 다음 세션이 컨텍스트를 빠르게 잇기 위한 핵심 요약. 작업 전 먼저 읽을 것.

## 프로젝트
**한눈에 보는 성경 이야기 (Bible in One Scroll)** — 창조→타락→…→교회→회복(재림)까지 성경 전체 구속사를 모바일 스크롤 단일 페이지로 전하고, 복음 이해→**영접 기도**로 이어지게 하는 사이트.
- 라이브: **https://one-scroll-bible.com/**
- 저장소: `jungrok5/history`
- 사용자 작업 언어: **한국어**

## 콘텐츠 관점 (모든 수정의 기준 — 반드시 준수)
**한국 개신교 대다수가 공유하는 복음주의·개혁주의 구속사(救贖史) 관점, 개역개정판 기준.**
- 성경 인용은 **각 언어의 대표 공식 번역본을 그대로(verbatim)** 사용 — 의역/임의 표현 금지.
  - ko 개역개정 · en ESV · zh-Hans/zh-Hant 和合本(CUV) · ja 新共同訳 · es RVR1960 · pt-BR Almeida · fr Louis Segond(LSG) · de Lutherbibel · ru Синодальный · ar Van Dyck(SVD) · hi 힌디 OV/IRV · id TB(LAI) · vi Bản Truyền Thống(BTT) · th THSV2011
- 민감 주제는 완화된 표현 유지(살인자/값싼 용서/“착하게 살면”/밀양 등 FAQ). 롬12:19는 “원수 갚음은 하나님께” 본뜻(복수 정당화 아님).

## 파일 구조
- `index.html` — 단일 파일 앱(HTML/CSS/바닐라 JS). **ko·en 콘텐츠는 인라인**(KO_PACK/EN_PACK, EPOCHS/CORE/MIS/LOVE 등 배열), 렌더링 함수, LANGS(15개), NAV_MAP, GA4 등.
- `i18n/<code>.json` — **나머지 13개 언어 외부 팩**(런타임 `fetch`로 로드). 키: menuName, share, ui, labels, s.{...}, epochs[13], love[13], mis[13, index 8·12는 null], core[7].
- `tools/build-pages.mjs` — 언어별 정적 페이지 생성기(`index.html`을 템플릿으로 사용). **하위 14개 페이지에 본문 프리렌더**(JS 없이도 현지어 본문 노출 → 검색/AI 크롤러용): index.html에서 EPOCHS/CORE/EN_PACK을 `new Function`으로 추출 + i18n JSON으로 정적섹션(data-i18n)·epochs·core를 균형태그 스캐너(setInner)로 채움. + 언어별 **JSON-LD(WebSite+FAQPage)**, **llms.txt**, keywords 현지화. **루트(index.html) 본문 컨테이너는 비워둔 채 유지**(ko는 인라인 JS로 런타임 렌더; 템플릿 불변 = 생성기 idempotent). 루트 JSON-LD만 결정적 치환.
- 생성물(커밋 대상): `/<code>/index.html`(14개·본문 프리렌더 포함), `og.png`+`og-<code>.png`(15개), `icon-192/512.png`, `sitemap.xml`, `llms.txt`.
- PWA: `manifest.webmanifest` + `sw.js`(오프라인 캐시: navigate=network-first, 자원=cache-first, 동일출처만). 아이콘은 생성기가 rsvg로 생성.
- 공유: 전역+장면별(`.ep-share`, `#shareSheet`) **적응형**(모바일=네이티브 1개+복사/이미지/QR; 데스크톱=소셜 WhatsApp/Telegram/X/Facebook/LINE+복사/이미지/QR) + 캔버스 구절이미지 + QR 모달(`qr-<code>.png` 정적 커밋) + 딥링크(`#s1`~`#s13`, gotoHash). 라벨은 `SHARE_L` 맵으로 15개 언어 현지화, 아이콘은 라인 SVG.
- GA4 이벤트: `language_select`·`share{method}`·`scene_view{scene}`·`section_view{section}`·`prayer_view`·`read_more{scene}`(gevent 헬퍼). 언어별 이탈지점 분석용.
- `vercel.json` (buildCommand=`node tools/build-pages.mjs` + 보안헤더/캐시 headers), `robots.txt`, `README.md`. **`.vercelignore`로 CLAUDE.md·.claude 배포 제외**(사이트 404).
- `.claude/skills/add-language/` — **언어 추가 스킬**(`/add-language`). SKILL.md(전 절차 체크리스트) + lib/(validate·audit-links·integrate·make-qr·convert-digits·config.example.json). 새 언어 추가 시 이 스킬을 따를 것(누락 방지).

## 다국어 동작
- 비 ko/en 페이지 **본문은 런타임에 `i18n/<code>.json`을 fetch**해 채움 → 라이브 본문 검증은 **HTML이 아니라 JSON 파일**을 확인할 것 (예: `curl .../i18n/th.json`). head/OG/meta에는 각 언어 값이 빌드 시 박힘.
- `window.__BOOTLANG__`로 언어별 페이지 부팅. 언어 자동감지 + 우측 상단 🌐 검색 전환.

## 빌드·배포 파이프라인
1. 콘텐츠 수정(index.html / i18n) 후 **반드시** `node tools/build-pages.mjs` 재실행 → 페이지·OG·sitemap 재생성.
   - 생성기는 `index.html`을 템플릿으로 모든 언어 페이지를 만듦 → **index.html(en 인라인) 수정 시 14개 페이지 전부 재생성됨**(정상).
   - OG 이미지: SVG→PNG `rsvg-convert`(1200×630), 스크립트별 Noto/Nanum 폰트. ar/hi/th는 letter-spacing=0.
2. 검증(아래) 통과 후 커밋.
3. **배포**: 작업 브랜치 커밋·푸시 → `main` 체크아웃 → `git merge --ff-only <branch>` → `git push origin main` → **Vercel 자동 배포**.

## Git 규칙
- 개발 브랜치: **`claude/bible-timeline-mobile-site-cb8u6x`** (여기서 작업·푸시).
- `main` 머지/푸시는 **사용자 명시 허락 시에만**(배포 트리거). ff-only 선호.
- push: `git push -u origin <branch>`, 네트워크 실패 시 2/4/8/16초 백오프 4회.
- PR은 사용자가 요청할 때만 생성.
- 커밋 메시지 한국어, 끝에 Co-Authored-By(Claude Opus 4.8) / Claude-Session 푸터. **모델 식별자(claude-opus-4-8[1m])를 커밋·코드·산출물에 넣지 말 것**(채팅 한정).

## 검증 패턴 (커밋 전)
```
node -e '... JSON.parse 각 i18n; epochs===13, core===7, love===13, mis null===2 확인'
node -e '... index.html 마지막 <script> 블록 new Function()으로 파싱 확인 (APP_JS_OK)'
```
라이브 확인은 `curl https://one-scroll-bible.com/i18n/<code>.json | grep ...`.

## 함정 / 주의
- **Edit 전 해당 파일을 이 세션에서 Read 必**(grep만으론 불충분 — 에러남).
- **린터/사용자 포맷을 되돌리지 말 것**: i18n JSON은 `JSON.stringify(p,null,1)`(공백 1칸) 포맷, sitemap.xml은 `<url>` 한 줄, robots/README 포맷 유지.
- zh-Hant: **대만 표준 자형 사용**(為/裡/啟/吃/背). 간→번체 변환 오자 주의(乾淨≠幹淨, 顯明了≠顯明瞭, 捨≠舍, 申冤≠伸冤). 和合本 본문은 원문대로(예: 사53:5 “壓傷”에 被 추가 금지).
- 절 번호 차이: 사 9:6 vs 9:5 — TB·BTT·Luther·新共同訳은 **9:5**, RVR1960·Almeida·Синод.·CUV·ESV는 **9:6**. 번역본별로 다름.
- 검수는 언어별 전문 에이전트 병렬 실행 후 **취합·크로스체크 후 본인이 직접 수정**(에이전트는 보고만).

## SEO / 도메인 / 분석
- GA4: `G-JTXXC8TYVX`. Google Search Console + Naver 웹마스터 등록·소유확인 메타 포함(.com 기준). 사이트맵 제출 완료.
- 도메인: Cloudflare DNS, **apex(one-scroll-bible.com) primary**, www·*.vercel.app → apex로 308. 모든 canonical/OG/hreflang는 apex 기준.
- 카톡/SNS 공유: 현재 언어의 `/<lang>/` URL 공유 → 언어별 미리보기(이미지 포함).
- 연락처(자동수집 거부 안내 포함): num2323studio@gmail.com.

## 구절 링크 (전 15개 언어 완료)
본문의 모든 성경 참조를 탭하면 해당 언어 성경의 그 구절로 이동. `index.html` 인라인 JS에:
- `verseUrl(usfm,code)`: **ko→개역개정(bskorea, book=USFM소문자)**, 나머지 14개→**YouVersion**(`bible.com/bible/<id>/<USFM>`). 구절은 언어무관 USFM, 번역본 ID만 언어별.
- `YV` 버전ID(검증됨): en59·es149·pt-BR212·fr93·de51(Luther1912)·ru400·ar13·ja1819·zh-Hant46·zh-Hans48·id306·vi193·th174·hi1683·tl399·ne1483·mn369·my386·km85(KHCV 2005 គខប, 구약+신약 완전판)·uz1939(Muqaddas Kitob 라틴 O‘zbMK, IBT 2016/2020 완전판)·**ur189(URD کِتابِ مُقادّس, RTL)·si1794(Sinhala Revised SROV)·bn1681(পবিত্র বাইবেল O.V. BSI)·lo1727(Lao ພຣະຄຳພີ)·fa136(Persian OV ترجمه قدیم, RTL)·tr170(Kutsal Kitap YÇ)·ta339(Tamil O.V. BSI)·te1787(Telugu O.V. BSI)·pa1687(Punjabi O.V. BSI)·sw1818(Swahili Revised Union SRUV)·mr1686(Marathi RV BSI)·am1260(Amharic NASV, 히브리 시편번호)·ha71(Hausa Littafi Mai Tsarki)·ml1693(Malayalam O.V. BSI)·gu1691(Gujarati O.V. BSI)·kn1684(Kannada J.V. BSI)·yo2754(Yoruba Bibeli Mimọ)·ig77(Igbo Bible Nsọ)·or1749(Odia Re-edited BSI)·jv248(Javanese Kitab Sutji)·su2410(Sundanese Kitab Suci LAI)·zu286(Zulu 1959)·sd3392(Sindhi FB, RTL)·ckb503(Sorani KSS, RTL)**.
- `BOOKS[code]` 언어별 책이름→USFM 사전 + `BOOKOPT[code]`{sep,suf,bare} 매처설정: 구분자 de=쉼표·나머지 콜론, ja는 `章` 접미사, **bare(콜론생략 장단위 허용)는 영어·라틴·키릴·zh·id·hi만; 일반어 충돌 언어(ko·de·th·vi·ar·ja)는 콜론필수**.
- `linkifyRefs(html,code)`: 태그안전 파서(태그·기존<a> 보존), 멀티참조 분리, 범위 보존(EPH.1.4-5), 번호차이 자동대응(ru·uz Синод./LXX 번호: 시편 136=히137·50=히51, Kings는 uz "3 Shohlar"=1KI). **cite는 각 판본 자체 번호로 작성**(YV는 versification 리맵 안 함 → es=137(히)·ru/uz=136(Синод)). cite·core vref도 사전언어는 파서가 처리(EP_REF/CORE_REF는 비사전 폴백).
- **검증 프로토콜**(언어 추가 시 필수): 실데이터로 audit(표시↔USFM 정합·미링크·오탐·HTML무결성) + 유버전 ID/책코드 라이브 실연결. 전 언어 진짜불일치 0·미링크 0 확인됨.

## 현재 상태 (2026-06-18)
**45개 언어**(ko·en·ja·es·pt-BR·fr·de·ru·ar·hi·id·vi·th·zh-Hans·zh-Hant·tl·ne·mn·my·km·uz·ur·si·bn·lo·fa·tr·ta·te·pa·sw·mr·am·ha·ml·gu·kn·yo·ig·or·jv·su·zu·sd·ckb). 작업 이력: ①13개 언어 본문 공식 번역본 대조 검수·수정 → ②보안헤더+캐시 → ③hreflang중복제거+keywords → ④SEO/AI(프리렌더+JSON-LD+llms.txt) → ⑤공유 적응형UI+PWA+GA4이벤트+QR → ⑥본문 구절 링크(ko 개역개정·나머지 YouVersion) → ⑦**외국인노동자 패키지 언어 추가: tl·ne·mn → my(미얀마, Judson YV386) → km(크메르, KHCV 2005 គខប YV85 완전판)** → ⑧**uz(우즈베크, Muqaddas Kitob 라틴 O‘zbMK YV1939 완전판)** → ⑨**EPS 고용허가제 송출국 패키지 완성: ur(우르두/파키스탄, URD189, RTL/Nastaliq)·si(싱할라/스리랑카, SROV1794)·bn(벵골/방글라데시, BSI O.V.1681)·lo(라오/라오스, Lao1727)**. km은 원문 바이트로 ZWNJ까지 절별 verbatim 대조(v85 절별 비일관 → 인용절만 원형에 맞춤). uz는 라틴 정자법 oʻ/gʻ=U+02BB·tutuq belgisi=U+02BC 바이트 보존, **Синод/LXX 번호로 cite 작성**(시편 136=히137·50=히51, Kings "3 Shohlar"=1KI — YV가 versification 리맵 안 함). ⑨는 `fetch-verse.mjs`로 절별 verbatim 추출(WebFetch 환각 방지)·구약 완전판 확인 후 추가; ur 번호책 하이픈형(2-سموئیل)·lo 책이름 ZWSP(ເພງ​ສັນລະເສີນ) BOOKS 표면형 처리·bn 벵골숫자 참조 ASCII 변환; 원어민 검수 반영(ur Rom8:38·12:19 어순, si 6건, lo mis 4건 verbatim 교정). **키르기스(ky)·테툼(tet)은 YouVersion 구약 완전판 부재로 제외**(둘 다 창세기+신약만; 시편·이사야 없음). → ⑩**전략 도달 패키지(대형 미전도·디아스포라): fa(페르시아, OV 트리짐 카딤 136, RTL/Naskh)·tr(튀르키예, Kutsal Kitap YÇ 170)·ta(타밀, O.V. BSI 339)·te(텔루구, O.V. BSI 1787)·pa(펀자브, O.V. BSI 1687, 구르무키)·sw(스와힐리, Revised Union 1818)**. ⑩에서 발견·반영: integrate.mjs **BOOKS 키 아포스트로피/역슬래시 이스케이프 버그 수정**(tr "Mısır'dan Çıkış"가 작은따옴표 직렬화를 깨뜨려 전 언어 JS 무효화 → 수정); 번호책 표면형 다양화(tr 마침표형 "1. Samuel"·fa 스펠아웃 서수 "دوم سموئیل"·나머지 공백형은 books_numbered); fa 시편 단/복수 مزمور·مزامیر 둘다 PSA, **JDG 21:25가 v136 부재 → 동일문 17:6으로 cite 보정**; 원어민 검수 6개 반영(tr EPH2:8-9·ROM5:8·COL2:15, ta EXO20:2, pa 1Tim1:15, fa·te 각 mis/epoch 인용 verbatim 슬라이스 교정; sw·pa 본문 클린). → ⑪**블렌드(인구×전략성×가용성) 패키지: mr(마라티, BSI RV 1686)·am(암하라, NASV 1260)·ha(하우사, Littafi Mai Tsarki 71)·ml(말라얄람, O.V. BSI 1693)**. 선정기준: 순수 인구수 단독이 아니라 인구×복음 전략성(미전도·디아스포라·교회 보유)×YouVersion 구약 완전판 가용성. ⑪에서 발견·반영: **am 고전 1954판(YV3867)은 시편 책 전체가 YV에서 미반환 → NASV(1260, 히브리 번호)로 변경**(가용성이 명성보다 우선의 실례); mr 데바나가리 인라인 참조(१ करिंथ १०:११) convert-digits로 ASCII화·각주 위첨자 제외·मार्क/स्तोत्र 충돌로 bare=false; ha 아포스트로피 책이름(2 Sama'ila·Ru'ya ta Yohanna) integrate 이스케이프; **원어민 검수 4개 반영(ha core[].vtext 7개+closing 의역 전면 verbatim 교정, mr 4건, am 6건, ml 3건 — 전부 원문 슬라이스로 ZWNJ/내부공백까지 원본 보존)**. **키르기스(ky)·테툼(tet)은 YouVersion 구약 완전판 부재로 제외**(둘 다 창세기+신약만). → ⑫**블렌드 2차(대형 미커버×디아스포라): gu(구자라트, O.V. BSI 1691)·kn(칸나다, J.V. BSI 1684)·yo(요루바, Bibeli Mimọ 2754)·ig(이그보, Bible Nsọ 77)·or(오리야, Re-edited BSI 1749)**. ⑫에서 발견·반영: convert-digits에 구자라트·오디아·칸나다·타밀·텔루구·말라얄람 숫자 범위 추가(or 산문 ୧୩→13); kn Acts='ಅ. ಕೃತ್ಯಗಳು'(마침표+공백 → 정규식 이스케이프로 처리); ig 'Ndị'(=사람들)·yo Iṣe(=행위)/Ọba(=왕) 빈출충돌로 bare=false; or v1749 인쇄 아티팩트(세미콜론 등)는 YV 원본대로 보존(링크도 동일판); 원어민 검수 5개 반영(gu 1Kings12:19, or·kn 각 MAL3:1 첨가어 제거 verbatim 교정; ig·yo 본문 클린). km까지 20개 `main` 배포 완료; uz~or 20개는 작업 브랜치 완료. → ⑬**블렌드 3차(군도 대형어+미전도): jv(자바, Kitab Sutji 248)·su(순다, Kitab Suci LAI 2410)·zu(줄루, 1959판 286)·sd(신디/파키스탄, FB 3392, RTL)·ckb(소라니쿠르드/이라크·이란, KSS 503, RTL)**. ⑬에서 발견·반영: ps(파슈토)는 YV 언어페이지 자체 부재로 제외, sd 인도판(3818) YV 미반환→파키스탄판(3392) 채택; 라틴 빈출충돌 bare=false(jv Rum·Para, su Rum/Rut/Rasul, zu Roma); ckb 번호책 스펠아웃 서수(دووەم ساموئێل)·sd EZK ZWNJ 표면형(حزقي‌ايل); v503 ﴿﴾·RLM·v3392/v2410/v286 판본표기 verbatim 보존; 원어민 검수 5개 반영(su 1Tim1:15 ge복원, zu MAL3:1·COL2:15, ckb Rom12:19어순·1Tim1:15, sd Rom8:39 heh글자 U+06BE; jv 클린). uz~ckb 25개 작업 브랜치 완료(각 검증·감사 92/92·원어민 검수 반영). Google·Naver·Bing 등록+사이트맵 제출.
- 남은 개선 후보(미적용): CSP `'unsafe-inline'` 제거(인라인 스크립트 nonce/hash — 정적사이트라 가성비 낮아 보류), 인라인 `<script>` 데이터(KO/EN)가 전 페이지에 남는 점(런타임 필수라 유지).
