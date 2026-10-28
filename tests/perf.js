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
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.waitForTimeout(500); await clr();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const fps = () => ev(() => new Promise(r => { let n = 0, t0 = performance.now(), worst = 0, last = t0; const f = t => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 2000) requestAnimationFrame(f); else r([Math.round(n / ((t - t0) / 1000)), Math.round(worst)]); }; requestAnimationFrame(f); window.scrollBy({ top: 600, behavior: 'smooth' }); }));
  for (const v of ['home', 'team', 'explore']) { await ev(v => PokeApp.debug.go(v, v === 'explore' ? 'floresta' : undefined), v); await p.waitForTimeout(800); await clr(); const [f, w] = await fps(); ok(f >= 40, `${v}: ${f} fps (CPU 4x mais lenta), pior quadro ${w}ms`); }
  await ev(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[6, 30]], 1, 0), map: PokeApp.C.MAPS[1] })); await p.waitForTimeout(2500); await clr(); const [f, w] = await fps(); ok(f >= 40, `batalha: ${f} fps, pior ${w}ms`);
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
