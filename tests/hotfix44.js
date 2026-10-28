// v44 hotfix: minis shiny/formas + restauração única das Raides Dinamax
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(800); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  ok(await ev(() => !!(PokeApp.debug.S.fixes || {}).raid44), 'save novo já marcado (restauração única)');
  // raide: simula tentativas gastas no bug
  const r1 = await ev(() => { const S = PokeApp.debug.S; delete S.fixes.raid44; S.raids.used = 3; S.raids.done = { 0: 1, 1: 1 }; S.raids.extra = 0; return PokeApp.raidRestore(); });
  ok(r1 && r1.used === 3 && r1.done === 2, 'restaurou 3 raides usadas e 2 tocas');
  const st = await ev(() => { const r = PokeApp.debug.S.raids; return [r.used, Object.keys(r.done).length, r.extra]; });
  ok(st[0] === 0 && st[1] === 0 && st[2] === 3, 'raides zeradas + 3 extras: ' + st);
  const r2 = await ev(() => { const S = PokeApp.debug.S; S.raids.used = 2; return [PokeApp.raidRestore(), S.raids.used]; });
  ok(r2[0] === 0 && r2[1] === 2, 'segunda vez não restaura de novo');
  ok(await ev(() => !!JSON.parse(localStorage.getItem('pkLake.save.' + PokeApp.debug.S.user)).fixes.raid44), 'flag salva');
  // parceiro Greninja shiny na Início
  await ev(() => { const d = PokeApp.debug, S = d.S; const t = d.mkTeam([[658, 50]], 1, 0); t[0].shiny = true; S.party.unshift(t[0]); d.save(); d.go('home'); });
  await p.waitForTimeout(1500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
  const pet = await ev(() => { const i = document.querySelector('.petyard img'); return i && [i.getAttribute('src'), i.className, i.naturalWidth]; });
  ok(pet && pet[0].includes('minishiny/658') && pet[1].includes('minish') && pet[2] > 0, 'parceiro shiny = mini shiny: ' + pet);
  await ev(() => document.querySelector('.petyard').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400);
  await p.screenshot({ path: '/workspace/pk-tmp/greninja-parceiro-v44' + (URL.includes('github.io') ? '-live' : '') + '.png' });
  // formas: mega/gmax/forma regional
  const fm = await ev(async () => { const o = []; for (const s of ['img/mega/front/charizard-mega-x.gif', 'img/mega/shiny/gengar-mega.gif', 'img/front/10091.gif', 'img/shiny/25.gif']) { const d = document.createElement('div'); d.innerHTML = `<img src="${s}">`; document.querySelector('.petyard').appendChild(d); await new Promise(r => setTimeout(r, 300)); const i = d.querySelector('img'); o.push(i.getAttribute('src') + '|' + i.naturalWidth); d.remove(); } return o; });
  ok(/mini\/6\.png\|[1-9]/.test(fm[0]) && /minishiny\/94\.png\|[1-9]/.test(fm[1]) && /mini\/10091\.png\|[1-9]/.test(fm[2]) && /minishiny\/25\.png\|[1-9]/.test(fm[3]), 'formas mapeadas: ' + fm);
  // nenhuma não-lendária grande fora da batalha
  for (const v of ['home', 'team', 'dex']) { await ev(v => PokeApp.debug.go(v), v); await p.waitForTimeout(900);
    const big = await ev(() => [...document.querySelectorAll('img')].filter(i => /img\/(mega\/|gmax\/)?(front|shiny)\//.test(i.getAttribute('src') || '') && !i.classList.contains('minileg') && !i.closest('#battle,.bigspr,.wildpeek,.evo,.evobox,.caughtm,.raidwin,.bmon,.hatchm,.eggm')).map(i => i.getAttribute('src')));
    ok(!big.length, v + ': sem sprite grande de não-lendário ' + big.slice(0, 3)); }
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close();
  console.log(fail ? fail + ' FALHA(S)' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
