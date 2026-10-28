// REALISMO 2: câmera, crítico, câmera lenta, partículas por tipo + chip de período gradual + sombra fixa do seguidor
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const MODE = process.env.MODE || 'depois', LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { if (MODE === 'antes') return; console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-real2-${LIVE}${n}-${MODE}.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  await p.clock.setFixedTime(at(6)); await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(300);
  ok(/Amanhecer/.test(await p.evaluate(() => [...document.querySelectorAll('.ex-top .chip')].map(c => c.title + ' ' + c.textContent).join(' '))), 'chip mostra Amanhecer às 6h');
  await p.clock.setFixedTime(at(17.8)); await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(300);
  ok(/Entardecer/.test(await p.evaluate(() => [...document.querySelectorAll('.ex-top .chip')].map(c => c.title + ' ' + c.textContent).join(' '))), 'chip mostra Entardecer às 17:48');
  ok(await ev(() => getComputedStyle(document.querySelector('.follow')).animationName === 'none' && getComputedStyle(document.querySelector('.follow img')).animationName !== 'none'), 'seguidor pula mas a sombra fica no chão');
  await p.clock.setFixedTime(at(12));
  await ev(() => { window.__cls = new Set(); new MutationObserver(ms => ms.forEach(m => m.target.classList && m.target.classList.forEach(c => window.__cls.add(c)))).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    window.__pfx = new Set(); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.classList?.contains('pfx') && window.__pfx.add(n.className)))).observe(document.body, { subtree: true, childList: true });
    PokeApp.debug.startBattle({ kind: 'wild', map: PokeApp.C.MAPS.find(m => m.id === 'floresta'), enemy: [PokeApp.PE.makeMon(74, 5, { seed: 7 })] }); });
  await p.waitForTimeout(3500);
  const busy = async () => { for (let i = 0; i < 40 && await ev(() => PokeApp.debug.B?.busy); i++) await p.waitForTimeout(200); };
  // um golpe de fogo (Brasa) que não derrota: câmera + faíscas
  await busy(); await ev(() => { const B = PokeApp.debug.B, pm = B.s.sides[0].b.m; B.s.sides[1].b.m.hp = 999; pm.moves[0] = { n: 'ember', pp: 20 }; PokeApp.debug.act({ type: 'move', n: 'ember' }); });
  await p.waitForTimeout(1250); await p.screenshot({ path: OUT('batalha-fogo') });
  await busy(); ok(await ev(() => window.__cls.has('cam-p')), 'câmera aproxima do atacante');
  ok(await ev(() => [...window.__pfx].some(c => c.includes('p-fire'))), 'faíscas de fogo no golpe');
  // demo de partículas por tipo
  await ev(() => ['water', 'electric', 'rock', 'grass', 'ice', 'psychic', 'ghost'].forEach((t, i) => setTimeout(() => PokeApp.typeFx(i % 2, t), i * 40)));
  await p.waitForTimeout(260); await p.screenshot({ path: OUT('batalha-tipos') });
  ok(await ev(() => ['p-water', 'p-electric', 'p-rock', 'p-grass', 'p-ice', 'p-psychic', 'p-ghost'].every(t => [...window.__pfx].some(c => c.includes(t)))), 'partículas por tipo (água, elétrico, pedra, planta, gelo, psíquico, fantasma)');
  ok(await ev(() => document.querySelectorAll('#fxl .pfx').length) <= 60, 'partículas limitadas');
  // golpe final: câmera lenta
  await busy(); await ev(() => { const B = PokeApp.debug.B, pm = B.s.sides[0].b.m; pm.lvl = 100; pm.raidHp = 20; B.s.sides[1].b.m.hp = 1; pm.moves[0] = { n: 'swift', pp: 20 }; PokeApp.debug.act({ type: 'move', n: 'swift' }); });
  await p.waitForTimeout(1500); await p.screenshot({ path: OUT('batalha-final') });
  for (let i = 0; i < 40 && await ev(() => !!PokeApp.debug.B); i++) await p.waitForTimeout(300);
  ok(await ev(() => window.__cls.has('slowmo')), 'câmera lenta no golpe final');
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(MODE === 'antes' ? 'prints antes ok' : fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
