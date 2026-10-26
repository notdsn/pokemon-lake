const { chromium } = require('/var/tmp/sand-playwright-runtime/164c91ebeb1a9d84bdfd8b8aa7480625/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = '/workspace/pokemon-lake/prints/v2/';
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const shot = n => p.screenshot({ path: `${OUT}${tag}-gmax-${n}.png` }); const clr = () => p.evaluate(() => document.querySelector('#modal-root').innerHTML = '');
    const info = () => p.evaluate(() => { const b = document.querySelector('#pinfo .bnm'); const r = document.querySelector('#psp').getBoundingClientRect(), sc = document.querySelector('#battle .scene') || document.querySelector('#battle'); const q = sc.getBoundingClientRect();
      return { name: b.textContent, cut: b.scrollWidth > b.clientWidth + 1, spr: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], scene: [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)], dmax: JSON.stringify(PokeApp.debug.S.party[0].dmax || null), hp: PokeApp.debug.S.party[0].hp + '/' + PE.maxhp(PokeApp.debug.S.party[0]) }; });
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const S = PokeApp.debug.S; Object.assign(S.party[0], { id: 6, lvl: 60, moves: [{ n: 'flamethrower', pp: 15 }, { n: 'air-slash', pp: 15 }, { n: 'dragon-claw', pp: 15 }, { n: 'swords-dance', pp: 20 }] }); PokeApp.debug.healAll(); PokeApp.debug.save(); PokeApp.debug.go('settings'); });
    await p.waitForTimeout(300); await p.fill('#giftCode', 'edson-gmax'); await p.click('#giftForm button'); await p.waitForTimeout(1500); await shot('redeem');
    console.log(tag, 'resgate', await p.evaluate(() => JSON.stringify({ band: PokeApp.debug.S.bag['dynamax-band'], champion: PokeApp.debug.S.champion })));
    await clr(); await p.fill('#giftCode', 'EDSON-GMAX'); await p.click('#giftForm button'); console.log(tag, 'repetido:', await p.textContent('#giftErr'));
    await p.evaluate(() => { PokeApp.debug.go('maps'); PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(143, 48, { seed: 3 })] }); });
    await p.waitForTimeout(3500); await p.click('[data-b="fight"]'); await p.waitForTimeout(300);
    console.log(tag, 'botões', await p.evaluate(() => [...document.querySelectorAll('.powrow .bb')].map(x => x.textContent.trim())));
    await p.click('[data-b="dynatog"]'); await p.waitForTimeout(300); await shot('menu');
    console.log(tag, 'golpes Max', await p.evaluate(() => [...document.querySelectorAll('.mvb b')].map(x => x.textContent)));
    await p.evaluate(() => document.querySelector('.mvb').click()); await p.waitForTimeout(1500); await shot('anim'); await p.waitForTimeout(4500); await shot('battle');
    console.log(tag, 'após Gigantamax', JSON.stringify(await info()));
    for (let k = 0; k < 2; k++) { for (let w = 0; w < 30 && await p.evaluate(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(500);
      await p.click('[data-b="fight"]').catch(() => {}); await p.waitForTimeout(300); await p.evaluate(() => { const x = document.querySelectorAll('.mvb')[1]; if (x) x.click(); }); await p.waitForTimeout(500); }
    for (let w = 0; w < 30 && await p.evaluate(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(500);
    await shot('after'); console.log(tag, 'após 3 turnos', JSON.stringify(await p.evaluate(() => PokeApp.debug.B ? { dmax: JSON.stringify(PokeApp.debug.S.party[0].dmax || null), hp: PokeApp.debug.S.party[0].hp + '/' + PE.maxhp(PokeApp.debug.S.party[0]), log: document.querySelector('#blog, .blog') ? document.querySelector('#blog, .blog').textContent.slice(0, 80) : '' } : 'batalha acabou')));
    // nome longo de Mega na caixa de HP
    await p.evaluate(() => { const B = PokeApp.debug.B; document.querySelector('#battle')?.remove(); const S = PokeApp.debug.S; S.bag['mega-bracelet'] = 1; delete S.party[0].dmax; S.party[0].item = 'charizardite-y'; PokeApp.debug.healAll(); PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(143, 48, { seed: 4 })] }); });
    await p.waitForTimeout(3500); await p.click('[data-b="fight"]'); await p.waitForTimeout(300); console.log(tag, 'Mega e Dinamax juntos?', await p.evaluate(() => [...document.querySelectorAll('.powrow .bb')].map(x => x.dataset.b)));
    await p.click('[data-b="megatog"]'); await p.evaluate(() => document.querySelector('.mvb').click()); await p.waitForTimeout(4500);
    console.log(tag, 'Mega nome', JSON.stringify(await info())); await p.click('[data-b="fight"]').catch(() => {}); await p.waitForTimeout(300);
    console.log(tag, 'Dinamax após Mega?', await p.evaluate(() => !!document.querySelector('[data-b="dynatog"]'))); await shot('mega-name');
    console.log(tag, 'erros', errs); await ctx.close(); }
  await b.close(); })();
