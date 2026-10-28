// Código EDSON-GRENINJA: Greninja Nv50 + resumo, Pokédex e batalha. Uso: node tests/greninja.js [URL]
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', T = URL.includes('github.io') ? 'v6live' : 'v6', OUT = '/workspace/pokemon-lake/prints/v2/375x667-' + T + '-';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext({ viewport: { width: 375, height: 667 } });
  await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="7"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = ''); await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(300);
  await p.fill('#giftCode', 'edson-greninja'); await p.click('#giftForm button'); await p.waitForTimeout(3500); await p.screenshot({ path: OUT + 'gift-greninja.png' });
  const g = await ev(() => { const m = [...PokeApp.save.party, ...PokeApp.save.box].find(m => m.id === 658); return m && { lvl: m.lvl, nat: PokeApp.PE.NATURES[m.nat][0], iv: m.iv, moves: m.moves.map(x => PDATA.moves[x.n].n), ab: PDATA.mons[658].ab, t: PDATA.mons[658].t }; });
  console.log(JSON.stringify(g)); ok(g && g.lvl === 50 && g.iv.every(x => x >= 28) && ['Tímida', 'Ingênua'].includes(g.nat), 'Greninja Nv50, IVs ≥28, natureza boa');
  ok(g && g.moves.join() === 'Shuriken de Água,Bomba Hidráulica,Pulso Sombrio,Raio Congelante' && g.t.join() === 'water,dark' && g.ab === 'protean', 'golpes pt-BR + Água/Noturno + Protean');
  await ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.fill('#giftCode', 'EDSON-GRENINJA'); await p.click('#giftForm button'); ok(/já foi resgatado/.test(await p.textContent('#giftErr')), 'só 1 vez por conta');
  ok(await ev(() => !!PDATA.mons[656] && PDATA.mons[656].e[0].to === 657 && PDATA.mons[657].e[0].to === 658), 'Froakie → Frogadier → Greninja');
  await ev(() => { const S = PokeApp.save, i = S.party.findIndex(m => m.id === 658); if (i < 0) { S.party.unshift(S.box.splice(S.box.findIndex(m => m.id === 658), 1)[0]); } else S.party.unshift(S.party.splice(i, 1)[0]); PokeApp.debug.go('team'); }); await p.waitForTimeout(400);
  await p.click('.mcard'); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'greninja-summary.png' });
  await ev(() => { document.querySelector('#modal-root').innerHTML = ''; PokeApp.debug.go('dex'); }); await p.waitForTimeout(500); await ev(() => { const e = document.querySelector('[data-a="dexinfo"][data-id="658"]'); e && e.scrollIntoView(); }); await p.screenshot({ path: OUT + 'greninja-dex.png' });
  ok(await ev(() => !!document.querySelector('[data-a="dexinfo"][data-id="658"]')), 'Greninja na Pokédex');
  await ev(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: [PokeApp.PE.makeMon(19, 20, { seed: 5 }, { shiny: false })] })); await p.waitForTimeout(4000); await p.screenshot({ path: OUT + 'greninja-battle.png' });
  for (let k = 0; k < 30 && await ev(() => !!PokeApp.debug.B && !PokeApp.debug.B.s.over); k++) { await ev(() => { const B = PokeApp.debug.B; if (B && !B.busy) PokeApp.debug.act({ type: 'move', n: 'water-shuriken' }); }); await p.waitForTimeout(700); }
  ok(await ev(() => !PokeApp.debug.B || PokeApp.debug.B.s.over), 'batalha com Shuriken de Água termina'); ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs));
  await b.close(); console.log(fail ? 'FALHAS ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
