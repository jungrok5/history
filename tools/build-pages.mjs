// 언어별 정적 페이지 + OG 이미지 + hreflang + sitemap 자동 생성기
// 사용법: node tools/build-pages.mjs   (rsvg-convert 필요)
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const ORIGIN = 'https://one-scroll-bible.com';
const root = process.cwd();

// 언어 메타 (순서 = 메뉴 순서). ko는 루트(/) 페이지.
const LANGS = [
  { code:'ko',      dir:'ltr', locale:'ko_KR' },
  { code:'en',      dir:'ltr', locale:'en_US' },
  { code:'zh-Hans', dir:'ltr', locale:'zh_CN' },
  { code:'zh-Hant', dir:'ltr', locale:'zh_TW' },
  { code:'ja',      dir:'ltr', locale:'ja_JP' },
  { code:'es',      dir:'ltr', locale:'es_ES' },
  { code:'pt-BR',   dir:'ltr', locale:'pt_BR' },
  { code:'fr',      dir:'ltr', locale:'fr_FR' },
  { code:'de',      dir:'ltr', locale:'de_DE' },
  { code:'ru',      dir:'ltr', locale:'ru_RU' },
  { code:'ar',      dir:'rtl', locale:'ar_AR' },
  { code:'hi',      dir:'ltr', locale:'hi_IN' },
  { code:'id',      dir:'ltr', locale:'id_ID' },
  { code:'vi',      dir:'ltr', locale:'vi_VN' },
  { code:'th',      dir:'ltr', locale:'th_TH' },
];

// 한국어(루트) 메타는 직접 지정, 나머지는 i18n 팩에서 로드
const KO = {
  brand:'한눈에 보는 성경 이야기',
  docTitle:'한눈에 보는 성경 이야기 · 창조에서 교회까지',
  kicker:'창조에서 교회까지',
  desc:'스크롤 한 번으로 성경의 큰 줄거리와 예수님이 오신 이유를 만나보세요.',
};
// English 팩은 index.html에 인라인 → 직접 지정
const EN = {
  brand:'Bible in One Scroll',
  docTitle:'Bible in One Scroll · From Creation to the Church',
  kicker:'From Creation to the Church',
  desc:'In a single scroll, discover the Bible’s big story — and why Jesus came.',
};

const FONT_TITLE = {
  'ko':'NanumMyeongjo, serif',
  'ja':'Noto Serif CJK JP, serif',
  'zh-Hans':'Noto Serif CJK SC, serif',
  'zh-Hant':'Noto Serif CJK TC, serif',
  'ar':'Noto Naskh Arabic, serif',
  'hi':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'th':'Noto Serif Thai, Noto Sans Thai, serif',
};
const FONT_SUB = {
  'ko':'NanumGothic, sans-serif',
  'ja':'Noto Sans CJK JP, sans-serif',
  'zh-Hans':'Noto Sans CJK SC, sans-serif',
  'zh-Hant':'Noto Sans CJK TC, sans-serif',
  'ar':'Noto Sans Arabic, sans-serif',
  'hi':'Noto Sans Devanagari, sans-serif',
  'th':'Noto Sans Thai, sans-serif',
};
const DEFAULT_TITLE='Noto Serif, serif', DEFAULT_SUB='Noto Sans, sans-serif';

const xml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const meta = {};
for (const L of LANGS) {
  if (L.code === 'ko') { meta[L.code] = { ...L, ...KO }; continue; }
  if (L.code === 'en') { meta[L.code] = { ...L, ...EN }; continue; }
  const p = JSON.parse(fs.readFileSync(`${root}/i18n/${L.code}.json`, 'utf8'));
  meta[L.code] = {
    ...L,
    brand: p.brand,
    docTitle: p.docTitle || p.brand,
    kicker: (p.s && p.s['hero.kicker']) || '',
    desc: (p.share && p.share.text) || p.docTitle || p.brand,
  };
}

// ---- OG 이미지 생성 ----
function ogSvg(m){
  const ft = FONT_TITLE[m.code] || DEFAULT_TITLE;
  const fs2 = FONT_SUB[m.code] || DEFAULT_SUB;
  const tlen = [...m.brand].length;
  const tsize = tlen>26?44 : tlen>20?52 : tlen>14?60 : 70;
  const ls = ['ar','hi','th'].includes(m.code) ? 0 : 6; // 자모 결합 스크립트는 자간 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="50%" cy="-5%" r="75%"><stop offset="0%" stop-color="#e9b949" stop-opacity="0.20"/><stop offset="60%" stop-color="#e9b949" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="50%" cy="115%" r="70%"><stop offset="0%" stop-color="#9b5de5" stop-opacity="0.22"/><stop offset="60%" stop-color="#9b5de5" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0e1118"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <text x="600" y="180" text-anchor="middle" font-family="${DEFAULT_TITLE}" font-size="64" fill="#e9b949">✝</text>
  <text x="600" y="262" text-anchor="middle" font-family="${fs2}" font-weight="bold" font-size="28" letter-spacing="${ls}" fill="#e9b949">${xml(m.kicker)}</text>
  <text x="600" y="${360+(70-tsize)/2}" text-anchor="middle" font-family="${ft}" font-weight="bold" font-size="${tsize}" fill="#f4efe6">${xml(m.brand)}</text>
  <text x="600" y="560" text-anchor="middle" font-family="${DEFAULT_SUB}" font-size="26" fill="#9aa3b2">one-scroll-bible.com</text>
</svg>`;
}
let imgOK = 0, imgSkip = 0;
function buildImage(m){
  const out = m.code==='ko' ? `${root}/og.png` : `${root}/og-${m.code}.png`;
  const tmp = `/tmp/og-${m.code}.svg`;
  try{
    fs.writeFileSync(tmp, ogSvg(m));
    execSync(`rsvg-convert -w 1200 -h 630 "${tmp}" -o "${out}"`, { stdio:'ignore' });
    imgOK++;
  }catch(e){
    // rsvg-convert/폰트가 없는 환경(예: Vercel 빌드)에서는 건너뛰고 커밋된 이미지를 그대로 사용
    imgSkip++;
  }
  return out.split('/').pop();
}

// ---- hreflang 블록 ----
function hreflangBlock(){
  const lines = LANGS.map(L => {
    const href = L.code==='ko' ? `${ORIGIN}/` : `${ORIGIN}/${L.code}/`;
    return `<link rel="alternate" hreflang="${L.code}" href="${href}" />`;
  });
  lines.push(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />`);
  return lines.join('\n');
}

// ---- 페이지 생성 ----
const src = fs.readFileSync(`${root}/index.html`, 'utf8');
const HREF = hreflangBlock();

function makePage(m){
  const url = `${ORIGIN}/${m.code}/`;
  const img = `${ORIGIN}/og-${m.code}.png`;
  let h = src;
  h = h.replace('<html lang="ko">', `<html lang="${m.code}" dir="${m.dir}">`);
  // base + hreflang + boot 언어를 charset 뒤에 삽입
  h = h.replace('<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n<base href="${ORIGIN}/" />\n<script>window.__BOOTLANG__=${JSON.stringify(m.code)}</script>\n${HREF}`);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${xml(m.docTitle)}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${xml(m.desc)}$2`);
  h = h.replace('<link rel="canonical" href="https://one-scroll-bible.com/" />', `<link rel="canonical" href="${url}" />`);
  h = h.replace('<meta property="og:title" content="한눈에 보는 성경 이야기 · 창조에서 교회까지" />', `<meta property="og:title" content="${xml(m.docTitle)}" />`);
  h = h.replace('<meta property="og:description" content="스크롤 한 번으로 성경의 큰 줄거리와 예수님이 오신 이유를 만나보세요." />', `<meta property="og:description" content="${xml(m.desc)}" />`);
  h = h.replace('<meta property="og:url" content="https://one-scroll-bible.com/" />', `<meta property="og:url" content="${url}" />`);
  h = h.replace('<meta property="og:locale" content="ko_KR" />', `<meta property="og:locale" content="${m.locale}" />`);
  h = h.replace('<meta property="og:image" content="https://one-scroll-bible.com/og.png" />', `<meta property="og:image" content="${img}" />`);
  h = h.replace('<meta property="og:image:alt" content="한눈에 보는 성경 이야기 · 창조에서 교회까지" />', `<meta property="og:image:alt" content="${xml(m.docTitle)}" />`);
  h = h.replace('<meta name="twitter:title" content="한눈에 보는 성경 이야기" />', `<meta name="twitter:title" content="${xml(m.brand)}" />`);
  h = h.replace('<meta name="twitter:description" content="스크롤 한 번으로 성경의 큰 줄거리와 예수님이 오신 이유를 만나보세요." />', `<meta name="twitter:description" content="${xml(m.desc)}" />`);
  h = h.replace('<meta name="twitter:image" content="https://one-scroll-bible.com/og.png" />', `<meta name="twitter:image" content="${img}" />`);
  return h;
}

let generated = [];
for (const L of LANGS) {
  const m = meta[L.code];
  if (L.code === 'ko') { buildImage(m); continue; } // 루트 이미지(og.png)만 갱신
  buildImage(m);
  fs.mkdirSync(`${root}/${L.code}`, { recursive:true });
  fs.writeFileSync(`${root}/${L.code}/index.html`, makePage(m));
  generated.push(L.code);
}

// ---- 루트(index.html)에 hreflang 주입 (없을 때만) ----
let rootHtml = fs.readFileSync(`${root}/index.html`, 'utf8');
if (!rootHtml.includes('hreflang=')) {
  rootHtml = rootHtml.replace('<link rel="canonical" href="https://one-scroll-bible.com/" />',
    `<link rel="canonical" href="${ORIGIN}/" />\n${HREF}`);
  fs.writeFileSync(`${root}/index.html`, rootHtml);
}

// ---- sitemap.xml ----
const today = new Date().toISOString().slice(0,10);
const urls = LANGS.map(L => {
  const loc = L.code==='ko' ? `${ORIGIN}/` : `${ORIGIN}/${L.code}/`;
  return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${L.code==='ko'?'1.0':'0.8'}</priority></url>`;
}).join('\n');
fs.writeFileSync(`${root}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

console.log('생성된 언어 페이지:', generated.join(', '));
console.log('OG 이미지: 생성', imgOK, '· 건너뜀', imgSkip, imgSkip?'(rsvg/폰트 없음 → 커밋된 이미지 사용)':'');
console.log('완료. 총', LANGS.length, '개 언어 (루트=ko + 하위', generated.length, '개)');
