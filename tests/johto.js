// E2E: migração de save antigo, Prof. Elm, Creche + ovo + eclosão, mapa e ginásio de Johto (nomes de golpes em pt-BR)
const { chromium } = require('/var/tmp/sand-playwright-runtime/164c91ebeb1a9d84bdfd8b8aa7480625/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync(__dirname + '/../js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', OUT = __dirname + '/../prints/v2/';
const W = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); let fails = 0;
  const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; };
  for (const [tag, vp] of [['375x667', { width: 375, height: 667 }], ['1280x800', { width: 1280, height: 800 }]]) { console.log(tag);
    const ctx = await b.newContext({ viewport: vp }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const shot = n => p.screenshot({ path: OUT + tag + '-' + n + '.png' }); const clr = () => p.evaluate(() => { const r = document.querySelector('#modal-root'); if (r) r.innerHTML = ''; });
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary'); await W(500); await clr();
    // 1) save antigo (v1) -> migração
    await p.goto(URL + 'README.md'); await p.evaluate(() => { const k = 'pkLake.save.edson', s = JSON.parse(localStorage.getItem(k)); s.v = 1; for (const f of ['eggs', 'daycare', 'jbadges', 'jelite', 'jchampion', 'region', 'elmGift', 'bp', 'rewards', 'fixMoves1']) delete s[f];
      s.champion = true; s.badges = [0, 1, 2, 3, 4, 5, 6, 7]; s.party[0].lvl = 100; s.party[0].mega = 'charizard-mega-x'; s.party[0].moves = [{ n: 'growl', pp: 40 }]; delete s.bag['mega-bracelet']; localStorage.setItem(k, JSON.stringify(s)); });
    await p.goto(URL); await W(2500); await shot('johto-0-migracao');
    const mg = await p.evaluate(() => { const S = PokeApp.debug.S; return { v: S.v, eggs: Array.isArray(S.eggs), dc: !!S.daycare, bracelet: S.bag['mega-bracelet'], party: S.party.length, mega: S.party[0].mega || null, moves: S.party[0].moves.map(x => x.n) }; });
    ok(mg.v >= 2 && mg.eggs && mg.dc && mg.party === 1 && !mg.mega, 'migração v1→v2 sem perder Pokémon ' + JSON.stringify(mg)); ok(mg.bracelet === 1, 'Mega Pulseira retroativa'); ok(!mg.moves.includes('growl') || mg.moves.length > 1, 'golpes reparados ' + mg.moves);
    await clr();
    // 2) Johto + Prof. Elm
    await p.evaluate(() => PokeApp.debug.go('maps')); await W(300); await p.click('.seg.region button[data-k="johto"]'); await W(500); await shot('johto-1-mapas');
    await p.click('.goal.elm'); await W(600); await shot('johto-2-elm'); await p.click('.starter[data-id="155"]'); await W(800); await shot('johto-3-elm-presente'); await clr();
    let st = await p.evaluate(() => { const S = PokeApp.debug.S; return { party: S.party.map(m => m.id), eggs: S.eggs.map(e => e.id), elm: S.elmGift }; }); ok(st.party.includes(155) && st.eggs[0] === 175 && st.elm, 'Elm deu Cyndaquil + Ovo de Togepi ' + JSON.stringify(st));
    // 3) Creche: Ditto + Charmander
    await p.evaluate(() => { const S = PokeApp.debug.S; S.box.push(PE.makeMon(132, 30, { seed: 5 }, { ot: 'x' })); PokeApp.debug.save(); PokeApp.debug.go('daycare'); }); await W(400);
    await p.click('.dcpick button[data-w="b"]'); await W(300); await p.click('.dcpick button[data-w="p"][data-i="0"]'); await W(400); await shot('johto-4-creche');
    st = await p.evaluate(() => PokeApp.debug.S.daycare.slots.map(m => m.id + ':' + m.lvl)); ok(st.length === 2, 'dois Pokémon na Creche ' + st);
    await p.evaluate(() => { PokeApp.debug.daycareTick(90 * 60e3); PokeApp.debug.render(); }); await W(400); await shot('johto-5-creche-ovos');
    st = await p.evaluate(() => ({ eggs: PokeApp.debug.S.eggs.map(e => e.id), lv: PokeApp.debug.S.daycare.slots.map(m => m.lvl) })); ok(st.eggs.length >= 2 && st.eggs.includes(4), 'Creche gerou ovo de Charmander e Pokémon ganharam XP ' + JSON.stringify(st));
    await p.evaluate(() => PokeApp.debug.go('team')); await W(400); await p.evaluate(() => document.querySelector('.eggs')?.scrollIntoView()); await shot('johto-6-time-ovos');
    await p.evaluate(() => { PokeApp.debug.S.eggs[0].steps = 0; PokeApp.debug.checkEggs(); }); await W(1200); await shot('johto-7-chocando'); await W(1500); await shot('johto-8-nasceu');
    st = await p.evaluate(() => PokeApp.debug.S.party.map(m => m.id)); ok(st.includes(175), 'Togepi nasceu ' + st); await clr();
    // 4) mapa de Johto
    await p.evaluate(() => { const S = PokeApp.debug.S; S.region = 'johto'; PokeApp.debug.go('maps'); }); await W(300); await p.click('.mapc:not(.locked)'); await W(500); await shot('johto-9-rota29');
    // 5) ginásio de Johto
    await p.evaluate(() => { const S = PokeApp.debug.S; const m = PE.makeMon(250, 100, { seed: 9 }, { moves: ['sacred-fire', 'brave-bird', 'earthquake', 'recover'] }); S.party.unshift(m); PokeApp.debug.healAll(); PokeApp.debug.save(); PokeApp.debug.go('battle'); }); await W(400); await shot('johto-10-ginasios');
    await p.click('button[data-a="jgym"][data-i="0"]'); await W(4500); await p.click('[data-b="fight"]').catch(() => {}); await W(500); await shot('johto-11-golpes-pt');
    const names = await p.evaluate(() => [...document.querySelectorAll('.bmoves button')].map(x => x.textContent).join('|')); ok(/Fogo Sagrado|Terremoto|Recuperação/.test(names), 'golpes em pt-BR: ' + names.slice(0, 120));
    for (let k = 0; k < 90; k++) { if (await p.evaluate(() => !PokeApp.debug.B)) break; await p.evaluate(() => { const mb = [...document.querySelectorAll('.modal button')].pop(); if (mb) return mb.click(); const b = document.querySelector('.bmoves button:not([disabled]):not([data-b="megatog"])') || document.querySelector('[data-b="fight"]') || document.querySelector('.bctl button:not([disabled])'); if (b) b.click(); }); await W(700); }
    await W(2500); await shot('johto-12-insignia');
    st = await p.evaluate(() => PokeApp.debug.S.jbadges); ok(st.includes(0), 'Insígnia Zéfiro ' + JSON.stringify(st));
    ok(!errs.length, 'sem erros JS ' + errs.join(' | ')); await ctx.close(); }
  await b.close(); console.log(fails ? 'FALHAS: ' + fails : 'TUDO OK'); process.exit(fails ? 1 : 0); })();
