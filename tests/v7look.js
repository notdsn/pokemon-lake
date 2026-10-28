// Insígnias de metal + Minha Casa ilustrada. Uso: node tests/v7look.js [URL] [antes|depois]
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs'); const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/', PH = process.argv[3] || 'depois', OUT = '/workspace/pokemon-lake/prints/v2/', TAG = URL.includes('github.io') ? 'v7live' : 'v7';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, timezoneId: 'America/Sao_Paulo' }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); await ctx.addInitScript(() => { window.__pkFace = 1; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.stack); });
  const shot = async n => { await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}375x667-${TAG}-${n}-${PH}.png` }); }; const ev = (f, a) => p.evaluate(f, a); const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary'); await p.waitForTimeout(600); await clr();
  await ev(() => { const S = PokeApp.debug.S; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = true; S.jbadges = [0, 1, 2, 3, 4]; S.house = { slots: ['bed', 'clock', 'plant', 'tv', 'rug', 'sofa', 'doll25', 'aqua'], owned: { bed: 1, clock: 1, plant: 1, tv: 1, rug: 1, sofa: 1, doll25: 1, aqua: 1, books: 1, lamp: 1 }, wall: 'w0', walls: { w0: 1 } }; PokeApp.debug.save(); PokeApp.debug.go('home'); });
  await clr(); await shot('home-card');
  await ev(() => PokeApp.debug.go('card')); await shot('badge-case');
  await ev(() => PokeApp.debug.go('house')); await shot('house'); await ev(() => document.querySelector('.stygrid').scrollIntoView()); await shot('house-shop');
  if (PH === 'depois') {
    const h = await ev(() => PokeApp.debug.S.house); ok(h.v2 && h.wslots.includes('clock') && !h.slots.includes('clock') && h.slots.filter(Boolean).length === 7, `relógio migrado para a parede, nada perdido ${JSON.stringify(h.slots)} ${JSON.stringify(h.wslots)}`);
    ok(await ev(() => document.querySelectorAll('.room .fspot.has img.fa, .room .fspot.has .fpk').length === 7 && document.querySelectorAll('.room .badge.pin img').length === 13), 'móveis ilustrados + insígnias de metal na estante');
    await ev(() => { PokeApp.debug.S.house.owned.poster = 1; PokeApp.debug.render(); }); await ev(() => document.querySelector('[data-a="hslot"][data-w="1"][data-i="1"]').click()); await p.waitForTimeout(300);
    ok(await ev(() => !!document.querySelector('[data-f="poster"]') && !document.querySelector('[data-f="bed"]')), 'parede só aceita itens de parede'); await ev(() => document.querySelector('[data-f="poster"]').click()); await p.waitForTimeout(300);
    ok(await ev(() => PokeApp.debug.S.house.wslots[1] === 'poster'), 'pendurou pôster'); await ev(() => window.scrollTo(0, 0)); await shot('house-wall');
    const imgs = await ev(() => Promise.all([...document.querySelectorAll('.room img')].map(i => i.complete ? i.naturalWidth : new Promise(r => { i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); })))); ok(imgs.every(w => w > 0), `todas as imagens do quarto carregam (${imgs.length})`);
  }
  const busy = async () => { for (let w = 0; w < 60 && await ev(() => PokeApp.debug.B && PokeApp.debug.B.busy); w++) await p.waitForTimeout(300); };
  const winBattle = async () => { for (let t = 0; t < 60 && await ev(() => !!PokeApp.debug.B && !PokeApp.debug.B.s.over); t++) { await ev(() => [...document.querySelectorAll('#modal-root button, #battle .bmsg, #battle .tap')].forEach(b => !/Parar|Mais|Voltar/.test(b.textContent) && b.click())); await busy(); await ev(() => { const B = PokeApp.debug.B; if (!B || B.busy) return; B.s.sides[1].party.forEach(m => { m.hp = m === B.s.sides[1].b.m ? 1 : 0; }); B.s.sides[0].party.forEach(m => { m.hp = PokeApp.PE.maxhp(m); m.status = null; }); const pm = B.s.sides[0].b.m, sure = PDATA.mons[B.s.sides[1].b.m.id].t.includes('ghost') ? 'shadow-ball' : 'swift'; if (PDATA.moves[sure]) pm.moves[0] = { n: sure, pp: 20 }; const mv = B.s.sides[0].b.m.moves[0]; PokeApp.debug.act({ type: 'move', n: mv.n }); }); await p.waitForTimeout(900); } };
  await ev(() => { const S = PokeApp.debug.S; S.badges = [0, 1, 2]; S.party[0].lvl = 100; PokeApp.debug.healAll(); PokeApp.debug.save(); }); await ev(() => PokeApp.debug.runAct('gym', { i: 3 })); await clr(); await p.waitForTimeout(3000);
  for (let w = 0; w < 20 && !(await ev(() => !!PokeApp.debug.B)); w++) await p.waitForTimeout(300); await winBattle();
  for (let w = 0; w < 40 && await ev(() => !!PokeApp.debug.B); w++) { await p.waitForTimeout(300); if (await ev(() => !!document.querySelector('.badgewin'))) break; await ev(() => [...document.querySelectorAll('#modal-root button')].forEach(b => !/Parar/.test(b.textContent) && b.click())); }
  for (let w = 0; w < 30 && !(await ev(() => !!document.querySelector('.badgewin .bigbadge'))); w++) await p.waitForTimeout(400); await p.waitForTimeout(1200); await shot('gym-win');
  if (PH === 'depois') ok(await ev(() => !!document.querySelector('.badgewin .bigbadge .badge.pin img[src*="k3"]')), 'tela de vitória com a Insígnia Arco-Íris de metal');
  ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
