#!/usr/bin/env node
// qr-<code>.png 생성(600×600, 사이트 표준).  사용법: node make-qr.mjs <code> [repoRoot]
// 'qrcode' 모듈 필요. 없으면: (cd /tmp/qrgen && npm i qrcode) 후 재실행.
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const code = process.argv[2];
const root = process.argv[3] || process.cwd();
if (!code) { console.error('usage: node make-qr.mjs <code> [repoRoot]'); process.exit(2); }

let QR;
for (const base of ['/tmp/qrgen/node_modules/qrcode', 'qrcode', path.join(root, 'node_modules/qrcode')]) {
  try { QR = require(base); break; } catch {}
}
if (!QR) { console.error("qrcode 모듈 없음 → repo 루트에서 'npm install' 실행 후 재시도 (package.json devDependencies 에 qrcode 있음)"); process.exit(2); }

const out = path.join(root, `qr-${code}.png`);
QR.toFile(out, `https://one-scroll-bible.com/${code}/`,
  { margin: 2, width: 600, color: { dark: '#0e1118', light: '#ffffff' } },
  (e) => { if (e) { console.error(e); process.exit(1); } console.log('생성: ' + out + ' (600×600)'); });
