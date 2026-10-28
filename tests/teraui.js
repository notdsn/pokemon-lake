// Movimento 2D
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-anim-${LIVE}${n}-depois.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' @ ' + String(e.stack).replace(/\s+/g, ' ').slice(0, 400))); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.waitForTimeout(500); await clr();
  const W = 375; const SH = n => `/workspace/pk-tmp/tera-${n}.png`;
  await ev(() => { const d = PokeApp.debug, S = d.S; S.bag['tera-orb'] = 1; S.bag['tera-shard'] = 1; const t = d.mkTeam([[6, 50]], 1, 0); t[0].moves = [{ n: 'flamethrower', pp: 15 }, { n: 'air-slash', pp: 15 }, { n: 'dragon-claw', pp: 15 }, { n: 'ember', pp: 3 }]; S.party.unshift(t[0]); d.save(); });
  const start = () => ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[143, 45]], 1, 0), map: PokeApp.C.MAPS[1] }); });
  await start(); await p.waitForTimeout(2600); await clr(); for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon')?.classList.contains('hidden')); w++) await p.waitForTimeout(300); await p.waitForTimeout(600);
  await p.click('[data-b="fight"]'); await p.waitForTimeout(300);
  ok(await ev(() => !!document.querySelector('[data-b="teratog"]')), 'botão 💎 Terastal aparece com Orbe Tera');
  ok(await ev(() => document.querySelectorAll('.mvb').length === 4 && getComputedStyle(document.querySelector('.mvb'), '::after').width !== 'auto'), 'menu de golpes moderno com barra de PP');
  await p.screenshot({ path: SH('menu') });
  await p.click('[data-b="teratog"]'); await p.waitForTimeout(200); ok(await ev(() => document.querySelector('[data-b="teratog"]').classList.contains('on')), 'Terastal armado');
  await p.click('.mvb[data-n="flamethrower"]'); await p.waitForTimeout(900); await p.screenshot({ path: SH('brilho') });
  for (let w = 0; w < 40 && !(await ev(() => document.querySelector('#bctl [data-b="fight"]'))) && await ev(() => !!document.querySelector('#battle')); w++) await p.waitForTimeout(250);
  const r = await ev(() => ({ tera: document.querySelector('.pmon').classList.contains('tera'), crown: !!document.querySelector('.pmon .tcrown'), chip: !!document.querySelector('#pinfo .terachip'), ghost: !!document.querySelector('#einfo .hpghost'), st: PokeApp.debug.S.stats.teras, ter: PokeApp.debug.S.party[0].terastal }));
  ok(r.tera && r.crown && r.chip && r.ter === 'fire' && r.st === 1, 'Terastalizou: cristal + coroa + ícone: ' + JSON.stringify(r)); ok(r.ghost, 'barra de HP com rastro que esvazia');
  await p.screenshot({ path: SH('cristal') });
  await p.click('[data-b="fight"]'); await p.waitForTimeout(200); ok(await ev(() => !document.querySelector('[data-b="teratog"]') && !document.querySelector('[data-b="megatog"]') && !document.querySelector('[data-b="dynatog"]')), 'só 1 mecânica por batalha');
  await start(); await p.waitForTimeout(2800); ok(await ev(() => !PokeApp.debug.S.party[0].terastal), 'Tera some na batalha seguinte'); await ev(() => document.querySelector('#battle')?.remove());
  // ficha: trocar tipo Tera
  await ev(() => PokeApp.debug.go('team')); await p.waitForTimeout(700); await clr(); await p.click('[data-a="mon"][data-w="p"] >> nth=0').catch(() => {}); await p.waitForTimeout(600);
  const hasRow = await ev(() => !!document.querySelector('[data-tera]')); ok(hasRow, 'ficha mostra Tipo Tera');
  if (hasRow) { await p.click('[data-tera]'); await p.waitForTimeout(400); await p.click('[data-tp="water"]'); await p.waitForTimeout(300);
    ok(await ev(() => PokeApp.debug.S.party[0].teraT === 'water' && !PokeApp.debug.S.bag['tera-shard']), 'Fragmento Tera muda para Água'); }
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
