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
  const TAG = process.argv[3] || 'depois'; const SH = n => `/workspace/pokemon-lake/prints/v2/375x667-anim-${LIVE}${n}-${TAG}.png`;
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  const NEW = await ev(() => !!PokeApp.live2d);
  const anim = sel => ev(sel => { const i = document.querySelector(sel); return i ? getComputedStyle(i).animationName : 'none'; }, sel);
  const fight = async id => { await ev(id => { document.querySelector('#battle')?.remove(); PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[id, 30]], 1, 0), map: PokeApp.C.MAPS[1] }); }, id); await p.waitForTimeout(2600); await clr(); };
  await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(500); await clr();
  await fight(25); for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon').classList.contains('hidden')); w++) await p.waitForTimeout(300); await p.waitForTimeout(800); await p.screenshot({ path: SH('batalha') });
  if (NEW) {
    console.log('P', await anim('.pmon img'), await ev(() => document.querySelector('.pmon').className)); ok(await anim('.emon img') === 'breathe' && await anim('.pmon img') === 'breathe', 'respiração no inimigo e no seu Pokémon: ' + await anim('.emon img'));
    const v = await ev(() => [document.querySelector('.emon').style.getPropertyValue('--bd'), document.querySelector('.pmon').style.getPropertyValue('--bd')]); ok(v[0] && v[1] && v[0] !== v[1], 'tempo diferente por espécie: ' + v);
    await ev(() => document.querySelector('.emon').classList.add('hit')); ok((await anim('.emon img')).includes('hitL') && (await anim('.emon img')).includes('hflash'), 'dano: tremida + flash'); await p.waitForTimeout(120); await p.screenshot({ path: SH('dano') }); await ev(() => document.querySelector('.emon').classList.remove('hit'));
    await ev(() => document.querySelector('.pmon').classList.add('lunge')); ok(await anim('.pmon img') === 'lungeLP', 'ataque: avanço com squash'); await p.waitForTimeout(220); await p.screenshot({ path: SH('golpe') }); await ev(() => document.querySelector('.pmon').classList.remove('lunge'));
    await ev(() => document.querySelector('.emon').classList.add('faint')); ok(await anim('.emon img') === 'faintL', 'desmaio com queda'); await ev(() => document.querySelector('.emon').classList.remove('faint'));
    await ev(() => { const e = document.querySelector('.emon'); e.classList.add('pop'); }); ok(await anim('.emon img') === 'popinL', 'entrada com pop'); await ev(() => document.querySelector('.emon').classList.remove('pop'));
    // tira de quadros da respiração
    for (let i = 0; i < 6; i++) { await p.screenshot({ path: `/workspace/pk-tmp/anim-f${i}.png`, clip: { x: 0, y: 60, width: 375, height: 420 } }); await p.waitForTimeout(330); }
    await fight(150); ok(await anim('.emon img') !== 'breathe' && await ev(() => document.querySelector('.emon').classList.contains('nolive')), 'lendário (Mewtwo) fica como está');
    await ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.go('explore', 'floresta'); }); await p.waitForTimeout(600); await clr();
    ok(await anim('#scene .follow img') === 'breathe', 'parceiro no mapa respira');
    await ev(() => document.querySelector('#scene').classList.add('walking')); await p.waitForTimeout(100); console.log('W', await anim('#scene .follow img'), await ev(() => document.querySelector('#scene .follow').parentElement.className)); ok((await anim('#scene .follow img')).includes('ministep'), 'andando: passos de 2 quadros'); await p.screenshot({ path: SH('mapa') }); await ev(() => document.querySelector('#scene').classList.remove('walking'));
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(100); ok(await anim('#scene .follow img') === 'none', 'movimento reduzido respeitado'); await p.emulateMedia({ reducedMotion: 'no-preference' });
  } else { await ev(() => { document.querySelector('#battle')?.remove(); PokeApp.debug.go('explore', 'floresta'); }); await p.waitForTimeout(600); await clr(); await p.screenshot({ path: SH('mapa') }); }
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
