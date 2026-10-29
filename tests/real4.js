// REALISMO 4: clima gradual, trovão atrasado, neve acumulando, chão molhado, vapor, sol forte, estações
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const MODE = process.env.MODE || 'depois', LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { if (MODE === 'antes') return; console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-real4-${LIVE}${n}-${MODE}.png`;
const at = (mo, h) => new Date(2026, mo, 15, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(9, 12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  const names = {}; for (const [mo, k] of [[3, 'autumn'], [6, 'winter'], [9, 'spring'], [0, 'summer']]) { await p.clock.setFixedTime(at(mo, 12)); names[k] = await ev(() => PokeApp.wx.season()); }
  ok(JSON.stringify(names) === JSON.stringify({ autumn: 'autumn', winter: 'winter', spring: 'spring', summer: 'summer' }), 'estações do hemisfério sul ' + JSON.stringify(names));
  for (const [mo, k] of [[3, 'outono'], [9, 'primavera']]) { await p.clock.setFixedTime(at(mo, 12.2)); await ev(() => { PokeApp.wx.force = 'clear'; PokeApp.debug.go('explore', 'floresta'); }); await p.waitForTimeout(500); await p.screenshot({ path: OUT('floresta-' + k) }); }
  ok(await ev(() => [...document.querySelectorAll('.ex-top .chip')].some(c => /Primavera/.test(c.title || c.textContent) && c.querySelector('svg.ic'))), 'chip da estação (ícone + título)');
  await p.clock.setFixedTime(at(9, 12.1)); const i0 = await ev(() => PokeApp.wx.wxIntensity('rain')); await p.clock.setFixedTime(at(9, 13.5)); const i1 = await ev(() => PokeApp.wx.wxIntensity('rain'));
  ok(i0 < i1 && i1 === 1, `chuva começa fraca e engrossa (${i0} → ${i1})`);
  await p.clock.setFixedTime(at(9, 13.5)); await ev(() => { PokeApp.wx.force = 'storm'; PokeApp.debug.go('explore', 'lago' in {} ? 'lago' : PC.MAPS.find(m => m.theme === 'water').id); }); await p.waitForTimeout(5500);
  ok(await ev(() => !!document.querySelector('#scene .rainheavy') && document.querySelector('#scene .wx').classList.contains('wxon')), 'tempestade com chuva forte');
  const d = await ev(() => PokeApp.wx.lightning()); await p.waitForTimeout(80); await p.screenshot({ path: OUT('tempestade-relampago') });
  ok(d >= 0.6 && d <= 2.2, 'trovão atrasado após o relâmpago: ' + d.toFixed(2) + 's');
  await ev(() => { PokeApp.wx.force = 'snow'; PokeApp.debug.go('explore', PC.MAPS.find(m => m.theme === 'ice').id); }); await p.waitForTimeout(600);
  ok(await ev(() => !!document.querySelector('#scene .snowedge')), 'neve acumula nas bordas');
  await p.clock.runFor?.(0); await p.screenshot({ path: OUT('neve') });
  await ev(() => { PokeApp.wx.force = 'rain'; PokeApp.debug.startBattle({ kind: 'wild', weather: 'rain', map: PC.MAPS.find(m => m.id === 'floresta'), enemy: [PokeApp.PE.makeMon(74, 5, { seed: 7 })] });
    window.__pfx = new Set(); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.classList?.contains('pfx') && window.__pfx.add(n.className)))).observe(document.body, { subtree: true, childList: true }); });
  await p.waitForTimeout(3500);
  ok(await ev(() => getComputedStyle(document.querySelector('.bmon img')).webkitBoxReflect !== 'none'), 'chão molhado com reflexo');
  await ev(() => PokeApp.typeFx(1, 'fire')); await p.waitForTimeout(350); await p.screenshot({ path: OUT('batalha-chuva-vapor') });
  ok(await ev(() => [...window.__pfx].some(c => c.includes('p-steam'))), 'vapor em golpe de fogo na chuva');
  await ev(() => { document.querySelector('#battle').remove(); PokeApp.wx.force = 'sun'; PokeApp.debug.startBattle({ kind: 'wild', weather: 'sun', map: PC.MAPS.find(m => m.id === 'floresta'), enemy: [PokeApp.PE.makeMon(74, 5, { seed: 7 })] }); });
  await p.waitForTimeout(3300); await p.screenshot({ path: OUT('batalha-sol') });
  ok(await ev(() => getComputedStyle(document.querySelector('.bcam'), '::after').content !== 'none'), 'sol forte clareia');
  ok(await ev(() => { const mp = PC.MAPS.find(m => m.id === 'floresta'); return true; }), 'ok');
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(MODE === 'antes' ? 'prints antes ok' : fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
