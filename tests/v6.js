// Teste do lote v6 (G1..G6). Uso: node tests/v6.js [URL] [grupos ex: 1,2]
const { chromium } = require('/var/tmp/sand-playwright-runtime/164c91ebeb1a9d84bdfd8b8aa7480625/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', GR = (process.argv[3] || '1,2,3,4,5,6').split(',').map(Number), TAGN = URL.includes('github.io') ? 'v6live' : 'v6', OUT = '/workspace/pokemon-lake/prints/v2/';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const tag = '375x667', ctx = await b.newContext({ viewport: { width: 375, height: 667 }, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.stack); });
  const shot = async (n, w = 700) => { await p.waitForTimeout(w); return p.screenshot({ path: `${OUT}${tag}-${TAGN}-${n}.png` }); }; const clr = () => p.evaluate(() => document.querySelector('#modal-root').innerHTML = ''); const ev = (f, a) => p.evaluate(f, a);
  const busy = async () => { for (let w = 0; w < 60 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(300); };
  const click = sel => ev(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
  const winBattle = async () => { for (let t = 0; t < 12 && await ev(() => !!PokeApp.debug.B && !PokeApp.debug.B.s.over); t++) { await busy(); await ev(() => { const B = PokeApp.debug.B; if (!B || B.busy) return; B.s.sides[1].party.forEach(m => m.hp = 1); const mv = B.s.sides[0].b.m.moves[0]; PokeApp.debug.act({ type: 'move', n: mv.n }); }); await p.waitForTimeout(900); } };
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(600); await clr();
  await ev(() => { const S = PokeApp.debug.S; S.money = 300000; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = 1; S.party[0].lvl = 60; PokeApp.debug.healAll(); PokeApp.debug.save(); });
  if (GR.includes(1)) {
    await ev(() => PokeApp.debug.go('more')); await shot('more', 300);
    await ev(() => PokeApp.debug.go('rogue')); await shot('rogue', 300);
    await click('[data-a="rgstart"]'); ok(await ev(() => PokeApp.debug.S.rogue.run.party.length === 3), `${tag} corrida com 3 Pokémon`); await shot('rogue-run', 300);
    await click('[data-a="rgfight"]'); await p.waitForTimeout(2600); ok(await ev(() => !!(PokeApp.debug.B && PokeApp.debug.B.o.rogue)), `${tag} onda 1 começou`); await shot('rogue-battle', 100);
    await winBattle(); await p.waitForTimeout(3500); for (let i = 0; i < 10 && !(await ev(() => !!document.querySelector('.rgopt'))); i++) await p.waitForTimeout(700);
    ok(await ev(() => document.querySelectorAll('.rgopt').length === 3), `${tag} escolha 1 de 3`); await shot('rogue-choose', 500);
    await ev(() => { const o = [...document.querySelectorAll('.rgopt')]; (o.find(x => /Faixa|Colete|Pena|Fruta/.test(x.textContent)) || o[0]).click(); }); await p.waitForTimeout(500);
    ok(await ev(() => PokeApp.debug.S.rogue.run.wave === 2), `${tag} avançou para onda 2`);
    // pular para onda 10 (chefe)
    await ev(() => { const r = PokeApp.debug.S.rogue.run; r.wave = 10; r.party.forEach(m => { m.lvl = 45; m.hp = PE.maxhp(m); }); PokeApp.debug.render(); }); await shot('rogue-boss-card', 300);
    await click('[data-a="rgfight"]'); await p.waitForTimeout(2600); ok(await ev(() => PokeApp.debug.B.s.sides[1].party[0].raidHp > 1), `${tag} chefe da onda 10`); await shot('rogue-boss', 100);
    await winBattle(); for (let i = 0; i < 14 && !(await ev(() => !!document.querySelector('.rgopt'))); i++) await p.waitForTimeout(700);
    ok(await ev(() => !!document.querySelector('.biomeup')), `${tag} troca de bioma`); await ev(() => document.querySelector('.rgopt').click()); await p.waitForTimeout(500);
    ok(await ev(() => !!document.querySelector('.modal') && /Loja do Lago/.test(document.querySelector('#modal-root').textContent)), `${tag} loja a cada 5 ondas`); await shot('rogue-shop', 300); await clr();
    const tk0 = await ev(() => PokeApp.debug.S.bag['egg-token'] || 0); await ev(() => PokeApp.rogue.over()); await shot('rogue-over', 400); await clr();
    ok(await ev(() => PokeApp.debug.S.rogue.best === 10 && (PokeApp.debug.S.bag['egg-token'] || 0) > 0), `${tag} recorde 10 + Fichas de Ovo`);
    await ev(() => PokeApp.debug.go('rogue')); await click('[data-a="rgegg"][data-k="common"]'); ok(await ev(() => PokeApp.debug.S.eggs.length >= 1), `${tag} ovo comprado com fichas`);
    // diário
    await click('[data-a="rgdaily"]'); const sd = await ev(() => PokeApp.debug.S.rogue.run.seed); ok(sd.startsWith('daily:'), `${tag} desafio diário ${sd}`);
    const t1 = await ev(() => PokeApp.rogue.team(PokeApp.debug.S.rogue.run).team.map(m => m.id + ':' + m.lvl).join()), t2 = await ev(() => PokeApp.rogue.team(PokeApp.debug.S.rogue.run).team.map(m => m.id + ':' + m.lvl).join());
    ok(t1 === t2, `${tag} mesma semente → mesma onda (${t1})`); await ev(() => { PokeApp.debug.S.rogue.run.wave = 7; PokeApp.rogue.over(); }); await clr(); await ev(() => PokeApp.debug.go('rogue')); await shot('rogue-daily', 400);
    ok(await ev(() => !document.querySelector('[data-a="rgdaily"]') && document.querySelectorAll('.board li').length >= 1), `${tag} 1x por dia + ranking`);
    // cápsulas
    await ev(() => { PokeApp.debug.S.bag['capsule-token'] = 40; PokeApp.debug.go('caps'); }); await shot('caps', 300);
    await click('[data-a="cappull"][data-n="10"]'); await p.waitForTimeout(3400); await shot('caps-open', 200); await click('#capok');
    ok(await ev(() => PokeApp.debug.S.caps.pulls === 10), `${tag} 10 giros`);
    await ev(() => { PokeApp.debug.S.caps.pity = 29; PokeApp.debug.render(); }); await click('[data-a="cappull"][data-n="1"]'); await p.waitForTimeout(3400); await shot('caps-legend', 200);
    console.log(await ev(() => JSON.stringify([PokeApp.debug.S.caps.pity, PokeApp.debug.S.caps.pulls, PokeApp.debug.S.caps.log.slice(-1)[0].r]))); ok(await ev(() => PokeApp.debug.S.caps.log.slice(-1)[0].r === 'l' && PokeApp.debug.S.caps.pity === 0), `${tag} garantia (pity) em 30`); await click('#capok');
    const dup = await ev(() => { const S = PokeApp.debug.S; for (let i = 0; i < 300; i++) { const r = PokeApp.rogue.caps(); PokeApp.rogue.give(r.p); } const c = {}; return S.caps.log.length >= 0 && Object.keys(S.house.owned).filter(k => S.house.owned[k] > 1 && k.startsWith('g')).length; });
    ok(dup === 0, `${tag} sem duplicatas de únicos`); await ev(() => PokeApp.debug.go('style')); await shot('style-caps', 300);
  }
  if (GR.includes(2)) { await clr();
    const sh = await ev(() => { const c = PokeApp.events.nextCDs(3).find(c => c.start > Date.now() - 864e5 * 40) || PokeApp.events.nextCDs(1)[0]; PokeApp.evShift = c.start + 3600e3 - Date.now(); return c; });
    await ev(() => PokeApp.debug.go('home')); await shot('home-cd', 400); ok(await ev(() => !!document.querySelector('.evbanner.live')), `${tag} banner Dia da Comunidade ao vivo`);
    await ev(() => PokeApp.debug.go('events')); await shot('events-cd', 400); ok(await ev(() => !!document.querySelector('.evcal') && !!document.querySelector('.cdn')), `${tag} tela de eventos + contagem`);
    const n = await ev(id => { let k = 0; for (let i = 0; i < 200; i++) { const e = PokeApp.events.eventSpawn({}); if (e && e.id === id) k++; } return k; }, sh.id); ok(n > 80, `${tag} destaque aparece muito (${n}/200)`);
    await ev(c => { const D = PokeApp.debug, m = D.S.party[0]; const fam = { 1: 2, 4: 5, 7: 8, 147: 148, 133: 134, 152: 153, 155: 156, 158: 159, 246: 247, 66: 67, 179: 180, 35: 36 }; m.id = c.id; m.moves = m.moves.slice(0, 2); window.__mv = null; PokeApp.events.evolve(m, fam[c.id]).then(() => { window.__mv = m.moves.map(x => x.n); }); }, sh); let mv = null; for (let i = 0; i < 40 && !mv; i++) { await p.waitForTimeout(500); mv = await ev(() => { const b = document.querySelector('#modal-root button:not([disabled])'); if (b && !/Parar/.test(b.textContent)) b.click(); return window.__mv; }); } mv = mv || [];
    await clr(); ok(mv.includes(sh.move), `${tag} golpe exclusivo ao evoluir (${sh.move})`);
    const sp = await ev(() => { const s = PokeApp.events.spOf(Date.now()); PokeApp.evShift = s.start + 600e3 - Date.now(); return PokeApp.events.liveEv().some(e => e.kind === 'sp'); }); ok(sp, `${tag} Hora do Holofote ao vivo (terça 18h)`);
    await ev(() => PokeApp.debug.go('home')); await shot('home-sp', 400); await ev(() => PokeApp.debug.go('events')); await shot('events-sp', 400); await ev(() => { PokeApp.evShift = 0; });
  }
  ok(!errs.length, `${tag} sem erros JS ${JSON.stringify(errs)}`); await b.close(); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
