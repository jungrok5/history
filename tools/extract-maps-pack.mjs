// One-off: extract maps inline T (UI) + maps/data.json (places/labels/journeys, ko/en)
// into i18n/maps/<ko|en>.json — translation template (en) + reference (ko).
// data.json stays the language-neutral geometry source (lat/lon/usfms/stops/color);
// all human text moves into the pack, keyed per segment.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'maps/index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'maps/data.json'), 'utf8'));

function sliceObj(src, marker) {
  const i = src.indexOf(marker); const o = src.indexOf('{', i);
  let d = 0, j = o;
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) { j++; break; } } }
  return Function('"use strict";return (' + src.slice(o, j) + ')')();
}
const T = sliceObj(html, 'const T = {');

const META = {
  ko: { menuName: '한국어', htmlLang: 'ko', dir: 'ltr', locale: 'ko-KR', brand: '한눈에 보는 성경 이야기',
        docTitle: '지도로 보는 성경 · 한눈에 보는 성경 이야기',
        metaDesc: '구약의 시간 흐름, 예수님의 행적, 바울의 전도여행을 실제 지도 위에 따라가 봅니다 — 성경은 실제 땅에서 일어난 이야기입니다.' },
  en: { menuName: 'English', htmlLang: 'en', dir: 'ltr', locale: 'en-US', brand: 'Bible in One Scroll',
        docTitle: 'Bible by Map · Bible in One Scroll',
        metaDesc: 'Trace the Old Testament timeline, the life of Jesus, and Paul’s journeys on a real map — the Bible happened in real places.' },
};
const SEGS = ['ot', 'jesus', 'paul'];

for (const lang of ['ko', 'en']) {
  const s = {};
  for (const k in T) if (T[k] && T[k][lang] != null) s[k] = T[k][lang];
  const pack = { ...META[lang], s };
  for (const seg of SEGS) {
    const sg = data[seg]; if (!sg) continue;
    const places = {};
    for (const pl of sg.places || []) {
      places[pl.id] = {
        name: pl['name_'+lang], book: pl['book_' + lang], today: pl['today_' + lang],
        note: pl['note_' + lang], events: pl['events_' + lang] || [],
      };
    }
    const labels = (sg.labels || []).map(lb => lb['name_'+lang]);
    const journeys = {};
    for (const j of sg.journeys || []) journeys[j.key] = j['name_'+lang];
    pack[seg] = { places, labels, journeys };
  }
  fs.writeFileSync(path.join(root, 'i18n/maps', lang + '.json'), JSON.stringify(pack, null, 1) + '\n');
  const np = SEGS.reduce((n, s2) => n + Object.keys(pack[s2].places).length, 0);
  console.log(`i18n/maps/${lang}.json — ${Object.keys(s).length} UI · ${np} places`);
}
