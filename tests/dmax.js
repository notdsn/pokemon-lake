// testes de engine: Dinamax/Gigantamax
require('../js/data-gen.js'); const PE = require('../js/engine.js'); let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FALHA ') + m); if (!c) fail++; };
const st = { seed: 5 }, mk = (id, l, o) => PE.makeMon(id, l, st, o || {});
// 1) Gigantamax Charizard: HP x2, Fogaréu G-Max, 3 turnos, volta proporcional
{ const z = mk(6, 60, { moves: ['flamethrower', 'air-slash', 'swords-dance'] }), base = PE.maxhp(z); const s = PE.createBattle({ kind: 'wild', seed: 1, sides: [{ party: [z], name: 'E', dyna: true }, { party: [mk(143, 70)], name: 'W' }] });
  ok(PE.canDyna(s, 0), 'pode Dinamaxar'); let ev = PE.step(s, [{ type: 'move', n: 'flamethrower', dyna: true }, { type: 'move', n: s.sides[1].b.m.moves[0].n }]);
  ok(ev.some(e => e.e === 'dyna' && e.gmax), 'evento Gigantamax'); ok(ev.some(e => e.e === 'use' && /Fogaréu G-Max/.test(e.text)), 'usou Fogaréu G-Max');
  ok(PE.maxhp(z) === base * 2, 'HP máximo dobrou'); ok(s.sides[1].gres && s.sides[1].gres.ty === 'fire', 'Fogaréu residual');
  ok(PE.maxMoveOf(z, PDATA.moves['swords-dance']).n === 'Barreira Max', 'status vira Barreira Max'); ok(PE.maxMoveOf(z, PDATA.moves['air-slash']).n === 'Corrente Max', 'Air Slash vira Corrente Max');
  ok(!PE.canDyna(s, 0), 'só 1 vez por batalha');
  for (let t = 0; t < 2 && !s.over; t++) ev = PE.step(s, [{ type: 'move', n: 'air-slash' }, { type: 'move', n: s.sides[1].b.m.moves[0].n }]);
  if (s.over) PE.revertMega([z]); ok(!z.dmax && PE.maxhp(z) === base && z.hp <= base, 'voltou ao normal após 3 turnos (HP ' + z.hp + '/' + base + ')'); }
// 2) Mega e Dinamax não combinam
{ const z = mk(6, 60, { moves: ['flamethrower'] }); z.item = 'charizardite-y'; const s = PE.createBattle({ kind: 'wild', seed: 2, sides: [{ party: [z], name: 'E', dyna: true, mega: true }, { party: [mk(143, 70)], name: 'W' }] });
  PE.step(s, [{ type: 'move', n: 'flamethrower', mega: true }, { type: 'move', n: s.sides[1].b.m.moves[0].n }]); ok(z.mega && !PE.canDyna(s, 0), 'depois de Mega não pode Dinamax');
  const z2 = mk(6, 60, { moves: ['flamethrower'] }); z2.item = 'charizardite-y'; const s2 = PE.createBattle({ kind: 'wild', seed: 2, sides: [{ party: [z2], name: 'E', dyna: true, mega: true }, { party: [mk(143, 70)], name: 'W' }] });
  PE.step(s2, [{ type: 'move', n: 'flamethrower', dyna: true }, { type: 'move', n: s2.sides[1].b.m.moves[0].n }]); ok(z2.dmax && !PE.canMega(s2, 0), 'depois de Dinamax não pode Mega'); PE.revertMega([z2]); ok(!z2.dmax, 'revert limpa dmax'); }
// 3) CPU (Red) usa Dinamax
{ const red = [[25, 88], [143, 86], [6, 86]].map(([i, l]) => mk(i, l)); let used = 0;
  for (let k = 0; k < 10; k++) { const s = PE.createBattle({ kind: 'trainer', seed: k, sides: [{ party: [mk(150, 90), mk(149, 90)], name: 'E', ai: 1 }, { party: JSON.parse(JSON.stringify(red)), name: 'Red', ai: 2, dyna: true }] });
    let t = 0; while (!s.over && t++ < 200) { const ev = PE.step(s, [PE.aiAction(s, 0), PE.aiAction(s, 1)]); used += ev.filter(e => e.e === 'dyna').length; for (const i of [0, 1]) if (PE.needSwitch(s, i)) PE.forceSwitch(s, i, PE.aiSwitchIdx(s, i)); } }
  ok(used > 0, 'Red Dinamaxou em ' + used + '/10 batalhas'); }
// 4) migração de save v2 -> v3 remove dmax e mantém tudo
{ global.localStorage = { _: {}, getItem(k) { return this._[k] ?? null; }, setItem(k, v) { this._[k] = String(v); } }; require('../js/sha256.js'); require('../js/save.js');
  const sv = { v: 2, user: 'x', trainer: 'E', party: [{ id: 6, lvl: 50, dmax: { t: 2, g: 1 }, moves: [] }], box: [{ id: 1 }], gifts: { a: 1 } }; const m = PS.migrate(JSON.parse(JSON.stringify(sv)));
  ok(m.v === 3 && !m.party[0].dmax && m.party.length === 1 && m.box.length === 1 && m.gifts.a === 1, 'migração v3 segura'); }
console.log(fail ? 'FALHAS: ' + fail : 'tudo ok'); process.exit(fail ? 1 : 0);
