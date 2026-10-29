const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const MODE = process.env.MODE || 'depois', LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { if (MODE === 'antes') return; console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-real3-${LIVE}${n}-${MODE}.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  const MAPS = await ev(() => { const C = PokeApp.debug.S && (window.PC || {}); const out = {}; (window.PC.MAPS).forEach(m => { if (!out[m.theme]) out[m.theme] = m.id; }); return out; });
  const pick = { forest: 'forest', cave: 'cave', water: 'water', sky: 'mountain', electric: 'city', ice: 'snow', safari: 'desert' };
  for (const [th, bio] of Object.entries(pick)) { const id = MAPS[th]; if (!id) continue;
    await ev(id => { document.querySelector('#battle')?.remove(); PokeApp.debug.go('explore', id); }, id); await p.waitForTimeout(500);
    if (th === 'forest' || th === 'water' || th === 'ice') await p.screenshot({ path: OUT('explore-' + bio) });
    { const want = await ev(id => PokeApp.biomeFor({ map: window.PC.MAPS.find(m => m.id === id) }), id); ok(await ev(b => !!document.querySelector('#scene .bpar.bio-' + b), want), 'exploração com 3 camadas: ' + want); }
    await ev(id => PokeApp.debug.startBattle({ kind: 'wild', map: window.PC.MAPS.find(m => m.id === id), enemy: [PokeApp.PE.makeMon(74, 5, { seed: 7 })] }), id); await p.waitForTimeout(3300);
    await p.screenshot({ path: OUT('batalha-' + bio) });
    { const want = await ev(id => PokeApp.biomeFor({ map: window.PC.MAPS.find(m => m.id === id) }), id); ok(await ev(b => document.querySelectorAll('#battle .bcam .bpar.bio-' + b + ' .bl:is(.sky,.gnd,.hills,.fg)').length === 4, want), 'batalha com paralaxe: ' + want + ' (local do mapa)'); } }
  ok(await ev(() => !document.querySelector('.bcam .info') && !!document.querySelector('.bscene > .info')), 'caixas de HP fora da câmera');
  await ev(() => PokeApp.camTo(1)); await p.waitForTimeout(500);
  ok(await ev(() => { const s = document.querySelector('.bpar .sky'), f = document.querySelector('.bpar .fg'); return getComputedStyle(s).transform !== getComputedStyle(f).transform && document.querySelector('#einfo').getBoundingClientRect().top < 60; }), 'camadas se movem diferente; HP parado');
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(MODE === 'antes' ? 'prints antes ok' : fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
