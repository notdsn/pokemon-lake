// Migração v4 -> v5 (aditiva) + naturezas no motor
const assert = require('assert'); const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k], key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
global.window = global; require('../js/save.js'); const PS = global.PS;
const old = { v: 4, user: 'edson', trainer: 'Edson', party: [{ id: 6, lvl: 50, uid: 'a' }], box: [{ id: 25, uid: 'b' }], bag: { 'poke-ball': 2 }, gifts: { 'EDSON-LENDAS': 1 }, quests: { day: 'x' }, ach: { a: 1 }, stats: { battles: 3, wins: 2 }, settings: { sound: false, music: false }, dex: { seen: {}, caught: { 6: 1 }, shiny: {} } };
const s = PS.migrate(JSON.parse(JSON.stringify(old)));
assert.strictEqual(s.v, 5); assert.deepStrictEqual(s.gifts, { 'EDSON-LENDAS': 1 }); assert.strictEqual(s.party[0].id, 6); assert.strictEqual(s.box.length, 1);
assert.strictEqual(s.settings.music, false); assert.strictEqual(s.settings.follow, true); assert.deepStrictEqual(s.raids, {}); assert.deepStrictEqual(s.legq, {}); assert.deepStrictEqual(s.ach, { a: 1 });
assert.strictEqual(s.style.hat, 'h0'); assert.strictEqual(s.house.slots.length, 8); assert.strictEqual(s.quests.day, 'x');
assert.ok(store['pkLake.save.edson.premigrate.v4'], 'cópia pré-migração v4');
require('../js/data-gen.js'); const PE = require('../js/engine.js');
assert.strictEqual(PE.NATURES.length, 25);
const a = PE.makeMon(6, 50, { seed: 1 }, { iv: Array(6).fill(31), nat: 0 }), b = PE.makeMon(6, 50, { seed: 1 }, { iv: Array(6).fill(31), nat: 3 }); // Firme +Atq -AtE
const sa = PE.calcStats(a), sb = PE.calcStats(b);
assert.strictEqual(sa[0], sb[0]); assert.strictEqual(sb[1], Math.floor(sa[1] * 1.1)); assert.strictEqual(sb[3], Math.floor(sa[3] * 0.9)); assert.strictEqual(sa[5], sb[5]);
console.log('v5save OK', PE.NATURES[3][0]);
