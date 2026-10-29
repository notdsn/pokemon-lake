// Movimento 2D
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const OUT = n => `/workspace/pokemon-lake/prints/v2/375x667-semEmoji-${process.argv[3] || LIVE}${n}-v57.png`;
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
  const scan = async where => { const r = await ev(() => { const RX = /\p{Extended_Pictographic}/u, bad = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.parentNode.closest('script,style')) continue; if (RX.test(n.nodeValue)) bad.push(n.nodeValue.trim().slice(0, 30)); }
      document.querySelectorAll('*').forEach(e => ['title', 'aria-label', 'placeholder', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v && RX.test(v)) bad.push('@' + a + ':' + v.slice(0, 20)); }));
      const st = document.querySelectorAll('*'); for (const e of [...st].slice(0, 4000)) { for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps).content; if (c && c !== 'none' && RX.test(c)) { bad.push(ps + ':' + c); break; } } }
      return { bad: [...new Set(bad)].slice(0, 6), n: bad.length, ic: document.querySelectorAll('svg.ic').length }; }); ok(!r.n, `${where}: sem emoji (${r.ic} ícones desenhados)${r.n ? ' → ' + r.bad.join(' | ') : ''}`); return r; };
  await ev(() => { const d = PokeApp.debug, S = d.S; S.money = 50000; S.party.push(...d.mkTeam([[6, 52], [130, 40], [25, 33]], 1, 0)); S.bag['great-ball'] = 3; S.bag['super-potion'] = 2; S.bag['revive'] = 1; d.save(); });
  const hide = () => ev(() => document.querySelectorAll('.toast').forEach(t => t.style.visibility = 'hidden'));
  for (const t of ['home', 'maps', 'team', 'more', 'shop', 'center', 'bag', 'dex', 'card', 'quests', 'games', 'ach', 'raid', 'arena', 'house', 'style', 'pass', 'events', 'exped', 'album', 'settings', 'daycare', 'legends', 'safari', 'fusion', 'saves']) {
    await ev(t => PokeApp.debug.go(t), t); await p.waitForTimeout(450); await clr(); await scan('tela ' + t); if (['home', 'more', 'bag', 'shop', 'quests', 'ach'].includes(t)) { await hide(); await p.screenshot({ path: OUT(t) }); } }
  await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(900); await clr(); await scan('explorar mapa');
  await ev(() => PokeApp.debug.startBattle({ kind: 'wild', enemy: PokeApp.debug.mkTeam([[16, 12]], 1, 0), map: PokeApp.C.MAPS[1] })); await p.waitForTimeout(3200); await clr(); await scan('batalha'); await hide(); await p.screenshot({ path: OUT('batalha') });
  await p.click('[data-b="bag"]'); await p.waitForTimeout(300); await scan('batalha: mochila'); await p.screenshot({ path: OUT('batalha-mochila') }); await p.click('[data-b="back"]'); await p.waitForTimeout(200);
  await p.click('[data-b="poke"]'); await p.waitForTimeout(300); await scan('batalha: trocar Pokémon'); await p.screenshot({ path: OUT('batalha-trocar') }); await p.click('[data-b="back"]');
  await p.click('[data-b="fight"]'); await p.waitForTimeout(200); await p.click('.mvb'); await p.waitForTimeout(2500); await scan('batalha: depois do golpe');
  await ev(() => { document.querySelector('#battle')?.remove(); document.body.classList.remove('in-battle'); });
  await ev(() => PokeApp.debug.toast ? PokeApp.debug.toast('🎉 teste ✨') : null); await p.waitForTimeout(100); await scan('aviso (toast)');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
