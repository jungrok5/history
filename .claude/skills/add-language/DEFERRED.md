# 보류 언어 목록 (Deferred / Held languages) — 사유 포함

> **정책 (AGENTS.md 품질 게이트: correctness > scale).** 신뢰할 **verbatim 성경 판본이 YouVersion·eBible·기타
> 어디든 존재**하고, 저자원이라 AI 산문 번역의 충실도를 보장 못 하는 언어가 **아니라면 → 추가한다**(완역=full,
> 신약만=partial, 다리언어=bridge, OBS 등 가능한 모드로). 그렇지 못하면 **여기에 사유와 함께 보류**한다.
> *"불확실한 AI 번역보다 정직한 '아직'이 낫다."* 사람 원어민 번역가/판본이 확보되면 재시도.
>
> 이 문서가 **보류 언어의 단일 출처**다. NOTES.md 결정로그는 여기를 가리킨다. 후보를 probe할 때마다 갱신.

## 분류
- **HELD** — verbatim 성경 소스를 어디서도 못 찾음(언어페이지/판본 없음). 소스가 확인되면 즉시 추가 가능.
- **DEFERRED** — 소스는 있으나 **저자원**이라 산문 번역의 정확도 보장 불가(품질 게이트 탈락). 사람 원어민 필요.
- **COVERED-BY-PARENT** — 부모/표준 언어로 충분히 커버됨(별도 판본도 거의 없음). 별도 추가 불필요.

## 목록

| code | 언어 | 분류 | 사유 | 해소 조건 |
|------|------|------|------|-----------|
| `knc` | Kanuri 카누리 | DEFERRED | 산문이 하우사(Hausa) 혼입 + 기도문/FAQ 문법 붕괴 — 블라인드 역번역 검증 실패 | 사람 원어민 번역가 |
| `guq` | Aché 아체 | DEFERRED | 초저자원 — AI 산문 신뢰 불가, 한 번도 배포 안 됨 | 사람 원어민 번역가 |
| `bm` | Bambara 밤바라 | HELD | YouVersion·eBible 모두 미발견(이름 기반 재확인 완료) | fetchable 판본 소스 확인 |
| `lij` | Ligurian 리구리아 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `lim` | Limburgish 림뷔르흐 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `lmo` | Lombard 롬바르드 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `ltz` | Luxembourgish 룩셈부르크 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `srd` | Sardinian 사르데냐 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `szl` | Silesian 실레시아 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `vec` | Venetian 베네토 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `kea` | Kabuverdianu 카보베르데 크리올 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `tzm` | Central Atlas Tamazight 타마지트 | HELD | YV·eBible 미발견 | fetchable 판본 소스 |
| `ast` | Asturian 아스투리아 | HELD | YV에 1861년 **1권 단편**뿐 — 템플릿(신약 다권 필요) 못 채움 | 다권/완역 판본 |
| `oci` | Occitan 오크 | HELD | YV에 1866년 1권 + 잠언만 — 단편 | 다권/완역 판본 |
| `scn` | Sicilian 시칠리아 | HELD | YV에 3권 단편만 | 다권/완역 판본 |
| `fur` | Friulian 프리울리 | HELD | YV에 1860년 1권 단편만 | 다권/완역 판본 |
| `acm` | Mesopotamian Arabic | COVERED-BY-PARENT | MSA(`ar`)로 커버 — 별도 성경 판본 사실상 없음 | — |
| `acq` | Taʿizzi-Adeni Arabic | COVERED-BY-PARENT | 〃 | — |
| `aeb` | Tunisian Arabic | COVERED-BY-PARENT | 〃 | — |
| `ajp` | South Levantine Arabic | COVERED-BY-PARENT | 〃 | — |
| `apc` | North Levantine Arabic | COVERED-BY-PARENT | 〃 | — |
| `ars` | Najdi Arabic | COVERED-BY-PARENT | 〃 | — |

## 추가 진행 대상 (gate 0 확정 — 보류 아님)
- **et (Estonian)** — partial(PKEK/YV 3257, 신약 27권). ✅ **배포 완료.**
- **prs (Dari)** — **FULL**(TDV/YV 341, 66권). 진행 예정.
- partial(신약 27권) 확정: **san**(산스크리트 #1875) · **ltg**(라트갈레 #3378) · **dzo**(종카 #3157) ·
  **kbp**(카비예 #555) · **dik**(딩카 #242) · **taq**(타마셰크 #1144) · **ydd**(이디시 히브리문자 OYBC #3457).
  → 이 중 dzo·kbp·dik·taq·san 은 **저자원**이라 verify-prose가 GT-FAIL 가능 → 원어민 검수 결과에 따라
  BLOCKER/MAJOR면 위 표로 내려 보류한다(품질 게이트가 최종 결정).

> probe는 **YouVersion·eBible(우리가 fetch 가능한 소스)** 기준. HELD 언어도 다른 곳엔 성경이 있을 수 있으나,
> verbatim으로 가져올 수 없으면 우리 규칙상 추가 불가다.
