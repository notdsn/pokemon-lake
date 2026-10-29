// v70: Caminho de troféus + ajustes
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/'; const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-${LIVE}${n}-v70.png`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const ev = (f, a) => p.evaluate(f, a); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await clr();
  // ajustes: ícone do bônus selecionado e linhas do treino
  await ev(() => { PokeApp.debug.S.pkSel = { type: 'fire', pow: 'shiny' }; PokeApp.debug.go('picnic'); }); await p.waitForTimeout(300); await clr();
  const ic = await ev(() => { const s = document.querySelector('.seg2 button.on svg'); return s ? getComputedStyle(s).color : null; });
  ok(ic && !/251, 191, 36/.test(ic), 'ícone do bônus selecionado visível: ' + ic);
  await ev(() => document.querySelector('.pk68').scrollIntoView()); await p.waitForTimeout(200); await p.screenshot({ path: OUT('piquenique-icone') });
  await ev(() => PokeApp.debug.go('train69')); await p.waitForTimeout(300); await clr();
  await ev(() => { const h = [...document.querySelectorAll('.tr69 h4')].pop(); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 70); }); await p.waitForTimeout(300);
  const vis = await ev(() => { const r = document.querySelector('[data-a="trreset"]').getBoundingClientRect(), n = document.querySelector('.nav').getBoundingClientRect(); return r.bottom <= n.top; });
  ok(vis, 'botão de zerar visível junto com os status em 375px'); await p.waitForTimeout(1800); await clr(); await ev(() => document.querySelectorAll('.toast,.notice').forEach(t => t.remove())); await p.screenshot({ path: OUT('treino-compacto') });
  // caminho
  await ev(() => { const S = PokeApp.debug.S; for (let i = 1; i <= 20; i++) S.dex.caught[i] = 1; PokeApp.debug.go('more'); }); await p.waitForTimeout(300); await clr();
  ok(await ev(() => /Caminho de Troféus/.test(document.body.innerText)), 'Caminho no Mais');
  await ev(() => PokeApp.debug.go('troad')); await p.waitForTimeout(300); await clr();
  const t = await ev(() => ({ t: PokeApp.tr70.trophies().t, ready: PokeApp.tr70.ready(), nodes: document.querySelectorAll('.trnode').length, btn: document.querySelectorAll('[data-a="trclaim"]').length, emo: /\p{Extended_Pictographic}/u.test(document.body.innerText), ovx: document.documentElement.scrollWidth <= innerWidth + 1, m: PokeApp.debug.S.money }));
  ok(t.t >= 40 && t.ready === 2 && t.nodes === 13 && t.btn === 1 && !t.emo && t.ovx, 'troféus e marcos ' + JSON.stringify(t));
  await p.screenshot({ path: OUT('trofeus-tela') });
  await p.click('[data-a="trclaim"]'); await p.waitForTimeout(200); await p.click('[data-a="trclaim"]'); await p.waitForTimeout(200);
  const a = await ev(() => ({ r: PokeApp.tr70.ready(), m: PokeApp.debug.S.money, cl: PokeApp.debug.S.troad, btn: document.querySelectorAll('[data-a="trclaim"]').length }));
  ok(a.r === 0 && a.cl === 2 && a.m === t.m + 3000 && a.btn === 0, 'dois prêmios resgatados uma vez só');
  await p.screenshot({ path: OUT('trofeus-pegos') });
  ok(!errs.length, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
