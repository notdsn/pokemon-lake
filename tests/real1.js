// REALISM parte 1: sombras + luz do dia + vagalumes. MODE=antes só tira prints.
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const MODE = process.env.MODE || 'depois', LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { if (MODE === 'antes') return; console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-real1-${LIVE}${n}-${MODE}.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="1"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  const tints = {};
  for (const [h, n] of [[6.5, 'amanhecer'], [12, 'meiodia'], [17.8, 'pordosol'], [22, 'noite']]) {
    await p.clock.setFixedTime(at(h)); await ev(() => { PokeApp.debug.go('explore', 'floresta'); window.PokeApp.light?.tick(); }); await p.waitForTimeout(700);
    tints[n] = await ev(() => getComputedStyle(document.documentElement).getPropertyValue('--tint').trim());
    await p.screenshot({ path: OUT('explore-' + n) });
  }
  ok(new Set(Object.values(tints)).size === 4, 'tinta muda gradualmente ' + JSON.stringify(tints));
  ok(await ev(() => document.querySelectorAll('#scene .ffly i').length) > 0, 'vagalumes na floresta à noite');
  ok(await ev(() => { const s = getComputedStyle(document.querySelector('.follow'), '::before'); return s.content !== 'none' && s.content !== ''; }), 'sombra no seguidor');
  await p.clock.setFixedTime(at(12)); await ev(() => { PokeApp.debug.go('explore', 'floresta'); PokeApp.light?.tick(); }); await p.waitForTimeout(300);
  ok(await ev(() => !document.querySelector('#scene .ffly')), 'sem vagalumes de dia');
  const sh = await ev(() => getComputedStyle(document.documentElement).getPropertyValue('--shsx').trim());
  await p.clock.setFixedTime(at(17.8)); const sh2 = await ev(() => { PokeApp.light?.tick(); return getComputedStyle(document.documentElement).getPropertyValue('--shsx').trim(); });
  ok(parseFloat(sh2) > parseFloat(sh), `sombra mais longa no fim da tarde (${sh} → ${sh2})`);
  await ev(() => { const S = PokeApp.debug.S, C = window.PokeContent || {}; const mp = (PokeApp.C || {}).MAPS?.find(m => m.id === 'floresta');
    PokeApp.debug.startBattle({ kind: 'wild', map: mp || { theme: 'forest' }, enemy: [PokeApp.PE.makeMon(16, 5, { seed: 7 })] }); });
  await p.waitForTimeout(3500); await p.screenshot({ path: OUT('batalha-pordosol') });
  ok(await ev(() => !!document.querySelector('.bmon.emon.fly')), 'Pidgey voa acima da sombra');
  ok(await ev(() => { const s = getComputedStyle(document.querySelector('.bmon'), '::before'); return s.content !== 'none' && s.content !== ''; }), 'sombra na batalha');
  await ev(() => document.querySelector('#battle')?.remove()); await ev(() => { PokeApp.debug.S.party[0].hp = 0; });
  await p.clock.setFixedTime(at(22)); await ev(() => { PokeApp.debug.S.party[0].hp = 1; PokeApp.debug.go('house'); PokeApp.light?.tick(); }); await p.waitForTimeout(700);
  await p.screenshot({ path: OUT('casa-noite') });
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(MODE === 'antes' ? 'prints antes ok' : fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
