// v52 mapa vivo
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
  for (const W of [375, 320]) {
    await p.setViewportSize({ width: W, height: 667 }); await ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.go('explore', PokeApp.C.MAPS[1].id); }); await p.waitForTimeout(900); await clr();
    const r = await ev(() => ({ cl: document.querySelectorAll('#scene .lclouds i').length, cla: getComputedStyle(document.querySelector('#scene .lclouds i')).animationName, ww: document.querySelectorAll('#scene .wildw').length, wa: getComputedStyle(document.querySelector('.wildw')).animationName, ga: getComputedStyle(document.querySelector('.grass-row i')).animationName, tidy: document.querySelector('#scene').classList.contains('tidy'), bar: !!document.querySelector('.exbar #searchBtn'), ov: document.documentElement.scrollWidth <= innerWidth + 1 }));
    ok(r.cl === 3 && r.cla === 'ldrift', `${W}: nuvens passando`); ok(r.ga === 'gsway', `${W}: grama balança`); ok(r.ww === (W < 360 ? 2 : 3) && r.wa === 'wwalk', `${W}: Pokémon selvagens passeando (${r.ww})`);
    ok(r.tidy && r.bar && r.ov, `${W}: regras do mapa limpo v41 mantidas, sem overflow`);
    const box = await ev(() => { const s = document.querySelector('#scene').getBoundingClientRect(); return [...document.querySelectorAll('.wildw')].every(b => { const q = b.getBoundingClientRect(); return q.left >= s.left - 30 && q.right <= s.right + 30 && q.bottom <= s.bottom; }); }); ok(box, `${W}: selvagens dentro da cena`);
    await p.screenshot({ path: `/workspace/pk-tmp/mapa-vivo-${W}-${LIVE}v52.png` });
    if (W === 375) for (let f = 0; f < 8; f++) { await p.screenshot({ path: `/tmp/mv52-${f}.png`, clip: { x: 0, y: 0, width: 375, height: 420 } }); await p.waitForTimeout(250); }
    const want = await ev(() => { const b = document.querySelector('.wildw'); return [+b.dataset.k, PokeApp.C.MAPS[1].enc[+b.dataset.k][0]]; });
    await p.click('.wildw', { force: true }); for (let w = 0; w < 60 && !(await ev(() => !!document.querySelector('#battle'))); w++) await p.waitForTimeout(200);
    const got = await ev(() => document.querySelector('#battle') && PokeApp.debug.S && document.querySelector('#einfo')?.textContent);
    ok(!!got, `${W}: tocar no selvagem inicia o encontro`); await p.waitForTimeout(2500);
    const nm = await ev(id => { try { return document.querySelector('#einfo').textContent; } catch (e) { return ''; } }, want[1]); console.log('  tocado id', want[1], '→ batalha:', nm.trim().slice(0, 30));
    await ev(() => document.querySelector('#battle')?.remove()); await p.waitForTimeout(300); }
  await p.emulateMedia({ reducedMotion: 'reduce' }); await ev(() => PokeApp.debug.go('explore', PokeApp.C.MAPS[1].id)); await p.waitForTimeout(600);
  ok(await ev(() => getComputedStyle(document.querySelector('.wildw')).animationName === 'none'), 'movimento reduzido: tudo parado');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
