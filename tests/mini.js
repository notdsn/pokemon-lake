// Miniaturas chibi fora da batalha (375/320)
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => { for (const [W, RM] of [[375, 0], [320, 0], [375, 1]]) {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: W, height: 740 }, reducedMotion: RM ? "reduce" : "no-preference", deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const TAG = process.argv[3] || 'depois', SH = n => `/workspace/pokemon-lake/prints/v2/${W}-mini-${LIVE}${n}-${TAG}.png`, NEW = TAG === 'depois';
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  await p.waitForTimeout(500); await clr();
  await ev(() => { const d = PokeApp.debug, S = d.S; const t = d.mkTeam([[25, 20], [133, 20], [150, 70], [1, 20], [94, 30]], 1, 0); S.party.push(...t.slice(0, 5)); [4, 25, 133, 150, 1, 94, 7, 10, 143].forEach(i => { S.dex.seen[i] = 1; S.dex.caught[i] = 1; }); d.save(); });
  const views = [['home', null], ['team', null], ['dex', null], ['explore', 'floresta']];
  for (const [v, a] of views) { await ev(([v, a]) => PokeApp.debug.go(v, a), [v, a]); await p.waitForTimeout(900); await clr(); if (v === 'dex') { await ev(() => document.querySelector('img.mini')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(900); } if (!RM) await p.screenshot({ path: SH(v) });
    if (NEW) { const r = await ev(() => { const mini = [...document.querySelectorAll('img.mini')], vis = mini.filter(i => { const r = i.getBoundingClientRect(); return i.offsetWidth > 0 && r.top < innerHeight && r.bottom > 0; });
      const leg = [...document.querySelectorAll('img')].filter(i => /\/150\./.test(i.src)); const an = vis[0] ? getComputedStyle(vis[0]).animationName : '';
      return { n: vis.length, ok: vis.every(i => i.complete && i.naturalWidth > 0), leg: leg.map(i => [i.classList.contains('mini'), getComputedStyle(i).animationName]), an, inBattle: document.querySelectorAll('#battle img.mini').length }; });
      ok(r.n > 0 && r.ok, `${W}${RM ? ' reduzido' : ''} ${v}: ${r.n} miniaturas carregadas`);
      if (r.leg.length) ok(r.leg.every(l => !l[0] && (l[1] === 'none' || l[1] === '')), `${W} ${v}: Mewtwo (lendário) fica como está ${JSON.stringify(r.leg)}`);
      if (v === 'team' || v === 'dex') ok(RM ? r.an === 'none' : r.an === 'minihop', `${W} ${v}: animação ${r.an}`); } }
  if (NEW && !RM) { await ev(() => PokeApp.debug.go('team')); await p.waitForTimeout(600); await clr(); await ev(() => document.querySelector('img.mini').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    ok(await ev(() => !!document.querySelector('img.mini.mtap')), `${W}: toque faz o pop`);
    await ev(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[25, 10]], 1, 0), map: PokeApp.C.MAPS[1] })); await p.waitForTimeout(2500);
    ok(await ev(() => document.querySelectorAll('#battle img.mini').length === 0 && !!document.querySelector('#battle .bmon img[src*="img/front"], #battle .bmon img[src*="img/back"]')), `${W}: na batalha continua o sprite normal`);
    await p.screenshot({ path: SH('batalha') }); }
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | ')); await b.close(); }
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0);
})();
