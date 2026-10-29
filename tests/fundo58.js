// v58: fundo da batalha pelo local do mapa + dia/noite
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-fundo-${LIVE}${n}-v58.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
const WANT = { 'Rota 1': 'meadow', 'Floresta de Viridian': 'forest', 'Mt. Moon': 'cave', 'Lago da Fúria': 'water', 'Cabo de Cerulean': 'beach', 'Usina Elétrica': 'city', 'Ilhas Seafoam': 'snow', 'Monte Brasa': 'volcano', 'Torre Pokémon': 'ghost', 'Resort do Deserto & Castelo Relíquia': 'desert', 'Grande Pântano': 'swamp', 'Ruínas de Alph': 'ruins', 'Torre do Sino': 'mountain' };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const errs = [];
  for (const [hr, tag] of [[12, 'dia'], [22, 'noite']]) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message + ' @ ' + String(e.stack).split('\n').slice(1,3).join(' '))); const ev = (f, a) => p.evaluate(f, a);
    await p.clock.setFixedTime(at(hr));
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await clr();
    const start = n => ev(n => { document.querySelector('#battle')?.remove(); const m = PokeApp.C.MAPS.find(x => x.name === n); PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[16, 10]], 1, 0), map: m }); }, n);
    const bio = () => ev(() => (document.querySelector('#battle .bpar').className.match(/bio-(\w+)/) || [])[1]);
    if (tag === 'dia') {
      for (const [n, w] of Object.entries(WANT)) { await start(n); await p.waitForTimeout(150); const g = await bio(); ok(g === w, `${n} → ${g} (esperado ${w})`); }
      const all = await ev(() => PokeApp.C.MAPS.map(m => PokeApp.biomeFor({ map: m }))); ok(new Set(all).size >= 12, `${new Set(all).size} cenários diferentes nos ${all.length} mapas`);
      const imgs = await ev(async () => { const bs = [...new Set(PokeApp.C.MAPS.map(m => PokeApp.biomeFor({ map: m })).concat(['arena', 'ruins']))]; const r = []; for (const x of bs) for (const k of ['sky', 'hills', 'fg']) r.push((await fetch(`img/bg/${x}-${k}.svg`)).ok); return r.every(Boolean); });
      ok(imgs, 'todas as imagens de fundo existem');
      await ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.startBattle({ kind: 'trainer', gym: 0, name: 'Brock', sprite: 'brock', enemy: PokeApp.debug.mkTeam([[74, 12]], 1, 0) }); }); await p.waitForTimeout(150);
      ok(await bio() === 'arena', 'ginásio → arena');
      await start('Cabo de Cerulean'); await p.waitForTimeout(3200); await clr(); await p.screenshot({ path: OUT('praia-dia') });
      await start('Monte Brasa'); await p.waitForTimeout(3200); await clr(); await p.screenshot({ path: OUT('vulcao-dia') });
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const fps = await ev(() => new Promise(r => { let n = 0, t0 = performance.now(); const f = t => { n++; if (t - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / ((t - t0) / 1000))); }; requestAnimationFrame(f); })); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      ok(fps >= 50, `batalha com fundo novo: ${fps} fps (CPU 4x)`);
    } else {
      await start('Cabo de Cerulean'); await p.waitForTimeout(3200); await clr();
      const r = await ev(() => { const q = s => getComputedStyle(document.querySelector('#battle .bpar ' + s)); return { st: q('.starl').display, f: q('.sky').filter }; });
      ok(r.st === 'block' && /brightness\(0\.32/.test(r.f), 'noite: céu escurece e aparecem estrelas/lua ' + JSON.stringify(r));
      await p.screenshot({ path: OUT('praia-noite') });
      await start('Floresta de Viridian'); await p.waitForTimeout(3200); await clr(); await p.screenshot({ path: OUT('floresta-noite') });
      const emo = await ev(() => /\p{Extended_Pictographic}/u.test(document.querySelector('#battle').innerText)); ok(!emo, 'sem emoji na batalha');
    }
    await ctx.close();
  }
  ok(!errs.length, 'sem erros JS ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
