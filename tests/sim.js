require('../js/data-gen.js'); const PE = require('../js/engine.js');
const ids = Object.keys(PDATA.mons).map(Number); let n = +process.argv[2] || 200, err = 0, turns = 0;
for (let k = 0; k < n; k++) { const st = { seed: k };
  const mk = () => Array.from({ length: 3 }, () => PE.makeMon(ids[PE.ri(st, 0, ids.length - 1)], PE.ri(st, 5, 60), st));
  const run = (seed) => { const s = PE.createBattle({ kind: 'trainer', seed, sides: [{ party: JSON.parse(JSON.stringify(A)), name: 'A', ai: 1 }, { party: JSON.parse(JSON.stringify(B)), name: 'B', ai: 1 }] });
    let log = ''; let t = 0; while (!s.over && t++ < 300) { const ev = PE.step(s, [PE.aiAction(s, 0), PE.aiAction(s, 1)]); log += JSON.stringify(ev);
      for (const i of [0, 1]) if (PE.needSwitch(s, i)) log += JSON.stringify(PE.forceSwitch(s, i, PE.aiSwitchIdx(s, i))); } return [log, t, s.over]; };
  const A = mk(), B = mk();
  try { const r1 = run(k * 7), r2 = run(k * 7); if (r1[0] !== r2[0]) { console.log('NÃO determinístico', k); err++; } if (!r1[2]) console.log('não terminou', k); turns += r1[1]; }
  catch (e) { err++; console.log(k, e.stack); break; } }
console.log('batalhas', n, 'erros', err, 'turnos médios', (turns / n).toFixed(1));
