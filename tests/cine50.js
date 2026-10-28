// v50 captura cinematográfica
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
  const SH = n => `/workspace/pk-tmp/captura-${n}-${LIVE}v50.png`;
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.waitForTimeout(500); await clr();
  const start = () => ev(() => { document.querySelector('#battle')?.remove(); const S = PokeApp.debug.S; S.bag['master-ball'] = 5; PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[25, 10]], 1, 0), map: PokeApp.C.MAPS[1] }); });
  const ready = async () => { await p.waitForTimeout(2600); await clr(); for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon')?.classList.contains('hidden')); w++) await p.waitForTimeout(300); await p.waitForTimeout(500); };
  const toss = async () => { await p.click('[data-b="bag"]'); await p.waitForTimeout(300); await p.click('[data-b="item"][data-id="master-ball"]'); };
  for (const W of [375, 320]) {
    await p.setViewportSize({ width: W, height: 667 }); await start(); await ready(); const t0 = Date.now(); await toss();
    let cine = false, slow = false, hint = false, burst = false, frames = 0;
    for (let w = 0; w < 60 && await ev(() => !!document.querySelector('#battle')); w++) {
      const st = await ev(() => ({ c: !!document.querySelector('.bscene.cine'), s: !!document.querySelector('.cball.wobslow'), h: !!document.querySelector('.cskiphint'), b: !!document.querySelector('.cburst') }));
      cine ||= st.c; slow ||= st.s; hint ||= st.h; if (st.b && !burst && W === 375) await p.screenshot({ path: SH('brilho') }); burst ||= st.b;
      if (st.s && frames++ === 1 && W === 375) await p.screenshot({ path: SH('zoom') });
      if (st.b || (!st.c && cine)) break; await p.waitForTimeout(150); }
    const dur = Date.now() - t0;
    ok(cine && slow && hint, `${W}: câmera aproxima + bola treme em câmera lenta + dica de pular`); ok(burst, `${W}: explosão de luz e partículas no sucesso`);
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), `${W}: sem overflow`);
    for (let w = 0; w < 80 && await ev(() => !!document.querySelector('#battle')); w++) await p.waitForTimeout(200); await p.waitForTimeout(400); await clr(); console.log('  duração até o brilho: ' + dur + 'ms');
    // pular
    await start(); await ready(); await toss(); for (let w = 0; w < 30 && !(await ev(() => !!document.querySelector('.bscene.cine'))); w++) await p.waitForTimeout(100);
    const t1 = Date.now(); await p.mouse.click(W / 2, 200);
    for (let w = 0; w < 60 && !(await ev(() => !!document.querySelector('.cburst') || PokeApp.debug.S.stats.caught >= 99)); w++) await p.waitForTimeout(50);
    const skipDur = Date.now() - t1; ok(skipDur < 1500 && await ev(() => !!document.querySelector('.bscene.cskip')), `${W}: toque pula a animação (${skipDur}ms)`);
    for (let w = 0; w < 80 && await ev(() => !!document.querySelector('#battle')); w++) await p.waitForTimeout(200); await p.waitForTimeout(400); await clr();
  }
  // reduced motion: sem cine
  await p.emulateMedia({ reducedMotion: 'reduce' }); await start(); await ready(); await toss(); let rc = false;
  for (let w = 0; w < 30; w++) { rc ||= await ev(() => !!document.querySelector('.bscene.cine')); await p.waitForTimeout(150); } ok(!rc, 'movimento reduzido: sem zoom cinematográfico');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
