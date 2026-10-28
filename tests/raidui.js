// Raide: ação extra do chefe não trava (UI)
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.clock.setFixedTime(at(12));
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  await ev(() => PokeApp.debug.go('explore', 'floresta')); await p.waitForTimeout(700); await clr();
  await ev(() => { const d = PokeApp.debug, S = d.S; S.party.forEach(m => { m.lv = 45; }); d.healAll && d.healAll();
    const boss = d.mkTeam([[6, 28]], 1, 0)[0]; boss.dmax = { t: 999, g: 0 }; boss.raidHp = 4; boss.hp = PE.maxhp(boss); S.party.forEach(m => { m.lv = 45; Object.assign(m, PE.makeMon(m.id, 55, { seed: 1 }), { uid: m.uid }); }); boss.raidStars = 5;
    d.startBattle({ kind: 'wild', enemy: [boss], party: S.party, raid: { den: { stars: 5, id: 6, i: 0 }, left: 10, shields: 0, turn: 0 }, ai: 2, weather: null }); });
  await ev(() => { window.__fur = 0; new MutationObserver(() => { if (/furioso/.test(document.querySelector('#battle')?.innerText || '')) window.__fur = 1; }).observe(document.body, { subtree: true, childList: true, characterData: true }); });
  const menu = () => ev(() => !document.querySelector('#battle') || !!document.querySelector('#bctl [data-b="fight"], #bctl [data-b="sw"]:not([disabled])'));
  for (let w = 0; w < 40 && !(await menu()); w++) await p.waitForTimeout(250);
  let extras = 0, turns = 0, stuck = false;
  for (; turns < 5; turns++) {
    if (!(await ev(() => !!document.querySelector('#battle')))) break;
    await ev(() => { const sw = document.querySelector('#bctl [data-b="sw"]:not([disabled])'); if (sw && !document.querySelector('#bctl [data-b="fight"]')) sw.click(); });
    await p.waitForTimeout(600);
    if (!(await ev(() => !!document.querySelector('#bctl [data-b="fight"]')))) continue;
    await p.click('#bctl [data-b="fight"]'); await p.waitForTimeout(200); await p.click('#bctl [data-b="mv"]:not([disabled])');
    let back = false; for (let w = 0; w < 80; w++) { await p.waitForTimeout(250); if (await menu()) { back = true; break; } }
    const lg = await ev(() => (document.querySelector('#blog') || document.querySelector('#battle') || document.body).innerText);
    if (await ev(() => window.__fur)) { extras++; await ev(() => window.__fur = 0); }
    if (!back) { stuck = true; break; }
  }
  await p.screenshot({ path: `/workspace/pokemon-lake/prints/v2/375x667-raide-${LIVE}extra.png` });
  ok(!stuck, `depois de cada turno o menu volta (${turns} turnos)`);
  ok(extras > 0, 'a ação extra "furioso" aconteceu e a batalha seguiu');
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
