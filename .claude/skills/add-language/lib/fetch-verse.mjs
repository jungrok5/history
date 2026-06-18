#!/usr/bin/env node
// YouVersion 구절 verbatim 추출(요약 모델 환각 방지).  사용법: node fetch-verse.mjs <yvId> <USFM[,USFM...]>
// 예) node fetch-verse.mjs 189 GEN.1.1   /   node fetch-verse.mjs 1681 JHN.1.1-3,ROM.3.23
// bible.com 페이지의 <script id="__NEXT_DATA__"> JSON 에서 verse content 를 그대로 뽑는다(범위 지원).
import { execFileSync } from 'child_process';

const yv = process.argv[2];
const refs = (process.argv[3] || '').split(',').map(s => s.trim()).filter(Boolean);
if (!yv || !refs.length) { console.error('usage: node fetch-verse.mjs <yvId> <USFM[,USFM...]>'); process.exit(2); }

function fetchOne(ref) {
  const url = `https://www.bible.com/bible/${yv}/${ref}`;
  let html;
  for (let i = 0; i < 4; i++) {
    try { html = execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', '30', url], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }); break; }
    catch (e) { if (i === 3) throw e; }
  }
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return { ref, text: '', ok: false, note: 'no __NEXT_DATA__' };
  let j; try { j = JSON.parse(m[1]); } catch (e) { return { ref, text: '', ok: false, note: 'parse fail' }; }
  let t = '';
  (function g(o, d = 0) {
    if (d > 14 || !o || typeof o !== 'object') return;
    if (typeof o.content === 'string' && o.content.trim()) t += (t ? ' ' : '') + o.content.trim();
    if (Array.isArray(o)) o.forEach(x => g(x, d + 1)); else for (const k in o) g(o[k], d + 1);
  })(j);
  return { ref, text: t.replace(/\s+/g, ' ').trim(), ok: !!t.trim() };
}

for (const r of refs) {
  const out = fetchOne(r);
  if (out.ok) console.log(`${out.ref}\t${out.text}`);
  else console.log(`${out.ref}\tMISSING${out.note ? ' (' + out.note + ')' : ''}`);
}
