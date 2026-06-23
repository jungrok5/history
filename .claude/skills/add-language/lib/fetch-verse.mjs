#!/usr/bin/env node
// YouVersion 구절 verbatim 추출(요약 모델 환각 방지).  사용법: node fetch-verse.mjs <src> <USFM[,USFM...]>
// 예) node fetch-verse.mjs 189 GEN.1.1   /   node fetch-verse.mjs 1681 JHN.1.1-3,ROM.3.23
//     <src> 가 숫자면 YouVersion 버전ID, "ebible:<id>" 면 eBible.org(예: ebible:azb) 챕터 HTML 소스.
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
if (!yv || !refs.length) { console.error('usage: node fetch-verse.mjs <src> <USFM[,USFM...]>'); process.exit(2); }
const FORCE_CHAPTER = process.env.FORCE_CHAPTER === '1';
const EBIBLE = yv.startsWith('ebible:') ? yv.slice(7) : null;   // 비-YouVersion 소스: eBible.org
const OBS = yv.startsWith('obs:') ? yv.slice(4) : null;         // 무-성경 소스: Open Bible Stories(door43)
//   OBS ref 포맷: "<스토리>/<프레임>" 예) 1/1, 12/9, 또는 "<스토리>/title", "<스토리>/reference"

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
  // 1차: nodejs.bible.com JSON API (www.bible.com 은 봇 차단 "Client Challenge" 페이지를 반환하므로).
  //      API 의 content 는 www 챕터 페이지와 동일한 data-usfm 스팬 HTML 이라 같은 파서로 처리.
  let content = '';
  try {
    const api = JSON.parse(curlText(`https://nodejs.bible.com/api/bible/chapter/3.1?id=${yv}&reference=${chap}`) || '{}');
    content = api && typeof api.content === 'string' ? api.content : '';
  } catch (e) { content = ''; }
  // 2차(폴백): 구 www.bible.com __NEXT_DATA__ 경로.
  if (!content) {
    const j = nextData(curlText(`https://www.bible.com/bible/${yv}/${chap}`));
    content = j?.props?.pageProps?.chapterInfo?.content || '';
  }
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

// ---- (3) eBible.org 소스: 챕터 HTML(<span class="verse" id="V#">) 파서 ----
// URL: https://ebible.org/<id>/<BOOK><CC>.htm (CC=장, 최소 2자리). 각주(notemark/popup/f/x)·절번호 제외.
function parseEbibleChapter(html) {
  const mainAt = html.indexOf('class="main"');
  let body = mainAt >= 0 ? html.slice(mainAt) : html;
  const cut = body.search(/<ul class=['"]tnav|<div class="footnote"|<p class="copyright"/);
  if (cut >= 0) body = body.slice(0, cut);
  const verses = {};
  let cur = null, inNum = false, skip = 0;
  const stack = [];
  const re = /<([a-zA-Z]+)([^>]*)>|<\/([a-zA-Z]+)>|([^<]+)/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[1]) {
      const tag = m[1], attrs = m[2] || '';
      const selfClose = VOID.test(tag) || /\/\s*$/.test(attrs);
      const cls = (attrs.match(/class="([^"]*)"/) || [, ''])[1];
      const isVerse = /\bverse\b/.test(cls);
      const isNote = /\b(notemark|popup|f|x)\b/.test(cls); // 각주/상호참조 영역(중첩 ft/fq/xt 포함)
      if (isVerse) { const id = (attrs.match(/id="V(\d+)"/) || [])[1]; if (id) { cur = +id; inNum = true; } }
      if (!selfClose) stack.push({ tag, isNote, closesNum: isVerse });
      if (isNote) skip++;
    } else if (m[3]) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === m[3]) { const f = stack.splice(i, 1)[0]; if (f.isNote) skip--; if (f.closesNum) inNum = false; break; }
      }
    } else if (m[4]) {
      if (cur != null && !inNum && skip === 0) verses[cur] = (verses[cur] || '') + m[4];
    }
  }
  for (const k in verses) verses[k] = decodeEnt(verses[k]).replace(/\s+/g, ' ').trim();
  return verses;
}
const ebCache = new Map();
function ebibleVerses(book, ch) {
  const key = book + '.' + ch;
  if (ebCache.has(key)) return ebCache.get(key);
  let v = {};
  for (const w of [2, 3]) { // 대부분 2자리(GEN01); 시편 등 100+장은 3자리(PSA023.htm)
    v = parseEbibleChapter(curlText(`https://ebible.org/${EBIBLE}/${book}${String(ch).padStart(w, '0')}.htm`) || '');
    if (Object.keys(v).length) break;
  }
  ebCache.set(key, v);
  return v;
}
function ebibleMethod(ref) {
  const pr = parseRef(ref); if (!pr) return '';
  const [book, ch] = pr.chap.split('.');
  const vs = ebibleVerses(book, ch);
  return pr.list.map(u => vs[+u.split('.')[2]]).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

// 신포맷(Door43-Catalog 등): content/<SS>.md 마크다운에서 프레임 추출
//  프레임 = 이미지(![..]) 줄로 구분되는 본문 문단. title = '# 제목', reference = '_..._'.
function obsFrameMd(content, frameRaw) {
  const lines = content.split(/\r?\n/);
  if (frameRaw === 'title') { const h = lines.find(l => /^#\s/.test(l)); return h ? h.replace(/^#+\s*/, '').trim() : ''; }
  if (frameRaw === 'reference') { const r = lines.find(l => /^_.*_\s*$/.test(l.trim())); return r ? r.trim().replace(/^_+|_+$/g, '').trim() : ''; }
  const frames = []; let buf = [];
  for (const l of lines) {
    if (/^!\[/.test(l)) { if (buf.length) { frames.push(buf.join(' ').trim()); buf = []; } continue; }
    const t = l.trim();
    if (!t || /^#/.test(l)) continue;
    if (/^_.*_\s*$/.test(t)) { if (buf.length) { frames.push(buf.join(' ').trim()); buf = []; } break; }
    buf.push(t);
  }
  if (buf.length) frames.push(buf.join(' ').trim());
  return frames[(+frameRaw) - 1] || '';
}
function obsFrame(ref) {
  const m = String(ref).split('/');
  if (m.length < 2) return '';
  const story = ('0' + m[0]).slice(-2);
  const frameRaw = m[1];  // title / reference / 숫자
  // 구포맷: <SS>/<FF>.txt (예: fa_gl/Balochi_OBS)
  const frame = /^\d+$/.test(frameRaw) ? ('0' + frameRaw).slice(-2) : frameRaw;
  const t = curlText(`https://git.door43.org/${OBS}/raw/branch/master/${story}/${frame}.txt`);
  if (t && t.trim() && t.trim() !== 'Not found.') return t.replace(/\s+/g, ' ').trim();
  // 신포맷: content/<SS>.md (예: Door43-Catalog/guq_obs)
  const md = curlText(`https://git.door43.org/${OBS}/raw/branch/master/content/${story}.md`);
  if (md && md.trim() !== 'Not found.') { const v = obsFrameMd(md, frameRaw); if (v) return v.replace(/\s+/g, ' ').trim(); }
  return '';
}

for (const r of refs) {
  let text;
  if (OBS) text = obsFrame(r);
  else if (EBIBLE) text = ebibleMethod(r);
  else { text = newMethod(r); if (!text && !FORCE_CHAPTER) text = oldMethod(r); }
  console.log(`${r}\t${text || 'MISSING'}`);
}
