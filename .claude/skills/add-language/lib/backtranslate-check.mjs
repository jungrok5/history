#!/usr/bin/env node
// 역번역 QA(저자원 언어 산문 의미검증).  사용법: node backtranslate-check.mjs <code> [targetLang=ko]
//   i18n/<code>.json 의 **연결 산문**을 구글번역(무료 엔드포인트)으로 targetLang 으로 역번역해
//   의도(EN/KO)와 나란히 출력 → 사람/LLM 이 **의미 반전·오역**을 눈으로 잡는다(about.line "ɗoftaaki" 반전이 이렇게 잡힘).
//   ⚠ 성경 인용(epochs.q·core.vtext·respond.verse·closing.verse)은 verbatim 이라 제외(verify-verbatim 담당).
//   ⚠ 구글번역이 지원하는 언어에서만 유효(미지원 저자원어는 빈/엉뚱 결과 → 그땐 원어민 검수만이 답).
//   비공식 엔드포인트라 레이트리밋 가능 → 필드당 지연+재시도. 운영용 아님(QA 한정).
import fs from 'fs';
import path from 'path';

const code = process.argv[2];
const tl = process.argv[3] || 'ko';
if (!code) { console.error('usage: node backtranslate-check.mjs <code> [targetLang=ko]'); process.exit(2); }
const root = process.cwd();
const pack = JSON.parse(fs.readFileSync(path.join(root, `i18n/${code}.json`), 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
async function gt(text) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + code + '&tl=' + tl + '&dt=t&q=' + encodeURIComponent(text);
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return (j[0] || []).map(seg => seg[0]).join('');
    } catch (e) { if (i === 3) return '__GT_FAIL__: ' + e.message; await sleep(800 * (i + 1)); }
  }
}

// 검증할 산문 필드 수집(성경 인용 제외)
const items = [];
const SKIP_S = new Set(['respond.verse', 'closing.verse']); // verbatim 인용
for (const [k, v] of Object.entries(pack.s || {})) if (!SKIP_S.has(k) && typeof v === 'string') items.push(['s.' + k, v]);
pack.epochs.forEach((e, i) => ['one', 'people', 'events', 'christ', 'detail', 'next'].forEach(f => items.push(['epoch[' + i + '].' + f, e[f]])));
pack.core.forEach((c, i) => ['title', 'body'].forEach(f => items.push(['core[' + i + '].' + f, c[f]])));
(pack.mis || []).forEach((m, i) => { if (m) { items.push(['mis[' + i + '].w', m.w]); items.push(['mis[' + i + '].t', m.t]); } });
(pack.love || []).forEach((l, i) => items.push(['love[' + i + ']', l]));

console.log('# 역번역 QA: ' + code + ' → ' + tl + '  (' + items.length + ' 필드)\n# gospel.crux 의 «…» 인용절은 verbatim 이므로 의미만 참고.\n');
for (const [pathStr, raw] of items) {
  const src = strip(raw);
  if (src.length < 2) continue;
  const bt = await gt(src);
  console.log('■ ' + pathStr);
  console.log('  ' + bt + '\n');
  await sleep(140);
}
