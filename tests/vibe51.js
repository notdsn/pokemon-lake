// v51 vibração + coroa Tera
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
  await ctx.addInitScript(() => { window.__vib = []; Object.defineProperty(navigator, 'vibrate', { value: p => { window.__vib.push(JSON.stringify(p)); return true; }, configurable: true }); });
  p.on('pageerror', e => errs.push(e.message + ' @ ' + String(e.stack).replace(/\s+/g, ' ').slice(0, 400))); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = ''); await p.waitForTimeout(500); await clr();
  const wbat = async () => { for (let w = 0; w < 90 && await ev(() => !!document.querySelector('#battle')); w++) await p.waitForTimeout(200); await p.waitForTimeout(400); await clr(); };
  // shiny + captura
  await ev(() => { const d = PokeApp.debug; d.S.bag['master-ball'] = 3; const e = d.mkTeam([[25, 8]], 1, 0); e[0].shiny = true; d.startBattle({ kind: 'wild', enemy: e, map: PokeApp.C.MAPS[1] }); });
  await p.waitForTimeout(3500); await clr(); ok(await ev(() => window.__vib.includes('[50,50,50,50,200]')), 'vibra ao encontrar shiny');
  for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon')?.classList.contains('hidden')); w++) await p.waitForTimeout(300);
  await p.click('[data-b="bag"]'); await p.waitForTimeout(300); await p.click('[data-b="item"][data-id="master-ball"]'); await p.mouse.click(180, 200);
  for (let w = 0; w < 60 && !(await ev(() => window.__vib.includes('[60,40,120]'))); w++) await p.waitForTimeout(150);
  ok(await ev(() => window.__vib.includes('[60,40,120]')), 'vibra na captura'); await wbat();
  // configuração
  await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(600); await clr();
  const hasSet = await ev(() => !!document.querySelector('[data-k="vibe"]')); if (!hasSet) { await ev(() => PokeApp.debug.go('settings')); await p.waitForTimeout(600); }
  ok(await ev(() => !!document.querySelector('[data-k="vibe"][data-v="false"]')), 'opção 📳 Vibração nas configurações');
  await p.screenshot({ path: '/workspace/pk-tmp/vibracao-config-v51.png', fullPage: false }).catch(() => {});
  await p.click('[data-k="vibe"][data-v="false"]'); await p.waitForTimeout(300);
  const n0 = await ev(() => window.__vib.length); const r = await ev(() => PokeApp.buzz([40, 30, 60])); ok(r === false && await ev(() => window.__vib.length) === n0, 'desligada: não vibra');
  await ev(() => { delete navigator.vibrate; Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true }); PokeApp.debug.S.settings.vibe = true; });
  ok(await ev(() => { try { return PokeApp.buzz([30]) === false; } catch (e) { return false; } }), 'sem suporte (iOS): silencioso, sem erro');
  // coroa Tera no topo do sprite
  await ev(() => { const d = PokeApp.debug, S = d.S; S.bag['tera-orb'] = 1; const t = d.mkTeam([[6, 50]], 1, 0); t[0].moves = [{ n: 'flamethrower', pp: 15 }]; S.party.unshift(t[0]); d.startBattle({ kind: 'wild', enemy: d.mkTeam([[143, 45]], 1, 0), map: PokeApp.C.MAPS[1] }); });
  await p.waitForTimeout(2800); await clr(); for (let w = 0; w < 30 && await ev(() => document.querySelector('.pmon')?.classList.contains('hidden')); w++) await p.waitForTimeout(300); await p.waitForTimeout(600);
  await p.click('[data-b="fight"]'); await p.waitForTimeout(300); await p.click('[data-b="teratog"]'); await p.click('.mvb[data-n="flamethrower"]');
  for (let w = 0; w < 40 && !(await ev(() => document.querySelector('#bctl [data-b="fight"]'))) && await ev(() => !!document.querySelector('#battle')); w++) await p.waitForTimeout(250);
  const c = await ev(() => { const cr = document.querySelector('.pmon .tcrown'), img = document.querySelector('.pmon img'); if (!cr) return null; const a = cr.getBoundingClientRect(), b = img.getBoundingClientRect(); return { placed: cr.dataset.placed, bottom: a.bottom, imgTop: b.top, imgBot: b.bottom, cx: a.left + a.width / 2, il: b.left, ir: b.right }; });
  ok(c && c.placed === 'bbox' && c.bottom > c.imgTop - 10 && c.bottom < c.imgBot && c.cx > c.il && c.cx < c.ir, 'coroa Tera no topo real do sprite ' + JSON.stringify(c));
  await p.screenshot({ path: '/workspace/pk-tmp/tera-coroa-v51.png' });
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
