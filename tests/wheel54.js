// Movimento 2D
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-roda-${LIVE}${n}-v54.png`;
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' @ ' + String(e.stack).replace(/\s+/g, ' ').slice(0, 400))); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const cdp = await ctx.newCDPSession(p);
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.waitForTimeout(500); await clr();
  await ev(() => { const d = PokeApp.debug, S = d.S; S.bag['tera-orb'] = 1; S.bag['tera-shard'] = 1; const t = d.mkTeam([[6, 50]], 1, 0); t[0].moves = [{ n: 'scratch', pp: 35 }, { n: 'flamethrower', pp: 15 }, { n: 'air-slash', pp: 15 }, { n: 'dragon-claw', pp: 15 }]; S.party.unshift(t[0]); d.save(); });
  const start = id => ev(id => { document.querySelector('#battle')?.remove(); PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[id, 40]], 1, 0), map: PokeApp.C.MAPS[1] }); }, id);
  const ready = async () => { await p.waitForTimeout(2600); await clr(); for (let w = 0; w < 30 && !(await ev(() => !!document.querySelector('.wheel54'))); w++) await p.waitForTimeout(300); await p.waitForTimeout(500); };
  const hints = async () => { await p.click('[data-b="fight"]'); await p.waitForTimeout(300); return ev(() => [...document.querySelectorAll('.mvb')].map(b => (b.querySelector('.ef')?.textContent) || '-')); };
  await start(3); await ready();
  const r = await ev(() => { const q = s => document.querySelector(s); const rc = s => q(s).getBoundingClientRect(); const ov = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    return { wheel: !!q('.wheel54 .wh-main[data-b="fight"]') && ['bag', 'poke', 'run'].every(k => q(`.wheel54 [data-b="${k}"]`)), round: getComputedStyle(q('.wh-main')).borderRadius, oldGrid: getComputedStyle(q('.bmain')).display,
      e: ov(rc('#einfo'), rc('#esp')), pp: ov(rc('#pinfo'), rc('#psp')), hpl: getComputedStyle(q('#pinfo .hpl')).display, ovx: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(r.wheel && r.round === '50%' && r.oldGrid === 'block', 'roda de ações redonda (Lutar grande + Mochila/Pokémon/Fugir)');
  ok(!r.e && !r.pp, 'barras de HP não cobrem o sprite (inimigo e seu)'); ok(r.hpl === 'none' && r.ovx, 'sem etiqueta "HP" estilo DS, sem overflow');
  await p.screenshot({ path: OUT('roda') });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); const fps = await ev(() => new Promise(r => { let n = 0, t0 = performance.now(); const f = t => { n++; if (t - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / ((t - t0) / 1000))); }; requestAnimationFrame(f); })); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  ok(fps >= 50, `batalha com roda: ${fps} fps (CPU 4x)`);
  let h = await hints(); ok(h[1] === 'Super eficaz' && h[2] === 'Super eficaz' && h[0] === '-', 'vs Venusaur: Lança-chamas/Air Slash "Super eficaz" (' + h + ')');
  ok(await ev(() => !!document.querySelector('[data-b="teratog"]')), 'botão Terastal continua'); await p.click('[data-b="teratog"]'); await p.waitForTimeout(200); ok(await ev(() => document.querySelector('[data-b="teratog"]').classList.contains('on')), 'Terastal arma');
  await p.screenshot({ path: OUT('golpes') });
  await start(74); await ready(); h = await hints(); ok(h[1] === 'Pouco eficaz', 'vs Geodude: fogo "Pouco eficaz" (' + h + ')');
  await start(92); await ready(); h = await hints(); ok(h[0] === 'Sem efeito', 'vs Gastly: Arranhão "Sem efeito" (' + h + ')');
  await p.click('[data-b="back"]'); await p.waitForTimeout(300); await p.click('[data-b="run"]'); await p.waitForTimeout(2500); ok(true, 'fugir pela roda');
  await p.emulateMedia({ reducedMotion: 'reduce' }); await start(3); await ready(); ok(await ev(() => getComputedStyle(document.querySelector('.wh-main')).animationName === 'none'), 'movimento reduzido: sem animação da roda');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
