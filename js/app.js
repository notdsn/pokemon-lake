// UI principal do Pokémon Lake (PT-BR). Motor em engine.js, saves em save.js, conteúdo em content.js.
(function () {
  'use strict';
  const D = PDATA, C = PC;
  const PASS_HASH = '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5';
  const UNLOCK_KEY = 'pkLake.unlock', SESSION_KEY = 'pkLake.session';
  const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const app = $('#app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = n => 'P$ ' + Math.floor(n).toLocaleString('pt-BR');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = { seed: (Date.now() ^ (Math.random() * 1e9)) | 0 };
  const R = () => PE.rnd(st);
  let S = null, user = null, tab = 'home', sub = null, sessionStart = Date.now();
  const A = window.PokeApp = { get save() { return S; }, PE, st };

  // ---------- áudio (WebAudio sintetizado + gritos) ----------
  let ac = null; const audioOn = () => S && S.settings.sound;
  function actx() { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(f, d = 0.08, type = 'square', vol = 0.06, when = 0, slide = 0) {
    if (!audioOn()) return; const c = actx(); if (!c) return; const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d = 0.15, vol = 0.12, when = 0) { if (!audioOn()) return; const c = actx(); if (!c) return; const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length); const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g).connect(c.destination); s.start(c.currentTime + when); }
  const SFX = {
    click: () => tone(880, 0.04, 'square', 0.03), hit: () => { noise(0.12, 0.18); tone(140, 0.12, 'sawtooth', 0.06, 0, -80); },
    superhit: () => { noise(0.22, 0.25); tone(90, 0.25, 'sawtooth', 0.08, 0, -50); }, weak: () => { noise(0.08, 0.08); },
    throw: () => tone(500, 0.35, 'sine', 0.06, 0, 700), shake: () => { tone(180, 0.06, 'square', 0.07); tone(120, 0.06, 'square', 0.05, 0.07); },
    click2: () => tone(1200, 0.05, 'square', 0.07), caught: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.05, i * 0.12)),
    escape: () => tone(300, 0.25, 'sawtooth', 0.06, 0, -200), lvl: () => [523, 659, 784, 659, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, i * 0.09)),
    heal: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.15, 'sine', 0.06, i * 0.11)), status: () => tone(400, 0.3, 'triangle', 0.06, 0, -250),
    sparkle: () => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.1, 'sine', 0.05, i * 0.07)), coin: () => { tone(988, 0.08, 'square', 0.05); tone(1319, 0.2, 'square', 0.05, 0.08); },
    win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.05, i * 0.13)), rustle: () => { noise(0.1, 0.06); noise(0.1, 0.06, 0.15); },
    evo: () => [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, i * 0.18)),
  };
  function cry(id) { if (!audioOn()) return; try { const a = new Audio('cries/' + id + '.ogg'); a.volume = 0.35; a.play().catch(() => {}); } catch (e) {} }

  // ---------- util de Pokémon ----------
  const pn = m => m.nick || D.mons[m.id].n;
  const spr = (m, back) => `img/${back ? (m.shiny ? 'backshiny' : 'back') : (m.shiny ? 'shiny' : 'front')}/${m.id}.gif`;
  const sprId = (id, shiny) => `img/${shiny ? 'shiny' : 'front'}/${id}.gif`;
  const typeChip = t => `<span class="type" style="--tc:${C.TYPE_COLOR[t]}">${C.TYPE_PT[t]}</span>`;
  const hpPct = m => Math.max(0, m.hp / PE.maxhp(m) * 100);
  const hpCol = p => p > 50 ? 'var(--hpg)' : p > 20 ? 'var(--hpy)' : 'var(--hpr)';
  const STATUS_PT = { par: 'PAR', brn: 'QMD', psn: 'ENV', tox: 'ENV', slp: 'DRM', frz: 'CGL' };
  const STATUS_C = { par: '#eab308', brn: '#f97316', psn: '#a855f7', tox: '#7e22ce', slp: '#64748b', frz: '#38bdf8' };
  const stChip = s => s ? `<span class="stchip" style="background:${STATUS_C[s]}">${STATUS_PT[s]}</span>` : '';
  const itemImg = id => `<img class="itemimg" src="img/items/${id}.png" alt="">`;
  function save() { if (!S) return; S.stats.playMs += Date.now() - sessionStart; sessionStart = Date.now(); PS.write(S); }
  setInterval(save, 30000); window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => document.hidden && save());
  function see(id) { S.dex.seen[id] = 1; }
  function addCaught(m) { see(m.id); S.dex.caught[m.id] = 1; if (m.shiny) S.dex.shiny[m.id] = 1; }

  // ---------- hora, clima ----------
  function period() { const h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : h >= 18 && h < 20 ? 'dusk' : 'night'; }
  const PERIOD_PT = { day: '☀️ Dia', dusk: '🌇 Entardecer', night: '🌙 Noite' };
  const WEATHER = { clear: ['Céu limpo', '🌤️'], rain: ['Chuva', '🌧️'], sun: ['Sol forte', '🔥'], fog: ['Neblina', '🌫️'], snow: ['Neve', '❄️'], storm: ['Tempestade', '⛈️'] };
  const THEME_WEATHER = { grass: ['clear', 'clear', 'rain', 'sun'], forest: ['clear', 'rain', 'fog'], cave: ['clear'], water: ['clear', 'rain', 'rain', 'storm'], ghost: ['fog', 'fog', 'clear'],
    safari: ['clear', 'sun', 'rain'], electric: ['storm', 'clear', 'storm'], ice: ['snow', 'snow', 'clear'], volcano: ['sun', 'sun', 'clear'], psychic: ['clear', 'fog'], sky: ['clear', 'storm', 'sun'] };
  function weatherOf(map) { const d = new Date(); const k = `${map.id}|${d.toDateString()}|${Math.floor(d.getHours() / 2)}`; let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
    const opts = THEME_WEATHER[map.theme] || ['clear']; return opts[Math.abs(h) % opts.length]; }
  const battleWeather = w => w === 'rain' || w === 'storm' ? 'rain' : w === 'sun' ? 'sun' : null;

  // ---------- navegação ----------
  const MORE_TABS = ['shop', 'center', 'bag', 'dex', 'card', 'saves', 'settings'];
  function go(t, s) { tab = t; sub = s || null; render(); window.scrollTo(0, 0); }
  function render() {
    if (!S) return;
    const nav = [['home', '🏠', 'Início'], ['team', '🎒', 'Time'], ['maps', '🗺️', 'Mapas'], ['battle', '⚔️', 'Batalha'], ['more', '☰', 'Mais']];
    const V = { home: vHome, team: vTeam, maps: vMaps, battle: vBattle, more: vMore, shop: vShop, center: vCenter, bag: vBag, dex: vDex, card: vCard, saves: vSaves, settings: vSettings, explore: vExplore };
    const on = k => tab === k || (k === 'more' && MORE_TABS.includes(tab)) || (k === 'maps' && tab === 'explore');
    app.innerHTML = `<header class="top"><div class="brand" data-a="tab" data-t="home"><img src="img/items/poke-ball.png" alt=""><b>Pokémon <i>Lake</i></b></div>
      <div class="topr"><span class="chip money">${fmt(S.money)}</span><span class="chip hide-xs">${PERIOD_PT[period()]}</span></div></header>
      <nav class="nav">${nav.map(([k, i, l]) => `<button class="${on(k) ? 'on' : ''}" data-a="tab" data-t="${k}"><span>${i}</span><small>${l}</small></button>`).join('')}</nav>
      <section class="screen s-${tab}">${MORE_TABS.includes(tab) ? `<button class="btn small ghost backbtn" data-a="tab" data-t="more">← Mais</button>` : ''}${V[tab]()}</section>`;
    document.body.dataset.period = period();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a; SFX.click(); actx();
    const fn = ACT[a]; if (fn) { e.preventDefault(); fn(b.dataset, b); }
  });
  const ACT = {};
  ACT.tab = d => go(d.t);
  function toast(msg, kind = '') { const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg; $('#toast-root').appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100); }
  function modal(html, cls = '') { closeModal(); const m = document.createElement('div'); m.className = 'modal-bg'; m.innerHTML = `<div class="modal ${cls}">${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m && !m.dataset.lock) closeModal(); }); $('#modal-root').appendChild(m); return m; }
  function closeModal() { $('#modal-root').innerHTML = ''; }
  ACT.close = () => closeModal();
  function ask(title, body, opts) {
    return new Promise(res => { const m = modal(`<h3>${title}</h3><div class="mbody">${body}</div><div class="mbtns wrap">${opts.map((o, i) => `<button class="btn ${o.cls || ''}" data-i="${i}">${o.t}</button>`).join('')}</div>`);
      m.dataset.lock = 1; $$('.mbtns button', m).forEach(b => b.onclick = () => { SFX.click(); closeModal(); res(opts[+b.dataset.i].v); }); });
  }

  // ---------- portão (senha do site) ----------
  function gate() {
    app.innerHTML = `<div class="center-screen"><div class="logo-big"><img src="img/front/25.gif" alt=""><h1>Pokémon <i>Lake</i></h1><p class="mut">Site privado • só para amigos</p></div>
      <form id="gateForm" class="card form"><label>Senha de acesso</label><input id="pw" type="password" autocomplete="current-password" autocapitalize="off" placeholder="Senha" aria-label="Senha">
      <button class="btn primary">Entrar</button><p id="pwErr" class="err"></p></form></div>`;
    $('#gateForm').onsubmit = e => { e.preventDefault(); const v = $('#pw').value.trim();
      if (sha256(v) === PASS_HASH) { localStorage.setItem(UNLOCK_KEY, PASS_HASH); accountsScreen(); } else { $('#pwErr').textContent = 'Senha incorreta.'; $('#pw').value = ''; } };
  }
  // ---------- contas ----------
  function accountsScreen(mode = 'login') {
    S = null; const names = Object.values(PS.accounts());
    if (!names.length) mode = 'create';
    app.innerHTML = `<div class="center-screen"><div class="logo-big"><img src="img/front/${[25, 133, 1, 4, 7][Math.floor(Math.random() * 5)]}.gif" alt=""><h1>Pokémon <i>Lake</i></h1></div>
      <div class="card form"><div class="seg"><button type="button" class="${mode === 'login' ? 'on' : ''}" data-m="login">Entrar</button><button type="button" class="${mode === 'create' ? 'on' : ''}" data-m="create">Criar conta</button></div>
      <form id="accForm">${mode === 'login' && names.length ? `<label>Contas neste aparelho</label><div class="accs">${names.map(a => `<button type="button" class="acc" data-u="${esc(a.name)}">${esc(a.name)}</button>`).join('')}</div>` : ''}
      <label>Usuário</label><input id="au" autocomplete="username" autocapitalize="off" maxlength="16" placeholder="ex.: edson">
      <label>Senha da conta</label><input id="ap" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="••••">
      <button class="btn primary wide">${mode === 'login' ? 'Entrar' : 'Criar conta e começar'}</button><p id="aerr" class="err"></p>
      <p class="mut small">As contas e saves ficam guardados neste aparelho. Use <b>Mais → Salvar / Backup</b> para levar seu save para outro aparelho.</p></form></div></div>`;
    $$('.seg button').forEach(b => b.onclick = () => accountsScreen(b.dataset.m));
    $$('.acc').forEach(b => b.onclick = () => { $('#au').value = b.dataset.u; $('#ap').focus(); });
    $('#accForm').onsubmit = e => { e.preventDefault(); try { const u = mode === 'login' ? PS.login($('#au').value, $('#ap').value) : PS.createAccount($('#au').value, $('#ap').value); startUser(u); } catch (er) { $('#aerr').textContent = er.message; } };
  }
  function startUser(u) { user = u; sessionStorage.setItem(SESSION_KEY, u); S = PS.read(u); sessionStart = Date.now(); if (!S.trainer) onboarding(); else { checkDaily(); go('home'); } }
  ACT.logout = () => { save(); sessionStorage.removeItem(SESSION_KEY); accountsScreen(); };

  // ---------- novo jogo ----------
  function onboarding(step = 0, pick = {}) {
    if (step === 0) {
      pick.av = pick.av || 'red';
      app.innerHTML = `<div class="onb"><div class="oak card"><img src="img/front/143.gif" class="oakimg" alt=""><div><h2>Bem-vindo ao mundo Pokémon!</h2><p class="mut">Escolha seu visual e seu nome de treinador.</p></div></div>
        <div class="card"><h3>Seu treinador</h3><div class="avatars">${C.AVATARS.map(a => `<button class="av ${pick.av === a ? 'on' : ''}" data-av="${a}"><img src="img/tr/${a}.png" alt=""></button>`).join('')}</div>
        <label>Nome</label><input id="tn" maxlength="12" value="${esc(pick.name || PS.accounts()[user].name)}"><button class="btn primary wide" id="next">Continuar</button></div></div>`;
      $$('.av').forEach(b => b.onclick = () => { pick.av = b.dataset.av; $$('.av').forEach(x => x.classList.toggle('on', x === b)); });
      $('#next').onclick = () => { pick.name = $('#tn').value.trim() || 'Ash'; onboarding(1, pick); };
    } else {
      app.innerHTML = `<div class="onb"><div class="card"><h2>Escolha seu primeiro Pokémon</h2><p class="mut">Ele vai ser seu parceiro na jornada. Toque para escolher.</p></div><div class="grid">
        ${C.STARTERS.map((r, i) => `<div class="card"><h3>${C.REGIONS[i]}</h3><div class="starters">${r.map(id => `<button class="starter" data-id="${id}" style="--tc:${C.TYPE_COLOR[D.mons[id].t[0]]}"><img src="${sprId(id)}" alt=""><b>${D.mons[id].n}</b>${typeChip(D.mons[id].t[0])}</button>`).join('')}</div></div>`).join('')}</div></div>`;
      $$('.starter').forEach(b => b.onclick = async () => { const id = +b.dataset.id; cry(id);
        const ok = await ask(`${D.mons[id].n}?`, `<div class="center"><img class="bigspr" src="${sprId(id)}"><p>Você quer o <b>${D.mons[id].n}</b> como seu parceiro?</p></div>`, [{ t: 'Voltar', v: 0 }, { t: 'Escolher!', cls: 'primary', v: 1 }]);
        if (!ok) return; const m = PE.makeMon(id, 5, st, { ot: pick.name, caughtAt: 'Pokémon inicial', shiny: false }); S.trainer = pick.name; S.avatar = pick.av; S.party = [m]; addCaught(m); save(); SFX.caught();
        await ask('Que comece a aventura!', `<div class="center"><img class="bigspr" src="${spr(m)}"><p>Você recebeu <b>${D.mons[id].n}</b>! Também ganhou 5 Poké Bolas, 3 Poções e ${fmt(3000)}.</p><p class="mut">Vá em <b>Mapas</b> para encontrar Pokémon selvagens.</p></div>`, [{ t: 'Vamos lá!', cls: 'primary', v: 1 }]);
        checkDaily(); go('home'); });
    }
  }

  // ---------- recompensa diária ----------
  const DAILY = [{ money: 1000 }, { 'poke-ball': 5 }, { potion: 3, money: 500 }, { 'great-ball': 3 }, { 'super-potion': 3 }, { 'ultra-ball': 2 }, { 'rare-candy': 1, money: 2000 }];
  const dailyText = r => Object.entries(r).map(([k, v]) => k === 'money' ? fmt(v) : `${v}x ${C.ITEM_NAME[k]}`).join(' + ');
  const streakHtml = () => `<div class="streak">${DAILY.map((x, i) => `<span class="${i < ((S.daily.streak - 1) % 7) + 1 ? 'on' : ''}">${i === 6 ? '🎁' : i + 1}</span>`).join('')}</div>`;
  function checkDaily() {
    const today = new Date().toDateString(); if (S.daily.last === today) return;
    const y = new Date(Date.now() - 864e5).toDateString(); S.daily.streak = S.daily.last === y ? S.daily.streak + 1 : 1; S.daily.last = today;
    const r = DAILY[(S.daily.streak - 1) % 7]; giveReward(r); save();
    setTimeout(() => { SFX.coin(); modal(`<div class="daily center"><div class="gift">🎁</div><h3>Recompensa diária — dia ${S.daily.streak}</h3><p><b>${dailyText(r)}</b></p>${streakHtml()}<p class="mut small">Volte todo dia para manter a sequência!</p><button class="btn primary wide" data-a="close">Pegar!</button></div>`); render(); }, 400);
  }
  function giveReward(r) { for (const [k, v] of Object.entries(r)) { if (k === 'money') S.money += v; else S.bag[k] = (S.bag[k] || 0) + v; } }

  // ---------- telas ----------
  const badgeHtml = (i, on) => `<span class="badge ${on ? 'on' : ''}" style="--bc:${C.BADGE_COLOR[i]}" title="Insígnia ${C.BADGES[i]}"></span>`;
  function nextGoal() {
    const nb = S.badges.length; if (nb < 8) { const g = C.GYMS[nb]; return { t: `Desafie ${g.leader}`, d: `Líder de ${g.city} • tipo ${C.TYPE_PT[g.type]} • nível ~${Math.max(...g.team.map(x => x[1]))}`, img: `img/tr/${g.sprite}.png`, t2: 'battle' }; }
    if (!S.champion) return { t: 'Liga Pokémon', d: 'Enfrente a Elite Four e o Campeão!', img: 'img/tr/lance.png', t2: 'battle' };
    return { t: 'Você é o Campeão!', d: 'Explore a Caverna Celeste, a Torre do Sino e a Torre de Batalha.', img: 'img/tr/red.png', t2: 'maps' };
  }
  const dexCount = () => [Object.keys(S.dex.seen).length, Object.keys(S.dex.caught).length];
  function trainerCard(big) {
    const [se, ca] = dexCount(); const h = Math.floor(S.stats.playMs / 36e5), mi = Math.floor(S.stats.playMs / 6e4) % 60;
    return `<div class="tcard ${big ? 'big' : ''}"><div class="tcl"><img src="img/tr/${S.avatar}.png" alt=""></div><div class="tcr"><small>CARTÃO DE TREINADOR</small><h2>${esc(S.trainer)}${S.champion ? ' 👑' : ''}</h2>
      <div class="badges">${C.BADGES.map((_, i) => badgeHtml(i, S.badges.includes(i))).join('')}</div>
      <div class="tstats"><span><b>${ca}</b> capturados</span><span><b>${se}</b> vistos</span><span><b>${Object.keys(S.dex.shiny).length}</b> ✨</span>${big ? `<span><b>${S.stats.wins}</b> vitórias</span><span><b>${h}h${String(mi).padStart(2, '0')}</b> jogadas</span><span><b>${S.tower.best}</b> torre</span>` : ''}</div></div></div>`;
  }
  function partyMini() { return `<div class="pmini">${S.party.map((m, i) => `<button class="pm" data-a="mon" data-i="${i}" data-w="p"><img src="${spr(m)}" alt=""><small>Nv ${m.lvl}</small><i style="width:${hpPct(m)}%;background:${hpCol(hpPct(m))}"></i></button>`).join('')}</div>`; }
  function vHome() {
    const g = nextGoal(); const lm = C.MAPS.find(m => m.id === S.lastMap) || C.MAPS[0]; const w = weatherOf(lm);
    const hurt = S.party.some(m => m.hp < PE.maxhp(m) || m.status);
    return `<div class="grid">
      <div class="card span2 hero">${trainerCard()}</div>
      <button class="card goal" data-a="tab" data-t="${g.t2}"><img src="${g.img}" alt=""><div><small>PRÓXIMO OBJETIVO</small><h3>${g.t}</h3><p class="mut">${g.d}</p></div><span class="arrow">›</span></button>
      <div class="card"><div class="row between"><h3>Seu time</h3><button class="btn small" data-a="tab" data-t="team">Ver tudo</button></div>${partyMini()}
        ${hurt ? `<button class="btn wide heal" data-a="tab" data-t="center">❤️ Curar no Centro Pokémon</button>` : ''}</div>
      <button class="card scene-card theme-${lm.theme} per-${period()}" data-a="enter" data-id="${lm.id}"><div class="sc-mons">${lm.enc.filter(e => !e[4]?.legend).slice(0, 3).map(e => `<img src="${sprId(e[0])}" class="${S.dex.seen[e[0]] ? '' : 'sil'}" alt="">`).join('')}</div><div class="sc-over"><small>CONTINUAR EXPLORANDO</small><h3>${lm.emoji} ${lm.name}</h3><p>${WEATHER[w][1]} ${WEATHER[w][0]} • ${PERIOD_PT[period()]}</p></div></button>
      <div class="card quick"><button class="qb" data-a="tab" data-t="shop">🛒<small>Loja</small></button><button class="qb" data-a="tab" data-t="dex">📕<small>Pokédex</small></button><button class="qb" data-a="tab" data-t="bag">🎒<small>Mochila</small></button><button class="qb" data-a="tab" data-t="card">🪪<small>Perfil</small></button></div>
      <div class="card"><h3>Sequência diária 🔥 ${S.daily.streak} dia(s)</h3>${streakHtml()}<p class="mut small">Amanhã: ${dailyText(DAILY[S.daily.streak % 7])}</p></div>
    </div>`;
  }
  function monCard(m, i, where) {
    const p = hpPct(m), d = D.mons[m.id];
    return `<button class="mcard ${m.hp <= 0 ? 'fainted' : ''}" data-a="mon" data-i="${i}" data-w="${where}" style="--tc:${C.TYPE_COLOR[d.t[0]]}">
      <div class="msp">${m.shiny ? '<span class="shinytag">✨</span>' : ''}<img src="${spr(m)}" alt="" loading="lazy"></div>
      <div class="minfo"><div class="row between"><b>${esc(pn(m))}</b><small>Nv ${m.lvl}</small></div><div class="types">${d.t.map(typeChip).join('')}${stChip(m.status)}</div>
      <div class="hpbar"><i style="width:${p}%;background:${hpCol(p)}"></i></div><small class="mut">${m.hp}/${PE.maxhp(m)} HP</small></div></button>`;
  }
  function vTeam() {
    return `<div class="grid"><div class="card span2"><div class="row between"><h3>Time (${S.party.length}/6)</h3><span class="mut small">Toque para detalhes</span></div><div class="mgrid">${S.party.map((m, i) => monCard(m, i, 'p')).join('')}</div></div>
      <div class="card"><h3>💻 PC — Caixa (${S.box.length})</h3>${S.box.length ? `<div class="mgrid small">${S.box.map((m, i) => monCard(m, i, 'b')).join('')}</div>` : '<p class="mut">Os Pokémon capturados com o time cheio vão para cá.</p>'}</div></div>`;
  }
  ACT.mon = d => { if (d.w === 'x') return; monDetail(d.w === 'b' ? 'b' : 'p', +d.i); };
  function monDetail(w, i) {
    const list = w === 'b' ? S.box : S.party, m = list[i]; if (!m) return; const d = D.mons[m.id], s = PE.calcStats(m);
    const g = d.g, x0 = PE.xpFor(g, m.lvl), x1 = PE.xpFor(g, m.lvl + 1), xp = m.lvl >= 100 ? 100 : (m.xp - x0) / (x1 - x0) * 100;
    const evo = (d.e || []).map(e => `${D.mons[e.to].n} (${e.lvl ? 'Nv ' + e.lvl : C.ITEM_NAME[e.item] || e.item})`).join(', ');
    const SN = ['HP', 'Ataque', 'Defesa', 'At. Esp.', 'Def. Esp.', 'Veloc.'];
    const mm = modal(`<div class="mdet" style="--tc:${C.TYPE_COLOR[d.t[0]]}"><button class="x" data-a="close">✕</button>
      <div class="mdh"><img class="bigspr ${m.shiny ? 'shiny-glow' : ''}" src="${spr(m)}" alt=""><div class="grow"><h2>${esc(pn(m))} ${m.shiny ? '✨' : ''}</h2><p class="mut">#${String(m.id).padStart(3, '0')} ${d.n} • Nv ${m.lvl}</p><div class="types">${d.t.map(typeChip).join('')}${stChip(m.status)}</div>
      <div class="hpbar"><i style="width:${hpPct(m)}%;background:${hpCol(hpPct(m))}"></i></div><small>${m.hp}/${s[0]} HP</small><div class="xpbar"><i style="width:${xp}%"></i></div><small class="mut">XP ${m.xp - x0}/${x1 - x0} p/ próximo nível</small></div></div>
      <div class="stats">${s.map((v, k) => `<div><small>${SN[k]}</small><div class="sbar"><i style="width:${Math.min(100, d.s[k] / 1.6)}%"></i></div><b>${v}</b></div>`).join('')}</div>
      <h4>Golpes</h4><div class="moves">${m.moves.map(x => { const mv = D.moves[x.n]; return `<div class="mv" style="--tc:${C.TYPE_COLOR[mv.t]}"><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.c === 's' ? 'Status' : mv.c === 'p' ? 'Físico' : 'Especial'}${mv.p ? ' • Poder ' + mv.p : ''} • PP ${x.pp}/${mv.pp}</small></div>`; }).join('')}</div>
      ${evo ? `<p class="mut small">Evolui para: ${evo}</p>` : ''}<p class="mut small">Treinador original: ${esc(m.ot || '-')} • ${esc(m.caughtAt || '')}</p>
      <div class="mbtns wrap">${w === 'p' ? `${i > 0 ? `<button class="btn small" data-k="lead">⭐ Líder</button>` : ''}${S.party.length > 1 ? `<button class="btn small" data-k="tobox">💻 Mandar p/ PC</button>` : ''}` : `<button class="btn small" ${S.party.length >= 6 ? 'disabled' : ''} data-k="toparty">➕ Pôr no time</button><button class="btn small danger" data-k="release">Soltar</button>`}
      <button class="btn small" data-k="nick">✏️ Apelido</button><button class="btn small primary" data-k="item">🎒 Usar item</button></div></div>`, 'wide');
    $$('[data-k]', mm).forEach(b => b.onclick = async () => { SFX.click(); const k = b.dataset.k;
      if (k === 'lead') S.party.unshift(S.party.splice(i, 1)[0]);
      if (k === 'tobox') S.box.push(S.party.splice(i, 1)[0]);
      if (k === 'toparty') S.party.push(S.box.splice(i, 1)[0]);
      if (k === 'release') { if (!(await ask('Soltar?', `Soltar ${esc(pn(m))} na natureza? Isso não pode ser desfeito.`, [{ t: 'Cancelar', v: 0 }, { t: 'Soltar', cls: 'danger', v: 1 }]))) return monDetail(w, i); S.box.splice(i, 1); }
      if (k === 'nick') { const n = prompt('Apelido (vazio para remover):', m.nick || ''); if (n !== null) m.nick = n.trim().slice(0, 12) || null; }
      if (k === 'item') return pickItemFor(m);
      save(); closeModal(); render(); });
  }
  function pickItemFor(m) {
    const usable = Object.entries(S.bag).filter(([k, v]) => v > 0 && !PE.BALLS[k] && C.ITEM_NAME[k]);
    const mm = modal(`<h3>Usar item em ${esc(pn(m))}</h3>${usable.length ? `<div class="ilist">${usable.map(([k, v]) => `<button class="irow" data-it="${k}">${itemImg(k)}<b>${C.ITEM_NAME[k]}</b><small>x${v}</small></button>`).join('')}</div>` : '<p class="mut">Nenhum item utilizável. Compre na Loja!</p>'}<div class="mbtns"><button class="btn" data-a="close">Fechar</button></div>`);
    $$('[data-it]', mm).forEach(b => b.onclick = () => useBagItem(b.dataset.it, m));
  }
  async function useBagItem(it, m) {
    closeModal(); const mh = PE.maxhp(m);
    if (it.endsWith('-stone')) { const to = PE.stoneEvo(m, it); if (!to) return toast('Não teria efeito.'); S.bag[it]--; await evolveAnim(m, to, true); }
    else if (it === 'rare-candy') { if (m.lvl >= 100) return toast('Já está no nível máximo.'); S.bag[it]--; const ups = PE.addXP(m, PE.xpFor(D.mons[m.id].g, m.lvl + 1) - m.xp); SFX.lvl(); toast(`⬆️ ${esc(pn(m))} subiu para o nível ${m.lvl}!`, 'good'); await afterLevel(m, ups); }
    else if (it === 'revive') { if (m.hp > 0) return toast('Não teria efeito.'); S.bag[it]--; m.hp = Math.floor(mh / 2); SFX.heal(); toast(`${esc(pn(m))} foi reanimado!`, 'good'); }
    else if (PE.HEAL[it]) { if (m.hp <= 0 || (m.hp >= mh && !(it === 'full-restore' && m.status))) return toast('Não teria efeito.'); S.bag[it]--; m.hp = Math.min(mh, m.hp + PE.HEAL[it]); if (it === 'full-restore') m.status = null; SFX.heal(); toast(`${esc(pn(m))} recuperou HP!`, 'good'); }
    else if (it === 'antidote' || it === 'full-heal') { if (!m.status || (it === 'antidote' && !['psn', 'tox'].includes(m.status))) return toast('Não teria efeito.'); S.bag[it]--; m.status = null; SFX.heal(); toast('Curado!', 'good'); }
    save(); render();
  }
  async function afterLevel(m, ups) { for (const u of ups) for (const n of u.learn) await learnMove(m, n); const to = PE.levelEvo(m); if (to) await evolveAnim(m, to); save(); render(); }
  async function learnMove(m, n) {
    const mv = D.moves[n]; if (!mv || m.moves.some(x => x.n === n)) return;
    if (m.moves.length < 4) { m.moves.push({ n, pp: mv.pp }); toast(`${esc(pn(m))} aprendeu <b>${mv.n}</b>!`, 'good'); if (B) { log(`${esc(pn(m))} aprendeu <b>${mv.n}</b>!`); await wait(900); } return; }
    const opts = m.moves.map((x, i) => ({ t: `Esquecer ${D.moves[x.n].n}`, v: i })).concat([{ t: `Não aprender`, cls: 'ghost', v: -1 }]);
    const r = await ask(`${esc(pn(m))} quer aprender ${mv.n}!`, `<div class="mv" style="--tc:${C.TYPE_COLOR[mv.t]}"><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.p ? 'Poder ' + mv.p : 'Status'} • Precisão ${mv.a || '—'} • PP ${mv.pp}</small></div><p>Mas já conhece 4 golpes. Qual esquecer?</p>`, opts);
    if (r >= 0) { const old = D.moves[m.moves[r].n].n; m.moves[r] = { n, pp: mv.pp }; toast(`1, 2 e... Pronto! Esqueceu ${old} e aprendeu ${mv.n}!`, 'good'); }
  }
  function evolveAnim(m, to, forced) {
    return new Promise(res => { const from = m.id; SFX.evo(); cry(from);
      const mm = modal(`<div class="evo center"><h3>O quê? ${esc(pn(m))} está evoluindo!</h3><div class="evostage"><img class="e1" src="${spr(m)}" alt=""><img class="e2" src="${sprId(to, m.shiny)}" alt=""><div class="evoflash"></div></div><p class="evomsg mut">...</p>
        <div class="mbtns">${forced ? '<button class="btn ghost" id="evoStop" disabled>...</button>' : '<button class="btn ghost" id="evoStop">✋ Parar evolução</button>'}</div></div>`); mm.dataset.lock = 1;
      let stopped = false; if (!forced) $('#evoStop').onclick = () => { stopped = true; $('#evoStop').disabled = true; };
      setTimeout(() => { const btn = $('#evoStop'); btn.disabled = false;
        if (stopped) { $('.evostage').classList.add('stopped'); $('.evomsg').textContent = `Hã? ${pn(m)} parou de evoluir.`; btn.textContent = 'OK'; btn.onclick = () => { closeModal(); res(false); }; return; }
        const oldName = pn(m); PE.evolve(m, to); addCaught(m); $('.evostage').classList.add('done'); SFX.caught(); cry(to);
        $('.evomsg').innerHTML = `Parabéns! Seu ${esc(oldName)} evoluiu para <b>${D.mons[to].n}</b>!`; btn.textContent = 'Uhuu!'; btn.className = 'btn primary';
        btn.onclick = async () => { closeModal(); save(); const nl = D.mons[to].l.filter(([l, n]) => l === m.lvl && !m.moves.some(x => x.n === n)).map(x => x[1]); for (const n of [...new Set(nl)]) await learnMove(m, n); res(true); }; }, 3600);
    });
  }
  // ---------- mapas ----------
  const unlocked = mp => mp.req === 'champion' ? S.champion : S.badges.length >= mp.req;
  function vMaps() {
    return `<div class="card"><h3>🗺️ Mapas</h3><p class="mut small">${PERIOD_PT[period()]} agora. O horário e o clima mudam quais Pokémon aparecem!</p></div><div class="grid maps">${C.MAPS.map(mp => { const ok = unlocked(mp), w = weatherOf(mp);
      const seen = mp.enc.filter(e => !e[4]?.legend).map(e => e[0]); return `<button class="card mapc theme-${mp.theme} per-${period()} ${ok ? '' : 'locked'}" data-a="enter" data-id="${mp.id}">
      <div class="mapimg"><span class="memo">${mp.emoji}</span><span class="mw">${WEATHER[w][1]}</span><div class="mmons">${seen.slice(0, 4).map(id => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" loading="lazy" alt="">`).join('')}</div></div>
      <div class="mapinfo"><div class="row between"><b>${mp.name}</b><small class="lv">Nv ${mp.lv[0]}–${mp.lv[1]}</small></div><small class="mut">${ok ? mp.desc : mp.req === 'champion' ? '🔒 Torne-se Campeão' : `🔒 Precisa de ${mp.req} insígnia(s)`}</small></div></button>`; }).join('')}</div>`;
  }
  ACT.enter = d => { const mp = C.MAPS.find(m => m.id === d.id); if (!unlocked(mp)) return toast('🔒 Área bloqueada ainda.'); S.lastMap = mp.id; go('explore', mp.id); };
  function encWeights(mp, w) {
    const per = period();
    return mp.enc.map(e => { const [id, wt, , , o = {}] = e; let x = wt; const t = D.mons[id].t;
      if (o.night) x *= per === 'night' ? 3 : per === 'dusk' ? 1.5 : 0.25;
      if (per === 'night' && (t.includes('ghost') || t.includes('dark'))) x *= 1.8; if (per === 'day' && t.includes('bug')) x *= 1.3;
      if ((w === 'rain' || w === 'storm') && t.includes('water')) x *= 2; if (w === 'storm' && t.includes('electric')) x *= 2.5;
      if (w === 'sun' && (t.includes('fire') || t.includes('grass'))) x *= 2; if (w === 'fog' && (t.includes('ghost') || t.includes('psychic'))) x *= 2; if (w === 'snow' && t.includes('ice')) x *= 2;
      if (o.legend && S.dex.caught[id]) x *= 0.3; return x; });
  }
  function vExplore() {
    const mp = C.MAPS.find(m => m.id === sub) || C.MAPS[0], w = weatherOf(mp), ws = encWeights(mp, w), tot = ws.reduce((a, b) => a + b, 0);
    const tr = mp.trainers || [];
    return `<div class="grid"><div class="card span2 explore theme-${mp.theme} w-${w} per-${period()}" id="scene"><div class="sky"><i class="sun"></i></div><div class="wx"></div><div class="ground"></div>
      <div class="grass-row">${'<i></i>'.repeat(12)}</div><img class="me" src="img/tr/${S.avatar}.png" alt=""><div class="alertmark">!</div>
      <div class="ex-top"><button class="btn small ghost" data-a="tab" data-t="maps">← Mapas</button><span class="chip">${WEATHER[w][1]} ${WEATHER[w][0]}</span><span class="chip">${PERIOD_PT[period()]}</span></div>
      <div class="ex-bot"><h2>${mp.emoji} ${mp.name}</h2><p>${mp.desc}</p><button class="btn primary big" data-a="search" id="searchBtn">🔍 Procurar Pokémon</button></div></div>
      <div class="card"><h3>Pokémon desta área</h3><div class="enc">${mp.enc.map((e, i) => { const sn = S.dex.seen[e[0]], leg = e[4]?.legend; if (leg && !sn) return ''; const pc = ws[i] / tot * 100;
        return `<div class="encm ${sn ? '' : 'unk'}"><img src="${sprId(e[0])}" class="${sn ? '' : 'sil'}" alt="" loading="lazy"><small>${sn ? D.mons[e[0]].n : '???'}</small><small class="mut">${pc < 1 ? 'raro' : Math.round(pc) + '%'}${S.dex.caught[e[0]] ? ' ●' : ''}</small></div>`; }).join('')}${mp.enc.some(e => e[4]?.legend && !S.dex.seen[e[0]]) ? '<div class="encm unk"><span class="q">⭐</span><small>Lendário?</small></div>' : ''}</div>
        <p class="mut small">${w !== 'clear' ? `${WEATHER[w][1]} O clima de agora favorece alguns tipos.` : 'Clima estável.'} ● = já capturado</p></div>
      ${tr.length ? `<div class="card"><h3>Treinadores</h3>${tr.map((t, i) => { const k = mp.id + ':' + i, b = S.trainersBeaten[k];
        return `<div class="trow"><img src="img/tr/${t[1]}.png" alt=""><div class="grow"><b>${t[0]}</b><small class="mut">${t[2].map(x => D.mons[x[0]].n + ' ' + x[1]).join(', ')}</small><small>${b ? '✅ Vencido ' + b + 'x • revanche mais forte' : 'Prêmio ' + fmt(t[3])}</small></div><button class="btn small primary" data-a="trainer" data-m="${mp.id}" data-i="${i}">Desafiar</button></div>`; }).join('')}</div>` : ''}</div>`;
  }
  let searching = false;
  ACT.search = async () => {
    if (searching) return; if (!S.party.some(m => m.hp > 0)) return toast('Seus Pokémon estão sem energia! Vá ao Centro Pokémon.', 'bad');
    const mp = C.MAPS.find(m => m.id === sub); searching = true; const sc = $('#scene'); sc.classList.add('walking'); $('#searchBtn').disabled = true;
    const steps = 2 + Math.floor(R() * 3); for (let i = 0; i < steps; i++) { SFX.rustle(); const g = $$('.grass-row i', sc)[Math.floor(R() * 12)]; g?.classList.add('rustle'); setTimeout(() => g?.classList.remove('rustle'), 600); await sleep(420); }
    S.stats.steps += steps; sc.classList.remove('walking');
    const w = weatherOf(mp), ws = encWeights(mp, w), tot = ws.reduce((a, b) => a + b, 0); let r = R() * tot, k = 0; while (k < ws.length - 1 && r > ws[k]) r -= ws[k++];
    const e = mp.enc[k]; const lvl = PE.ri(st, e[2], e[3]);
    const m = PE.makeMon(e[0], lvl, st, { shinyRate: A.shinyRate || 1 / 256 }); m.caughtAt = mp.name;
    sc.classList.add('alert'); tone(1200, 0.1); await sleep(600); searching = false;
    startBattle({ kind: 'wild', enemy: [m], map: mp, weather: battleWeather(w), legend: !!e[4]?.legend });
  };
  ACT.trainer = d => { const mp = C.MAPS.find(m => m.id === d.m), t = mp.trainers[+d.i]; const k = mp.id + ':' + d.i; const rem = S.trainersBeaten[k] ? 1.15 : 1;
    startBattle({ kind: 'trainer', name: t[0], sprite: t[1], enemy: t[2].map(([id, l]) => PE.makeMon(id, Math.round(l * rem), st, { shiny: false })), prize: t[3], key: k, map: mp, ai: 1, weather: battleWeather(weatherOf(mp)), intro: mp.name }); };

  // ---------- batalha (menu) ----------
  function vBattle() {
    const nb = S.badges.length;
    return `<div class="grid"><div class="card span2"><h3>🏟️ Ginásios de Kanto</h3><p class="mut small">Vença os 8 Líderes em ordem para enfrentar a Liga.</p><div class="gyms">${C.GYMS.map((g, i) => { const won = S.badges.includes(i), ok = i <= nb;
      return `<div class="gym ${won ? 'won' : ''} ${ok ? '' : 'locked'}" style="--tc:${C.TYPE_COLOR[g.type]}"><img class="gl" src="img/tr/${g.sprite}.png" alt=""><div class="gi grow"><small>${g.city} • ${C.TYPE_PT[g.type]}</small><b>${g.leader}</b><div class="row">${badgeHtml(i, won)}<small>Insígnia ${C.BADGES[i]}</small></div><div class="gteam">${g.team.map(([id, l]) => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" title="Nv ${l}" alt="">`).join('')}</div></div>
        <button class="btn small ${won ? '' : 'primary'}" ${ok ? '' : 'disabled'} data-a="gym" data-i="${i}">${won ? 'Revanche' : ok ? 'Desafiar' : '🔒'}</button></div>`; }).join('')}</div></div>
      <div class="card league"><h3>🏆 Liga Pokémon</h3><p class="mut small">Elite Four + Campeão em sequência. Se perder, recomeça do início.</p><div class="elite">${C.ELITE.map((e, i) => `<div class="el ${S.elite > i ? 'won' : ''} ${S.elite === i && nb >= 8 ? 'next' : ''}"><img src="img/tr/${e.sprite}.png" alt=""><small>${e.leader}</small></div>`).join('')}</div>
        <button class="btn primary wide" ${nb >= 8 ? '' : 'disabled'} data-a="league">${nb >= 8 ? (S.elite ? `Continuar: ${C.ELITE[S.elite].leader}` : 'Entrar na Liga') : '🔒 Precisa das 8 insígnias'}</button>${S.champs ? `<p class="small">👑 Campeão ${S.champs}x</p>` : ''}</div>
      <div class="card tower"><h3>🗼 Torre de Batalha</h3><p class="mut small">Desafio sem fim contra treinadores com times aleatórios no nível do seu time. Bala Rara a cada 5 vitórias seguidas!</p><p>Sequência: <b>${S.tower.cur}</b> • Recorde: <b>${S.tower.best}</b></p>
        <button class="btn primary wide" ${nb >= 4 ? '' : 'disabled'} data-a="tower">${nb >= 4 ? 'Próxima batalha' : '🔒 Precisa de 4 insígnias'}</button></div>
      <div class="card soon"><h3>🌐 Em breve</h3><p class="mut small">Batalhas ao vivo entre amigos, trocas, chat e creche/ovos. O motor de batalha já foi feito pensando nisso.</p></div></div>`;
  }
  const mkTeam = (team, mul, iv) => team.map(([id, l]) => PE.makeMon(id, Math.min(100, Math.round(l * mul)), st, { shiny: false, iv: Array(6).fill(iv) }));
  ACT.gym = d => { const i = +d.i, g = C.GYMS[i]; startBattle({ kind: 'trainer', gym: i, name: 'Líder ' + g.leader, sprite: g.sprite, enemy: mkTeam(g.team, S.badges.includes(i) ? 1.25 : 1, 24), prize: g.prize, ai: 1, intro: `Ginásio de ${g.city}`, badge: i }); };
  ACT.league = () => { const i = S.elite || 0, e = C.ELITE[i]; startBattle({ kind: 'trainer', elite: i, name: (i === 4 ? 'Campeão ' : '') + e.leader, sprite: e.sprite, enemy: mkTeam(e.team, S.champion ? 1.1 : 1, 28), prize: e.prize, ai: 1, intro: e.title }); };
  const TOWER_TR = [['acetrainer', 'Ás Bruno'], ['acetrainerf', 'Ás Carla'], ['blackbelt', 'Mestre Tadeu'], ['psychic', 'Vidente Íris'], ['beauty', 'Bela Lara'], ['scientist', 'Dr. Otto'], ['hiker', 'Alpinista Rui'], ['swimmer', 'Nadador Gabi']];
  ACT.tower = () => { const ids = Object.keys(D.mons).map(Number).filter(id => !D.mons[id].L && !(D.mons[id].e || []).length); const lv = Math.min(100, Math.max(...S.party.map(m => m.lvl)) + Math.floor(S.tower.cur / 3));
    const [sp, nm] = TOWER_TR[Math.floor(R() * TOWER_TR.length)];
    startBattle({ kind: 'trainer', tower: 1, name: nm, sprite: sp, enemy: [0, 1, 2].map(() => PE.makeMon(ids[Math.floor(R() * ids.length)], lv, st, { shiny: R() < 0.02 })), prize: 1000 + S.tower.cur * 200, ai: 1, intro: `Torre de Batalha — batalha ${S.tower.cur + 1}` }); };

  // ---------- Mais ----------
  function vMore() {
    const it = [['shop', '🛒', 'Loja Pokémon', 'Bolas, poções, pedras'], ['center', '❤️', 'Centro Pokémon', 'Cura grátis do time'], ['bag', '🎒', 'Mochila', 'Seus itens'], ['dex', '📕', 'Pokédex', 'Vistos e capturados'],
      ['card', '🪪', 'Cartão de Treinador', 'Perfil e insígnias'], ['saves', '💾', 'Salvar / Backup', 'Exportar e importar save'], ['settings', '⚙️', 'Configurações', 'Som e velocidade']];
    return `<div class="grid">${it.map(([k, i, t, dsc]) => `<button class="card morec" data-a="tab" data-t="${k}"><span class="mi">${i}</span><div><b>${t}</b><small class="mut">${dsc}</small></div></button>`).join('')}<button class="card morec" data-a="logout"><span class="mi">🚪</span><div><b>Trocar de conta</b><small class="mut">Sair de ${esc(S.trainer)}</small></div></button></div>`;
  }
  function vShop() {
    return `<div class="card"><div class="row between"><h3>🛒 Loja Pokémon</h3><span class="chip money">${fmt(S.money)}</span></div><p class="mut small">Mais itens aparecem conforme você ganha insígnias.</p></div><div class="grid shop">${C.SHOP.map(x => { const ok = S.badges.length >= x.req;
      return `<div class="card item ${ok ? '' : 'locked'}">${itemImg(x.id)}<div class="iinfo grow"><b>${x.name}</b><small class="mut">${ok ? x.desc : `🔒 ${x.req} insígnia(s)`}</small><small>Na mochila: ${S.bag[x.id] || 0}</small></div><div class="buy"><b>${fmt(x.price)}</b><div class="row">
      <button class="btn small" ${ok && S.money >= x.price ? '' : 'disabled'} data-a="buy" data-id="${x.id}" data-n="1">+1</button><button class="btn small" ${ok && S.money >= x.price * 5 ? '' : 'disabled'} data-a="buy" data-id="${x.id}" data-n="5">+5</button></div></div></div>`; }).join('')}</div>`;
  }
  ACT.buy = d => { const x = C.SHOP.find(i => i.id === d.id), n = +d.n; if (S.money < x.price * n) return; S.money -= x.price * n; S.bag[x.id] = (S.bag[x.id] || 0) + n;
    SFX.coin(); toast(`Comprou ${n}x ${x.name}!`, 'good'); save(); render(); };
  function vCenter() {
    return `<div class="grid"><div class="card center-pc"><img class="nurse" src="img/front/113.gif" alt=""><h3>Centro Pokémon</h3><p>Bem-vindo! Quer que eu cure seus Pokémon?</p><div class="pcballs">${S.party.map(() => `<span class="pcb"><img src="img/items/poke-ball.png" alt=""></span>`).join('')}</div>
      <button class="btn primary big" data-a="heal">❤️ Curar time</button></div><div class="card"><h3>Seu time</h3>${partyMini()}</div></div>`;
  }
  ACT.heal = async () => { const bs = $$('.pcb'); for (const b of bs) { b.classList.add('on'); tone(900, 0.08, 'sine', 0.05); await sleep(220); } SFX.heal(); await sleep(900); healAll(); save(); toast('Seus Pokémon estão totalmente recuperados! Volte sempre! ✨', 'good'); render(); };
  function healAll() { for (const m of S.party) { m.hp = PE.maxhp(m); m.status = null; m.moves.forEach(x => x.pp = D.moves[x.n].pp); } }
  function vBag() {
    const it = Object.entries(S.bag).filter(([k, v]) => v > 0 && C.ITEM_NAME[k]);
    return `<div class="card"><h3>🎒 Mochila</h3>${it.length ? `<div class="ilist">${it.map(([k, v]) => `<button class="irow" data-a="bagitem" data-id="${k}">${itemImg(k)}<b>${C.ITEM_NAME[k]}</b><small>x${v}</small></button>`).join('')}</div>` : '<p class="mut">Vazia.</p>'}<p class="mut small">Toque num item para usar em um Pokémon do time.</p></div>`;
  }
  ACT.bagitem = d => { if (PE.BALLS[d.id]) return toast('Bolas são usadas durante batalhas contra Pokémon selvagens.');
    const mm = modal(`<h3>Usar ${C.ITEM_NAME[d.id]} em...</h3><div class="mgrid">${S.party.map((m, i) => monCard(m, i, 'x')).join('')}</div><div class="mbtns"><button class="btn" data-a="close">Cancelar</button></div>`);
    $$('.mcard', mm).forEach(b => b.onclick = e => { e.stopPropagation(); useBagItem(d.id, S.party[+b.dataset.i]); }); };
  let dexFilter = 'all';
  function vDex() {
    const ids = Object.keys(D.mons).map(Number).sort((a, b) => a - b); const [se, ca] = dexCount();
    return `<div class="card"><div class="row between"><h3>📕 Pokédex</h3><b>${ca}/${ids.length}</b></div><div class="progress"><i style="width:${ca / ids.length * 100}%"></i></div><p class="mut small">${se} vistos • ${ca} capturados • ${Object.keys(S.dex.shiny).length} shiny</p>
      <div class="seg">${[['all', 'Todos'], ['caught', 'Capturados'], ['missing', 'Faltando']].map(([k, l]) => `<button class="${dexFilter === k ? 'on' : ''}" data-a="dexf" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div class="dex">${ids.filter(id => dexFilter === 'all' || (dexFilter === 'caught' ? S.dex.caught[id] : !S.dex.caught[id])).map(id => { const sn = S.dex.seen[id], c = S.dex.caught[id];
        return `<button class="dx ${c ? 'c' : ''}" ${sn ? `data-a="dexinfo" data-id="${id}"` : ''}><small>#${String(id).padStart(3, '0')}</small><img src="${sprId(id, !!S.dex.shiny[id])}" class="${sn ? '' : 'sil'}" loading="lazy" alt=""><b>${sn ? D.mons[id].n : '???'}</b>${c ? '<i>●</i>' : ''}</button>`; }).join('')}</div>`;
  }
  ACT.dexf = d => { dexFilter = d.k; render(); };
  ACT.dexinfo = d => { const id = +d.id, m = D.mons[id]; cry(id); const where = C.MAPS.filter(mp => mp.enc.some(e => e[0] === id)).map(mp => mp.name);
    modal(`<div class="center"><img class="bigspr" src="${sprId(id)}" alt=""><h2>#${String(id).padStart(3, '0')} ${m.n}</h2><div class="types">${m.t.map(typeChip).join('')}</div>
      <p class="mut small">Taxa de captura ${m.c} • Total base ${m.s.reduce((a, b) => a + b)} ${m.L ? '• ⭐ Lendário' : ''}</p><p class="small">${where.length ? '📍 ' + where.join(', ') : '📍 Evolução / desconhecido'}</p><button class="btn wide" data-a="close">Fechar</button></div>`); };
  function vCard() { return `<div class="grid"><div class="card span2">${trainerCard(true)}</div><div class="card"><h3>Insígnias</h3><div class="badgegrid">${C.BADGES.map((b, i) => `<div class="bg ${S.badges.includes(i) ? 'on' : ''}" style="--bc:${C.BADGE_COLOR[i]}"><span class="badge ${S.badges.includes(i) ? 'on' : ''}"></span><small>${b}</small><small class="mut">${C.GYMS[i].leader}</small></div>`).join('')}</div></div>
    <div class="card"><h3>Estatísticas</h3><p>Batalhas: <b>${S.stats.battles}</b> • Vitórias: <b>${S.stats.wins}</b><br>Capturas: <b>${S.stats.caught}</b> • Shiny encontrados: <b>${S.stats.shinies}</b><br>Passos: <b>${S.stats.steps}</b> • Desde ${new Date(S.created).toLocaleDateString('pt-BR')}</p></div></div>`; }
  function vSaves() {
    return `<div class="card"><h3>💾 Salvar / Backup</h3><p class="mut small">O jogo salva sozinho neste aparelho. Atualizações do jogo <b>nunca apagam</b> seu progresso (saves versionados com migração). Para trocar de aparelho, exporte o código e importe no outro.</p>
      <div class="stack"><button class="btn primary wide" data-a="exp">📤 Exportar save (copiar código)</button><button class="btn wide" data-a="expfile">⬇️ Baixar arquivo de save</button>
      <textarea id="imp" rows="4" placeholder="Cole aqui o código do save (PKLAKE1:...)"></textarea><button class="btn wide" data-a="imp">📥 Importar save</button><label class="btn wide ghost">📂 Importar de arquivo<input type="file" id="impf" accept=".json,.txt" hidden></label></div>
      <p class="mut small">Versão do save: ${S.v}</p></div>`;
  }
  ACT.exp = async () => { save(); const c = PS.exportSave(S); try { await navigator.clipboard.writeText(c); toast('Código copiado! Guarde em lugar seguro.', 'good'); } catch (e) { $('#imp').value = c; $('#imp').select(); toast('Copie o código da caixa.'); } };
  ACT.expfile = () => { save(); const b = new Blob([PS.exportSave(S)], { type: 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `pokemon-lake-${S.trainer}-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); };
  async function doImport(txt) { if (!(await ask('Importar save?', 'O save atual desta conta será substituído (uma cópia de segurança é guardada).', [{ t: 'Cancelar', v: 0 }, { t: 'Importar', cls: 'primary', v: 1 }]))) return;
    try { S = PS.importSave(txt, user); toast('Save importado!', 'good'); go('home'); } catch (e) { toast('Código inválido: ' + esc(e.message), 'bad'); } }
  ACT.imp = () => doImport($('#imp').value);
  document.addEventListener('change', e => { if (e.target.id === 'impf' && e.target.files[0]) e.target.files[0].text().then(doImport); });
  function vSettings() {
    return `<div class="card"><h3>⚙️ Configurações</h3><div class="setrow"><span>Som</span><div class="seg">${[[true, 'Ligado'], [false, 'Desligado']].map(([v, l]) => `<button class="${S.settings.sound === v ? 'on' : ''}" data-a="set" data-k="sound" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="setrow"><span>Velocidade da batalha</span><div class="seg">${[[1.4, 'Lenta'], [1, 'Normal'], [0.6, 'Rápida'], [0.3, 'Turbo']].map(([v, l]) => `<button class="${S.settings.speed === v ? 'on' : ''}" data-a="set" data-k="speed" data-v="${v}">${l}</button>`).join('')}</div></div>
      <button class="btn wide ghost" data-a="lock">🔒 Bloquear site neste aparelho</button></div>
      <div class="card"><h3>🎁 Código de presente</h3><p class="mut small">Tem um código? Digite aqui para receber o presente (cada código vale uma vez por conta).</p>
      <form id="giftForm" class="row gift"><input id="giftCode" autocapitalize="characters" autocomplete="off" placeholder="XXXX-XXXX" aria-label="Código de presente"><button class="btn primary">Resgatar</button></form><p id="giftErr" class="err"></p></div>`;
  }
  // ---------- códigos de presente (hash sha256, validado no cliente) ----------
  const GIFTS = { 'dac1e434edd06c55a24826838ea64907fd92279994a369734519122db8e2754c': { name: 'Lendas do Edson', build: () => {
    const seen = new Set(), list = [];
    C.MAPS.forEach(mp => mp.enc.forEach(e => { if (e[4] && e[4].legend && !seen.has(e[0])) { seen.add(e[0]); list.push([e[0], e[2]]); } }));
    const out = list.map(([id, l]) => PE.makeMon(id, l, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false }));
    out.push(PE.makeMon(6, 50, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false, iv: [31, 31, 31, 31, 31, 31], moves: ['flamethrower', 'air-slash', 'dragon-claw', 'heat-wave'] }));
    return out; } },
    '96fb1f08d72fdb10d1c524db3b9981ae48a271ef7831d240f0390208882108b9': { name: 'Sylveon do Edson', build: () => [PE.makeMon(700, 50, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false, iv: [31, 31, 31, 31, 31, 31], moves: ['moonblast', 'hyper-voice', 'calm-mind', 'shadow-ball'] })] } };
  async function redeemGift(code) {
    const h = sha256(code.trim().toUpperCase()), g = GIFTS[h], err = $('#giftErr');
    if (!g) { if (err) err.textContent = 'Código inválido.'; return; }
    S.gifts = S.gifts || {};
    if (S.gifts[h]) { if (err) err.textContent = 'Este código já foi resgatado nesta conta.'; return; }
    const mons = g.build(); let toBox = 0;
    mons.forEach(m => { addCaught(m); S.stats.caught++; if (S.party.length < 6) S.party.push(m); else { S.box.push(m); toBox++; } });
    S.gifts[h] = { at: Date.now(), n: mons.length }; save(); SFX.caught();
    modal(`<div class="center giftwin"><div class="burstbg"></div><h2>🎁 ${g.name}!</h2><p>Você recebeu <b>${mons.length} Pokémon</b>!${toBox ? ` ${toBox} foram para o PC.` : ''}</p>
      <div class="giftgrid">${mons.map((m, i) => `<div class="giftmon" style="animation-delay:${i * 0.12}s"><img src="${spr(m)}" alt=""><small>${D.mons[m.id].n}<br>Nv ${m.lvl}</small></div>`).join('')}</div>
      <div class="mbtns"><button class="btn primary wide" data-a="close">Incrível!</button></div></div>`);
    mons.forEach((m, i) => setTimeout(() => { if (i % 3 === 0) cry(m.id); }, i * 120));
    render();
  }
  document.addEventListener('submit', e => { if (e.target.id === 'giftForm') { e.preventDefault(); redeemGift($('#giftCode').value); } });
  ACT.set = d => { S.settings[d.k] = d.k === 'sound' ? d.v === 'true' : +d.v; save(); render(); };
  ACT.lock = () => { save(); localStorage.removeItem(UNLOCK_KEY); sessionStorage.removeItem(SESSION_KEY); S = null; gate(); };

  // =====================================================================
  // BATALHA (UI) — consome eventos do motor PE e anima
  // =====================================================================
  let B = null;
  const spd = () => S.settings.speed || 1;
  const wait = ms => sleep(ms * spd());
  const bq = q => $(q, $('#battle'));
  function startBattle(o) {
    const enemyParty = o.enemy; enemyParty.forEach(m => see(m.id)); S.stats.battles++;
    if (S.party[0].hp <= 0) { const i = S.party.findIndex(m => m.hp > 0); S.party.unshift(S.party.splice(i, 1)[0]); }
    const bs = PE.createBattle({ kind: o.kind, seed: (R() * 2 ** 31) | 0, weather: o.weather, sides: [{ party: S.party, name: S.trainer }, { party: enemyParty, name: o.name || '', ai: o.ai || 0 }] });
    B = { o, s: bs, busy: true };
    const theme = o.map ? o.map.theme : o.tower ? 'psychic' : 'gym';
    const ov = document.createElement('div'); ov.id = 'battle'; ov.className = `battle theme-${theme} ${o.weather ? 'w-' + o.weather : ''} per-${o.map ? period() : 'day'} ${o.gym != null || o.elite != null ? 'boss' : ''}`;
    const p = bs.sides[0].b.m, e = bs.sides[1].b.m;
    ov.innerHTML = `<div class="bwrap"><div class="bscene"><div class="bsky"></div><div class="bwx"></div>
      <div class="plat ep"></div><div class="plat pp"></div>
      <div class="bmon emon hidden"><img id="esp" src="${spr(e)}" alt=""></div><div class="bmon pmon hidden"><img id="psp" src="${spr(p, true)}" alt=""></div>
      <div class="info einfo" id="einfo"></div><div class="info pinfo" id="pinfo"></div>
      <div class="ebs" id="ebs"></div>${o.weather ? `<div class="wchip">${o.weather === 'rain' ? '🌧️ Chuva: Água +50%, Fogo −50%' : '☀️ Sol: Fogo +50%, Água −50%'}</div>` : ''}<div class="fxl" id="fxl"></div>
      ${o.kind === 'trainer' ? `<img class="foe" id="foe" src="img/tr/${o.sprite}.png" alt="">` : ''}<img class="metr" id="metr" src="img/tr/${S.avatar}.png" alt="">
      <div class="intro ${o.kind}" id="intro">${o.kind === 'trainer' ? `<div class="vs"><img src="img/tr/${S.avatar}.png" alt=""><b>VS</b><img src="img/tr/${o.sprite}.png" alt=""></div><div class="vsname">${esc(o.intro || '')}<br><b>${esc(o.name)}</b></div>` : '<i class="bar1"></i><i class="bar2"></i>'}</div></div>
      <div class="bpanel"><div class="blog" id="blog"></div><div class="bctl" id="bctl"></div></div></div>`;
    document.body.appendChild(ov); document.body.classList.add('in-battle');
    drawInfo(0); drawInfo(1); drawBalls(); runIntro();
  }
  function drawInfo(side) {
    const m = B.s.sides[side].b.m, p = hpPct(m), el = $(side ? '#einfo' : '#pinfo');
    const x0 = PE.xpFor(D.mons[m.id].g, m.lvl), x1 = PE.xpFor(D.mons[m.id].g, m.lvl + 1);
    el.innerHTML = `<div class="row between"><b>${esc(pn(m))}${m.shiny ? ' ✨' : ''}</b><small>Nv${m.lvl}</small></div><div class="row"><small class="hpl">HP</small><div class="hpbar"><i style="width:${p}%;background:${hpCol(p)}"></i></div></div>
      <div class="row between"><span>${stChip(m.status)}${B.o.kind === 'wild' && side === 1 && S.dex.caught[m.id] ? '<img class="caughtmark" src="img/items/poke-ball.png" alt="">' : ''}</span>${side ? '' : `<small class="hpn">${m.hp}/${PE.maxhp(m)}</small>`}</div>${side ? '' : `<div class="xpbar"><i style="width:${m.lvl >= 100 ? 100 : (m.xp - x0) / (x1 - x0) * 100}%"></i></div>`}`;
  }
  function setHP(side, hp, max) { const el = $(side ? '#einfo' : '#pinfo'); const i = $('.hpbar i', el); const p = Math.max(0, hp / max * 100); i.style.width = p + '%'; i.style.background = hpCol(p);
    const n = $('.hpn', el); if (n) { const from = parseInt(n.textContent) || 0; const t0 = performance.now(), dur = 600 * spd(); const tick = t => { const k = Math.min(1, (t - t0) / dur); n.textContent = Math.round(from + (hp - from) * k) + '/' + max; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); } }
  function drawBalls() { if (!B || B.o.kind !== 'trainer') return; $('#ebs').innerHTML = B.s.sides[1].party.map(m => `<i class="${m.hp > 0 ? '' : 'out'}"></i>`).join(''); }
  function log(t) { const l = $('#blog'); if (l) l.innerHTML = `<p>${t}</p>`; }
  async function runIntro() {
    const o = B.o, e = B.s.sides[1].b.m, p = B.s.sides[0].b.m; const intro = $('#intro');
    if (o.kind === 'trainer') { SFX.win(); await wait(1500); intro.classList.add('out'); log(`<b>${esc(o.name)}</b> quer batalhar!`); await wait(1100);
      $('#foe').classList.add('leave'); log(`${esc(o.name)} enviou <b>${D.mons[e.id].n}</b>!`); await sendOut(1, e); }
    else { await wait(750); intro.classList.add('out'); const em = bq('.emon'); em.classList.remove('hidden'); em.classList.add('slidein'); bq('#einfo').classList.add('show'); cry(e.id);
      log(o.legend ? `⭐ Um <b>${D.mons[e.id].n}</b> lendário apareceu!` : `Um <b>${D.mons[e.id].n}</b> selvagem apareceu!`);
      if (o.legend) $('#battle').classList.add('legend-aura');
      await wait(900);
      if (e.shiny) { sparkle(1); SFX.sparkle(); S.stats.shinies++; log(`✨ Uau! É um ${D.mons[e.id].n} <b>SHINY</b>! ✨`); await wait(1300); }
      em.classList.remove('slidein'); }
    $('#metr').classList.add('leave'); log(`Vai, <b>${esc(pn(p))}</b>!`); await sendOut(0, p); B.busy = false; showMain();
  }
  async function sendOut(side, m) {
    const el = bq(side ? '.emon' : '.pmon'), img = $(side ? '#esp' : '#psp');
    img.src = spr(m, !side); drawInfo(side); drawBalls(); el.classList.remove('hidden', 'faint', 'caught', 'slidein'); void el.offsetWidth; el.classList.add('pop'); popFx(side); cry(m.id);
    $(side ? '#einfo' : '#pinfo').classList.add('show');
    await wait(600); el.classList.remove('pop'); if (m.shiny) { sparkle(side); SFX.sparkle(); await wait(500); }
    await wait(250);
  }
  function popFx(side) { const [x, y] = center(side); const f = document.createElement('div'); f.className = 'popfx'; f.style.cssText = `left:${x}px;top:${y}px`; $('#fxl').appendChild(f); setTimeout(() => f.remove(), 700); }
  function sparkle(side) { const host = bq(side ? '.emon' : '.pmon'); if (!host) return; for (let i = 0; i < 12; i++) { const s = document.createElement('span'); s.className = 'spark'; s.textContent = i % 2 ? '✦' : '✧'; const a = i / 12 * Math.PI * 2;
    s.style.setProperty('--dx', Math.cos(a) * 75 + 'px'); s.style.setProperty('--dy', Math.sin(a) * 75 + 'px'); s.style.animationDelay = (i % 4) * 0.08 + 's'; host.appendChild(s); setTimeout(() => s.remove(), 1500); } }
  function showMain() {
    const m = B.s.sides[0].b.m; log(`O que <b>${esc(pn(m))}</b> vai fazer?`);
    $('#bctl').innerHTML = `<div class="bmain"><button class="bb fight" data-b="fight">⚔️ Lutar</button><button class="bb bag" data-b="bag">🎒 Mochila</button><button class="bb poke" data-b="poke">🔄 Pokémon</button><button class="bb run" data-b="run">🏃 Fugir</button></div>`;
    bindCtl();
  }
  function showMoves() {
    const m = B.s.sides[0].b.m, e = B.s.sides[1].b.m; const known = S.dex.caught[e.id] || B.o.kind === 'trainer';
    $('#bctl').innerHTML = `<div class="bmoves">${m.moves.map(x => { const mv = D.moves[x.n]; const ef = mv.c !== 's' ? PE.eff(mv.t, D.mons[e.id].t) : 1;
      return `<button class="mvb" style="--tc:${C.TYPE_COLOR[mv.t]}" data-b="mv" data-n="${x.n}" ${x.pp <= 0 ? 'disabled' : ''}><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.p ? 'Pod ' + mv.p : 'Status'} • PP ${x.pp}/${mv.pp}</small>${known ? (ef > 1 ? '<em class="ef up">Super!</em>' : ef < 1 ? `<em class="ef dn">${ef === 0 ? 'Imune' : 'Fraco'}</em>` : '') : ''}</button>`; }).join('')}</div><button class="bb back" data-b="back">← Voltar</button>`;
    bindCtl();
  }
  function showBag() {
    const it = Object.entries(S.bag).filter(([k, v]) => v > 0 && C.ITEM_NAME[k] && (PE.BALLS[k] ? B.o.kind === 'wild' : (PE.HEAL[k] || ['revive', 'antidote', 'full-heal'].includes(k))));
    $('#bctl').innerHTML = `<div class="bitems">${it.length ? it.map(([k, v]) => `<button class="irow" data-b="item" data-id="${k}">${itemImg(k)}<b>${C.ITEM_NAME[k]}</b><small>x${v}</small></button>`).join('') : '<p class="mut">Nada útil na mochila.</p>'}</div><button class="bb back" data-b="back">← Voltar</button>`;
    if (B.o.kind !== 'wild') log('Não dá para capturar Pokémon de outro treinador!');
    bindCtl();
  }
  function showParty(forced, itemFor) {
    const sd = B.s.sides[0];
    $('#bctl').innerHTML = `<div class="bparty">${sd.party.map((m, i) => `<button class="bpm ${i === sd.active ? 'act' : ''}" data-b="${itemFor ? 'useon' : 'sw'}" data-i="${i}" ${(!itemFor && (m.hp <= 0 || i === sd.active)) ? 'disabled' : ''}><img src="${spr(m)}" alt=""><div class="grow"><b>${esc(pn(m))}</b> <small>Nv${m.lvl} ${stChip(m.status)}</small><div class="hpbar"><i style="width:${hpPct(m)}%;background:${hpCol(hpPct(m))}"></i></div><small>${m.hp}/${PE.maxhp(m)}</small></div></button>`).join('')}</div>${forced ? '' : '<button class="bb back" data-b="back">← Voltar</button>'}`;
    if (forced) log('Escolha o próximo Pokémon!'); else if (itemFor) log(`Usar ${C.ITEM_NAME[itemFor]} em quem?`); else log('Trocar para qual Pokémon?');
    B.itemFor = itemFor; bindCtl();
  }
  function bindCtl() { $$('#bctl [data-b]').forEach(b => b.onclick = () => { if (!B || B.busy) return; SFX.click(); const k = b.dataset.b;
    if (k === 'fight') { const m = B.s.sides[0].b.m; if (m.moves.every(x => x.pp <= 0)) return act({ type: 'move', n: 'struggle' }); showMoves(); }
    else if (k === 'bag') showBag(); else if (k === 'poke') showParty(false); else if (k === 'back') showMain();
    else if (k === 'run') act({ type: 'run' }); else if (k === 'mv') act({ type: 'move', n: b.dataset.n });
    else if (k === 'item') { const id = b.dataset.id; if (PE.BALLS[id]) { S.bag[id]--; act({ type: 'ball', ball: id }); } else showParty(false, id); }
    else if (k === 'useon') { const id = B.itemFor, m = B.s.sides[0].party[+b.dataset.i], mh = PE.maxhp(m);
      const ok = id === 'revive' ? m.hp <= 0 : PE.HEAL[id] ? m.hp > 0 && (m.hp < mh || (id === 'full-restore' && m.status)) : !!m.status;
      if (!ok) return toast('Não teria efeito.'); S.bag[id]--; act({ type: 'item', item: id, target: +b.dataset.i }); }
    else if (k === 'sw') { if (B.forced) { B.forced = false; doForced(+b.dataset.i); } else act({ type: 'switch', i: +b.dataset.i }); } }); }
  async function act(a) {
    B.busy = true; $('#bctl').innerHTML = ''; const s = B.s;
    const ev = PE.step(s, [a, PE.aiAction(s, 1)]); await play(ev); if (B) await postTurn();
  }
  async function postTurn() {
    const s = B.s;
    if (s.over) return endBattle();
    if (PE.needSwitch(s, 1)) { await award(); const idx = PE.aiSwitchIdx(s, 1); log(`${esc(B.o.name)} vai enviar <b>${D.mons[s.sides[1].party[idx].id].n}</b>.`); await wait(900); await play(PE.forceSwitch(s, 1, idx)); }
    if (PE.needSwitch(s, 0)) { B.forced = true; B.busy = false; showParty(true); return; }
    B.busy = false; showMain();
  }
  async function doForced(i) { B.busy = true; await play(PE.forceSwitch(B.s, 0, i)); B.busy = false; showMain(); }
  async function award() {
    const s = B.s, def = s.sides[1].b.m; B.awarded = B.awarded || []; if (B.awarded.includes(def.uid)) return; B.awarded.push(def.uid);
    const sd = s.sides[0], parts = sd.participants.filter(i => sd.party[i] && sd.party[i].hp > 0); const base = PE.xpGain(def, s.kind === 'trainer', 1);
    for (let i = 0; i < sd.party.length; i++) { const m = sd.party[i]; if (m.hp <= 0 || m.lvl >= 100) continue; const inP = parts.includes(i); const share = inP ? Math.ceil(base / parts.length) : Math.ceil(base * 0.3);
      for (let k = 0; k < 6; k++) if (D.mons[def.id].s[k] >= 90) m.ev[k] = Math.min(252, (m.ev[k] || 0) + 2);
      const ups = PE.addXP(m, share);
      if (inP) { log(`${esc(pn(m))} ganhou <b>${share}</b> de XP!`); if (i === sd.active) drawInfo(0); await wait(850); }
      for (const u of ups) { SFX.lvl(); log(`⬆️ ${esc(pn(m))} subiu para o nível <b>${u.lvl}</b>!`); if (i === sd.active) { drawInfo(0); const pm = bq('.pmon'); pm.classList.add('lvlup'); setTimeout(() => pm.classList.remove('lvlup'), 900); } await wait(1100);
        for (const n of u.learn) await learnMove(m, n); }
      if (ups.length && PE.levelEvo(m)) (B.evos = B.evos || []).push(m); }
    sd.participants = [sd.active];
  }
  async function play(ev) {
    const ov = $('#battle');
    for (const e of ev) {
      if (!ov || !document.body.contains(ov)) return;
      const mon = side => bq(side ? '.emon' : '.pmon');
      switch (e.e) {
        case 'use': { log(e.text); await wait(420); const el = mon(e.side); el.classList.add('lunge'); setTimeout(() => el.classList.remove('lunge'), 450);
          if (e.cat !== 's') await projectile(e.side, e.type); else { auraFx(e.side, e.type); SFX.status(); await wait(550); } break; }
        case 'hp': { const el = mon(e.side); if (e.dmg > 0) { el.classList.add('hit'); if (e.eff > 1 || e.crit) { SFX.superhit(); ov.classList.add('shake'); } else if (e.eff < 1) SFX.weak(); else SFX.hit();
            dmgNum(e.side, e.dmg, e.crit, e.eff); setTimeout(() => { el.classList.remove('hit'); ov.classList.remove('shake'); }, 500); }
          setHP(e.side, e.hp, e.max); await wait(650); break; }
        case 'heal': log(e.text); healFx(e.side); SFX.heal(); setHP(e.side, e.hp, e.max); await wait(800); break;
        case 'faint': { log(e.text); const el = mon(e.side); cry(B.s.sides[e.side].b.m.id); await wait(300); el.classList.add('faint'); $(e.side ? '#einfo' : '#pinfo').classList.remove('show'); drawBalls(); await wait(1000); break; }
        case 'status': log(e.text); SFX.status(); statusFx(e.side, e.status); drawInfo(e.side); await wait(900); break;
        case 'cure': log(e.text); drawInfo(e.side); await wait(800); break;
        case 'stat': { log(e.text); const el = mon(e.side); el.classList.add(e.d > 0 ? 'statup' : 'statdn'); tone(e.d > 0 ? 400 : 700, 0.3, 'sine', 0.05, 0, e.d > 0 ? 500 : -400); await wait(900); el.classList.remove('statup', 'statdn'); break; }
        case 'miss': log(e.text); tone(200, 0.15, 'sine', 0.04); await wait(800); break;
        case 'recall': { log(e.text); const el = mon(e.side); el.classList.add('recall'); await wait(500); el.classList.add('hidden'); el.classList.remove('recall'); break; }
        case 'send': log(e.text); await sendOut(e.side, B.s.sides[e.side].b.m); break;
        case 'throw': log(e.text); await throwBall(e.ball); break;
        case 'shake': log('...'); for (let i = 0; i < e.n; i++) { await wait(450); const b = $('#cball'); if (b) { b.classList.remove('wob'); void b.offsetWidth; b.classList.add('wob'); } SFX.shake(); log('.'.repeat(i + 1) + ' <b>tremeu!</b>'); await wait(500); } await wait(300); break;
        case 'caught': { $('#cball')?.classList.add('click'); SFX.click2(); await wait(350); starsFx(); SFX.caught(); log(`🎉 ${e.text}`); await wait(1700); break; }
        case 'escape': { $('#cball')?.remove(); const el = mon(1); el.classList.remove('caught'); el.classList.add('breakout'); popFx(1); SFX.escape(); log(e.text); await wait(900); el.classList.remove('breakout'); break; }
        case 'run': log(e.text); tone(600, 0.2, 'sine', 0.05, 0, 300); await wait(800); break;
        case 'weather': case 'end': break;
        default: if (e.text) { log(e.text); if (e.anim) statusFx(e.side, e.anim); await wait(850); }
      }
    }
  }
  function center(side) { const el = $(side ? '#esp' : '#psp'), r = el.getBoundingClientRect(), o = bq('.bscene').getBoundingClientRect(); return [r.left - o.left + r.width / 2, r.top - o.top + r.height / 2]; }
  async function projectile(side, type) {
    const [x0, y0] = center(side), [x1, y1] = center(1 - side), c = C.TYPE_COLOR[type] || '#fff', fx = $('#fxl');
    if (['normal', 'fighting', 'ground', 'rock', 'bug', 'steel', 'dark', 'flying'].includes(type)) {
      await wait(200); const sl = document.createElement('div'); sl.className = 'slash t-' + type; sl.style.cssText = `left:${x1}px;top:${y1}px;--c:${c}`; fx.appendChild(sl); tone(300, 0.08, 'sawtooth', 0.04); await wait(300); setTimeout(() => sl.remove(), 600); return; }
    const n = ['electric', 'water', 'fire', 'grass', 'ice', 'poison'].includes(type) ? 6 : 2;
    for (let i = 0; i < n; i++) { const p = document.createElement('div'); p.className = 'proj t-' + type; p.style.cssText = `left:${x0}px;top:${y0}px;--c:${c};--dx:${x1 - x0}px;--dy:${y1 - y0}px;animation-delay:${i * 55}ms;animation-duration:${Math.round(450 * spd())}ms`; fx.appendChild(p); setTimeout(() => p.remove(), 900 * spd() + i * 55 + 100); }
    tone(type === 'electric' ? 1400 : type === 'water' ? 500 : 800, 0.3, type === 'electric' ? 'sawtooth' : 'sine', 0.04, 0, type === 'fire' ? -500 : 300);
    await wait(470 + n * 50);
    const b = document.createElement('div'); b.className = 'burst'; b.style.cssText = `left:${x1}px;top:${y1}px;--c:${c}`; fx.appendChild(b); setTimeout(() => b.remove(), 600);
  }
  function auraFx(side, type) { const el = bq(side ? '.emon' : '.pmon'); el.style.setProperty('--aura', C.TYPE_COLOR[type]); el.classList.add('aura'); setTimeout(() => el.classList.remove('aura'), 750); }
  function healFx(side) { const el = bq(side ? '.emon' : '.pmon'); el.classList.add('healfx'); setTimeout(() => el.classList.remove('healfx'), 900); }
  function statusFx(side, s) { if (side == null) return; const el = bq(side ? '.emon' : '.pmon'); if (!el) return; el.classList.add('st-' + s); setTimeout(() => el.classList.remove('st-' + s), 900); }
  function dmgNum(side, d, crit, eff) { const [x, y] = center(side); const n = document.createElement('div'); n.className = 'dmg' + (crit ? ' crit' : '') + (eff > 1 ? ' sup' : eff < 1 ? ' weak' : ''); n.textContent = '-' + d + (crit ? '!' : ''); n.style.cssText = `left:${x}px;top:${y - 30}px`; $('#fxl').appendChild(n); setTimeout(() => n.remove(), 1100); }
  async function throwBall(ball) {
    const fx = $('#fxl'), [x1, y1] = center(1), sc = bq('.bscene').getBoundingClientRect(); const b = document.createElement('img'); b.id = 'cball'; b.className = 'cball'; b.src = `img/items/${ball}.png`;
    b.style.cssText = `--sx:${sc.width * 0.15}px;--sy:${sc.height * 0.95}px;--tx:${x1}px;--ty:${y1}px`; fx.appendChild(b); SFX.throw(); await wait(650);
    b.classList.add('landed'); popFx(1); const el = bq('.emon'); el.classList.add('caught'); tone(1000, 0.3, 'sine', 0.05, 0, -700); await wait(600);
    b.classList.add('drop'); await wait(450);
  }
  function starsFx() { const b = $('#cball'); if (!b) return; const r = b.getBoundingClientRect(), o = bq('.bscene').getBoundingClientRect(); const x = r.left - o.left + r.width / 2, y = r.top - o.top;
    for (let i = 0; i < 8; i++) { const s = document.createElement('span'); s.className = 'star'; s.textContent = '★'; s.style.cssText = `left:${x}px;top:${y}px;--dx:${(i - 3.5) * 22}px;--dy:${-50 - Math.random() * 40}px`; $('#fxl').appendChild(s); setTimeout(() => s.remove(), 1300); } }
  async function endBattle() {
    const s = B.s, o = B.o; let msg = '';
    if (s.ran) return closeBattle();
    if (s.caught) { const m = s.caught; m.ot = S.trainer; m.caughtAt = (o.map ? o.map.name : '') + ' • ' + new Date().toLocaleDateString('pt-BR'); const isNew = !S.dex.caught[m.id]; addCaught(m); S.stats.caught++;
      let where; if (S.party.length < 6) { S.party.push(m); where = 'entrou no seu time'; } else { S.box.push(m); where = 'foi enviado para o PC'; }
      await award(); save(); await finishEvos(); closeBattle();
      const m2 = modal(`<div class="center caughtm"><div class="burstbg"></div><img class="bigspr ${m.shiny ? 'shiny-glow' : ''}" src="${spr(m)}" alt=""><h2>${D.mons[m.id].n} capturado! ${m.shiny ? '✨' : ''}</h2>${isNew ? '<p class="newdex">🆕 Registrado na Pokédex!</p>' : ''}<p>Nv ${m.lvl} • ${where}.</p><p class="mut small">Pokédex: ${Object.keys(S.dex.caught).length} capturados</p><div class="mbtns"><button class="btn" id="nick">✏️ Dar apelido</button><button class="btn primary" data-a="close">Continuar</button></div></div>`);
      $('#nick', m2).onclick = () => { const n = prompt('Apelido:', ''); if (n) { m.nick = n.trim().slice(0, 12); save(); } closeModal(); render(); };
      return;
    }
    if (s.winner === 0) {
      await award(); S.stats.wins++;
      if (o.kind === 'trainer') { const f = $('#foe'); if (f) { f.classList.remove('leave'); f.classList.add('back'); } const prize = o.prize; S.money += prize; SFX.win(); log(`🏆 Você venceu ${esc(o.name)}! Ganhou <b>${fmt(prize)}</b>.`); await wait(2000);
        if (o.key) S.trainersBeaten[o.key] = (S.trainersBeaten[o.key] || 0) + 1;
        if (o.badge != null && !S.badges.includes(o.badge)) { S.badges.push(o.badge); S.badges.sort((a, b) => a - b); msg = 'badge:' + o.badge; }
        if (o.elite != null) { if (o.elite < 4) { S.elite = o.elite + 1; msg = 'elite'; } else { S.elite = 0; S.champion = true; S.champs++; msg = 'champ'; } }
        if (o.tower) { S.tower.cur++; S.tower.best = Math.max(S.tower.best, S.tower.cur); if (S.tower.cur % 5 === 0) { S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1; msg = 'tower5'; } }
      } else { const coin = Math.floor(s.sides[1].party[0].lvl * 10); S.money += coin; log(`Você ganhou ${fmt(coin)} de bônus de pesquisa.`); await wait(900); }
      save(); await finishEvos(); closeBattle();
      if (msg.startsWith('badge')) { const i = +msg.split(':')[1]; SFX.caught(); modal(`<div class="center badgewin"><div class="bigbadge" style="--bc:${C.BADGE_COLOR[i]}"><span class="badge on"></span></div><h2>Insígnia ${C.BADGES[i]}!</h2><p>Você derrotou ${C.GYMS[i].leader} e recebeu a Insígnia ${C.BADGES[i]}.</p><p class="mut small">${i < 7 ? 'Novas áreas e itens foram desbloqueados!' : 'Agora você pode desafiar a Liga Pokémon!'}</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`); }
      if (msg === 'elite') toast(`Próximo desafio: ${C.ELITE[S.elite].leader}! Cure-se se precisar.`, 'good');
      if (msg === 'champ') modal(`<div class="center badgewin"><div class="bigbadge crown">👑</div><h2>Novo Campeão!</h2><p>Parabéns, ${esc(S.trainer)}! Você é o Campeão da Liga Pokémon!</p><p class="mut small">Caverna Celeste e Torre do Sino foram liberadas. Lendários aguardam...</p><button class="btn primary wide" data-a="close">🏆</button></div>`);
      if (msg === 'tower5') toast('🗼 5 vitórias seguidas! +1 Bala Rara', 'good');
    } else {
      const lost = Math.floor(S.money / 2); S.money -= lost; log(`Você não tem mais Pokémon em condições... Perdeu ${fmt(lost)}.`); await wait(1800);
      if (o.elite != null) S.elite = 0; if (o.tower) S.tower.cur = 0;
      healAll(); save(); closeBattle(); toast('Você correu para o Centro Pokémon. Seu time foi curado.', 'bad');
    }
  }
  async function finishEvos() { for (const m of [...new Set(B.evos || [])]) { const to = PE.levelEvo(m); if (to) await evolveAnim(m, to); } B.evos = []; }
  function closeBattle() {
    S.party.forEach(m => { if (m.status === 'tox') m.status = 'psn'; });
    save(); const ov = $('#battle'); B = null; if (ov) { ov.classList.add('closing'); setTimeout(() => { ov.remove(); document.body.classList.remove('in-battle'); render(); }, 350); }
  }
  A.debug = { startBattle, go, get B() { return B; }, healAll, save, render, act: a => act(a) };

  // ---------- boot ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (localStorage.getItem(UNLOCK_KEY) !== PASS_HASH) gate();
  else { const u = sessionStorage.getItem(SESSION_KEY); if (u && PS.accounts()[u]) startUser(u); else accountsScreen(); }
})();
