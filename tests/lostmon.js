const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = '/workspace/pokemon-lake/prints/v2/';
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 } }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const zard = () => p.evaluate(() => { const S = PokeApp.debug.S; return { party: S.party.map(m => m.id), box: S.box.map(m => m.id), dc: S.daycare.slots.map(m => m.id) }; });
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const S = PokeApp.debug.S; Object.assign(S.party[0], { id: 6, lvl: 60, moves: [{ n: 'flamethrower', pp: 15 }, { n: 'air-slash', pp: 15 }] });
    for (const id of [25, 133, 143]) S.party.push(PE.makeMon(id, 30, { seed: id })); PokeApp.debug.healAll(); PokeApp.debug.save(); PokeApp.debug.go('settings'); });
  await p.fill('#giftCode', 'EDSON-MEGA'); await p.click('#giftForm button'); await p.waitForTimeout(800);
  await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const S = PokeApp.debug.S; S.party[0].item = 'charizardite-y'; S.bag['charizardite-y']--; PokeApp.debug.save(); PokeApp.debug.go('maps');
    PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(19, 2, { seed: 3 })] }); });
  await p.waitForTimeout(3500); await p.click('[data-b="fight"]'); await p.click('[data-b="megatog"]'); await p.evaluate(() => document.querySelector('.bmoves button:not([data-b="megatog"])').click());
  for (let k = 0; k < 20; k++) { await p.waitForTimeout(800); await p.evaluate(() => { const b = document.querySelector('.modal button'); if (b) b.click(); }); if (!(await p.evaluate(() => !!PokeApp.debug.B))) break; }
  console.log('após mega-batalha', JSON.stringify(await zard()));
  await p.reload(); await p.waitForTimeout(1500); console.log('após reload', JSON.stringify(await zard()));
  // simula a perda do Charizard e testa a recuperação
  await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const S = PokeApp.debug.S; S.party.splice(S.party.findIndex(m => m.id === 6), 1); PokeApp.debug.save(); });
  await p.reload(); await p.waitForTimeout(1500); await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; PokeApp.debug.go('settings'); }); await p.waitForTimeout(300);
  console.log('sem Charizard', JSON.stringify(await zard()));
  await p.click('[data-a="recover"]'); await p.waitForTimeout(600); await p.screenshot({ path: OUT + '375x667-recover-found.png' });
  await p.click('[data-a="recoverdo"]'); await p.waitForTimeout(600); await p.screenshot({ path: OUT + '375x667-recover-done.png' });
  console.log('recuperado', JSON.stringify(await zard()));
  await p.click('[data-a="recover"]'); await p.waitForTimeout(400); console.log('2ª busca:', await p.evaluate(() => document.querySelector('.modal').innerText.split('\n').slice(0, 3).join(' | ')));
  console.log('erros', errs); await b.close(); })();
