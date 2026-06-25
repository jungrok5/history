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
| `bm` | Bambara 밤바라 | HELD | YouVersion 언어페이지 없음 · eBible 미발견(재-probe 필요) | verbatim 판본 소스 확인 |
| `acm` | Mesopotamian Arabic | COVERED-BY-PARENT | MSA(`ar`)로 커버 — 별도 성경 판본 사실상 없음 | — |
| `acq` | Taʿizzi-Adeni Arabic | COVERED-BY-PARENT | 〃 | — |
| `aeb` | Tunisian Arabic | COVERED-BY-PARENT | 〃 | — |
| `ajp` | South Levantine Arabic | COVERED-BY-PARENT | 〃 | — |
| `apc` | North Levantine Arabic | COVERED-BY-PARENT | 〃 | — |
| `ars` | Najdi Arabic | COVERED-BY-PARENT | 〃 | — |

## 참고 (보류 아님 — 추적용)
- **et (Estonian)**: full(구약포함) 완역이 YV·eBible 어디에도 없음 → **partial 모드로 추가**(ECV/YV 3257, 신약 27권 완역). 보류 아님.
- FLORES-200 미커버 중 위에 없는 코드(ast·fur·lij·lim·lmo·ltg·ltz·oci·scn·srd·szl·vec·dik·dzo·kbp·kea·prs·san·taq·tzm·ydd 등)는
  **아직 소스 probe 전**. probe 후 "추가 가능"이면 추가하고, "소스 없음/저자원"이면 위 표로 내려 사유와 함께 기록한다.
