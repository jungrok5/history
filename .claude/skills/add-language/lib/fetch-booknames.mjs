#!/usr/bin/env node
// 버전의 현지어 책이름 66권을 YouVersion books API 에서 그대로 가져온다.
// drafting 에이전트가 고른 변이형 대신 "판본이 실제로 쓰는 표기"를 BOOKS 의 근거로 삼기 위함.
// (SKILL.md digest: "Authoritative localized book names = the version's books API, NOT the drafting agent.")
//
// 사용법:
//   node fetch-booknames.mjs <YV>            # USFM<TAB>현지어이름  66줄 + 요약
//   node fetch-booknames.mjs <YV> --config   # integrate 설정의 books_single/books_numbered 스니펫(붙여넣기용)
//
// 번호책(1/2/3 …)은 같은 계열 이름들의 "최장 공통 접미사"로 base stem 을 자동 도출하므로
// 자국숫자 접두(۱سمویئل), ASCII 접두(1 Samuel), 풀어쓴 서수(اول سموئیل) 모두 처리한다.
// integrate 는 base stem 으로 "<번호> <이름>"(ASCII 숫자+공백)을 생성하므로, 판본 표면형이
// 그와 다르면(서수/하이픈/자국숫자) 경고를 찍는다 — 그때는 본문 ref 를 ASCII 형으로 통일하거나
// 해당 표면형을 books_single 에 직접 넣어야 한다.
import { execFileSync } from 'child_process';

const yv = process.argv[2];
const CONFIG = process.argv.includes('--config');
if (!yv || /^(ebible|obs):/.test(yv) || !/^\d+$/.test(yv)) {
  console.error('usage: node fetch-booknames.mjs <YV(numeric YouVersion id)> [--config]');
  console.error('  (eBible/OBS sources have no books API — read book names off the source pages instead.)');
  process.exit(2);
}

function curlText(url) {
  for (let i = 0; i < 4; i++) {
    try { return execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', '30', url], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }); }
    catch (e) { if (i === 3) throw e; }
  }
}

// 번호책 계열: USFM → {family, n}
const NUMBERED = {
  '1SA': ['SA', 1], '2SA': ['SA', 2], '1KI': ['KI', 1], '2KI': ['KI', 2],
  '1CH': ['CH', 1], '2CH': ['CH', 2], '1CO': ['CO', 1], '2CO': ['CO', 2],
  '1TH': ['TH', 1], '2TH': ['TH', 2], '1TI': ['TI', 1], '2TI': ['TI', 2],
  '1PE': ['PE', 1], '2PE': ['PE', 2], '1JN': ['JN', 1], '2JN': ['JN', 2], '3JN': ['JN', 3],
};
// 비-ASCII(자국) 숫자
const NATIVE_DIGIT = /[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙]/;
const JOIN = /^[\s.\-،‌​ـ]+/; // 앞쪽 공백/점/하이픈/아랍쉼표/ZWNJ/ZWSP/타트윌

function longestCommonSuffix(arr) {
  if (!arr.length) return '';
  let s = arr[0];
  for (const x of arr.slice(1)) {
    let i = 0;
    while (i < s.length && i < x.length && s[s.length - 1 - i] === x[x.length - 1 - i]) i++;
    s = s.slice(s.length - i);
  }
  return s;
}

const raw = curlText(`https://nodejs.bible.com/api/bible/version/3.1?id=${yv}`);
let j; try { j = JSON.parse(raw); } catch { console.error('API 응답 파싱 실패 (id 가 맞는지 확인). 앞부분:\n' + (raw || '').slice(0, 200)); process.exit(1); }
const rawBooks = (j.books || (j.version && j.version.books) || []).map(b => ({
  usfm: (b.usfm || b.id || '').toUpperCase(),
  human: (b.human || b.name || b.abbreviation || '').trim(),
  human_long: (b.human_long || '').trim(),
})).filter(b => b.usfm && b.human);
if (!rawBooks.length) { console.error('books 비어있음 — API 형식이 바뀌었을 수 있음. 키:', Object.keys(j)); process.exit(1); }

// CJK 판본: 책이름이 한자/가나/한글(대소문자 없음)이고 번호책은 ASCII "<n> name" 이 아니라
//   접미/중간형(撒母耳記上/下·哥林多前書/後書·約翰一書/二書/三書)을 쓴다. 책 집합으로 판정.
const CJK = /[㐀-鿿぀-ヿ가-힯]/;
const isCJK = rawBooks.filter(b => CJK.test(b.human)).length > rawBooks.length / 2;
const titleCase = s => s.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ');
// 본문(드래프팅 에이전트)이 실제 쓰는 표기를 고른다:
//  - CJK: human 이 약칭일 때가 있음(約翰=John) → human_long 이 약간 더 긴 정식형(約翰福音)이면 그것을.
//  - 그 외: human 이 참조 표기. API 가 전부 대문자면(말레이 "YOHANES") 본문은 Title Case 이므로 변환.
function pickName(b) {
  if (isCJK) {
    const h = b.human, hl = b.human_long;
    if (hl && hl.startsWith(h) && hl.length > h.length && hl.length <= h.length + 4) return hl;
    return h;
  }
  let name = b.human;
  if (name && name === name.toUpperCase() && /[A-Z]/.test(name)) name = titleCase(name);
  return name;
}
const books = rawBooks.map(b => ({ usfm: b.usfm, human: pickName(b) }));

if (!CONFIG) {
  for (const b of books) console.log(b.usfm + '\t' + b.human);
  console.log(`\n# ${books.length} books (expect 66 for a full Bible; fewer = partial/NT-only edition).${isCJK ? ' [CJK]' : ''}`);
  process.exit(0);
}

// ---- --config: integrate 설정 스니펫 ----
const single = {};   // name -> USFM
const numbered = {};  // base stem -> {n: USFM}
const warns = [];
if (isCJK) {
  // CJK: 번호책도 접미/중간형 전체 표면형이므로 전부 books_single 로(번호 생성 안 함).
  for (const b of books) single[b.human] = b.usfm;
} else {
  const families = {}; // family -> [{n, usfm, human}]
  for (const b of books) {
    if (NUMBERED[b.usfm]) { const [fam, n] = NUMBERED[b.usfm]; (families[fam] ||= []).push({ n, usfm: b.usfm, human: b.human }); }
    else single[b.human] = b.usfm;
  }
  for (const fam in families) {
    const mem = families[fam].sort((a, b) => a.n - b.n);
    let base = longestCommonSuffix(mem.map(m => m.human)).replace(JOIN, '').trim();
    if (!base) { warns.push(`⚠ ${fam} 계열의 공통 접미사를 못 찾음 → 각 표면형을 books_single 에 직접 넣음: ${mem.map(m => `"${m.human}"=${m.usfm}`).join(', ')}`); mem.forEach(m => single[m.human] = m.usfm); continue; }
    numbered[base] = Object.fromEntries(mem.map(m => [String(m.n), m.usfm]));
    // 판본 표면형이 integrate 생성형("<n> <base>", ASCII+공백)과 다른가?
    for (const m of mem) {
      const expected = `${m.n} ${base}`;
      if (m.human !== expected) {
        const marker = m.human.slice(0, m.human.length - base.length);
        const kind = NATIVE_DIGIT.test(marker) ? '자국숫자 접두' : /^\d/.test(marker.trim()) ? '구분자(공백 외)' : '풀어쓴 서수';
        warns.push(`⚠ ${m.usfm}: 판본은 "${m.human}" (${kind}) ≠ integrate 생성형 "${expected}". → 본문 ref 를 ASCII "${expected}" 로 통일하거나, "${m.human}" 를 books_single 에 직접 추가.`);
      }
    }
  }
}

const sortByUsfm = o => Object.fromEntries(Object.entries(o)); // 입력(정경) 순서 유지
console.log('  "books_single": ' + JSON.stringify(sortByUsfm(single), null, 4).replace(/\n/g, '\n  ') + ',');
console.log('  "books_numbered": ' + JSON.stringify(numbered, null, 4).replace(/\n/g, '\n  '));
if (warns.length) { console.log('\n# 경고 (' + warns.length + '):'); warns.forEach(w => console.log('# ' + w)); }
else if (isCJK) console.log('\n# [CJK] 모든 책(번호책 포함)을 full 표면형으로 books_single 에 넣음 · books_numbered 비움 — 본문도 정식형(예: 約翰福音) 사용.');
else console.log('\n# 모든 번호책이 ASCII "<n> <name>" 형 — integrate 생성형과 일치(추가 작업 없음).');
console.log(`# ${books.length} books. 책이름은 판본(${yv})이 실제 쓰는 표기 — 본문 cite/inline ref 도 이 표기에 맞출 것.`);
