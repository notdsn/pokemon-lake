// v64: acabamento (config, recompensas, avisos, data, )
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/'; const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-${LIVE}${n}-v64.png`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const ev = (f, a) => p.evaluate(f, a); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  await p.waitForTimeout(500); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await clr();
  await ev(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
  // configurações
  await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(300);
  const c = await ev(() => ({ seg2: document.querySelectorAll('.seg2 [data-a="setg3d"]').length, oldseg: document.querySelectorAll('.set62 .seg').length, amb: !!document.querySelector('.tgl[data-a="ambmute"]') && document.querySelector('#ambvol').classList.contains('sld'), oldamb: !!document.querySelector('.ambrow'), emo: /\p{Extended_Pictographic}/u.test(document.body.innerText), ovx: document.documentElement.scrollWidth <= innerWidth + 1 }));
  ok(c.seg2 === 3 && !c.oldseg, 'Gráficos 3D em controle segmentado novo'); ok(c.amb && !c.oldamb, 'Som ambiente = chave + slider no novo estilo'); ok(!c.emo && c.ovx, 'sem emoji, sem overflow');
  await p.click('.seg2 [data-v="false"]'); await p.waitForTimeout(200); ok(await ev(() => PokeApp.debug.S.settings.g3d === false && document.querySelector('.seg2 [data-v="false"]').classList.contains('on')), '3D: Desligado selecionado');
  await p.click('.seg2 [data-v="auto"]'); await p.waitForTimeout(200); ok(await ev(() => PokeApp.debug.S.settings.g3d === undefined), '3D: Auto');
  await p.fill('#ambvol', '70'); ok(await ev(() => PokeApp.debug.S.settings.avol === 0.7), 'slider ambiente 70%');
  await p.click('.tgl[data-a="ambmute"]'); await p.waitForTimeout(200); ok(await ev(() => PokeApp.debug.S.settings.amute === true && document.querySelector('#ambvol').disabled), 'chave desliga ambiente');
  await p.click('.tgl[data-a="ambmute"]'); await p.waitForTimeout(200);
  await ev(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelector('.seg2').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(700); await ev(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: OUT('config') });
  // recompensas da Pokédex continuam abertas
  await ev(() => { const S = PokeApp.debug.S; for (let i = 1; i <= 55; i++) { S.dex.seen[i] = 1; S.dex.caught[i] = 1; } PokeApp.debug.go('dex'); }); await p.waitForTimeout(300);
  await p.click('.dexrwbtn'); await p.click('#modal-root [data-a="dexclaim"]'); await p.waitForTimeout(300);
  const r = await ev(() => ({ open: !!document.querySelector('#modal-root .dexrwm'), won: (document.querySelector('.dxwon') || {}).textContent || '', left: document.querySelectorAll('#modal-root [data-a="dexclaim"]').length, dot: (document.querySelector('.dexrwbtn .rdot') || {}).textContent }));
  ok(r.open && r.won.length > 5 && r.left === 2 && r.dot === '2', `janela continua aberta e atualizada (${r.left} restantes, botão mostra ${r.dot})`);
  await p.screenshot({ path: OUT('recompensas') });
  await p.click('#modal-root [data-a="dexclaim"]'); await p.waitForTimeout(200); await p.click('#modal-root [data-a="dexclaim"]'); await p.waitForTimeout(200);
  ok(await ev(() => !!document.querySelector('#modal-root .dexrwm') && !document.querySelector('#modal-root [data-a="dexclaim"]')), 'resgata todas sem fechar');
  await clr();
  // aviso atrasado e pequeno
  await ev(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); PokeApp.debug.go('home'); PokeApp.notice('Teste aviso', 'good'); }); await p.waitForTimeout(1200);
  ok(await ev(() => !document.querySelector('.toast.notice')), 'aviso não aparece logo ao abrir a tela');
  await p.waitForTimeout(1500); const n = await ev(() => { const t = document.querySelector('.toast.notice'); if (!t) return null; const r = t.getBoundingClientRect(); return { top: r.top, h: r.height }; });
  ok(n && n.top < 140 && n.h < 50, 'aviso aparece depois, pequeno e no topo ' + JSON.stringify(n));
  await p.screenshot({ path: OUT('aviso') });
  // data das ofertas
  const d = await ev(() => { const A = PokeApp; const k1 = A.dayOffers().key; const real = Date.now; Date.now = () => real() - 3 * 864e5; const k2 = A.dayOffers().key; Date.now = real; return [k1, k2]; });
  ok(d[0] === d[1], 'voltar a data do aparelho não troca as ofertas ' + d);
  ok(!errs.length, 'sem erros JS ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
