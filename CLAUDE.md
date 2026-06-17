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
- `vercel.json` (buildCommand=`node tools/build-pages.mjs` + 보안헤더/캐시 headers), `robots.txt`, `README.md`. **`.vercelignore`로 CLAUDE.md 배포 제외**(사이트 404).

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
- `YV` 버전ID(검증됨): en59·es149·pt-BR212·fr93·de51(Luther1912)·ru400·ar13·ja1819·zh-Hant46·zh-Hans48·id306·vi193·th174·hi1683.
- `BOOKS[code]` 언어별 책이름→USFM 사전 + `BOOKOPT[code]`{sep,suf,bare} 매처설정: 구분자 de=쉼표·나머지 콜론, ja는 `章` 접미사, **bare(콜론생략 장단위 허용)는 영어·라틴·키릴·zh·id·hi만; 일반어 충돌 언어(ko·de·th·vi·ar·ja)는 콜론필수**.
- `linkifyRefs(html,code)`: 태그안전 파서(태그·기존<a> 보존), 멀티참조 분리, 범위 보존(EPH.1.4-5), 번호차이 자동대응(ru Синод. 시편 136=히137, 2/3 Царств). cite·core vref도 사전언어는 파서가 처리(EP_REF/CORE_REF는 비사전 폴백).
- **검증 프로토콜**(언어 추가 시 필수): 실데이터로 audit(표시↔USFM 정합·미링크·오탐·HTML무결성) + 유버전 ID/책코드 라이브 실연결. 전 언어 진짜불일치 0·미링크 0 확인됨.

## 현재 상태 (2026-06-17)
15개 언어 완성·배포됨. 작업 이력: ①13개 언어 본문 공식 번역본 대조 검수·수정 → ②보안헤더+캐시 → ③hreflang중복제거+keywords → ④SEO/AI(프리렌더+JSON-LD+llms.txt) → ⑤공유 적응형UI+PWA+GA4이벤트+QR → ⑥**전 15개 언어 본문 구절 링크(ko 개역개정·나머지 YouVersion)**. 모두 `main` 배포 완료. Google·Naver·Bing 등록+사이트맵 제출. 작업 트리 깨끗.
- 남은 개선 후보(미적용): CSP `'unsafe-inline'` 제거(인라인 스크립트 nonce/hash — 정적사이트라 가성비 낮아 보류), 인라인 `<script>` 데이터(KO/EN)가 전 페이지에 남는 점(런타임 필수라 유지).
