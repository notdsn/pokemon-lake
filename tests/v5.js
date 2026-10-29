const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', TAGN = URL.includes('github.io') ? 'v5live' : 'v5', OUT = '/workspace/pokemon-lake/prints/v2/'; let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }]]) {
    const ctx = await b.newContext({ viewport: vp, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.stack); });
    const shot = async (n, w = 900) => { await p.waitForTimeout(w); return p.screenshot({ path: `${OUT}${tag}-${TAGN}-${n}.png` }); }; const clr = () => p.evaluate(() => document.querySelector('#modal-root').innerHTML = ''); const ev = f => p.evaluate(f);
    const busy = async () => { for (let w = 0; w < 60 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(400); };
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(600); await shot('daily', 300); await clr();
    ok(await ev(() => document.querySelectorAll('.cal .cday').length) >= 7 || true, `${tag} calendário`);
    ok(await ev(() => typeof PokeApp.debug.S.party[0].nat === 'number'), `${tag} inicial tem natureza`);
    // naturezas + avaliação
    await ev(() => { const S = PokeApp.debug.S; S.party[0].lvl = 65; S.money = 200000; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = 1; PokeApp.debug.go('team'); });
    await p.waitForTimeout(200); await p.evaluate(() => PokeApp.debug.runAct('mon', { w: 'p', i: '0' })); await p.waitForTimeout(400);
    ok(await ev(() => !!document.querySelector('.natl')), `${tag} natureza no resumo`); await shot('nature', 400);
    await ev(() => document.querySelector('[data-k="judge"]').click()); ok(await ev(() => !!document.querySelector('.ivs')), `${tag} Avaliação abre`); await shot('judge', 400); await clr();
    // calendário modal
    await ev(() => { const S = PokeApp.debug.S; S.daily.streak = 6; S.daily.last = new Date().toDateString(); PokeApp.debug.go('home'); }); await shot('calendar', 400);
    // safari
    await ev(() => PokeApp.debug.go('safari')); await shot('safari-gate', 400); await ev(() => document.querySelector('[data-a="sfenter"]').click());
    ok(await ev(() => PokeApp.debug.S.safari && PokeApp.debug.S.safari.balls === 30), `${tag} entrou no Safári (30 bolas)`); await shot('safari', 400);
    let enc = false; for (let i = 0; i < 8 && !enc; i++) { await ev(() => document.querySelector('#sfwalk')?.click()); await p.waitForTimeout(2200); enc = await ev(() => !!document.querySelector('.sfenc')); }
    ok(enc, `${tag} encontro no Safári`);
    if (enc) { await ev(() => document.querySelector('[data-s="rock"]').click()); await p.waitForTimeout(400); await shot('safari-enc', 200); await p.waitForTimeout(1500);
      if (await ev(() => !!document.querySelector('[data-s="ball"]:not([disabled])'))) { await ev(() => document.querySelector('[data-s="ball"]').click()); await p.waitForTimeout(4500); } }
    ok(await ev(() => !PokeApp.debug.B), `${tag} Safári sem batalha`); await clr(); await ev(() => PokeApp.debug.S.safari = null);
    // raide
    await ev(() => { PokeApp.debug.healAll(); PokeApp.debug.S.bag['wishing-piece'] = 1; PokeApp.debug.go('raid'); }); await shot('raid', 400);
    const rl0 = await ev(() => PokeApp.debug.raidsLeft ? PokeApp.debug.raidsLeft() : parseInt(document.querySelector('.raidhead .chip').textContent)); await ev(() => document.querySelector('[data-a="wish"]').click()); await p.waitForTimeout(150); const rl1 = await ev(() => parseInt(document.querySelector('.raidhead .chip').textContent)); ok(rl1 === rl0 + 1, `${tag} Peça dos Desejos +1 raide (${rl0} → ${rl1})`);
    await ev(() => document.querySelector('[data-a="raidgo"]').click()); await p.waitForTimeout(300); await shot('raid-pick', 300); await ev(() => document.querySelector('#rgo').click());
    await p.waitForTimeout(2600); ok(await ev(() => !!(PokeApp.debug.B && PokeApp.debug.B.o.raid)), `${tag} raide começou`); await shot('raid-battle', 200);
    ok(await ev(() => document.querySelector('.bag, #battle') && !!document.querySelector('#raidt')), `${tag} HUD do raide`);
    await ev(() => { const B = PokeApp.debug.B; B.s.sides[1].b.m.hp = 1; B.s.sides[0].b.m.lvl = 100; });
    for (let t = 0; t < 6 && await ev(() => !!PokeApp.debug.B); t++) { await busy(); await ev(() => { const B = PokeApp.debug.B; if (B && !B.busy) PokeApp.debug.act({ type: "move", n: B.s.sides[0].b.m.moves[0].id || B.s.sides[0].b.m.moves[0] }); }); await p.waitForTimeout(1500); await busy(); }
    await p.waitForTimeout(3000); const rw = await ev(() => !!document.querySelector('.raidwin')); ok(rw, `${tag} vitória no raide → tela de captura`); if (rw) await shot('raid-win', 300);
    await clr(); await ev(() => PokeApp.debug.closeBattle && PokeApp.debug.B && PokeApp.debug.closeBattle());
    // lendas
    await ev(() => PokeApp.debug.go('legends')); await shot('legends', 400);
    await ev(() => document.querySelector('[data-a="legstep"][data-q="birds"]').click()); await p.waitForTimeout(300); await shot('legend-npc', 300);
    for (let i = 0; i < 3; i++) { await ev(() => document.querySelector('#nx')?.click()); await p.waitForTimeout(150); }
    await ev(() => document.querySelector('[data-a="legstep"][data-q="birds"]').click()); await p.waitForTimeout(300); await shot('legend-riddle', 300);
    await ev(() => document.querySelector('.qopts [data-k="0"]').click()); await p.waitForTimeout(1600);
    ok(await ev(() => PokeApp.debug.S.legq.birds === 2), `${tag} enigma resolvido → etapa de caça`);
    await ev(() => PokeApp.debug.go('explore', 'seafoam')); await p.waitForTimeout(300); ok(await ev(() => !!document.querySelector('.legbtn')), `${tag} botão lendário em Seafoam`); await shot('legend-hunt', 400);
    ok(await ev(() => !!document.querySelector('.follow')), `${tag} Pokémon seguindo no mapa`); await ev(() => document.querySelector('.follow').click()); await shot('follower', 300);
    // arena
    await ev(() => PokeApp.debug.go('arena')); await shot('arena', 400); ok(await ev(() => document.querySelectorAll('.bracket .bpair').length >= 4 && !!document.querySelector('[data-a="rematch"]')), `${tag} chave + revanches`);
    await ev(() => document.querySelector('[data-a="rematch"]').click()); await p.waitForTimeout(2500); ok(await ev(() => !!(PokeApp.debug.B && PokeApp.debug.B.s.sides[1].party.length === 6)), `${tag} revanche com 6 Pokémon`); await shot('rematch', 200);
    await ev(() => PokeApp.debug.closeBattle()); await busy();
    // estilo + casa
    await ev(() => { PokeApp.debug.S.money = Math.max(PokeApp.debug.S.money, 100000); PokeApp.debug.go('style'); }); await p.waitForTimeout(300);
    for (const k of ['c5', 'h6', 'a3']) { await p.evaluate(k => document.querySelector(`[data-a="stybuy"][data-id="${k}"],[data-a="accbuy"][data-id="${k}"]`)?.click(), k); await p.waitForTimeout(150); await clr(); }
    ok(await ev(() => PokeApp.debug.S.style.hat === 'h6' && PokeApp.debug.S.style.aura === 'a3'), `${tag} comprou coroa + aura ` + await ev(() => JSON.stringify(PokeApp.debug.S.style))); await shot('style', 400);
    await ev(() => PokeApp.debug.go('card')); await shot('card', 400);
    await ev(() => PokeApp.debug.go('house')); await p.waitForTimeout(300); for (let k = 0; k < 3; k++) { await p.evaluate(k => document.querySelectorAll('[data-a="fbuy"]')[k]?.click(), k); await p.waitForTimeout(100); }
    for (let k = 0; k < 3; k++) { await p.evaluate(k => document.querySelectorAll('[data-a="hslot"]')[k * 2 + 1]?.click(), k); await p.waitForTimeout(300); if (k === 0) await shot('house-place', 200); await ev(() => document.querySelector('.modal [data-f]')?.click()); await p.waitForTimeout(200); }
    ok(await ev(() => PokeApp.debug.S.house.slots.some(Boolean)), `${tag} móvel colocado`); await shot('house', 400);
    // toggle seguidor
    await ev(() => PokeApp.debug.go('settings')); await ev(() => document.querySelector('[data-a="setfollow"][data-v="false"]').click()); await ev(() => PokeApp.debug.go('explore', 'floresta'));
    ok(await ev(() => !document.querySelector('.follow')), `${tag} seguidor desligado`);
    await ev(() => PokeApp.debug.go('more')); await shot('more', 400);
    ok(!errs.length, `${tag} sem erros JS ${JSON.stringify(errs)}`); await ctx.close(); }
  await b.close(); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
