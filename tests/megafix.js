const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = '/workspace/pokemon-lake/prints/v2/';
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); await p.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const S = PokeApp.debug.S; S.party[0].id = 6; S.party[0].lvl = 60; S.party[0].item = 'charizardite-y'; S.party[0].moves = [{ n: 'flamethrower', pp: 15 }, { n: 'air-slash', pp: 15 }]; S.bag['mega-bracelet'] = 1; PokeApp.debug.healAll(); PokeApp.debug.save(); PokeApp.debug.go('maps'); });
    await p.evaluate(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: [PokeApp.debug.mkTeam ? undefined : undefined].filter(Boolean).length ? [] : [ (()=>{ const PE = window.PE; return PE.makeMon(19, 40, { seed: 3 }); })() ] }));
    await p.waitForTimeout(3500); await p.click('[data-b="fight"]').catch(() => {}); await p.waitForTimeout(500);
    await p.click('[data-b="megatog"]').catch(e => console.log('sem botão mega')); await p.waitForTimeout(300); await p.screenshot({ path: OUT + tag + '-mega-fix-toggle.png' });
    await p.evaluate(() => document.querySelector('.bmoves button:not([data-b="megatog"])').click()); await p.waitForTimeout(2200); await p.screenshot({ path: OUT + tag + '-mega-fix-anim.png' });
    await p.waitForTimeout(4000); await p.screenshot({ path: OUT + tag + '-mega-fix-after.png' });
    const nm = await p.evaluate(() => document.querySelector('#pinfo b').textContent); console.log(tag, 'nome', nm);
    const box = await p.evaluate(() => { const r = document.querySelector('#psp').getBoundingClientRect(), sc = document.querySelector('.bscene').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.bottom), Math.round(r.width), Math.round(sc.left), Math.round(sc.bottom)]; }); console.log(tag, 'sprite jogador vs cena', box);
    for (const [pid, eid] of [[249, 10], [10, 249], [208, 383]]) { await p.evaluate(([pid, eid]) => { const B = PokeApp.debug.B; if (B) { document.querySelector('#battle')?.remove(); } PokeApp.debug.S.party[0] = PE.makeMon(pid, 60, { seed: 1 }); PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(eid, 50, { seed: 2 })] }); }, [pid, eid]); await p.waitForTimeout(4000);
      await p.screenshot({ path: OUT + tag + `-mega-fix-size-${pid}-vs-${eid}.png` }); }
    console.log(tag, 'mega?', await p.evaluate(() => { const B = PokeApp.debug.B; return B ? JSON.stringify(B.s.sides[0].b.m.mega || B.s.sides[0].b.mega || null) : 'fim'; }), errs); await ctx.close(); }
  await b.close(); })();
