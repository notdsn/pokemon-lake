// v73: Apelidos e favoritos
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/'; const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-${LIVE}${n}-v73.png`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const ev = (f, a) => p.evaluate(f, a); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await clr();
  await ev(() => { const S = PokeApp.debug.S; for (const id of [16, 19, 10]) S.box.push(PokeApp.debug.mkMon ? PokeApp.debug.mkMon(id, 5) : JSON.parse(JSON.stringify(Object.assign({}, S.party[0], { id, uid: 'tb' + id, nick: null })))); PokeApp.debug.go('team'); }); await p.waitForTimeout(400); await clr();
  // apelido pela janela nova
  await p.click('.mcard[data-w="p"][data-i="0"]'); await p.waitForTimeout(300); await p.click('[data-k="nick"]'); await p.waitForTimeout(300);
  const n = await ev(() => ({ open: !!document.querySelector('.nk73'), sug: document.querySelectorAll('.nksug .chip73').length }));
  ok(n.open && n.sug === 5, 'janela de apelido com 5 sugestões (sem prompt)');
  await p.click('.nksug .chip73:nth-child(3)'); await p.waitForTimeout(100); await p.screenshot({ path: OUT('apelido-janela') });
  const pick = await ev(() => document.querySelector('#nkin').value); await p.click('[data-nk="ok"]'); await p.waitForTimeout(400);
  ok(await ev(() => PokeApp.debug.S.party[0].nick) === pick && !!(await ev(() => document.querySelector('.mdet'))), 'apelido salvo e volta para o Pokémon: ' + pick);
  await p.fill('#nkin', '').catch(() => {}); await clr();
  // favoritar o último da caixa
  await ev(() => PokeApp.debug.render()); await p.waitForTimeout(300);
  await p.click('.mcard[data-w="b"][data-i="2"]'); await p.waitForTimeout(300);
  ok(await ev(() => !!document.querySelector('[data-k="release"]')), 'pode soltar antes de favoritar');
  await p.click('[data-k="fav"]'); await p.waitForTimeout(300);
  const f = await ev(() => ({ fav: PokeApp.debug.S.box[2].fav, rel: !!document.querySelector('[data-k="release"]') }));
  ok(f.fav === true && !f.rel, 'favorito não pode ser solto'); await p.screenshot({ path: OUT('favorito-detalhe') }); await clr(); await ev(() => PokeApp.debug.render()); await p.waitForTimeout(300);
  const bx = await ev(() => { const c = [...document.querySelectorAll('.mcard[data-w="b"]')]; return { first: c[0].dataset.i, heart: !!c[0].querySelector('.favtag'), chip: !!document.querySelector('[data-a="boxfav"]'), emo: /\p{Extended_Pictographic}/u.test(document.body.innerText), ovx: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(bx.first === "2" && bx.heart && bx.chip && !bx.emo && bx.ovx, 'favorito primeiro no PC com coração ' + JSON.stringify(bx));
  await ev(() => document.querySelector('[data-a="boxfav"]').closest('.card').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT('favorito-pc') });
  await p.click('[data-a="boxfav"]'); await p.waitForTimeout(300);
  ok(await ev(() => document.querySelectorAll('.mcard[data-w="b"]').length) === 1, 'filtro Favoritos');
  ok(await ev(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /^pkLake\.save\.[^.]+$/.test(k)))).box[2].fav) === true, 'salvo');
  ok(!errs.length, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
