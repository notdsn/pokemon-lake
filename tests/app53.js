// v53 cara de app + cartão compartilhável
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
  await ev(() => { const d = PokeApp.debug, S = d.S; const t = d.mkTeam([[6, 52], [130, 40], [25, 33]], 1, 0); t[1].shiny = true; S.party.push(...t); d.save(); });
  const toasts = []; await p.exposeFunction('__t', s => toasts.push(s)); await ev(() => new MutationObserver(() => document.querySelectorAll('.toast, #toast, .toasts > *').forEach(t => window.__t(t.textContent))).observe(document.body, { childList: true, subtree: true }));
  for (const W of [375, 320]) {
    await p.setViewportSize({ width: W, height: 667 }); await ev(() => PokeApp.debug.go('home')); await p.waitForTimeout(1500); await clr();
    const r = await ev(() => ({ news: document.querySelectorAll('.news53 .nw-s').length, snap: getComputedStyle(document.querySelector('.nw-track')).scrollSnapType, q: document.querySelectorAll('.qcar53 .qc-s').length, qsnap: getComputedStyle(document.querySelector('.qc-track')).scrollSnapType, dot: document.querySelector('.nav [data-t="more"]').classList.contains('ndot53'), share: !!document.querySelector('.tc2-share'), ov: document.documentElement.scrollWidth <= innerWidth + 1, order: document.querySelector('.card.hero').nextElementSibling.classList.contains('news53') }));
    ok(r.news >= 3 && /x/.test(r.snap) && r.order, `${W}: banner "Novidades do dia" logo abaixo do cartão (${r.news} slides)`);
    ok(r.q >= 5 && /x/.test(r.qsnap), `${W}: carrossel de missões deslizável (${r.q})`);
    ok(r.dot, `${W}: bolinha de raide nova no Mais`); ok(r.share && r.ov, `${W}: botão compartilhar + sem overflow`);
    await p.screenshot({ path: `/workspace/pk-tmp/inicio-app-${W}-${LIVE}v53.png` });
    await p.evaluate(() => window.scrollTo(0, document.querySelector('.news53').offsetTop - 70)); await p.waitForTimeout(300); await p.screenshot({ path: `/workspace/pk-tmp/inicio-app-${W}-carrossel-${LIVE}v53.png` }); await p.evaluate(() => window.scrollTo(0, 0));
    // swipe missões
    const sl = await ev(async () => { const t = document.querySelector('.qc-track'); t.scrollTo({ left: 400 }); await new Promise(r => setTimeout(r, 400)); return t.scrollLeft; }); ok(sl > 100, `${W}: missões rolam para o lado`);
  }
  await p.waitForTimeout(800); ok(toasts.some(t => /Raide nova disponível/.test(t)), 'toast "Raide nova disponível"');
  await ev(() => PokeApp.debug.go('raid')); await p.waitForTimeout(600); await clr(); await ev(() => PokeApp.debug.go('home')); await p.waitForTimeout(600);
  ok(await ev(() => !document.querySelector('.nav [data-t="more"]').classList.contains('ndot53') && PokeApp.debug.S.seen53 && !!PokeApp.debug.S.seen53.raid), 'aviso some após ver as raides (salvo)');
  // cartão PNG
  const png = await ev(async () => { const bl = await PokeApp.card53.cardPng(); const u = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(bl); }); return { size: bl.size, type: bl.type, u }; });
  ok(png.type === 'image/png' && png.size > 50000, 'cartão exportado como PNG (' + png.size + ' bytes)'); fs.writeFileSync('/workspace/pk-tmp/cartao-compartilhavel-' + LIVE + 'v53.png', Buffer.from(png.u.split(',')[1], 'base64'));
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await ev(() => { navigator.canShare = () => false; }); await p.click('.tc2-share'); const d = await dl; ok(!!d && /\.png$/.test(d.suggestedFilename()), 'sem Web Share: baixa o PNG (' + (d && d.suggestedFilename()) + ')');
  const sh = await ev(async () => { let got = null; navigator.canShare = o => !!(o && o.files); navigator.share = async o => { got = o.files[0].type + ':' + o.files[0].size; }; document.querySelector('.tc2-share').click(); for (let i = 0; i < 40 && !got; i++) await new Promise(r => setTimeout(r, 150)); return got; });
  ok(sh && sh.startsWith('image/png'), 'com Web Share: compartilha o arquivo PNG (' + sh + ')');
  ok(!errs.length, 'sem erros ' + errs.slice(0, 2)); await b.close(); console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0); })();
