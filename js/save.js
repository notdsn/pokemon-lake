// Saves versionados. NUNCA apagar saves: para mudar o formato, incremente SAVE_VERSION e adicione uma migração.
(function (G) {
  const ls = G.localStorage;
  const SAVE_VERSION = 6, P = 'pkLake.';
  const MIGRATIONS = {
    // v1 -> v2: Johto, Creche/Ovos, Mega Evolução, Pontos de Batalha. Só ADICIONA campos (S.gifts e tudo mais é mantido).
    // v2 -> v3: Dinamax/Gigantamax. Só remove estado temporário de batalha (dmax) se tiver sobrado.
    // v3 -> v4: Missões, marcos da Pokédex, conquistas, pesca, mini-jogos, música. Só ADICIONA campos.
    // v4 -> v5: Safári, Raides, Lendas, Torneio, Estilo/Casa, Naturezas (aplicadas no jogo com natFix). Só ADICIONA.
    // v5 -> v6: Lago Infinito, Desafio Diário, Cápsulas, Eventos, Passe, Expedições, Fusão, Concursos, Horta, Laços, Fotos, Fendas — tudo com init preguiçoso. Só ADICIONA.
    5: s => { s.rogue = s.rogue || null; s.caps = s.caps || null; return s; },
    4: s => s,
    3: s => s,
    2: s => { [...(s.party || []), ...(s.box || [])].forEach(m => { if (m && m.dmax) delete m.dmax; }); return s; },
    1: s => { [...(s.party || []), ...(s.box || [])].forEach(m => { if (m && m.mega) delete m.mega; }); return s; },
  };
  function fresh(user) {
    return { v: SAVE_VERSION, user, created: Date.now(), trainer: null, avatar: 'red', money: 3000, party: [], box: [],
      bag: { 'poke-ball': 5, potion: 3 }, badges: [], elite: 0, champion: false, champs: 0, dex: { seen: {}, caught: {}, shiny: {} },
      trainersBeaten: {}, stats: { battles: 0, wins: 0, caught: 0, shinies: 0, steps: 0, playMs: 0, fished: 0, hatched: 0, quizRight: 0, questsDone: 0, megas: 0, dmaxes: 0 }, daily: { last: null, streak: 0 },
      tower: { best: 0, cur: 0 }, settings: { sound: true, speed: 1, music: true, mvol: 0.35, svol: 0.8, follow: true }, lastMap: null,
      gifts: {}, rg: {}, jbadges: [], jelite: 0, jchampion: false, jchamps: 0, region: 'kanto', elmGift: false, rewards: {}, bp: 0, eggs: [], daycare: { slots: [], since: 0, lastEgg: 0 },
      quests: {}, dexm: {}, ach: {}, achInit: 0, title: null, mini: {},
      safari: null, raids: {}, legq: {}, tour: {}, rematch: {}, trophies: 0, style: { color: 'c0', hat: 'h0', aura: 'a0', owned: { c0: 1, h0: 1, a0: 1 } }, house: { slots: [null, null, null, null, null, null, null, null], owned: {}, wall: 'w0', walls: { w0: 1 } } };
  }
  function migrate(s) {
    if (!s || typeof s !== 'object') throw new Error('save inválido');
    let v = s.v || 1;
    if (v < SAVE_VERSION && s.user && ls) { try { ls.setItem(P + 'save.' + s.user + '.premigrate.v' + v, JSON.stringify(s)); } catch (e) {} }
    while (v < SAVE_VERSION) { s = MIGRATIONS[v](s); v++; s.v = v; }
    // campos novos são aditivos: completa o que faltar sem sobrescrever
    const f = fresh(s.user); for (const k in f) if (s[k] === undefined) s[k] = f[k];
    for (const k of ['stats', 'dex', 'daily', 'tower', 'settings', 'daycare', 'style', 'house']) for (const kk in f[k]) if (s[k][kk] === undefined) s[k][kk] = f[k][kk];
    [...(s.party || []), ...(s.box || [])].forEach(m => { if (m && m.mega) delete m.mega; if (m && m.dmax) delete m.dmax; });
    return s;
  }
  const accounts = () => { try { return JSON.parse(ls.getItem(P + 'accounts') || '{}'); } catch (e) { return {}; } };
  function createAccount(user, pass) {
    const a = accounts(); const k = user.trim().toLowerCase(); if (!k) throw new Error('Digite um nome de usuário.');
    if (a[k]) throw new Error('Esse usuário já existe neste aparelho.');
    if (pass.length < 3) throw new Error('A senha precisa ter pelo menos 3 caracteres.');
    a[k] = { name: user.trim(), hash: sha256('pkl:' + k + ':' + pass), created: Date.now() }; ls.setItem(P + 'accounts', JSON.stringify(a));
    write(fresh(k)); return k;
  }
  function login(user, pass) { const a = accounts(), k = user.trim().toLowerCase();
    if (!a[k] || a[k].hash !== sha256('pkl:' + k + ':' + pass)) throw new Error('Usuário ou senha incorretos.'); return k; }
  function read(user) {
    const raw = ls.getItem(P + 'save.' + user); if (!raw) return fresh(user);
    try { return migrate(JSON.parse(raw)); }
    catch (e) { ls.setItem(P + 'save.' + user + '.corrupt.' + Date.now(), raw); return fresh(user); }
  }
  let lastBackup = 0;
  function write(s) {
    const key = P + 'save.' + s.user, str = JSON.stringify(s);
    // backup rotativo a cada 10 min (3 cópias)
    if (Date.now() - lastBackup > 600000) { const old = ls.getItem(key); if (old) { for (let i = 2; i > 0; i--) { const b = ls.getItem(key + '.bak' + (i - 1)); if (b) ls.setItem(key + '.bak' + i, b); } ls.setItem(key + '.bak0', old); } lastBackup = Date.now(); }
    // cópia diária extra (não gira a cada 10 min) para recuperação de Pokémon
    try { const d = new Date().toISOString().slice(0, 10); if (ls.getItem(key + '.bakdayT') !== d) { const old = ls.getItem(key); if (old) ls.setItem(key + '.bakday', old); ls.setItem(key + '.bakdayT', d); } } catch (e) {}
    ls.setItem(key, str);
  }
  function exportSave(s) { return 'PKLAKE1:' + btoa(unescape(encodeURIComponent(JSON.stringify(s)))); }
  function importSave(txt, user) {
    txt = txt.trim(); const json = txt.startsWith('PKLAKE1:') ? decodeURIComponent(escape(atob(txt.slice(8)))) : txt;
    const s = migrate(JSON.parse(json)); if (!s.trainer) throw new Error('Save sem treinador.');
    ls.setItem(P + 'save.' + user + '.preimport.' + Date.now(), ls.getItem(P + 'save.' + user) || ''); s.user = user; write(s); return s;
  }
  G.PS = { SAVE_VERSION, fresh, migrate, accounts, createAccount, login, read, write, exportSave, importSave };
})(typeof window !== 'undefined' ? window : globalThis);
