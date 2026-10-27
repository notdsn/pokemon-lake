// Migração v5 -> v6 (aditiva) + bst do motor
const assert = require('assert'); const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k], key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
global.window = global; require('../js/save.js'); const PS = global.PS;
const old = { v: 5, user: 'edson', trainer: 'Edson', party: [{ id: 6, lvl: 50, uid: 'a', nat: 3 }], box: [], bag: { 'poke-ball': 2 }, gifts: { 'EDSON-LENDAS': 1, 'EDSON-GMAX': 1 }, raids: { day: 'x' }, style: { color: 'c5', hat: 'h6', aura: 'a3', owned: { c5: 1 } }, house: { slots: ['bed'], owned: { bed: 1 } }, stats: {}, settings: { follow: false }, dex: { seen: {}, caught: {}, shiny: {} } };
const s = PS.migrate(JSON.parse(JSON.stringify(old)));
assert.strictEqual(s.v, PS.SAVE_VERSION); assert.ok(s.v >= 6); assert.deepStrictEqual(s.gifts, old.gifts); assert.strictEqual(s.party[0].nat, 3); assert.strictEqual(s.style.hat, 'h6'); assert.strictEqual(s.house.slots[0], 'bed'); assert.strictEqual(s.settings.follow, false); assert.strictEqual(s.raids.day, 'x');
assert.ok(store['pkLake.save.edson.premigrate.v5'], 'cópia pré-migração v5');
require('../js/data-gen.js'); const PE = require('../js/engine.js');
const a = PE.makeMon(6, 50, { seed: 1 }, { iv: Array(6).fill(31), nat: 0 }), b = JSON.parse(JSON.stringify(a)); b.bst = [1.1, 1.2, 1, 1, 1, 1];
assert.strictEqual(PE.calcStats(b)[1], Math.floor(PE.calcStats(a)[1] * 1.2)); assert.strictEqual(PE.calcStats(b)[2], PE.calcStats(a)[2]);
console.log('v6save OK');
