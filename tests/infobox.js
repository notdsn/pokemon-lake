// Caixas de HP não podem cobrir os sprites (375x667 e 320x568, com zoom da câmera, Dinamax e sprites grandes)
const { chromium } = require('/workspace/pk-pw/node_modules/playwright-core');
const fs = require('fs');
const HASH = fs.readFileSync('/workspace/pokemon-lake/js/app.js', 'utf8').match(/PASS_HASH = '([0-9a-f]+)'/)[1];
const URL = process.argv[2] || 'http://127.0.0.1:18473/';
const MODE = process.env.MODE || 'depois', LIVE = URL.includes('github.io') ? 'live-' : '';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [w, h] of [[375, 667], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); await ctx.addInitScript(h => localStorage.setItem('pkLake.unlock', h), HASH); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); const ev = (f, a) => p.evaluate(f, a);
    await p.goto(URL); await p.fill('#au', 'Edson'); await p.fill('#ap', 'teste123'); await p.click('#accForm button.primary');
    await p.fill('#tn', 'Edson'); await p.click('#next'); await p.click('.starter[data-id="1"]'); await p.click('.mbtns .btn.primary'); await p.click('.mbtns .btn.primary');
    await p.waitForTimeout(500); await ev(() => document.querySelector('#modal-root').innerHTML = '');
    for (const [pid, eid] of [[384, 321], [321, 384], [6, 9]]) {
      await ev(([pid, eid]) => { document.querySelector('#battle')?.remove(); const S = PokeApp.debug.S; S.party.unshift(PokeApp.PE.makeMon(pid, 60, { seed: 2 }, { shiny: false }));
        PokeApp.debug.startBattle({ kind: 'wild', map: PC.MAPS.find(m => m.id === 'floresta'), enemy: [PokeApp.PE.makeMon(eid, 60, { seed: 5 }, { shiny: false })] }); }, [pid, eid]);
      await p.waitForTimeout(3800);
      if (pid === 384 && MODE !== 'x') await p.screenshot({ path: `/workspace/pokemon-lake/prints/v2/${w}x${h}-infobox-${LIVE}rayquaza-${MODE}.png` });
      for (const st of ['normal', 'cam-p', 'cam-e', 'dmax']) {
        const r = await ev(async st => { const sc = document.querySelector('.bscene'); sc.classList.remove('cam-p', 'cam-e'); document.querySelectorAll('.bmon').forEach(x => x.classList.remove('dmax'));
          if (st.startsWith('cam')) sc.classList.add(st); if (st === 'dmax') document.querySelectorAll('.bmon').forEach(x => x.classList.add('dmax'));
          await new Promise(r => setTimeout(r, 650));
          const box = el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
          const drawn = img => { const r = img.getBoundingClientRect(), nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, s = Math.min(r.width / nw, r.height / nh), dw = nw * s, dh = nh * s; // object-fit contain, ancorado embaixo
            return [r.left + (r.width - dw) / 2, r.bottom - dh, r.left + (r.width + dw) / 2, r.bottom]; };
          const inter = (a, c) => Math.max(0, Math.min(a[2], c[2]) - Math.max(a[0], c[0])) * Math.max(0, Math.min(a[3], c[3]) - Math.max(a[1], c[1]));
          const infos = [box(document.querySelector('#einfo')), box(document.querySelector('#pinfo'))], sp = [drawn(document.querySelector('#esp')), drawn(document.querySelector('#psp'))];
          let worst = 0; for (const i of infos) for (const s of sp) worst = Math.max(worst, inter(i, s)); return worst; }, st);
        ok(r < 1, `${w}x${h} ${pid}x${eid} ${st}: sobreposição ${r.toFixed(1)}px²`);
      }
      await ev(() => { const sc = document.querySelector('.bscene'); sc.classList.remove('cam-p', 'cam-e'); document.querySelectorAll('.bmon').forEach(x => x.classList.remove('dmax')); });
    }
    ok(!errs.length, 'sem erros JS ' + JSON.stringify(errs)); await ctx.close(); }
  console.log(fail ? 'FALHAS: ' + fail : 'TUDO OK'); await b.close(); process.exit(fail ? 1 : 0); })();
