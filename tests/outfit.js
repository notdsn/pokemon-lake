// Roupas em pixel art por encaixe
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-outfit-${LIVE}${n}-depois.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const TAG = process.argv[3] || 'depois', SH = n => `/workspace/pokemon-lake/prints/v2/375x667-outfit-${LIVE}${n}-${TAG}.png`;
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  const NEW = await ev(() => !!PokeApp.outfit);
  await ev(NEW => { const S = PokeApp.debug.S; S.money = 99999; S.style = S.style || {}; S.style.owned = Object.assign(S.style.owned || {}, { h1: 1, h6: 1, h5: 1, hg2: 1, hp: 1, bc: 1, h0: 1, c0: 1, a0: 1 }); S.style.hat = 'h6';
    if (NEW) { delete S.style.acc; PokeApp.outfit.accOf(); } PokeApp.debug.save(); }, NEW);
  if (NEW) { ok(await ev(() => PokeApp.outfit.accOf().head === 'h6'), 'migração: chapéu antigo vai para o encaixe da cabeça');
    await ev(() => { const S = PokeApp.debug.S; S.style.hat = 'h5'; delete S.style.acc; }); ok(await ev(() => PokeApp.outfit.accOf().face === 'h5' && !PokeApp.outfit.accOf().head), 'migração: óculos antigos vão para o rosto');
    await ev(() => { const S = PokeApp.debug.S; S.style.hat = 'h6'; delete S.style.acc; PokeApp.outfit.accOf(); }); }
  await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(900); await clr(); await p.screenshot({ path: SH('mapa-coroa') });
  if (NEW) { ok(await ev(() => document.querySelector('#scene img.me').src.startsWith('data:')), 'mapa usa sprite composto (sem emoji)'); ok(await ev(() => !document.querySelector('.mehat')), 'sem emoji grudado');
    await ev(() => PokeApp.debug.go('style')); await p.waitForTimeout(500); await clr();
    for (const id of ['hp', 'h5', 'bc']) { await p.click(`[data-a="accbuy"][data-id="${id}"]`); await p.waitForTimeout(250); }
    ok(await ev(() => { const a = PokeApp.outfit.accOf(); return a.head === 'h6' && a.ears === 'hp' && a.face === 'h5' && a.back === 'bc'; }), '4 encaixes ao mesmo tempo: coroa + fones + óculos + capa');
    await p.click('[data-a="accbuy"][data-id="h1"]'); await p.waitForTimeout(250); ok(await ev(() => PokeApp.outfit.accOf().head === 'h1' && PokeApp.debug.S.style.hat === 'h1'), 'boné substitui a coroa no encaixe da cabeça');
    await p.click('[data-a="accbuy"][data-id="h6"]'); await p.waitForTimeout(250);
    // todos os avatares e todos os itens compõem sem erro
    const n = await ev(async () => { const O = PokeApp.outfit; let c = 0; for (const av of Object.keys(O.ANCH)) for (const id of Object.keys(O.DRAW)) { const sl = O.slotOf(id); const k = [av, 0, sl === 'head' ? id : null, sl === 'ears' ? id : null, sl === 'face' ? id : null, sl === 'back' ? id : null].join('|'); O.compose(k); c++; } await new Promise(r => setTimeout(r, 1500)); return c; });
    ok(n >= 8 * 20 && errs.length === 0, `${n} combinações avatar×item desenhadas`);
    await ev(() => PokeApp.debug.go('style')); await p.waitForTimeout(800); await clr(); await p.screenshot({ path: SH('boutique') });
    await p.evaluate(() => document.querySelector('.accs').scrollIntoView()); await p.waitForTimeout(500); await p.screenshot({ path: SH('acessorios') });
  } else { await ev(() => { PokeApp.debug.S.style.hat = 'h6'; PokeApp.debug.go('style'); }); await p.waitForTimeout(600); await clr(); await p.screenshot({ path: SH('boutique') }); }
  await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(900); await clr(); await p.evaluate(() => document.querySelector('#scene').classList.add('walking')); await p.waitForTimeout(200); await p.screenshot({ path: SH('mapa-tudo') });
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
