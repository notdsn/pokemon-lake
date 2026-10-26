const { chromium } = require('/var/tmp/sand-playwright-runtime/164c91ebeb1a9d84bdfd8b8aa7480625/node_modules/playwright-core');
const fs = require('fs');
// desbloqueia o portão gravando o hash (já público em app.js) no localStorage — a senha nunca é lida
const HASH = fs.readFileSync(__dirname + '/../js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const SH = '/workspace/pokemon-lake/prints/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [tag, vp, mobile] of [['375x667', { width: 375, height: 667 }, true], ['1280x800', { width: 1280, height: 800 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push('pageerror ' + e.message)); page.on('console', m => m.type() === 'error' && errs.push('console ' + m.text()));
    const shot = async n => { await page.screenshot({ path: `${SH}${tag}-${n}.png` }); const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > vp.width) errs.push(`hscroll ${n} ${sw}`); };
    await page.goto(URL);
    await page.fill('#pw', 'errada'); await page.click('#gateForm button'); console.log(tag, 'senha errada:', await page.textContent('#pwErr'));
    await page.evaluate(h => localStorage.setItem('pkLake.unlock', h), HASH); await page.reload();

    await page.fill('#au', 'edson'); await page.fill('#ap', 'teste123'); await page.click('#accForm button.primary');
    await page.waitForSelector('#tn'); await page.click('.av[data-av="ethan"]'); await page.fill('#tn', 'Edson'); await page.click('#next');
    await page.waitForSelector('.starter'); await shot('0-starter'); await page.click('.starter[data-id="4"]'); await page.click('.mbtns .btn.primary'); await page.click('.mbtns .btn.primary');
    await page.waitForTimeout(800); const dl = await page.$('.daily'); if (dl) await page.click('.daily [data-a=close]');
    await page.evaluate(() => { const S = PokeApp.save; S.settings.sound = false; S.settings.speed = 1; S.bag['ultra-ball'] = 3; S.bag['master-ball'] = 1; PokeApp.debug.save(); PokeApp.debug.render(); });
    await page.waitForTimeout(500); await shot('1-home');
    await page.click('.nav [data-t="maps"]'); await page.waitForTimeout(400); await shot('2-maps');
    await page.click('.mapc[data-id="rota1"]'); await page.waitForTimeout(400); await page.click('#searchBtn'); await page.waitForTimeout(1200); await shot('3-map-encounter');
    await page.waitForSelector('#battle .bb.fight', { timeout: 15000 }); await page.waitForTimeout(300); await shot('4-battle-start');
    await page.click('.bb.fight'); await page.click('.mvb:not([disabled])'); await page.waitForTimeout(1000); await shot('5-battle-mid-attack');
    await page.waitForSelector('#battle .bb.fight', { timeout: 20000 }).catch(() => {});
    if (await page.$('#battle .bb.bag')) { await page.click('.bb.bag'); await page.click('.irow[data-b="item"][data-id="master-ball"]'); await page.waitForTimeout(1050); await shot('6-capture-throw'); await page.waitForTimeout(1300); await shot('7-capture-shake'); await page.waitForTimeout(2500); await shot('8-captured'); }
    await page.waitForTimeout(1500); for (let k = 0; k < 40; k++) { const b = await page.$('.modal .mbtns .btn.primary, .modal .btn.primary, .modal [data-a=close], .modal .mbtns .btn:last-child'); if (b) await b.click().catch(()=>{}); if (!(await page.$('#battle')) && !(await page.$('.modal'))) break; await page.waitForTimeout(500); }
    // time com vários pokémon para o print
    await page.evaluate(() => { const S = PokeApp.save, PE = PokeApp.PE; [[25, 14, true], [133, 12], [147, 18], [94, 30]].forEach(([id, l, sh]) => { if (S.party.length < 6) { const m = PE.makeMon(id, l, PokeApp.st, { shiny: !!sh, ot: 'Edson' }); m.hp = Math.floor(m.hp * 0.6); S.party.push(m); S.dex.caught[id] = S.dex.seen[id] = 1; } }); S.party[0].lvl = 16; S.party[0].xp = PE.xpFor('medium-slow', 16) + 100; PokeApp.debug.save(); });
    await page.click('.nav [data-t="team"]'); await page.waitForTimeout(500); await shot('9-party');
    await page.click('.mcard[data-i="1"]'); await page.waitForTimeout(400); await shot('10-mon-detail'); await page.evaluate(() => document.querySelector('#modal-root').innerHTML = '');
    await page.click('.nav [data-t="battle"]'); await page.waitForTimeout(400); await shot('11-gyms');
    await page.evaluate(() => PokeApp.debug.healAll());
    await page.click('[data-a="gym"][data-i="0"]'); await page.waitForTimeout(700); await shot('12-gym-intro');
    await page.waitForSelector('#battle .bb.fight', { timeout: 15000 }); await shot('13-gym-battle');
    // luta até acabar
    for (let i = 0; i < 40; i++) { const f = await page.$('#battle .bb.fight'); const sw = await page.$('#battle .bpm:not([disabled])');
      if (!(await page.$('#battle'))) break; if (f) { await f.click(); await page.click('.mvb:not([disabled])'); if (i === 1) { await page.waitForTimeout(900); await shot('14-gym-mid-attack'); } }
      else if (sw && !(await page.$('#battle .bb.back'))) await sw.click(); else { const ok = await page.$('.modal .btn'); if (ok) await ok.click(); }
      await page.waitForTimeout(1500); }
    await page.waitForTimeout(1500); await shot('15-after-gym');
    const ok = await page.$('.modal .btn.primary'); if (ok) await ok.click();
    for (const t of ['shop', 'dex', 'card', 'center']) { await page.evaluate(t => PokeApp.debug.go(t), t); await page.waitForTimeout(400); await shot('16-' + t); }
    const saved = await page.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('pkLake.save.edson')); const s = JSON.parse(localStorage.getItem('pkLake.save.edson')); return { party: s.party.length, badges: s.badges, v: s.v, caught: Object.keys(s.dex.caught).length }; });
    console.log(tag, 'save:', JSON.stringify(saved));
    // reload -> sessão volta
    await page.reload(); await page.waitForTimeout(800); console.log(tag, 'após reload tela:', await page.evaluate(() => document.querySelector('.screen') ? 'jogo' : document.querySelector('#accForm') ? 'login' : 'outro'));
    console.log(tag, 'erros:', errs.length ? errs : 'nenhum');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
