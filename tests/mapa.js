// Tela do mapa limpa: cena livre, botões embaixo, chips só com ícone (375/412/320)
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
const at = h => new Date(2026, 9, 27, Math.floor(h), Math.round((h % 1) * 60));
(async () => { for (const W of [375, 412, 320]) {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const TAG = process.argv[3] || 'depois', SH = n => `/workspace/pokemon-lake/prints/v2/${W}-mapa-${LIVE}${n}-${TAG}.png`;
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  await ev(() => { const m = (PokeApp.C?.MAPS || []).find(m => /ecruteak/i.test(m.name)); PokeApp.debug.go('explore', m ? m.id : 'floresta'); });
  await p.waitForTimeout(900); await clr();
  const rain = () => ev(() => { const s = document.querySelector('#scene'); s.className = s.className.replace(/\bw-\w+/g, '') + ' w-rain'; s.querySelectorAll('.wxramp').forEach(x => x.classList.add('wxon')); });
  await rain(); await p.waitForTimeout(400); await p.screenshot({ path: SH('cena') });
  const geo = await ev(() => { const r = q => { const e = document.querySelector(q); return e && e.getBoundingClientRect(); }; const me = r('#scene img.me, #scene .me'), sc = r('#scene'), btn = r('#searchBtn'), tops = [...document.querySelectorAll('#scene .ex-top .chip, #scene .ex-top .btn')].map(e => e.getBoundingClientRect());
    return { me: me && [me.top, me.bottom], sc: sc && [sc.top, sc.bottom], btn: btn && [btn.top, btn.height], topMaxW: Math.max(...tops.map(t => t.width)), topBot: Math.max(...tops.map(t => t.bottom)), wx: getComputedStyle(document.querySelector('#scene .wx')).opacity }; });
  console.log(W, JSON.stringify(geo));
  if (TAG === 'depois') { ok(geo.btn[0] >= geo.me[1] - 2, `${W}: botões não cobrem o treinador`); ok(geo.btn[1] <= 44, `${W}: botões compactos (${geo.btn[1]}px)`);
    ok(geo.topMaxW <= 48, `${W}: chips só com ícone (${geo.topMaxW}px)`); ok(geo.topBot <= geo.me[0], `${W}: chips não cobrem o treinador`); ok(+geo.wx <= 0.4, `${W}: chuva mais leve (${geo.wx})`); }
  await p.click('#searchBtn'); for (let w = 0; w < 40 && !(await ev(() => !!document.querySelector('.wildpeek'))); w++) await p.waitForTimeout(100); await p.waitForTimeout(300); await rain(); await p.waitForTimeout(250); await p.screenshot({ path: SH('selvagem') });
  if (TAG === 'depois') { const wp = await ev(() => { const w = document.querySelector('.wildpeek'), b = document.querySelector('#searchBtn, .exbtns'), sc = document.querySelector('#scene'); if (!w) return 'sem'; const a = w.getBoundingClientRect(), c = b.getBoundingClientRect(), s = sc.getBoundingClientRect(); return [a.top >= s.top - 1, a.bottom <= c.top + 2]; });
    ok(wp === 'sem' || (wp[0] && wp[1]), `${W}: Pokémon selvagem inteiro visível ${JSON.stringify(wp)}`); }
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | ')); await b.close(); }
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0);
})();
