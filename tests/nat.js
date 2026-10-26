const { chromium } = require('/var/tmp/sand-playwright-runtime/164c91ebeb1a9d84bdfd8b8aa7480625/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = '/workspace/pokemon-lake/prints/v2/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL);
    await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('#modal-root').innerHTML = '');
    await p.evaluate(() => PokeApp.debug.go('settings')); await p.fill('#giftCode', 'EDSON-LENDAS'); await p.click('#giftForm button'); await p.waitForTimeout(1500);
    await p.evaluate(() => { const S = PokeApp.debug.S; S.champion = true; S.badges = [0,1,2,3,4,5,6,7]; S.party[0].lvl = 80; document.querySelector('#modal-root').innerHTML = ''; PokeApp.debug.save(); PokeApp.debug.go('home'); });
    await p.waitForTimeout(800); await p.screenshot({ path: OUT + tag + '-nat-fix-home.png' });
    await p.evaluate(() => PokeApp.debug.go('battle')); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.natcard').scrollIntoView()); await p.screenshot({ path: OUT + tag + '-nat-fix-gyms.png' });
    await p.click('.natcard'); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + tag + '-nat-fix-intro.png' });
    await p.waitForTimeout(9000); await p.screenshot({ path: OUT + tag + '-nat-fix-battle.png' });
    const team = await p.evaluate(() => PokeApp.debug.B.s.sides[1].party.map(m => m.id + ':' + m.lvl)); console.log(tag, 'time da Nat', team);
    // jogar automaticamente até o fim
    for (let k = 0; k < 120; k++) { const done = await p.evaluate(() => !PokeApp.debug.B); if (done) break;
      await p.evaluate(() => { const b = document.querySelector('.bmoves .mvb:not([disabled]), .bmoves button:not([disabled])') || document.querySelector('[data-b="fight"]') || document.querySelector('.bparty button:not([disabled]), .pkpick button:not([disabled])'); if (b) b.click(); }); await p.waitForTimeout(700); }
    await p.waitForTimeout(1500); await p.screenshot({ path: OUT + tag + '-nat-fix-end.png' });
    console.log(tag, 'nat', JSON.stringify(await p.evaluate(() => PokeApp.debug.S.nat)), 'erros', errs);
    await ctx.close(); }
  await b.close();
})();
