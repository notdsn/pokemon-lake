// Motor de batalha determinístico, sem DOM. Mesmo seed + mesmas ações = mesmo resultado (base para PvP).
(function (G) {
  const D = G.PDATA;
  const TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  // tabela de efetividade: atacante -> {defensor: mult}
  const CH = {
    normal:{rock:.5,ghost:0,steel:.5}, fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
    water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5}, electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},
    grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
    ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
    fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
    poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2}, ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
    flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5}, psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
    bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},
    rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5}, ghost:{normal:0,psychic:2,ghost:2,dark:.5},
    dragon:{dragon:2,steel:.5,fairy:0}, dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
    steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2}, fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}
  };
  const eff = (mt, dts) => dts.reduce((m, t) => m * ((CH[mt] || {})[t] ?? 1), 1);

  // RNG mulberry32 serializável (estado é um inteiro)
  function rnd(st) { let t = (st.seed = (st.seed + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const ri = (st, a, b) => a + Math.floor(rnd(st) * (b - a + 1));

  function xpFor(g, n) {
    if (n <= 1) return 0;
    switch (g) { case 'fast': return Math.floor(4 * n ** 3 / 5); case 'slow': return Math.floor(5 * n ** 3 / 4);
      case 'medium-slow': return Math.max(0, Math.floor(1.2 * n ** 3 - 15 * n * n + 100 * n - 140));
      case 'slow-then-very-fast': return Math.floor(n ** 3 * 0.9); case 'fast-then-very-slow': return Math.floor(n ** 3 * 1.1);
      default: return n ** 3; }
  }
  const monTypes = m => (m.mega && D.megas && D.megas[m.mega] ? D.megas[m.mega].t : D.mons[m.id].t);
  const SN = ['hp','atk','def','spa','spd','spe'];
  // 25 naturezas: [nome, stat+ , stat-] (1=Atk 2=Def 3=AtE 4=DfE 5=Vel); iguais = neutra
  const NATURES = [['Firme',1,1],['Solitária',1,2],['Corajosa',1,5],['Inflexível',1,3],['Travessa',1,4],['Ousada',2,1],['Dócil',2,2],['Relaxada',2,5],['Marota',2,3],['Frouxa',2,4],
    ['Tímida',5,1],['Apressada',5,2],['Séria',5,5],['Alegre',5,3],['Ingênua',5,4],['Modesta',3,1],['Branda',3,2],['Quieta',3,5],['Acanhada',3,3],['Precipitada',3,4],
    ['Calma',4,1],['Gentil',4,2],['Atrevida',4,5],['Cuidadosa',4,3],['Peculiar',4,4]];
  const natMul = (m, i) => { const n = m.nat == null ? null : NATURES[m.nat]; if (!n || n[1] === n[2]) return 1; return n[1] === i ? 1.1 : n[2] === i ? 0.9 : 1; };
  function calcStats(m) {
    const b = (m.mega && D.megas && D.megas[m.mega] ? D.megas[m.mega].s : D.mons[m.id].s), L = m.lvl, iv = m.iv, ev = m.ev || [0,0,0,0,0,0];
    const bm = m.bst || null;
    return b.map((bs, i) => i === 0 ? (m.id === 292 ? 1 : Math.floor((Math.floor((2 * bs + iv[i] + Math.floor(ev[i] / 4)) * L / 100) + L + 10) * (bm ? bm[0] : 1)))
      : Math.floor((Math.floor((2 * bs + iv[i] + Math.floor(ev[i] / 4)) * L / 100) + 5) * natMul(m, i) * (bm ? bm[i] : 1)));
  }
  // moveset "inteligente": até 3 golpes de dano fortes (tipos variados, STAB preferido) + 1 de status útil
  const BAD = new Set(['self-destruct', 'explosion', 'memento', 'final-gambit', 'healing-wish', 'lunar-dance', 'struggle', 'focus-punch', 'hyper-beam', 'giga-impact', 'solar-beam', 'sky-attack', 'skull-bash', 'razor-wind', 'dream-eater', 'snore', 'belch', 'last-resort', 'synchronoise', 'natural-gift', 'fling', 'spit-up']);
  function movePower(n, id) { const mv = D.moves[n]; if (!mv || mv.c === 't' || !mv.p) return 0; let p = mv.p * (mv.mh ? (mv.mh + mv.xh) / 2 : 1) * (mv.a ? Math.min(1, mv.a / 100) : 1);
    if (D.mons[id].t.includes(mv.t)) p *= 1.5; if (BAD.has(n)) p *= 0.35; if (mv.d < 0) p *= 0.85; return p; }
  function movesAt(id, lvl) {
    const seen = []; for (const [l, n] of D.mons[id].l) if (l <= lvl && D.moves[n] && !seen.includes(n)) seen.push(n);
    if (!seen.length) return ['tackle'];
    const dmg = seen.filter(n => movePower(n, id) > 0).sort((a, b) => movePower(b, id) - movePower(a, id));
    const pick = []; for (const n of dmg) { if (pick.length >= 3) break; const t = D.moves[n].t; if (pick.some(x => D.moves[x].t === t) && dmg.some(y => !pick.includes(y) && y !== n && !pick.some(x => D.moves[x].t === D.moves[y].t))) continue; pick.push(n); }
    for (const n of dmg) if (pick.length < 3 && !pick.includes(n)) pick.push(n);
    const GOOD = ['swords-dance', 'nasty-plot', 'calm-mind', 'dragon-dance', 'bulk-up', 'quiver-dance', 'shell-smash', 'roost', 'recover', 'soft-boiled', 'slack-off', 'moonlight', 'morning-sun', 'synthesis', 'wish', 'thunder-wave', 'will-o-wisp', 'toxic', 'spore', 'sleep-powder', 'hypnosis', 'agility', 'growth', 'leech-seed', 'protect', 'reflect', 'light-screen', 'rest', 'amnesia', 'iron-defense', 'cosmic-power', 'coil', 'work-up', 'stun-spore', 'confuse-ray', 'curse', 'rain-dance', 'sunny-day'];
    const stat = seen.filter(n => D.moves[n].c === 't' || !D.moves[n].p).sort((a, b) => (GOOD.includes(a) ? GOOD.indexOf(a) : 99) - (GOOD.includes(b) ? GOOD.indexOf(b) : 99));
    if (stat.length && GOOD.includes(stat[0])) pick.push(stat[0]);
    for (const n of dmg) if (pick.length < 4 && !pick.includes(n)) pick.push(n);
    for (const n of [...seen].reverse()) if (pick.length < 4 && !pick.includes(n)) pick.push(n);
    return pick.slice(0, 4);
  }
  let uidc = 0;
  function makeMon(id, lvl, st, o = {}) {
    const iv = o.iv || [0,0,0,0,0,0].map(() => ri(st, 0, 31));
    const shiny = o.shiny ?? (rnd(st) < (o.shinyRate || 1 / 512));
    const m = { uid: o.uid || ('m' + Date.now().toString(36) + (uidc++).toString(36) + Math.floor(rnd(st) * 1e6).toString(36)), id, lvl, xp: xpFor(D.mons[id].g, lvl), iv, ev: [0,0,0,0,0,0], shiny, nat: o.nat ?? ri(st, 0, 24),
      moves: (o.moves || movesAt(id, lvl)).map(n => ({ n, pp: D.moves[n].pp })), status: null, nick: null, ot: o.ot || null, caughtAt: o.caughtAt || null };
    m.hp = calcStats(m)[0]; return m;
  }
  const maxhp = m => Math.floor(calcStats(m)[0] * (m.dmax ? 2 : 1) * (m.raidHp || 1));

  // ---------- batalha ----------
  function bm(m) { return { m, st: { atk:0,def:0,spa:0,spd:0,spe:0,acc:0,eva:0 }, conf: 0, flinch: false, sleep: 0, toxic: 0 }; }
  function createBattle(o) {
    // o: {kind:'wild'|'trainer'|'pvp', seed, sides:[{party,name},{party,name,ai}], weather, canRun}
    const s = { kind: o.kind, seed: o.seed | 0, turn: 0, weather: o.weather || null, over: false, winner: null, caught: null, ran: false,
      sides: o.sides.map(sd => ({ name: sd.name, party: sd.party, active: Math.max(0, sd.party.findIndex(x => x.hp > 0)), b: null, ai: sd.ai || 0, trainer: sd.trainer || null, megaOk: !!sd.mega, megaUsed: false, dynaOk: !!sd.dyna, dynaUsed: false, participants: [] })) };
    s.sides.forEach(sd => { sd.b = bm(sd.party[sd.active]); sd.participants = [sd.active]; });
    return s;
  }
  const stageMul = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
  const accMul = n => n >= 0 ? (3 + n) / 3 : 3 / (3 - n);
  function eStat(b, k) { const i = SN.indexOf(k); let v = calcStats(b.m)[i] * stageMul(b.st[k]);
    if (k === 'spe' && b.m.status === 'par') v *= 0.5; return v; }

  function speedOrder(s, acts) {
    const pr = acts.map((a, i) => {
      if (a.type !== 'move') return 6; const mv = D.moves[a.n]; return mv ? mv.pr : 0; });
    if (pr[0] !== pr[1]) return pr[0] > pr[1] ? [0, 1] : [1, 0];
    const sp = [0, 1].map(i => eStat(s.sides[i].b, 'spe'));
    if (sp[0] !== sp[1]) return sp[0] > sp[1] ? [0, 1] : [1, 0];
    return rnd(s) < 0.5 ? [0, 1] : [1, 0];
  }
  const statusName = { par: 'paralisado', brn: 'queimado', psn: 'envenenado', tox: 'gravemente envenenado', slp: 'dormindo', frz: 'congelado' };
  const AIL = { paralysis: 'par', burn: 'brn', poison: 'psn', sleep: 'slp', freeze: 'frz' };
  const STATK = { attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe', accuracy: 'acc', evasion: 'eva' };
  const STATPT = { atk: 'Ataque', def: 'Defesa', spa: 'Ataque Esp.', spd: 'Defesa Esp.', spe: 'Velocidade', acc: 'Precisão', eva: 'Evasão' };
  function pname(s, i) { const m = s.sides[i].b.m; return (m.nick || D.mons[m.id].n) + (i === 1 ? (s.kind === 'wild' ? ' selvagem' : ' inimigo') : ''); }
  function applyStatus(s, ti, st, ev, src) {
    const t = s.sides[ti].b; if (t.m.status || t.m.hp <= 0) return false;
    const tt = monTypes(t.m);
    if ((st === 'brn' && tt.includes('fire')) || (st === 'frz' && tt.includes('ice')) || ((st === 'psn' || st === 'tox') && (tt.includes('poison') || tt.includes('steel'))) || (st === 'par' && tt.includes('electric'))) return false;
    t.m.status = st; if (st === 'slp') t.sleep = ri(s, 1, 3); if (st === 'tox') t.toxic = 1;
    ev.push({ e: 'status', side: ti, status: st, text: `${pname(s, ti)} ficou ${statusName[st]}!` }); return true;
  }
  function changeStat(s, ti, k, d, ev) {
    const b = s.sides[ti].b; const old = b.st[k]; b.st[k] = Math.max(-6, Math.min(6, old + d));
    if (b.st[k] === old) { ev.push({ e: 'msg', text: `${STATPT[k]} de ${pname(s, ti)} não muda mais!` }); return; }
    const w = Math.abs(d) >= 2 ? (d > 0 ? 'aumentou muito' : 'caiu muito') : (d > 0 ? 'aumentou' : 'caiu');
    ev.push({ e: 'stat', side: ti, stat: k, d, text: `${STATPT[k]} de ${pname(s, ti)} ${w}!` });
  }
  function dealDamage(s, ti, dmg, ev, extra) {
    const m = s.sides[ti].b.m; if (m.shield > 0 && dmg > 0) { dmg *= 0.25; m.shield--; ev.push({ e: 'msg', side: ti, text: m.shield ? `🛡️ A barreira absorveu o golpe! (${m.shield} restante${m.shield > 1 ? 's' : ''})` : '💥 A barreira do chefe se partiu!' }); }
    dmg = Math.max(0, Math.min(m.hp, Math.floor(dmg))); m.hp -= dmg;
    ev.push(Object.assign({ e: 'hp', side: ti, hp: m.hp, max: maxhp(m), dmg }, extra || {}));
    if (m.hp <= 0) { m.status = null; if (m.dmax) delete m.dmax; ev.push({ e: 'faint', side: ti, text: `${pname(s, ti)} desmaiou!` }); }
    return dmg;
  }
  function useMove(s, ai, mvName, ev) {
    const A = s.sides[ai], ti = 1 - ai, T = s.sides[ti], a = A.b, t = T.b;
    if (a.m.hp <= 0) return;
    // estados que impedem
    if (a.m.status === 'slp') { if (--a.sleep <= 0) { a.m.status = null; ev.push({ e: 'cure', side: ai, text: `${pname(s, ai)} acordou!` }); } else { ev.push({ e: 'msg', side: ai, anim: 'sleep', text: `${pname(s, ai)} está dormindo profundamente...` }); return; } }
    if (a.m.status === 'frz') { if (rnd(s) < 0.2) { a.m.status = null; ev.push({ e: 'cure', side: ai, text: `${pname(s, ai)} descongelou!` }); } else { ev.push({ e: 'msg', side: ai, text: `${pname(s, ai)} está congelado!` }); return; } }
    if (a.flinch) { a.flinch = false; ev.push({ e: 'msg', side: ai, text: `${pname(s, ai)} recuou de medo!` }); return; }
    if (a.m.status === 'par' && rnd(s) < 0.25) { ev.push({ e: 'msg', side: ai, anim: 'par', text: `${pname(s, ai)} está paralisado! Não consegue se mover!` }); return; }
    if (a.conf > 0) { a.conf--; if (a.conf === 0) ev.push({ e: 'msg', text: `${pname(s, ai)} não está mais confuso!` });
      else { ev.push({ e: 'msg', text: `${pname(s, ai)} está confuso!` }); if (rnd(s) < 0.33) { ev.push({ e: 'msg', text: 'Ele se machucou na confusão!' }); dealDamage(s, ai, calcDmg(s, a, a, { p: 40, c: 'p', t: '???' }, false).dmg, ev); return; } } }
    let mv = D.moves[mvName], slot = a.m.moves.find(x => x.n === mvName);
    if (mvName !== 'struggle') { if (!slot || slot.pp <= 0) { mvName = 'struggle'; mv = D.moves.struggle; } else slot.pp--; }
    if (a.m.dmax) return useMaxMove(s, ai, mv, ev);
    { const ab = abilityOf(a.m); if (mv.t === 'normal' && mv.p > 0 && (ab === 'pixilate' || ab === 'aerilate' || ab === 'refrigerate')) mv = { ...mv, t: ab === 'pixilate' ? 'fairy' : ab === 'aerilate' ? 'flying' : 'ice', p: Math.floor(mv.p * 1.2) }; }
    ev.push({ e: 'use', side: ai, move: mvName, type: mv.t, cat: mv.c, text: `${pname(s, ai)} usou ${mv.n}!` });
    const selfT = mv.tg === 'user' || mv.tg === 'users-field' || mv.tg === 'user-and-allies' || mv.tg === 'entire-field';
    if (!selfT && t.m.hp <= 0) { ev.push({ e: 'msg', text: 'Mas não havia alvo!' }); return; }
    if (!selfT && t.prot) { ev.push({ e: 'msg', side: ti, text: `${pname(s, ti)} se protegeu com a Barreira Max!` }); return; }
    if (mv.a && !selfT && abilityOf(a.m) !== 'no-guard' && abilityOf(t.m) !== 'no-guard') { const acc = mv.a / 100 * accMul(a.st.acc - t.st.eva); if (rnd(s) >= acc) { ev.push({ e: 'miss', side: ai, text: `O ataque de ${pname(s, ai)} errou!` }); return; } }
    if (mv.c !== 't' && mv.p > 0) {
      const hits = mv.mh ? (abilityOf(a.m) === 'skill-link' ? mv.xh : ri(s, mv.mh, mv.xh)) : 1; let total = 0, n = 0;
      for (let h = 0; h < hits && t.m.hp > 0 && a.m.hp > 0; h++) {
        const r = calcDmg(s, a, t, mv, true); if (r.eff === 0) { ev.push({ e: 'msg', text: `Não afeta ${pname(s, ti)}...` }); return; }
        total += dealDamage(s, ti, r.dmg, ev, { crit: r.crit, eff: r.eff, mtype: mv.t }); n++;
        if (r.crit) ev.push({ e: 'msg', text: 'Um golpe crítico!' });
        if (h === hits - 1 || t.m.hp <= 0) { if (r.eff > 1) ev.push({ e: 'msg', text: 'É super efetivo!' }); else if (r.eff < 1) ev.push({ e: 'msg', text: 'Não é muito efetivo...' }); }
      }
      if (hits > 1) ev.push({ e: 'msg', text: `Acertou ${n} vez(es)!` });
      if (mv.d) { if (mv.d > 0) { const hh = Math.max(1, Math.floor(total * mv.d / 100)); healMon(s, ai, hh, ev, `${pname(s, ti)} teve a energia drenada!`); } else { ev.push({ e: 'msg', text: `${pname(s, ai)} sofreu dano de recuo!` }); dealDamage(s, ai, Math.max(1, total * -mv.d / 100), ev); } }
      if (mvName === 'struggle') { dealDamage(s, ai, maxhp(a.m) / 4, ev); }
      if (t.m.hp > 0) {
        if (mv.f && rnd(s) * 100 < mv.f && !t.m.dmax) t.flinch = true;
        if (mv.ai && mv.aic && rnd(s) * 100 < mv.aic) secondary(s, ti, mv, ev);
        if (mv.st && mv.st.length && mv.stc && rnd(s) * 100 < mv.stc) for (const [k, d] of mv.st) changeStat(s, d > 0 ? ai : ti, STATK[k], d, ev);
      }
      if (t.m.status === 'frz' && mv.t === 'fire' && t.m.hp > 0) { t.m.status = null; ev.push({ e: 'cure', side: ti, text: `${pname(s, ti)} descongelou!` }); }
    } else if (mv.c !== 't' && mv.p === 0) {
      // golpes de dano fixo/variável (Seismic Toss, Night Shade, Dragon Rage, Sonic Boom, Super Fang)
      const fixed = { 'seismic-toss': a.m.lvl, 'night-shade': a.m.lvl, 'dragon-rage': 40, 'sonic-boom': 20, 'super-fang': Math.max(1, Math.floor(t.m.hp / 2)), psywave: Math.floor(a.m.lvl * (0.5 + rnd(s))) }[mvName];
      if (fixed && eff(mv.t, monTypes(t.m)) !== 0) dealDamage(s, ti, fixed, ev, { mtype: mv.t, eff: 1 }); else ev.push({ e: 'msg', text: 'Mas falhou!' });
    } else {
      let did = false;
      if (mv.h > 0) { const mh = maxhp(a.m); if (a.m.hp >= mh) ev.push({ e: 'msg', text: 'O HP já está cheio!' }); else healMon(s, ai, mh * mv.h / 100, ev); did = true; }
      if (mvName === 'rest') { a.m.status = 'slp'; a.sleep = 2; healMon(s, ai, maxhp(a.m), ev, `${pname(s, ai)} dormiu e recuperou a energia!`); did = true; }
      if (mv.st && mv.st.length) { for (const [k, d] of mv.st) changeStat(s, (selfT || d > 0 && mv.tg === 'user') ? ai : ti, STATK[k], d, ev); did = true; }
      if (mv.ai) { const st = secondary(s, ti, mv, ev); did = true; if (!st) ev.push({ e: 'msg', text: 'Mas não funcionou...' }); }
      if (!did) ev.push({ e: 'msg', text: 'Mas nada aconteceu!' });
    }
  }
  function secondary(s, ti, mv, ev) {
    if (mv.ai === 'confusion') { const t = s.sides[ti].b; if (t.conf) return false; t.conf = ri(s, 2, 5); ev.push({ e: 'status', side: ti, status: 'conf', text: `${pname(s, ti)} ficou confuso!` }); return true; }
    const st = AIL[mv.ai]; if (!st) return false; return applyStatus(s, ti, mv.en === 'Toxic' ? 'tox' : st, ev);
  }
  function healMon(s, i, amt, ev, text) { const m = s.sides[i].b.m, mh = maxhp(m); const h = Math.min(mh - m.hp, Math.floor(amt)); m.hp += h;
    ev.push({ e: 'heal', side: i, hp: m.hp, max: mh, amt: h, text: text || `${pname(s, i)} recuperou HP!` }); }
  function abilityOf(m) { return m.mega && D.megas && D.megas[m.mega] ? D.megas[m.mega].ab : D.mons[m.id].ab; }
  function calcDmg(s, a, t, mv, useRng) {
    const phys = mv.c === 'p'; const crit = useRng && rnd(s) < [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, (mv.cr || 0) + (a.critB || 0))];
    let A = eStat(a, phys ? 'atk' : 'spa'), Df = eStat(t, phys ? 'def' : 'spd');
    if (crit) { A = Math.max(A, calcStats(a.m)[phys ? 1 : 3]); Df = Math.min(Df, calcStats(t.m)[phys ? 2 : 4]); }
    let d = Math.floor(Math.floor(Math.floor(2 * a.m.lvl / 5 + 2) * mv.p * A / Df) / 50) + 2;
    if (s.weather === 'rain') d *= mv.t === 'water' ? 1.5 : mv.t === 'fire' ? 0.5 : 1;
    if (s.weather === 'sun') d *= mv.t === 'fire' ? 1.5 : mv.t === 'water' ? 0.5 : 1;
    if (crit) d *= 1.5; if (useRng) d *= (85 + Math.floor(rnd(s) * 16)) / 100;
    const aa = abilityOf(a.m), ta = abilityOf(t.m);
    const at = monTypes(a.m); if (at.includes(mv.t)) d *= aa === 'adaptability' ? 2 : 1.5;
    let e = mv.t === '???' ? 1 : eff(mv.t, monTypes(t.m)); if (ta === 'levitate' && mv.t === 'ground') e = 0; d *= e;
    if (aa === 'tough-claws' && phys) d *= 1.3; if (aa === 'technician' && mv.p <= 60) d *= 1.5; if (aa === 'parental-bond') d *= 1.25;
    if ((aa === 'huge-power' || aa === 'pure-power') && phys) d *= 2; if (aa === 'mega-launcher' && /Pulse|Aura/.test(mv.en || '')) d *= 1.5;
    if (aa === 'strong-jaw' && /Fang|Bite|Crunch/.test(mv.en || '')) d *= 1.5;
    if (ta === 'thick-fat' && (mv.t === 'fire' || mv.t === 'ice')) d *= 0.5; if (ta === 'filter' || ta === 'solid-rock') { if (e > 1) d *= 0.75; }
    if (phys && a.m.status === 'brn') d *= 0.5;
    return { dmg: e === 0 ? 0 : Math.max(1, Math.floor(d)), crit, eff: e };
  }
  function endTurn(s, ev) {
    if (s.weather) ev.push({ e: 'weather', w: s.weather });
    for (let i = 0; i < 2; i++) { const sd = s.sides[i], b = sd.b; b.prot = false; const r = sd.gres;
      if (r && r.t > 0) { r.t--; if (b.m.hp > 0 && !monTypes(b.m).includes(r.ty)) { ev.push({ e: 'msg', anim: r.ty === 'fire' ? 'brn' : undefined, side: i, text: `${pname(s, i)} sofreu com ${r.n}!` }); dealDamage(s, i, Math.max(1, calcStats(b.m)[0] / 6), ev); } if (!r.t) sd.gres = null; } }
    for (let i = 0; i < 2; i++) { const b = s.sides[i].b, m = b.m; if (m.hp <= 0) continue;
      if (m.status === 'brn') { ev.push({ e: 'msg', anim: 'brn', side: i, text: `${pname(s, i)} sofreu com a queimadura!` }); dealDamage(s, i, Math.max(1, maxhp(m) / 16), ev); }
      else if (m.status === 'psn') { ev.push({ e: 'msg', anim: 'psn', side: i, text: `${pname(s, i)} sofreu com o veneno!` }); dealDamage(s, i, Math.max(1, maxhp(m) / 8), ev); }
      else if (m.status === 'tox') { ev.push({ e: 'msg', anim: 'psn', side: i, text: `${pname(s, i)} sofreu com o veneno!` }); dealDamage(s, i, Math.max(1, maxhp(m) * b.toxic++ / 16), ev); }
      if (abilityOf(m) === 'speed-boost' && m.hp > 0 && b.st.spe < 6) changeStat(s, i, 'spe', 1, ev);
      b.flinch = false; }
    for (let i = 0; i < 2; i++) { const m = s.sides[i].b.m; if (m.dmax && m.hp > 0 && --m.dmax.t <= 0) undyna(s, i, ev, true); }
  }
  // ---------- captura (fórmula Gen III/IV) ----------
  const BALLS = { 'poke-ball': 1, 'great-ball': 1.5, 'ultra-ball': 2, 'master-ball': 255 };
  function tryCatch(s, ball, ev) {
    const t = s.sides[1].b.m, M = maxhp(t), rate = D.mons[t.id].c, bm_ = BALLS[ball] || 1;
    ev.push({ e: 'throw', ball, text: `Você jogou uma ${ballName(ball)}!` });
    if (ball === 'master-ball') { ev.push({ e: 'shake', n: 3 }); ev.push({ e: 'caught', text: `Pegou! ${D.mons[t.id].n} foi capturado!` }); s.caught = t; s.over = true; s.winner = 0; return; }
    const sb = (t.status === 'slp' || t.status === 'frz') ? 2 : t.status ? 1.5 : 1;
    const a = ((3 * M - 2 * t.hp) * rate * bm_) / (3 * M) * sb;
    let shakes = 0;
    if (a >= 255) shakes = 4; else { const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a)); while (shakes < 4 && rnd(s) * 65536 < b) shakes++; }
    ev.push({ e: 'shake', n: Math.min(3, shakes) });
    if (shakes >= 4) { ev.push({ e: 'caught', text: `Pegou! ${D.mons[t.id].n} foi capturado!` }); s.caught = t; s.over = true; s.winner = 0; }
    else ev.push({ e: 'escape', text: ['Ah não! Ele escapou!', 'Ahh! Parecia que tinha pegado!', 'Argh! Quase!', 'Droga! Foi por pouco!'][shakes] });
  }
  const ballName = b => ({ 'poke-ball': 'Poké Bola', 'great-ball': 'Grande Bola', 'ultra-ball': 'Ultra Bola', 'master-ball': 'Master Bola' })[b] || b;
  const HEAL = { potion: 20, 'super-potion': 60, 'hyper-potion': 120, 'full-restore': 9999 };
  function useItem(s, side, item, target, ev) {
    const sd = s.sides[side], m = sd.party[target]; const nm = m.nick || D.mons[m.id].n;
    if (item === 'revive') { if (m.hp > 0) return ev.push({ e: 'msg', text: 'Não teria efeito.' }); m.hp = Math.floor(maxhp(m) / 2); ev.push({ e: 'msg', text: `${nm} foi reanimado!` }); return; }
    if (HEAL[item]) { const h = Math.min(maxhp(m) - m.hp, HEAL[item]); m.hp += h; if (item === 'full-restore') m.status = null;
      if (target === sd.active) { sd.b.m = m; ev.push({ e: 'heal', side, hp: m.hp, max: maxhp(m), amt: h, text: `${nm} recuperou ${h} de HP!` }); } else ev.push({ e: 'msg', text: `${nm} recuperou ${h} de HP!` }); return; }
    if (item === 'antidote' || item === 'full-heal') { m.status = null; if (target === sd.active) sd.b.conf = 0; ev.push({ e: 'cure', side, text: `${nm} foi curado!` }); }
  }
  function doSwitch(s, side, idx, ev) {
    const sd = s.sides[side]; if (s.sides[side].b.m.status === 'tox') s.sides[side].b.m.status = 'psn'; if (sd.b.m.dmax) undyna(s, side, ev, false);
    if (sd.b.m.hp > 0) ev.push({ e: 'recall', side, text: side === 0 ? `Volte, ${sd.b.m.nick || D.mons[sd.b.m.id].n}!` : `${sd.name} recolheu ${D.mons[sd.b.m.id].n}.` });
    sd.active = idx; sd.b = bm(sd.party[idx]); if (!sd.participants.includes(idx)) sd.participants.push(idx);
    const m = sd.b.m; ev.push({ e: 'send', side, id: m.id, shiny: m.shiny, lvl: m.lvl, hp: m.hp, max: maxhp(m), name: m.nick || D.mons[m.id].n, status: m.status,
      text: side === 0 ? `Vai, ${m.nick || D.mons[m.id].n}!` : `${sd.name} enviou ${D.mons[m.id].n}!` });
  }
  // ação: {type:'move',n} | {type:'switch',i} | {type:'item',item,target} | {type:'ball',ball} | {type:'run'}
  function step(s, acts) {
    const ev = []; if (s.over) return ev; s.turn++;
    // Mega Evolução acontece antes de tudo (mais rápido primeiro)
    for (const i of speedOrder(s, acts)) if (acts[i] && acts[i].dyna && acts[i].type === 'move' && canDyna(s, i)) doDyna(s, i, ev);
    for (const i of speedOrder(s, acts)) if (acts[i] && acts[i].mega && acts[i].type === 'move' && canMega(s, i)) doMega(s, i, ev);
    // ações não-golpe primeiro
    const order = speedOrder(s, acts);
    for (const i of order) {
      const a = acts[i]; if (!a || s.over) continue;
      if (a.type === 'run') {
        if (s.kind !== 'wild') { ev.push({ e: 'msg', text: 'Não dá para fugir de uma batalha de treinador!' }); continue; }
        if (s.trapped) { ev.push({ e: 'msg', text: 'O Terror G-Max não deixa você fugir!' }); continue; }
        const sp = eStat(s.sides[0].b, 'spe'), es = eStat(s.sides[1].b, 'spe'); s.runTries = (s.runTries || 0) + 1;
        const f = (sp * 128 / Math.max(1, es) + 30 * s.runTries) % 256;
        if (sp >= es || rnd(s) * 256 < f) { ev.push({ e: 'run', text: 'Você fugiu com segurança!' }); s.over = true; s.ran = true; return ev; }
        ev.push({ e: 'msg', text: 'Não conseguiu fugir!' });
      } else if (a.type === 'switch') doSwitch(s, i, a.i, ev);
      else if (a.type === 'item') useItem(s, i, a.item, a.target, ev);
      else if (a.type === 'ball') { tryCatch(s, a.ball, ev); if (s.over) return ev; }
    }
    for (const i of order) { const a = acts[i]; if (!a || a.type !== 'move' || s.over) continue;
      useMove(s, i, a.n, ev); if (checkEnd(s, ev)) return ev; }
    endTurn(s, ev); checkEnd(s, ev); return ev;
  }
  // ---------- Mega Evolução ----------
  function megaFormFor(m, ignoreItem) {
    if (!m || m.mega || !D.megas) return null; const fs = D.mons[m.id].mg || []; if (!fs.length) return null;
    for (const f of fs) { const g = D.megas[f]; if (g.st ? (ignoreItem || m.item === g.st) : m.moves.some(x => x.n === 'dragon-ascent')) return f; }
    return null;
  }
  function canMega(s, i) { const sd = s.sides[i]; return !!(sd.megaOk && !sd.megaUsed && !sd.dynaUsed && sd.b.m.hp > 0 && megaFormFor(sd.b.m)); }
  // ---------- Dynamax / Gigantamax (uma vez por batalha, não combina com Mega, 3 turnos) ----------
  const GMAX = {
    6: { k: 'charizard', n: 'Charizard Gigantamax', ty: 'fire', mv: 'Fogaréu G-Max', fx: 'res', rn: 'o Fogaréu G-Max' },
    3: { k: 'venusaur', n: 'Venusaur Gigantamax', ty: 'grass', mv: 'Chicote G-Max', fx: 'res', rn: 'o Chicote G-Max' },
    9: { k: 'blastoise', n: 'Blastoise Gigantamax', ty: 'water', mv: 'Canhonaço G-Max', fx: 'res', rn: 'o Canhonaço G-Max' },
    12: { k: 'butterfree', n: 'Butterfree Gigantamax', ty: 'bug', mv: 'Atordoar G-Max', fx: 'befuddle' },
    25: { k: 'pikachu', n: 'Pikachu Gigantamax', ty: 'electric', mv: 'Choque Volt G-Max', fx: 'par' },
    52: { k: 'meowth', n: 'Meowth Gigantamax', ty: 'normal', mv: 'Chuva de Ouro G-Max', fx: 'gold' },
    68: { k: 'machamp', n: 'Machamp Gigantamax', ty: 'fighting', mv: 'Golpe Chi G-Max', fx: 'chi' },
    94: { k: 'gengar', n: 'Gengar Gigantamax', ty: 'ghost', mv: 'Terror G-Max', fx: 'terror' },
    99: { k: 'kingler', n: 'Kingler Gigantamax', ty: 'water', mv: 'Espuma Explosiva G-Max', fx: 'foam' },
    131: { k: 'lapras', n: 'Lapras Gigantamax', ty: 'ice', mv: 'Ressonância G-Max', fx: 'reso' },
    133: { k: 'eevee', n: 'Eevee Gigantamax', ty: 'normal', mv: 'Abraço G-Max', fx: 'cuddle' },
    143: { k: 'snorlax', n: 'Snorlax Gigantamax', ty: 'normal', mv: 'Reabastecer G-Max', fx: 'heal' } };
  const MAXN = { normal: ['Ataque Max', 'tspe-1'], fire: ['Chama Max', 'sun'], water: ['Gêiser Max', 'rain'], grass: ['Mata Max', 'heal'], electric: ['Raio Max', 'uspe+1'],
    ice: ['Geada Max', 'tspe-1'], fighting: ['Punho Max', 'uatk+1'], poison: ['Lodo Max', 'uspa+1'], ground: ['Tremor Max', 'uspd+1'], flying: ['Corrente Max', 'uspe+1'],
    psychic: ['Mente Max', 'tspd-1'], bug: ['Inseto Max', 'tspa-1'], rock: ['Rocha Max', 'udef+1'], ghost: ['Fantasma Max', 'tdef-1'], dragon: ['Dragão Max', 'tatk-1'],
    dark: ['Trevas Max', 'tspd-1'], steel: ['Aço Max', 'udef+1'], fairy: ['Fada Max', 'uspd+1'] };
  function maxPow(mv) { const p = mv.p || 80, weak = mv.t === 'fighting' || mv.t === 'poison';
    const t = p < 45 ? 0 : p < 55 ? 1 : p < 65 ? 2 : p < 75 ? 3 : p < 110 ? 4 : p < 150 ? 5 : 6; return (weak ? [70, 75, 80, 85, 90, 95, 100] : [90, 100, 110, 120, 130, 140, 150])[t]; }
  const gmaxOf = m => GMAX[m.id] || null;
  function maxMoveOf(m, mv) { if (!mv || mv.c === 't') return { n: 'Barreira Max', c: 't', t: mv ? mv.t : 'normal', guard: 1 };
    const g = m.dmax && m.dmax.g ? GMAX[m.id] : null, ty = mv.t === '???' ? 'normal' : mv.t;
    if (g && g.ty === ty) return { n: g.mv, c: mv.c, t: ty, p: g.fx === 'res' ? 150 : maxPow(mv), gfx: g.fx, g };
    const x = MAXN[ty] || MAXN.normal; return { n: x[0], c: mv.c, t: ty, p: maxPow(mv), mfx: x[1] }; }
  function canDyna(s, i) { const sd = s.sides[i], m = sd.b.m; return !!(sd.dynaOk && !sd.dynaUsed && !sd.megaUsed && !m.mega && !m.dmax && m.hp > 0); }
  function doDyna(s, i, ev) { const sd = s.sides[i], m = sd.b.m; sd.dynaUsed = true; const g = gmaxOf(m), old = maxhp(m);
    m.dmax = { t: 3, g: g ? 1 : 0 }; m.hp = Math.min(maxhp(m), m.hp + (maxhp(m) - old));
    ev.push({ e: 'dyna', side: i, id: m.id, gmax: !!g, hp: m.hp, max: maxhp(m), name: g ? g.n : (m.nick || D.mons[m.id].n),
      text: g ? `${pname(s, i)} Gigantamaxou! Virou ${g.n}!` : `${pname(s, i)} Dinamaxou! Ficou gigante!` }); }
  function undyna(s, i, ev, announce) { const m = s.sides[i].b.m; if (!m.dmax) return; const mx = maxhp(m); delete m.dmax; const nm = maxhp(m);
    m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(nm, Math.round(m.hp * nm / mx)));
    if (announce) ev.push({ e: 'undyna', side: i, hp: m.hp, max: nm, text: `${pname(s, i)} voltou ao tamanho normal!` }); else ev.push({ e: 'undyna', side: i, hp: m.hp, max: nm, quiet: 1 }); }
  function useMaxMove(s, ai, base, ev) { const A = s.sides[ai], ti = 1 - ai, a = A.b, t = s.sides[ti].b, mv = maxMoveOf(a.m, base);
    ev.push({ e: 'use', side: ai, move: 'max', type: mv.t, cat: mv.c, max: 1, text: `${pname(s, ai)} usou ${mv.n}!` });
    if (mv.guard) { a.prot = true; ev.push({ e: 'msg', side: ai, text: `${pname(s, ai)} ergueu uma Barreira Max!` }); return; }
    if (t.m.hp <= 0) { ev.push({ e: 'msg', text: 'Mas não havia alvo!' }); return; }
    if (t.prot) { ev.push({ e: 'msg', side: ti, text: `${pname(s, ti)} se protegeu com a Barreira Max!` }); return; }
    const r = calcDmg(s, a, t, mv, true); if (r.eff === 0) { ev.push({ e: 'msg', text: `Não afeta ${pname(s, ti)}...` }); return; }
    dealDamage(s, ti, r.dmg, ev, { crit: r.crit, eff: r.eff, mtype: mv.t }); if (r.crit) ev.push({ e: 'msg', text: 'Um golpe crítico!' });
    if (r.eff > 1) ev.push({ e: 'msg', text: 'É super efetivo!' }); else if (r.eff < 1) ev.push({ e: 'msg', text: 'Não é muito efetivo...' });
    const fx = mv.mfx || mv.gfx, alive = t.m.hp > 0;
    if (fx === 'sun' && s.weather !== 'sun') { s.weather = 'sun'; ev.push({ e: 'weather', w: 'sun', text: 'A luz do sol ficou intensa!' }); }
    else if (fx === 'rain' && s.weather !== 'rain') { s.weather = 'rain'; ev.push({ e: 'weather', w: 'rain', text: 'Começou a chover!' }); }
    else if (fx === 'heal') healMon(s, ai, maxhp(a.m) / 6, ev);
    else if (fx && /^[ut](atk|def|spa|spd|spe)[+-]\d$/.test(fx)) { const who = fx[0] === 'u' ? ai : ti; if (who === ai || alive) changeStat(s, who, fx.slice(1, 4), +fx.slice(4), ev); }
    else if (fx === 'res') { s.sides[ti].gres = { t: 4, ty: mv.t, n: mv.g.rn }; ev.push({ e: 'msg', text: `${pname(s, ti)} ficou preso n${mv.g.rn}!` }); }
    else if (fx === 'befuddle' && alive) applyStatus(s, ti, ['slp', 'par', 'psn'][Math.floor(rnd(s) * 3)], ev);
    else if (fx === 'par' && alive) applyStatus(s, ti, 'par', ev);
    else if (fx === 'gold') { if (alive && !t.conf) { t.conf = ri(s, 2, 4); ev.push({ e: 'status', side: ti, status: 'conf', text: `${pname(s, ti)} ficou confuso!` }); } s.goldRush = (s.goldRush || 0) + a.m.lvl * 100; ev.push({ e: 'msg', text: 'Moedas se espalharam por todo lado!' }); }
    else if (fx === 'chi') { a.critB = Math.min(3, (a.critB || 0) + 1); ev.push({ e: 'msg', text: `${pname(s, ai)} está focado em golpes críticos!` }); }
    else if (fx === 'terror' && alive) { s.trapped = true; changeStat(s, ti, 'spe', -1, ev); ev.push({ e: 'msg', text: `${pname(s, ti)} não consegue fugir!` }); }
    else if (fx === 'foam' && alive) changeStat(s, ti, 'spe', -2, ev);
    else if (fx === 'reso') { changeStat(s, ai, 'def', 1, ev); changeStat(s, ai, 'spd', 1, ev); }
    else if (fx === 'cuddle' && alive) { ev.push({ e: 'msg', text: `${pname(s, ti)} ficou encantado!` }); changeStat(s, ti, 'atk', -1, ev); } }
  function doMega(s, i, ev) {
    const sd = s.sides[i], m = sd.b.m, f = megaFormFor(m); if (!f) return; const oldMax = maxhp(m);
    sd.megaUsed = true; m.mega = f; m.hp = Math.max(1, Math.min(maxhp(m), m.hp + maxhp(m) - oldMax)); const g = D.megas[f];
    ev.push({ e: 'mega', side: i, id: m.id, form: f, shiny: m.shiny, name: g.n, hp: m.hp, max: maxhp(m), text: `${pname(s, i)} reagiu à Mega Pulseira e Mega Evoluiu em ${g.n}!` });
    const an = D.abils && D.abils[g.ab] ? D.abils[g.ab].n : g.ab; ev.push({ e: 'msg', text: `Habilidade: ${an}!` });
    if (g.ab === 'drought') { s.weather = 'sun'; ev.push({ e: 'weather', w: 'sun', text: 'A luz do sol ficou intensa!' }); }
    if (g.ab === 'drizzle') { s.weather = 'rain'; ev.push({ e: 'weather', w: 'rain', text: 'Começou a chover!' }); }
  }
  function revertMega(party) { (party || []).forEach(m => { if (m && m.dmax) { const mx = maxhp(m); delete m.dmax; m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(maxhp(m), Math.round(m.hp * maxhp(m) / mx))); } if (m && m.mega) { const oldMax = maxhp(m); delete m.mega; m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(maxhp(m), m.hp)); } }); }
  function checkEnd(s, ev) {
    for (let i = 0; i < 2; i++) if (s.sides[i].party.every(m => m.hp <= 0)) { s.over = true; s.winner = 1 - i; ev.push({ e: 'end', winner: 1 - i }); return true; }
    return false;
  }
  // troca forçada depois de desmaio
  function needSwitch(s, side) { return !s.over && s.sides[side].b.m.hp <= 0; }
  function forceSwitch(s, side, idx) { const ev = []; doSwitch(s, side, idx, ev); return ev; }
  // ---------- IA ----------
  function aiAction(s, side) {
    const sd = s.sides[side], b = sd.b, t = s.sides[1 - side].b; const usable = b.m.moves.filter(x => x.pp > 0);
    if (!usable.length) return { type: 'move', n: 'struggle' };
    const mg = canMega(s, side), dy = !mg && canDyna(s, side) && (s.sides[side].party.filter(x => x.hp > 0).length <= 2 || gmaxOf(b.m) || sd.b.m === sd.party[sd.party.length - 1]);
    if (!sd.ai) return { type: 'move', n: usable[Math.floor(rnd(s) * usable.length)].n, mega: mg, dyna: dy };
    // ponderada pelo dano esperado
    let best = null, bs = -1;
    for (const x of usable) { const mv = D.moves[x.n]; let sc;
      if (mv.c !== 't' && mv.p) sc = calcDmg(s, b, t, mv, false).dmg * (mv.a ? mv.a / 100 : 1);
      else sc = (mv.ai && !t.m.status ? 20 : 5) + (mv.h && b.m.hp < maxhp(b.m) / 2 ? 40 : 0);
      sc *= 0.7 + rnd(s) * 0.6; if (sc > bs) { bs = sc; best = x.n; } }
    // IA esperta (chefes): troca quando o confronto é ruim
    if (sd.ai === 2 && !sd.swCd) { const cur = matchup(b.m, t.m), frac = bs / Math.max(1, t.m.hp);
      let bi = -1, bv = cur + 60; sd.party.forEach((m, i) => { if (m.hp > 0 && m !== b.m) { const v = matchup(m, t.m); if (v > bv) { bv = v; bi = i; } } });
      if (bi >= 0 && frac < 0.45 && rnd(s) < 0.8) { sd.swCd = 2; return { type: 'switch', i: bi }; } }
    if (sd.swCd) sd.swCd--;
    return { type: 'move', n: best, mega: mg, dyna: dy };
  }
  function matchup(m, o) { const mt = monTypesOf(m), ot = monTypesOf(o); let off = 0;
    for (const x of m.moves) { const mv = D.moves[x.n]; if (mv && mv.c !== 't' && mv.p) off = Math.max(off, mv.p * eff(mv.t, ot) * (mt.includes(mv.t) ? 1.5 : 1)); }
    let def = 0; for (const ty of ot) def = Math.max(def, eff(ty, mt)); return off - def * 70 + m.hp / maxhp(m) * 30; }
  function monTypesOf(m) { return (typeof monTypes === 'function' ? monTypes(m) : D.mons[m.id].t); }
  function aiSwitchIdx(s, side) { const sd = s.sides[side], p = sd.party;
    if (sd.ai === 2) { const o = s.sides[1 - side].b.m; let bi = -1, bv = -1e9; p.forEach((m, i) => { if (m.hp > 0) { const v = matchup(m, o); if (v > bv) { bv = v; bi = i; } } }); if (bi >= 0) return bi; } let best = -1, bl = -1; p.forEach((m, i) => { if (m.hp > 0 && m.lvl > bl) { bl = m.lvl; best = i; } }); return best; }
  // ---------- XP / níveis / evolução ----------
  function xpGain(def, trainer, share) { return Math.max(1, Math.floor(D.mons[def.id].x * def.lvl / 7 * (trainer ? 1.5 : 1) / share)); }
  function addXP(m, amt) {
    // retorna eventos {lvl, learn:[moves], evo}
    const out = []; if (m.lvl >= 100) return out; m.xp += amt; const g = D.mons[m.id].g;
    while (m.lvl < 100 && m.xp >= xpFor(g, m.lvl + 1)) { const oldMax = maxhp(m); m.lvl++; m.hp += maxhp(m) - oldMax;
      const learn = D.mons[m.id].l.filter(([l, n]) => l === m.lvl && D.moves[n] && !m.moves.some(x => x.n === n)).map(x => x[1]);
      out.push({ lvl: m.lvl, learn: [...new Set(learn)] }); }
    return out;
  }
  function levelEvo(m, tod) { const st = calcStats(m);
    const e = (D.mons[m.id].e || []).find(x => x.lvl && m.lvl >= x.lvl && (!x.tod || !tod || x.tod === tod || (x.tod === 'day' && tod !== 'night')) && (x.rps == null || x.rps === Math.sign(st[1] - st[2])));
    return e ? e.to : null; }
  function stoneEvo(m, item) { const e = (D.mons[m.id].e || []).find(x => x.item === item); return e ? e.to : null; }
  function evolve(m, to) { const oldMax = maxhp(m); m.id = to; m.hp = Math.max(1, m.hp + maxhp(m) - oldMax); return m; }

  const API = { NATURES, natMul, movePower, TYPES, eff, rnd, ri, xpFor, calcStats, maxhp, makeMon, movesAt, createBattle, step, needSwitch, forceSwitch, aiAction, aiSwitchIdx,
    monTypes, abilityOf, megaFormFor, canMega, revertMega, canDyna, gmaxOf, maxMoveOf, GMAX, MAXN, xpGain, addXP, levelEvo, stoneEvo, evolve, ballName, BALLS, HEAL, statusName };
  G.PE = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
