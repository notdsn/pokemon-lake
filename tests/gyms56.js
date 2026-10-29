// v56: times de líderes/Elite Four sem espécies repetidas, sem lendários, níveis iguais
const fs = require('fs'), vm = require('vm'), { execSync } = require('child_process'); const R = '/workspace/pokemon-lake/';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
function load(src) { const g = { console }; g.window = g; g.globalThis = g; vm.createContext(g); for (const f of ['data-gen', 'engine', 'content', 'regions']) vm.runInContext(src(f), g); return g; }
const now = load(f => fs.readFileSync(R + 'js/' + f + '.js', 'utf8')), old = load(f => execSync(`git -C ${R} show c2e09e3:js/${f}.js`, { maxBuffer: 1 << 26 }).toString());
const teams = g => { const C = g.PC, out = []; const add = (r, x) => out.push({ r, who: x.leader, team: x.team }); C.GYMS.forEach(x => add('kanto', x)); C.ELITE.forEach(x => add('kanto', x)); C.JGYMS.forEach(x => add('johto', x)); C.JELITE.forEach(x => add('johto', x)); for (const r of Object.values(g.PREG)) { r.GYMS.forEach(x => add(r.k, x)); r.ELITE.forEach(x => add(r.k, x)); } return out; };
const T = teams(now), T0 = teams(old), D = now.PDATA, cnt = {};
for (const t of T) { const ids = t.team.map(x => x[0]); ok(new Set(ids).size === ids.length, `${t.r} ${t.who}: sem repetidos (${ids.map(i => D.mons[i].n).join(', ')})`); new Set(ids).forEach(i => cnt[i] = (cnt[i] || 0) + 1);
  ok(ids.every(i => D.mons[i] && !D.mons[i].L && fs.existsSync(R + 'img/front/' + i + '.gif') && fs.existsSync(R + 'img/back/' + i + '.gif')), `${t.who}: sem lendários, sprites existem`); }
const over = Object.entries(cnt).filter(([, n]) => n > 3); ok(!over.length, 'nenhuma espécie em mais de 3 líderes ' + over.map(([i, n]) => D.mons[i].n + 'x' + n));
ok(T.length === T0.length && T.every((t, i) => t.who === T0[i].who && JSON.stringify(t.team.map(x => x[1])) === JSON.stringify(T0[i].team.map(x => x[1]))), 'curva de níveis idêntica à v53 (' + T.length + ' times)');
const PE = now.PokeEngine || now.PE || Object.values(now).find(v => v && v.makeMon); let mk = 0; try { for (const t of T) for (const [id, l] of t.team) { const m = PE.makeMon(id, l, { seed: 12345 }, {}); if (!m.moves || !m.moves.length) throw id; mk++; } } catch (e) { ok(false, 'makeMon falhou ' + e); } ok(mk > 400, `todos os ${mk} Pokémon dos times são criados com golpes`);
console.log(fail ? 'FALHOU' : 'TUDO OK'); process.exit(fail ? 1 : 0);
