// v71: Pesquisa de campo
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/'; const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-${LIVE}${n}-v71.png`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const ev = (f, a) => p.evaluate(f, a); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await clr();
  await ev(() => PokeApp.debug.go('home')); await p.waitForTimeout(300); await clr();
  const h = await ev(() => ({ row: !!document.querySelector('.hoje67 .hrow[data-t="field"]'), n: document.querySelectorAll('.hoje67 .hrow').length, f: PokeApp.fr71.field() }));
  ok(h.row && h.f.t.length === 3 && new Set(h.f.t.map(x => x.k)).size === 3, 'linha no Hoje com 3 tarefas diferentes');
  ok(await ev(() => JSON.stringify(PokeApp.fr71.field().t) === JSON.stringify(PokeApp.debug.S.fr.t)), 'tarefas fixas no dia');
  await p.click('.hrow[data-t="field"]'); await p.waitForTimeout(400); await clr();
  const v = await ev(() => ({ n: document.querySelectorAll('.frt').length, emo: /\p{Extended_Pictographic}/u.test(document.body.innerText), ovx: document.documentElement.scrollWidth <= innerWidth + 1 }));
  ok(v.n === 3 && !v.emo && v.ovx, 'tela da pesquisa sem emoji/overflow');
  await p.screenshot({ path: OUT('pesquisa-tela') });
  // completa uma tarefa
  const r = await ev(() => { const f = PokeApp.fr71.field(), x = f.t[0], m = { id: Object.keys(PDATA.mons).map(Number).find(i => x.ty ? PDATA.mons[i].t.includes(x.ty) : 1) }; for (let i = 0; i < x.n; i++) PokeApp.fr71.track(x.k === 'catchT' ? 'catch' : x.k, 1, m); return { p: x.p, n: x.n, st: f.st }; });
  ok(r.p === r.n && r.st === 1, 'tarefa concluída dá carimbo ' + JSON.stringify(r));
  // descoberta com 7 carimbos
  const d = await ev(() => { const S = PokeApp.debug.S, f = PokeApp.fr71.field(); f.st = 6; const e0 = S.eggs.length, x = f.t[1], m = { id: Object.keys(PDATA.mons).map(Number).find(i => x.ty ? PDATA.mons[i].t.includes(x.ty) : 1) }; for (let i = 0; i < x.n; i++) PokeApp.fr71.track(x.k === 'catchT' ? 'catch' : x.k, 1, m); return { st: f.st, br: f.br, eggs: S.eggs.length - e0 }; });
  ok(d.st === 0 && d.br === 1 && d.eggs === 1, 'Descoberta com 7 carimbos dá Ovo Raro');
  await ev(() => { PokeApp.debug.S.fr.st = 3; PokeApp.debug.go('field'); }); await p.waitForTimeout(2600); await clr(); await p.screenshot({ path: OUT('pesquisa-carimbos') });
  await ev(() => PokeApp.debug.go('home')); await p.waitForTimeout(300); await clr();
  await p.waitForTimeout(2600); await clr(); await ev(() => { document.querySelectorAll('.toast,.notice').forEach(t => t.remove()); document.querySelector('.hoje67').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(400); await p.screenshot({ path: OUT('pesquisa-hoje') });
  ok(!errs.length, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
