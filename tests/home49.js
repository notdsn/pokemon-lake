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
  const TAG = process.argv[3] || 'depois';
  await ev(() => { const d = PokeApp.debug, S = d.S; const t = d.mkTeam([[658, 40]], 1, 0); t[0].shiny = true; t[0].aff = 160; S.party.unshift(t[0]); S.badges = [0, 1, 2, 3, 4, 5]; S.champion = false; d.save(); });
  for (const W of [375, 320]) { await p.setViewportSize({ width: W, height: 700 }); await ev(() => PokeApp.debug.go('home')); await p.waitForTimeout(1200); await clr(); await p.waitForTimeout(400);
    await p.screenshot({ path: `/workspace/pk-tmp/inicio-${W}-${TAG}.png`, clip: { x: 0, y: 0, width: W, height: 520 } });
    const r = await ev(() => { const tr = document.querySelector('.card.hero img[data-me]'), pc = document.querySelector('.pcard2'), f = pc && pc.querySelector('.follow img'); const ov = [...document.querySelectorAll('.tcard2 *')].some(x => x.scrollWidth > x.clientWidth + 2 && getComputedStyle(x).overflowX === 'visible' && x.tagName === 'H2');
      return { trAnim: tr ? getComputedStyle(tr).animationName : 'x', slots: document.querySelectorAll('.bslots .badge').length, on: document.querySelectorAll('.bslots .badge.on').length, pc: !!pc, wander: !!document.querySelector('.petyard .wander'), fa: f ? getComputedStyle(f).animationName : 'x', fw: f ? f.getBoundingClientRect().width : 0, hearts: document.querySelectorAll('.pc2-hearts i.on').length, ov, cardW: document.querySelector('.card.hero').getBoundingClientRect().width, docW: document.documentElement.scrollWidth }; });
    ok(r.trAnim === 'none', W + ': treinador parado no cartão (' + r.trAnim + ')'); ok(r.slots >= 8 && r.on === 6, W + ': insígnias em slots (' + r.on + '/' + r.slots + ')');
    ok(r.pc && !r.wander && r.fa === 'pbreath' && r.fw >= 100, W + ': parceiro parado no habitat, grande (' + r.fa + ', ' + r.fw + 'px)'); ok(r.hearts === 3, W + ': 3 corações de amizade');
    ok(r.docW <= W, W + ': sem rolagem lateral (' + r.docW + ')'); }
  await ev(() => document.querySelector('.pcard2').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200); await p.click('.pcard2 .follow', { force: true }); await p.waitForTimeout(200); const tp = await ev(() => [document.querySelectorAll('.pc2-heart').length, document.querySelector('.pcard2 .follow')?.className, !!document.querySelector('.pcard2')]); ok(tp[0] > 0 && /phop/.test(tp[1]), 'toque: pulinho + corações ' + tp);
  await p.setViewportSize({ width: 375, height: 700 }); await p.waitForTimeout(100); await ev(() => document.querySelector('.pcard2').scrollIntoView({ block: 'center' })); await p.screenshot({ path: `/workspace/pk-tmp/inicio-375-toque-${TAG}.png` });
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
