// Terastal: regras oficiais de STAB, 1 mecânica por batalha, limpeza ao fim
require('../js/data-gen.js'); const PE = require('../js/engine.js');
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
const st = { seed: 7 }, mk = (id, lv = 50) => PE.makeMon(id, lv, st, { iv: Array(6).fill(31) });
const bat = (a, b, o = {}) => PE.createBattle({ kind: 'trainer', seed: 1, sides: [{ party: [a], name: 'Eu', tera: 1, mega: o.mega, dyna: o.dyna }, { party: [b], name: 'B', ai: 1 }] });
const dmg = (s, n) => PE.calcDmg(s, s.sides[0].b, s.sides[1].b, global.PDATA.moves[n], false).dmg;
// Charizard (fogo/voador) tera Fogo: Lança-chamas 1.5 -> 2.0
{ const a = mk(6), b = mk(143), s = bat(a, b); const d0 = dmg(s, 'flamethrower'); ok(PE.canTera(s, 0), 'pode terastalizar'); PE.doTera(s, 0, []); const d1 = dmg(s, 'flamethrower');
  ok(a.terastal === 'fire' && Math.abs(d1 / d0 - 2 / 1.5) < 0.05, `tera do mesmo tipo: STAB 2x (${d0} -> ${d1})`);
  ok(JSON.stringify(PE.monTypes(a)) === '["fire"]', 'defesa vira só o tipo Tera');
  ok(!PE.canMega(s, 0) && !PE.canDyna(s, 0) && !PE.canTera(s, 0), 'só 1 mecânica por batalha'); }
// tera de tipo novo: golpe Tera ganha 1.5, tipos originais mantêm 1.5
{ const a = mk(6); a.teraT = 'water'; const b = mk(143), s = bat(a, b); const f0 = dmg(s, 'flamethrower'), w0 = dmg(s, 'surf'); PE.doTera(s, 0, []);
  const f1 = dmg(s, 'flamethrower'), w1 = dmg(s, 'surf'); ok(f1 === f0, 'tipo original mantém STAB 1.5'); ok(Math.abs(w1 / w0 - 1.5) < 0.05, `tipo Tera novo ganha 1.5 (${w0} -> ${w1})`); }
// golpe fraco do tipo Tera sobe para 60 de poder (exceto prioridade/multi-golpe)
{ const a = mk(658); a.teraT = 'water'; const b = mk(143), s = bat(a, b); const e0 = dmg(s, 'water-gun'); PE.doTera(s, 0, []); const e1 = dmg(s, 'water-gun');
  ok(e1 > e0 * 1.3, `golpe Tera < 60 vira 60 (${e0} -> ${e1})`); }
// dinamax usado bloqueia tera
{ const a = mk(6), s = bat(a, mk(143), { dyna: 1 }); s.sides[0].dynaUsed = true; ok(!PE.canTera(s, 0), 'dinamax usado bloqueia Tera'); }
// lendário não terastaliza (arte intacta)
{ const s = bat(mk(150), mk(143)); ok(!PE.canTera(s, 0), 'lendário fica como está'); }
// passo de batalha com tera
{ const a = mk(6), b = mk(143), s = bat(a, b); const ev = PE.step(s, [{ type: 'move', n: a.moves[0].n, tera: 1 }, PE.aiAction(s, 1)]); ok(ev.some(e => e.e === 'tera') && s.sides[0].teraUsed, 'evento tera no turno'); PE.clearTera([a]); ok(!a.terastal, 'tera some ao fim da batalha'); }
console.log(fail ? 'FALHOU ' + fail : 'TUDO OK'); process.exit(fail ? 1 : 0);
