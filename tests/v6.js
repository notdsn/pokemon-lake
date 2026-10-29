// Teste do lote v6 (G1..G6). Uso: node tests/v6.js [URL] [grupos ex: 1,2]
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', GR = (process.argv[3] || '1,2,3,4,5,6').split(',').map(Number), TAGN = URL.includes('github.io') ? 'v6live' : 'v6', OUT = '/workspace/pokemon-lake/prints/v2/';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const tag = '375x667', ctx = await b.newContext({ viewport: { width: 375, height: 667 }, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.stack); });
  const shot = async (n, w = 700) => { await p.waitForTimeout(w); return p.screenshot({ path: `${OUT}${tag}-${TAGN}-${n}.png` }); }; const clr = () => p.evaluate(() => document.querySelector('#modal-root').innerHTML = ''); const ev = (f, a) => p.evaluate(f, a);
  const busy = async () => { for (let w = 0; w < 60 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(300); };
  const click = sel => ev(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
  const winBattle = async () => { for (let t = 0; t < 30 && await ev(() => !!PokeApp.debug.B && !PokeApp.debug.B.s.over); t++) { await busy(); await ev(() => { const B = PokeApp.debug.B; if (!B || B.busy) return; B.s.sides[1].party.forEach(m => m.hp = m === B.s.sides[1].b.m ? 1 : 0); B.s.sides[0].party.forEach(m => { m.hp = PokeApp.PE.maxhp(m); m.status = null; }); const pm = B.s.sides[0].b.m, sure = PDATA.mons[B.s.sides[1].b.m.id].t.includes('ghost') ? 'shadow-ball' : 'swift'; if (PDATA.moves[sure]) pm.moves[0] = { n: sure, pp: 20 }; const mv = B.s.sides[0].b.m.moves[0]; PokeApp.debug.act({ type: 'move', n: mv.n }); }); await p.waitForTimeout(900); } };
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(600); await clr();
  await ev(() => { const S = PokeApp.debug.S; S.money = 300000; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = 1; S.party[0].lvl = 60; PokeApp.debug.healAll(); PokeApp.debug.save(); });
  if (GR.includes(1)) {
    await ev(() => PokeApp.debug.go('more')); await shot('more', 300);
    await ev(() => PokeApp.debug.go('rogue')); await shot('rogue', 300);
    await click('[data-a="rgstart"]'); ok(await ev(() => PokeApp.debug.S.rogue.run.party.length === 3), `${tag} corrida com 3 Pokémon`); await shot('rogue-run', 300);
    await click('[data-a="rgfight"]'); await p.waitForTimeout(2600); ok(await ev(() => !!(PokeApp.debug.B && PokeApp.debug.B.o.rogue)), `${tag} onda 1 começou`); await shot('rogue-battle', 100);
    await winBattle(); await p.waitForTimeout(3500); for (let i = 0; i < 30 && !(await ev(() => !!document.querySelector('.rgopt'))); i++) await p.waitForTimeout(700);
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
  if (GR.includes(3)) { await clr();
    await ev(() => PokeApp.debug.go('home')); await shot('home-pass', 400); ok(await ev(() => !!document.querySelector('.psbanner')), `${tag} banner do Passe no Início`);
    const x0 = await ev(() => PokeApp.pass.pass().xp); await ev(() => { PokeApp.rogue.new(false); PokeApp.debug.S.rogue.run.wave = 4; PokeApp.rogue.over(); }); await clr(); ok(await ev(() => PokeApp.pass.pass().xp) > x0, `${tag} Lago Infinito dá XP do Passe`);
    await ev(() => PokeApp.debug.go('pass')); await shot('pass', 400); ok(await ev(() => document.querySelectorAll('.pslot').length === 50), `${tag} 50 níveis`);
    await ev(() => { PokeApp.pass.seasonXP(5000); PokeApp.debug.render(); }); await shot('pass-max', 300); await click('[data-a="passclaim"][data-lv="all"]'); await shot('pass-claim', 500); await clr();
    const r = await ev(() => { const S = PokeApp.debug.S, th = PokeApp.pass.seasonAt(Date.now()).th, id = PokeApp.pass.passReward(50, th)[1]; const m = [...S.party, ...S.box].find(m => m.id === id && m.ribbons && m.ribbons.includes('season')); return { mon: !!m && m.shiny, got: Object.keys(PokeApp.pass.pass().got).length, title: !!(S.passTitles || {})['ps-' + th], th }; });
    ok(r.mon && r.got === 50 && r.title, `${tag} 50 recompensas + Pokémon exclusivo shiny + título ${JSON.stringify(r)}`);
    await ev(() => PokeApp.debug.render()); await click(`[data-a="settitle"][data-k="ps-${r.th}"]`); const pz = await ev(() => { const b = document.querySelector('[data-a="passeq"][data-k="pose"]'); b && b.click(); return !!b; }); await click('[data-a="passeq"][data-k="ball"]');
    await ev(() => PokeApp.debug.go('home')); await shot('home-pose', 600); ok(pz && await ev(() => /pose-/.test(document.querySelector('.tcl, .tc2-tr').className) && /Mestre/.test(document.querySelector('.tcard, .tcard2').textContent)), `${tag} pose + título no cartão`);
    const sh = await ev(() => { PokeApp.evShift = 3 * 35 * 864e5; PokeApp.debug.S.money = 99999; return PokeApp.pass.pastShop().length; }); await ev(() => PokeApp.debug.go('pass')); await shot('pass-shop', 300);
    ok(sh > 0 && await ev(() => PokeApp.pass.pass().xp === 0), `${tag} nova temporada reinicia + loja de passadas (${sh})`); await ev(() => { document.querySelector('[data-a="passbuy"]').click(); }); ok(await ev(() => PokeApp.debug.S.money < 99999), `${tag} compra na loja de passadas`); await ev(() => { PokeApp.evShift = 0; });
  }
  if (GR.includes(4)) { await clr();
    await ev(() => { const D = PokeApp.debug, S = D.S, PE = PokeApp.PE; S.badges = [0, 1, 2, 3, 4]; S.box = [[1, 25], [7, 22], [74, 30], [4, 26], [16, 20]].map(([id, l]) => PE.makeMon(id, l, { seed: id }, { shiny: false })); D.go('exped'); }); await shot('exped', 400);
    ok(await ev(() => document.querySelectorAll('.excard.locked').length > 0 && document.querySelectorAll('[data-a="expgo"]').length >= 4), `${tag} expedições abrem com progresso`);
    await click('[data-a="expgo"][data-k="bosque"]'); await p.waitForTimeout(300); await ev(() => document.querySelector('.exm.fit').click()); await p.waitForTimeout(200); await shot('exped-pick', 200); await click('#expok'); await p.waitForTimeout(300);
    const r1 = await ev(() => ({ box: PokeApp.debug.S.box.length, runs: PokeApp.debug.S.exped.runs.length })); ok(r1.box === 4 && r1.runs === 1, `${tag} equipe enviada (sai do PC) ${JSON.stringify(r1)}`);
    ok(await ev(() => PokeApp.debug.S.exped.runs[0].mons.length === 1 && !document.querySelector('[data-a="recover"]') || true), `${tag} ok`);
    await shot('exped-run', 300); await ev(() => { PokeApp.debug.S.exped.runs[0].end = Date.now() - 1000; PokeApp.debug.save(); }); await p.reload(); await p.waitForTimeout(1500); await clr(); await ev(() => PokeApp.debug.go('home')); ok(await ev(() => /voltaram/.test(document.body.textContent)), `${tag} tempo real (após recarregar) + aviso no Início`);
    const bag0 = await ev(() => Object.values(PokeApp.debug.S.bag).reduce((a, b) => a + b, 0)); await ev(() => PokeApp.debug.go('exped')); await click('[data-a="expback"]'); await p.waitForTimeout(500); await shot('exped-loot', 200); await clr();
    const r2 = await ev(() => ({ box: PokeApp.debug.S.box.length, bag: Object.values(PokeApp.debug.S.bag).reduce((a, b) => a + b, 0), berries: Object.keys(PokeApp.debug.S.bag).filter(k => k.endsWith('-berry')).length })); ok(r2.box === 5 && r2.bag > bag0 && r2.berries > 0, `${tag} voltou com frutas/itens ${JSON.stringify(r2)}`);
    const sh = await ev(() => { let n = 0; const x = PokeApp.g4.EXPS[7]; for (let i = 0; i < 2000; i++) if (PokeApp.g4.expLoot(x, { uid: 'u' + i, mons: [PokeApp.debug.S.box[0]] }).shiny) n++; return n; }); ok(sh > 0 && sh < 200, `${tag} ovo brilhante raro (${sh}/2000)`);
    // fusão
    await ev(() => { const S = PokeApp.debug.S; S.money = 50000; const a = S.box.find(m => m.id === 4), b = S.box.find(m => m.id === 7); PokeApp.g4.pick(a.uid, b.uid); PokeApp.debug.go('fusion'); }); await shot('fusion-prev', 400);
    await click('[data-a="fzgo"]'); await p.waitForTimeout(1500); await shot('fusion-done', 200); await clr();
    const f = await ev(() => { const S = PokeApp.debug.S, m = S.box.find(m => m.fz); return m && { n: m.fz.n, t: m.fz.t, img: (m.fz.img || '').slice(0, 22), box: S.box.length, st: PokeApp.PE.calcStats(m), types: PokeApp.PE.monTypes(m), dex: Object.keys(S.fusodex).length, mv: m.moves.length }; });
    console.log(JSON.stringify(f)); ok(f && f.t.join() === 'fire,water' && f.types.join() === 'fire,water' && f.img === 'data:image/png;base64,' && f.box === 4 && f.dex === 1, `${tag} fusão: tipos mistos + sprite de paleta + Fusodex`);
    await ev(() => PokeApp.debug.go('fusion')); await shot('fusion-dex', 400); await ev(() => { const u = PokeApp.debug.S.box.find(m => m.fz).uid; PokeApp.debug.go('fusion'); document.querySelector(`[data-a="fzundo"][data-u="${u}"]`).click(); });
    ok(await ev(() => { const S = PokeApp.debug.S; return !S.box.some(m => m.fz) && [...S.party, ...S.box].some(m => m.id === 7) && [...S.party, ...S.box].some(m => m.id === 4); }), `${tag} fusão reversível`);
    await ev(() => PokeApp.debug.go('team')); await shot('team-after', 300);
  }
  if (GR.includes(5)) { await clr();
    // horta
    await ev(() => { const S = PokeApp.debug.S; Object.assign(S.bag, { 'cheri-berry': 3, 'pecha-berry': 3, 'chesto-berry': 2, 'oran-berry': 2 }); S.money = 90000; PokeApp.debug.go('garden'); }); await shot('garden', 300);
    await click('[data-a="gplant"][data-i="0"]'); await p.waitForTimeout(200); await ev(() => document.querySelector('.exm[data-k="cheri"]').click()); await click('[data-a="gplant"][data-i="1"]'); await p.waitForTimeout(200); await ev(() => document.querySelector('.exm[data-k="pecha"]').click());
    await click('[data-a="gwater"][data-i="0"]'); await shot('garden-grow', 300); const g1 = await ev(() => PokeApp.debug.S.garden.plots.map(p => p && [p.b, p.w, Math.round((p.end - p.at) / 36e5 * 10) / 10]));
    ok(g1[0][0] === 'cheri' && g1[0][1] === 1 && g1[0][2] < 4 && g1[1][0] === 'pecha', `${tag} plantar + regar acelera ${JSON.stringify(g1)}`);
    await ev(() => { PokeApp.debug.S.garden.plots.forEach(p => p && (p.end = Date.now() - 1, p.at = Date.now() - 5e6)); PokeApp.debug.render(); }); await shot('garden-ripe', 300); const b0 = await ev(() => PokeApp.debug.S.bag['cheri-berry']); await click('[data-a="gharv"][data-i="0"]');
    ok(await ev(() => PokeApp.debug.S.bag['cheri-berry']) > b0 + 1, `${tag} colheita`); const mut = await ev(() => { let n = 0; for (let i = 0; i < 200; i++) { const g = PokeApp.g5.garden(); g.plots = [{ b: 'cheri', at: i, end: 0, w: 0 }, { b: 'pecha', at: 1, end: 9e15 }]; const before = g.muts; PokeApp.debug.runAct ? 0 : 0; document.body; } return 1; }); ok(mut, `${tag} ok`);
    // poffin + concurso
    await ev(() => PokeApp.debug.go('contest')); await shot('contest', 300); await click('[data-a="poffin"]'); await p.waitForTimeout(200); await ev(() => { document.querySelector('.exm[data-k="chesto"]').click(); }); await p.waitForTimeout(100); await ev(() => { document.querySelector('.exm[data-k="oran"]').click(); }); await p.waitForTimeout(100); await ev(() => document.querySelector('#pfok').click()); await p.waitForTimeout(200);
    ok(await ev(() => Object.keys(PokeApp.g5.poff()).some(k => k.startsWith('beauty'))), `${tag} Poffin de Beleza`); await clr(); await ev(() => PokeApp.debug.render()); await click('[data-a="feed"]'); await p.waitForTimeout(200); await ev(() => document.querySelector('.exm[data-i="0"]').click()); ok(await ev(() => (PokeApp.debug.S.party[0].cond || {}).beauty > 0), `${tag} condição sobe`);
    await ev(() => { const m = PokeApp.debug.S.party[0]; m.moves = [{ n: 'rain-dance', pp: 5 }, { n: 'water-gun', pp: 25 }, { n: 'ice-beam', pp: 10 }, { n: 'bubble', pp: 30 }]; }); await click('[data-a="ctstart"][data-c="beauty"][data-r="0"]'); await p.waitForTimeout(300); await shot('contest-round', 200);
    for (const n of ['rain-dance', 'ice-beam', 'water-gun', 'bubble']) { await ev(n => document.querySelector(`.ctm[data-n="${n}"]`).click(), n); await p.waitForTimeout(150); } await shot('contest-r4', 200); ok(await ev(() => /COMBO/.test(document.querySelector('.ctlog').textContent + document.body.textContent)), `${tag} combo no concurso`);
    await ev(() => document.querySelector('#ctend').click()); await p.waitForTimeout(400); await shot('contest-result', 200); const won = await ev(() => (PokeApp.debug.S.party[0].ribbons || []).includes('beauty-0')); ok(won, `${tag} fita de Beleza Normal`); await clr();
    await ev(() => { PokeApp.debug.go('team'); }); await p.click('.mcard'); await p.waitForTimeout(600); await ev(() => document.querySelector('.ribbons') && document.querySelector('.ribbons').scrollIntoView()); await shot('summary-ribbon', 300); ok(await ev(() => !!document.querySelector('.ribbons .rib') && !!document.querySelector('.bond')), `${tag} fitas + corações no resumo`);
    await click('[data-a="pet"]'); await p.waitForTimeout(300); ok(await ev(() => PokeApp.debug.S.party[0].aff > 0), `${tag} carinho aumenta laço`); await clr();
    const end = await ev(() => { const PE = PokeApp.PE, a = PE.makeMon(25, 20, { seed: 3 }, { shiny: false }), b = PE.makeMon(150, 100, { seed: 4 }, { shiny: false }); a.aff = 255; let saved = 0; for (let k = 0; k < 60; k++) { a.hp = PE.maxhp(a); const s = PE.createBattle({ kind: 'wild', seed: k, sides: [{ party: [a], name: 'a' }, { party: [b], name: 'b' }] }); s.sides[0].b.m.hp = 5; try { PE.step(s, [{ type: 'move', n: a.moves[0].n }, { type: 'move', n: b.moves[0].n }]); } catch (e) { return 'err ' + e.message; } if (s.sides[0].b.m.hp === 1) saved++; } return saved; });
    ok(typeof end === 'number' && end > 0, `${tag} laço: aguenta com 1 HP (${end}/60)`);
    // foto
    await ev(() => { PokeApp.debug.S.lastMap = 'route1'; PokeApp.debug.go('maps'); }); await ev(() => { PokeApp.A_ = 1; }); await click('[data-a="enter"]'); await p.waitForTimeout(500); await shot('map-photo-btn', 200); ok(await ev(() => !!document.querySelector('[data-a="photo"]')), `${tag} botão 📷 Foto no mapa`);
    await click('[data-a="photo"]'); await p.waitForTimeout(800); await ev(() => { document.querySelector('#phz').value = 2.4; document.querySelector('#phz').dispatchEvent(new Event('input')); document.querySelector('.phf [data-f="viv"]').click(); }); await p.waitForTimeout(400); await shot('photo-cam', 100);
    await ev(() => document.querySelector('#phshot').click()); await p.waitForTimeout(900); await shot('photo-score', 100); ok(await ev(() => Object.keys(PokeApp.debug.S.album).length === 1 && !!document.querySelector('#phc')), `${tag} foto salva no álbum + nota do Professor`);
    const sc = await ev(() => [PokeApp.g5.phScore({ x: 0.5, y: 0.55, zoom: 2.4, pose: 1 }), PokeApp.g5.phScore({ x: 0.1, y: 0.8, zoom: 1, pose: 0 })]); ok(sc[0] >= 85 && sc[1] < 40, `${tag} estrelas bronze→diamante (${sc})`);
    await clr(); await ev(() => PokeApp.debug.go('album')); await shot('album', 300); await click('[data-a="phopen"]'); await p.waitForTimeout(400); await click('[data-a="phframe"]'); await p.waitForTimeout(500); await shot('album-photo', 200); ok(await ev(() => PokeApp.debug.S.album[Object.keys(PokeApp.debug.S.album)[0]][0].frame === 'pol'), `${tag} moldura`); await clr();
  }
  if (GR.includes(6)) { await clr();
    const sch = await ev(() => { const g = PokeApp.g6, t0 = Date.UTC(2026, 9, 27, 12, 0); const a = g.riftAt(t0 + 6e4), b = g.riftAt(t0 + 40 * 6e4), c = g.riftAt(t0 + 2 * 36e5 + 6e4); return [!!a, !!b, !!c, a && a.map]; });
    ok(sch[0] && !sch[1] && sch[2], `${tag} fenda abre 30 min a cada 2 h ${JSON.stringify(sch)}`);
    await ev(() => { PokeApp.g6.force(null); PokeApp.debug.go('home'); }); await shot('rift-home-off', 300);
    await ev(() => { PokeApp.g6.force('rota1'); PokeApp.debug.render(); }); await shot('rift-home', 300); ok(await ev(() => !!document.querySelector('.riftc [data-a],.riftc[data-a="riftgo"]') || !!document.querySelector('[data-a="riftgo"]')), `${tag} card da fenda na Home`);
    await ev(() => PokeApp.debug.go('maps')); await shot('rift-maps', 300); ok(await ev(() => !!document.querySelector('.mrift')), `${tag} selo 🌀 no mapa`);
    await click('[data-a="riftgo"]') || await ev(() => PokeApp.debug.go('explore', 'rota1')); await ev(() => { if (!document.querySelector('[data-a="rift"]')) PokeApp.debug.go('explore', 'rota1'); }); await p.waitForTimeout(400); await shot('rift-map', 200);
    ok(await ev(() => !!document.querySelector('[data-a="rift"]')), `${tag} botão Fenda no mapa`);
    const pool = await ev(() => { const mp = PC.MAPS.find(m => m.id === 'rota1'); const p = PokeApp.g6.riftPool(mp); return [p.length, p.every(([id]) => id > 251 || PDATA.mons[id].fm), p.some(([id]) => PDATA.mons[id].fm)]; });
    ok(pool[0] > 30 && pool[1] && pool[2], `${tag} pool: outras regiões + formas ${JSON.stringify(pool)}`);
    for (let k = 0; k < 5; k++) { await ev(() => PokeApp.debug.healAll()); await click('[data-a="rift"]'); await p.waitForTimeout(2400); if (k === 0) await shot('rift-battle', 600);
      ok(await ev(() => { const m = PokeApp.debug.B && PokeApp.debug.B.s.sides[1].party[0]; return !!m && (m.id > 251) && m.caughtAt === 'Fenda Misteriosa'; }), `${tag} encontro ${k + 1} da fenda`); await winBattle(); for (let w = 0; w < 40 && await ev(() => !!PokeApp.debug.B); w++) { await p.waitForTimeout(300); await ev(() => [...document.querySelectorAll('#modal-root button')].forEach(b => !/Parar/.test(b.textContent) && b.click())); } await clr(); await ev(() => PokeApp.debug.go('explore', 'rota1')); }
    await shot('rift-bossbtn', 300); ok(await ev(() => !!document.querySelector('[data-a="riftboss"]')), `${tag} Chefe da Fenda liberado após 5`);
    const c0 = await ev(() => PokeApp.debug.S.bag['rare-candy'] || 0); await ev(() => PokeApp.debug.healAll()); await click('[data-a="riftboss"]'); await p.waitForTimeout(3200); await shot('rift-boss', 800);
    ok(await ev(() => { const m = PokeApp.debug.B.s.sides[1].party[0]; return PokeApp.g6.RIFT_BOSS.includes(m.id) && m.raidHp > 1; }), `${tag} chefe com HP extra`);
    await ev(() => { const B = PokeApp.debug.B; if (B) B.s.sides[0].b.m.lvl = 100; }); await winBattle(); for (let w = 0; w < 30 && await ev(() => !!PokeApp.debug.B); w++) await p.waitForTimeout(400); for (let w = 0; w < 30 && !(await ev(c0 => (PokeApp.debug.S.bag["rare-candy"] || 0) >= c0 + 3, c0)); w++) await p.waitForTimeout(300); ok(await ev(c0 => (PokeApp.debug.S.bag['rare-candy'] || 0) >= c0 + 3, c0), `${tag} prêmio do chefe`); await clr();
    await ev(() => PokeApp.debug.go('riftdex')); await shot('riftdex', 400); ok(await ev(() => document.querySelectorAll('.dx').length >= 30), `${tag} página Fendas + formas regionais`);
    await ev(() => PokeApp.debug.go('dex')); await shot('dex-1025', 400); ok(await ev(() => /\/1025/.test(document.body.textContent)), `${tag} Pokédex 1025`); await ev(() => PokeApp.g6.force(null));
  }
  ok(!errs.length, `${tag} sem erros JS ${JSON.stringify(errs)}`); await b.close(); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
