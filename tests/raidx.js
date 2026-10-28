// Raide: ação extra do chefe ("está furioso e age de novo") não pode travar a batalha.
require('../js/data-gen.js'); const PE = require('../js/engine.js');
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
function raid(seed, bossLv, partyLv, n, shieldAt) {
  const st = { seed }; const boss = PE.makeMon(6, bossLv, st, { iv: Array(6).fill(31) }); boss.dmax = { t: 999, g: 0 }; boss.raidHp = 4; boss.hp = PE.maxhp(boss);
  const party = [PE.makeMon(25, partyLv, st), PE.makeMon(7, partyLv, st), PE.makeMon(1, partyLv, st)].slice(0, n);
  const s = PE.createBattle({ kind: 'wild', seed, sides: [{ party, name: 'Eu' }, { party: [boss], name: 'B', ai: 2 }] });
  let turns = 0, extras = 0, faintMid = 0, shieldExtra = 0, stuck = null;
  try { while (!s.over && turns++ < 60) {
    PE.step(s, [PE.aiAction(s, 0), PE.aiAction(s, 1)]);
    if (shieldAt && turns === shieldAt && boss.hp > 0) boss.shield = 6;
    if (!s.over && boss.hp > 0 && s.sides[0].b.m.hp > 0) { const before = s.sides[0].b.m.hp; const ev = PE.step(s, [null, PE.aiAction(s, 1)]); extras++;
      if (!ev.length) stuck = 'extra sem eventos'; if (boss.shield) shieldExtra++; if (before > 0 && s.sides[0].b.m.hp <= 0) faintMid++; }
    if (!s.over && PE.needSwitch(s, 0)) PE.forceSwitch(s, 0, PE.aiSwitchIdx(s, 0));
    if (!s.over && PE.aiAction(s, 0) == null) stuck = 'jogador sem ação';
  } } catch (e) { stuck = e.message; }
  return { s, turns, extras, faintMid, shieldExtra, stuck };
}
let r = raid(1, 25, 50, 3); ok(!r.stuck && r.extras >= 3, `ação extra em vários turnos (${r.extras}x) sem travar ${r.stuck || ''}`);
r = raid(2, 100, 10, 1); ok(!r.stuck && r.s.over && r.s.winner === 1, `chefe derruba o jogador -> batalha termina ${r.stuck || ''}`);
{ let k = 0; do { r = raid(300 + k, 20 + k % 30, 20 + k % 20, 3); } while (!r.stuck && !r.faintMid && ++k < 300); } ok(!r.stuck && r.faintMid > 0, `jogador desmaia na ação extra -> troca e continua (${r.faintMid}) ${r.stuck || ''}`);
r = raid(4, 25, 45, 3, 1); ok(!r.stuck && r.shieldExtra > 0, `ação extra com barreira ativa (${r.shieldExtra}) ${r.stuck || ''}`);
for (let k = 0; k < 200; k++) { const q = raid(100 + k, 30 + k % 70, 20 + k % 50, 1 + k % 3, k % 4); if (q.stuck) { ok(0, `seed ${k}: ${q.stuck}`); break; } }
ok(1, '200 raides aleatórios sem erro');
console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0);
