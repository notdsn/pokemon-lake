const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const TAG = URL.includes('github.io') ? 'rayquaza-live' : 'rayquaza';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = f => p.evaluate(f);
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="1"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(300);
  await p.fill('#giftCode', 'edson-rayquaza '); await p.click('#giftForm button'); await p.waitForTimeout(2500);
  ok(await ev(() => /Rayquaza do Edson!/.test(document.querySelector('.giftwin')?.innerText || '')), "tela '🎁 Rayquaza do Edson!'");
  await p.screenshot({ path: `/workspace/pokemon-lake/prints/v2/375x667-${TAG}-modal.png` });
  const r = await ev(() => { const S = PokeApp.debug.S, m = [...S.party, ...(S.box || [])].find(x => x.id === 384); return m && { lvl: m.lvl, iv: m.iv.join(), nat: m.nat, mv: m.moves.map(x => x.n).join(), aff: m.aff, shiny: m.shiny, ab: PDATA.mons[384].ab }; });
  ok(r && r.lvl === 100 && r.iv === '31,31,31,31,31,31' && r.nat === 3 && r.aff === 255 && r.shiny === false && r.ab === 'air-lock', 'Rayquaza Nv100, IV 31, Inflexível, amizade máx, normal, Air Lock ' + JSON.stringify(r));
  ok(r && r.mv === 'dragon-ascent,dragon-dance,extreme-speed,earthquake', 'golpes ' + r?.mv);
  await ev(() => document.querySelector('#modal-root').innerHTML = ''); await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(300); await p.fill('#giftCode', 'EDSON-RAYQUAZA'); await p.click('#giftForm button'); await p.waitForTimeout(800);
  ok(/já foi resgatado/.test(await p.textContent('#giftErr')), 'só uma vez por conta');
  // Mega: com a Pulseira Mega, Rayquaza com Ascensão do Dragão pode megaevoluir
  await ev(() => { const S = PokeApp.debug.S; S.bag['mega-bracelet'] = 1; const i = S.party.findIndex(x => x.id === 384); if (i < 0) { const bi = S.box.findIndex(x => x.id === 384); S.party.unshift(S.box.splice(bi, 1)[0]); } else S.party.unshift(S.party.splice(i, 1)[0]); PokeApp.debug.startBattle({ kind: 'wild', enemy: [PokeApp.PE.makeMon(19, 20, { seed: 5 }, { shiny: false })] }); });
  await p.waitForTimeout(4000); await p.click('#bctl >> text=Lutar'); await p.waitForTimeout(600);
  ok(await ev(() => /Mega/i.test(document.querySelector('#bctl')?.innerText || '')), 'botão de Mega Evolução aparece');
  await p.screenshot({ path: `/workspace/pokemon-lake/prints/v2/375x667-${TAG}-mega.png` });
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
