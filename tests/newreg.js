// Região nova: lendas com missões, treinadores nos mapas, realismo (node tests/newreg.js [URL] galar)
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
  await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
  await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="4"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
  const K = process.argv[3] || 'galar', SH = n => `/workspace/pokemon-lake/prints/v2/375x667-${K}-${LIVE}${n}.png`;
  const clr = () => ev(() => document.querySelector('#modal-root').innerHTML = '');
  await p.waitForTimeout(500); await clr();
  const info = await ev(K => { const d = PokeApp.debug, S = d.S, G = PokeApp.regions; S.badges = [0, 1, 2, 3, 4, 5, 6, 7]; S.champion = true; S.jbadges = [0, 1, 2, 3, 4, 5, 6, 7]; S.jchampion = true;
    for (const k of G.REG_ORDER) { const s = G.rS(k); s.b = [0, 1, 2, 3, 4, 5, 6, 7]; s.ch = true; s.chs = 1; if (k === K) break; } S.region = K; d.save();
    const r = G.REG[K], qs = PokeApp.legq.filter(q => q.id.startsWith(r.k + '_'));
    return { maps: r.MAPS.map(m => [m.id, m.trainers.length]), qs: qs.map(q => [q.id, q.req(), q.steps.filter(s => s.t === 'hunt').map(s => [s.id, s.map, !!r.MAPS.find(m => m.id === s.map)])]) }; }, K);
  ok(info.maps.every(m => m[1] >= 3), 'treinadores em todos os mapas: ' + info.maps.map(m => m[1]).join(','));
  ok(info.qs.length >= 3 && info.qs.every(q => q[1]), `${info.qs.length} missões de lendários liberadas`);
  ok(info.qs.every(q => q[2].every(h => h[2])), 'cada caçada aponta para um mapa da região');
  // cada mapa: cena limpa, clima, animação do parceiro, sem erros
  for (const [id] of info.maps) { await ev(id => PokeApp.debug.go('explore', id), id); await p.waitForTimeout(350); await clr();
    const st = await ev(() => { const sc = document.querySelector('#scene'); return [!!sc && sc.classList.contains('tidy'), /\bw-\w+/.test(sc.className), /\bper-\w+/.test(sc.className), !!document.querySelector('#scene img.me'), document.querySelectorAll('.trow').length]; });
    if (!st.every(Boolean)) ok(0, id + ' ' + JSON.stringify(st)); }
  ok(1, 'todos os mapas com cena limpa, clima, período, treinador e lista de treinadores');
  // treinador aleatório: batalha começa
  await ev(id => PokeApp.debug.go('explore', id), info.maps[0][0]); await p.waitForTimeout(400); await clr(); await p.screenshot({ path: SH('mapa') });
  await p.evaluate(() => document.querySelector('.trow').scrollIntoView()); await p.waitForTimeout(200); await p.screenshot({ path: SH('treinadores') });
  await ev(() => document.querySelector('.trow [data-a="trainer"]').click()); for (let w = 0; w < 20 && !(await ev(() => !!PokeApp.debug.B)); w++) await p.waitForTimeout(200);
  ok(await ev(() => !!PokeApp.debug.B && PokeApp.debug.B.s.kind === 'trainer'), 'batalha contra treinador do mapa'); await p.waitForTimeout(2500); await p.screenshot({ path: SH('batalha-treinador') });
  ok(await ev(() => !!document.querySelector('.bmon.live')), 'animação 2D na batalha da região');
  const fresh = async () => { await ev(() => PokeApp.debug.save()); await p.reload(); await p.waitForFunction(() => window.PokeApp && PokeApp.debug && PokeApp.debug.S); await p.waitForTimeout(400); await clr(); }; await fresh();
  // caçada de cada lenda: botão no mapa certo abre batalha com o lendário
  let hunts = 0;
  for (const [qid, , hs] of info.qs) for (let si = 0; si < hs.length; si++) {
    const [mid, map] = hs[si]; await ev(([qid, mid]) => { const S = PokeApp.debug.S, q = PokeApp.legq.find(x => x.id === qid); S.legq = S.legq || {}; S.legq[qid] = q.steps.findIndex(s => s.t === 'hunt' && s.id === mid); delete S.dex.caught[mid]; PokeApp.debug.go('explore', q.steps[S.legq[qid]].map); }, [qid, mid]);
    await p.waitForTimeout(300); await clr();
    const has = await ev(qid => !!document.querySelector(`[data-a="leghunt"][data-q="${qid}"]`), qid); if (!has) { ok(0, `botão da caçada ${qid}/${mid} em ${map}`); continue; }
    if (hunts === 0) await p.screenshot({ path: SH('lenda-botao') });
    await ev(qid => { PokeApp.debug.healAll(); document.querySelector(`[data-a="leghunt"][data-q="${qid}"]`).click(); }, qid);
    for (let w = 0; w < 30 && !(await ev(() => !!PokeApp.debug.B)); w++) { await p.waitForTimeout(200); await ev(() => document.querySelector('#modal-root .btn.primary')?.click()); }
    const eid = await ev(() => PokeApp.debug.B && PokeApp.debug.B.s.sides[1].b.m.id);
    if (eid !== mid) ok(0, `caçada ${qid}: esperado ${mid}, veio ${eid}`); else hunts++;
    if (hunts === 1) { await p.waitForTimeout(2200); await p.screenshot({ path: SH('lenda-batalha') }); ok(await ev(() => document.querySelector('.emon')?.classList.contains('nolive')), 'lendário sem animação nova (fica como está)'); }
    await fresh(); }
  ok(hunts === info.qs.reduce((a, q) => a + q[2].length, 0), `${hunts} caçadas de lendários abrem a batalha certa`);
  ok(errs.length === 0, 'sem erros: ' + errs.join(' | '));
  console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
