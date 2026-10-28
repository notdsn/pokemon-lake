// Movimento 2D
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-anim-${LIVE}${n}-depois.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  const TAG = process.argv[3] || 'x'; await p.waitForTimeout(500); await clr();
  await ev(() => { const d = PokeApp.debug, S = d.S; const t = d.mkTeam([[658, 40], [25, 30], [133, 30]], 1, 0); S.party.unshift(...t); d.save(); });
  for (const W of [375, 320]) { await p.setViewportSize({ width: W, height: 700 });
    for (const v of ['home', 'team']) { await ev(v => PokeApp.debug.go(v), v); await p.waitForTimeout(900); await clr(); await p.screenshot({ path: `/workspace/pk-tmp/look-${W}-${v}-${TAG}.png` }); }
    await ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[6, 30]], 1, 0), map: PokeApp.C.MAPS[1] }); }); await p.waitForTimeout(2600); await clr();
    for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon')?.classList.contains('hidden')); w++) await p.waitForTimeout(300); await p.waitForTimeout(700);
    await p.screenshot({ path: `/workspace/pk-tmp/look-${W}-batalha-${TAG}.png` }); await ev(() => document.querySelector('#battle')?.remove()); }
  ok(await ev(() => { PokeApp.debug.go('home'); return document.querySelector('#app').classList.contains('scr-in') && /blur/.test(getComputedStyle(document.querySelector('.card')).backdropFilter); }), 'vidro fosco + transição de tela');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
