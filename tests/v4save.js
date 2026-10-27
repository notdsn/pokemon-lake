// Migração v3 -> v4 (aditiva) e preservação de gifts/time
const assert = require('assert'); const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k], key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
global.window = global; require('../js/save.js'); const PS = global.PS;
const old = { v: 3, user: 'edson', trainer: 'Edson', party: [{ id: 6, lvl: 50, uid: 'a' }], box: [{ id: 25, uid: 'b' }], bag: { 'poke-ball': 2 }, gifts: { X: 1 }, stats: { battles: 3, wins: 2, caught: 2, shinies: 0, steps: 9, playMs: 1 }, settings: { sound: false, speed: 0.6 }, dex: { seen: {}, caught: { 6: 1 }, shiny: {} } };
const s = PS.migrate(JSON.parse(JSON.stringify(old)));
assert.strictEqual(s.v, 4); assert.deepStrictEqual(s.gifts, { X: 1 }); assert.strictEqual(s.party[0].id, 6); assert.strictEqual(s.box.length, 1);
assert.strictEqual(s.settings.sound, false); assert.strictEqual(s.settings.speed, 0.6); assert.strictEqual(s.settings.music, true); assert.strictEqual(s.settings.mvol, 0.35);
assert.strictEqual(s.stats.fished, 0); assert.strictEqual(s.stats.wins, 2); assert.deepStrictEqual(s.quests, {}); assert.deepStrictEqual(s.dexm, {}); assert.deepStrictEqual(s.ach, {});
assert.ok(store['pkLake.save.edson.premigrate.v3'], 'cópia pré-migração'); console.log('v4save OK');
