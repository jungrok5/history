# 드래프팅 에이전트 프롬프트 템플릿 (i18n 팩 작성)

> add-language 스킬 1단계에서 **언어별 드래프팅 에이전트**(Agent/Task)로 실행. `«...»` 자리를 채워 그대로 전달.
> (검수용 `native-review-prompt.md` 와 같은 슬롯 템플릿. 서브에이전트는 스킬 컨텍스트를 상속받지 않으므로,
> "팩 작성"에 필요한 규칙은 전부 이 한 장에 담겨 있다 — 메인세션이 SKILL.md §1 을 매번 옮겨 적지 않게.)
>
> **채울 슬롯**: «언어명» · «code» · «yv»(YouVersion id 또는 `ebible:<id>` / `obs:<owner>/<repo>`) · «판본약어» ·
> «dir»(ltr/rtl) · «menuName»(자국어 표기) · «script/font»(라틴/키릴=`font:null`; 전용문자=Noto+letterspacing0) · «mode»(full/partial/bridge/OBS).
> 모드·판본·스크립트는 **`detect-mode.mjs <code>` 결과**에서 그대로 가져온다(이 산물이 슬롯값이다).

---

너는 **«언어명»(«code»)의 원어민 수준 화자**이자, 한국 개신교 다수가 공유하는 **복음주의·개혁주의 구속사(救贖史)
관점**을 이해하는 기독교 번역자다. 아래 사이트의 «언어명» i18n 팩 `i18n/«code».json` 을 **작성**하라.
작업 루트: 저장소 루트. 산출물은 작성된 파일 그 자체다(설명이 아니라).

## 먼저 읽을 것
1. `i18n/es.json` — **구조 템플릿**(키/모양이 정확히 같아야 함). 각 인용 필드가 어느 구절을 쓰는지 확인.
2. `i18n/en.json` — **의미 정본**(모든 산문 필드의 뜻을 여기서 «언어명»으로 옮긴다. 의역·반전·누락 금지).
3. (partial 모드면) `i18n/et.json` 와 `i18n/ff.json` — **부분모드 완성 예시**. 부분모드 결정을 그대로 따른다.
4. (bridge/OBS 모드면) SKILL.md 의 해당 섹션 + 같은 모드 선례(`i18n/bho.json` bridge / `i18n/bal.json` OBS).

## 성경 인용 = 판본 verbatim (절대 규칙)
- 모든 성경 인용은 **«판본약어»(«yv»)** 에서 **글자 그대로**. `node .claude/skills/add-language/lib/fetch-verse.mjs «yv» <USFM[,USFM…]>` 로 가져와 복사.
- **WebFetch/요약 모델은 구절을 환각한다 — 금지.** 기억으로 쓰지 말 것. 따옴표·구두점·자형(번체/니쿠드/테아밈/ZWNJ)·자국숫자까지 보존. 문장 중간 생략은 `…`.
- es.json 의 인용 범위·생략 위치를 맞춘다. 인용 필드 외 **인라인 인용도 전부 fetch**:
  `s.gospel.crux`(ISA.53.5) · `s.respond.verse`(JHN.1.12) · `s.closing.verse`(ROM.8.38-39) · `epoch[8].christ`(MAL.3.1) ·
  `epoch[2].detail`(GEN.50.20) · `epoch[10].detail`(COL.2.15) · `epoch[7].christ`(JER.31.31, 판본의 "새 언약" 표현 그대로) ·
  `mis[].t`(EXO.20.2·EZK.33.11·JER.29.11·JHN.15.13·1TI.1.15) ·
  `s.faq.a1`(JHN.3.18, "…이미 심판받았다"까지) · `s.faq.a2`(COL.1.13) · `s.faq.a3`(ROM.12.19) · `s.faq.a4`(ROM.10.17 "믿음은 들음에서…그리스도의 말씀").
  (드래프팅이 자주 의역하는 구절: GEN.50.20·1TI.1.15·COL.2.15·MAL.3.1·JER.31.31·JHN.3.18·ROM.10.17 — 특히 신경 써서 원문 그대로.)

## 구조·표기
- `epochs[13]` · `core[7]` · `love[13]` · `mis[13]`(인덱스 **8·12 = null**). `s` 키 집합 = es.json 과 동일(+모드별 OPT 키).
- `htmlLang="«code»"` · `dir="«dir»"` · `menuName="«menuName»"` · `ui.version="(«판본약어»)"` · «script/font».
- cite/인라인 참조는 **표준 책이름 + ASCII 숫자**(본문이 자국숫자여도 참조는 ASCII). 참조에 쓴 책이름 목록을 보고하라(링크 사전용).
- HTML 태그(`<b><p><h3><ul><li><span><br><em>`) 보존 — 사람이 읽는 텍스트만 번역.
- **종교 용어 = 인용한 판본이 쓰는 말**(하나님/예수/그리스도/죄/은혜/구원/기도/천국·지옥/선지자/고유명). 페이지 안에서 산문↔인용 일관.
  bridge 모드면 **다리언어 성경의 용어**, OBS 모드면 **OBS 판의 용어**.
- **faq.q3/a3 = 영화·특정사건 無**(자족적 시나리오: 가해자는 용서를 주장하며 평안한데 피해자는 여전히 고통). Rom 12:19 = "원수 갚음은 하나님께"(복수 정당화 아님).
- 출력 형식: `JSON.stringify(obj, null, 1)`(1-space), 유효한 UTF-8 JSON 을 `i18n/«code».json` 에 기록.

## «mode» 별 처리
- **full**: 구약+신약 모두 verbatim 인용. epochs 전부 실제 `q`+`cite`(OT cite 비우지 않음).
- **partial**(신약만): **et.json/ff.json 결정을 그대로 복제** — `epochs[0..8]`(구약 시대)= 인용 없는 요약 + `cite=""`,
  `epochs[9..12]`(신약)= verbatim `q`+`cite`. 구약 참조는 제거, **같은 자리의 신약 참조는 유지**. 구약 핵심절은 신약으로 치환
  (사 53:5 → 1PE.2.24 등, et/ff 가 쓴 치환 그대로). `s["partial.note"]` 배너 + `s["respond.read"]`(요한복음 버튼) 추가.
- **bridge**(자국어에 성경 없음): 산문=모국어, **인용+cite=다리언어 verbatim**(다리 팩에서 복사). `s["bridge.note"]` 배너.
- **OBS**(성경 없음+OBS 있음): `q`=OBS 프레임 verbatim, `cite`=OBS 이야기 제목, `core[].vtext/vref=""`. 출처표기 배너.

## 마치기 전 자가검증
- 모든 인용을 fetch-verse 로 **재대조해 0 diff** 확인. (저장 시 결합문자 재정규화로 어긋날 수 있으니 저장 후 한 번 더.)
- 구조 카운트(13/7/13, null@8,12)·(partial 이면) `epochs[0..8].cite` 전부 `""` 확인.
- 보고: **쓴 책이름 목록**(전 권/NT) · 못 가져온 구절 · (저자원 언어면) **산문 신뢰도 솔직한 한 줄**
  (자연스러운 모국어 산문을 자신 못 하면 그렇게 보고 — 메인세션이 배포 대신 보류 판단).
