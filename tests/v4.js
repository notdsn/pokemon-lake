const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = '/workspace/pokemon-lake/prints/v2/'; let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const shot = async n => { await p.waitForTimeout(900); return p.screenshot({ path: `${OUT}${tag}-v4-${n}.png` }); }; const clr = () => p.evaluate(() => document.querySelector('#modal-root').innerHTML = ''); const ev = f => p.evaluate(f);
    const busy = async () => { for (let w = 0; w < 40 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(400); };
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(600); await clr();
    // 1. Missões
    const q = await ev(() => { const S = PokeApp.debug.S; PokeApp.debug.go('quests'); return { d: S.quests.d.length, w: S.quests.w.length, day: S.quests.day }; });
    ok(q.d === 3 && q.w >= 3 && q.w <= 5, `${tag} missões ${q.d} diárias / ${q.w} semanais (${q.day})`);
    await ev(() => { const S = PokeApp.debug.S; S.party[0].lvl = 60; for (let i = 0; i < 6; i++) PokeApp.track('win'); PokeApp.track('catch', 5, { id: 1 }); PokeApp.track('fish', 3); PokeApp.track('steps', 25); PokeApp.track('quiz', 3); PokeApp.track('trainer', 2); PokeApp.debug.render(); });
    const nd = await ev(() => document.querySelector('.ndot')?.textContent); ok(+nd > 0, `${tag} badge no Mais = ${nd}`); await shot('quests');
    const m0 = await ev(() => PokeApp.debug.S.money); await ev(() => document.querySelector('[data-a="qclaim"]:not([disabled])').click()); const m1 = await ev(() => PokeApp.debug.S.money);
    ok(m1 > m0, `${tag} resgatar missão deu ${m1 - m0} moedas`);
    await ev(() => { const S = PokeApp.debug.S; S.quests.d.forEach(x => { x.p = x.n; }); PokeApp.debug.render(); let x; while ((x = document.querySelector('[data-a="qclaim"]:not([disabled])'))) x.click(); });
    await ev(() => document.querySelector('[data-a="qbonus"]')?.click()); ok(await ev(() => PokeApp.debug.S.quests.bonus === 1), `${tag} bônus diário`);
    // reset por data
    ok(await ev(() => { const S = PokeApp.debug.S; S.quests.day = '2020-1-1'; PokeApp.debug.render(); return S.quests.day !== '2020-1-1' && S.quests.d.every(x => !x.c); }), `${tag} reset diário`);
    await ev(() => PokeApp.debug.go('more')); await shot('more');
    // 2. Pokédex
    await ev(() => { const S = PokeApp.debug.S; for (let i = 1; i <= 55; i++) { S.dex.seen[i] = 1; S.dex.caught[i] = 1; } PokeApp.debug.go('dex'); }); await p.waitForTimeout(200); await ev(() => document.querySelector('.dexrwbtn').click()); console.log(await ev(() => [...document.querySelectorAll('.dm')].map(x => x.textContent).join('|'))); await shot('dex');
    for (const k of [10, 25, 50]) await p.evaluate(k => { document.querySelector('.dexrwbtn').click(); document.querySelector(`[data-a="dexclaim"][data-k="${k}"]`).click(); document.querySelector('#modal-root').innerHTML = ''; }, k);
    const dm = await ev(() => ({ charm: PokeApp.debug.S.bag['shiny-charm'], p: PokeApp.shinyP() })); ok(dm.charm === 1 && Math.abs(dm.p - 3 / 512) < 1e-9, `${tag} Amuleto Brilhante → chance ${dm.p.toFixed(5)}`);
    ok(await ev(() => !document.querySelector('[data-a="dexclaim"][data-k="10"]')), `${tag} marco não repete`);
    // 3. Shiny
    await ev(() => { PokeApp.debug.go('maps'); PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(133, 5, { seed: 7 }, { shiny: true })] }); });
    await p.waitForTimeout(vp.width < 500 ? 2900 : 2900); await shot('shiny'); await p.waitForTimeout(1500); await busy();
    ok(await ev(() => PokeApp.debug.S.stats.shinies) === 1, `${tag} contador shiny`);
    await ev(() => { PokeApp.debug.closeBattle(); });
    await ev(() => { const S = PokeApp.debug.S; S.box.push(PE.makeMon(25, 10, { seed: 2 }, { shiny: true })); PokeApp.debug.go('team'); }); await p.waitForTimeout(200);
    ok(await ev(() => document.querySelectorAll('.shinytag').length) >= 0, `${tag} marca ★`);
    // 4. Pesca
    await ev(() => { PokeApp.debug.S.badges = [0, 1, 2]; }); await ev(() => PokeApp.debug.go('explore', 'cerulean')); await p.waitForTimeout(300); await shot('explore-fish');
    ok(await ev(() => !!document.querySelector('[data-a="fish"]')), `${tag} botão Pescar no Cabo de Cerulean`);
    await p.click('[data-a="fish"]'); await p.waitForTimeout(300); ok(await ev(() => PokeApp.debug.S.bag['old-rod'] === 1), `${tag} ganhou Vara Velha`);
    await p.click('.modal [data-a="fish"]'); await p.waitForTimeout(500); await shot('fish-wait');
    await p.waitForSelector('#bite:not(.hidden)', { timeout: 9000 }); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}${tag}-v4-fish-bite.png` }); await p.click('#fishBtn');
    await p.waitForTimeout(3500); ok(await ev(() => !!PokeApp.debug.B && PokeApp.debug.S.stats.fished === 1), `${tag} fisgou e iniciou batalha`); await shot('fish-battle');
    await busy(); await ev(() => { PokeApp.debug.closeBattle(); }); await p.waitForTimeout(500);
    // cedo demais
    await ev(() => PokeApp.debug.go('explore', 'cerulean')); await p.click('[data-a="fish"]'); await p.waitForTimeout(200); await p.click('#fishBtn'); ok((await p.textContent('#fishT')).includes('Cedo'), `${tag} puxar cedo falha`); await clr();
    // loja de varas
    await ev(() => { PokeApp.debug.S.money = 50000; PokeApp.debug.go('shop'); }); await p.click('[data-a="buyrod"][data-id="good-rod"]'); ok(await ev(() => PokeApp.debug.S.bag['good-rod'] === 1), `${tag} comprou Vara Boa`);
    // 4b. Quiz
    await ev(() => PokeApp.debug.go('games')); await shot('games'); await p.click('[data-a="quiz"]'); await p.waitForTimeout(300); await shot('quiz');
    await p.click('.qopts .btn'); await p.waitForTimeout(400); await shot('quiz-answer'); ok(await ev(() => PokeApp.debug.S.mini.n === 1), `${tag} quiz rodada contada`);
    for (let i = 1; i < 5; i++) { await p.click('#qnext'); await p.waitForTimeout(150); await p.click('.qopts .btn'); await p.waitForTimeout(150); } await p.click('#qnext');
    await ev(() => PokeApp.debug.go('games')); ok(await ev(() => document.querySelector('[data-a="quiz"]').disabled), `${tag} quiz limitado a 5/dia`);
    // 5. Conquistas
    await ev(() => { PokeApp.checkAch(); PokeApp.debug.go('ach'); }); await p.waitForTimeout(200); await shot('ach');
    await ev(() => document.querySelector('.ach.got[data-k="shiny1"]').click()); await ev(() => PokeApp.debug.go('card')); await shot('card-title');
    ok((await p.textContent('.tcard')).includes('Caçador de Brilhos'), `${tag} título no cartão`);
    // Música
    await ev(() => PokeApp.debug.go('settings')); await shot('settings'); ok(await ev(() => !!document.querySelector('[data-a="setmus"]')), `${tag} config música`);
    await p.click('[data-a="tab"][data-t="home"]'); await p.waitForTimeout(400); ok(['map', 'night'].includes(await ev(() => PokeApp.MUS.cur)), `${tag} música do mapa tocando: ${await ev(() => PokeApp.MUS.cur)}`);
    await p.click('[data-a="setmus"][data-v="false"]').catch(async () => { await ev(() => PokeApp.debug.go('settings')); await p.click('[data-a="setmus"][data-v="false"]'); }); ok(await ev(() => PokeApp.MUS.cur) === null, `${tag} mudo`);
    await ev(() => PokeApp.debug.go('settings')); await p.click('[data-a="setmus"][data-v="true"]');
    await ev(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: [PE.makeMon(16, 3, { seed: 3 })] })); await p.waitForTimeout(500); await p.mouse.click(5, 5); ok(await ev(() => PokeApp.MUS.cur) === 'battle', `${tag} tema de batalha`);
    await busy(); await ev(() => { PokeApp.debug.closeBattle(); }); await p.waitForTimeout(500);
    // dia/noite
    await ev(() => { document.body.dataset.period = 'night'; PokeApp.debug.go('explore', 'route1'); document.querySelector('#scene')?.classList.replace(document.querySelector('#scene').className.match(/per-\w+/)[0], 'per-night'); }); await shot('night');
    ok(!errs.length, `${tag} sem erros JS ${JSON.stringify(errs)}`); await ctx.close(); }
  await b.close(); console.log(fail ? `${fail} FALHA(S)` : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
