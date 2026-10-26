// Teste de balanceamento: Moltres Nv50 deve nocautear Rattata Nv5 com um golpe (100 sementes)
require('../js/data-gen.js'); const PE = require('../js/engine.js'); let fail = 0;
const cases = [[146, ['flamethrower', 'air-slash', 'heat-wave', 'roost']], [146, null], [700, ['moonblast', 'hyper-voice', 'calm-mind', 'shadow-ball']], [150, null], [6, null]];
for (const [id, mv] of cases) for (let k = 0; k < 100; k++) { const st = { seed: k };
  const A = PE.makeMon(id, 50, st, mv ? { moves: mv, iv: [31,31,31,31,31,31] } : {}), B = PE.makeMon(19, 5, st);
  const s = PE.createBattle({ kind: 'wild', seed: k, sides: [{ party: [A], name: 'A' }, { party: [B], name: 'B', ai: 1 }] });
  const best = A.moves.map((x, i) => [PE.movePower(x.n, id), i]).sort((a, b) => b[0] - a[0])[0][1];
  PE.step(s, [{ type: 'move', n: A.moves[best].n }, { type: 'move', n: B.moves[0].n }]);
  if (s.sides[1].party[0].hp > 0) { fail++; if (fail < 5) console.log('FALHOU', PDATA.mons[id].n, A.moves[best].n, 'seed', k, s.sides[1].party[0].hp); } }
console.log(fail ? 'FALHAS ' + fail : 'OK: todos os OHKO passaram'); process.exit(fail ? 1 : 0);
