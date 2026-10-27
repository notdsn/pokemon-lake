const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); 
    await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="1"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('#modal-root').innerHTML = '');
    await p.evaluate(() => PokeApp.debug.go('settings')); await p.waitForTimeout(300);
    await p.fill('#giftCode', 'errado'); await p.click('#giftForm button'); console.log(tag, 'inválido:', await p.textContent('#giftErr'));
    await p.fill('#giftCode', (process.argv[3]||'edson-lendas')); await p.click('#giftForm button'); await p.waitForTimeout(3500);
    fs.mkdirSync('/workspace/pokemon-lake/prints/v2', { recursive: true });
    await p.screenshot({ path: `/workspace/pokemon-lake/prints/v2/${tag}-gift-${process.argv[3]||'lendas'}.png` });
    const r = await p.evaluate(() => { const S = PokeApp.save; return { party: S.party.map(m => m.id), box: S.box.map(m => m.id + ':' + m.lvl), char: S.box.concat(S.party).filter(m => m.id === 6).map(m => m.lvl + ' ' + m.moves.map(x => x.n)) }; });
    console.log(tag, JSON.stringify(r));
    await p.evaluate(() => document.querySelector('#modal-root').innerHTML = ''); await p.fill('#giftCode', (process.argv[3]||'EDSON-LENDAS').toUpperCase()); await p.click('#giftForm button');
    console.log(tag, 'repetido:', await p.textContent('#giftErr'), 'total:', await p.evaluate(() => PokeApp.save.party.length + PokeApp.save.box.length));
    await p.reload(); await p.waitForTimeout(800); console.log(tag, 'após reload total:', await p.evaluate(() => PokeApp.save && PokeApp.save.party.length + PokeApp.save.box.length), 'erros', errs);
    await ctx.close();
  }
  await b.close();
})();
