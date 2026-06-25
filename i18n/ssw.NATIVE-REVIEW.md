# ssw (siSwati) — 원어민 표기 검토 대기 항목

> 상태: **배포 보류** (LANGS 미등록). 구절 인용·교리·민감주제·HTML·구조 게이트는 모두 통과(CLEAN).
> 아래 **산문/UI 표기 3건**만 원어민 siSwati 화자의 확정이 필요합니다. 확정되면 `i18n/ssw.json` 수정 →
> `validate`/`audit-links`/`verify-verbatim`/`verify-inline` 재실행 → LANGS 3줄 복원(index.html hreflang+LANGS,
> tools/build-pages.mjs LANGS) → 빌드 → 배포.
>
> 판본: Siswati 1996 Bible (SWT, YouVersion #604). 검증 근거: 1·2차 원어민 검수 에이전트.
> **공통 근거: siSwati 표준 정자법에는 `lc`·`phc`·`tjh` 자모결합이 존재하지 않음**(이는 isiNdebele/isiZulu식 표기이거나 단순 오타).

---

## ✅ 이미 반영 완료 (참고)
- `mis[5].t` : `liphcombi` → **`buphingi`** (간음). siSwati 성경 #604가 어근 `-phinga` 사용(EXO 20:14·MAT 5:27 "Ungaphingi")으로 **확정**되어 적용함. → "David wenta buphingi waze wabulala."

---

## ⏳ 원어민 확정 필요 3건

### 1. `epochs[6].people` — "etwesibili"
- 현재: `Emakhosi etwesibili imibuso; baphrofethi labafana na-Elija, Isaya, Jeremiya`
- 영어 원뜻: **"The kings of both kingdoms; prophets like Elijah, Isaiah, Jeremiah"**
- 문제: `etwesibili`는 표준 수사 형태가 아님. imibuso(명사 클래스 4 복수)와 일치하는 "둘/양쪽"이 필요.
- 후보(원어민 확인): `imibuso lemibili`(두 왕국) 또는 `yomibili imibuso`(양 왕국) 계열.
- 확신도: 비표준이라는 점은 높음 / 정확한 교정형은 낮음.

### 2. `epochs[4].detail` (사사기 항목) — "balcibijolo"
- 현재: `… Gideoni, Samsoni, Debora — bakhululi besikhashana, balcibijolo kodvwa banetiphene letikhulu.`
- 영어 원뜻 맥락: 사사들은 **"heroic but deeply flawed"**(영웅적이나 결함 많은) — `balcibijolo`가 '영웅적'에 해당.
- 문제: `lc` 결합은 siSwati 정자법에 없음 → 깨진 단어. 사전·성경에 없음.
- 후보(원어민 확인): `linesibindzi`/`banesibindzi`(담대한), `emaqhawe`/`liqhawe`(영웅) 계열.
- 확신도: 비표준 확정 높음 / 교정형은 낮음.

### 3. `s["ui.toast"]` — "likhutjhuliwe"
- 현재: `Lilinki likhutjhuliwe 📋`
- 영어 원뜻: **"Link copied 📋"** (링크 복사됨 — 공유 버튼 누르면 뜨는 토스트)
- 문제: `tjh` 결합은 siSwati 아님(siNdebele/isiZulu식). siSwati는 `tj`만 씀.
- 후보(원어민 확인): `Lilinki likhophishiwe`(또는 `likopishiwe`) 계열. UI 관용 표현은 원어민 판단 권장.
- 확신도: `tjh` 비표준 확정 높음 / 교정형은 중간.

---

## 재통합 체크리스트 (확정 후)
1. `i18n/ssw.json` 3건 수정 (위 필드).
2. `node .claude/skills/add-language/lib/validate.mjs ssw` → 통과.
3. `node .claude/skills/add-language/lib/audit-links.mjs ssw` → 0 missed(숫자 오탐 제외).
4. LANGS 복원:
   - `index.html`: `<link rel="alternate" hreflang="ssw" …/>` + `{code:'ssw',native:'siSwati',en:'Swati'}`
   - `tools/build-pages.mjs`: `{ code:'ssw', dir:'ltr', locale:'ssw_SZ' }`
5. `node tools/build-pages.mjs` → ssw 페이지 생성 확인.
6. 커밋 → main ff-only 머지 → 배포.
