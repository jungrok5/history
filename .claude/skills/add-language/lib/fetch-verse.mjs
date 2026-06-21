#!/usr/bin/env node
// YouVersion 구절 verbatim 추출(요약 모델 환각 방지).  사용법: node fetch-verse.mjs <yvId> <USFM[,USFM...]>
// 예) node fetch-verse.mjs 189 GEN.1.1   /   node fetch-verse.mjs 1681 JHN.1.1-3,ROM.3.23
//
// 두 가지 포맷 지원:
//  (1) 구포맷: 절 페이지 <script id="__NEXT_DATA__"> JSON 의 verse content 를 그대로 수집.
//  (2) 신포맷(폴백): 구포맷이 비면 같은 버전의 "챕터" 페이지를 받아
//      pageProps.chapterInfo.content (data-usfm 스팬 HTML)에서 해당 절을 파싱.
//      각주/상호참조(class="note ...")와 절번호(class="label")는 제외, class="content" 본문만.
//  - 오디오 전용 버전(본문에 "available in audio format")은 본문이 없으므로 MISSING.
//  - 디버그: FORCE_CHAPTER=1 면 (2)만 사용(파서 검증용).
import { execFileSync } from 'child_process';

const yv = process.argv[2];
const refs = (process.argv[3] || '').split(',').map(s => s.trim()).filter(Boolean);
if (!yv || !refs.length) { console.error('usage: node fetch-verse.mjs <yvId> <USFM[,USFM...]>'); process.exit(2); }
const FORCE_CHAPTER = process.env.FORCE_CHAPTER === '1';

function curlText(url) {
  for (let i = 0; i < 4; i++) {
    try { return execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', '30', url], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }); }
    catch (e) { if (i === 3) throw e; }
  }
}
function nextData(html) {
  const m = html && html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}
function decodeEnt(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch { return ''; } })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ''; } })
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

// ---- (1) 구포맷: 절 페이지 __NEXT_DATA__ content ----
function oldMethod(ref) {
  const j = nextData(curlText(`https://www.bible.com/bible/${yv}/${ref}`));
  if (!j) return '';
  let t = '';
  (function g(o, d = 0) {
    if (d > 14 || !o || typeof o !== 'object') return;
    if (typeof o.content === 'string' && o.content.trim()) t += (t ? ' ' : '') + o.content.trim();
    if (Array.isArray(o)) o.forEach(x => g(x, d + 1)); else for (const k in o) g(o[k], d + 1);
  })(j);
  return t.replace(/\s+/g, ' ').trim();
}

// ---- (2) 신포맷: 챕터 HTML(chapterInfo.content) 파서 ----
const VOID = /^(br|img|hr|wbr|meta|input|col|area|base|link|source)$/i;
function parseChapterContent(contentHtml) {
  const verses = {};                 // usfm -> text
  const stack = [], verseStack = []; // 열린 태그 / 열린 verse usfm
  let noteDepth = 0, contentDepth = 0;
  const re = /<([a-zA-Z]+)([^>]*)>|<\/([a-zA-Z]+)>|([^<]+)/g;
  let m;
  while ((m = re.exec(contentHtml))) {
    if (m[1]) {                      // 여는 태그
      const tag = m[1], attrs = m[2] || '';
      if (VOID.test(tag) || /\/\s*$/.test(attrs)) continue; // self-closing 무시
      const cls = (attrs.match(/class="([^"]*)"/) || [, ''])[1].split(/\s+/);
      const usfm = (attrs.match(/data-usfm="([^"]*)"/) || [])[1];
      const f = { tag, isVerse: cls.includes('verse'), isNote: cls.includes('note'), isContent: cls.includes('content'), usfm };
      stack.push(f);
      if (f.isVerse && usfm) verseStack.push(usfm);
      if (f.isNote) noteDepth++;
      if (f.isContent) contentDepth++;
    } else if (m[3]) {               // 닫는 태그 — 같은 tag 의 최근 프레임 pop
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === m[3]) {
          const f = stack.splice(i, 1)[0];
          if (f.isVerse && f.usfm) { const k = verseStack.lastIndexOf(f.usfm); if (k >= 0) verseStack.splice(k, 1); }
          if (f.isNote) noteDepth--;
          if (f.isContent) contentDepth--;
          break;
        }
      }
    } else if (m[4]) {               // 텍스트 — 현재 verse 안 + content 안 + note 밖일 때만
      const cur = verseStack[verseStack.length - 1];
      if (cur && contentDepth > 0 && noteDepth === 0) verses[cur] = (verses[cur] || '') + m[4];
    }
  }
  for (const k in verses) verses[k] = decodeEnt(verses[k]).replace(/\s+/g, ' ').trim();
  return verses;
}
const chapCache = new Map();
function chapterVerses(chap) {
  if (chapCache.has(chap)) return chapCache.get(chap);
  const j = nextData(curlText(`https://www.bible.com/bible/${yv}/${chap}`));
  const content = j?.props?.pageProps?.chapterInfo?.content;
  let verses = {};
  if (content && !/available in audio format/i.test(content)) verses = parseChapterContent(content);
  chapCache.set(chap, verses);
  return verses;
}
function parseRef(ref) {              // BOOK.C.V | BOOK.C.V-W | BOOK.C.V-BOOK.C.W
  const [a, b] = ref.split('-');
  const pa = a.split('.'); if (pa.length < 3) return null;
  const book = pa[0], ch = pa[1], v1 = +pa[2];
  let v2 = v1;
  if (b !== undefined) { const pb = b.split('.'); v2 = +(pb.length >= 3 ? pb[2] : pb[0]); }
  if (!(v2 >= v1)) v2 = v1;
  const list = [];
  for (let v = v1; v <= v2 && v - v1 < 400; v++) list.push(`${book}.${ch}.${v}`);
  return { chap: `${book}.${ch}`, list };
}
function newMethod(ref) {
  const pr = parseRef(ref); if (!pr) return '';
  const vs = chapterVerses(pr.chap);
  return pr.list.map(u => vs[u]).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

for (const r of refs) {
  let text = FORCE_CHAPTER ? '' : oldMethod(r);
  if (!text) text = newMethod(r);
  console.log(`${r}\t${text || 'MISSING'}`);
}
