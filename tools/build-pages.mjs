// 언어별 정적 페이지 + 본문 프리렌더 + 구조화데이터(JSON-LD) + OG 이미지 + hreflang + sitemap + llms.txt 생성기
// 사용법: node tools/build-pages.mjs   (rsvg-convert 필요; 없으면 이미지 단계만 건너뜀)
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

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
  { code:'tl',      dir:'ltr', locale:'tl_PH' },
  { code:'ne',      dir:'ltr', locale:'ne_NP' },
  { code:'mn',      dir:'ltr', locale:'mn_MN' },
  { code:'my',     dir:'ltr', locale:'my_MM' },
  { code:'km',     dir:'ltr', locale:'km_KH' },
  { code:'uz',     dir:'ltr', locale:'uz_UZ' },
  { code:'ur',     dir:'rtl', locale:'ur_PK' },
  { code:'bn',     dir:'ltr', locale:'bn_BD' },
  { code:'si',     dir:'ltr', locale:'si_LK' },
  { code:'lo',     dir:'ltr', locale:'lo_LA' },
  { code:'tr',     dir:'ltr', locale:'tr_TR' },
  { code:'sw',     dir:'ltr', locale:'sw_TZ' },
  { code:'fa',     dir:'rtl', locale:'fa_IR' },
  { code:'ta',     dir:'ltr', locale:'ta_IN' },
  { code:'pa',     dir:'ltr', locale:'pa_IN' },
  { code:'te',     dir:'ltr', locale:'te_IN' },
  { code:'ha',     dir:'ltr', locale:'ha_NG' },
  { code:'mr',     dir:'ltr', locale:'mr_IN' },
  { code:'am',     dir:'ltr', locale:'am_ET' },
  { code:'ml',     dir:'ltr', locale:'ml_IN' },
  { code:'ig',     dir:'ltr', locale:'ig_NG' },
  { code:'yo',     dir:'ltr', locale:'yo_NG' },
  { code:'gu',     dir:'ltr', locale:'gu_IN' },
  { code:'or',     dir:'ltr', locale:'or_IN' },
  { code:'kn',     dir:'ltr', locale:'kn_IN' },
  { code:'jv',     dir:'ltr', locale:'jv_ID' },
  { code:'su',     dir:'ltr', locale:'su_ID' },
  { code:'zu',     dir:'ltr', locale:'zu_ZA' },
  { code:'sd',     dir:'rtl', locale:'sd_PK' },
  { code:'ckb',    dir:'rtl', locale:'ckb_IQ' },
  { code:'so',     dir:'ltr', locale:'so_SO' },
  { code:'rw',     dir:'ltr', locale:'rw_RW' },
  { code:'ny',     dir:'ltr', locale:'ny_MW' },
  { code:'sn',     dir:'ltr', locale:'sn_ZW' },
  { code:'tg',     dir:'ltr', locale:'tg_TJ' },
  { code:'om',     dir:'ltr', locale:'om_ET' },
  { code:'ceb',    dir:'ltr', locale:'ceb_PH' },
  { code:'az',     dir:'ltr', locale:'az_AZ' },
  { code:'kk',     dir:'ltr', locale:'kk_KZ' },
  { code:'ti',     dir:'ltr', locale:'ti_ET' },
  { code:'xh',     dir:'ltr', locale:'xh_ZA' },
  { code:'af',     dir:'ltr', locale:'af_ZA' },
  { code:'ln',     dir:'ltr', locale:'ln_CD' },
  { code:'lg',     dir:'ltr', locale:'lg_UG' },
  { code:'ak',     dir:'ltr', locale:'ak_GH' },
  { code:'hil',    dir:'ltr', locale:'hil_PH' },
  { code:'luo',    dir:'ltr', locale:'luo_KE' },
  { code:'bem',    dir:'ltr', locale:'bem_ZM' },
  { code:'ilo',    dir:'ltr', locale:'ilo_PH' },
  { code:'ki',     dir:'ltr', locale:'ki_KE' },
  { code:'as',     dir:'ltr', locale:'as_IN' },
  { code:'tn',     dir:'ltr', locale:'tn_ZA' },
  { code:'war',    dir:'ltr', locale:'war_PH' },
  { code:'bcl',    dir:'ltr', locale:'bcl_PH' },
  { code:'rn',     dir:'ltr', locale:'rn_BI' },
  { code:'it',     dir:'ltr', locale:'it_IT' },
  { code:'pl',     dir:'ltr', locale:'pl_PL' },
  { code:'uk',     dir:'ltr', locale:'uk_UA' },
  { code:'ro',     dir:'ltr', locale:'ro_RO' },
  { code:'nl',     dir:'ltr', locale:'nl_NL' },
  { code:'el',     dir:'ltr', locale:'el_GR' },
  { code:'hu',     dir:'ltr', locale:'hu_HU' },
  { code:'cs',     dir:'ltr', locale:'cs_CZ' },
  { code:'sv',     dir:'ltr', locale:'sv_SE' },
  { code:'hy',     dir:'ltr', locale:'hy_AM' },
  { code:'ka',     dir:'ltr', locale:'ka_GE' },
  { code:'he',     dir:'rtl', locale:'he_IL' },
  { code:'ht',     dir:'ltr', locale:'ht_HT' },
  { code:'sm',     dir:'ltr', locale:'sm_WS' },
  { code:'to',     dir:'ltr', locale:'to_TO' },
  { code:'fj',     dir:'ltr', locale:'fj_FJ' },
  { code:'qu',     dir:'ltr', locale:'qu_PE' },
  { code:'bg',     dir:'ltr', locale:'bg_BG' },
  { code:'sr',     dir:'ltr', locale:'sr_RS' },
  { code:'da',     dir:'ltr', locale:'da_DK' },
  { code:'fi',     dir:'ltr', locale:'fi_FI' },
  { code:'st',     dir:'ltr', locale:'st_LS' },
  { code:'nso',    dir:'ltr', locale:'nso_ZA' },
  { code:'hr',     dir:'ltr', locale:'hr_HR' },
  { code:'sk',     dir:'ltr', locale:'sk_SK' },
  { code:'sl',     dir:'ltr', locale:'sl_SI' },
  { code:'no',     dir:'ltr', locale:'nb_NO' },
  { code:'lt',     dir:'ltr', locale:'lt_LT' },
  { code:'lv',     dir:'ltr', locale:'lv_LV' },
  { code:'mi',     dir:'ltr', locale:'mi_NZ' },
  { code:'tpi',    dir:'ltr', locale:'tpi_PG' },
  { code:'ts',     dir:'ltr', locale:'ts_ZA' },
  { code:'ee',     dir:'ltr', locale:'ee_GH' },
  { code:'gn',     dir:'ltr', locale:'gn_PY' },
  { code:'sat',    dir:'ltr', locale:'sat_IN' },
  { code:'tk',     dir:'ltr', locale:'tk_TM' },
  { code:'tt',     dir:'ltr', locale:'tt_RU' },
  { code:'sq',     dir:'ltr', locale:'sq_AL' },
  { code:'mk',     dir:'ltr', locale:'mk_MK' },
  { code:'cy',     dir:'ltr', locale:'cy_GB' },
  { code:'wo',     dir:'ltr', locale:'wo_SN' },
  { code:'mos',    dir:'ltr', locale:'mos_BF' },
  { code:'nd',     dir:'ltr', locale:'nd_ZW' },
  { code:'ay',     dir:'ltr', locale:'ay_BO' },
  { code:'quc',    dir:'ltr', locale:'quc_GT' },
  { code:'pam',    dir:'ltr', locale:'pam_PH' },
  { code:'pag',    dir:'ltr', locale:'pag_PH' },
  { code:'bi',     dir:'ltr', locale:'bi_VU' },
  { code:'ug',     dir:'rtl', locale:'ug_CN' },
  { code:'lua',    dir:'ltr', locale:'lua_CD' },
  { code:'umb',    dir:'ltr', locale:'umb_AO' },
  { code:'sg',     dir:'ltr', locale:'sg_CF' },
  { code:'be',     dir:'ltr', locale:'be_BY' },
  { code:'mad',    dir:'ltr', locale:'mad_ID' },
  { code:'kab',    dir:'ltr', locale:'kab_DZ' },
  { code:'tum',    dir:'ltr', locale:'tum_MW' },
  { code:'ff',     dir:'ltr', locale:'ff_NG' },
  { code:'mww',    dir:'ltr', locale:'mww_CN' },
  { code:'kmr',    dir:'ltr', locale:'kmr_TR' },
  { code:'mg',     dir:'ltr', locale:'mg_MG' },
  { code:'ky',     dir:'ltr', locale:'ky_KG' },
  { code:'ps',     dir:'rtl', locale:'ps_AF' },
  { code:'bo',     dir:'ltr', locale:'bo_CN' },
  { code:'dwr',    dir:'ltr', locale:'dwr_ET' },
  { code:'bho',    dir:'ltr', locale:'bho_IN' },
  { code:'ctg',    dir:'ltr', locale:'ctg_BD' },
  { code:'bal',    dir:'rtl', locale:'bal_PK' },
  { code:'mag',    dir:'ltr', locale:'mag_IN' },
  { code:'chk',    dir:'ltr', locale:'chk_FM' },
  { code:'lus',    dir:'ltr', locale:'lus_IN' },
  { code:'haz',    dir:'rtl', locale:'haz_AF' },
  { code:'pcm',    dir:'ltr', locale:'pcm_NG' },
  { code:'pnb',    dir:'rtl', locale:'pnb_PK' },
  { code:'arz',    dir:'rtl', locale:'arz_EG' },
  { code:'yue',    dir:'ltr', locale:'yue_HK' },
  { code:'mai',    dir:'ltr', locale:'mai_IN' },
  { code:'awa',    dir:'ltr', locale:'awa_IN' },
  { code:'skr',    dir:'rtl', locale:'skr_PK' },
  { code:'raj',    dir:'ltr', locale:'raj_IN' },
  { code:'hne',    dir:'ltr', locale:'hne_IN' },
  { code:'syl',    dir:'ltr', locale:'syl_BD' },
  { code:'bgc',    dir:'ltr', locale:'bgc_IN' },
  { code:'suk',    dir:'ltr', locale:'suk' },
  { code:'ary',    dir:'rtl', locale:'ary_MA' },
  { code:'dyu',    dir:'ltr', locale:'dyu_CI' },
  { code:'dcc',    dir:'rtl', locale:'dcc_IN' },
  { code:'kg',    dir:'ltr', locale:'kg_CD' },
  { code:'ks',    dir:'rtl', locale:'ks_IN' },
  { code:'gom',    dir:'ltr', locale:'gom_IN' },
  { code:'min',    dir:'ltr', locale:'min_ID' },
  { code:'bug',    dir:'ltr', locale:'bug_ID' },
  { code:'bjn',    dir:'ltr', locale:'bjn_ID' },
  { code:'mni',    dir:'ltr', locale:'mni_IN' },
];

// 한국어(루트) 메타는 직접 지정, 나머지는 i18n 팩에서 로드
const KO = {
  brand:'한눈에 보는 성경 이야기',
  docTitle:'한눈에 보는 성경 이야기 · 창조에서 교회까지',
  kicker:'창조에서 교회까지',
  desc:'스크롤 한 번으로 성경의 큰 줄거리와 예수님이 오신 이유를 만나보세요.',
  keywords:'성경 요약, 성경 한눈에, 성경 줄거리, 성경 통독, 성경 전체 흐름, 성경 개요, 복음, 복음 제시, 구속사, 창조 타락 구속 회복, 예수님, 예수님은 누구인가, 구원의 길, 영접 기도, 기독교 입문, 성경 입문, 성경 공부',
};
// English 팩은 index.html에 인라인 → 직접 지정
const EN = {
  brand:'Bible in One Scroll',
  docTitle:'Bible in One Scroll · From Creation to the Church',
  kicker:'From Creation to the Church',
  desc:'In a single scroll, discover the Bible’s big story — and why Jesus came.',
  keywords:'Bible summary, whole Bible overview, Bible storyline, Bible in one scroll, gospel, gospel message, redemptive history, creation fall redemption restoration, who is Jesus, how to be saved, plan of salvation, Bible for beginners, Bible study, Christianity basics',
};

const FONT_TITLE = {
  'ko':'NanumMyeongjo, serif',
  'ja':'Noto Serif CJK JP, serif',
  'zh-Hans':'Noto Serif CJK SC, serif',
  'zh-Hant':'Noto Serif CJK TC, serif',
  'ar':'Noto Naskh Arabic, serif',
  'hi':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'ctg':'Noto Serif Bengali, Noto Sans Bengali, serif',
  'bho':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'mag':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'bo':'Noto Serif Tibetan, Noto Sans Tibetan, serif',
  'ug':'Noto Naskh Arabic, serif',
  'he':'Noto Serif Hebrew, serif',
  'ka':'Noto Serif Georgian, serif',
  'hy':'Noto Serif Armenian, serif',
  'as':'Noto Serif Bengali, serif',
  'ti':'Noto Serif Ethiopic, serif',
  'ckb':'Noto Naskh Arabic, serif',
  'sd':'Noto Naskh Arabic, serif',
  'kn':'Noto Serif Kannada, serif',
  'or':'Noto Sans Oriya, serif',
  'gu':'Noto Serif Gujarati, serif',
  'ml':'Noto Serif Malayalam, serif',
  'am':'Noto Serif Ethiopic, serif',
  'mr':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'te':'Noto Serif Telugu, serif',
  'pa':'Noto Serif Gurmukhi, serif',
  'ta':'Noto Serif Tamil, serif',
  'fa':'Noto Naskh Arabic, serif',
  'bal':'Noto Naskh Arabic, serif',
  'haz':'Noto Naskh Arabic, serif',
  'ary':'Noto Naskh Arabic, serif',
  'dcc':'Noto Naskh Arabic, serif',
  'ks':'Noto Naskh Arabic, serif',
  'pnb':'Noto Naskh Arabic, serif',
  'arz':'Noto Naskh Arabic, serif',
  'skr':'Noto Naskh Arabic, serif',
  'yue':'Noto Serif CJK TC, serif',
  'mai':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'awa':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'raj':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'hne':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'bgc':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'syl':'Noto Serif Bengali, serif',
  'lo':'Noto Serif Lao, serif',
  'si':'Noto Serif Sinhala, serif',
  'bn':'Noto Serif Bengali, serif',
  'ur':'Noto Nastaliq Urdu, serif',
  'km':'Noto Serif Khmer, serif',
  'my':'Noto Serif Myanmar, serif',
  'ne':'Noto Serif Devanagari, Noto Sans Devanagari, serif',
  'th':'Noto Serif Thai, Noto Sans Thai, serif',
};
const FONT_SUB = {
  'ko':'NanumGothic, sans-serif',
  'ja':'Noto Sans CJK JP, sans-serif',
  'zh-Hans':'Noto Sans CJK SC, sans-serif',
  'zh-Hant':'Noto Sans CJK TC, sans-serif',
  'ar':'Noto Sans Arabic, sans-serif',
  'hi':'Noto Sans Devanagari, sans-serif',
  'ctg':'Noto Sans Bengali, sans-serif',
  'bho':'Noto Sans Devanagari, sans-serif',
  'mag':'Noto Sans Devanagari, sans-serif',
  'bo':'Noto Sans Tibetan, sans-serif',
  'ug':'Noto Sans Arabic, sans-serif',
  'he':'Noto Sans Hebrew, sans-serif',
  'ka':'Noto Sans Georgian, sans-serif',
  'hy':'Noto Sans Armenian, sans-serif',
  'as':'Noto Sans Bengali, sans-serif',
  'ti':'Noto Sans Ethiopic, sans-serif',
  'ckb':'Noto Sans Arabic, sans-serif',
  'sd':'Noto Sans Arabic, sans-serif',
  'kn':'Noto Sans Kannada, sans-serif',
  'or':'Noto Sans Oriya, sans-serif',
  'gu':'Noto Sans Gujarati, sans-serif',
  'ml':'Noto Sans Malayalam, sans-serif',
  'am':'Noto Sans Ethiopic, sans-serif',
  'mr':'Noto Sans Devanagari, sans-serif',
  'te':'Noto Sans Telugu, sans-serif',
  'pa':'Noto Sans Gurmukhi, sans-serif',
  'ta':'Noto Sans Tamil, sans-serif',
  'fa':'Noto Sans Arabic, sans-serif',
  'bal':'Noto Sans Arabic, sans-serif',
  'haz':'Noto Sans Arabic, sans-serif',
  'ary':'Noto Sans Arabic, sans-serif',
  'dcc':'Noto Sans Arabic, sans-serif',
  'ks':'Noto Sans Arabic, sans-serif',
  'pnb':'Noto Sans Arabic, sans-serif',
  'arz':'Noto Sans Arabic, sans-serif',
  'skr':'Noto Sans Arabic, sans-serif',
  'yue':'Noto Sans CJK TC, sans-serif',
  'mai':'Noto Sans Devanagari, sans-serif',
  'awa':'Noto Sans Devanagari, sans-serif',
  'raj':'Noto Sans Devanagari, sans-serif',
  'hne':'Noto Sans Devanagari, sans-serif',
  'bgc':'Noto Sans Devanagari, sans-serif',
  'syl':'Noto Sans Bengali, sans-serif',
  'lo':'Noto Sans Lao, sans-serif',
  'si':'Noto Sans Sinhala, sans-serif',
  'bn':'Noto Sans Bengali, sans-serif',
  'ur':'Noto Naskh Arabic, sans-serif',
  'km':'Noto Sans Khmer, sans-serif',
  'my':'Noto Sans Myanmar, sans-serif',
  'ne':'Noto Sans Devanagari, sans-serif',
  'th':'Noto Sans Thai, sans-serif',
};
const DEFAULT_TITLE='Noto Serif, serif', DEFAULT_SUB='Noto Sans, sans-serif';

const xml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ---- 원본 읽기 + 인라인 데이터(EPOCHS/CORE/EN_PACK) 추출 ----
const src = fs.readFileSync(`${root}/index.html`, 'utf8');
let EPOCHS, CORE, EN_PACK;
(function extractInlineData(){
  const a = src.indexOf('const EPOCHS=[');
  const b = src.indexOf('function hasLang');
  if (a < 0 || b < 0) throw new Error('build-pages: 인라인 데이터 마커(EPOCHS/hasLang)를 찾지 못함 — index.html 구조 변경 확인');
  const dataSrc = src.slice(a, b)
    .replace("const coreWrap=document.getElementById('core');", '')
    .replace("const main=document.getElementById('epochs');", '');
  ({ EPOCHS, CORE, EN_PACK } = new Function(dataSrc + '\nreturn {EPOCHS,CORE,EN_PACK};')());
})();

// ---- 언어 팩 로드 (en=인라인, 13개=JSON) ----
const JSON_PACKS = {};
for (const L of LANGS) {
  if (L.code === 'ko' || L.code === 'en') continue;
  JSON_PACKS[L.code] = JSON.parse(fs.readFileSync(`${root}/i18n/${L.code}.json`, 'utf8'));
}
const packFor = code => code === 'en' ? EN_PACK : JSON_PACKS[code];

const meta = {};
for (const L of LANGS) {
  if (L.code === 'ko') { meta[L.code] = { ...L, ...KO }; continue; }
  if (L.code === 'en') { meta[L.code] = { ...L, ...EN }; continue; }
  const p = JSON_PACKS[L.code];
  meta[L.code] = {
    ...L,
    brand: p.brand,
    docTitle: p.docTitle || p.brand,
    kicker: (p.s && p.s['hero.kicker']) || '',
    desc: (p.share && p.share.text) || p.docTitle || p.brand,
  };
}

// ---- DOM 헬퍼(의존성 없이 균형 태그 기반 innerHTML 치환/추출) ----
function findClose(html, openEnd, tag){
  const re = new RegExp('<'+tag+'\\b|</'+tag+'>','g');
  re.lastIndex = openEnd + 1;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index; }
    else depth++;
  }
  return -1;
}
function nodeAt(html, key){
  const mk = html.indexOf('data-i18n="'+key+'"');
  if (mk < 0) return null;
  const ts = html.lastIndexOf('<', mk);
  const tag = (html.slice(ts+1).match(/^[a-zA-Z0-9]+/) || [''])[0];
  if (!tag) return null;
  const openEnd = html.indexOf('>', mk);
  if (openEnd < 0) return null;
  const close = findClose(html, openEnd, tag);
  if (close < 0) return null;
  return { openEnd, close };
}
function setInner(html, key, inner){
  const n = nodeAt(html, key);
  if (!n) return html;
  return html.slice(0, n.openEnd+1) + inner + html.slice(n.close);
}
function getInner(html, key){
  const n = nodeAt(html, key);
  return n ? html.slice(n.openEnd+1, n.close) : '';
}

// ---- OBS 모드(성경 번역본 없는 언어: Open Bible Stories 콘텐츠) ----
// index.html 의 EP_OBS 와 동일해야 함(13시대 ↔ 대표 OBS 스토리).
const EP_OBS = [1,2,4,12,16,17,18,20,20,21,23,43,50];
const obsRepoOf = pack => (pack && typeof pack.yv === 'string' && pack.yv.indexOf('obs:') === 0) ? pack.yv.slice(4) : null;
const obsUrl = (repo, story) => `https://door43.org/u/${repo}/master/${('0'+story).slice(-2)}.html`;

// ---- 본문 프리렌더 (런타임 renderEpochs/renderCore와 동일 구조) ----
function epochsHtml(pack){
  const u = pack.ui, ver = u.version ? (' '+u.version) : '';
  const repo = obsRepoOf(pack);
  return pack.epochs.map((e,i)=>{
    const v = EPOCHS[i], mis = pack.mis[i];
    const misHtml = mis ? `<div class="myth"><div class="m-row"><span class="m-tag wrong">${u.mythWrong}</span><p>${mis.w}</p></div><div class="m-row"><span class="m-tag right">${u.mythRight}</span><p>${mis.t}</p></div></div>` : '';
    const cite = e.cite ? (repo ? `<a class="vlink" href="${obsUrl(repo,EP_OBS[i])}" target="_blank" rel="noopener">${e.cite}</a>` : e.cite+ver) : '';
    return `<section class="epoch" id="s${i+1}" data-sc="${i+1}" data-title="${esc(e.title)}" data-label="${esc(e.title)}" style="--c1:${v.c1};--c2:${v.c2}"><div class="glow"></div><div class="wrap"><div class="ep-inner"><div class="txt"><div class="ep-icon">${v.emoji}</div><div class="badge"><span class="num">${i+1}</span><span class="tag">${e.tag}</span><span class="date">${e.date}</span><button class="ep-share" data-sc="${i+1}" aria-label="Share" title="Share">↗</button></div><h2>${e.title}</h2><div class="oneline">${e.one}</div><div class="meta"><div class="meta-row"><span class="k">${u.people}</span><p class="vv">${e.people}</p></div><div class="meta-row"><span class="k">${u.events}</span><p class="vv">${e.events}</p></div></div><div class="verse"><div class="q">${e.q}</div><div class="cite">${cite}</div></div><div class="thread-line"><p class="note-h"><span class="note-i">🧵</span><b>${u.christLabel}</b></p><p class="note-b">${e.christ}</p></div><div class="love-note"><p class="note-h"><span class="note-i">💛</span><b>${u.loveLabel}</b></p><p class="note-b">${pack.love[i]}</p></div>${misHtml}<details class="more"><summary><span class="arr">▸</span> ${u.more}</summary><div class="body">${e.detail}</div></details><div class="next">${e.next}</div></div></div></div></section>`;
  }).join('');
}
function coreHtml(pack){
  const ver = pack.ui.version ? (' '+pack.ui.version) : '';
  return pack.core.map((c,idx)=>`<div class="core reveal"><div class="ic">${CORE[idx].ic}</div><h3>${c.title}</h3><p>${c.body}</p>${c.vtext?`<div class="v">“<em>${c.vtext}</em>” — ${c.vref}${ver}</div>`:''}</div>`).join('');
}
// OBS 출처/라이선스 배너(정적 baking — no-JS·크롤러도 CC BY-SA 출처표시 보이게)
function obsBannerHtml(pack){
  const repo = obsRepoOf(pack); if (!repo) return null;
  const v = (pack.s && (pack.s['bridge.note'] || pack.s['partial.note'])) || '';
  if (!v) return null;
  return `${v} <a href="${obsUrl(repo,1)}" target="_blank" rel="noopener">Open Bible Stories</a> · © unfoldingWord · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>`;
}

// ---- 구조화 데이터(JSON-LD): WebSite + FAQPage ----
const stripTags = s => String(s).replace(/<[^>]+>/g,' ');
const decodeEnt = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');
const cleanText = s => decodeEnt(stripTags(String(s))).replace(/[▸►]/g,'').replace(/\s+/g,' ').trim();
function faqLd(s){
  const pairs = [['faq.q1','faq.a1'],['faq.q2','faq.a2'],['faq.q3','faq.a3'],['faq.q4','faq.a4']];
  const main = pairs.filter(([q,a])=>s&&s[q]&&s[a]).map(([q,a])=>({
    '@type':'Question', name: cleanText(s[q]),
    acceptedAnswer:{ '@type':'Answer', text: cleanText(s[a]) }
  }));
  return { '@type':'FAQPage', mainEntity: main };
}
function ldBlock({ name, desc, url, code, s }){
  const site = { '@type':'WebSite', name, url, inLanguage: code, description: desc };
  const graph = s && faqLd(s).mainEntity.length ? [site, faqLd(s)] : [site];
  return '<script type="application/ld+json">\n' + JSON.stringify({ '@context':'https://schema.org', '@graph': graph }) + '\n</script>';
}

// ---- OG 이미지 생성 (단일 공용·언어 중립: 십자가 도형 + 도메인만) ----
// 언어별 og-<code>.png 는 생성/커밋하지 않음(git 비대화 방지). 어느 언어에도 안 어긋나게 1장만.
// 십자가는 폰트 의존 없이 도형(rect)으로, 텍스트는 도메인(라틴)만 → 어떤 빌드 환경에서도 동일.
function neutralOgSvg(){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="50%" cy="-5%" r="75%"><stop offset="0%" stop-color="#e9b949" stop-opacity="0.20"/><stop offset="60%" stop-color="#e9b949" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="50%" cy="115%" r="70%"><stop offset="0%" stop-color="#9b5de5" stop-opacity="0.22"/><stop offset="60%" stop-color="#9b5de5" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0e1118"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <g fill="#e9b949">
    <rect x="585" y="170" width="30" height="200" rx="6"/>
    <rect x="538" y="226" width="124" height="30" rx="6"/>
  </g>
  <text x="600" y="460" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="48" fill="#f4efe6">one-scroll-bible.com</text>
</svg>`;
}
let imgOK = 0, imgSkip = 0;
function buildSharedOG(){
  const out = `${root}/og.png`;
  const tmp = `/tmp/og-shared.svg`;
  try{
    fs.writeFileSync(tmp, neutralOgSvg());
    execSync(`rsvg-convert -w 1200 -h 630 "${tmp}" -o "${out}"`, { stdio:'ignore' });
    imgOK++;
  }catch(e){
    // rsvg-convert/폰트 없는 환경(Vercel·Windows)에서는 건너뛰고 커밋된 og.png 사용
    imgSkip++;
  }
}
// PWA 아이콘 (다크 배경 + 금색 십자가). rsvg 없으면 커밋된 PNG 사용.
function buildIcons(){
  const svg = size => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0e1118"/><text x="256" y="368" text-anchor="middle" font-family="${DEFAULT_TITLE}" font-size="300" fill="#e9b949">✝</text></svg>`;
  for (const [name,size] of [['icon-512.png',512],['icon-192.png',192]]) {
    try{ const tmp = `/tmp/${name}.svg`; fs.writeFileSync(tmp, svg(size)); execSync(`rsvg-convert -w ${size} -h ${size} "${tmp}" -o "${root}/${name}"`, { stdio:'ignore' }); imgOK++; }
    catch(e){ imgSkip++; }
  }
}
// ---- QR 코드(언어별) 보강 — 빠진 qr-<code>.png 만 생성 ----
// og/icon(rsvg+폰트 필요)과 달리 qrcode 는 순수 JS devDependency라 Vercel 기본 npm install 로도 사용 가능.
// 누락분만 생성(기존 커밋 PNG 는 건드리지 않음). qrcode 없거나 실패해도 **빌드는 절대 막지 않음**(경고만).
let qrMade = 0, qrHave = 0;
const qrMissing = [];
async function buildMissingQRs(){
  for (const L of LANGS) {
    if (fs.existsSync(`${root}/qr-${L.code}.png`)) { qrHave++; continue; }
    qrMissing.push(L.code);
  }
  if (!qrMissing.length) return;            // 전부 보유 → 할 일 없음
  let QR = null;                            // qrcode 로드(여러 경로 시도; make-qr 와 동일)
  for (const base of ['qrcode', '/tmp/qrgen/node_modules/qrcode', `${root}/node_modules/qrcode`]) {
    try { QR = require(base); break; } catch {}
  }
  if (!QR) return;                          // qrcode 미설치 → 경고만(아래 요약), 빌드 비차단
  for (const code of qrMissing.slice()) {
    try {
      await new Promise((res, rej) => QR.toFile(`${root}/qr-${code}.png`, `${ORIGIN}/${code}/`,
        { margin: 2, width: 600, color: { dark: '#0e1118', light: '#ffffff' } }, e => e ? rej(e) : res()));
      qrMade++; qrMissing.splice(qrMissing.indexOf(code), 1);
    } catch {}
  }
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
const HREF = hreflangBlock();

// ---- 페이지 생성 ----
function makePage(m){
  const url = `${ORIGIN}/${m.code}/`;
  const img = OG_URL; // 단일 공용 OG(언어 무관) + ?v=해시 캐시버스팅. 언어별 제목/설명은 meta 태그로 처리.
  let h = src;
  h = h.replace('<html lang="ko">', `<html lang="${m.code}" dir="${m.dir}">`);
  // 템플릿의 기존 hreflang 제거(중복 방지) — 아래에서 한 벌만 다시 주입
  h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  // 언어별 keywords (맵에 없으면 한국어 잔존 대신 제거)
  if (m.keywords) {
    h = h.replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${xml(m.keywords)}$2`);
  } else {
    h = h.replace(/[ \t]*<meta name="keywords"[^>]*>\n?/, '');
  }
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

  // ---- 본문 프리렌더 (JS 없이도 현지어 본문 노출 → 검색/AI 크롤러 대응) ----
  const pack = packFor(m.code);
  if (pack) {
    if (pack.s) for (const k of Object.keys(pack.s)) h = setInner(h, k, pack.s[k]);
    // q4 FAQ(성경이 실화인가?)는 번역된 언어에서만 노출 — 미번역 언어는 한국어 잔존 방지 위해 본문 비우고 숨김
    if (!(pack.s && pack.s['faq.q4'])) {
      h = setInner(h, 'faq.q4', '');
      h = setInner(h, 'faq.a4', '');
      h = h.replace('<details class="faq-item" id="faqQ4">', '<details class="faq-item" id="faqQ4" hidden>');
    }
    h = h.replace('<main id="epochs"></main>', `<main id="epochs">${epochsHtml(pack)}</main>`);
    h = h.replace('<div class="core-grid" id="core"></div>', `<div class="core-grid" id="core">${coreHtml(pack)}</div>`);
    const obsBanner = obsBannerHtml(pack);
    if (obsBanner) h = h.replace('<div class="partial-note" id="partialNote" hidden></div>', `<div class="partial-note" id="partialNote">${obsBanner}</div>`);
    h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      ldBlock({ name: pack.brand, desc: (pack.share && pack.share.text) || m.desc, url, code: m.code, s: pack.s }));
  }
  return h;
}

buildIcons();
buildSharedOG();
try { await buildMissingQRs(); } catch (e) { console.log('QR 보강 건너뜀:', e.message); }
// OG 이미지 캐시 버스팅: og.png 내용 해시를 og:image URL 에 ?v= 로 부착.
// (og.png 는 immutable·1년 캐시 + 고정 파일명이라, 내용이 바뀌어도 URL 이 같으면 카톡·텔레그램·
//  브라우저가 옛 이미지를 계속 씀 → 해시로 URL 을 바꿔 강제 갱신. og.png 생성 후 계산해야 일치.)
const OG_VER = (()=>{ try { return crypto.createHash('sha1').update(fs.readFileSync(`${root}/og.png`)).digest('hex').slice(0,8); } catch { return ''; } })();
const OG_URL = `${ORIGIN}/og.png${OG_VER ? `?v=${OG_VER}` : ''}`;
let generated = [];
for (const L of LANGS) {
  if (L.code === 'ko') continue; // ko는 루트(index.html)
  const m = meta[L.code];
  fs.mkdirSync(`${root}/${L.code}`, { recursive:true });
  fs.writeFileSync(`${root}/${L.code}/index.html`, makePage(m));
  generated.push(L.code);
}

// ---- 루트(index.html): hreflang(없을 때만) + JSON-LD(WebSite+FAQPage, 결정적 치환) ----
let rootHtml = src;
if (!rootHtml.includes('hreflang=')) {
  rootHtml = rootHtml.replace('<link rel="canonical" href="https://one-scroll-bible.com/" />',
    `<link rel="canonical" href="${ORIGIN}/" />\n${HREF}`);
}
const koS = {}; for (const k of ['faq.q1','faq.a1','faq.q2','faq.a2','faq.q3','faq.a3','faq.q4','faq.a4']) koS[k] = getInner(src, k);
rootHtml = rootHtml.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  ldBlock({ name: KO.brand, desc: KO.desc, url: `${ORIGIN}/`, code: 'ko', s: koS }));
// 루트 og:image/twitter:image 도 버전(?v=) 부착 — 캐시 버스팅
rootHtml = rootHtml.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${OG_URL}$2`);
rootHtml = rootHtml.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${OG_URL}$2`);
// 지원 언어 수는 LANGS.length 에서 자동 도출 — 메타 설명의 하드코딩 카운트 수동관리 제거
rootHtml = rootHtml.replace(/\d+개 언어 지원/, `${LANGS.length}개 언어 지원`);
if (rootHtml !== src) fs.writeFileSync(`${root}/index.html`, rootHtml);

// ---- sitemap.xml ----
const today = new Date().toISOString().slice(0,10);
const urls = LANGS.map(L => {
  const loc = L.code==='ko' ? `${ORIGIN}/` : `${ORIGIN}/${L.code}/`;
  return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${L.code==='ko'?'1.0':'0.8'}</priority></url>`;
}).join('\n');
fs.writeFileSync(`${root}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

// ---- llms.txt (LLM/AI 엔진용 사이트 요약) ----
const llms = `# Bible in One Scroll — 한눈에 보는 성경 이야기

> ${EN.desc}
> ${KO.desc}

The whole Bible told as one scrollable, mobile-friendly page: Creation → Fall → Patriarchs → Exodus → Conquest/Judges → United Kingdom → Divided Kingdom → Exile → Return → Silent Years → Jesus → The Church → Restoration (Second Coming) — leading to the gospel and a prayer to receive Christ. Perspective: the evangelical · Reformed redemptive-historical view shared by most of the Korean Protestant church. Scripture is quoted from each language's representative translation. Available in ${LANGS.length} languages.

Home: ${ORIGIN}/

## Language pages
${LANGS.map(L=>`- ${L.code}: ${L.code==='ko'?ORIGIN+'/':ORIGIN+'/'+L.code+'/'}`).join('\n')}

## Resources
- Sitemap: ${ORIGIN}/sitemap.xml

## Contact
- num2323studio@gmail.com
`;
fs.writeFileSync(`${root}/llms.txt`, llms);

// ---- i18n/en.json (기여자용 영어 템플릿/레퍼런스 — en 페이지는 인라인 EN_PACK 사용, 이 파일은 번역 출발점) ----
try {
  const P = EN_PACK;
  const en = { menuName: P.menuName, htmlLang: 'en', dir: P.dir, brand: P.brand, docTitle: P.docTitle,
    share: P.share, ui: P.ui, labels: P.labels, s: P.s, epochs: P.epochs, love: P.love, mis: P.mis, core: P.core };
  fs.writeFileSync(`${root}/i18n/en.json`, JSON.stringify(en, null, 1));
} catch (e) { console.log('i18n/en.json 생성 건너뜀:', e.message); }

// ---- 서비스워커 캐시 버전 스탬프 ----
// 앱 셸(index.html) 해시로 CACHE 이름을 갱신 → 셸 변경 시 SW 가 옛 캐시 자동 폐기.
// (i18n 본문은 sw.js 에서 network-first 라 별도 무효화 불필요)
try {
  const swPath = `${root}/sw.js`;
  const sw = fs.readFileSync(swPath, 'utf8');
  const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 8);
  const stamped = sw.replace(/const CACHE = '[^']*';/, `const CACHE = 'osb-${hash}';`);
  if (stamped !== sw) { fs.writeFileSync(swPath, stamped); console.log('sw.js CACHE =', 'osb-' + hash); }
} catch (e) { console.log('sw.js 스탬프 건너뜀:', e.message); }

console.log('생성된 언어 페이지:', generated.join(', '));
console.log('QR 코드: 생성', qrMade, '· 보유', qrHave, qrMissing.length?`· ⚠ 누락(qrcode 미설치로 생성불가): ${qrMissing.join(', ')} → repo 루트에서 'npm install' 후 재빌드`:'· 누락 없음');
console.log('OG 이미지: 생성', imgOK, '· 건너뜀', imgSkip, imgSkip?'(rsvg/폰트 없음 → 커밋된 이미지 사용)':'');
console.log('완료. 총', LANGS.length, '개 언어 (루트=ko + 하위', generated.length, '개) · 본문 프리렌더 + JSON-LD + llms.txt');
