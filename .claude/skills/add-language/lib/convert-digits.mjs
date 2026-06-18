#!/usr/bin/env node
// 참조의 비-ASCII 숫자(데바나가리/아랍/타이/전각)를 ASCII로 변환(링커가 \d 로 인식하도록).
// ⚠ 먼저 validate.mjs 로 verse-text(인용 본문)에 해당 숫자가 없음을 확인할 것.
//   (있다면 verbatim 손상 위험 — 수동 처리 필요)
// 사용법: node convert-digits.mjs <code> [repoRoot]
import fs from 'fs';
import path from 'path';

const code = process.argv[2];
const root = process.argv[3] || process.cwd();
if (!code) { console.error('usage: node convert-digits.mjs <code> [repoRoot]'); process.exit(2); }
const file = path.join(root, `i18n/${code}.json`);

const maps = [
  ['०१२३४५६७८९', '0123456789'], // Devanagari
  ['٠١٢٣٤٥٦٧٨٩', '0123456789'], // Arabic-Indic
  ['۰۱۲۳۴۵۶۷۸۹', '0123456789'], // Extended Arabic-Indic (Persian/Urdu)
  ['๐๑๒๓๔๕๖๗๘๙', '0123456789'], // Thai
  ['၀၁၂၃၄၅၆၇၈၉', '0123456789'], // Myanmar
  ['០១២៣៤៥៦៧៨៩', '0123456789'], // Khmer
  ['০১২৩৪৫৬৭৮৯', '0123456789'], // Bengali
  ['໐໑໒໓໔໕໖໗໘໙', '0123456789'], // Lao
  ['෦෧෨෩෪෫෬෭෮෯', '0123456789'], // Sinhala (Lith)
  ['０１２３４５６７８９', '0123456789'], // Fullwidth
];
const m = {};
for (const [from, to] of maps) for (let i = 0; i < from.length; i++) m[from[i]] = to[i];
const re = new RegExp('[' + Object.keys(m).join('') + ']', 'g');

let t = fs.readFileSync(file, 'utf8');
const before = (t.match(re) || []).length;
t = t.replace(re, (d) => m[d]);
JSON.parse(t); // 유효성
fs.writeFileSync(file, t);
console.log(`변환: ${before} 개 비-ASCII 숫자 → ASCII (남음: ${(t.match(re) || []).length})`);
