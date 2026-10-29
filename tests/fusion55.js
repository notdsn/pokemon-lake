// Movimento 2D
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-fusao-${LIVE}${n}-v55.png`;
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
  const crypto = require('crypto');
  const fps = async () => { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); const f = await ev(() => new Promise(r => { let n = 0, t0 = performance.now(); const f = t => { n++; if (t - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / ((t - t0) / 1000))); }; requestAnimationFrame(f); })); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); return f; };
  const apng = u => ev(async u => { const b = new Uint8Array(await (await fetch(u)).arrayBuffer()); let p = 8, fr = 0, ok = b[1] === 80; while (p < b.length) { const n = (b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3]) >>> 0, t = String.fromCharCode(...b.slice(p + 4, p + 8)); if (t === 'acTL') fr = (b[p + 8] << 24 | b[p + 9] << 16 | b[p + 10] << 8 | b[p + 11]) >>> 0; p += 12 + n; } return { ok, fr, size: b.length }; }, u);
  await ev(() => { const d = PokeApp.debug, S = d.S; S.money = 99999; const a = d.mkTeam([[6, 40]], 1, 0)[0], b = d.mkTeam([[7, 30]], 1, 0)[0], l = d.mkTeam([[150, 70]], 1, 0)[0]; S.party.unshift(a); S.box.push(b, l); d.save(); PokeApp.g4.pick(a.uid, b.uid); d.go('fusion'); });
  await p.waitForTimeout(500); ok(await ev(() => { document.querySelector('[data-a="fzsel"]').click(); const r = ![...document.querySelectorAll('#modal-root .exm img')].some(i => /\/150\./.test(i.src) || /150/.test(i.dataset.full || '')); return r; }), 'lendário (Mewtwo) não aparece para fusão'); await clr();
  await ev(() => { const S = PokeApp.debug.S; PokeApp.g4.pick(S.party[0].uid, S.box.find(m => m.id === 7).uid); PokeApp.debug.go('fusion'); }); await p.waitForTimeout(400);
  const t0 = Date.now(); await p.click('[data-a="fzgo"]'); await p.waitForSelector('.fzflash img', { timeout: 15000 }); const gen = Date.now() - t0; await p.waitForTimeout(1300);
  const fsrc = await ev(() => document.querySelector('.fzflash img').src); const ap = await apng(fsrc);
  ok(fsrc.startsWith('blob:') && ap.ok && ap.fr > 1, `modal "Fusão completa": APNG animado (${ap.fr} quadros, ${Math.round(ap.size / 1024)} KB, gerado em ${gen} ms)`);
  await p.screenshot({ path: OUT('modal') }); await clr();
  // team (mini recolorida) e Fusodex
  await ev(() => PokeApp.debug.go('team')); await p.waitForTimeout(400); await ev(() => PokeApp.fza.wait()); await p.waitForTimeout(800);
  const tm = await ev(() => { const i = [...document.querySelectorAll('img')].find(i => PokeApp.fza.info.get(i.getAttribute('src'))); const f = i && PokeApp.fza.info.get(i.getAttribute('src')); return f ? f.kind + (i.classList.contains('mini') ? '+mini' : '') : null; });
  ok(tm === 'm+mini', 'time: fusão em mini recolorida com movimento de mini (' + tm + ')'); await p.screenshot({ path: OUT('time') });
  await ev(() => PokeApp.debug.go('fusion')); await p.waitForTimeout(400); await ev(() => PokeApp.fza.wait()); await p.waitForTimeout(800);
  const fd = await ev(() => document.querySelector('.fzd .fzanim').getAttribute('src')); ok(fd.startsWith('blob:'), 'Fusodex mostra a fusão animada'); await p.evaluate(() => document.querySelector('.fzdex').scrollIntoView()); await p.screenshot({ path: OUT('fusodex') });
  // batalha frente e costas
  await ev(() => { const d = PokeApp.debug; const S = d.S; const f = S.party[0]; d.startBattle({ kind: 'wild', enemy: [JSON.parse(JSON.stringify(f))].map(m => (m.uid = 'x' + m.uid, m.hp = 999, m)), map: PokeApp.C.MAPS[1] }); });
  for (let w = 0; w < 30 && !(await ev(() => !!document.querySelector('.wheel54'))); w++) await p.waitForTimeout(300); await ev(() => PokeApp.fza.wait()); await p.waitForTimeout(700);
  const bt = await ev(() => { const k = s => (PokeApp.fza.info.get(document.querySelector(s).getAttribute('src')) || {}).kind; return [k('#psp'), k('#esp'), document.querySelector('.pmon').classList.contains('live'), document.querySelector('.emon').classList.contains('live')]; });
  ok(bt[0] === 'b' && bt[1] === 'f', 'batalha: costas e frente da fusão animadas (' + bt.slice(0, 2) + ')'); ok(bt[2] && bt[3], 'batalha: respiração 2D ativa nas fusões');
  const shots = []; const box = await (await p.$('.emon img')).boundingBox(); const clip = { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 };
  for (let i = 0; i < 16; i++) { shots.push(await p.screenshot({ clip })); await p.waitForTimeout(90); }
  const hs = new Set(shots.map(s => crypto.createHash('md5').update(s).digest('hex'))); ok(hs.size > 3, `fusão se mexe na tela (${hs.size} quadros diferentes em 1,5s)`);
  shots.forEach((s, i) => fs.writeFileSync(`/tmp/fz55-${String(i).padStart(2, '0')}.png`, s));
  const pshots = []; const pb = await (await p.$('.pmon img')).boundingBox(); for (let i = 0; i < 16; i++) { pshots.push(await p.screenshot({ clip: { x: Math.max(0, pb.x - 6), y: pb.y - 6, width: pb.width + 12, height: pb.height + 12 } })); await p.waitForTimeout(90); }
  pshots.forEach((s, i) => fs.writeFileSync(`/tmp/fz55b-${String(i).padStart(2, '0')}.png`, s));
  await p.screenshot({ path: OUT('batalha') }); const f1 = await fps(); ok(f1 >= 50, `batalha com fusões animadas: ${f1} fps (CPU 4x)`);
  await p.click('[data-b="fight"]'); await p.waitForTimeout(200); await p.click('.mvb'); await p.waitForTimeout(3500); ok(await ev(() => !!document.querySelector('#psp') && !!PokeApp.fza.info.get(document.querySelector('#psp').getAttribute('src'))), 'golpe/dano: fusão continua animada');
  await ev(() => { document.querySelector('#battle')?.remove(); document.body.classList.remove('in-battle'); });
  // fallback e save antigo
  ok(await ev(async () => { const r = await PokeApp.fza.fzEnsure('teste-falha', 99999, 7, false, 'f'); return r === null && PokeApp.fza.fail.has('teste-falha'); }), 'decodificação falhou → fica a imagem estática (fallback)');
  await ev(() => PokeApp.debug.save()); await ev(() => new Promise(r => { const q = indexedDB.deleteDatabase('pkLakeFz'); q.onsuccess = q.onerror = q.onblocked = () => r(); setTimeout(r, 1500); }));
  await p.reload(); await p.waitForTimeout(1500); await clr();
  const old = await ev(() => { const f = PokeApp.debug.S.party[0]; return !!(f.fz && f.fz.img && f.fz.img.startsWith('data:image/png')); }); ok(old, 'save mantém a imagem estática antiga (fz.img) intacta');
  await ev(() => PokeApp.debug.go('team')); await p.waitForTimeout(400); await ev(() => PokeApp.fza.wait()); await p.waitForTimeout(900);
  ok(await ev(() => [...document.querySelectorAll('img')].some(i => (PokeApp.fza.info.get(i.getAttribute('src')) || {}).kind === 'm')), 'save antigo sem cache: versão animada regenerada sozinha');
  const f2 = await fps(); ok(f2 >= 50, `time: ${f2} fps (CPU 4x)`);
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
