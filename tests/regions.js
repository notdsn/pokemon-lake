// Teste genérico de região: node tests/regions.js [URL] hoenn
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', K = process.argv[3] || 'hoenn', OUT = '/workspace/pokemon-lake/prints/v2/', TAG = (URL.includes('github.io') ? 'live-' : '') + K;
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.stack); });
  const shot = async n => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}375x667-reg-${TAG}-${n}.png` }); }; const ev = (f, a) => p.evaluate(f, a); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  const busy = async () => { for (let w = 0; w < 60 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(250); };
  const win = async () => { for (let w = 0; w < 20 && !(await ev(() => !!PokeApp.debug.B)); w++) await p.waitForTimeout(250);
    for (let t = 0; t < 40 && await ev(() => !!PokeApp.debug.B && !PokeApp.debug.B.s.over); t++) { await busy(); await ev(() => { const B = PokeApp.debug.B; if (!B || B.busy) return; B.s.sides[1].party.forEach(m => m.hp = m === B.s.sides[1].b.m ? 1 : 0); const pm = B.s.sides[0].b.m; pm.lvl = 100; pm.raidHp = 20; pm.hp = PokeApp.PE.maxhp(pm); pm.status = null; pm.moves[0] = { n: PDATA.mons[B.s.sides[1].b.m.id].t.includes('ghost') ? 'shadow-ball' : 'swift', pp: 20 }; PokeApp.debug.act({ type: 'move', n: pm.moves[0].n }); }); await p.waitForTimeout(700); }
    if (process.env.DBG) console.log('WIN', await ev(() => { const B = PokeApp.debug.B; return B ? [B.s.over, B.s.winner, B.s.turn, B.s.sides.map(x => x.party.map(m => m.id + ':' + m.hp)), document.querySelector('#blog, .blog')?.innerText.slice(-300)] : 'nob'; }));
    for (let w = 0; w < 40 && await ev(() => !!PokeApp.debug.B); w++) await p.waitForTimeout(300); await p.waitForTimeout(600); };
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary'); await p.waitForTimeout(600); await clr();
  const info = await ev(K => { const S = PokeApp.debug.S, G = PokeApp.regions; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = true; S.jbadges = [0, 1, 2, 3, 4, 5, 6, 7]; S.jchampion = true; S.party[0].lvl = 100; PokeApp.debug.healAll();
    const before = G.REG_ORDER.slice(0, G.REG_ORDER.indexOf(K)); const locked = !G.rOpen(K) || before.length === 0; before.forEach(k => { const s = G.rS(k); s.b = [0, 1, 2, 3, 4, 5, 6, 7]; s.ch = true; s.chs = 1; });
    PokeApp.debug.save(); const r = G.REG[K]; return { open: G.rOpen(K), lockedBefore: locked, maps: r.MAPS.length, legends: r.MAPS.flatMap(m => m.enc.filter(e => e[4] && e[4].legend).map(e => e[0])), goal: G.rGoal() }; }, K);
  ok(info.open, `${K} aberta depois do Campeão anterior`); ok(info.maps >= 7, `${info.maps} mapas`); ok(info.legends.length >= 2, 'lendários: ' + info.legends.join(',')); ok(info.goal && info.goal.reg === K, 'próximo objetivo: ' + (info.goal && info.goal.t));
  await ev(K => { PokeApp.debug.S.region = K; PokeApp.debug.go('maps'); }, K); await p.waitForTimeout(500);
  const mp = await ev(() => [document.querySelectorAll('.mapc').length, document.querySelectorAll('.mapc.locked').length, document.querySelector('.seg.region button.on')?.textContent]);
  ok(mp[0] === info.maps && mp[1] >= info.maps - 1, 'tela de mapas ' + JSON.stringify(mp)); await shot('mapas');
  await ev(() => document.querySelector('.mapc:not(.locked)').click()); await p.waitForTimeout(600); await shot('mapa1');
  await ev(K => { PokeApp.debug.go('battle'); }, K); await p.waitForTimeout(400); ok(await ev(() => document.querySelectorAll('.gym').length === 8 && document.querySelectorAll('.gym .badge.pin img').length === 8), '8 ginásios com insígnias de metal'); await shot('ginasios');
  await ev(K => PokeApp.debug.runAct('rgym', { k: K, i: 0 }), K); await win();
  for (let w = 0; w < 20 && !(await ev(() => !!document.querySelector('.badgewin .badge.pin'))); w++) await p.waitForTimeout(300);
  ok(await ev(K => PokeApp.regions.rS(K).b.includes(0) && !!document.querySelector('.badgewin .badge.pin img'), K), 'venceu ginásio 1 + tela da insígnia'); await shot('insignia'); await clr();
  ok(await ev(K => { const m = PokeApp.debug.S; return PokeApp.regions.REG[K].MAPS.filter(x => !x.req.ch && x.req.b <= 1).every(x => document && PokeApp.regions.rUnl(x)); }, K), 'mapas da 1ª insígnia liberados');
  await ev(K => { const s = PokeApp.regions.rS(K); s.b = [0, 1, 2, 3, 4, 5, 6, 7]; PokeApp.debug.healAll(); PokeApp.debug.save(); }, K);
  for (let i = 0; i < 5; i++) { await clr(); await ev(K => { PokeApp.debug.healAll(); PokeApp.debug.runAct('rleague', { k: K }); }, K); await win(); }
  for (let w = 0; w < 20 && !(await ev(() => !!document.querySelector('.badgewin .crown'))); w++) await p.waitForTimeout(300);
  ok(await ev(K => PokeApp.regions.rS(K).ch, K), 'Campeão da região ' + JSON.stringify(await ev(K => [PokeApp.regions.rS(K), !!PokeApp.debug.B, document.querySelector('#modal-root').innerText.slice(0, 80)], K))); await shot('campeao'); await clr();
  ok(await ev(K => PokeApp.regions.REG[K].MAPS.every(x => PokeApp.regions.rUnl(x)), K), 'todos os mapas liberados (incl. pós-campeão)');
  await ev(() => PokeApp.debug.go('card')); await p.waitForTimeout(400); ok(await ev(K => document.querySelectorAll(`.badgegrid img[src*="/${PokeApp.regions.REG[K].k}"]`).length >= 8, K), 'estojo mostra insígnias da região');
  await ev(() => document.querySelectorAll('.badgegrid')[document.querySelectorAll('.badgegrid').length - 1].scrollIntoView()); await shot('estojo');
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
