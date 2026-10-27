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
    g.gain.setValueAtTime(vol * ((S && S.settings.svol) ?? 0.8) / 0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
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
  // sprites do Showdown têm tamanho natural proporcional ao Pokémon: escala fixa e nítida na batalha
  document.addEventListener('load', e => { const t = e.target; if (t.tagName === 'IMG' && t.closest && t.closest('.bmon')) fitSpr(t); }, true);
  function fitSpr(img) { if (!img.naturalWidth) return; const back = !!img.closest('.pmon'), k = innerWidth < 600 ? (back ? 1.15 : 1.7) : (back ? 1.5 : 2.4), box = img.closest('.bmon');
    let w = img.naturalWidth * k, h = img.naturalHeight * k; const mh = box ? box.clientHeight : 1e9, mw = box ? box.clientWidth : 1e9; const f = Math.min(1, mh / h, mw / w); w *= f; h *= f; img.style.width = w + 'px'; img.style.height = h + 'px'; }
  const spr = (m, back) => { const d = back ? (m.shiny ? 'backshiny' : 'back') : (m.shiny ? 'shiny' : 'front'); if (m.dmax && m.dmax.g && PE.GMAX[m.id]) return `img/gmax/${d}/${PE.GMAX[m.id].k}.gif`; return m.mega ? `img/mega/${d}/${m.mega}.gif` : `img/${d}/${m.id}.gif`; };
  const bname = m => m.dmax && m.dmax.g && PE.GMAX[m.id] && !m.nick ? PE.GMAX[m.id].n : m.mega && !m.nick && D.megas[m.mega] ? D.megas[m.mega].n : pn(m);
  const mtypes = m => PE.monTypes(m);
  const tod = () => period() === 'night' ? 'night' : 'day';
  const abName = k => (D.abils && D.abils[k] ? D.abils[k].n : (k || '').replace(/-/g, ' '));
  const ACT = {};
  const FEAT = { johto: true, daycare: true };
  const isJohtoOpen = () => FEAT.johto && !!S.champion;
  // ---------- Creche Pokémon + ovos ----------
  const PREVO = {}; for (const id in D.mons) for (const e of D.mons[id].e || []) if (D.mons[e.to] && !PREVO[e.to]) PREVO[e.to] = +id;
  const baseOf = id => { let x = id, g = 0; while (PREVO[x] && g++ < 5) x = PREVO[x]; return x; };
  const EGG_MIN = 8 * 60e3, XP_PER_MIN = 60;
  function compat(a, b) { if (!a || !b) return 0; const ea = D.mons[a.id].eg || [], eb = D.mons[b.id].eg || [];
    if (ea.includes('no-eggs') || eb.includes('no-eggs') || D.mons[a.id].L || D.mons[b.id].L) return 0;
    if (a.id === 132 && b.id === 132) return 0; if (a.id === 132 || b.id === 132) return 2;
    if (!ea.some(g => eb.includes(g))) return 0; return baseOf(a.id) === baseOf(b.id) ? 3 : 2; }
  const COMPAT_TXT = ['Eles não parecem se dar bem... Nenhum ovo vai aparecer.', '', 'Eles se dão bem. Ovos aparecem de vez em quando.', 'Eles se adoram! Ovos aparecem com frequência.'];
  function lvlUp(m) { let up = 0; while (m.lvl < 100 && m.xp >= PE.xpFor(D.mons[m.id].g, m.lvl + 1)) { m.lvl++; up++; } return up; }
  function daycareTick(extraMs = 0) { const dc = S.daycare; const now = Date.now() + (A.dcSkew || 0) + extraMs; if (extraMs) A.dcSkew = (A.dcSkew || 0) + extraMs;
    if (!dc.slots.length) { dc.since = now; dc.lastEgg = now; return; }
    const mins = Math.max(0, (now - (dc.since || now)) / 60e3); if (mins >= 1) { for (const m of dc.slots) { m.xp += Math.floor(mins * XP_PER_MIN * (1 + m.lvl / 10)); lvlUp(m); } dc.since = now; }
    const [a, b] = dc.slots, c = compat(a, b);
    if (c && S.eggs.length < 6) { while (now - (dc.lastEgg || now) >= EGG_MIN) { dc.lastEgg += EGG_MIN; if (R() < (c === 3 ? 0.7 : 0.45) && S.eggs.length < 6) makeEgg(a, b); } } else dc.lastEgg = now;
    const em = Math.floor((now - (S.eggT || now)) / 60e3); if (em >= 1 || !S.eggT) { eggSteps(em * 5); S.eggT = em >= 1 ? (S.eggT || now) + em * 60e3 : now; } save(); }
  function makeEgg(a, b, idOverride) { const id = idOverride || baseOf(a.id === 132 ? b.id : a.id), iv = [0, 1, 2, 3, 4, 5].map(() => PE.ri({ seed: (R() * 2 ** 31) | 0 }, 0, 31));
    if (a && b) { const pick = [0, 1, 2, 3, 4, 5].sort(() => R() - 0.5).slice(0, 3); for (const k of pick) iv[k] = (R() < 0.5 ? a : b).iv[k]; }
    const hc = D.mons[id].hc || 20; S.eggs.push({ id, iv, steps: hc * 12, total: hc * 12, from: a ? 'Creche' : 'Prof. Elm', at: Date.now() }); A.newEgg = 1; }
  function eggSteps(n) { if (!n) return; n = Math.round(n * evEggMul()); for (const e of S.eggs) e.steps = Math.max(0, e.steps - n); }
  async function checkEggs() { if (B || !S.trainer) return; const i = S.eggs.findIndex(e => e.steps <= 0); if (i < 0) { if (A.newEgg) { A.newEgg = 0; toast('🥚 A Creche encontrou um Ovo! Veja em Time.', 'good'); } return; }
    const e = S.eggs.splice(i, 1)[0]; const m = PE.makeMon(e.id, 1, { seed: (R() * 2 ** 31) | 0 }, { ot: S.trainer, caughtAt: 'Chocado de um Ovo (' + e.from + ')', iv: e.iv, shiny: !!e.shiny || R() < shinyP() });
    addCaught(m); S.stats.caught++; if (m.shiny) S.stats.shinies++; S.stats.hatched = (S.stats.hatched || 0) + 1; track('hatch'); if (S.party.length < 6) S.party.push(m); else S.box.push(m); save();
    modal(`<div class="center hatch"><div class="eggbig" id="eggbig"></div><h2 id="hatchT">Hã? O ovo está se mexendo!</h2><p id="hatchP" class="mut"></p><div class="mbtns"><button class="btn primary wide hidden" id="hatchOk" data-a="close">Que fofo!</button></div></div>`);
    SFX.shake(); await sleep(900); $('#eggbig')?.classList.add('crack'); SFX.shake(); await sleep(1300);
    const eb = $('#eggbig'); if (!eb) return; eb.outerHTML = `<img class="hatched" src="${spr(m)}" alt="">`; SFX.caught(); cry(m.id);
    $('#hatchT').textContent = `${D.mons[m.id].n} nasceu!${m.shiny ? ' ✨' : ''}`; $('#hatchP').textContent = S.party.includes(m) ? 'Entrou no seu time.' : 'Foi para o PC.'; $('#hatchOk').classList.remove('hidden'); render(); }
  const eggCard = e => { const pct = Math.round((1 - e.steps / e.total) * 100); return `<div class="egg" title="${e.from}"><div class="eggico ${pct > 80 ? 'soon' : ''}"></div><small>${pct > 80 ? 'Quase chocando!' : pct > 40 ? 'Faz barulhos...' : 'Vai demorar...'}</small><i style="width:${pct}%"></i></div>`; };
  function vDaycare() { daycareTick(); const dc = S.daycare, [a, b] = dc.slots, c = compat(a, b);
    const slot = (m, i) => m ? `<div class="dcslot"><img src="${spr(m)}" alt=""><b>${pn(m)}</b><small>Nv ${m.lvl}</small><button class="btn small" data-a="dcout" data-i="${i}">Retirar</button></div>` : `<div class="dcslot empty"><span>+</span><small>Vaga livre</small></div>`;
    const cand = [...S.party.map((m, i) => [m, 'p', i]), ...S.box.map((m, i) => [m, 'b', i])].filter(([m]) => m.hp > 0 || true);
    return `<div class="grid"><div class="card span2 dchead"><h2>🏡 Creche Pokémon</h2><p class="mut">Deixe até 2 Pokémon. Eles ganham XP com o tempo real e, se forem compatíveis, aparecem Ovos! Ovos chocam explorando (cada busca = passos) ou com o tempo.</p>
      <div class="dcslots">${slot(a, 0)}<div class="dcheart">${a && b ? (c ? '💞' : '💤') : '🏠'}</div>${slot(b, 1)}</div>${a && b ? `<p class="center dcmsg">${COMPAT_TXT[c]}</p>` : ''}
      <p class="mut small center">🥚 Ovos com você: <b>${S.eggs.length}/6</b></p></div>
      ${dc.slots.length < 2 ? `<div class="card span2"><h3>Escolha quem deixar na Creche</h3><div class="dcpick">${cand.map(([m, w, i]) => `<button class="pm" data-a="dcin" data-w="${w}" data-i="${i}" data-u="${m.uid || ''}" ${w === 'p' && S.party.length <= 1 ? 'disabled' : ''}><img src="${spr(m)}" alt=""><small>${D.mons[m.id].n} Nv ${m.lvl}</small></button>`).join('')}</div><p class="mut small">Você precisa manter pelo menos 1 Pokémon no time.</p></div>` : ''}
      ${S.eggs.length ? `<div class="card span2"><h3>🥚 Seus ovos</h3><div class="eggs">${S.eggs.map(eggCard).join('')}</div></div>` : ''}</div>`; }
  ACT.dcin = d => { if (S.daycare.slots.length >= 2) return; const arr = d.w === 'p' ? S.party : S.box; let i = +d.i; if (d.u) { const j = arr.findIndex(x => x.uid === d.u); if (j < 0) return render(); i = j; } if (!arr[i]) return render(); if (d.w === 'p' && S.party.length <= 1) return toast('Mantenha pelo menos 1 Pokémon no time.');
    daycareTick(); const m = arr.splice(i, 1)[0]; m.hp = PE.maxhp(m); m.status = null; S.daycare.slots.push(m); if (S.daycare.slots.length === 1) { S.daycare.since = Date.now() + (A.dcSkew || 0); S.daycare.lastEgg = S.daycare.since; } save(); toast(`${pn(m)} ficou na Creche.`, 'good'); render(); };
  ACT.dcout = d => { daycareTick(); const m = S.daycare.slots.splice(+d.i, 1)[0]; if (!m) return; m.hp = PE.maxhp(m); if (S.party.length < 6) S.party.push(m); else S.box.push(m); save(); toast(`${pn(m)} voltou (Nv ${m.lvl})${S.party.includes(m) ? '' : ' para o PC'}.`, 'good'); render(); };
  // ---------- Prof. Elm ----------
  ACT.elm = () => { if (S.elmGift) return; modal(`<div class="center elmbox"><img src="img/tr/elm.png" alt="" class="elmimg"><h2>Prof. Elm</h2><p>“Bem-vindo a Johto, Campeão! Escolha um destes Pokémon. E leve também este Ovo misterioso que um amigo me mandou...”</p>
      <div class="starters">${[152, 155, 158].map(id => `<button class="starter" data-a="elmpick" data-id="${id}"><img src="${sprId(id)}" alt=""><b>${D.mons[id].n}</b>${typeChip(D.mons[id].t[0])}</button>`).join('')}</div></div>`); };
  ACT.elmpick = d => { if (S.elmGift) return; const id = +d.id, m = PE.makeMon(id, 15, { seed: (R() * 2 ** 31) | 0 }, { ot: S.trainer, caughtAt: 'Presente do Prof. Elm', shiny: false });
    addCaught(m); S.stats.caught++; if (S.party.length < 6) S.party.push(m); else S.box.push(m); makeEgg(null, null, 175); A.newEgg = 0; S.elmGift = true; save(); SFX.caught(); cry(id);
    modal(`<div class="center"><img src="${spr(m)}" alt="" style="height:96px"><h2>Você recebeu ${D.mons[id].n}!</h2><p>…e um <b>Ovo misterioso</b> 🥚. Ele vai chocar enquanto você explora.</p><button class="btn primary wide" data-a="close">Obrigado, Prof.!</button></div>`); render(); };
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
  const MORE_TABS = ['shop', 'center', 'bag', 'dex', 'card', 'saves', 'settings', 'daycare', 'quests', 'games', 'ach', 'safari', 'raid', 'legends', 'arena', 'house', 'style'];
  const moreOk = k => k !== 'daycare' || FEAT.daycare;
  function go(t, s) { tab = t; sub = s || null; render(); window.scrollTo(0, 0); }
  function render() {
    if (!S) return;
    const nav = [['home', '🏠', 'Início'], ['team', '🎒', 'Time'], ['maps', '🗺️', 'Mapas'], ['battle', '⚔️', 'Batalha'], ['more', '☰', 'Mais']];
    const V = { ...XV, safari: vSafari, raid: vRaid, legends: vLegends, arena: vArena, house: vHouse, style: vStyle, quests: vQuests, games: vGames, ach: vAch, daycare: vDaycare, home: vHome, team: vTeam, maps: vMaps, battle: vBattle, more: vMore, shop: vShop, center: vCenter, bag: vBag, dex: vDex, card: vCard, saves: vSaves, settings: vSettings, explore: vExplore };
    ensureQuests(); const nbadge = questClaimable() + dexClaimable();
    const on = k => tab === k || (k === 'more' && MORE_TABS.includes(tab)) || (k === 'maps' && tab === 'explore');
    app.innerHTML = `<header class="top"><div class="brand" data-a="tab" data-t="home"><img src="img/items/poke-ball.png" alt=""><b>Pokémon <i>Lake</i></b></div>
      <div class="topr"><span class="chip money">${fmt(S.money)}</span><span class="chip hide-xs">${PERIOD_PT[period()]}</span></div></header>
      <nav class="nav">${nav.map(([k, i, l]) => `<button class="${on(k) ? 'on' : ''}" data-a="tab" data-t="${k}"><span>${i}</span><small>${l}</small>${k === 'more' && nbadge ? `<i class="ndot">${nbadge}</i>` : ''}</button>`).join('')}</nav>
      <section class="screen s-${tab}">${MORE_TABS.includes(tab) ? `<button class="btn small ghost backbtn" data-a="tab" data-t="more">← Mais</button>` : ''}${V[tab]()}</section>`;
    document.body.dataset.period = period(); if (!B) MUS.want(mapTheme());
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a; SFX.click(); actx();
    const fn = ACT[a]; if (fn) { e.preventDefault(); fn(b.dataset, b); }
  });
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
  function startUser(u) { user = u; sessionStorage.setItem(SESSION_KEY, u); S = PS.read(u); sessionStart = Date.now(); if (!S.trainer) onboarding(); else { retroRewards(); try { retroNatures(); } catch (e) {} checkDaily(); try { ensureQuests(); checkAch(); } catch (e) {} repairMoves(); try { daycareTick(); setTimeout(checkEggs, 1500); } catch (e) {} go('home'); } }
  function retroBand() { if (S.champion && S.bag['mega-bracelet'] && !S.bag['dynamax-band']) { S.bag['dynamax-band'] = 1; save(); setTimeout(() => modal(`<div class="center badgewin"><div class="bigbadge megab"><img src="img/items/dynamax-band.png" alt=""></div><h2>Pulseira Dinamax!</h2><p>Como Campeão, você também recebeu a <b>Pulseira Dinamax</b>. Uma vez por batalha, toque em <b>⬣ Dinamax</b> no menu de golpes: o Pokémon fica gigante por 3 turnos, com o dobro de HP e Golpes Max!</p><p class="mut small">Charizard, Venusaur, Blastoise, Pikachu, Eevee, Snorlax e outros viram <b>Gigantamax</b> com golpes G-Max exclusivos. Não dá para usar Mega e Dinamax na mesma batalha.</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`), 1400); } }
  function retroRewards() { retroBand(); if (S.champion && !S.bag['mega-bracelet']) { S.bag['mega-bracelet'] = 1; save(); setTimeout(() => modal(`<div class="center badgewin"><div class="bigbadge megab"><img src="img/items/mega-bracelet.png" alt=""></div><h2>Mega Pulseira!</h2><p>Como Campeão de Kanto, você recebeu a <b>Mega Pulseira</b>. Faça um Pokémon segurar a Mega Pedra certa e toque em <b>🧬 Mega Evoluir</b> no menu de golpes!</p><p class="mut small">Mega Pedras: achados raros nos mapas, prêmios de Ginásios/Elite e loja de Pontos da Torre de Batalha. Johto também foi liberado!</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`), 900); } }
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
  const DAILY = [{ money: 1000, 'poke-ball': 5 }, { money: 1500, 'great-ball': 3 }, { money: 2000, 'super-potion': 3 }, { money: 2500, 'ultra-ball': 3 }, { money: 3000, 'rare-candy': 1 }, { money: 4000, 'ultra-ball': 5, 'rare-candy': 2 }, { money: 10000, 'master-ball': 1, 'rare-candy': 3, 'wishing-piece': 1 }];
  const dailyText = r => Object.entries(r).map(([k, v]) => k === 'money' ? fmt(v) : `${v}x ${C.ITEM_NAME[k]}`).join(' + ');
  const streakHtml = () => `<div class="streak">${DAILY.map((x, i) => `<span class="${i < ((S.daily.streak - 1) % 7) + 1 ? 'on' : ''}">${i === 6 ? '🎁' : i + 1}</span>`).join('')}</div>`;
  function checkDaily() {
    const today = new Date().toDateString(); if (S.daily.last === today) return;
    const y = new Date(Date.now() - 864e5).toDateString(); S.daily.streak = S.daily.last === y ? S.daily.streak + 1 : 1; S.daily.last = today;
    const r = DAILY[(S.daily.streak - 1) % 7]; giveReward(r); save();
    setTimeout(() => { SFX.coin(); modal(`<div class="daily center"><div class="gift">🎁</div><h3>Recompensa diária — dia ${S.daily.streak}</h3><p><b>${dailyText(r)}</b></p>${calendarHtml()}<p class="mut small">Volte todo dia para manter a sequência!</p><button class="btn primary wide" data-a="close">Pegar!</button></div>`); render(); }, 400);
  }
  function giveReward(r) { for (const [k, v] of Object.entries(r)) { if (k === 'money') S.money += v; else S.bag[k] = (S.bag[k] || 0) + v; } }

  // ---------- telas ----------
  const badgeHtml = (i, on) => `<span class="badge ${on ? 'on' : ''}" style="--bc:${C.BADGE_COLOR[i]}" title="Insígnia ${C.BADGES[i]}"></span>`;
  function nextGoal() {
    const nb = S.badges.length; if (nb < 8) { const g = C.GYMS[nb]; return { t: `Desafie ${g.leader}`, d: `Líder de ${g.city} • tipo ${C.TYPE_PT[g.type]} • nível ~${Math.max(...g.team.map(x => x[1]))}`, img: `img/tr/${g.sprite}.png`, t2: 'battle' }; }
    if (!S.champion) return { t: 'Liga Pokémon', d: 'Enfrente a Elite Four e o Campeão!', img: 'img/tr/lance.png', t2: 'battle' };
    const jb = S.jbadges.length; if (!FEAT.johto) { if (!(S.nat && S.nat.wins)) return { t: "Desafio Final: Nat", d: "A treinadora secreta das Eeveelutions espera por você.", img: "img/tr/nat.png", t2: "battle" }; return { t: "Mestre Eevee!", d: "Você venceu a Nat. Junte Mega Pedras e encare revanches mais fortes.", img: "img/tr/nat.png", t2: "battle" }; } else if (jb < 8) { const g = C.JGYMS[jb]; return { t: `Johto: desafie ${g.leader}`, d: `Líder de ${g.city} • tipo ${C.TYPE_PT[g.type]} • nível ~${Math.max(...g.team.map(x => x[1]))}`, img: `img/tr/${g.sprite}.png`, t2: 'battle', reg: 'johto' }; }
    if (!S.jchampion) return { t: 'Liga de Johto', d: 'Will, Koga, Bruno, Karen e o Campeão Lance!', img: 'img/tr/lance.png', t2: 'battle', reg: 'johto' };
    return { t: 'Campeão de Kanto e Johto!', d: 'Suba o Monte Prata, complete a Pokédex e junte Mega Pedras.', img: 'img/tr/red.png', t2: 'maps', reg: 'johto' };
  }
  const dexCount = () => [Object.keys(S.dex.seen).length, Object.keys(S.dex.caught).length];
  function trainerCard(big) {
    const [se, ca] = dexCount(); const h = Math.floor(S.stats.playMs / 36e5), mi = Math.floor(S.stats.playMs / 6e4) % 60;
    return `<div class="tcard ${big ? 'big' : ''}"><div class="tcl ${auraOf() ? 'au-' + auraOf() : ''} ${poseCls()}">${trImg()}</div><div class="tcr"><small>CARTÃO DE TREINADOR</small>${titleOf() ? `<span class="ttitle">🏆 ${titleOf()}</span>` : S.nat && S.nat.wins ? '<span class="ttitle">🌈 Mestre Eevee</span>' : ''}<h2>${esc(S.trainer)}${S.champion ? ' 👑' : ''}</h2>
      <div class="badges">${C.BADGES.map((_, i) => badgeHtml(i, S.badges.includes(i))).join('')}</div>${S.nat && S.nat.wins ? '<span class="badge natb on" title="Insígnia Nat">🌈</span>' : ''}${S.champion && FEAT.johto ? `<div class="badges j">${C.JBADGES.map((_, i) => jbadgeHtml(i, S.jbadges.includes(i))).join('')}</div>` : ''}
      <div class="tstats"><span><b>${ca}</b> capturados</span><span><b>${se}</b> vistos</span><span><b>${Object.keys(S.dex.shiny).length}</b> ✨</span>${big ? `<span><b>${S.stats.wins}</b> vitórias</span><span><b>${h}h${String(mi).padStart(2, '0')}</b> jogadas</span><span><b>${S.tower.best}</b> torre</span>` : ''}</div></div></div>`;
  }
  function partyMini() { return `<div class="pmini">${S.party.map((m, i) => `<button class="pm" data-a="mon" data-i="${i}" data-w="p"><img src="${spr(m)}" alt=""><small>Nv ${m.lvl}</small><i style="width:${hpPct(m)}%;background:${hpCol(hpPct(m))}"></i></button>`).join('')}</div>`; }
  function vHome() {
    const g = nextGoal(); const lm = C.MAPS.find(m => m.id === S.lastMap) || C.MAPS[0]; const w = weatherOf(lm);
    const hurt = S.party.some(m => m.hp < PE.maxhp(m) || m.status);
    return `<div class="grid">
      <div class="card span2 hero">${trainerCard()}</div>
      ${homeExtra()}${natCard()}
      <button class="card goal" data-a="tab" data-t="${g.t2}"><img src="${g.img}" alt=""><div><small>PRÓXIMO OBJETIVO</small><h3>${g.t}</h3><p class="mut">${g.d}</p></div><span class="arrow">›</span></button>
      <div class="card"><div class="row between"><h3>Seu time</h3><button class="btn small" data-a="tab" data-t="team">Ver tudo</button></div>${partyMini()}
        ${hurt ? `<button class="btn wide heal" data-a="tab" data-t="center">❤️ Curar no Centro Pokémon</button>` : ''}</div>
      <button class="card scene-card theme-${lm.theme} per-${period()}" data-a="enter" data-id="${lm.id}"><div class="sc-mons">${lm.enc.filter(e => !e[4]?.legend).slice(0, 3).map(e => `<img src="${sprId(e[0])}" class="${S.dex.seen[e[0]] ? '' : 'sil'}" alt="">`).join('')}</div><div class="sc-over"><small>CONTINUAR EXPLORANDO</small><h3>${lm.emoji} ${lm.name}</h3><p>${WEATHER[w][1]} ${WEATHER[w][0]} • ${PERIOD_PT[period()]}</p></div></button>
      <div class="card quick"><button class="qb" data-a="tab" data-t="shop">🛒<small>Loja</small></button><button class="qb" data-a="tab" data-t="dex">📕<small>Pokédex</small></button><button class="qb" data-a="tab" data-t="bag">🎒<small>Mochila</small></button><button class="qb" data-a="tab" data-t="card">🪪<small>Perfil</small></button></div>
      <div class="card"><h3>Sequência diária 🔥 ${S.daily.streak} dia(s)</h3>${calendarHtml()}<p class="mut small">Amanhã: ${dailyText(DAILY[S.daily.streak % 7])}</p></div>
    </div>`;
  }
  function monCard(m, i, where) {
    const p = hpPct(m), d = D.mons[m.id];
    return `<button class="mcard ${m.hp <= 0 ? 'fainted' : ''}" data-a="mon" data-i="${i}" data-w="${where}" style="--tc:${C.TYPE_COLOR[d.t[0]]}">
      <div class="msp">${m.shiny ? '<span class="shinytag">★</span>' : ''}${m.item ? `<span class="helditem" title="${C.ITEM_NAME[m.item] || ''}">${itemImg(m.item)}</span>` : ''}<img src="${spr(m)}" alt="" loading="lazy"></div>
      <div class="minfo"><div class="row between"><b>${esc(pn(m))}</b><small>Nv ${m.lvl}</small></div><div class="types">${d.t.map(typeChip).join('')}${stChip(m.status)}</div>
      <div class="hpbar"><i style="width:${p}%;background:${hpCol(p)}"></i></div><small class="mut">${m.hp}/${PE.maxhp(m)} HP</small></div></button>`;
  }
  function vTeam() {
    return `<div class="grid"><div class="card span2"><div class="row between"><h3>Time (${S.party.length}/6)</h3><span class="mut small">Toque para detalhes</span></div><div class="mgrid">${S.party.map((m, i) => monCard(m, i, 'p')).join('')}</div></div>
      ${S.eggs.length ? `<div class="card"><h3>🥚 Ovos (${S.eggs.length})</h3><div class="eggs">${S.eggs.map(eggCard).join('')}</div><p class="mut small">Ovos chocam ao explorar (cada busca = passos) ou com o tempo.</p></div>` : ''}
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
      <div class="stats">${s.map((v, k) => `<div><small class="${PE.natMul(m, k) > 1 ? 'nup' : PE.natMul(m, k) < 1 ? 'ndn' : ''}">${SN[k]}</small><div class="sbar"><i style="width:${Math.min(100, d.s[k] / 1.6)}%"></i></div><b>${v}</b></div>`).join('')}</div>
      <p class="small natl">🧬 Natureza: <b>${natTxt(m)}</b> <button class="btn small ghost" data-k="judge">⚖️ Avaliação</button></p><p class="small abil">✨ Habilidade: <b>${abName(d.ab)}</b> <span class="mut">${D.abils && D.abils[d.ab] ? D.abils[d.ab].d : ''}</span></p>
      <p class="small">🎒 Segurando: <b>${m.item ? C.ITEM_NAME[m.item] || m.item : 'nada'}</b>${megaHint(m)}</p>
      <h4>Golpes</h4><div class="moves">${m.moves.map(x => { const mv = D.moves[x.n]; return `<div class="mv" style="--tc:${C.TYPE_COLOR[mv.t]}"><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.c === 't' ? 'Status' : mv.c === 'p' ? 'Físico' : 'Especial'}${mv.p ? ' • Poder ' + mv.p : ''} • PP ${x.pp}/${mv.pp}</small>${mv.ds ? `<small class="mds">${mv.ds}</small>` : ''}</div>`; }).join('')}</div>
      ${evo ? `<p class="mut small">Evolui para: ${evo}</p>` : ''}<p class="mut small">Treinador original: ${esc(m.ot || '-')} • ${esc(m.caughtAt || '')}</p>
      <div class="mbtns wrap">${w === 'p' ? `${i > 0 ? `<button class="btn small" data-k="lead">⭐ Líder</button>` : ''}${S.party.length > 1 ? `<button class="btn small" data-k="tobox">💻 Mandar p/ PC</button>` : ''}` : `<button class="btn small" ${S.party.length >= 6 ? 'disabled' : ''} data-k="toparty">➕ Pôr no time</button><button class="btn small danger" data-k="release">Soltar</button>`}
      <button class="btn small" data-k="nick">✏️ Apelido</button><button class="btn small primary" data-k="item">🎒 Usar item</button><button class="btn small" data-k="hold">💎 ${m.item ? 'Trocar/tirar item' : 'Segurar item'}</button>${m.id === 384 && !m.moves.some(x => x.n === 'dragon-ascent') ? '<button class="btn small primary" data-k="tutor">🐉 Ensinar Ascensão do Dragão</button>' : ''}</div></div>`, 'wide');
    $$('[data-k]', mm).forEach(b => b.onclick = async () => { SFX.click(); const k = b.dataset.k; if (k === 'judge') return judge(m);
      i = list.indexOf(m); if (i < 0) { closeModal(); render(); return; } // índice sempre atual (nunca mexe no Pokémon errado)
      if (k === 'lead') S.party.unshift(S.party.splice(i, 1)[0]);
      if (k === 'tobox') S.box.push(S.party.splice(i, 1)[0]);
      if (k === 'toparty') S.party.push(S.box.splice(i, 1)[0]);
      if (k === 'release') { if (w !== 'b') return; if (!(await ask('Soltar?', `Soltar ${esc(pn(m))} na natureza? Isso não pode ser desfeito.`, [{ t: 'Cancelar', v: 0 }, { t: 'Soltar', cls: 'danger', v: 1 }]))) return monDetail(w, i); const j = S.box.indexOf(m); if (j >= 0) S.box.splice(j, 1); }
      if (k === 'nick') { const n = prompt('Apelido (vazio para remover):', m.nick || ''); if (n !== null) m.nick = n.trim().slice(0, 12) || null; }
      if (k === 'item') return pickItemFor(m);
      if (k === 'hold') return pickHold(m, w, i);
      if (k === 'tutor') { closeModal(); await learnMove(m, 'dragon-ascent'); save(); return monDetail(w, i); }
      save(); closeModal(); render(); });
  }
  function megaHint(m) { const fs = D.mons[m.id].mg; if (!fs) return ''; return ' <span class="mut">• Mega: ' + fs.map(f => { const g = D.megas[f]; return `${g.n} (${g.st ? C.ITEM_NAME[g.st] : 'golpe Ascensão do Dragão'})`; }).join(', ') + '</span>'; }
  const HOLDABLE = k => !!(C.MEGA_STONES[k]);
  function pickHold(m, w, i) {
    const list = Object.entries(S.bag).filter(([k, v]) => v > 0 && HOLDABLE(k));
    const mm = modal(`<h3>${esc(pn(m))} vai segurar...</h3>${list.length ? `<div class="ilist">${list.map(([k, v]) => `<button class="irow" data-h="${k}">${itemImg(k)}<b>${C.ITEM_NAME[k]}</b><small>x${v}</small></button>`).join('')}</div>` : '<p class="mut">Você não tem Mega Pedras. Procure nos mapas, vença Líderes/Elite ou troque Pontos na Torre de Batalha.</p>'}
      <div class="mbtns">${m.item ? '<button class="btn" data-h="__none">Tirar item</button>' : ''}<button class="btn" data-a="close">Fechar</button></div>`);
    $$('[data-h]', mm).forEach(b => b.onclick = () => { const k = b.dataset.h; if (m.item) S.bag[m.item] = (S.bag[m.item] || 0) + 1; m.item = null;
      if (k !== '__none') { S.bag[k]--; m.item = k; toast(`${esc(pn(m))} está segurando ${C.ITEM_NAME[k]}.`, 'good'); }
      save(); closeModal(); monDetail(w, i); });
  }
  function pickItemFor(m) {
    const usable = Object.entries(S.bag).filter(([k, v]) => v > 0 && !PE.BALLS[k] && C.ITEM_NAME[k] && !HOLDABLE(k) && k !== 'mega-bracelet' && k !== 'dynamax-band');
    const mm = modal(`<h3>Usar item em ${esc(pn(m))}</h3>${usable.length ? `<div class="ilist">${usable.map(([k, v]) => `<button class="irow" data-it="${k}">${itemImg(k)}<b>${C.ITEM_NAME[k]}</b><small>x${v}</small></button>`).join('')}</div>` : '<p class="mut">Nenhum item utilizável. Compre na Loja!</p>'}<div class="mbtns"><button class="btn" data-a="close">Fechar</button></div>`);
    $$('[data-it]', mm).forEach(b => b.onclick = () => useBagItem(b.dataset.it, m));
  }
  async function useBagItem(it, m) {
    closeModal(); const mh = PE.maxhp(m);
    if (it.endsWith('-stone') || PE.stoneEvo(m, it) || ['kings-rock', 'metal-coat', 'dragon-scale', 'up-grade'].includes(it)) { const to = PE.stoneEvo(m, it); if (!to) return toast('Não teria efeito.'); S.bag[it]--; await evolveAnim(m, to, true); }
    else if (it === 'rare-candy') { if (m.lvl >= 100) return toast('Já está no nível máximo.'); S.bag[it]--; const ups = PE.addXP(m, PE.xpFor(D.mons[m.id].g, m.lvl + 1) - m.xp); SFX.lvl(); toast(`⬆️ ${esc(pn(m))} subiu para o nível ${m.lvl}!`, 'good'); await afterLevel(m, ups); }
    else if (it === 'revive') { if (m.hp > 0) return toast('Não teria efeito.'); S.bag[it]--; m.hp = Math.floor(mh / 2); SFX.heal(); toast(`${esc(pn(m))} foi reanimado!`, 'good'); }
    else if (PE.HEAL[it]) { if (m.hp <= 0 || (m.hp >= mh && !(it === 'full-restore' && m.status))) return toast('Não teria efeito.'); S.bag[it]--; m.hp = Math.min(mh, m.hp + PE.HEAL[it]); if (it === 'full-restore') m.status = null; SFX.heal(); toast(`${esc(pn(m))} recuperou HP!`, 'good'); }
    else if (it === 'antidote' || it === 'full-heal') { if (!m.status || (it === 'antidote' && !['psn', 'tox'].includes(m.status))) return toast('Não teria efeito.'); S.bag[it]--; m.status = null; SFX.heal(); toast('Curado!', 'good'); }
    save(); render();
  }
  async function afterLevel(m, ups) { for (const u of ups) for (const n of u.learn) await learnMove(m, n); const to = PE.levelEvo(m, tod()); if (to) await evolveAnim(m, to); save(); render(); }
  async function learnMove(m, n) {
    const mv = D.moves[n]; if (!mv || m.moves.some(x => x.n === n)) return;
    if (m.moves.length < 4) { m.moves.push({ n, pp: mv.pp }); toast(`${esc(pn(m))} aprendeu <b>${mv.n}</b>!`, 'good'); if (B) { log(`${esc(pn(m))} aprendeu <b>${mv.n}</b>!`); await wait(900); } return; }
    const opts = m.moves.map((x, i) => ({ t: `Esquecer ${D.moves[x.n].n}`, v: i })).concat([{ t: `Não aprender`, cls: 'ghost', v: -1 }]);
    const r = await ask(`${esc(pn(m))} quer aprender ${mv.n}!`, `<div class="mv" style="--tc:${C.TYPE_COLOR[mv.t]}"><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.p ? 'Poder ' + mv.p : 'Status'} • Precisão ${mv.a || '—'} • PP ${mv.pp}</small>${mv.ds ? `<small class="mds">${mv.ds}</small>` : ''}</div><p>Mas já conhece 4 golpes. Qual esquecer?</p>`, opts);
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
  const unlocked = mp => mp.req === 'champion' ? S.champion : mp.req === 'jchampion' ? S.jchampion : typeof mp.req === 'object' ? (S.champion && S.jbadges.length >= mp.req.j) : S.badges.length >= mp.req;
  const lockText = mp => mp.req === 'champion' ? '🔒 Torne-se Campeão' : mp.req === 'jchampion' ? '🔒 Torne-se Campeão de Johto' : typeof mp.req === 'object' ? (S.champion ? `🔒 Precisa de ${mp.req.j} insígnia(s) de Johto` : '🔒 Vire Campeão de Kanto para ir a Johto') : `🔒 Precisa de ${mp.req} insígnia(s)`;
  const regionSeg = () => `<div class="seg region">${[['kanto', 'Kanto'], ['johto', isJohtoOpen() ? 'Johto' : FEAT.johto ? '🔒 Johto' : '🔒 Johto (em breve)']].map(([k, l]) => `<button class="${(S.region || 'kanto') === k ? 'on' : ''}" data-a="region" data-k="${k}">${l}</button>`).join('')}</div>`;
  ACT.region = d => { if (d.k === 'johto' && !FEAT.johto) return toast('Johto chega na próxima atualização!'); if (d.k === 'johto' && !isJohtoOpen()) return toast('🔒 Johto abre quando você virar Campeão da Liga de Kanto!'); S.region = d.k; save(); render(); };
  function vMaps() {
    const rg = S.region || 'kanto';
    return `<div class="card"><div class="row between wrap"><h3>🗺️ Mapas</h3>${regionSeg()}</div><p class="mut small">${PERIOD_PT[period()]} agora. O horário e o clima mudam quais Pokémon aparecem!${rg === 'johto' ? ' Em Johto os três cães lendários vagam por várias rotas.' : ''}</p></div>
      ${rg === 'johto' && isJohtoOpen() && !S.elmGift ? `<button class="card goal elm" data-a="elm"><img src="img/tr/elm.png" alt=""><div><small>LABORATÓRIO DE NEW BARK</small><h3>Visite o Prof. Elm</h3><p class="mut">Ele tem um Pokémon inicial de Johto e um Ovo misterioso para você!</p></div><span class="arrow">›</span></button>` : ''}
      <div class="grid maps">${C.MAPS.filter(mp => mp.region === rg).map(mp => { const ok = unlocked(mp), w = weatherOf(mp);
      const seen = mp.enc.filter(e => !e[4]?.legend).map(e => e[0]); return `<button class="card mapc theme-${mp.theme} per-${period()} ${ok ? '' : 'locked'}" data-a="enter" data-id="${mp.id}">
      <div class="mapimg"><span class="memo">${mp.emoji}</span><span class="mw">${WEATHER[w][1]}</span><div class="mmons">${seen.slice(0, 4).map(id => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" loading="lazy" alt="">`).join('')}</div></div>
      <div class="mapinfo"><div class="row between"><b>${mp.name}</b><small class="lv">Nv ${mp.lv[0]}–${mp.lv[1]}</small></div><small class="mut">${ok ? mp.desc : lockText(mp)}</small></div></button>`; }).join('')}</div>`;
  }
  ACT.enter = d => { const mp = C.MAPS.find(m => m.id === d.id); if (!unlocked(mp)) return toast('🔒 Área bloqueada ainda.'); S.lastMap = mp.id; go('explore', mp.id); };
  function encWeights(mp, w) {
    const per = period();
    return mp.enc.map(e => { const [id, wt, , , o = {}] = e; let x = wt; const t = D.mons[id].t;
      if (o.night) x *= per === 'night' ? 3 : per === 'dusk' ? 1.5 : 0.25; if (o.day) x *= per === 'night' ? 0.15 : 1.4;
      if (per === 'night' && (t.includes('ghost') || t.includes('dark'))) x *= 1.8; if (per === 'day' && t.includes('bug')) x *= 1.3;
      if ((w === 'rain' || w === 'storm') && t.includes('water')) x *= 2; if (w === 'storm' && t.includes('electric')) x *= 2.5;
      if (w === 'sun' && (t.includes('fire') || t.includes('grass'))) x *= 2; if (w === 'fog' && (t.includes('ghost') || t.includes('psychic'))) x *= 2; if (w === 'snow' && t.includes('ice')) x *= 2;
      if (o.legend && S.dex.caught[id]) x *= 0.3; return x; });
  }
  function vExplore() {
    const mp = C.MAPS.find(m => m.id === sub) || C.MAPS[0], w = weatherOf(mp), ws = encWeights(mp, w), tot = ws.reduce((a, b) => a + b, 0);
    const tr = mp.trainers || [];
    return `<div class="grid"><div class="card span2 explore theme-${mp.theme} w-${w} per-${period()}" id="scene"><div class="sky"><i class="sun"></i></div><div class="wx"></div><div class="ground"></div>
      <div class="grass-row">${'<i></i>'.repeat(12)}</div>${meHtml()}${followerHtml()}<div class="alertmark">!</div>
      <div class="ex-top"><button class="btn small ghost" data-a="tab" data-t="maps">← Mapas</button><span class="chip">${WEATHER[w][1]} ${WEATHER[w][0]}</span><span class="chip">${PERIOD_PT[period()]}</span></div>
      <div class="ex-bot"><h2>${mp.emoji} ${mp.name}</h2><p>${mp.desc}</p><div class="exbtns"><button class="btn primary big" data-a="search" id="searchBtn">🔍 Procurar Pokémon</button>${isWater(mp) ? '<button class="btn big fishbtn" data-a="fish" id="fishBtn0">🎣 Pescar</button>' : ''}${mp.id === 'safari' ? '<button class="btn big sfbtn" data-a="tab" data-t="safari">🦏 Jogo do Safári</button>' : ''}${legendHunts(mp).map(([q, sp]) => `<button class="btn big legbtn" data-a="leghunt" data-q="${q.id}">${sp.btn}</button>`).join('')}</div></div></div>
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
    S.stats.steps += steps; track('steps', steps); sc.classList.remove('walking');
    const w = weatherOf(mp), ws = encWeights(mp, w), tot = ws.reduce((a, b) => a + b, 0); let r = R() * tot, k = 0; while (k < ws.length - 1 && r > ws[k]) r -= ws[k++];
    const e = mp.enc[k]; const lvl = PE.ri(st, e[2], e[3]);
    eggSteps(steps); setTimeout(checkEggs, 2500);
    if (mp.finds && R() < (A.findRate || 0.035)) { const f = pickFind(mp); if (f) { searching = false; $('#searchBtn').disabled = false; S.bag[f] = (S.bag[f] || 0) + 1; save(); SFX.caught();
      modal(`<div class="center badgewin"><div class="bigbadge megab"><img src="img/items/${f}.png" alt=""></div><h2>Você encontrou algo brilhando!</h2><p>Achou <b>${C.ITEM_NAME[f]}</b> escondida em ${mp.name}!</p><p class="mut small">Faça o Pokémon certo segurar para Mega Evoluir.</p><button class="btn primary wide" data-a="close">Uau!</button></div>`); return render(); } }
    const evs = eventSpawn(mp); const m = PE.makeMon(evs ? evs.id : e[0], lvl, st, { shinyRate: A.shinyRate || (evs ? evs.rate : shinyP()), shiny: !evs && e[4] && e[4].shiny ? true : undefined }); m.caughtAt = mp.name; if (evs) m.evt = 1;
    sc.classList.add('alert'); tone(1200, 0.1); await sleep(600); searching = false;
    startBattle({ kind: 'wild', enemy: [m], map: mp, weather: battleWeather(w), legend: !evs && !!e[4]?.legend });
  };
  const owns = k => (S.bag[k] || 0) > 0 || [...S.party, ...S.box].some(m => m.item === k);
  function pickFind(mp) { const fs = mp.finds.filter(([k]) => !owns(k)); if (!fs.length) return null; const tot = fs.reduce((a, f) => a + f[1], 0); let r = R() * tot; for (const f of fs) { if ((r -= f[1]) <= 0) return f[0]; } return fs[0][0]; }
  ACT.trainer = d => { const mp = C.MAPS.find(m => m.id === d.m), t = mp.trainers[+d.i]; const k = mp.id + ':' + d.i; const rem = S.trainersBeaten[k] ? 1.15 : 1;
    startBattle({ kind: 'trainer', name: t[0], sprite: t[1], enemy: t[2].map(([id, l]) => PE.makeMon(id, Math.round(l * rem), st, { shiny: false })), prize: t[3], key: k, map: mp, ai: t[0] === 'Red' ? 2 : 1, dyna: t[0] === 'Red', weather: battleWeather(weatherOf(mp)), intro: mp.name }); };

  // ---------- batalha (menu) ----------
  function vBattle() {
    const nb = S.badges.length;
    if ((S.region || 'kanto') === 'johto' && isJohtoOpen()) return vBattleJ();
    return `<div class="grid"><div class="card span2"><div class="row between wrap"><h3>🏟️ Ginásios de Kanto</h3>${regionSeg()}</div><p class="mut small">Vença os 8 Líderes em ordem para enfrentar a Liga.</p><div class="gyms">${C.GYMS.map((g, i) => { const won = S.badges.includes(i), ok = i <= nb;
      return `<div class="gym ${won ? 'won' : ''} ${ok ? '' : 'locked'}" style="--tc:${C.TYPE_COLOR[g.type]}"><img class="gl" src="img/tr/${g.sprite}.png" alt=""><div class="gi grow"><small>${g.city} • ${C.TYPE_PT[g.type]}</small><b>${g.leader}</b><div class="row">${badgeHtml(i, won)}<small>Insígnia ${C.BADGES[i]}</small></div><div class="gteam">${g.team.map(([id, l]) => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" title="Nv ${l}" alt="">`).join('')}</div></div>
        <button class="btn small ${won ? '' : 'primary'}" ${ok ? '' : 'disabled'} data-a="gym" data-i="${i}">${won ? 'Revanche' : ok ? 'Desafiar' : '🔒'}</button></div>`; }).join('')}</div></div>
      <div class="card league"><h3>🏆 Liga Pokémon</h3><p class="mut small">Elite Four + Campeão em sequência. Se perder, recomeça do início.</p><div class="elite">${C.ELITE.map((e, i) => `<div class="el ${S.elite > i ? 'won' : ''} ${S.elite === i && nb >= 8 ? 'next' : ''}"><img src="img/tr/${e.sprite}.png" alt=""><small>${e.leader}</small></div>`).join('')}</div>
        <button class="btn primary wide" ${nb >= 8 ? '' : 'disabled'} data-a="league">${nb >= 8 ? (S.elite ? `Continuar: ${C.ELITE[S.elite].leader}` : 'Entrar na Liga') : '🔒 Precisa das 8 insígnias'}</button>${S.champs ? `<p class="small">👑 Campeão ${S.champs}x</p>` : ''}</div>
      ${natCard()}
      <div class="card tower"><h3>🗼 Torre de Batalha</h3><p class="mut small">Desafio sem fim contra treinadores com times aleatórios no nível do seu time. Bala Rara a cada 5 vitórias seguidas! Cada vitória dá Pontos de Batalha (PB) para trocar por Mega Pedras.</p><p>Sequência: <b>${S.tower.cur}</b> • Recorde: <b>${S.tower.best}</b> • <b>${S.bp} PB</b></p>
        <button class="btn primary wide" ${nb >= 4 ? '' : 'disabled'} data-a="tower">${nb >= 4 ? 'Próxima batalha' : '🔒 Precisa de 4 insígnias'}</button><button class="btn wide" data-a="bpshop">💎 Loja de Pontos (Mega Pedras)</button></div>
      <div class="card soon"><h3>🌐 Em breve</h3><p class="mut small">Batalhas ao vivo entre amigos, trocas e chat. O motor de batalha já foi feito pensando nisso.</p></div></div>`;
  }
  const mkTeam = (team, mul, iv) => team.map(([id, l, o]) => { const m = PE.makeMon(id, Math.min(100, Math.round(l * mul)), st, { shiny: false, iv: Array(6).fill(iv), nat: bestNat(id) }); if (o && o.item) m.item = o.item; return m; });
  function vBattleJ() {
    const nb = S.jbadges.length;
    return `<div class="grid"><div class="card span2"><div class="row between wrap"><h3>🏟️ Ginásios de Johto</h3>${regionSeg()}</div><p class="mut small">Pós-jogo de Kanto: times no estilo HeartGold/SoulSilver com níveis turbinados. Cada vitória inédita dá uma Mega Pedra!</p><div class="gyms">${C.JGYMS.map((g, i) => { const won = S.jbadges.includes(i), ok = i <= nb;
      return `<div class="gym ${won ? 'won' : ''} ${ok ? '' : 'locked'}" style="--tc:${C.TYPE_COLOR[g.type]}"><img class="gl" src="img/tr/${g.sprite}.png" alt=""><div class="gi grow"><small>${g.city} • ${C.TYPE_PT[g.type]}</small><b>${g.leader}</b><div class="row">${jbadgeHtml(i, won)}<small>Insígnia ${C.JBADGES[i]}</small></div><div class="gteam">${g.team.map(([id, l]) => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" title="Nv ${l}" alt="">`).join('')}</div></div>
        <button class="btn small ${won ? '' : 'primary'}" ${ok ? '' : 'disabled'} data-a="jgym" data-i="${i}">${won ? 'Revanche' : ok ? 'Desafiar' : '🔒'}</button></div>`; }).join('')}</div></div>
      <div class="card league"><h3>🏆 Liga de Johto</h3><p class="mut small">Will, Koga, Bruno, Karen e o Campeão Lance. Alguns usam Mega Evolução!</p><div class="elite">${C.JELITE.map((e, i) => `<div class="el ${S.jelite > i ? 'won' : ''} ${S.jelite === i && nb >= 8 ? 'next' : ''}"><img src="img/tr/${e.sprite}.png" alt=""><small>${e.leader}</small></div>`).join('')}</div>
        <button class="btn primary wide" ${nb >= 8 ? '' : 'disabled'} data-a="jleague">${nb >= 8 ? (S.jelite ? `Continuar: ${C.JELITE[S.jelite].leader}` : 'Entrar na Liga de Johto') : '🔒 Precisa das 8 insígnias de Johto'}</button>${S.jchamps ? `<p class="small">👑 Campeão de Johto ${S.jchamps}x</p>` : ''}</div>
      <div class="card tower"><h3>🗼 Torre de Batalha</h3><p>Sequência: <b>${S.tower.cur}</b> • Recorde: <b>${S.tower.best}</b> • <b>${S.bp} PB</b></p><button class="btn primary wide" data-a="tower">Próxima batalha</button><button class="btn wide" data-a="bpshop">💎 Loja de Pontos (Mega Pedras)</button></div></div>`;
  }
  const jbadgeHtml = (i, on) => `<span class="badge ${on ? 'on' : ''}" style="--bc:${C.JBADGE_COLOR[i]}" title="Insígnia ${C.JBADGES[i]}"></span>`;
  ACT.jgym = d => { const i = +d.i, g = C.JGYMS[i]; startBattle({ kind: 'trainer', jgym: i, name: 'Líder ' + g.leader, sprite: g.sprite, enemy: mkTeam(g.team, S.jbadges.includes(i) ? 1.1 : 1, 26), prize: g.prize, ai: 1, intro: `Ginásio de ${g.city}`, jbadge: i, reward: g.reward, rkey: 'jgym' + i }); };
  ACT.jleague = () => { const i = S.jelite || 0, e = C.JELITE[i]; startBattle({ kind: 'trainer', jelite: i, name: (i === 4 ? 'Campeão ' : '') + e.leader, sprite: e.sprite, enemy: mkTeam(e.team, S.jchampion ? 1.08 : 1, 30), prize: e.prize, ai: 1, intro: e.title, reward: e.reward, rkey: 'jelite' + i }); };
  ACT.bpshop = () => { const mm = modal(`<h3>💎 Loja de Pontos — ${S.bp} PB</h3><p class="mut small">Ganhe PB vencendo na Torre de Batalha (+1 por vitória, +3 a cada 5 seguidas).</p><div class="ilist">${C.BP_SHOP.map(x => `<button class="irow" data-bp="${x.id}" ${S.bp >= x.bp ? '' : 'disabled'}>${itemImg(x.id)}<b>${C.ITEM_NAME[x.id]}</b><small>${x.bp} PB${owns(x.id) ? ' • ✔' : ''}</small></button>`).join('')}</div><div class="mbtns"><button class="btn" data-a="close">Fechar</button></div>`, 'wide');
    $$('[data-bp]', mm).forEach(b => b.onclick = () => { const x = C.BP_SHOP.find(y => y.id === b.dataset.bp); if (S.bp < x.bp) return; S.bp -= x.bp; S.bag[x.id] = (S.bag[x.id] || 0) + 1; SFX.coin(); toast(`Trocou ${x.bp} PB por ${C.ITEM_NAME[x.id]}!`, 'good'); save(); closeModal(); ACT.bpshop(); }); };
  ACT.gym = d => { const i = +d.i, g = C.GYMS[i]; startBattle({ kind: 'trainer', gym: i, name: 'Líder ' + g.leader, sprite: g.sprite, enemy: mkTeam(g.team, S.badges.includes(i) ? 1.25 : 1, 24), prize: g.prize, ai: 1, intro: `Ginásio de ${g.city}`, badge: i, reward: C.KANTO_REWARD.gym[i], rkey: 'gym' + i }); };

  // ---------- Desafio Final: Nat ----------
  const NAT_POOL = [[134, ['surf', 'ice-beam', 'shadow-ball', 'wish']], [135, ['thunderbolt', 'shadow-ball', 'signal-beam', 'calm-mind']], [136, ['flare-blitz', 'superpower', 'fire-fang', 'quick-attack']],
    [196, ['psychic', 'dazzling-gleam', 'shadow-ball', 'calm-mind']], [197, ['foul-play', 'dark-pulse', 'moonlight', 'wish']], [470, ['leaf-blade', 'x-scissor', 'swords-dance', 'quick-attack']],
    [471, ['ice-beam', 'blizzard', 'shadow-ball', 'ice-shard']], [700, ['moonblast', 'hyper-voice', 'calm-mind', 'shadow-ball']]];
  const natUnlocked = () => !!S.champion;
  function natCard() { if (!natUnlocked()) return ''; const w = (S.nat && S.nat.wins) || 0;
    return `<button class="card natcard span2" data-a="nat"><img src="img/nat/nat-card.webp" alt="Nat"><div><small>DESAFIO FINAL</small><h3>Nat</h3><p>A treinadora lendária das Eeveelutions. 6 de 8 evoluções de Eevee, Nv ${w ? 80 : 77}+.</p>${w ? `<span class="chip">🌈 Vitórias: ${w}</span>` : '<span class="chip">Nunca derrotada</span>'}</div><span class="arrow">›</span></button>`; }
  function natTheme() { const N = [330, 392, 494, 587, 523, 440, 392, 659]; for (let k = 0; k < 2; k++) N.forEach((f, i) => { tone(f, 0.2, 'square', 0.045, k * 1.6 + i * 0.2); tone(f / 2, 0.2, 'triangle', 0.06, k * 1.6 + i * 0.2); }); noise(0.5, 0.1, 3.2); }
  ACT.nat = () => { if (!natUnlocked()) return toast('🔒 Derrote o Campeão de Kanto primeiro.'); const w = (S.nat && S.nat.wins) || 0, st = { seed: (R() * 2 ** 31) | 0 };
    const pool = [...NAT_POOL]; for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const enemy = pool.slice(0, 6).map(([id, mv]) => PE.makeMon(id, (w ? 80 : 77) + Math.floor(R() * 2), st, { iv: [31, 31, 31, 31, 31, 31], moves: mv.filter(n => D.moves[n]), shiny: false }));
    startBattle({ kind: 'trainer', nat: 1, name: 'Nat', sprite: 'nat', enemy, prize: 30000, ai: 2, intro: 'DESAFIO FINAL' }); };
  ACT.league = () => { const i = S.elite || 0, e = C.ELITE[i]; startBattle({ kind: 'trainer', elite: i, name: (i === 4 ? 'Campeão ' : '') + e.leader, sprite: e.sprite, enemy: mkTeam(e.team, S.champion ? 1.1 : 1, 28), prize: e.prize, ai: 1, intro: e.title, reward: C.KANTO_REWARD.elite[i], rkey: 'elite' + i }); };
  const TOWER_TR = [['acetrainer', 'Ás Bruno'], ['acetrainerf', 'Ás Carla'], ['blackbelt', 'Mestre Tadeu'], ['psychic', 'Vidente Íris'], ['beauty', 'Bela Lara'], ['scientist', 'Dr. Otto'], ['hiker', 'Alpinista Rui'], ['swimmer', 'Nadador Gabi']];
  ACT.tower = () => { const ids = Object.keys(D.mons).map(Number).filter(id => !D.mons[id].L && !(D.mons[id].e || []).length); const lv = Math.min(100, Math.max(...S.party.map(m => m.lvl)) + Math.floor(S.tower.cur / 3));
    const [sp, nm] = TOWER_TR[Math.floor(R() * TOWER_TR.length)];
    startBattle({ kind: 'trainer', tower: 1, name: nm, sprite: sp, enemy: [0, 1, 2].map(() => PE.makeMon(ids[Math.floor(R() * ids.length)], lv, st, { shiny: R() < 0.02 })), prize: 1000 + S.tower.cur * 200, ai: 1, intro: `Torre de Batalha — batalha ${S.tower.cur + 1}` }); };

  // ---------- Mais ----------
  function vMore() {
    const qc = questClaimable(), dc = dexClaimable(), gq = quizState();
    const it = [['quests', '📜', 'Missões', qc ? `🎁 ${qc} recompensa(s) para resgatar!` : 'Diárias e semanais'], ['games', '🎮', 'Mini-jogos', `Quem é esse Pokémon? (${QUIZ_ROUNDS - gq.n} hoje) • Pesca`], ['ach', '🏆', 'Conquistas', `${Object.keys(S.ach || {}).length}/${ACH.length} • títulos`], ['legends', '⭐', 'Lendas', 'Histórias, enigmas e lendários'], ['raid', '⬣', 'Raides Dinamax', `${raidsLeft()} raide(s) hoje • chefes gigantes`], ['arena', '🏟️', 'Torneio e Revanches', 'Torneio semanal • líderes mais fortes'], ['safari', '🦏', 'Zona Safári', 'Sem batalhas: iscas, pedras e raros'], ['house', '🏠', 'Minha Casa', 'Decore e exiba troféus'], ['style', '👕', 'Boutique', 'Cores, chapéus e auras'], ['shop', '🛒', 'Loja Pokémon', 'Bolas, poções, pedras'], ['center', '❤️', 'Centro Pokémon', 'Cura grátis do time'], ['bag', '🎒', 'Mochila', 'Seus itens'], ['dex', '📕', 'Pokédex', dc ? `🏅 ${dc} marco(s) para resgatar!` : 'Vistos, capturados e marcos'],
      ...moreExtra(), ['daycare', '🏡', 'Creche Pokémon', `Deixe 2 Pokémon, ganhe XP e ovos${S.eggs.length ? ' • ' + S.eggs.length + ' ovo(s)' : ''}`], ['card', '🪪', 'Cartão de Treinador', 'Perfil e insígnias'], ['saves', '💾', 'Salvar / Backup', 'Exportar e importar save'], ['settings', '⚙️', 'Configurações', 'Som e velocidade']];
    return `<div class="grid">${it.map(([k, i, t, dsc]) => `<button class="card morec ${(k === 'quests' && qc) || (k === 'dex' && dc) ? 'hasrw' : ''}" data-a="tab" data-t="${k}"><span class="mi">${i}</span><div><b>${t}</b><small class="mut">${dsc}</small></div></button>`).join('')}<button class="card morec" data-a="logout"><span class="mi">🚪</span><div><b>Trocar de conta</b><small class="mut">Sair de ${esc(S.trainer)}</small></div></button></div>`;
  }
  function vShop() {
    return `<div class="card"><div class="row between"><h3>🛒 Loja Pokémon</h3><span class="chip money">${fmt(S.money)}</span></div><p class="mut small">Mais itens aparecem conforme você ganha insígnias.</p></div><div class="grid shop">${ROD_SHOP.map(([id, pr, rq]) => { const ok = S.badges.length >= rq, has = S.bag[id]; return `<div class="card item ${ok ? '' : 'locked'}">${itemImg(id)}<div class="iinfo grow"><b>${C.ITEM_NAME[id]}</b><small class="mut">${ok ? KEY_ITEMS[id] : `🔒 ${rq} insígnia(s)`}</small></div><div class="buy"><b>${has ? '✅' : fmt(pr)}</b>${has ? '' : `<button class="btn small" ${ok && S.money >= pr ? '' : 'disabled'} data-a="buyrod" data-id="${id}">Comprar</button>`}</div></div>`; }).join('')}${C.SHOP.map(x => { const ok = S.badges.length >= x.req;
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
  ACT.buyrod = d => { const x = ROD_SHOP.find(r => r[0] === d.id); if (!x || S.bag[x[0]] || S.money < x[1] || S.badges.length < x[2]) return; S.money -= x[1]; S.bag[x[0]] = 1; SFX.coin(); toast(`Comprou ${C.ITEM_NAME[x[0]]}! 🎣`, 'good'); save(); render(); };
  ACT.bagitem = d => { if (KEY_ITEMS[d.id]) return toast(`${C.ITEM_NAME[d.id]}: ${KEY_ITEMS[d.id]}`); if (PE.BALLS[d.id]) return toast('Bolas são usadas durante batalhas contra Pokémon selvagens.');
    const mm = modal(`<h3>Usar ${C.ITEM_NAME[d.id]} em...</h3><div class="mgrid">${S.party.map((m, i) => monCard(m, i, 'x')).join('')}</div><div class="mbtns"><button class="btn" data-a="close">Cancelar</button></div>`);
    $$('.mcard', mm).forEach(b => b.onclick = e => { e.stopPropagation(); useBagItem(d.id, S.party[+b.dataset.i]); }); };
  let dexFilter = 'all';
  function vDex() {
    const ids = Object.keys(D.mons).map(Number).sort((a, b) => a - b); const [se, ca] = dexCount();
    return `<div class="card"><div class="row between"><h3>📕 Pokédex</h3><b>${ca}/${ids.length}</b></div><div class="progress"><i style="width:${ca / ids.length * 100}%"></i></div><p class="mut small">${se} vistos • ${ca} capturados • ${Object.keys(S.dex.shiny).length} shiny</p>
      <div class="seg">${[['all', 'Todos'], ['caught', 'Capturados'], ['missing', 'Faltando']].filter(x => moreOk(x[0])).map(([k, l]) => `<button class="${dexFilter === k ? 'on' : ''}" data-a="dexf" data-k="${k}">${l}</button>`).join('')}</div></div>${dexRewardsCard()}
      <div class="dex">${ids.filter(id => dexFilter === 'all' || (dexFilter === 'caught' ? S.dex.caught[id] : !S.dex.caught[id])).map(id => { const sn = S.dex.seen[id], c = S.dex.caught[id];
        return `<button class="dx ${c ? 'c' : ''}" ${sn ? `data-a="dexinfo" data-id="${id}"` : ''}><small>#${String(id).padStart(3, '0')}</small><img src="${sprId(id, !!S.dex.shiny[id])}" class="${sn ? '' : 'sil'}" loading="lazy" alt=""><b>${sn ? D.mons[id].n : '???'}</b>${c ? '<i>●</i>' : ''}</button>`; }).join('')}</div>`;
  }
  ACT.dexf = d => { dexFilter = d.k; render(); };
  ACT.dexinfo = d => { const id = +d.id, m = D.mons[id]; cry(id); const where = C.MAPS.filter(mp => mp.enc.some(e => e[0] === id)).map(mp => mp.name);
    modal(`<div class="center"><img class="bigspr" src="${sprId(id)}" alt=""><h2>#${String(id).padStart(3, '0')} ${m.n}</h2><div class="types">${m.t.map(typeChip).join('')}</div>
      <p class="mut small">Taxa de captura ${m.c} • Total base ${m.s.reduce((a, b) => a + b)} ${m.L ? '• ⭐ Lendário' : ''}</p><p class="small">${where.length ? '📍 ' + where.join(', ') : '📍 Evolução, ovo ou presente'}</p>${m.mg ? `<div class="megarow">${m.mg.map(f => `<div><img src="img/mega/front/${f}.gif" alt=""><small>${D.megas[f].n}<br>${D.megas[f].t.map(t => C.TYPE_PT[t]).join('/')} • ${abName(D.megas[f].ab)}</small></div>`).join('')}</div>` : ''}<button class="btn wide" data-a="close">Fechar</button></div>`); };
  function vCard() { return `<div class="grid"><div class="card span2">${trainerCard(true)}</div><div class="card"><h3>Insígnias</h3><div class="badgegrid">${C.BADGES.map((b, i) => `<div class="bg ${S.badges.includes(i) ? 'on' : ''}" style="--bc:${C.BADGE_COLOR[i]}"><span class="badge ${S.badges.includes(i) ? 'on' : ''}"></span><small>${b}</small><small class="mut">${C.GYMS[i].leader}</small></div>`).join('')}</div>${S.nat && S.nat.wins ? `<h3>Troféu especial</h3><div class="badgegrid"><div class="bg on"><span class="badge natb on">🌈</span><small>Insígnia Nat</small><small class="mut">${S.nat.wins} vitória(s)</small></div></div>` : ''}${S.champion && FEAT.johto ? `<h3>Insígnias de Johto</h3><div class="badgegrid">${C.JBADGES.map((b, i) => `<div class="bg ${S.jbadges.includes(i) ? 'on' : ''}" style="--bc:${C.JBADGE_COLOR[i]}"><span class="badge ${S.jbadges.includes(i) ? 'on' : ''}"></span><small>${b}</small><small class="mut">${C.JGYMS[i].leader}</small></div>`).join('')}</div>` : ''}</div>
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
    return `<div class="card"><h3>⚙️ Configurações</h3><div class="setrow"><span>Som</span><div class="seg">${[[true, 'Ligado'], [false, 'Desligado']].map(([v, l]) => `<button class="${S.settings.sound === v ? 'on' : ''}" data-a="set" data-k="sound" data-v="${v}">${l}</button>`).join('')}</div></div>${audioSettings()}<div class="setrow"><span>🐾 Pokémon seguindo no mapa</span><div class="seg">${[[true, 'Sim'], [false, 'Não']].map(([v, l]) => `<button class="${(S.settings.follow !== false) === v ? 'on' : ''}" data-a="setfollow" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="setrow"><span>Velocidade da batalha</span><div class="seg">${[[1.4, 'Lenta'], [1, 'Normal'], [0.6, 'Rápida'], [0.3, 'Turbo']].map(([v, l]) => `<button class="${S.settings.speed === v ? 'on' : ''}" data-a="set" data-k="speed" data-v="${v}">${l}</button>`).join('')}</div></div>
      <button class="btn wide ghost" data-a="lock">🔒 Bloquear site neste aparelho</button></div>
      <div class="card"><h3>🎁 Código de presente</h3><p class="mut small">Tem um código? Digite aqui para receber o presente (cada código vale uma vez por conta).</p>
      <form id="giftForm" class="row gift"><input id="giftCode" autocapitalize="characters" autocomplete="off" placeholder="XXXX-XXXX" aria-label="Código de presente"><button class="btn primary">Resgatar</button></form><p id="giftErr" class="err"></p></div>
      <div class="card"><h3>🛟 Recuperar Pokémon</h3><p class="mut small">Sumiu algum Pokémon? Procura nas cópias de segurança deste aparelho e devolve para o PC. Não apaga nada.</p><button class="btn wide" data-a="recover">🔎 Procurar Pokémon perdidos</button></div>`;
  }
  // ---------- recuperação de Pokémon (lê backups; só ADICIONA ao PC) ----------
  const monKey = m => m.uid || ['x', m.id, m.ot, m.caughtAt, (m.iv || []).join('.')].join('|');
  function allMine() { return [...S.party, ...S.box, ...((S.daycare && S.daycare.slots) || [])].filter(Boolean); }
  function findLost() {
    const have = new Set(allMine().map(monKey)), pre = 'pkLake.save.' + user, best = {};
    for (let k = 0; k < localStorage.length; k++) { const key = localStorage.key(k); if (!key || (key !== pre && !key.startsWith(pre + '.'))) continue;
      let o; try { o = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; } if (!o || typeof o !== 'object') continue;
      for (const m of [...(o.party || []), ...(o.box || []), ...((o.daycare && o.daycare.slots) || [])]) { if (!m || !D.mons[m.id] || !Array.isArray(m.moves)) continue; const id = monKey(m);
        if (have.has(id)) continue; if (!best[id] || m.lvl > best[id].m.lvl) best[id] = { m, src: key.slice(pre.length + 1) || 'atual' }; } }
    return Object.values(best);
  }
  const LENDAS_H = 'dac1e434edd06c55a24826838ea64907fd92279994a369734519122db8e2754c';
  ACT.recover = () => { const lost = findLost();
    const giftZard = S.gifts && S.gifts[LENDAS_H] && !allMine().some(m => m.id === 6 && (m.caughtAt || '').includes('Presente')) && !lost.some(x => x.m.id === 6);
    const where = id => { const p = S.party.filter(m => m.id === id).length, b = S.box.filter(m => m.id === id).length, c = (S.daycare.slots || []).filter(m => m.id === id).length; return `time ${p} • PC ${b} • Creche ${c}`; };
    modal(`<div class="center"><h2>🛟 Recuperar Pokémon</h2>${lost.length ? `<p>Encontrei <b>${lost.length}</b> Pokémon nas cópias de segurança que não estão no seu time, PC nem Creche:</p>
      <div class="giftgrid">${lost.map(x => `<div class="giftmon"><img src="${sprId(x.m.id)}" alt=""><small>${esc(x.m.nick || D.mons[x.m.id].n)}<br>Nv ${x.m.lvl}</small></div>`).join('')}</div>
      <div class="mbtns"><button class="btn primary wide" data-a="recoverdo">Devolver todos para o PC</button></div>` : `<p>Nenhum Pokémon perdido nas cópias de segurança deste aparelho.</p>`}
      ${giftZard ? `<p class="small">O <b>Charizard</b> do código EDSON-LENDAS não está em lugar nenhum.</p><div class="mbtns"><button class="btn primary wide" data-a="recoverzard">Devolver o Charizard do presente</button></div>` : ''}
      <p class="mut small">Charizard agora: ${where(6)}</p><div class="mbtns"><button class="btn wide" data-a="close">Fechar</button></div></div>`); };
  ACT.recoverdo = () => { const lost = findLost(); lost.forEach(({ m }) => { const c = JSON.parse(JSON.stringify(m)); delete c.mega; delete c.dmax; c.hp = Math.max(1, Math.min(c.hp || 0, PE.maxhp(c))) || PE.maxhp(c); S.box.push(c); addCaught(c); });
    save(); closeModal(); toast(`🛟 ${lost.length} Pokémon voltaram para o PC!`, 'good'); render(); };
  ACT.recoverzard = () => { const m = PE.makeMon(6, 50, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false, iv: [31, 31, 31, 31, 31, 31], moves: ['flamethrower', 'air-slash', 'dragon-claw', 'heat-wave'] });
    if (S.party.length < 6) S.party.push(m); else S.box.push(m); addCaught(m); save(); closeModal(); toast(`🛟 Charizard voltou${S.party.includes(m) ? ' para o time' : ' para o PC'}!`, 'good'); render(); };
  // ---------- códigos de presente (hash sha256, validado no cliente) ----------
  // golpes fortes e coerentes para Pokémon de presente
  const GIFT_MOVES = { 144: ['ice-beam', 'blizzard', 'hurricane', 'roost'], 145: ['thunderbolt', 'drill-peck', 'heat-wave', 'roost'], 146: ['flamethrower', 'air-slash', 'heat-wave', 'roost'],
    150: ['psychic', 'aura-sphere', 'ice-beam', 'recover'], 151: ['psychic', 'aura-sphere', 'flamethrower', 'nasty-plot'], 243: ['thunderbolt', 'extrasensory', 'shadow-ball', 'calm-mind'],
    244: ['flamethrower', 'extrasensory', 'stone-edge', 'calm-mind'], 245: ['surf', 'ice-beam', 'extrasensory', 'calm-mind'], 249: ['aeroblast', 'psychic', 'ice-beam', 'roost'],
    250: ['sacred-fire', 'brave-bird', 'earthquake', 'recover'], 251: ['psychic', 'energy-ball', 'earth-power', 'recover'], 377: ['stone-edge', 'superpower', 'earthquake', 'iron-defense'],
    378: ['ice-beam', 'thunderbolt', 'focus-blast', 'amnesia'], 379: ['iron-head', 'flash-cannon', 'earthquake', 'iron-defense'], 380: ['dragon-pulse', 'psychic', 'surf', 'calm-mind'],
    381: ['dragon-pulse', 'psychic', 'surf', 'calm-mind'], 382: ['surf', 'ice-beam', 'thunder', 'calm-mind'], 383: ['earthquake', 'stone-edge', 'fire-punch', 'bulk-up'],
    384: ['outrage', 'dragon-claw', 'extreme-speed', 'dragon-dance'], 385: ['iron-head', 'psychic', 'thunderbolt', 'calm-mind'], 386: ['psycho-boost', 'superpower', 'ice-beam', 'extreme-speed'],
    6: ['flamethrower', 'air-slash', 'dragon-claw', 'heat-wave'], 700: ['moonblast', 'hyper-voice', 'calm-mind', 'shadow-ball'],
    134: ['surf', 'ice-beam', 'shadow-ball', 'wish'], 135: ['thunderbolt', 'shadow-ball', 'signal-beam', 'calm-mind'], 136: ['flare-blitz', 'superpower', 'fire-fang', 'quick-attack'],
    196: ['psychic', 'dazzling-gleam', 'shadow-ball', 'calm-mind'], 197: ['foul-play', 'dark-pulse', 'moonlight', 'wish'], 470: ['leaf-blade', 'x-scissor', 'swords-dance', 'quick-attack'],
    471: ['ice-beam', 'blizzard', 'shadow-ball', 'ice-shard'] };
  const giftMoves = id => { const l = (GIFT_MOVES[id] || []).filter(n => D.moves[n]); if (l.length < 4) for (const n of PE.makeMon(id, 50, { seed: 1 }).moves.map(x => x.n)) if (l.length < 4 && !l.includes(n)) l.push(n); return l; };
  const IV31 = [31, 31, 31, 31, 31, 31], GO = () => ({ ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false });
  // reparo único de saves: corrige golpes fracos/status-only (bug de golpes especiais) sem remover nenhum Pokémon
  function repairMoves() {
    if (S.fixMoves1) return; let n = 0;
    for (const m of [...S.party, ...S.box]) { if (!m || !D.mons[m.id]) continue;
      const gift = (m.caughtAt || '').includes('Presente'), dmg = m.moves.filter(x => D.moves[x.n] && D.moves[x.n].c !== 't' && D.moves[x.n].p).length;
      if (gift) { m.moves = giftMoves(m.id).map(k => ({ n: k, pp: D.moves[k].pp })); m.hp = PE.maxhp(m); n++; }
      else if (dmg < 2) { m.moves = PE.makeMon(m.id, m.lvl, { seed: 7 }).moves.map(x => ({ n: x.n, pp: D.moves[x.n].pp })); n++; }
      m.hp = Math.min(m.hp, PE.maxhp(m)); }
    S.fixMoves1 = Date.now(); save(); if (n) setTimeout(() => toast(`Golpes de ${n} Pokémon foram atualizados!`, 'good'), 600);
  }
  const GIFTS = { 'dac1e434edd06c55a24826838ea64907fd92279994a369734519122db8e2754c': { name: 'Lendas do Edson', build: () => {
    const seen = new Set(), list = [];
    C.MAPS.forEach(mp => mp.enc.forEach(e => { if (e[4] && e[4].legend && !seen.has(e[0])) { seen.add(e[0]); list.push([e[0], e[2]]); } }));
    const out = list.map(([id, l]) => PE.makeMon(id, l, st, { ...GO(), moves: giftMoves(id) }));
    out.push(PE.makeMon(6, 50, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false, iv: [31, 31, 31, 31, 31, 31], moves: ['flamethrower', 'air-slash', 'dragon-claw', 'heat-wave'] }));
    return out; } },
    '96fb1f08d72fdb10d1c524db3b9981ae48a271ef7831d240f0390208882108b9': { name: 'Sylveon do Edson', build: () => [PE.makeMon(700, 50, st, { ot: S.trainer, caughtAt: 'Presente • Código de presente', shiny: false, iv: [31, 31, 31, 31, 31, 31], moves: ['moonblast', 'hyper-voice', 'calm-mind', 'shadow-ball'] })] },
    '01aea158d891de1fd0c6ec8b42ba842caf7aa770452629662a4b036852608d56': { name: 'Eeveelutions + Mew do Edson', build: () => [134, 135, 136, 196, 197, 470, 471, 700, 151].map(id => PE.makeMon(id, 50, st, { ...GO(), iv: IV31, moves: giftMoves(id) })) },
    'c8715b3a2989f1ee29a31fa5b86846f118984c807eecea6a7f13e7a16481bc40': { name: 'Mega Kit do Edson', items: { 'mega-bracelet': 1, 'charizardite-x': 1, 'charizardite-y': 1 }, build: () => [] },
    '5d5be4c11ef135e648c907406f429f2e4bbe42279223673880eba4fa1fc89a2b': { name: 'Gigantamax do Edson', items: { 'dynamax-band': 1 }, tip: '⬣ Uma vez por batalha, toque em <b>Gigantamax</b> no menu de golpes do Charizard: ele fica gigante por 3 turnos e usa <b>Fogaréu G-Max</b>!', build: () => [] } };
  async function redeemGift(code) {
    const h = sha256(code.trim().toUpperCase()), g = GIFTS[h], err = $('#giftErr');
    if (!g) { if (err) err.textContent = 'Código inválido.'; return; }
    S.gifts = S.gifts || {};
    if (S.gifts[h]) { if (err) err.textContent = 'Este código já foi resgatado nesta conta.'; return; }
    const mons = g.build(); let toBox = 0;
    const its = Object.entries(g.items || {}); its.forEach(([k, v]) => { S.bag[k] = k === 'mega-bracelet' || k === 'dynamax-band' ? 1 : (S.bag[k] || 0) + v; });
    mons.forEach(m => { addCaught(m); S.stats.caught++; if (S.party.length < 6) S.party.push(m); else { S.box.push(m); toBox++; } });
    S.gifts[h] = { at: Date.now(), n: mons.length, items: its.length || undefined }; save(); SFX.caught();
    if (!mons.length) { modal(`<div class="center giftwin"><div class="burstbg"></div><h2>🎁 ${g.name}!</h2><p>Você recebeu:</p>
      <div class="giftgrid">${its.map(([k, v], i) => `<div class="giftmon" style="animation-delay:${i * 0.15}s"><img src="img/items/${k}.png" alt="" style="image-rendering:pixelated;width:56px;height:56px"><small>${C.ITEM_NAME[k] || k}${k === 'mega-bracelet' || k === 'dynamax-band' ? '' : '<br>x' + v}</small></div>`).join('')}</div>
      <p class="mut small">${g.tip || '🧬 Dê uma Charizardita para o Charizard segurar e toque em <b>Mega Evoluir</b> no menu de golpes!'}</p>
      <div class="mbtns"><button class="btn primary wide" data-a="close">Incrível!</button></div></div>`); render(); return; }
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
    const enemyParty = o.enemy; enemyParty.forEach(m => see(m.id)); S.stats.battles++; MUS.want('battle');
    if (S.party[0].hp <= 0) { const i = S.party.findIndex(m => m.hp > 0); if (i > 0) S.party.unshift(S.party.splice(i, 1)[0]); }
    const bs = PE.createBattle({ kind: o.kind, seed: o.seed ?? ((R() * 2 ** 31) | 0), weather: o.weather, sides: [{ party: o.party || S.party, name: S.trainer, mega: (S.bag['mega-bracelet'] || 0) > 0 && !o.raid, dyna: (S.bag['dynamax-band'] || 0) > 0 || !!o.raid }, { party: enemyParty, name: o.name || '', ai: o.ai || 0, mega: enemyParty.some(m => m.item), dyna: !!o.dyna }] });
    B = { o, s: bs, busy: true };
    const theme = o.map ? o.map.theme : o.tower ? 'psychic' : 'gym';
    const ov = document.createElement('div'); ov.id = 'battle'; ov.className = `battle theme-${theme} ${o.weather ? 'w-' + o.weather : ''} per-${o.map ? period() : 'day'} ${o.gym != null || o.elite != null || o.jgym != null || o.jelite != null ? 'boss' : ''}`;
    const p = bs.sides[0].b.m, e = bs.sides[1].b.m;
    ov.innerHTML = `<div class="bwrap"><div class="bscene"><div class="bsky"></div><div class="bwx"></div>
      <div class="plat ep"></div><div class="plat pp"></div>
      <div class="bmon emon hidden"><img id="esp" src="${spr(e)}" alt=""></div><div class="bmon pmon hidden"><img id="psp" src="${spr(p, true)}" alt=""></div>
      <div class="info einfo" id="einfo"></div><div class="info pinfo" id="pinfo"></div>
      <div class="ebs" id="ebs"></div>${o.weather ? `<div class="wchip">${o.weather === 'rain' ? '🌧️ Chuva: Água +50%, Fogo −50%' : '☀️ Sol: Fogo +50%, Água −50%'}</div>` : ''}<div class="fxl" id="fxl"></div>
      ${o.kind === 'trainer' ? `<img class="foe" id="foe" src="img/tr/${o.sprite}.png" alt="">` : ''}<img class="metr" id="metr" src="img/tr/${S.avatar}.png" alt="">
      <div class="intro ${o.kind} ${o.nat ? 'nat' : ''}" id="intro">${o.nat ? `<div class="natrays"></div><div class="vs"><img src="img/tr/${S.avatar}.png" alt=""><b>VS</b><img class="natvsimg" src="img/tr/nat.png" alt="Nat"></div><div class="vsname natname"><small>DESAFIO FINAL</small><br><b>NAT</b><br><span>Mestra das Eeveelutions</span></div>` : o.kind === 'trainer' ? `<div class="vs"><img src="img/tr/${S.avatar}.png" alt=""><b>VS</b><img src="img/tr/${o.sprite}.png" alt=""></div><div class="vsname">${esc(o.intro || '')}<br><b>${esc(o.name)}</b></div>` : '<i class="bar1"></i><i class="bar2"></i>'}</div></div>
      <div class="bpanel"><div class="blog" id="blog"></div><div class="bctl" id="bctl"></div></div></div>`;
    document.body.appendChild(ov); document.body.classList.add('in-battle');
    drawInfo(0); drawInfo(1); drawBalls(); runIntro();
  }
  function drawInfo(side) {
    const m = B.s.sides[side].b.m, p = hpPct(m), el = $(side ? '#einfo' : '#pinfo');
    const x0 = PE.xpFor(D.mons[m.id].g, m.lvl), x1 = PE.xpFor(D.mons[m.id].g, m.lvl + 1);
    el.innerHTML = `<div class="row between"><b class="bnm">${esc(bname(m))}${m.shiny ? ' ✨' : ''}${m.raidStars ? ` <span class="dmt">${'★'.repeat(m.raidStars)}</span>${m.shield ? ` <span class="dmt shd">🛡️${m.shield}</span>` : ''}` : m.dmax ? ` <span class="dmt">⬣${m.dmax.t}</span>` : ''}</b><small>Nv${m.lvl}</small></div><div class="row"><small class="hpl">HP</small><div class="hpbar"><i style="width:${p}%;background:${hpCol(p)}"></i></div></div>
      <div class="row between"><span>${stChip(m.status)}${B.o.kind === 'wild' && side === 1 && S.dex.caught[m.id] ? '<img class="caughtmark" src="img/items/poke-ball.png" alt="">' : ''}</span>${side ? '' : `<small class="hpn">${m.hp}/${PE.maxhp(m)}</small>`}</div>${side ? '' : `<div class="xpbar"><i style="width:${m.lvl >= 100 ? 100 : (m.xp - x0) / (x1 - x0) * 100}%"></i></div>`}`;
  }
  function setHP(side, hp, max) { const el = $(side ? '#einfo' : '#pinfo'); const i = $('.hpbar i', el); const p = Math.max(0, hp / max * 100); i.style.width = p + '%'; i.style.background = hpCol(p);
    const n = $('.hpn', el); if (n) { const from = parseInt(n.textContent) || 0; const t0 = performance.now(), dur = 600 * spd(); const tick = t => { const k = Math.min(1, (t - t0) / dur); n.textContent = Math.round(from + (hp - from) * k) + '/' + max; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); } }
  function drawBalls() { if (!B || B.o.kind !== 'trainer') return; $('#ebs').innerHTML = B.s.sides[1].party.map(m => `<i class="${m.hp > 0 ? '' : 'out'}"></i>`).join(''); }
  function log(t) { const l = $('#blog'); if (l) l.innerHTML = `<p>${t}</p>`; }
  async function runIntro() {
    const o = B.o, e = B.s.sides[1].b.m, p = B.s.sides[0].b.m; const intro = $('#intro');
    if (o.nat) { natTheme(); await wait(3200); intro.classList.add('out');
      for (const t of ['Então você é quem derrotou o Blue... Eu estava esperando por você.', 'Cada um dos meus parceiros carrega uma história diferente. Juntos, somos imbatíveis.', 'Mostre-me o laço que você tem com seus Pokémon!']) { log(`<b>Nat:</b> “${t}”`); await wait(1700); }
      $('#foe').classList.add('leave'); log(`Nat enviou <b>${D.mons[e.id].n}</b>!`); await sendOut(1, e); }
    else if (o.kind === 'trainer') { SFX.win(); await wait(1500); intro.classList.add('out'); log(`<b>${esc(o.name)}</b> quer batalhar!`); await wait(1100);
      $('#foe').classList.add('leave'); log(`${esc(o.name)} enviou <b>${D.mons[e.id].n}</b>!`); await sendOut(1, e); }
    else { await wait(750); intro.classList.add('out'); const em = bq('.emon'); em.classList.remove('hidden'); em.classList.add('slidein'); bq('#einfo').classList.add('show'); cry(e.id);
      log(o.raid ? `⬣ Um <b>${D.mons[e.id].n}</b> Dinamax ${'★'.repeat(o.raid.den.stars)} bloqueia a toca!` : o.legend ? `⭐ Um <b>${D.mons[e.id].n}</b> lendário apareceu!` : `Um <b>${D.mons[e.id].n}</b> selvagem apareceu!`);
      if (o.legend) $('#battle').classList.add('legend-aura');
      await wait(900);
      if (e.shiny) { sparkle(1); SFX.shiny(); shinyBurst(); S.stats.shinies++; log(`✨ Uau! É um ${D.mons[e.id].n} <b>SHINY</b>! ✨`); await wait(1300); }
      em.classList.remove('slidein'); }
    if (!B || !$('#metr')) return; $('#metr').classList.add('leave'); log(`Vai, <b>${esc(pn(p))}</b>!`); await sendOut(0, p); B.busy = false; showMain();
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
    const cm = PE.canMega(B.s, 0), mf = cm ? D.megas[PE.megaFormFor(m)] : null, cd = PE.canDyna(B.s, 0), gx = PE.gmaxOf(m);
    if (B.megaOn && B.dynaOn) B.dynaOn = false; const asMax = !!m.dmax || (cd && B.dynaOn), mm = asMax ? Object.assign({}, m, { dmax: m.dmax || { t: 3, g: gx ? 1 : 0 } }) : null;
    $('#bctl').innerHTML = `${cm || cd ? `<div class="powrow">${cm ? `<button class="bb megatog ${B.megaOn ? 'on' : ''}" data-b="megatog"><span class="orb"></span>🧬 Mega Evoluir${B.megaOn ? ' ✔' : ''} <small>${mf.n}</small></button>` : ''}${cd ? `<button class="bb dynatog ${B.dynaOn ? 'on' : ''}" data-b="dynatog">${gx ? '🌋 Gigantamax' : '⬣ Dinamax'}${B.dynaOn ? ' ✔' : ''} <small>${gx ? gx.n : '3 turnos, HP x2'}</small></button>` : ''}</div>` : ''}<div class="bmoves">${m.moves.map(x => { const mv0 = D.moves[x.n], mv = asMax ? PE.maxMoveOf(mm, mv0) : mv0; const ef = mv.p ? PE.eff(mv.t, mtypes(e)) : 1;
      return `<button class="mvb ${asMax ? 'maxmv' : ''}" style="--tc:${C.TYPE_COLOR[mv.t]}" data-b="mv" data-n="${x.n}" ${x.pp <= 0 ? 'disabled' : ''}><b>${mv.n}</b><small>${C.TYPE_PT[mv.t]} • ${mv.p ? 'Pod ' + mv.p : mv.guard ? 'Proteção' : 'Status'} • PP ${x.pp}/${mv0.pp}</small>${known ? (ef > 1 ? '<em class="ef up">Super!</em>' : ef < 1 ? `<em class="ef dn">${ef === 0 ? 'Imune' : 'Fraco'}</em>` : '') : ''}</button>`; }).join('')}</div><button class="bb back" data-b="back">← Voltar</button>`;
    bindCtl();
  }
  function showBag() {
    if (B.o.rogue) return toast('Sem mochila no Lago Infinito — use as melhorias!', 'bad');
    const it = Object.entries(S.bag).filter(([k, v]) => v > 0 && C.ITEM_NAME[k] && (PE.BALLS[k] ? B.o.kind === 'wild' && !B.o.raid && k !== 'safari-ball' : (PE.HEAL[k] || ['revive', 'antidote', 'full-heal'].includes(k))));
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
    else if (k === 'run') act({ type: 'run' }); else if (k === 'mv') { const mg = !!B.megaOn, dy = !!B.dynaOn; B.megaOn = false; B.dynaOn = false; act({ type: 'move', n: b.dataset.n, mega: mg, dyna: dy }); }
    else if (k === 'megatog') { B.megaOn = !B.megaOn; if (B.megaOn) B.dynaOn = false; showMoves(); }
    else if (k === 'dynatog') { B.dynaOn = !B.dynaOn; if (B.dynaOn) B.megaOn = false; showMoves(); }
    else if (k === 'item') { const id = b.dataset.id; if (PE.BALLS[id]) { S.bag[id]--; act({ type: 'ball', ball: id }); } else showParty(false, id); }
    else if (k === 'useon') { const id = B.itemFor, m = B.s.sides[0].party[+b.dataset.i], mh = PE.maxhp(m);
      const ok = id === 'revive' ? m.hp <= 0 : PE.HEAL[id] ? m.hp > 0 && (m.hp < mh || (id === 'full-restore' && m.status)) : !!m.status;
      if (!ok) return toast('Não teria efeito.'); S.bag[id]--; act({ type: 'item', item: id, target: +b.dataset.i }); }
    else if (k === 'sw') { if (B.forced) { B.forced = false; doForced(+b.dataset.i); } else act({ type: 'switch', i: +b.dataset.i }); } }); }
  async function act(a) {
    if (B.o.rogue && a.type === 'run') return toast('Não dá para fugir no Lago Infinito!', 'bad');
    B.busy = true; $('#bctl').innerHTML = ''; const s = B.s;
    const ev = PE.step(s, [a, PE.aiAction(s, 1)]); await play(ev); if (B && B.o.raid && !s.over) await raidAfterTurn(); if (B) await postTurn();
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
    const sd = s.sides[0], parts = sd.participants.filter(i => sd.party[i] && sd.party[i].hp > 0); const base = Math.round(PE.xpGain(def, s.kind === 'trainer', 1) * evXpMul());
    for (let i = 0; i < sd.party.length; i++) { const m = sd.party[i]; if (m.hp <= 0 || m.lvl >= 100) continue; const inP = parts.includes(i); const share = inP ? Math.ceil(base / parts.length) : Math.ceil(base * 0.3);
      for (let k = 0; k < 6; k++) if (D.mons[def.id].s[k] >= 90) m.ev[k] = Math.min(252, (m.ev[k] || 0) + 2);
      const ups = PE.addXP(m, share);
      if (inP) { log(`${esc(pn(m))} ganhou <b>${share}</b> de XP!`); if (i === sd.active) drawInfo(0); await wait(850); }
      for (const u of ups) { SFX.lvl(); log(`⬆️ ${esc(pn(m))} subiu para o nível <b>${u.lvl}</b>!`); if (i === sd.active) { drawInfo(0); const pm = bq('.pmon'); pm.classList.add('lvlup'); setTimeout(() => pm.classList.remove('lvlup'), 900); } await wait(1100);
        for (const n of u.learn) await learnMove(m, n); }
      if (ups.length && PE.levelEvo(m, tod())) (B.evos = B.evos || []).push(m); }
    sd.participants = [sd.active];
  }
  async function play(ev) {
    const ov = $('#battle');
    for (const e of ev) {
      if (!ov || !document.body.contains(ov)) return;
      const mon = side => bq(side ? '.emon' : '.pmon');
      switch (e.e) {
        case 'use': { log(e.text); await wait(420); const el = mon(e.side); el.classList.add('lunge'); setTimeout(() => el.classList.remove('lunge'), 450);
          if (e.cat !== 't') await projectile(e.side, e.type); else { auraFx(e.side, e.type); SFX.status(); await wait(550); } break; }
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
        case 'mega': if (e.side === 0) S.stats.megas = (S.stats.megas || 0) + 1; await megaAnim(e); break;
        case 'dyna': if (e.side === 0) S.stats.dmaxes = (S.stats.dmaxes || 0) + 1; await dynaAnim(e); break;
        case 'undyna': { const el = bq(e.side ? '.emon' : '.pmon'); if (e.text) log(e.text); el.classList.add('shrink'); await wait(450); el.classList.remove('dmax', 'gmax', 'shrink'); $(e.side ? '#esp' : '#psp').src = spr(B.s.sides[e.side].b.m, !e.side); drawInfo(e.side); setHP(e.side, e.hp, e.max); await wait(e.quiet ? 100 : 700); break; }
        case 'weather': if (e.text) { log(e.text); await wait(800); } break;
        case 'end': break;
        default: if (e.text) { log(e.text); if (e.anim) statusFx(e.side, e.anim); await wait(850); }
      }
    }
  }
  async function dynaAnim(e) {
    const el = bq(e.side ? '.emon' : '.pmon'), img = $(e.side ? '#esp' : '#psp'), ov = $('#battle'); log(e.text); SFX.evo();
    el.classList.add('dgrow'); ov.classList.add('dsky'); await wait(1300); const m = B.s.sides[e.side].b.m; img.src = spr(m, !e.side); el.classList.remove('dgrow'); el.classList.add('dmax'); if (e.gmax) el.classList.add('gmax');
    cry(m.id); ov.classList.add('shake'); setTimeout(() => ov.classList.remove('shake'), 500); drawInfo(e.side); setHP(e.side, e.hp, e.max); await wait(1100); ov.classList.remove('dsky'); }
  async function megaAnim(e) {
    const el = bq(e.side ? '.emon' : '.pmon'), img = $(e.side ? '#esp' : '#psp'), ov = $('#battle'); log(e.text);
    const orb = document.createElement('div'); orb.className = 'megaorb'; el.appendChild(orb); el.classList.add('megaevo'); SFX.evo(); await wait(1500);
    const m = B.s.sides[e.side].b.m; img.src = spr(m, !e.side); ov.classList.add('megaflash'); cry(m.id); await wait(500);
    orb.remove(); el.classList.remove('megaevo'); ov.classList.remove('megaflash'); drawInfo(e.side); setHP(e.side, e.hp, e.max); sparkle(e.side); await wait(900);
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
    b.style.cssText = `--sx:${sc.width * 0.15}px;--sy:${sc.height * 0.95}px;--tx:${x1}px;--ty:${y1}px;${ballFx()}`; fx.appendChild(b); SFX.throw(); await wait(650);
    b.classList.add('landed'); popFx(1); const el = bq('.emon'); el.classList.add('caught'); tone(1000, 0.3, 'sine', 0.05, 0, -700); await wait(600);
    b.classList.add('drop'); await wait(450);
  }
  function starsFx() { const b = $('#cball'); if (!b) return; const r = b.getBoundingClientRect(), o = bq('.bscene').getBoundingClientRect(); const x = r.left - o.left + r.width / 2, y = r.top - o.top;
    for (let i = 0; i < 8; i++) { const s = document.createElement('span'); s.className = 'star'; s.textContent = '★'; s.style.cssText = `left:${x}px;top:${y}px;--dx:${(i - 3.5) * 22}px;--dy:${-50 - Math.random() * 40}px`; $('#fxl').appendChild(s); setTimeout(() => s.remove(), 1300); } }
  async function endBattle() {
    const s = B.s, o = B.o; let msg = '';
    if (o.raid) return raidEnd();
    if (o.rogue) return rogueEnd();
    if (s.ran) return closeBattle();
    if (s.caught) { const m = s.caught; m.ot = S.trainer; m.caughtAt = (o.map ? o.map.name : '') + ' • ' + new Date().toLocaleDateString('pt-BR'); const isNew = !S.dex.caught[m.id]; addCaught(m); S.stats.caught++; track('catch', 1, m); if (isNew) track('newdex');
      let where; if (S.party.length < 6) { S.party.push(m); where = 'entrou no seu time'; } else { S.box.push(m); where = 'foi enviado para o PC'; }
      await award(); save(); await finishEvos(); closeBattle();
      const m2 = modal(`<div class="center caughtm"><div class="burstbg"></div><img class="bigspr ${m.shiny ? 'shiny-glow' : ''}" src="${spr(m)}" alt=""><h2>${D.mons[m.id].n} capturado! ${m.shiny ? '✨' : ''}</h2>${isNew ? '<p class="newdex">🆕 Registrado na Pokédex!</p>' : ''}<p>Nv ${m.lvl} • ${where}.</p><p class="mut small">Pokédex: ${Object.keys(S.dex.caught).length} capturados</p><div class="mbtns"><button class="btn" id="nick">✏️ Dar apelido</button><button class="btn primary" data-a="close">Continuar</button></div></div>`);
      $('#nick', m2).onclick = () => { const n = prompt('Apelido:', ''); if (n) { m.nick = n.trim().slice(0, 12); save(); } closeModal(); render(); };
      return;
    }
    if (s.winner === 0) {
      await award(); S.stats.wins++; track('win'); if (o.kind === 'trainer') track('trainer'); MUS.victory();
      if (o.kind === 'trainer') { const f = $('#foe'); if (f) { f.classList.remove('leave'); f.classList.add('back'); } const prize = Math.round((o.prize || 0) * evMoneyMul()); S.money += prize; SFX.win(); log(`🏆 Você venceu ${esc(o.name)}! Ganhou <b>${fmt(prize)}</b>.`); await wait(2000);
        if (o.key) S.trainersBeaten[o.key] = (S.trainersBeaten[o.key] || 0) + 1;
        if (o.badge != null && !S.badges.includes(o.badge)) { S.badges.push(o.badge); S.badges.sort((a, b) => a - b); msg = 'badge:' + o.badge; }
        if (o.nat) { S.nat = S.nat || { wins: 0 }; S.nat.wins++; if (!S.nat.first) { S.nat.first = Date.now(); S.money += 70000; S.bag['master-ball'] = (S.bag['master-ball'] || 0) + 1; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 10; msg = 'nat1'; } else msg = 'nat'; }
        if (o.elite != null) { if (o.elite < 4) { S.elite = o.elite + 1; msg = 'elite'; } else { S.elite = 0; S.champion = true; S.champs++; msg = 'champ'; } }
        if (o.tower) { S.tower.cur++; S.tower.best = Math.max(S.tower.best, S.tower.cur); S.bp += S.tower.cur % 5 === 0 ? 3 : 1; if (S.tower.cur % 5 === 0) { S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1; msg = 'tower5'; } }
        if (o.jbadge != null && !S.jbadges.includes(o.jbadge)) { S.jbadges.push(o.jbadge); S.jbadges.sort((a, b) => a - b); msg = 'jbadge:' + o.jbadge; }
        if (o.jelite != null) { if (o.jelite < 4) { S.jelite = o.jelite + 1; msg = 'jelite'; } else { S.jelite = 0; S.jchampion = true; S.jchamps++; msg = 'jchamp'; } }
        if (msg === 'champ' && !S.bag['mega-bracelet']) { S.bag['mega-bracelet'] = 1; }
        if (msg === 'champ' && !S.bag['dynamax-band']) { S.bag['dynamax-band'] = 1; B.gotBand = 1; }
        rematchTourWin(o);
        if (s.goldRush) { S.money += s.goldRush; log(`💰 Chuva de Ouro G-Max: +${fmt(s.goldRush)}!`); }
        if (o.reward && o.rkey && !S.rewards[o.rkey]) { S.rewards[o.rkey] = Date.now(); S.bag[o.reward] = (S.bag[o.reward] || 0) + 1; B.gotReward = o.reward; }
      } else { const coin = Math.floor(s.sides[1].party[0].lvl * 10); S.money += coin; log(`Você ganhou ${fmt(coin)} de bônus de pesquisa.`); await wait(900); }
      save(); await finishEvos(); closeBattle();
      if (msg.startsWith('badge') && o.reward) setTimeout(() => toast(`💎 Prêmio: ${C.ITEM_NAME[o.reward]}!`, 'good'), 600);
      if (msg.startsWith('badge')) { const i = +msg.split(':')[1]; SFX.caught(); modal(`<div class="center badgewin"><div class="bigbadge" style="--bc:${C.BADGE_COLOR[i]}"><span class="badge on"></span></div><h2>Insígnia ${C.BADGES[i]}!</h2><p>Você derrotou ${C.GYMS[i].leader} e recebeu a Insígnia ${C.BADGES[i]}.</p><p class="mut small">${i < 7 ? 'Novas áreas e itens foram desbloqueados!' : 'Agora você pode desafiar a Liga Pokémon!'}</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`); }
      if (msg === 'elite') toast(`Próximo desafio: ${C.ELITE[S.elite].leader}! Cure-se se precisar.`, 'good');
      if (msg === 'jelite') toast(`Próximo desafio: ${C.JELITE[S.jelite].leader}! Cure-se se precisar.`, 'good');
      if (msg.startsWith('jbadge')) { const i = +msg.split(':')[1]; SFX.caught(); modal(`<div class="center badgewin"><div class="bigbadge" style="--bc:${C.JBADGE_COLOR[i]}"><span class="badge on"></span></div><h2>Insígnia ${C.JBADGES[i]}!</h2><p>Você derrotou ${C.JGYMS[i].leader} e recebeu a Insígnia ${C.JBADGES[i]} de Johto.</p>${o.reward ? `<p>💎 Prêmio: <b>${C.ITEM_NAME[o.reward]}</b></p>` : ''}<p class="mut small">${i < 7 ? 'Novas áreas de Johto foram liberadas!' : 'A Liga de Johto e a Torre do Sino te esperam!'}</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`); }
      if (msg === 'jchamp') modal(`<div class="center badgewin"><div class="bigbadge crown">👑</div><h2>Campeão de Johto!</h2><p>Você derrotou Lance! ${esc(S.trainer)} é Campeão de Kanto E Johto!</p><p class="mut small">O Monte Prata foi liberado... alguém espera lá no topo.</p><button class="btn primary wide" data-a="close">🏆</button></div>`);
      if (B && false) {}
      if (o.reward && S.rewards[o.rkey] && !msg.startsWith('jbadge')) { const rw = o.reward; setTimeout(() => toast(`💎 Prêmio de primeira vitória: ${C.ITEM_NAME[rw]}!`, 'good'), 600); }
      if (msg === 'nat1') { SFX.caught(); modal(`<div class="center badgewin natwin"><img class="natwimg" src="img/nat/nat-card.webp" alt=""><div class="bigbadge natbadge">🌈</div><h2>Insígnia Nat!</h2><p><b>Nat:</b> “Incrível... Você é digno do título de <b>Mestre Eevee</b>.”</p><p>+ ${fmt(70000)} (total ${fmt(100000)}), 1 Master Ball e 10 Balas Raras!</p><p class="mut small">O título aparece no seu Cartão de Treinador. Nat aceita revanches — mais forte.</p><button class="btn primary wide" data-a="close">Lendário!</button></div>`); }
      if (msg === 'nat') toast('🌈 Você venceu a Nat de novo!', 'good');
      if (msg === 'champ') modal(`<div class="center badgewin"><div class="bigbadge crown">👑</div><h2>Novo Campeão!</h2><p>Parabéns, ${esc(S.trainer)}! Você é o Campeão da Liga Pokémon!</p><p>🧬 Você ganhou a <b>Mega Pulseira</b> e a <b>Pulseira Dinamax</b>! Agora seus Pokémon podem Mega Evoluir ou Dinamaxar.</p><p class="mut small">A região de <b>Johto</b>, a Caverna Celeste e o Pilar Celeste foram liberados!</p><button class="btn primary wide" data-a="close">🏆</button></div>`);
      if (msg === 'tower5') toast('🗼 5 vitórias seguidas! +1 Bala Rara', 'good');
    } else {
      const lost = o.tour || o.rematch ? 0 : Math.floor(S.money / 2); S.money -= lost; log(`Você não tem mais Pokémon em condições... Perdeu ${fmt(lost)}.`); await wait(1800);
      if (o.elite != null) S.elite = 0; if (o.tower) S.tower.cur = 0; tourLoss(o);
      healAll(); save(); closeBattle(); toast('Você correu para o Centro Pokémon. Seu time foi curado.', 'bad');
    }
  }
  async function finishEvos() { PE.revertMega(S.party); for (const m of [...new Set(B.evos || [])]) { const to = PE.levelEvo(m, tod()); if (to) await evolveAnim(m, to); } B.evos = []; }
  function closeBattle() {
    PE.revertMega(S.party); S.party.forEach(m => { if (m.status === 'tox') m.status = 'psn'; });
    setTimeout(checkEggs, 700);
    save(); const ov = $('#battle'); B = null; if (ov) { ov.classList.add('closing'); setTimeout(() => { ov.remove(); document.body.classList.remove('in-battle'); render(); }, 350); }
  }
  A.debug = { get S() { return S; }, startBattle, go, get B() { return B; }, healAll, save, render, act: a => act(a), runAct: (k, d) => ACT[k](d || {}), daycareTick: (ms) => daycareTick(ms), checkEggs: () => checkEggs(), mkTeam };

  // =====================================================================
  // v4: Missões, Pokédex com recompensas, Shiny, Pesca, Mini-jogos, Conquistas, Música
  // =====================================================================
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const weekKey = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return 'W' + dayKey(d); };
  function hseed(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function srng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const addItems = r => giveReward(r);
  const rewardText = r => Object.entries(r).map(([k, v]) => k === 'money' ? fmt(v) : `${v}x ${C.ITEM_NAME[k] || k}`).join(' + ');
  const rewardIcons = r => Object.entries(r).map(([k, v]) => k === 'money' ? `<span class="rw">💰${v >= 1000 ? (v / 1000) + 'k' : v}</span>` : `<span class="rw">${itemImg(k)}${v > 1 ? 'x' + v : ''}</span>`).join('');
  Object.assign(C.ITEM_NAME, { 'old-rod': 'Vara Velha', 'good-rod': 'Vara Boa', 'super-rod': 'Super Vara', 'shiny-charm': 'Amuleto Brilhante' });
  const KEY_ITEMS = { 'old-rod': 'Use em mapas com água: botão 🎣 Pescar.', 'good-rod': 'Pesca Pokémon melhores em mapas com água.', 'super-rod': 'Pesca os Pokémon mais raros e fortes.', 'shiny-charm': 'Triplica a chance de encontrar Pokémon shiny (1/512 → 3/512).' };

  // ---------- shiny ----------
  const shinyP = () => (S && S.bag['shiny-charm'] ? 3 : 1) / 512;
  A.shinyP = shinyP;

  // ---------- progresso / eventos ----------
  const TYPES_Q = ['fire', 'water', 'grass', 'bug', 'normal', 'flying', 'poison', 'electric', 'psychic', 'rock', 'ground', 'fighting'];
  const QD_DAY = [r => ({ k: 'catch', n: 3 + Math.floor(r() * 3) }), r => ({ k: 'catchT', t: TYPES_Q[Math.floor(r() * TYPES_Q.length)], n: 2 }), r => ({ k: 'win', n: 4 + Math.floor(r() * 3) }),
    () => ({ k: 'trainer', n: 2 }), () => ({ k: 'fish', n: 3 }), () => ({ k: 'steps', n: 25 }), () => ({ k: 'quiz', n: 3 })];
  const QD_WEEK = [() => ({ k: 'catch', n: 15 }), () => ({ k: 'win', n: 25 }), () => ({ k: 'trainer', n: 8 }), () => ({ k: 'fish', n: 12 }), () => ({ k: 'hatch', n: 1 }),
    r => ({ k: 'catchT', t: TYPES_Q[Math.floor(r() * TYPES_Q.length)], n: 6 }), () => ({ k: 'newdex', n: 4 }), () => ({ k: 'quiz', n: 10 }), () => ({ k: 'steps', n: 150 })];
  const RW_DAY = [{ money: 1500, 'great-ball': 3 }, { money: 2000, 'super-potion': 2 }, { money: 2500, 'ultra-ball': 2 }, { money: 1800, 'rare-candy': 1 }];
  const STONES = ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone'];
  function qText(q) {
    const t = q.t ? C.TYPE_PT[q.t] : '';
    return { catch: `Capture ${q.n} Pokémon`, catchT: `Capture ${q.n} Pokémon do tipo ${t}`, win: `Vença ${q.n} batalhas`, trainer: `Vença ${q.n} treinadores`, fish: `Fisgue ${q.n} Pokémon pescando`,
      steps: `Explore ${q.n} passos na grama`, quiz: `Acerte ${q.n} no "Quem é esse Pokémon?"`, hatch: `Choque ${q.n} ovo na Creche`, newdex: `Registre ${q.n} Pokémon novos na Pokédex` }[q.k];
  }
  const qIcon = q => ({ catch: '🔴', catchT: '🧬', win: '⚔️', trainer: '🧢', fish: '🎣', steps: '👣', quiz: '❓', hatch: '🥚', newdex: '📕' }[q.k]);
  function roll(defs, n, seed, rws) {
    const r = srng(hseed(seed)), pool = defs.slice(), out = [];
    while (out.length < n && pool.length) { const d = pool.splice(Math.floor(r() * pool.length), 1)[0](r); if (d.k === 'hatch' && !FEAT.daycare) continue; d.p = 0; d.c = 0; d.r = rws(r, out.length); out.push(d); }
    return out;
  }
  function ensureQuests() {
    if (!S.quests) S.quests = {}; const q = S.quests, dk = dayKey(), wk = weekKey();
    if (q.day !== dk) { q.day = dk; q.bonus = 0; q.d = roll(QD_DAY, 3, user + dk, (r, i) => Object.assign({}, RW_DAY[(i + Math.floor(r() * 4)) % 4])); }
    if (q.week !== wk) { q.week = wk; q.w = roll(QD_WEEK, 4, user + wk, r => ({ money: 6000, 'rare-candy': 2, [STONES[Math.floor(r() * STONES.length)]]: 1 })); }
    return q;
  }
  function track(ev, n = 1, m) {
    if (!S) return; const q = ensureQuests(); let done = 0;
    for (const x of [...q.d, ...q.w]) { if (x.p >= x.n) continue;
      if (x.k === ev && (ev !== 'catchT' || (m && D.mons[m.id].t.includes(x.t)))) { x.p = Math.min(x.n, x.p + n); if (x.p >= x.n) done++; } }
    if (ev === 'catch' && m) track('catchT', 1, m);
    if (done) { SFX.coin(); toast(`📜 Missão concluída! Resgate em Mais → Missões.`, 'good'); }
    checkAch();
  }
  A.track = track;
  const questClaimable = () => { if (!S || !S.quests || !S.quests.d) return 0; const q = S.quests; return [...q.d, ...q.w].filter(x => x.p >= x.n && !x.c).length + (q.d.every(x => x.c) && !q.bonus ? 1 : 0); };
  const DAY_BONUS = { 'ultra-ball': 3, 'rare-candy': 1 };
  function vQuests() {
    const q = ensureQuests(); const h = new Date(); const left = 24 - h.getHours();
    const row = (x, i, w) => `<div class="quest ${x.c ? 'done' : x.p >= x.n ? 'ready' : ''}"><span class="qi">${qIcon(x)}</span><div class="grow"><b>${qText(x)}</b><div class="progress"><i style="width:${x.p / x.n * 100}%"></i></div><small class="mut">${x.p}/${x.n} • ${rewardIcons(x.r)}</small></div>
      ${x.c ? '<span class="qok">✅</span>' : `<button class="btn small ${x.p >= x.n ? 'primary pulse' : ''}" ${x.p >= x.n ? '' : 'disabled'} data-a="qclaim" data-w="${w}" data-i="${i}">Resgatar</button>`}</div>`;
    const allc = q.d.every(x => x.c);
    return `<div class="card qhead"><h3>📜 Missões</h3><p class="mut small">Diárias renovam à meia-noite (faltam ~${left}h) • semanais toda segunda-feira.</p></div>
      <div class="card"><h3>☀️ Hoje</h3>${q.d.map((x, i) => row(x, i, 'd')).join('')}<div class="quest bonus ${q.bonus ? 'done' : allc ? 'ready' : ''}"><span class="qi">🎁</span><div class="grow"><b>Bônus: complete as 3 diárias</b><small class="mut">${rewardIcons(DAY_BONUS)}</small></div>${q.bonus ? '<span class="qok">✅</span>' : `<button class="btn small ${allc ? 'primary pulse' : ''}" ${allc ? '' : 'disabled'} data-a="qbonus">Abrir</button>`}</div></div>
      <div class="card"><h3>📅 Semana</h3>${q.w.map((x, i) => row(x, i, 'w')).join('')}</div>`;
  }
  ACT.qclaim = d => { const q = ensureQuests(), x = q[d.w][+d.i]; if (!x || x.c || x.p < x.n) return; x.c = 1; addItems(x.r); S.stats.questsDone = (S.stats.questsDone || 0) + 1; SFX.caught(); toast(`🎉 ${rewardText(x.r)}`, 'good'); checkAch(); save(); render(); };
  ACT.qbonus = () => { const q = ensureQuests(); if (q.bonus || !q.d.every(x => x.c)) return; q.bonus = 1; addItems(DAY_BONUS); SFX.win(); toast(`🎁 Bônus diário: ${rewardText(DAY_BONUS)}`, 'good'); save(); render(); };

  // ---------- Pokédex com recompensas ----------
  const dexTotal = () => Object.keys(D.mons).length;
  const DEXM = [[10, { 'great-ball': 10 }], [25, { 'ultra-ball': 5, 'rare-candy': 3 }], [50, { 'shiny-charm': 1, 'rare-candy': 5 }], [75, { 'super-rod': 1, money: 20000 }], [100, { 'master-ball': 1, 'rare-candy': 5 }],
    [150, { 'master-ball': 1, 'fire-stone': 1, 'water-stone': 1, 'thunder-stone': 1, 'leaf-stone': 1 }], [200, { 'master-ball': 2, 'rare-candy': 10 }], [251, { 'master-ball': 3, money: 100000 }], ['all', { special: 1 }]];
  const dmN = x => x === 'all' ? dexTotal() : x;
  const dexClaimable = () => { if (!S) return 0; const ca = Object.keys(S.dex.caught).length; return DEXM.filter(([k]) => ca >= dmN(k) && !(S.dexm || {})[k]).length; };
  function dexRewardsCard() {
    const ca = Object.keys(S.dex.caught).length, dm = S.dexm || {}, nx = DEXM.find(([k]) => ca < dmN(k));
    const prev = [...DEXM].reverse().find(([k]) => ca >= dmN(k)), lo = prev ? dmN(prev[0]) : 0, hi = nx ? dmN(nx[0]) : lo;
    return `<div class="card dexrw"><div class="row between"><h3>🏅 Recompensas da Pokédex</h3><small class="mut">${nx ? `próxima: ${dmN(nx[0])}` : 'completa!'}</small></div><div class="progress gold"><i style="width:${nx ? (ca - lo) / (hi - lo) * 100 : 100}%"></i></div>
      <div class="dmlist">${DEXM.map(([k, r]) => { const n = dmN(k), got = dm[k], ok = ca >= n;
        return `<div class="dm ${got ? 'got' : ok ? 'ready' : ''}"><b>${n}</b><div class="dmr">${r.special ? '<span class="rw">⭐ Celebi ✨ especial</span>' : rewardIcons(r)}</div>${got ? '<small>✅</small>' : ok ? `<button class="btn small primary pulse" data-a="dexclaim" data-k="${k}">Pegar</button>` : `<small class="mut">${ca}/${n}</small>`}</div>`; }).join('')}</div>
      <p class="mut small">✨ Shinies encontrados: <b>${S.stats.shinies || 0}</b> • chance atual 1/${Math.round(1 / shinyP())}${S.bag['shiny-charm'] ? ' (Amuleto Brilhante ativo)' : ''}</p></div>`;
  }
  ACT.dexclaim = d => { const k = d.k === 'all' ? 'all' : +d.k, e = DEXM.find(x => x[0] === k); S.dexm = S.dexm || {}; if (!e || S.dexm[k] || Object.keys(S.dex.caught).length < dmN(k)) return;
    S.dexm[k] = Date.now(); const r = e[1];
    if (r.special) { const m = PE.makeMon(251, 50, st, { shiny: true, ot: S.trainer, caughtAt: 'Prêmio Pokédex completa' }); m.nick = 'Celebi'; addCaught(m); S.stats.shinies++; if (S.party.length < 6) S.party.push(m); else S.box.push(m); S.bag['master-ball'] = (S.bag['master-ball'] || 0) + 5;
      save(); SFX.shiny(); return modal(`<div class="center caughtm"><div class="burstbg"></div><img class="bigspr shiny-glow" src="${spr(m)}" alt=""><h2>Pokédex completa! 🏆</h2><p>Você ganhou um <b>Celebi ✨ shiny</b> Nv 50 e 5 Master Balls!</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`); }
    addItems(r); save(); SFX.caught();
    modal(`<div class="center badgewin"><div class="bigbadge megab">${r['shiny-charm'] ? itemImg('shiny-charm') : '🏅'}</div><h2>Marco de ${dmN(k)} capturados!</h2><p>${rewardText(r)}</p>${r['shiny-charm'] ? '<p class="mut small">O Amuleto Brilhante triplica a chance de shiny!</p>' : ''}${r['super-rod'] ? '<p class="mut small">Agora você pode pescar os Pokémon mais raros!</p>' : ''}<button class="btn primary wide" data-a="close">Oba!</button></div>`); render(); };

  // ---------- shiny: efeito de encontro ----------
  SFX.shiny = () => { [1319, 1568, 1976, 2637, 3136].forEach((f, i) => tone(f, 0.18, 'sine', 0.06, i * 0.08)); [659, 988].forEach((f, i) => tone(f, 0.5, 'triangle', 0.05, 0.4 + i * 0.12)); };
  function shinyBurst() { const ov = document.createElement('div'); ov.className = 'shinyburst'; ov.innerHTML = '<b>✨ SHINY! ✨</b>' + '<i></i>'.repeat(14); ($('#battle') || document.body).appendChild(ov); setTimeout(() => ov.remove(), 2200); }

  // ---------- pesca ----------
  const RODS = {
    'old-rod': { n: 'Vara Velha', win: 950, pool: [[129, 70, 5, 12], [60, 12, 6, 12], [118, 12, 6, 12], [72, 6, 6, 12]] },
    'good-rod': { n: 'Vara Boa', win: 800, pool: [[60, 14, 15, 25], [118, 14, 15, 25], [116, 10, 15, 25], [98, 10, 15, 25], [120, 10, 15, 25], [54, 10, 15, 25], [79, 8, 15, 25], [170, 8, 15, 25], [129, 14, 15, 25], [147, 2, 15, 20]] },
    'super-rod': { n: 'Super Vara', win: 650, pool: [[119, 12, 30, 42], [121, 8, 32, 42], [130, 8, 30, 40], [99, 10, 30, 42], [117, 10, 30, 42], [171, 10, 30, 42], [222, 8, 30, 42], [211, 8, 30, 42], [224, 8, 30, 42], [226, 6, 30, 42], [147, 5, 30, 38], [131, 3, 35, 45]] },
  };
  const ROD_ORDER = ['super-rod', 'good-rod', 'old-rod'];
  const ROD_SHOP = [['good-rod', 8000, 3], ['super-rod', 30000, 6]];
  const isWater = mp => mp && (mp.theme === 'water' || /lago|lake|rio|mar|praia|cabo|ilha/i.test(mp.name));
  A.isWater = isWater;
  ACT.fish = async d => {
    const mp = C.MAPS.find(m => m.id === sub); if (!isWater(mp)) return;
    if (!S.party.some(m => m.hp > 0)) return toast('Seus Pokémon estão sem energia! Vá ao Centro Pokémon.', 'bad');
    if (!ROD_ORDER.some(k => S.bag[k])) { S.bag['old-rod'] = 1; save(); SFX.caught(); return modal(`<div class="center badgewin"><div class="bigbadge megab">${itemImg('old-rod')}</div><h2>Um pescador te deu uma Vara Velha!</h2><p class="mut">“Pesque à vontade! Quando a boia afundar, puxe rápido!”</p><button class="btn primary wide" data-a="fish">🎣 Pescar agora</button></div>`); }
    const owned = ROD_ORDER.filter(k => S.bag[k]); const rod = d.rod && S.bag[d.rod] ? d.rod : (S.lastRod && S.bag[S.lastRod] ? S.lastRod : owned[0]); S.lastRod = rod;
    fishGame(mp, rod, owned);
  };
  let fishSt = null;
  function fishGame(mp, rod, owned) {
    const R0 = RODS[rod];
    const m = modal(`<div class="fishg"><h3>🎣 ${R0.n} • ${mp.name}</h3>${owned.length > 1 ? `<div class="seg">${owned.map(k => `<button class="${k === rod ? 'on' : ''}" data-a="fish" data-rod="${k}">${RODS[k].n}</button>`).join('')}</div>` : ''}
      <div class="pond per-${period()}" id="pond"><div class="line"></div><div class="bob" id="bob"></div><div class="rip"></div><div class="fishshadow"></div><div class="bite hidden" id="bite">!</div></div>
      <p id="fishT" class="center">Lançando a linha…</p><button class="btn primary big wide" id="fishBtn">🎣 Puxar!</button><button class="btn ghost wide" data-a="close">Sair</button></div>`, 'fishm');
    const tok = {}; fishSt = tok; let phase = 'wait', biteAt = 0; SFX.throw();
    const T = $('#fishT', m), bob = $('#bob', m), pond = $('#pond', m);
    const delay = 1400 + R() * 3200;
    (async () => { const nib = Math.floor(R() * 3); for (let i = 0; i < nib; i++) { await sleep(delay / (nib + 1)); if (fishSt !== tok || phase !== 'wait') return; bob.classList.add('nib'); tone(300, 0.05, 'sine', 0.04); await sleep(250); bob.classList.remove('nib'); }
      await sleep(delay / (nib + 1)); if (fishSt !== tok || phase !== 'wait') return; T.textContent = 'Esperando…';
      phase = 'bite'; biteAt = performance.now(); bob.classList.add('dip'); pond.classList.add('biting'); $('#bite', m).classList.remove('hidden'); tone(1400, 0.12, 'square', 0.07); tone(1800, 0.12, 'square', 0.06, 0.1); T.innerHTML = '<b>Fisgou! PUXE!</b>';
      await sleep(R0.win); if (fishSt !== tok || phase !== 'bite') return; phase = 'end'; bob.classList.remove('dip'); $('#bite', m).classList.add('hidden'); pond.classList.remove('biting'); T.textContent = 'Ah… o Pokémon escapou. Tente de novo!'; SFX.escape(); again(); })();
    T.textContent = 'Esperando a boia afundar…';
    const again = () => { const b = $('#fishBtn', m); b.textContent = '🎣 Lançar de novo'; b.onclick = () => ACT.fish({ rod }); };
    $('#fishBtn', m).onclick = async () => {
      if (phase === 'wait') { phase = 'end'; T.textContent = 'Cedo demais! Você espantou o Pokémon.'; SFX.escape(); return again(); }
      if (phase !== 'bite') return; phase = 'end'; const rt = Math.round(performance.now() - biteAt);
      T.innerHTML = `<b>Pegou!</b> <small class="mut">(${rt} ms)</small>`; SFX.click2(); S.stats.fished = (S.stats.fished || 0) + 1; track('fish');
      const pool = R0.pool, tot = pool.reduce((a, b) => a + b[1], 0); let r = R() * tot, k = 0; while (k < pool.length - 1 && r > pool[k][1]) r -= pool[k++][1];
      const e = pool[k], mon = PE.makeMon(e[0], PE.ri(st, e[2], e[3]), st, { shinyRate: A.shinyRate || shinyP() }); mon.caughtAt = mp.name + ' (pesca)';
      pond.classList.add('splash'); noise(0.3, 0.15); await sleep(700); closeModal();
      startBattle({ kind: 'wild', enemy: [mon], map: mp, weather: battleWeather(weatherOf(mp)), fish: 1 });
    };
  }

  // ---------- mini-jogo: Quem é esse Pokémon? ----------
  const QUIZ_ROUNDS = 5, QUIZ_COIN = 400;
  function quizState() { S.mini = S.mini || {}; const dk = dayKey(); if (S.mini.day !== dk) { S.mini.day = dk; S.mini.n = 0; S.mini.right = 0; } return S.mini; }
  function vGames() {
    const q = quizState(), left = QUIZ_ROUNDS - q.n; const fishMaps = C.MAPS.filter(isWater).filter(mp => mapUnlocked(mp)).map(mp => mp.name);
    return `<div class="grid"><div class="card quizcard"><div class="quizhero"><img class="sil" src="${sprId(25)}" alt=""><span>?</span></div><h3>❓ Quem é esse Pokémon?</h3><p class="mut small">Adivinhe pela silhueta! ${QUIZ_ROUNDS} rodadas por dia • ${fmt(QUIZ_COIN)} por acerto.</p>
      <p>Hoje: <b>${q.right}</b> acertos • ${left > 0 ? `${left} rodada(s) restante(s)` : 'volte amanhã!'}</p><button class="btn primary big wide" data-a="quiz" ${left > 0 ? '' : 'disabled'}>${q.n ? 'Continuar' : 'Jogar'}</button></div>
      <div class="card"><h3>🎣 Pesca</h3><p class="mut small">Em mapas com água, toque em <b>🎣 Pescar</b>. Quando a boia afundar e aparecer <b>!</b>, puxe rápido.</p>
      <div class="rods">${ROD_ORDER.slice().reverse().map(k => `<div class="rod ${S.bag[k] ? '' : 'locked'}">${itemImg(k)}<small>${RODS[k].n}</small></div>`).join('')}</div>
      <p class="small">${fishMaps.length ? '📍 ' + fishMaps.join(', ') : '📍 Libere o Cabo de Cerulean (2 insígnias).'}</p><p class="mut small">Vara Boa e Super Vara: na Loja (3 e 6 insígnias) ou no marco 75 da Pokédex.</p></div></div>`;
  }
  const mapUnlocked = mp => { try { return unlocked(mp); } catch (e) { return true; } };
  ACT.quiz = () => {
    const q = quizState(); if (q.n >= QUIZ_ROUNDS) return toast('Volte amanhã para jogar de novo!');
    const ids = Object.keys(D.mons).map(Number).filter(i => i <= 251), r = () => ids[Math.floor(R() * ids.length)];
    const ans = r(), opts = new Set([ans]); while (opts.size < 4) opts.add(r()); const ol = [...opts].sort(() => R() - 0.5);
    const m = modal(`<div class="quiz center"><small class="mut">Rodada ${q.n + 1}/${QUIZ_ROUNDS}</small><h3>Quem é esse Pokémon?</h3><div class="quizimg"><img id="qimg" class="sil" src="${sprId(ans)}" alt=""></div>
      <div class="qopts">${ol.map(id => `<button class="btn" data-id="${id}">${D.mons[id].n}</button>`).join('')}</div><p id="qres"></p><div class="mbtns"><button class="btn primary wide hidden" id="qnext"></button></div></div>`, 'quizm');
    m.dataset.lock = 1; tone(660, 0.1, 'square', 0.05); tone(880, 0.1, 'square', 0.05, 0.12);
    $$('.qopts button', m).forEach(b => b.onclick = () => {
      if (m.dataset.done) return; m.dataset.done = 1; const ok = +b.dataset.id === ans; q.n++; $('#qimg', m).classList.remove('sil'); $('#qimg', m).classList.add('reveal'); cry(ans);
      $$('.qopts button', m).forEach(x => { if (+x.dataset.id === ans) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
      if (ok) { q.right++; S.money += QUIZ_COIN; S.stats.quizRight = (S.stats.quizRight || 0) + 1; SFX.coin(); $('#qres', m).innerHTML = `<b>É o ${D.mons[ans].n}!</b> +${fmt(QUIZ_COIN)}`; track('quiz'); }
      else { SFX.escape(); $('#qres', m).innerHTML = `Era o <b>${D.mons[ans].n}</b>!`; }
      see(ans); save(); const nx = $('#qnext', m); nx.classList.remove('hidden');
      if (q.n < QUIZ_ROUNDS) { nx.textContent = 'Próxima ▶'; nx.onclick = () => { closeModal(); ACT.quiz(); }; } else { nx.textContent = `Fim! ${q.right}/${QUIZ_ROUNDS} acertos`; nx.onclick = () => { closeModal(); render(); }; }
    });
  };

  // ---------- conquistas e títulos ----------
  const dexC = () => Object.keys(S.dex.caught).length;
  const ACH = [
    ['first', '🔴', 'Primeira captura', 'Capture 1 Pokémon', () => S.stats.caught >= 1, 'Novato'],
    ['c50', '🎒', 'Colecionador', 'Registre 50 capturados', () => dexC() >= 50, 'Colecionador'],
    ['c151', '📕', 'Kanto completo', 'Registre 151 capturados', () => dexC() >= 151, 'Pesquisador'],
    ['call', '🏆', 'Mestre Pokémon', 'Complete a Pokédex', () => dexC() >= dexTotal(), 'Mestre Pokémon'],
    ['shiny1', '✨', 'Brilho raro', 'Encontre 1 shiny', () => (S.stats.shinies || 0) >= 1, 'Caçador de Brilhos'],
    ['shiny5', '🌟', 'Caçador de shinies', 'Encontre 5 shinies', () => (S.stats.shinies || 0) >= 5, 'Lenda Brilhante'],
    ['fish1', '🎣', 'Primeira fisgada', 'Fisgue 1 Pokémon', () => (S.stats.fished || 0) >= 1, 'Pescador'],
    ['fish50', '🐟', 'Mestre pescador', 'Fisgue 50 Pokémon', () => (S.stats.fished || 0) >= 50, 'Mestre Pescador'],
    ['w50', '⚔️', 'Batalhador', 'Vença 50 batalhas', () => S.stats.wins >= 50, 'Batalhador'],
    ['w500', '🛡️', 'Veterano', 'Vença 500 batalhas', () => S.stats.wins >= 500, 'Veterano'],
    ['b8', '🎖️', 'Oito insígnias', 'Ganhe as 8 insígnias de Kanto', () => S.badges.length >= 8, 'Desafiante'],
    ['champ', '👑', 'Campeão', 'Vença a Liga de Kanto', () => !!S.champion, 'Campeão'],
    ['jchamp', '🌸', 'Campeão de Johto', 'Vença a Liga de Johto', () => !!S.jchampion, 'Lenda de Johto'],
    ['nat', '🌈', 'Fã de Eevee', 'Vença a Nat', () => !!(S.nat && S.nat.wins), 'Mestre Eevee'],
    ['egg5', '🥚', 'Criador', 'Choque 5 ovos', () => (S.stats.hatched || 0) >= 5, 'Criador'],
    ['q10', '📜', 'Dedicado', 'Resgate 10 missões', () => (S.stats.questsDone || 0) >= 10, 'Dedicado'],
    ['quiz20', '👁️', 'Olho de águia', 'Acerte 20 no "Quem é esse Pokémon?"', () => (S.stats.quizRight || 0) >= 20, 'Olho de Águia'],
    ['mega', '💎', 'Mega Evolução', 'Mega Evolua em batalha', () => (S.stats.megas || 0) >= 1, 'Mega Mestre'],
    ['dmax', '⬣', 'Gigante', 'Dinamax em batalha', () => (S.stats.dmaxes || 0) >= 1, 'Gigante'],
    ['tower10', '🗼', 'Escalador', 'Chegue ao andar 10 da Torre', () => S.tower.best >= 10, 'Escalador'],
    ['rich', '💰', 'Magnata', 'Tenha ₽1.000.000', () => S.money >= 1e6, 'Magnata'],
    ['play10', '⏳', 'Viciado', 'Jogue 10 horas', () => S.stats.playMs >= 36e6, 'Viciado'],
  ];
  function checkAch() {
    if (!S || !S.trainer) return; S.ach = S.ach || {}; const first = !S.achInit, nw = [];
    for (const a of ACH) if (!S.ach[a[0]]) { let ok = false; try { ok = a[4](); } catch (e) {} if (ok) { S.ach[a[0]] = Date.now(); nw.push(a); } }
    if (first) { S.achInit = 1; if (nw.length) setTimeout(() => toast(`🏆 ${nw.length} conquista(s) desbloqueada(s)! Veja em Mais → Conquistas.`, 'good'), 1500); return; }
    nw.forEach((a, i) => setTimeout(() => { SFX.lvl(); toast(`🏆 Conquista: <b>${a[2]}</b> • título “${a[5]}”`, 'good'); }, 400 + i * 900));
  }
  A.checkAch = checkAch;
  const titleOf = () => { if (S.title && S.title.startsWith('ps-')) return (S.passTitles || {})[S.title] ? passTitle(S.title) : null; const a = ACH.find(x => x[0] === S.title); return a && S.ach && S.ach[a[0]] ? a[5] : null; };
  function vAch() {
    S.ach = S.ach || {}; const n = ACH.filter(a => S.ach[a[0]]).length;
    return `<div class="card"><div class="row between"><h3>🏆 Conquistas</h3><b>${n}/${ACH.length}</b></div><div class="progress gold"><i style="width:${n / ACH.length * 100}%"></i></div><p class="mut small">Toque numa conquista desbloqueada para usar o título no seu Cartão de Treinador.${titleOf() ? ` Título atual: <b>${titleOf()}</b>` : ''}</p></div>
      <div class="achgrid">${ACH.map(a => { const got = S.ach[a[0]]; return `<button class="ach ${got ? 'got' : ''} ${S.title === a[0] ? 'sel' : ''}" ${got ? `data-a="settitle" data-k="${a[0]}"` : ''}><span class="ae">${got ? a[1] : '🔒'}</span><b>${a[2]}</b><small>${a[3]}</small><i>“${a[5]}”</i></button>`; }).join('')}</div>`;
  }
  ACT.settitle = d => { S.title = S.title === d.k ? null : d.k; save(); SFX.click2(); toast(S.title ? `Título: ${titleOf()}` : 'Título removido'); render(); };

  // ---------- música chiptune procedural ----------
  const MUS = (() => {
    const mid = n => 440 * 2 ** ((n - 69) / 12);
    const SC = { maj: [0, 2, 4, 7, 9, 12, 14, 16], min: [0, 2, 3, 5, 7, 8, 10, 12] };
    function build(name, cfg) {
      const r = srng(hseed('pkl-' + name)), lead = [], bass = [], drum = [], steps = cfg.bars * 16;
      for (let s = 0; s < steps; s++) { const ch = cfg.prog[Math.floor(s / 16) % cfg.prog.length], sc = SC[cfg.scale];
        // baixo
        bass.push(s % cfg.bstep === 0 ? cfg.root - 12 + ch + (s % 8 === 4 && cfg.bstep < 4 ? 7 : 0) : null);
        // melodia (motivo repetido a cada 2 compassos com variação)
        const ms = s % 32; let note = null;
        if (s < 32 || r() < 0.3) { if (r() < cfg.dens) note = cfg.root + 12 + ch + sc[Math.floor(r() * 5)]; lead[s] = note; } else lead[s] = lead[ms] != null ? lead[ms] + (s >= steps - 16 && ms % 8 === 0 ? 0 : 0) : null;
        drum.push(cfg.drums ? (s % 8 === 0 ? 'k' : s % 8 === 4 ? 's' : s % 2 === 0 ? 'h' : null) : null);
      }
      return { ...cfg, lead, bass, drum, steps };
    }
    const THEMES = {
      map: build('map', { bpm: 108, bars: 8, prog: [0, -3, -7, -5], scale: 'maj', root: 60, dens: 0.45, bstep: 4, drums: true, wave: 'square', loop: true }),
      night: build('night', { bpm: 84, bars: 8, prog: [0, -4, -2, -5], scale: 'min', root: 57, dens: 0.3, bstep: 8, drums: false, wave: 'triangle', loop: true }),
      battle: build('battle', { bpm: 156, bars: 8, prog: [0, 0, -4, -2, 0, 0, 1, -1], scale: 'min', root: 57, dens: 0.7, bstep: 2, drums: true, wave: 'square', loop: true }),
    };
    const VIC = [[72, 2], [72, 1], [72, 1], [76, 4], [74, 2], [74, 1], [74, 1], [77, 4], [79, 2], [77, 1], [76, 1], [74, 2], [72, 1], [74, 1], [76, 8], [null, 4]];
    THEMES.victory = { bpm: 140, loop: false, wave: 'square', steps: VIC.reduce((a, b) => a + b[1], 0), lead: [], bass: [], drum: [] };
    { let s = 0; for (const [n, l] of VIC) { THEMES.victory.lead[s] = n; THEMES.victory.bass[s] = n ? n - 24 : null; s += l; } }
    let cur = null, want = null, step = 0, nextT = 0, timer = null, gain = null, endAt = 0;
    const on = () => S && S.settings.music !== false;
    function vol() { return on() ? (S.settings.mvol ?? 0.35) * 0.5 : 0; }
    function voice(c, f, t, d, type, v) { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(gain); o.start(t); o.stop(t + d + 0.02); }
    function drumHit(c, k, t) { if (k === 'k') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(gain); o.start(t); o.stop(t + 0.16); return; }
      const len = k === 's' ? 0.1 : 0.03, b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = k === 's' ? 0.25 : 0.08; s.connect(g).connect(gain); s.start(t); }
    function tick() {
      const c = ac; if (!c || !cur || c.state !== 'running') return; const th = THEMES[cur], sd = 60 / th.bpm / 4;
      if (nextT < c.currentTime) nextT = c.currentTime + 0.05;
      while (nextT < c.currentTime + 0.2) { const s = step % th.steps;
        if (!th.loop && step >= th.steps) { const w = want; cur = null; if (w && w !== 'victory') setTimeout(() => play(w), 300); return; }
        if (th.lead[s] != null) { let l = 1; while (l < 8 && th.lead[s + l] === undefined && !th.loop) l++; voice(c, mid(th.lead[s]), nextT, th.loop ? sd * 1.6 : sd * l * 0.95, th.wave, 0.09); }
        if (th.bass[s] != null) voice(c, mid(th.bass[s]), nextT, th.loop ? sd * 1.8 : sd * 4, 'triangle', 0.16);
        if (th.drum[s]) drumHit(c, th.drum[s], nextT);
        step++; nextT += sd; }
    }
    function play(name) {
      want = name === 'victory' ? want : name; const c = ac; if (!c) return; if (!gain) { gain = c.createGain(); gain.connect(c.destination); }
      gain.gain.setTargetAtTime(vol(), c.currentTime, 0.05); if (!on()) { cur = null; return; }
      if (cur === name) return; if (cur === 'victory' && name !== 'victory') { want = name; return; }
      cur = name; step = 0; nextT = c.currentTime + 0.08; if (!timer) timer = setInterval(tick, 60); tick();
    }
    return { want(name) { want = name; if (ac && ac.state === 'running') play(name); }, kick() { if (want && ac) play(want); }, victory() { const w = want; play('victory'); want = w; },
      stop() { cur = null; }, refresh() { if (gain && ac) gain.gain.setTargetAtTime(vol(), ac.currentTime, 0.05); if (!on()) cur = null; else if (want) play(want); }, get cur() { return cur; }, THEMES };
  })();
  A.MUS = MUS;
  A.debug.closeBattle = () => closeBattle();
  const mapTheme = () => period() === 'night' ? 'night' : 'map';
  document.addEventListener('click', () => { if (S && S.trainer) { if (!MUS.cur) MUS.want(B ? 'battle' : mapTheme()); MUS.kick(); } }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) MUS.stop(); });
  ACT.setvol = d => { S.settings[d.k] = +d.v; save(); MUS.refresh(); render(); };
  ACT.setmus = d => { S.settings.music = d.v === 'true'; save(); MUS.refresh(); if (S.settings.music) MUS.want(mapTheme()); render(); };
  function audioSettings() {
    const vs = [[0, '0'], [0.15, 'Baixo'], [0.35, 'Médio'], [0.6, 'Alto']];
    return `<div class="setrow"><span>🎵 Música</span><div class="seg">${[[true, 'Ligada'], [false, 'Desligada']].map(([v, l]) => `<button class="${(S.settings.music !== false) === v ? 'on' : ''}" data-a="setmus" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="setrow"><span>Volume da música</span><div class="seg">${vs.slice(1).map(([v, l]) => `<button class="${(S.settings.mvol ?? 0.35) === v ? 'on' : ''}" data-a="setvol" data-k="mvol" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="setrow"><span>Volume dos efeitos</span><div class="seg">${[[0.4, 'Baixo'], [0.8, 'Médio'], [1.2, 'Alto']].map(([v, l]) => `<button class="${(S.settings.svol ?? 0.8) === v ? 'on' : ''}" data-a="setvol" data-k="svol" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  }

  // =====================================================================
  // v5: Safári, Raides Dinamax, Lendas, Revanche/Torneio, Seguidor, Estilo/Casa, Login, Naturezas/IVs
  // =====================================================================
  Object.assign(C.ITEM_NAME, { 'safari-ball': 'Safari Ball', 'silver-wing': 'Asa Prateada', 'rainbow-wing': 'Asa Arco-Íris', 'wishing-piece': 'Peça dos Desejos' });
  Object.assign(KEY_ITEMS, { 'silver-wing': 'Uma pena que acalma o guardião dos mares. Leve às Ilhas Redemoinho.', 'rainbow-wing': 'Brilha com sete cores. O guardião do céu responde a ela na Torre do Sino.',
    'wishing-piece': 'Jogue numa Toca Dinamax para abrir um Raide extra hoje.', 'safari-ball': 'Só funciona dentro da Zona Safári.' });
  const SNP = ['HP', 'Ataque', 'Defesa', 'At. Esp.', 'Def. Esp.', 'Veloc.'];
  const natTxt = m => { const n = PE.NATURES[m.nat ?? 0]; return n[1] === n[2] ? `${n[0]} (neutra)` : `${n[0]} (+${SNP[n[1]]} −${SNP[n[2]]})`; };
  const pickCount = (arr, n, r) => { const a = arr.slice(), o = []; while (o.length < n && a.length) o.push(a.splice(Math.floor(r() * a.length), 1)[0]); return o; };
  const avgLvl = () => Math.round(S.party.reduce((a, m) => a + m.lvl, 0) / Math.max(1, S.party.length));
  const bestNat = id => { const b = D.mons[id].s, phys = b[1] >= b[3], fast = b[5] >= 85; return phys ? (fast ? 13 : 3) : (fast ? 10 : 15); };

  // ---------- naturezas: retro para Pokémon antigos ----------
  function retroNatures() {
    if (S.natFix) return; let n = 0;
    for (const m of [...S.party, ...S.box, ...(S.daycare.slots || []).map(x => x && (x.m || x))].filter(Boolean)) { if (!m.id || m.nat != null) continue;
      const gift = /Presente|Prêmio|Elm|Laboratório/i.test(m.caughtAt || '') || (m.iv && m.iv.every(v => v >= 31));
      const old = PE.maxhp(m); m.nat = gift ? bestNat(m.id) : Math.floor(R() * 25); if (!m.iv) m.iv = [0, 0, 0, 0, 0, 0].map(() => Math.floor(R() * 32));
      if (gift) m.iv = m.iv.map(v => Math.max(v, 25)); m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(PE.maxhp(m), m.hp + PE.maxhp(m) - old)); n++; }
    S.natFix = Date.now(); save(); if (n) setTimeout(() => toast(`🧬 Naturezas reveladas para ${n} Pokémon! Veja no resumo de cada um.`, 'good'), 2200);
  }
  A.retroNatures = retroNatures;
  function judge(m) {
    const iv = m.iv || [0, 0, 0, 0, 0, 0], tot = iv.reduce((a, b) => a + b, 0), pct = Math.round(tot / 186 * 100);
    const g = v => v >= 31 ? ['Perfeito!', 'p'] : v >= 30 ? ['Fantástico', 'f'] : v >= 26 ? ['Muito bom', 'm'] : v >= 16 ? ['Bom', 'b'] : v >= 1 ? ['Razoável', 'r'] : ['Nada bom...', 'n'];
    const verdict = pct >= 81 ? 'Tem um potencial maravilhoso! Isso é coisa rara.' : pct >= 65 ? 'Está bem acima da média. Que belo Pokémon!' : pct >= 49 ? 'Um Pokémon decente, com algo a mostrar.' : 'Tem um potencial modesto... mas carinho faz milagres!';
    modal(`<div class="judge"><div class="jhead"><img src="img/tr/acetrainer.png" alt=""><div><small class="mut">JUIZ DE AVALIAÇÃO</small><h3>${esc(pn(m))}</h3><p>“${verdict}”</p></div></div>
      <p class="small">🧬 Natureza: <b>${natTxt(m)}</b></p><div class="ivs">${iv.map((v, k) => { const [t, c] = g(v); return `<div class="ivr"><small>${SNP[k]}</small><div class="sbar"><i class="iv-${c}" style="width:${v / 31 * 100}%"></i></div><b class="iv-${c}">${t}</b></div>`; }).join('')}</div>
      <p class="mut small center">Potencial total: ${pct}% • Os números exatos o juiz guarda em segredo 😉</p><button class="btn primary wide" data-a="close">Obrigado!</button></div>`);
  }
  A.judge = judge;
  ACT.setfollow = d => { S.settings.follow = d.v === 'true'; save(); render(); };

  // ---------- login diário (calendário) ----------
  const DAILY2 = [{ money: 1000, 'poke-ball': 5 }, { money: 1500, 'great-ball': 3 }, { money: 2000, 'super-potion': 3 }, { money: 2500, 'ultra-ball': 3 }, { money: 3000, 'rare-candy': 1 }, { money: 4000, 'ultra-ball': 5, 'rare-candy': 2 }, { money: 10000, 'master-ball': 1, 'rare-candy': 3, 'wishing-piece': 1 }];
  function calendarHtml() {
    const cur = ((S.daily.streak - 1) % 7 + 7) % 7, claimedToday = S.daily.last === new Date().toDateString();
    return `<div class="cal">${DAILY2.map((r, i) => `<div class="cday ${i < cur || (i === cur && claimedToday) ? 'got' : ''} ${i === cur && claimedToday ? 'today' : ''} ${i === 6 ? 'big' : ''}"><small>Dia ${i + 1}</small><div class="crw">${i === 6 ? '<span class="cbig">🎁</span>' : ''}${rewardIcons(r)}</div>${i < cur || (i === cur && claimedToday) ? '<i>✓</i>' : ''}</div>`).join('')}</div>
      <p class="mut small">🔥 Sequência: <b>${S.daily.streak}</b> dia(s) • perder um dia volta para o Dia 1.</p>`;
  }

  // ---------- Zona Safári ----------
  const SAFARI_FEE = 1000, SAFARI_BALLS = 30, SAFARI_STEPS = 80;
  const SAFARI_POOL = [[115, 6, 25, 33], [128, 7, 25, 33], [113, 4, 25, 33], [123, 7, 25, 33], [127, 7, 25, 33], [147, 4, 22, 30], [148, 1, 32, 36], [111, 8, 25, 33], [102, 9, 24, 32], [49, 7, 26, 33], [30, 8, 24, 30], [33, 8, 24, 30],
    [84, 8, 22, 30], [241, 6, 25, 33], [203, 6, 25, 33], [214, 5, 25, 33], [234, 6, 25, 33], [246, 3, 22, 28], [179, 7, 20, 28], [207, 5, 25, 33], [227, 4, 26, 33], [231, 6, 22, 30], [143, 1, 30, 35], [132, 3, 25, 30]];
  const safariOk = () => S.badges.length >= 4;
  function vSafari() {
    const sf = S.safari;
    if (!sf) return `<div class="card safari-hero theme-safari per-${period()}"><div class="sfsky"></div><div class="sfmons">${[115, 128, 113, 123, 147, 214].map(id => `<img src="${sprId(id)}" class="${S.dex.seen[id] ? '' : 'sil'}" alt="">`).join('')}</div>
      <h2>🦏 Zona Safári</h2><p>Sem batalhas! Você recebe <b>${SAFARI_BALLS} Safari Balls</b> e <b>${SAFARI_STEPS} passos</b>. Jogue <b>Isca</b> (foge menos, captura mais difícil) ou <b>Pedra</b> (captura mais fácil, foge mais).</p>
      <p class="small">🌟 Raros: Kangaskhan, Tauros, Chansey, Scyther, Pinsir, Dratini, Heracross, Miltank, Larvitar, Skarmory…</p>
      ${safariOk() ? `<button class="btn primary big wide" data-a="sfenter" ${S.money >= SAFARI_FEE ? '' : 'disabled'}>Entrar • ${fmt(SAFARI_FEE)}</button>` : '<p class="err">🔒 Precisa de 4 insígnias.</p>'}<p class="mut small">Capturados nesta reserva: ${S.stats.safari || 0}</p></div>`;
    return `<div class="card explore theme-safari per-${period()} safari-run" id="scene"><div class="sky"><i class="sun"></i></div><div class="ground"></div><div class="grass-row tall">${'<i></i>'.repeat(12)}</div>${meHtml()}${followerHtml()}
      <div class="ex-top"><span class="chip">${itemImg('safari-ball')} ${sf.balls}</span><span class="chip">👣 ${sf.steps}</span><span class="chip">🎯 ${sf.caught.length}</span></div>
      <div class="ex-bot"><h2>🦏 Zona Safári</h2><p>Ande pela grama alta e encontre Pokémon raros!</p><div class="exbtns"><button class="btn primary big" data-a="sfwalk" id="sfwalk">👣 Andar na grama</button><button class="btn big ghost" data-a="sfleave">Sair</button></div></div></div>
      ${sf.caught.length ? `<div class="card"><h3>Capturados hoje no Safári</h3><div class="enc">${sf.caught.map(id => `<div class="encm"><img src="${sprId(id)}" alt=""><small>${D.mons[id].n}</small></div>`).join('')}</div></div>` : ''}`;
  }
  ACT.sfenter = () => { if (!safariOk() || S.money < SAFARI_FEE) return; S.money -= SAFARI_FEE; S.safari = { balls: SAFARI_BALLS, steps: SAFARI_STEPS, caught: [] }; SFX.coin(); toast('Bem-vindo à Zona Safári! Boa caçada!', 'good'); save(); render(); };
  ACT.sfleave = () => safariEnd('Você saiu da Zona Safári.');
  function safariEnd(why) { const sf = S.safari; if (!sf) return; S.safari = null; save(); render();
    modal(`<div class="center"><h2>🦏 Fim do Safári</h2><p>${why}</p><p>Capturados: <b>${sf.caught.length}</b></p><div class="enc">${sf.caught.map(id => `<div class="encm"><img src="${sprId(id)}" alt=""><small>${D.mons[id].n}</small></div>`).join('')}</div><button class="btn primary wide" data-a="close">OK</button></div>`); }
  let sfBusy = false;
  ACT.sfwalk = async () => {
    const sf = S.safari; if (!sf || sfBusy) return; sfBusy = true; const sc = $('#scene'); sc.classList.add('walking'); $('#sfwalk').disabled = true;
    const n = 3 + Math.floor(R() * 3); for (let i = 0; i < n; i++) { SFX.rustle(); const g = $$('.grass-row i', sc)[Math.floor(R() * 12)]; g?.classList.add('rustle'); setTimeout(() => g?.classList.remove('rustle'), 600); await sleep(330); }
    sf.steps = Math.max(0, sf.steps - n); track('steps', n); sc.classList.remove('walking'); sfBusy = false;
    if (R() < 0.75) { const tot = SAFARI_POOL.reduce((a, b) => a + b[1], 0); let r = R() * tot, k = 0; while (k < SAFARI_POOL.length - 1 && r > SAFARI_POOL[k][1]) r -= SAFARI_POOL[k++][1];
      const e = SAFARI_POOL[k], m = PE.makeMon(e[0], PE.ri(st, e[2], e[3]), st, { shinyRate: A.shinyRate || shinyP() }); m.caughtAt = 'Zona Safári'; see(m.id); return safariEnc(m); }
    toast('Nada por aqui… continue andando.'); if (sf.steps <= 0) return safariEnd('Acabaram seus passos!'); save(); render();
  };
  function safariEnc(m) {
    const sf = S.safari, d = D.mons[m.id]; let mood = 0, moodT = 0, done = false; if (m.shiny) { SFX.shiny(); S.stats.shinies++; } else cry(m.id);
    const mm = modal(`<div class="sfenc"><div class="sfstage per-${period()}"><img id="sfm" class="${m.shiny ? 'shiny-glow' : ''}" src="${spr(m)}" alt=""><div id="sfball" class="sfball hidden">${itemImg('safari-ball')}</div><div id="sffx" class="sffx"></div></div>
      <h3>${d.n}${m.shiny ? ' ✨' : ''} <small class="mut">Nv ${m.lvl}</small> <span id="sfmood" class="chip"></span></h3><p id="sfmsg">Um ${d.n} selvagem apareceu!</p>
      <div class="sfbtns"><button class="btn primary" data-s="ball">${itemImg('safari-ball')} Bola (<span id="sfb">${sf.balls}</span>)</button><button class="btn" data-s="bait">🍓 Isca</button><button class="btn" data-s="rock">🪨 Pedra</button><button class="btn ghost" data-s="run">🏃 Fugir</button></div></div>`, 'sfm');
    mm.dataset.lock = 1; const msg = t => $('#sfmsg', mm).innerHTML = t;
    const moodUI = () => $('#sfmood', mm).textContent = mood > 0 ? '😠 Irritado' : mood < 0 ? '😋 Comendo' : '😐 Atento';
    moodUI(); if (m.shiny) msg(`✨ Um ${d.n} <b>SHINY</b> apareceu!`);
    const finish = async why => { done = true; await sleep(1100); closeModal(); if (why) toast(why); if (sf.balls <= 0) return safariEnd('Acabaram suas Safari Balls!'); if (sf.steps <= 0) return safariEnd('Acabaram seus passos!'); save(); render(); };
    $$('.sfbtns button', mm).forEach(b => b.onclick = async () => { if (done || mm.dataset.busy) return; mm.dataset.busy = 1; const a = b.dataset.s; $$('.sfbtns button', mm).forEach(x => x.disabled = true);
      const img = $('#sfm', mm);
      if (a === 'run') { msg('Você se afastou devagar…'); return finish(); }
      if (a === 'bait') { mood = -1; moodT = 1 + Math.floor(R() * 4); msg(`Você jogou uma Isca. ${d.n} está comendo!`); $('#sffx', mm).textContent = '🍓'; tone(700, 0.1, 'sine', 0.05); }
      if (a === 'rock') { mood = 1; moodT = 1 + Math.floor(R() * 4); msg(`Você jogou uma Pedra. ${d.n} ficou irritado!`); $('#sffx', mm).textContent = '💢'; noise(0.1, 0.12); img.classList.add('shake'); setTimeout(() => img.classList.remove('shake'), 400); }
      if (a === 'ball') { sf.balls--; $('#sfb', mm).textContent = sf.balls; SFX.throw(); const bl = $('#sfball', mm); bl.classList.remove('hidden'); bl.classList.add('toss'); await sleep(550); img.classList.add('absorb'); await sleep(350);
        const p = Math.min(0.92, d.c / 255 * 1.6 * (mood > 0 ? 2 : mood < 0 ? 0.5 : 1) + 0.04); const shakes = R() < p ? 3 : Math.floor(R() * 3);
        for (let i = 0; i < shakes; i++) { bl.classList.add('wob'); SFX.shake(); await sleep(520); bl.classList.remove('wob'); await sleep(150); }
        if (shakes === 3) { SFX.caught(); msg(`🎉 Pegou! ${d.n} foi capturado!`); m.ot = S.trainer; m.caughtAt = 'Zona Safári • ' + new Date().toLocaleDateString('pt-BR'); const isNew = !S.dex.caught[m.id]; addCaught(m); S.stats.caught++; S.stats.safari = (S.stats.safari || 0) + 1;
          if (S.party.length < 6) S.party.push(m); else S.box.push(m); sf.caught.push(m.id); track('catch', 1, m); if (isNew) track('newdex'); return finish(isNew ? `🆕 ${d.n} registrado na Pokédex!` : ''); }
        bl.classList.add('hidden'); bl.classList.remove('toss'); img.classList.remove('absorb'); SFX.escape(); msg(['Ah, não! Escapou da bola!', 'Quase! Tão perto!', 'Argh! Foi por pouco!'][shakes]); }
      await sleep(700); $('#sffx', mm).textContent = '';
      const fl = Math.min(0.6, (0.06 + d.s[5] / 700) * (mood > 0 ? 2 : mood < 0 ? 0.35 : 1)); if (moodT > 0 && --moodT === 0) mood = 0; moodUI();
      if (R() < fl) { SFX.escape(); img.classList.add('flee'); msg(`${d.n} fugiu!`); return finish(); }
      if (sf.balls <= 0) { msg('Suas Safari Balls acabaram!'); return finish(); }
      delete mm.dataset.busy; $$('.sfbtns button', mm).forEach(x => x.disabled = false); if (a !== 'ball') msg(msg === null ? '' : $('#sfmsg', mm).innerHTML + ' O que fazer?'); });
  }

  // ---------- Raides Dinamax ----------
  const RAID_LV = [20, 32, 45, 58, 70], RAID_HP = [2, 2.6, 3.2, 3.8, 4.5], RAID_TURNS = [12, 12, 11, 10, 10], RAID_PER_DAY = 3;
  const RAID_POOL = [[1, 4, 7, 25, 133, 52, 66, 92, 129], [2, 5, 8, 58, 63, 74, 95, 111, 133], [3, 6, 9, 68, 94, 99, 12, 26, 130, 143, 131], [6, 9, 3, 131, 143, 94, 68, 149, 248, 130, 112], [6, 3, 9, 25, 52, 68, 94, 99, 131, 133, 143, 12, 149, 248]];
  function raidState() { S.raids = S.raids || {}; const dk = dayKey(); if (S.raids.day !== dk) { S.raids.day = dk; S.raids.used = 0; S.raids.extra = 0; S.raids.done = {}; } return S.raids; }
  function dens() { const r = srng(hseed((S.user || S.trainer) + 'den' + dayKey())), maxS = Math.min(5, 1 + Math.floor(S.badges.length / 2) + (S.champion ? 1 : 0)), out = [];
    for (let i = 0; i < 4; i++) { const stars = Math.max(1, Math.min(maxS, maxS - Math.floor(r() * 3) + (i === 3 ? 1 : 0))), pool = RAID_POOL[Math.min(5, stars) - 1], id = pool[Math.floor(r() * pool.length)];
      out.push({ i, stars: Math.min(5, stars), id, gmax: !!PE.GMAX[id] && r() < 0.6, name: ['Toca do Bosque', 'Toca do Lago', 'Toca da Montanha', 'Toca Lendária'][i] }); }
    return out; }
  const raidsLeft = () => { const r = raidState(); return RAID_PER_DAY + r.extra - r.used; };
  function vRaid() {
    const r = raidState(), ds = dens(), left = raidsLeft();
    return `<div class="card raidhead"><div class="row between"><h3>⬣ Raides Dinamax</h3><span class="chip">${left > 0 ? `${left} raide(s) hoje` : 'volte amanhã'}</span></div><p class="mut small">Monte um time de até 3 Pokémon contra um chefe gigante! Ele tem barreiras, pode agir duas vezes e a tempestade Dinamax dura poucos turnos. Vença para tentar capturá-lo.</p>
      ${S.bag['wishing-piece'] ? `<button class="btn small" data-a="wish">${itemImg('wishing-piece')} Usar Peça dos Desejos (${S.bag['wishing-piece']})</button>` : ''}</div>
      <div class="grid dens">${ds.map(d => { const done = r.done[d.i]; return `<div class="card den ${done ? 'done' : ''} s${d.stars}"><div class="denbeam"></div><div class="denimg"><img class="${S.dex.seen[d.id] || done ? '' : 'sil'}" src="${d.gmax ? 'img/gmax/front/' + PE.GMAX[d.id].k + '.gif' : sprId(d.id)}" alt=""></div>
        <div class="grow"><b>${d.name}</b><div class="stars">${'★'.repeat(d.stars)}<i>${'★'.repeat(5 - d.stars)}</i></div><small class="mut">${d.gmax ? '🌩️ Energia Gigamax!' : S.dex.seen[d.id] ? D.mons[d.id].n + ' Dinamax' : 'Pokémon misterioso'} • Nv ${RAID_LV[d.stars - 1]}</small></div>
        ${done ? '<span class="qok">✅</span>' : `<button class="btn small primary" ${left > 0 ? '' : 'disabled'} data-a="raidgo" data-i="${d.i}">Entrar</button>`}</div>`; }).join('')}</div>`;
  }
  ACT.wish = () => { if (!S.bag['wishing-piece']) return; S.bag['wishing-piece']--; raidState().extra++; SFX.sparkle(); toast('✨ A toca brilhou! +1 raide hoje.', 'good'); save(); render(); };
  ACT.raidgo = d => {
    const den = dens()[+d.i]; if (!den || raidsLeft() <= 0 || raidState().done[den.i]) return; const alive = S.party.filter(m => m.hp > 0); if (!alive.length) return toast('Cure seus Pokémon primeiro!', 'bad');
    let sel = alive.slice(0, 3).map(m => m.uid);
    const mm = modal(`<h3>⬣ ${den.name} ${'★'.repeat(den.stars)}</h3><p class="mut small">Escolha até 3 Pokémon (Nv ${RAID_LV[den.stars - 1]} recomendado). Todos podem Dinamaxar uma vez na toca!</p><div class="mgrid" id="rsel">${S.party.map((m, i) => `<button class="pm rs ${sel.includes(m.uid) ? 'on' : ''}" data-u="${m.uid}" ${m.hp > 0 ? '' : 'disabled'}><img src="${spr(m)}" alt=""><small>${esc(pn(m))} Nv${m.lvl}</small></button>`).join('')}</div>
      <div class="mbtns"><button class="btn" data-a="close">Cancelar</button><button class="btn primary" id="rgo">⬣ Começar raide</button></div>`);
    $$('.rs', mm).forEach(b => b.onclick = () => { const u = b.dataset.u; if (sel.includes(u)) sel = sel.filter(x => x !== u); else if (sel.length < 3) sel.push(u); $$('.rs', mm).forEach(x => x.classList.toggle('on', sel.includes(x.dataset.u))); });
    $('#rgo', mm).onclick = () => { if (!sel.length) return; closeModal(); const party = sel.map(u => S.party.find(m => m.uid === u)); raidState().used++; save(); startRaid(den, party); };
  };
  function startRaid(den, party) {
    const i = den.stars - 1, boss = PE.makeMon(den.id, RAID_LV[i], st, { shiny: false, iv: Array(6).fill(31) }); boss.dmax = { t: 999, g: den.gmax ? 1 : 0 }; boss.raidHp = RAID_HP[i]; boss.raidStars = den.stars; boss.hp = PE.maxhp(boss);
    startBattle({ kind: 'wild', enemy: [boss], party, raid: { den, left: RAID_TURNS[i], shields: 0, turn: 0 }, ai: 2, weather: null });
    const ov = $('#battle'); ov.classList.add('raid', 'dsky'); ov.querySelector('.emon').classList.add('dmax'); if (den.gmax) ov.querySelector('.emon').classList.add('gmax'); const t = document.createElement('div'); t.className = 'raidt'; t.id = 'raidt'; ov.querySelector('.bscene').appendChild(t); raidHud();
  }
  function raidHud() { const t = $('#raidt'); if (!t || !B || !B.o.raid) return; const rd = B.o.raid, bm = B.s.sides[1].b.m; t.innerHTML = `<span>🌩️ ${rd.left} turno(s)</span>${bm.shield ? `<span class="shd">${'🛡️'.repeat(bm.shield)}</span>` : ''}`; }
  async function raidAfterTurn() {
    const s = B.s, rd = B.o.raid, bm = s.sides[1].b.m, st0 = rd.den.stars; rd.turn++; rd.left--;
    if (bm.hp > 0 && !bm.shield) { const fr = bm.hp / PE.maxhp(bm); const marks = st0 >= 4 ? [0.6, 0.3] : st0 >= 2 ? [0.5] : [];
      if (rd.shields < marks.length && fr <= marks[rd.shields]) { rd.shields++; bm.shield = st0 + 1; SFX.status(); log(`🛡️ ${D.mons[bm.id].n} ergueu uma <b>barreira Dinamax</b>! (${bm.shield} golpes)`); drawInfo(1); raidHud(); await wait(1300); } }
    if (bm.hp > 0 && st0 >= 3 && rd.turn % (st0 >= 5 ? 1 : 2) === 0 && s.sides[0].b.m.hp > 0 && !s.over) { log(`⚡ ${D.mons[bm.id].n} está furioso e age de novo!`); await wait(900); await play(PE.step(s, [null, PE.aiAction(s, 1)])); rd.left++; }
    raidHud(); if (!s.over && rd.left <= 0) { s.over = true; s.winner = 1; rd.timeout = 1; }
  }
  async function raidEnd() {
    const s = B.s, o = B.o, rd = o.raid, den = rd.den; raidState().done[den.i] = 1;
    if (s.ran) { save(); return closeBattle(); }
    if (s.winner !== 0) { log(rd.timeout ? '🌩️ A tempestade Dinamax ficou forte demais e expulsou você da toca!' : 'Seu time foi derrotado na toca...'); await wait(2200); s.sides[0].party.forEach(m => { if (m.hp <= 0) m.hp = 1; }); save(); closeBattle(); return toast('O raide falhou. Tente outra toca!', 'bad'); }
    await award(); S.stats.wins++; S.stats.raids = (S.stats.raids || 0) + 1; track('win'); MUS.victory(); SFX.win();
    const rw = { money: 1500 * den.stars, 'rare-candy': den.stars, ...(R() < 0.25 + den.stars * 0.05 ? { 'wishing-piece': 1 } : {}) }; giveReward(rw); S.bp = (S.bp || 0) + den.stars;
    log(`🏆 Você venceu o raide! ${rewardText(rw)}`); await wait(1800); save(); await finishEvos(); closeBattle();
    const chance = [1, 0.9, 0.75, 0.6, 0.45][den.stars - 1], name = den.gmax ? PE.GMAX[den.id].n : D.mons[den.id].n + ' Dinamax';
    const mm = modal(`<div class="center raidwin"><div class="burstbg"></div><img class="bigspr" id="rwimg" src="${den.gmax ? 'img/gmax/front/' + PE.GMAX[den.id].k + '.gif' : sprId(den.id)}" alt=""><h2>${name} foi derrotado!</h2><p>${rewardText(rw)} + ${den.stars} PB</p>
      <p class="mut small">Ele está fraco… jogue uma bola! Chance ~${Math.round(chance * 100)}%${S.bag['master-ball'] ? ' (Master Ball garante)' : ''}.</p><div class="mbtns wrap"><button class="btn primary" data-r="poke-ball">${itemImg('poke-ball')} Poké Ball</button>${S.bag['master-ball'] ? `<button class="btn" data-r="master-ball">${itemImg('master-ball')} Master</button>` : ''}<button class="btn ghost" data-r="no">Deixar ir</button></div></div>`);
    mm.dataset.lock = 1;
    $$('[data-r]', mm).forEach(b => b.onclick = async () => { const ball = b.dataset.r; if (ball === 'no') { closeModal(); return; } if (ball === 'master-ball') S.bag['master-ball']--;
      $$('[data-r]', mm).forEach(x => x.disabled = true); SFX.throw(); await sleep(500); $('#rwimg', mm).classList.add('absorb'); for (let i = 0; i < 3; i++) { SFX.shake(); await sleep(450); }
      if (ball === 'master-ball' || R() < chance) { const iv = [0, 0, 0, 0, 0, 0].map(() => Math.floor(R() * 32)); pickCount([0, 1, 2, 3, 4, 5], Math.min(5, den.stars), R).forEach(k => iv[k] = 31);
        const m = PE.makeMon(den.id, RAID_LV[den.stars - 1], st, { shinyRate: A.shinyRate || shinyP(), iv, ot: S.trainer, caughtAt: `Raide ${'★'.repeat(den.stars)} • ${new Date().toLocaleDateString('pt-BR')}` }); if (den.gmax) m.gfactor = 1;
        const isNew = !S.dex.caught[m.id]; addCaught(m); S.stats.caught++; if (m.shiny) S.stats.shinies++; if (S.party.length < 6) S.party.push(m); else S.box.push(m); track('catch', 1, m); if (isNew) track('newdex'); save(); SFX.caught();
        modal(`<div class="center caughtm"><div class="burstbg"></div><img class="bigspr ${m.shiny ? 'shiny-glow' : ''}" src="${spr(m)}" alt=""><h2>${D.mons[m.id].n} capturado!${m.shiny ? ' ✨' : ''}</h2>${den.gmax ? '<p class="newdex">🌩️ Tem o Fator Gigamax!</p>' : ''}<p class="mut small">${Math.min(5, den.stars)} IV(s) perfeitos garantidos • Natureza ${natTxt(m).split(' (')[0]}</p><button class="btn primary wide" data-a="close">Incrível!</button></div>`); }
      else { SFX.escape(); closeModal(); toast(`${D.mons[den.id].n} escapou e voltou para a toca…`, 'bad'); } render(); });
  }

  // ---------- Lendas (missões) ----------
  const roamMap = id => { const js = C.MAPS.filter(m => m.region === 'johto' && unlocked(m)); if (!js.length) return null; return js[hseed(dayKey() + id) % js.length]; };
  const LEGQ = [
    { id: 'birds', n: 'As Três Aves Lendárias', ico: '🕊️', mons: [144, 145, 146], req: () => S.badges.length >= 5, reqT: '5 insígnias', steps: [
      { t: 'talk', npc: 'birdkeeper', who: 'Ornitólogo Bento', lines: ['Você já ouviu falar das três aves lendárias de Kanto?', 'Gelo, trovão e fogo... Cada uma se esconde onde seu elemento é mais forte.', 'Eu juntei pistas antigas. Resolva cada uma e siga as penas!'] },
      { t: 'riddle', q: '❄️ “Onde ilhas gêmeas dormem sob o mar gelado e as ondas congelam em silêncio...”', opts: ['Ilhas Seafoam', 'Mt. Moon', 'Cabo de Cerulean', 'Monte Brasa'], a: 0 },
      { t: 'hunt', id: 144, lvl: 50, map: 'seafoam', btn: '❄️ Seguir as penas congeladas', intro: 'Um vento gélido sopra... penas de gelo brilham no chão!' },
      { t: 'riddle', q: '⚡ “Onde as máquinas zumbem abandonadas e o ar estala de energia...”', opts: ['Torre Pokémon', 'Usina Elétrica', 'Floresta de Viridian', 'Estrada Vitória'], a: 1 },
      { t: 'hunt', id: 145, lvl: 50, map: 'usina', btn: '⚡ Investigar os raios no teto', intro: 'As luzes piscam... um grito elétrico ecoa pela usina!' },
      { t: 'riddle', q: '🔥 “Onde a terra sangra fogo e o céu fica laranja de calor...”', opts: ['Caverna Celeste', 'Ilhas Seafoam', 'Monte Brasa', 'Zona Safári'], a: 2 },
      { t: 'hunt', id: 146, lvl: 50, map: 'vulcao', btn: '🔥 Subir até a cratera', intro: 'Chamas dançam no topo do vulcão... algo enorme abre as asas!' }] },
    { id: 'mewtwo', n: 'O Diário de Cinnabar', ico: '🧬', mons: [150], req: () => !!S.champion, reqT: 'ser Campeão', steps: [
      { t: 'talk', npc: 'scientist', who: 'Cientista Fuji', lines: ['Campeão... preciso confessar algo.', 'Anos atrás, na Mansão de Cinnabar, criamos um Pokémon a partir do DNA de Mew.', 'Ele fugiu. As páginas do meu diário se espalharam... ponha-as em ordem e você saberá onde ele está.'] },
      { t: 'order', q: 'Toque nas páginas do diário na ordem certa:', items: ['📄 5 de julho: descobrimos um Pokémon novo na selva.', '📄 10 de julho: batizamos de Mew.', '📄 6 de fevereiro: Mew deu à luz. Chamamos de Mewtwo.', '📄 1 de setembro: Mewtwo é forte demais. Fugiu para uma caverna perto de Cerulean.'] },
      { t: 'hunt', id: 150, lvl: 70, map: 'cerulcave', btn: '🧬 Entrar no fundo da caverna', intro: 'Uma pressão psíquica esmagadora enche a caverna...' }] },
    { id: 'dogs', n: 'Os Cães Errantes', ico: '🐾', mons: [243, 244, 245], req: () => isJohtoOpen(), reqT: 'abrir Johto', steps: [
      { t: 'talk', npc: 'psychic', who: 'Eusine, o caçador místico', lines: ['Raikou, Entei e Suicune renasceram das cinzas da Torre Queimada.', 'Eles correm por Johto e mudam de lugar todo dia!', 'Vou te contar onde foram vistos hoje. Corra antes que sumam!'] },
      { t: 'hunt', id: 243, lvl: 55, roam: 1, btn: '⚡ Rastrear Raikou', intro: 'Um trovão sem nuvens! Raikou está aqui!' },
      { t: 'hunt', id: 244, lvl: 55, roam: 1, btn: '🔥 Rastrear Entei', intro: 'O chão ferve... Entei rugiu!' },
      { t: 'hunt', id: 245, lvl: 55, roam: 1, btn: '💧 Rastrear Suicune', intro: 'Um vento norte purifica a água... Suicune!' }] },
    { id: 'lugia', n: 'O Guardião dos Mares', ico: '🌊', mons: [249], req: () => isJohtoOpen() && S.jbadges.length >= 4, reqT: '4 insígnias de Johto', steps: [
      { t: 'talk', npc: 'kimonogirl', who: 'Moça de Kimono', lines: ['Nas Ruínas de Alph os Unown guardam uma palavra antiga.', 'Quem descobri-la recebe a Asa Prateada... e o guardião dos mares ouvirá seu chamado.'] },
      { t: 'riddle', q: '🔤 Os Unown formam as letras: <b class="unown">A • R • P • T • A • A • E • D • A</b> — que palavra é?', opts: ['PRATEADA', 'TAPERADA', 'PADARIA', 'ESTRADA'], a: 0 },
      { t: 'item', item: 'silver-wing', text: 'Uma pena prateada caiu das ruínas! Você recebeu a Asa Prateada.' },
      { t: 'hunt', id: 249, lvl: 70, map: 'j_redemoinho', btn: '🌀 Erguer a Asa Prateada', intro: 'O mar gira... das profundezas surge LUGIA!' }] },
    { id: 'hooh', n: 'As Cores do Arco-Íris', ico: '🌈', mons: [250], req: () => isJohtoOpen() && S.jbadges.length >= 6, reqT: '6 insígnias de Johto', steps: [
      { t: 'talk', npc: 'sage', who: 'Monge da Torre do Sino', lines: ['Ho-Oh só pousa para quem conhece as cores do arco-íris.', 'Observe as luzes do sino e repita a sequência sem errar.'] },
      { t: 'simon', n: 5 },
      { t: 'item', item: 'rainbow-wing', text: 'O sino tocou sozinho! Você recebeu a Asa Arco-Íris.' },
      { t: 'hunt', id: 250, lvl: 70, map: 'j_sino', btn: '🌈 Tocar o sino com a Asa Arco-Íris', intro: 'Um arco-íris corta o céu... HO-OH desce até o topo da torre!' }] },
  ];
  function legStep(q) { S.legq = S.legq || {}; let i = S.legq[q.id] || 0; while (i < q.steps.length && q.steps[i].t === 'hunt' && S.dex.caught[q.steps[i].id]) i++; S.legq[q.id] = i; return i; }
  const huntMap = sp => sp.roam ? roamMap(sp.id) : C.MAPS.find(m => m.id === sp.map);
  function legendHunts(mp) { const out = []; for (const q of LEGQ) { if (!q.req()) continue; const i = legStep(q), sp = q.steps[i]; if (sp && sp.t === 'hunt') { const hm = huntMap(sp); if (hm && hm.id === mp.id) out.push([q, sp]); } } return out; }
  function vLegends() {
    return `<div class="card"><h3>⭐ Lendas</h3><p class="mut small">Siga as histórias, resolva enigmas e encontre os Pokémon lendários. Quem você já tem conta como concluído!</p></div>
      <div class="grid legs">${LEGQ.map(q => { const ok = q.req(), i = legStep(q), done = i >= q.steps.length, sp = q.steps[i], hm = sp && sp.t === 'hunt' ? huntMap(sp) : null;
        return `<div class="card leg ${done ? 'done' : ''} ${ok ? '' : 'locked'}"><div class="legmons">${q.mons.map(id => `<img class="${S.dex.caught[id] ? '' : 'sil'}" src="${sprId(id)}" alt="">`).join('')}</div><h3>${q.ico} ${q.n}</h3>
          <div class="progress gold"><i style="width:${i / q.steps.length * 100}%"></i></div><small class="mut">Etapa ${Math.min(i + 1, q.steps.length)}/${q.steps.length}</small>
          <p class="small">${!ok ? `🔒 Requer ${q.reqT}.` : done ? '✅ Lenda concluída!' : sp.t === 'hunt' ? (hm ? `📍 Vá até <b>${hm.name}</b> e toque em “${sp.btn}”.${sp.roam ? ' <i>(muda todo dia)</i>' : ''}` : '📍 Libere mais mapas.') : sp.t === 'talk' ? `💬 ${sp.who} quer falar com você.` : '🧩 Um enigma espera por você.'}</p>
          ${ok && !done ? (sp.t === 'hunt' ? (hm && unlocked(hm) ? `<button class="btn small" data-a="enter" data-id="${hm.id}">Ir para ${hm.name}</button>` : '') : `<button class="btn small primary" data-a="legstep" data-q="${q.id}">Continuar</button>`) : ''}</div>`; }).join('')}</div>`;
  }
  ACT.legstep = async d => {
    const q = LEGQ.find(x => x.id === d.q); if (!q || !q.req()) return; const i = legStep(q), sp = q.steps[i]; if (!sp) return; const next = () => { S.legq[q.id] = i + 1; save(); render(); };
    if (sp.t === 'talk') { for (let k = 0; k < sp.lines.length; k++) { const last = k === sp.lines.length - 1; const v = await new Promise(res => { const m = modal(`<div class="npc"><img src="img/tr/${sp.npc}.png" alt=""><div class="bubble"><small>${sp.who}</small><p>${sp.lines[k]}</p></div></div><div class="mbtns"><button class="btn primary wide" id="nx">${last ? 'Entendi!' : 'Continuar ▶'}</button></div>`, 'npcm'); m.dataset.lock = 1; tone(500 + k * 60, 0.05, 'square', 0.03); $('#nx', m).onclick = () => res(1); }); } closeModal(); return next(); }
    if (sp.t === 'item') { S.bag[sp.item] = (S.bag[sp.item] || 0) + 1; SFX.caught(); modal(`<div class="center badgewin"><div class="bigbadge megab">${itemImg(sp.item)}</div><h2>${C.ITEM_NAME[sp.item]}</h2><p>${sp.text}</p><button class="btn primary wide" data-a="close">Guardar</button></div>`); return next(); }
    if (sp.t === 'riddle') { const m = modal(`<div class="riddle"><h3>🧩 Enigma</h3><p>${sp.q}</p><div class="qopts">${sp.opts.map((o, k) => `<button class="btn" data-k="${k}">${o}</button>`).join('')}</div><p id="rr" class="center"></p></div>`);
      $$('.qopts .btn', m).forEach(b => b.onclick = async () => { if (+b.dataset.k === sp.a) { b.classList.add('right'); SFX.caught(); $('#rr', m).innerHTML = '<b>Isso mesmo!</b> A pista aponta para lá.'; await sleep(1100); closeModal(); next(); } else { b.classList.add('wrong'); b.disabled = true; SFX.escape(); $('#rr', m).textContent = 'Hmm… não parece ser isso. Tente de novo.'; } }); return; }
    if (sp.t === 'order') { const sh = sp.items.map((t, k) => [t, k]).sort(() => R() - 0.5); let pos = 0; const m = modal(`<div class="riddle"><h3>📖 Diário</h3><p>${sp.q}</p><div class="ordl">${sh.map(([t, k]) => `<button class="btn ordb" data-k="${k}">${t}</button>`).join('')}</div><p id="rr" class="center"></p></div>`);
      $$('.ordb', m).forEach(b => b.onclick = async () => { if (+b.dataset.k === pos) { pos++; b.disabled = true; b.classList.add('right'); b.insertAdjacentHTML('afterbegin', `<i class="ordn">${pos}</i>`); tone(500 + pos * 120, 0.08, 'square', 0.05); if (pos === sp.items.length) { SFX.caught(); $('#rr', m).innerHTML = '<b>Caverna Celeste!</b> Mewtwo está lá.'; await sleep(1300); closeModal(); next(); } }
        else { SFX.escape(); pos = 0; $$('.ordb', m).forEach(x => { x.disabled = false; x.classList.remove('right'); x.querySelector('.ordn')?.remove(); }); $('#rr', m).textContent = 'As datas não batem... recomece.'; } }); return; }
    if (sp.t === 'simon') { const COL = [['#ef4444', 392], ['#f59e0b', 494], ['#22c55e', 587], ['#3b82f6', 698], ['#a855f7', 784]]; const seq = Array.from({ length: sp.n }, () => Math.floor(R() * 5)); let inp = [], ready = false;
      const m = modal(`<div class="riddle center"><h3>🔔 As Cores do Sino</h3><p id="rr">Observe…</p><div class="simon">${COL.map(([c], k) => `<button class="sim" data-k="${k}" style="--c:${c}"></button>`).join('')}</div><button class="btn small ghost" id="rep">↻ Ver de novo</button></div>`);
      const flash = async k => { const b = $$('.sim', m)[k]; b.classList.add('lit'); tone(COL[k][1], 0.3, 'triangle', 0.08); await sleep(420); b.classList.remove('lit'); await sleep(160); };
      const show = async () => { ready = false; inp = []; $('#rr', m).textContent = 'Observe…'; await sleep(500); for (const k of seq) await flash(k); ready = true; $('#rr', m).textContent = 'Sua vez! Repita as cores.'; };
      $('#rep', m).onclick = () => ready && show(); m.dataset.seq = seq.join('');
      $$('.sim', m).forEach(b => b.onclick = async () => { if (!ready) return; const k = +b.dataset.k; flash(k); inp.push(k); if (inp[inp.length - 1] !== seq[inp.length - 1]) { SFX.escape(); $('#rr', m).textContent = 'Errou a cor… o sino silenciou. Observe de novo.'; ready = false; await sleep(900); return show(); }
        if (inp.length === seq.length) { ready = false; SFX.heal(); $('#rr', m).innerHTML = '<b>O sino respondeu!</b> 🌈'; await sleep(1300); closeModal(); next(); } });
      show(); return; }
  };
  ACT.leghunt = d => { const q = LEGQ.find(x => x.id === d.q), sp = q && q.steps[legStep(q)]; if (!sp || sp.t !== 'hunt') return; if (!S.party.some(m => m.hp > 0)) return toast('Seus Pokémon estão sem energia!', 'bad');
    const mp = C.MAPS.find(m => m.id === sub); const m = PE.makeMon(sp.id, sp.lvl, st, { shinyRate: A.shinyRate || shinyP() }); m.caughtAt = mp.name;
    modal(`<div class="center legintro"><img class="bigspr sil" src="${sprId(sp.id)}" alt=""><p>${sp.intro}</p><button class="btn primary wide" id="lgo">Enfrentar!</button></div>`).querySelector('#lgo').onclick = () => { closeModal(); startBattle({ kind: 'wild', enemy: [m], map: mp, weather: battleWeather(weatherOf(mp)), legend: true }); }; };

  // ---------- Revanche dos ginásios + Torneio semanal ----------
  const finalEvo = id => { let x = id, g = 0; while (D.mons[x].e && D.mons[x].e.length && g++ < 3) x = D.mons[x].e[0].to; return D.mons[x] ? x : id; };
  function rematchTeam(g, base, key) { const r = srng(hseed('rm' + key)); const ids = [...new Set(g.team.map(([id]) => finalEvo(id)))];
    const ofType = Object.keys(D.mons).map(Number).filter(i => i <= 251 && !D.mons[i].L && D.mons[i].t.includes(g.type) && !(D.mons[i].e || []).length && !ids.includes(i)).sort((a, b) => D.mons[b].s.reduce((x, y) => x + y) - D.mons[a].s.reduce((x, y) => x + y));
    for (const i of pickCount(ofType.slice(0, 10), 6 - ids.length, r)) ids.push(i);
    return ids.slice(0, 6).map((id, k) => { const m = PE.makeMon(id, base + k + (k === 5 ? 3 : 0), st, { shiny: false, iv: Array(6).fill(28), nat: bestNat(id) }); return m; }); }
  const RM_LIST = () => [...C.GYMS.map((g, i) => ({ g, key: 'k' + i, base: 58 + i, region: 'Kanto' })), ...(S.jchampion ? C.JGYMS.map((g, i) => ({ g, key: 'j' + i, base: 66 + i, region: 'Johto' })) : [])];
  const TOUR_NAMES = [['Ás Rafael', 'acetrainer'], ['Ás Bia', 'acetrainerf'], ['Faixa-preta Kenji', 'blackbelt'], ['Médium Luna', 'psychic'], ['Beldade Sofia', 'beauty'], ['Alpinista Tião', 'hiker'], ['Ornitóloga Clara', 'birdkeeper'], ['Malabarista Leo', 'juggler'], ['Esquiadora Nina', 'skier'], ['Pokémaníaco Davi', 'pokemaniac'], ['Nadadora Iara', 'swimmer'], ['Pescador Zé', 'fisherman']];
  function tourState() { const wk = weekKey(); S.tour = S.tour || {}; if (S.tour.week !== wk) { const last = S.tour.week ? S.tour.place : null; S.tour = { week: wk, round: 0, out: false, place: null, entered: false, best: S.tour.best || null, wins: S.tour.wins || 0, lastPlace: last }; } return S.tour; }
  function tourField() { const r = srng(hseed((S.user || S.trainer) + tourState().week)), names = pickCount(TOUR_NAMES, 7, r), L = Math.max(15, Math.min(95, avgLvl() + 2));
    return names.map(([n, sp], k) => { const pool = Object.keys(D.mons).map(Number).filter(i => i <= 251 && !D.mons[i].L && !(D.mons[i].e || []).length); const team = pickCount(pool, 3 + (k % 2), r);
      return { n, sp, team, lvl: L + Math.floor(r() * 4) - 1, str: r() }; }); }
  function tourBracket() { const t = tourState(), f = tourField(), r = srng(hseed('b' + t.week + (S.user || S.trainer))); const P = { n: S.trainer, sp: S.avatar, me: 1 };
    const r1 = [[P, f[0]], [f[1], f[2]], [f[3], f[4]], [f[5], f[6]]]; const win = (a, b, rnd, myRes) => a.me ? (myRes ? a : b) : b.me ? (myRes ? b : a) : (rnd() < 0.5 + (a.str - b.str) / 2 ? a : b);
    const w1 = r1.map(([a, b]) => win(a, b, r, t.round >= 1)), r2 = [[w1[0], w1[1]], [w1[2], w1[3]]], w2 = r2.map(([a, b]) => win(a, b, r, t.round >= 2)), w3 = win(w2[0], w2[1], r, t.round >= 3);
    return { r1, r2, r3: [w2], w1, w2, w3 }; }
  const TOUR_PRIZE = [{ money: 2000 }, { money: 5000, 'ultra-ball': 3 }, { money: 10000, 'rare-candy': 3 }, { money: 25000, 'master-ball': 1, 'rare-candy': 5 }];
  function vArena() {
    const t = tourState(), b = tourBracket(), rl = RM_LIST(); S.rematch = S.rematch || {}; const wk = weekKey();
    const opp = t.out || t.round >= 3 ? null : t.round === 0 ? b.r1[0][1] : t.round === 1 ? (b.r2[0][0].me ? b.r2[0][1] : b.r2[0][0]) : (b.r3[0][0].me ? b.r3[0][1] : b.r3[0][0]);
    const nm = x => `<span class="bn ${x.me ? 'me' : ''}"><img src="img/tr/${x.sp}.png" alt="">${esc(x.n)}</span>`;
    const pair = (p, w, rd) => `<div class="bpair">${p.map(x => `<div class="${t.round >= rd && w && w !== x ? 'lost' : ''} ${t.out && x.me && t.round === rd - 1 ? 'lost' : ''}">${nm(x)}</div>`).join('')}</div>`;
    const bracket = `<div class="bracket"><div class="bcol"><small>Quartas</small>${b.r1.map((p, k) => pair(p, b.w1[k], 1)).join('')}</div><div class="bcol"><small>Semi</small>${t.round >= 1 && !t.out || t.round >= 1 ? b.r2.map((p, k) => pair(p, b.w2[k], 2)).join('') : '<div class="bpair q">?</div><div class="bpair q">?</div>'}</div><div class="bcol"><small>Final</small>${t.round >= 2 ? pair(b.r3[0], b.w3, 3) : '<div class="bpair q">?</div>'}${t.round >= 3 ? `<div class="champ">🏆 ${nm(b.w3)}</div>` : ''}</div></div>`;
    return `<div class="card tour"><div class="row between"><h3>🏆 Torneio Semanal</h3><span class="chip">Renova segunda</span></div><p class="mut small">8 treinadores, mata-mata. Seu time é curado antes de cada luta. Prêmios: semi ${fmt(5000)}, final ${fmt(10000)}, campeão ${fmt(25000)} + Master Ball.</p>${bracket}
      ${t.round >= 3 ? '<p class="newdex center">👑 Você é o campeão desta semana!</p>' : t.out ? `<p class="center">Você caiu ${['nas quartas', 'na semi', 'na final'][t.round]}. Volte na segunda!</p>` : `<button class="btn primary big wide" data-a="tourgo">${t.round === 0 ? 'Inscrever e lutar' : 'Próxima luta'} vs ${esc(opp.n)}</button>`}
      <p class="mut small">Títulos de torneio: <b>${t.wins || 0}</b>${t.best != null ? ` • melhor: ${['quartas', 'semi', 'vice', 'campeão'][t.best]}` : ''}</p></div>
      <div class="card"><h3>🔁 Revanche dos Ginásios</h3>${S.champion ? `<p class="mut small">Os líderes voltaram mais fortes (Nv 58+), com times completos. Cada um aceita 1 revanche por semana.</p><div class="rmlist">${rl.map(x => { const done = S.rematch[x.key] === wk;
        return `<div class="trow ${done ? 'done' : ''}"><img src="img/tr/${x.g.sprite}.png" alt=""><div class="grow"><b>${x.g.leader}</b> <small class="mut">${x.region} • ${C.TYPE_PT[x.g.type] || ''} • Nv ${x.base}+</small><small>${done ? '✅ Vencido esta semana' : `Prêmio ${fmt(x.g.prize * 5)} + 2 Balas Raras`}</small></div>${done ? '' : `<button class="btn small primary" data-a="rematch" data-k="${x.key}">Revanche</button>`}</div>`; }).join('')}</div>` : '<p class="mut">🔒 Torne-se Campeão da Liga para liberar as revanches.</p>'}</div>`;
  }
  ACT.rematch = d => { const x = RM_LIST().find(r => r.key === d.k); if (!x || !S.champion || (S.rematch || {})[x.key] === weekKey()) return;
    startBattle({ kind: 'trainer', name: 'Líder ' + x.g.leader, sprite: x.g.sprite, enemy: rematchTeam(x.g, x.base, x.key), prize: x.g.prize * 5, ai: 2, intro: 'Revanche do Ginásio', rematch: x.key }); };
  ACT.tourgo = () => { const t = tourState(); if (t.out || t.round >= 3) return; const b = tourBracket(); const opp = t.round === 0 ? b.r1[0][1] : t.round === 1 ? (b.r2[0][0].me ? b.r2[0][1] : b.r2[0][0]) : (b.r3[0][0].me ? b.r3[0][1] : b.r3[0][0]);
    t.entered = true; healAll(); const enemy = opp.team.map(id => PE.makeMon(id, Math.min(100, opp.lvl + t.round * 2), st, { shiny: false, iv: Array(6).fill(20 + t.round * 4), nat: bestNat(id) }));
    startBattle({ kind: 'trainer', name: opp.n, sprite: opp.sp, enemy, prize: TOUR_PRIZE[t.round].money, ai: t.round >= 1 ? 2 : 1, intro: ['Torneio • Quartas de final', 'Torneio • Semifinal', 'Torneio • GRANDE FINAL'][t.round], tour: 1 }); };
  function rematchTourWin(o) { if (o.rematch) { S.rematch = S.rematch || {}; S.rematch[o.rematch] = weekKey(); giveReward({ 'rare-candy': 2 }); S.bp = (S.bp || 0) + 3; log('🎁 Revanche: +2 Balas Raras e 3 PB!'); }
    if (o.tour) { const t = tourState(); const rw = TOUR_PRIZE[t.round + 1] || {}; t.round++; const { money, ...items } = rw; giveReward(items); t.best = Math.max(t.best ?? -1, t.round); if (t.round >= 3) { t.wins = (t.wins || 0) + 1; S.trophies = (S.trophies || 0) + 1; S.bag['master-ball'] = (S.bag['master-ball'] || 0) + 0; } } }
  function tourLoss(o) { if (o.tour) { const t = tourState(); t.out = true; t.place = t.round; t.best = Math.max(t.best ?? -1, t.round); } }

  // ---------- Pokémon seguidor ----------
  function followerHtml() { if (S.settings.follow === false) return ''; const m = S.party.find(x => x.hp > 0) || S.party[0]; if (!m) return '';
    const p = period(), h = hpPct(m), e = h < 30 ? '💦' : p === 'night' ? (R() < 0.5 ? '💤' : '🌙') : R() < 0.35 ? '♥' : R() < 0.5 ? '♪' : R() < 0.5 ? '!' : '✨';
    return `<div class="follow ${m.shiny ? 'shiny-glow' : ''}" data-a="pet"><img src="${spr(m)}" alt=""><span class="emo">${e}</span></div>`; }
  ACT.pet = () => { const m = S.party.find(x => x.hp > 0) || S.party[0]; if (!m) return; cry(m.id); const el = $('.follow'); if (el) { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); const s = $('.emo', el); s.textContent = '♥'; s.classList.add('show'); setTimeout(() => s.classList.remove('show'), 1500); }
    toast(`${esc(pn(m))} ${['adorou o carinho!', 'pulou de alegria!', 'está muito feliz com você!', 'fez um barulhinho fofo!'][Math.floor(R() * 4)]}`); };

  // ---------- Estilo do treinador ----------
  const STYLE = { colors: [['c0', 'Original', 0, 0], ['c1', 'Azul Oceano', 200, 1500], ['c2', 'Verde Floresta', 100, 1500], ['c3', 'Roxo Fantasma', 260, 2500], ['c4', 'Rosa Fada', 310, 2500], ['c5', 'Dourado', 40, 8000], ['c6', 'Sombra', -1, 6000]],
    hats: [['h0', 'Nada', '', 0], ['h1', 'Boné', '🧢', 1000], ['h2', 'Chapéu de Palha', '👒', 1500], ['h3', 'Cartola', '🎩', 4000], ['h4', 'Laço', '🎀', 1200], ['h5', 'Óculos Escuros', '🕶️', 2500], ['h6', 'Coroa', '👑', 25000], ['h7', 'Chapéu de Festa', '🥳', 3000]],
    auras: [['a0', 'Nenhuma', '', 0], ['a1', 'Brilhos', 'sparkle', 5000], ['a2', 'Fogo', 'fire', 8000], ['a3', 'Arco-Íris', 'rainbow', 15000]] };
  const sty = () => { S.style = S.style || { color: 'c0', hat: 'h0', aura: 'a0', owned: { c0: 1, h0: 1, a0: 1 } }; return S.style; };
  const meFilter = () => { const c = STYLE.colors.find(x => x[0] === sty().color); return !c || !c[2] ? '' : c[2] === -1 ? 'filter:brightness(.55) contrast(1.3) drop-shadow(0 0 6px #a855f7)' : `filter:hue-rotate(${c[2]}deg) saturate(1.2) drop-shadow(0 6px 4px rgba(0,0,0,.4))`; };
  const hatOf = () => (STYLE.hats.find(x => x[0] === sty().hat) || [])[2] || '';
  const auraOf = () => (STYLE.auras.find(x => x[0] === sty().aura) || [])[2] || '';
  function meHtml() { const h = hatOf(); return `<img class="me" src="img/tr/${S.avatar}.png" style="${meFilter()}" alt="">${h ? `<span class="mehat ${sty().hat}">${h}</span>` : ''}${auraOf() ? `<span class="meaura au-${auraOf()}"></span>` : ''}`; }
  function vStyle() { const s = sty();
    const sec = (k, t, list, prev) => `<div class="card"><h3>${t}</h3><div class="stygrid">${list.map(([id, n, v, pr]) => { const own = s.owned[id], on = s[k] === id; return `<button class="sty ${on ? 'on' : ''} ${own ? 'own' : ''}" data-a="stybuy" data-k="${k}" data-id="${id}">${prev(v, id)}<b>${n}</b><small>${on ? '✅ Usando' : own ? 'Usar' : pr === -2 ? '🎟️ Passe' : pr < 0 ? '🎰 Cápsula' : fmt(pr)}</small></button>`; }).join('')}</div></div>`;
    return `<div class="card stylehead"><div class="stypreview theme-grass"><div class="tcl styc">${trImg()}</div></div><div><h3>👕 Boutique do Treinador</h3><p class="mut small">Compre cores, chapéus e auras. Aparecem no mapa e no seu Cartão de Treinador.</p><span class="chip money">${fmt(S.money)}</span></div></div>
      ${sec('color', '🎨 Cores da roupa', STYLE.colors, v => `<img src="img/tr/${S.avatar}.png" style="${!v ? '' : v === -1 ? 'filter:brightness(.55) contrast(1.3)' : `filter:hue-rotate(${v}deg) saturate(1.2)`}" alt="">`)}
      ${sec('hat', '🧢 Chapéus e acessórios', STYLE.hats, v => `<span class="sem">${v || '∅'}</span>`)}${sec('aura', '✨ Auras', STYLE.auras, v => `<span class="sem aura-prev au-${v}">${v ? '' : '∅'}</span>`)}`; }
  ACT.stybuy = d => { const s = sty(), list = STYLE[d.k + 's'], it = list.find(x => x[0] === d.id); if (!it) return;
    if (!s.owned[d.id]) { if (it[3] < 0) return toast(it[3] === -2 ? 'Recompensa do Passe de Temporada!' : 'Só na Máquina de Cápsulas!'); if (S.money < it[3]) return toast('Moedas insuficientes!', 'bad'); S.money -= it[3]; s.owned[d.id] = 1; SFX.coin(); toast(`Comprou ${it[1]}!`, 'good'); }
    s[d.k] = d.id; save(); render(); };
  const trImg = () => { const h = hatOf(); return `<img src="img/tr/${S.avatar}.png" style="${meFilter()}" alt="">${h ? `<span class="tchat ${sty().hat}">${h}</span>` : ''}`; };

  // ---------- Casa / base ----------
  const FURN = [['bed', 'Cama Pokébola', '🛏️', 2000], ['sofa', 'Sofá', '🛋️', 3000], ['plant', 'Planta', '🪴', 800], ['tv', 'TV', '📺', 4000], ['game', 'Videogame', '🎮', 5000], ['books', 'Estante', '📚', 2500], ['aqua', 'Aquário', '🐠', 6000],
    ['lamp', 'Luminária', '💡', 1200], ['rug', 'Tapete', '🟥', 1500], ['clock', 'Relógio', '🕰️', 2000], ['doll25', 'Boneco Pikachu', 'img:25', 3500], ['doll133', 'Boneco Eevee', 'img:133', 3500], ['doll143', 'Snorlax de pelúcia', 'img:143', 9000], ['doll150', 'Estátua Mewtwo', 'img:150', 30000]];
  const WALLS = [['w0', 'Creme', '#f5e6c8', 0], ['w1', 'Céu', '#9fd3f5', 2000], ['w2', 'Menta', '#a7f3d0', 2000], ['w3', 'Noite Estrelada', '#1e1b4b', 5000], ['w4', 'Pokébola', '#ef4444', 6000]];
  const house = () => { S.house = S.house || { slots: Array(8).fill(null), owned: {}, wall: 'w0', walls: { w0: 1 } }; return S.house; };
  const furnIco = (v, big) => v.startsWith('img:') ? `<img src="${sprId(+v.slice(4))}" alt="">` : `<span class="fe">${v}</span>`;
  function vHouse() { const h = house(), w = WALLS.find(x => x[0] === h.wall) || WALLS[0];
    const nAch = Object.keys(S.ach || {}).length; const trophies = `${S.badges.map(i => badgeHtml(i, 1)).join('')}${(S.jbadges || []).map(i => jbadgeHtml(i, 1)).join('')}`;
    return `<div class="card room-card"><div class="row between"><h3>🏠 Minha Casa</h3><button class="btn small" data-a="tab" data-t="team">💻 PC</button></div>
      <div class="room" style="--wall:${w[2]}"><div class="wall"><div class="window per-${period()}"></div><div class="shelf"><div class="trophies">${trophies || '<small class="mut">Sem insígnias ainda</small>'}</div><div class="cups">${S.champion ? '👑' : ''}${'🏆'.repeat(Math.min(5, S.trophies || 0))}${nAch ? `<span class="achn">🏅${nAch}</span>` : ''}</div></div></div>
      <div class="floor">${h.slots.map((f, i) => { const it = FURN.find(x => x[0] === f); return `<button class="slot ${it ? 'has' : ''}" data-a="hslot" data-i="${i}">${it ? furnIco(it[2]) : '<i>+</i>'}</button>`; }).join('')}</div>${meHtml()}${followerHtml()}</div>
      <p class="mut small">Toque num espaço do chão para colocar ou trocar móveis. Insígnias, troféus do Torneio e conquistas aparecem na estante.</p></div>
      <div class="card"><h3>🛒 Loja de Móveis</h3><div class="stygrid">${FURN.filter(f => f[3] >= 0 || h.owned[f[0]]).map(([id, n, v, pr]) => `<button class="sty ${h.owned[id] ? 'own' : ''}" data-a="fbuy" data-id="${id}">${furnIco(v)}<b>${n}</b><small>${h.owned[id] ? `Tenho ${h.owned[id]}` : fmt(pr)}</small></button>`).join('')}</div>
      <h4>Papel de parede</h4><div class="stygrid">${WALLS.map(([id, n, c, pr]) => `<button class="sty ${h.wall === id ? 'on' : ''}" data-a="wbuy" data-id="${id}"><span class="sw" style="background:${c}"></span><b>${n}</b><small>${h.wall === id ? '✅' : h.walls[id] ? 'Usar' : fmt(pr)}</small></button>`).join('')}</div></div>`; }
  ACT.fbuy = d => { const h = house(), it = FURN.find(x => x[0] === d.id); if (it[3] < 0) return toast('Este móvel vem da Máquina de Cápsulas. Toque num espaço do chão para colocar.'); if (S.money < it[3]) return toast('Moedas insuficientes!', 'bad'); S.money -= it[3]; h.owned[it[0]] = (h.owned[it[0]] || 0) + 1; SFX.coin(); toast(`${it[1]} comprado! Toque num espaço da casa para colocar.`, 'good'); save(); render(); };
  ACT.wbuy = d => { const h = house(), it = WALLS.find(x => x[0] === d.id); if (!h.walls[it[0]]) { if (S.money < it[3]) return toast('Moedas insuficientes!', 'bad'); S.money -= it[3]; h.walls[it[0]] = 1; SFX.coin(); } h.wall = it[0]; save(); render(); };
  ACT.hslot = d => { const h = house(), i = +d.i, placed = id => h.slots.filter(x => x === id).length, avail = FURN.filter(f => (h.owned[f[0]] || 0) > placed(f[0]));
    const m = modal(`<h3>Colocar móvel</h3>${avail.length ? `<div class="stygrid">${avail.map(f => `<button class="sty own" data-f="${f[0]}">${furnIco(f[2])}<b>${f[1]}</b></button>`).join('')}</div>` : '<p class="mut">Compre móveis na loja abaixo.</p>'}<div class="mbtns">${h.slots[i] ? '<button class="btn" data-f="">Guardar móvel</button>' : ''}<button class="btn" data-a="close">Fechar</button></div>`);
    $$('[data-f]', m).forEach(b => b.onclick = () => { h.slots[i] = b.dataset.f || null; SFX.click2(); closeModal(); save(); render(); }); };

  // =====================================================================
  // v6 G1: Lago Infinito (rogue), Desafio Diário, Máquina de Cápsulas
  // =====================================================================
  const XV = {}, MORE_X = [], HOME_X = [];
  function moreExtra() { return MORE_X.map(f => f()).filter(Boolean); }
  function homeExtra() { return HOME_X.map(f => f()).join(''); }
  Object.assign(C.ITEM_NAME, { 'capsule-token': 'Ficha de Cápsula', 'egg-token': 'Ficha de Ovo' });
  Object.assign(KEY_ITEMS, { 'capsule-token': 'Use na Máquina de Cápsulas (Mais → Cápsulas).', 'egg-token': 'Troque por Ovos raros no Lago Infinito.' });
  const HAS_SPR = new Set([...Array(251).keys()].map(i => i + 1));
  const isFinal = id => !(D.mons[id].e || []).length;
  const bst = id => D.mons[id].s.reduce((a, b) => a + b, 0);
  const BIOMES = [
    { k: 'grass', n: 'Campina Serena', t: ['normal', 'grass', 'bug', 'flying'], ico: '🌾' }, { k: 'water', n: 'Lago Profundo', t: ['water', 'ice'], ico: '🌊' },
    { k: 'cave', n: 'Caverna Ecoante', t: ['rock', 'ground', 'steel', 'fighting'], ico: '⛰️' }, { k: 'forest', n: 'Mata Sombria', t: ['bug', 'grass', 'poison'], ico: '🌲' },
    { k: 'volcano', n: 'Cratera Rubra', t: ['fire', 'ground', 'dragon'], ico: '🌋' }, { k: 'electric', n: 'Usina Abandonada', t: ['electric', 'steel'], ico: '⚡' },
    { k: 'ghost', n: 'Torre Assombrada', t: ['ghost', 'dark', 'psychic'], ico: '👻' }, { k: 'ice', n: 'Pico Congelado', t: ['ice', 'water'], ico: '❄️' },
    { k: 'sky', n: 'Céu Infinito', t: ['flying', 'dragon', 'fairy', 'psychic'], ico: '☁️' }, { k: 'psychic', n: 'Templo Mental', t: ['psychic', 'fairy'], ico: '🔮' }];
  const RG_UPS = [
    ['heal', '💖', 'Poção Máxima', 'Cura todo o time por completo.'], ['candy', '🍬', 'Bala Rara x2', '+2 níveis para todo o time.'], ['atk', '🥊', 'Faixa do Poder', 'Ataque e At. Esp. +10% (acumula).'],
    ['def', '🛡️', 'Colete Robusto', 'Defesa e Def. Esp. +10% (acumula).'], ['spe', '🪶', 'Pena Veloz', 'Velocidade +10% (acumula).'], ['hp', '🍎', 'Fruta Vital', 'HP máximo +10% (acumula).'],
    ['revive', '💎', 'Reviver em Massa', 'Revive todos os desmaiados com metade do HP.'], ['coin', '🪙', 'Bolsa de Moedas', '+300 moedas do Lago para a loja.'],
    ['recruit', '🤝', 'Recrutar', 'O Pokémon derrotado entra no seu time (máx. 6).'], ['luck', '🍀', 'Trevo da Sorte', 'Mais Fichas no fim da corrida (acumula).'], ['evo', '🌟', 'Pedra da Evolução', 'Evolui o 1º Pokémon que puder evoluir.']];
  const rogue = () => { S.rogue = S.rogue || { run: null, best: 0, runs: 0, daily: {}, dhist: [] }; return S.rogue; };
  const rgRng = (run, tag) => srng(hseed(run.seed + ':' + tag));
  function rgPool(run, w, r) { const b = BIOMES[run.biome % BIOMES.length], boss = w % 10 === 0, lim = w < 8 ? 330 : w < 18 ? 430 : w < 30 ? 500 : 560;
    let pool = [...HAS_SPR].filter(i => D.mons[i] && !D.mons[i].L && D.mons[i].t.some(t => b.t.includes(t)) && bst(i) <= lim);
    if (boss) pool = pool.filter(isFinal).sort((a, c) => bst(c) - bst(a)).slice(0, 8); if (!pool.length) pool = [19, 16, 41];
    return pool[Math.floor(r() * pool.length)]; }
  const rgLvl = w => Math.min(100, Math.round(6 + w * 1.6));
  function rgBup(run) { const u = run.ups; return [1 + 0.1 * (u.hp || 0), 1 + 0.1 * (u.atk || 0), 1 + 0.1 * (u.def || 0), 1 + 0.1 * (u.atk || 0), 1 + 0.1 * (u.def || 0), 1 + 0.1 * (u.spe || 0)]; }
  function rgApply(run) { const b = rgBup(run); for (const m of run.party) { const old = PE.maxhp(m); m.bst = b; const nw = PE.maxhp(m); if (m.hp > 0) m.hp = Math.min(nw, m.hp + Math.max(0, nw - old)); } }
  const STARTER_IDS = [1, 4, 7, 25, 133, 152, 155, 158, 66, 92, 147, 246];
  function rgNew(daily, pick) { const R0 = rogue(); const seed = daily ? 'daily:' + dayKey() : 'r' + Date.now() + ':' + Math.floor(R() * 1e9); const run = { seed, daily: !!daily, wave: 1, biome: 0, money: 200, ups: {}, party: [], log: [], t0: Date.now() };
    const r = srng(hseed(seed + ':team')); const pool = STARTER_IDS.slice(); const ids = pick ? [pick, ...pickCount(pool.filter(x => x !== pick), 2, r)] : pickCount(pool, 3, r);
    run.biome = Math.floor(r() * BIOMES.length);
    run.party = ids.map((id, k) => { const m = PE.makeMon(id, 8, { seed: hseed(seed + 'm' + k) }, { shiny: false, iv: Array(6).fill(15), nat: (hseed(seed + 'n' + k) % 25) }); m.ot = S.trainer; m.rg = 1; return m; });
    R0.run = run; R0.runs++; if (daily) R0.daily[dayKey()] = { started: 1 }; save(); return run; }
  function vRogue() { const R0 = rogue(), run = R0.run, dk = dayKey(), dd = R0.daily[dk];
    if (run) { const b = BIOMES[run.biome % BIOMES.length], boss = run.wave % 10 === 0;
      return `<div class="card rg-hero theme-${b.k}"><div class="row between"><h3>${b.ico} ${b.n}</h3><span class="chip">${run.daily ? '📅 Desafio Diário' : '♾️ Lago Infinito'}</span></div>
        <div class="rgwave"><small>ONDA</small><b>${run.wave}</b>${boss ? '<span class="bossb">👑 CHEFE</span>' : `<span class="mut small">chefe em ${10 - run.wave % 10}</span>`}</div>
        <div class="rgparty">${run.party.map(m => `<div class="rgm ${m.hp <= 0 ? 'ko' : ''}"><img src="${spr(m)}" alt=""><small>${D.mons[m.id].n} Nv${m.lvl}</small><div class="hpb"><i style="width:${hpPct(m)}%"></i></div></div>`).join('')}</div>
        <div class="rgups">${RG_UPS.filter(u => run.ups[u[0]] && ['atk', 'def', 'spe', 'hp', 'luck'].includes(u[0])).map(u => `<span class="chip">${u[1]}×${run.ups[u[0]]}</span>`).join('')}<span class="chip">🪙 ${run.money}</span></div>
        <button class="btn primary big wide" data-a="rgfight">${boss ? '👑 Enfrentar o chefe' : '⚔️ Próxima onda'}</button><button class="btn small ghost wide" data-a="rgquit">Desistir (recebe as recompensas)</button></div>`; }
    const tok = S.bag['egg-token'] || 0;
    return `<div class="card rg-hero theme-water"><div class="rglogo">♾️</div><h2>Lago Infinito</h2><p>Ondas sem fim de batalhas. Depois de cada vitória escolha <b>1 de 3 melhorias</b>. A cada 10 ondas muda o bioma e aparece um <b>chefe</b>. Loja a cada 5 ondas.</p>
      <p class="small">Ao perder você ganha <b>Fichas de Ovo</b>, moedas e <b>Fichas de Cápsula</b> para usar no jogo principal.</p>
      <div class="row wrap gap"><span class="chip">🏅 Recorde: onda ${R0.best}</span><span class="chip">🎮 Corridas: ${R0.runs}</span></div>
      <button class="btn primary big wide" data-a="rgstart">🎲 Time aleatório</button><button class="btn big wide" data-a="rgpick">🧑‍🔬 Escolher inicial</button></div>
      <div class="card daily-ch"><div class="row between"><h3>📅 Desafio Diário</h3><span class="chip">${dk}</span></div><p class="mut small">Mesma semente para todos no dia (horário de Brasília). Uma tentativa por dia.</p>
        ${dd && dd.wave != null ? `<p>✅ Hoje você chegou à onda <b>${dd.wave}</b>.</p>` : dd ? '<p>⏳ Corrida em andamento.</p>' : '<button class="btn primary wide" data-a="rgdaily">Jogar o desafio de hoje</button>'}
        <h4>🏆 Ranking deste aparelho</h4>${dailyBoard(dk)}<h4>📜 Seu histórico</h4>${R0.dhist.length ? `<div class="dhist">${R0.dhist.slice(-7).reverse().map(h => `<div class="row between small"><span>${h.day}</span><b>onda ${h.wave}</b><span>${h.team.map(id => `<img src="${sprId(id)}" alt="">`).join('')}</span></div>`).join('')}</div>` : '<p class="mut small">Nenhum desafio ainda.</p>'}</div>
      <div class="card"><h3>🥚 Troca de Fichas de Ovo</h3><p class="mut small">Você tem <b>${tok}</b> ${itemImg('egg-token')}</p><div class="stygrid">${EGG_SHOP.map(([k, n, ico, pr]) => `<button class="sty" data-a="rgegg" data-k="${k}" ${tok >= pr ? '' : 'disabled'}><span class="sem">${ico}</span><b>${n}</b><small>${pr} fichas</small></button>`).join('')}</div></div>`; }
  const EGG_SHOP = [['common', 'Ovo Comum', '🥚', 5], ['rare', 'Ovo Raro', '🪺', 15], ['epic', 'Ovo Épico (5 IVs 31)', '💠', 35], ['shiny', 'Ovo Brilhante ✨', '🌟', 80]];
  const EGG_POOLS = { common: [1, 4, 7, 25, 35, 39, 52, 54, 60, 63, 66, 69, 74, 79, 81, 92, 129, 133, 152, 155, 158, 172, 173, 174, 175], rare: [147, 246, 111, 123, 127, 128, 131, 137, 138, 140, 142, 143, 179, 214, 228, 238, 239, 240], epic: [147, 246, 131, 142, 143, 133, 1, 4, 7, 152, 155, 158] };
  function giveEgg(kind, from) { const pool = EGG_POOLS[kind === 'shiny' ? 'epic' : kind] || EGG_POOLS.common, id = baseOf(pool[Math.floor(R() * pool.length)]);
    const iv = [0, 1, 2, 3, 4, 5].map(() => Math.floor(R() * 32)); if (kind !== 'common') pickCount([0, 1, 2, 3, 4, 5], kind === 'rare' ? 3 : 5, R).forEach(k => iv[k] = 31);
    const hc = D.mons[id].hc || 20; S.eggs.push({ id, iv, steps: hc * 8, total: hc * 8, from, at: Date.now(), shiny: kind === 'shiny' ? 1 : 0 }); return id; }
  ACT.rgegg = d => { const it = EGG_SHOP.find(x => x[0] === d.k); if (!it || (S.bag['egg-token'] || 0) < it[3]) return; S.bag['egg-token'] -= it[3]; giveEgg(it[0], 'Lago Infinito'); SFX.caught(); toast(`${it[2]} ${it[1]} recebido! Veja em Time.`, 'good'); save(); render(); };
  function dailyBoard(dk) { const rows = []; try { const acc = PS.accounts(); for (const u of Object.keys(acc)) { const sv = u === user ? S : PS.read(u); const h = (sv.rogue && sv.rogue.dhist || []).find(x => x.day === dk); if (h) rows.push({ n: sv.trainer || u, w: h.wave, me: u === user }); } } catch (e) {}
    rows.sort((a, b) => b.w - a.w); return rows.length ? `<ol class="board">${rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${['🥇', '🥈', '🥉'][i] || i + 1 + 'º'}</b> ${esc(r.n)} <span>onda ${r.w}</span></li>`).join('')}</ol>` : '<p class="mut small">Ninguém jogou hoje ainda.</p>'; }
  ACT.rgstart = () => { if (rogue().run) return; rgNew(false); render(); };
  ACT.rgdaily = () => { const R0 = rogue(); if (R0.run) return toast('Termine a corrida atual primeiro.', 'bad'); if (R0.daily[dayKey()]) return; rgNew(true); render(); };
  ACT.rgpick = () => { if (rogue().run) return; const m = modal(`<h3>Escolha seu inicial</h3><p class="mut small">Os outros 2 do time são sorteados.</p><div class="mgrid">${STARTER_IDS.map(id => `<button class="pm" data-p="${id}"><img src="${sprId(id)}" alt=""><small>${D.mons[id].n}</small></button>`).join('')}</div>`);
    $$('[data-p]', m).forEach(b => b.onclick = () => { closeModal(); rgNew(false, +b.dataset.p); render(); }); };
  ACT.rgquit = async () => { if (!(await ask('Desistir?', 'Encerrar a corrida e receber as recompensas?', [{ t: 'Continuar', v: 0 }, { t: 'Encerrar', v: 1, c: 'primary' }]))) return; rgOver(); };
  function rgTeamFor(run) { const w = run.wave, r = rgRng(run, 'w' + w), boss = w % 10 === 0, trainer = !boss && w % 5 === 0, n = boss ? 1 : trainer ? Math.min(4, 2 + Math.floor(w / 15)) : 1;
    const team = []; for (let k = 0; k < n; k++) { let id = rgPool(run, w, r); const lv = rgLvl(w) + (boss ? 4 : 0) - (trainer ? 1 : 0); const m = PE.makeMon(id, lv, { seed: hseed(run.seed + w + 'e' + k) }, { shiny: false, iv: Array(6).fill(Math.min(31, 6 + w)), nat: bestNat(id) });
      while (PE.levelEvo(m, 'day') && m.lvl >= 16) { PE.evolve(m, PE.levelEvo(m, 'day')); } if (boss) { m.raidHp = 1.8; m.raidStars = Math.min(5, 1 + Math.floor(w / 20)); } m.hp = PE.maxhp(m); team.push(m); }
    return { team, boss, trainer }; }
  ACT.rgfight = () => { const run = rogue().run; if (!run) return; if (!run.party.some(m => m.hp > 0)) return rgOver(); const { team, boss, trainer } = rgTeamFor(run), b = BIOMES[run.biome % BIOMES.length];
    const o = { kind: trainer ? 'trainer' : 'wild', enemy: team, party: run.party, rogue: 1, map: { theme: b.k, name: b.n }, ai: run.wave > 10 ? 2 : 1, weather: null, seed: run.daily ? hseed(run.seed + 'b' + run.wave) : undefined };
    if (trainer) Object.assign(o, { name: 'Treinador do Lago', sprite: ['acetrainer', 'acetrainerf', 'blackbelt', 'psychic', 'hiker', 'beauty'][run.wave / 5 % 6], prize: 0, intro: `Onda ${run.wave}` });
    startBattle(o); if (boss) { const ov = $('#battle'); ov.classList.add('boss', 'rgboss'); } };
  async function rogueEnd() { const s = B.s, run = rogue().run; if (!run) return closeBattle();
    if (s.winner !== 0) { log('Seu time caiu nas águas do Lago...'); await wait(1600); closeBattle(); return rgOver(); }
    await award(); for (const m of [...new Set(B.evos || [])]) { const to = PE.levelEvo(m, tod()); if (to) await evolveAnim(m, to); } B.evos = [];
    const def = s.sides[1].party[s.sides[1].party.length - 1]; MUS.victory(); SFX.win(); run.money += 40 + run.wave * 6; log(`🏆 Onda ${run.wave} vencida! +${40 + run.wave * 6} 🪙`); await wait(1200);
    run.party.forEach(m => { if (m.status === 'tox') m.status = 'psn'; delete m.mega; }); const wasBoss = run.wave % 10 === 0; closeBattle(); track('win');
    if (wasBoss) { run.biome++; S.bag['capsule-token'] = (S.bag['capsule-token'] || 0) + 1; }
    const r = rgRng(run, 'u' + run.wave); let opts = pickCount(RG_UPS.filter(u => u[0] !== 'recruit' || run.party.length < 6), 3, r); if (run.party.some(m => m.hp <= 0) && !opts.some(u => u[0] === 'revive') && r() < 0.6) opts[2] = RG_UPS.find(u => u[0] === 'revive');
    await new Promise(res => { const mm = modal(`<div class="rgchoose center">${wasBoss ? `<div class="biomeup">🌍 Novo bioma: <b>${BIOMES[run.biome % BIOMES.length].ico} ${BIOMES[run.biome % BIOMES.length].n}</b> • +1 ${itemImg('capsule-token')}</div>` : ''}<h3>Onda ${run.wave} vencida! Escolha 1:</h3>
      <div class="rgopts">${opts.map((u, i) => `<button class="rgopt" data-i="${i}" style="--d:${i * 0.12}s"><span class="ri">${u[1]}</span><b>${u[2]}</b><small>${u[3]}</small>${u[0] === 'recruit' ? `<img src="${spr(def)}" alt="">` : ''}</button>`).join('')}</div></div>`, 'rgmod');
      mm.dataset.lock = 1; $$('.rgopt', mm).forEach(b => b.onclick = () => { const u = opts[+b.dataset.i]; SFX.caught(); rgUp(run, u[0], def); closeModal(); res(); }); });
    run.wave++; rgApply(run); save(); render();
    if ((run.wave - 1) % 5 === 0) rgShop(run); }
  async function rgUp(run, k, def) { const P = run.party;
    if (k === 'heal') P.forEach(m => { if (m.hp > 0) { m.hp = PE.maxhp(m); m.status = null; } });
    if (k === 'candy') for (const m of P) { if (m.lvl < 100) { m.lvl = Math.min(100, m.lvl + 2); if (PE.xpFor) m.xp = Math.max(m.xp, PE.xpFor(D.mons[m.id].g, m.lvl)); if (m.hp > 0) m.hp = Math.min(PE.maxhp(m), m.hp + 8); } }
    if (['atk', 'def', 'spe', 'hp', 'luck'].includes(k)) run.ups[k] = (run.ups[k] || 0) + 1;
    if (k === 'revive') P.forEach(m => { if (m.hp <= 0) m.hp = Math.floor(PE.maxhp(m) / 2); });
    if (k === 'coin') run.money += 300;
    if (k === 'recruit' && P.length < 6) { const m = PE.makeMon(def.id, def.lvl, { seed: (R() * 2 ** 31) | 0 }, { shiny: false, iv: def.iv.slice(), nat: def.nat }); m.ot = S.trainer; m.rg = 1; P.push(m); }
    if (k === 'evo') { for (const m of P) { const to = PE.levelEvo(m, tod()) || (D.mons[m.id].e || [])[0]?.to; if (to && D.mons[to]) { PE.evolve(m, to); m.hp = Math.min(PE.maxhp(m), m.hp + 20); toast(`🌟 Evoluiu para ${D.mons[to].n}!`, 'good'); break; } } } }
  function rgShop(run) { const IT = [['heal1', '💖', 'Curar 1º desmaiado/ferido', 120], ['healall', '🏥', 'Curar todos', 300], ['candy1', '🍬', '+1 nível para todos', 220], ['atk', '🥊', 'Faixa do Poder', 450]];
    const draw = () => `<h3>🛒 Loja do Lago <span class="chip">🪙 ${run.money}</span></h3><div class="stygrid">${IT.map(([k, ic, n, p]) => `<button class="sty" data-k="${k}" ${run.money >= p ? '' : 'disabled'}><span class="sem">${ic}</span><b>${n}</b><small>${p} 🪙</small></button>`).join('')}</div><div class="mbtns"><button class="btn primary wide" data-a="close">Seguir para a onda ${run.wave}</button></div>`;
    const mm = modal(draw()); const bind = () => $$('[data-k]', mm).forEach(b => b.onclick = () => { const it = IT.find(x => x[0] === b.dataset.k); if (run.money < it[3]) return; run.money -= it[3]; SFX.coin();
      if (it[0] === 'heal1') { const m = run.party.find(x => x.hp <= 0) || run.party.slice().sort((a, c) => hpPct(a) - hpPct(c))[0]; m.hp = PE.maxhp(m); m.status = null; }
      if (it[0] === 'healall') run.party.forEach(m => { m.hp = PE.maxhp(m); m.status = null; }); if (it[0] === 'candy1') run.party.forEach(m => { m.lvl = Math.min(100, m.lvl + 1); }); if (it[0] === 'atk') { run.ups.atk = (run.ups.atk || 0) + 1; rgApply(run); }
      save(); $('.modal', document) ; mm.innerHTML = draw(); bind(); render(); }); bind(); }
  function rgOver() { const R0 = rogue(), run = R0.run; if (!run) return; R0.run = null; const w = run.wave - 1, luck = 1 + 0.25 * (run.ups.luck || 0);
    const rw = { 'egg-token': Math.max(1, Math.floor(w / 2 * luck)), money: Math.floor(w * 250 * luck), 'capsule-token': Math.floor((w / 5 + 1) * luck) };
    giveReward(rw); const rec = w > R0.best; R0.best = Math.max(R0.best, w); S.stats.rogueWaves = (S.stats.rogueWaves || 0) + w; try { seasonXP && seasonXP(w * 15, 'Lago Infinito'); } catch (e) {}
    if (run.daily) { const dk = run.seed.slice(6); R0.daily[dk] = { started: 1, wave: w }; R0.dhist.push({ day: dk, wave: w, team: run.party.map(m => m.id), user, trainer: S.trainer, ver: 1, at: Date.now() }); R0.dhist = R0.dhist.slice(-60); }
    save(); render(); SFX.caught();
    modal(`<div class="center rgover"><div class="burstbg"></div><h2>${rec ? '🏅 Novo recorde!' : 'Fim da corrida'}</h2><p>Você chegou à onda <b>${w}</b>${run.daily ? ' no Desafio Diário' : ''}.</p><div class="rgparty">${run.party.map(m => `<img src="${spr(m)}" alt="">`).join('')}</div>
      <p><b>${rewardText(rw)}</b></p><p class="mut small">Fichas de Ovo viram ovos raros • Fichas de Cápsula giram a Máquina de Cápsulas.</p><button class="btn primary wide" data-a="close">OK</button></div>`); }
  MORE_X.push(() => ['rogue', '♾️', 'Lago Infinito', rogue().run ? `Corrida em andamento • onda ${rogue().run.wave}` : `Recorde: onda ${rogue().best} • Desafio Diário`]);
  XV.rogue = vRogue; MORE_TABS.push('rogue', 'caps');

  // ---------- Máquina de Cápsulas ----------
  Object.assign(STYLE, {}); STYLE.colors.push(['cg1', 'Galáxia', 230, -1], ['cg2', 'Neon', 150, -1]); STYLE.hats.push(['hg1', 'Chapéu de Mago', '🧙', -1], ['hg2', 'Fones Gamer', '🎧', -1], ['hg3', 'Auréola', '😇', -1]); STYLE.auras.push(['ag1', 'Cósmica', 'cosmic', -1], ['ag2', 'Elétrica', 'volt', -1]);
  FURN.push(['gcap', 'Máquina de Cápsulas Mini', '🎰', -1], ['gstar', 'Luminária Estelar', '🌟', -1], ['gcake', 'Bolo Pokémon', '🎂', -1], ['g151', 'Estátua Mew', 'img:151', -1], ['g249', 'Estátua Lugia', 'img:249', -1], ['g250', 'Estátua Ho-Oh', 'img:250', -1]);
  const CAP_R = [['c', 'Comum', '#94a3b8', 60], ['r', 'Rara', '#3b82f6', 28], ['e', 'Épica', '#a855f7', 10], ['l', 'Lendária', '#f59e0b', 2]];
  const CAP_PRIZES = {
    c: [['item', 'poke-ball', 10], ['item', 'great-ball', 5], ['item', 'super-potion', 4], ['item', 'rare-candy', 1], ['money', 3000], ['egg', 'common']],
    r: [['egg', 'rare'], ['item', 'ultra-ball', 5], ['item', 'rare-candy', 3], ['furn', 'gcake'], ['furn', 'gstar'], ['style', 'colors', 'cg2'], ['style', 'hats', 'hg2']],
    e: [['egg', 'epic'], ['item', 'wishing-piece', 2], ['style', 'colors', 'cg1'], ['style', 'hats', 'hg1'], ['style', 'auras', 'ag2'], ['furn', 'gcap'], ['form', 'spiky'], ['furn', 'g151']],
    l: [['egg', 'shiny'], ['item', 'master-ball', 1], ['style', 'auras', 'ag1'], ['style', 'hats', 'hg3'], ['form', 'shinystarter'], ['furn', 'g249'], ['furn', 'g250']] };
  const caps = () => { S.caps = S.caps || { pity: 0, pulls: 0, log: [], forms: {} }; return S.caps; };
  const owned = p => p[0] === 'furn' ? (house().owned[p[1]] || 0) > 0 : p[0] === 'style' ? !!sty().owned[p[2]] : p[0] === 'form' ? !!caps().forms[p[1]] : false;
  function capRoll() { const c = caps(); c.pulls++; c.pity++; let tier; if (c.pity >= 30) tier = 'l'; else { let r = R() * 100; tier = CAP_R.find(t => (r -= t[3]) < 0)[0]; }
    if (tier === 'l') c.pity = 0; let list = CAP_PRIZES[tier].filter(p => !owned(p)); let dup = false; if (!list.length) { list = [['refund', 3]]; dup = true; }
    return { tier, p: list[Math.floor(R() * list.length)], dup }; }
  function capGive(p) { const k = p[0];
    if (k === 'item') { giveReward({ [p[1]]: p[2] }); return { ico: itemImg(p[1]), t: `${p[2]}x ${C.ITEM_NAME[p[1]]}` }; }
    if (k === 'money') { S.money += p[1]; return { ico: '💰', t: fmt(p[1]) }; }
    if (k === 'egg') { const id = giveEgg(p[1], 'Máquina de Cápsulas'); return { ico: p[1] === 'shiny' ? '🌟' : '🥚', t: { common: 'Ovo Comum', rare: 'Ovo Raro', epic: 'Ovo Épico', shiny: 'Ovo Brilhante (shiny garantido!)' }[p[1]] }; }
    if (k === 'furn') { const h = house(), f = FURN.find(x => x[0] === p[1]); h.owned[p[1]] = 1; return { ico: furnIco(f[2]), t: `Móvel: ${f[1]}` }; }
    if (k === 'style') { const it = STYLE[p[1]].find(x => x[0] === p[2]); sty().owned[p[2]] = 1; return { ico: p[1] === 'hats' ? it[2] : p[1] === 'auras' ? '✨' : '🎨', t: `Visual: ${it[1]}` }; }
    if (k === 'form') { caps().forms[p[1]] = 1; let m;
      if (p[1] === 'spiky') { m = PE.makeMon(172, 10, { seed: (R() * 2 ** 31) | 0 }, { shiny: true, ot: S.trainer, caughtAt: 'Máquina de Cápsulas • Pichu Orelha-Espetada' }); m.nick = 'Espetada'; }
      else { const id = [1, 4, 7, 152, 155, 158][Math.floor(R() * 6)]; m = PE.makeMon(id, 5, { seed: (R() * 2 ** 31) | 0 }, { shiny: true, iv: Array(6).fill(31), nat: bestNat(id), ot: S.trainer, caughtAt: 'Máquina de Cápsulas • Inicial Estrela' }); }
      addCaught(m); if (S.party.length < 6) S.party.push(m); else S.box.push(m); return { ico: `<img src="${spr(m)}" alt="">`, t: `Forma especial: ${D.mons[m.id].n} ✨` }; }
    if (k === 'refund') { giveReward({ 'capsule-token': p[1] }); return { ico: itemImg('capsule-token'), t: `Repetido! +${p[1]} Fichas de volta` }; } }
  function vCaps() { const c = caps(), t = S.bag['capsule-token'] || 0;
    return `<div class="card capm"><h3>🎰 Máquina de Cápsulas</h3><p class="mut small">Só fichas do jogo — nada de dinheiro real. Ganhe fichas no Lago Infinito, nas missões, no calendário e nas raides.</p>
      <div class="machine" id="machine"><div class="globe">${['#94a3b8', '#3b82f6', '#a855f7', '#f59e0b', '#94a3b8', '#3b82f6', '#22c55e', '#ef4444'].map((x, i) => `<i style="--c:${x};--i:${i};--y:${70 + (i * 37) % 60}px"></i>`).join('')}</div><div class="mbody"><div class="crank" id="crank"></div><div class="chute"></div></div></div>
      <div class="row between"><span class="chip">${itemImg('capsule-token')} ${t} ficha(s)</span><span class="chip">⭐ Lendária garantida em ${30 - c.pity}</span></div>
      <div class="pity"><i style="width:${c.pity / 30 * 100}%"></i></div>
      <div class="row gap"><button class="btn primary big grow" data-a="cappull" data-n="1" ${t >= 1 ? '' : 'disabled'}>Girar ×1</button><button class="btn big grow" data-a="cappull" data-n="10" ${t >= 10 ? '' : 'disabled'}>Girar ×10</button></div>
      <p class="mut small">Chances: Comum 60% • Rara 28% • Épica 10% • Lendária 2%. Itens únicos nunca repetem (repetido vira ficha de volta).</p></div>
      <div class="card"><h3>📦 Últimos prêmios</h3>${c.log.length ? `<div class="caplog">${c.log.slice(-12).reverse().map(x => `<div class="cl r-${x.r}"><span>${x.ico}</span><small>${x.t}</small></div>`).join('')}</div>` : '<p class="mut small">Nada ainda.</p>'}</div>
      <div class="card"><h3>🔁 Prêmios do catálogo</h3><p class="mut small">O catálogo é fixo e volta sempre — nada some.</p><div class="capcat">${CAP_R.map(([k, n, col]) => `<div><b style="color:${col}">${n}</b><small>${CAP_PRIZES[k].map(p => capLabel(p) + (owned(p) ? ' ✅' : '')).join(' • ')}</small></div>`).join('')}</div></div>`; }
  const capLabel = p => p[0] === 'item' ? C.ITEM_NAME[p[1]] : p[0] === 'money' ? 'Moedas' : p[0] === 'egg' ? { common: 'Ovo Comum', rare: 'Ovo Raro', epic: 'Ovo Épico', shiny: 'Ovo Brilhante' }[p[1]] : p[0] === 'furn' ? FURN.find(x => x[0] === p[1])[1] : p[0] === 'style' ? STYLE[p[1]].find(x => x[0] === p[2])[1] : p[1] === 'spiky' ? 'Pichu Orelha-Espetada' : 'Inicial Estrela ✨';
  let capBusy = false;
  ACT.cappull = async d => { const n = +d.n; if (capBusy || (S.bag['capsule-token'] || 0) < n) return; capBusy = true; S.bag['capsule-token'] -= n; const res = []; for (let i = 0; i < n; i++) { const r = capRoll(); const g = capGive(r.p); res.push({ ...g, r: r.tier }); caps().log.push({ ...g, r: r.tier }); } caps().log = caps().log.slice(-40); save();
    const tier = ['c', 'r', 'e', 'l'].reduce((a, k) => res.some(x => x.r === k) ? k : a, 'c'), col = CAP_R.find(t => t[0] === tier)[2];
    const cr = $('#crank'); if (cr) cr.classList.add('spin'); SFX.click2(); for (let i = 0; i < 4; i++) { tone(300 + i * 80, 0.06, 'square', 0.04); await sleep(160); }
    const mm = modal(`<div class="capopen center" style="--rc:${col}"><div class="caprays"></div><div class="capsule" id="capsule"><i class="ctop"></i><i class="cbot"></i></div><div id="capres" class="capres hidden">${res.map((x, i) => `<div class="cl r-${x.r}" style="--d:${i * 0.08}s"><span>${x.ico}</span><small>${x.t}</small></div>`).join('')}</div><p id="captier" class="captier"></p><button class="btn primary wide hidden" id="capok">Pegar!</button></div>`, 'capmod');
    mm.dataset.lock = 1; const cap = $('#capsule', mm); await sleep(500); cap.classList.add('shake'); for (let i = 0; i < 3; i++) { SFX.shake(); await sleep(380); }
    cap.classList.add('open'); if (tier === 'l') SFX.shiny(); else SFX.caught(); $('#captier', mm).innerHTML = `<b style="color:${col}">${CAP_R.find(t => t[0] === tier)[1]}!</b>`; mm.querySelector('.capopen').classList.add('t-' + tier);
    await sleep(500); $('#capres', mm).classList.remove('hidden'); $('#capok', mm).classList.remove('hidden'); $('#capok', mm).onclick = () => { closeModal(); render(); }; capBusy = false; };
  MORE_X.push(() => ['caps', '🎰', 'Máquina de Cápsulas', `${S.bag['capsule-token'] || 0} ficha(s) • lendária em ${30 - caps().pity}`]);
  XV.caps = vCaps;
  // fichas extras: bônus diário das missões e raides
  { const qb = ACT.qbonus; ACT.qbonus = () => { const q = ensureQuests(), had = q.bonus; qb(); if (!had && q.bonus) { S.bag['capsule-token'] = (S.bag['capsule-token'] || 0) + 2; toast('+2 Fichas de Cápsula!', 'good'); save(); } }; }
  A.rogue = { new: rgNew, team: rgTeamFor, over: rgOver, end: () => rogueEnd(), caps: capRoll, give: capGive };

  // =====================================================================
  // v6 G2: Dia da Comunidade + Hora do Holofote (horário de Brasília)
  // =====================================================================
  const nowT = () => Date.now() + (A.evShift || 0);
  const BRT = t => new Date(t - 3 * 3600e3); // campos getUTC* = horário de Brasília
  const brtTime = (y, mo, d, h) => Date.UTC(y, mo, d, h + 3);
  const CD_LIST = [[1, 'leaf-storm'], [4, 'flare-blitz'], [7, 'hydro-pump'], [147, 'extreme-speed'], [133, 'last-resort'], [152, 'wood-hammer'], [155, 'heat-wave'], [158, 'aqua-tail'], [246, 'stone-edge'], [66, 'close-combat'], [179, 'dragon-pulse'], [35, 'moonblast']];
  const SP_LIST = [25, 39, 54, 77, 83, 104, 108, 113, 123, 127, 128, 131, 137, 175, 190, 194, 203, 206, 209, 214, 215, 216, 220, 225, 227, 231, 234, 241];
  const SP_BONUS = [['xp', '⭐ XP em dobro'], ['money', '💰 Moedas em dobro'], ['egg', '🥚 Ovos chocam 2x mais rápido'], ['shiny', '✨ Chance shiny 2x no destaque']];
  function cdOf(y, mo) { let d = 1; while (new Date(Date.UTC(y, mo, d)).getUTCDay() !== 6) d++; d += 7; const st0 = brtTime(y, mo, d, 14); const idx = ((y * 12 + mo) % CD_LIST.length + CD_LIST.length) % CD_LIST.length; return { start: st0, end: st0 + 3 * 3600e3, id: CD_LIST[idx][0], move: CD_LIST[idx][1], kind: 'cd' }; }
  function nextCDs(n) { const b = BRT(nowT()); let y = b.getUTCFullYear(), mo = b.getUTCMonth(); const out = []; for (let k = -1; out.length < n && k < 24; k++) { const yy = y + Math.floor((mo + k) / 12), mm = ((mo + k) % 12 + 12) % 12; const c = cdOf(yy, mm); if (c.end > nowT()) out.push(c); } return out; }
  function spOf(t) { const b = BRT(t); const dow = b.getUTCDay(); const base = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) + 3 * 3600e3; // meia-noite BRT
    let start = base + ((2 - dow + 7) % 7) * 864e5 + 18 * 3600e3; if (start + 3600e3 <= t) start += 7 * 864e5; const wk = Math.floor((start - Date.UTC(2026, 0, 6, 21)) / (7 * 864e5)); const i = ((wk % SP_LIST.length) + SP_LIST.length) % SP_LIST.length;
    return { start, end: start + 3600e3, id: SP_LIST[i], bonus: SP_BONUS[((wk % 4) + 4) % 4], kind: 'sp' }; }
  const liveEv = () => { const t = nowT(), c = nextCDs(1)[0], s = spOf(t); return [c, s].filter(e => e && e.start <= t && t < e.end); };
  const cdLive = () => liveEv().find(e => e.kind === 'cd'), spLive = () => liveEv().find(e => e.kind === 'sp');
  const evXpMul = () => (cdLive() ? 1.5 : 1) * (spLive()?.bonus[0] === 'xp' ? 2 : 1);
  const evEggMul = () => (cdLive() ? 2 : 1) * (spLive()?.bonus[0] === 'egg' ? 2 : 1);
  const evMoneyMul = () => spLive()?.bonus[0] === 'money' ? 2 : 1;
  function eventSpawn(mp) { const c = cdLive(), s = spLive(); if (c && R() < 0.6) return { id: c.id, rate: shinyP() * 8 }; if (s && R() < 0.5) return { id: s.id, rate: shinyP() * (s.bonus[0] === 'shiny' ? 2 : 1) }; return null; }
  const cdn = ms => { ms = Math.max(0, ms); const d = Math.floor(ms / 864e5), h = Math.floor(ms / 3600e3) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60; return d ? `${d}d ${h}h ${m}min` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
  const fmtBR = t => { const b = BRT(t); return `${['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][b.getUTCDay()]} ${String(b.getUTCDate()).padStart(2, '0')}/${String(b.getUTCMonth() + 1).padStart(2, '0')} • ${String(b.getUTCHours()).padStart(2, '0')}h`; };
  const evCount = e => { const t = nowT(); return t < e.start ? `começa em <b class="cdn" data-t="${e.start}">${cdn(e.start - t)}</b>` : `termina em <b class="cdn" data-t="${e.end}">${cdn(e.end - t)}</b>`; };
  setInterval(() => { const els = document.querySelectorAll('.cdn[data-t]'); if (!els.length) return; const t = nowT(); let flip = false; els.forEach(x => { const left = +x.dataset.t - t; if (left <= 0) flip = true; x.textContent = cdn(left); }); if (flip && !B && !document.querySelector('.modal')) render(); }, 1000);
  function evCard(e, big) { const live = nowT() >= e.start, d = D.mons[e.id], fam = e.kind === 'cd' ? cdFinal(e.id) : e.id;
    return `<div class="card evc ${e.kind} ${live ? 'live' : ''} ${big ? 'big' : ''}"><div class="evbg"></div><div class="evimgs"><img src="${sprId(e.id)}" alt=""><img class="sh" src="${sprId(e.id, true)}" alt=""></div>
      <div class="grow"><small>${e.kind === 'cd' ? '🎉 DIA DA COMUNIDADE' : '🔦 HORA DO HOLOFOTE'}${live ? ' • <span class="livep">AO VIVO</span>' : ''}</small><h3>${d.n}</h3><p class="small">${fmtBR(e.start)}–${String(BRT(e.end).getUTCHours()).padStart(2, '0')}h (Brasília) • ${evCount(e)}</p>
      <p class="mut small">${e.kind === 'cd' ? `Aparece muito em todos os mapas • shiny 8x • XP 1,5x • ovos 2x • evoluir para ${D.mons[fam].n} durante o evento ensina <b>${moveName(e.move)}</b>` : `Aparece muito em todos os mapas • ${e.bonus[1]}`}</p></div></div>`; }
  const moveName = n => (D.moves[n] && (D.moves[n].pt || D.moves[n].n)) || n;
  const cdFinal = id => finalEvo(id);
  function vEvents() { const t = nowT(), cds = nextCDs(3), sp = spOf(t), sp2 = spOf(sp.end + 1000);
    const cal = (() => { const b = BRT(t), y = b.getUTCFullYear(), mo = b.getUTCMonth(), first = new Date(Date.UTC(y, mo, 1)).getUTCDay(), days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(), cd = cdOf(y, mo), cdd = BRT(cd.start).getUTCDate();
      return `<div class="evcal"><b>${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mo]} ${y}</b><div class="ecg">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<small>${x}</small>`).join('')}${'<i></i>'.repeat(first)}${Array.from({ length: days }, (_, i) => { const dd = i + 1, dow = (first + i) % 7; return `<span class="${dd === cdd ? 'ecd' : dow === 2 ? 'esp' : ''} ${dd === b.getUTCDate() ? 'today' : ''}">${dd}</span>`; }).join('')}</div><p class="mut small"><span class="ecd dot"></span> Dia da Comunidade (2º sábado, 14h–17h) • <span class="esp dot"></span> Hora do Holofote (toda terça, 18h–19h)</p></div>`; })();
    return `<div class="card"><h3>📅 Eventos</h3><p class="mut small">Eventos se repetem sempre: os Pokémon em destaque voltam em rodízio, nada é perdido para sempre.</p>${cal}</div>
      ${liveEv().map(e => evCard(e, 1)).join('')}<h4 class="sech">🔦 Hora do Holofote</h4>${[sp, sp2].filter(e => !(e.start <= t && t < e.end)).map(e => evCard(e)).join('')}
      <h4 class="sech">🎉 Próximos Dias da Comunidade</h4>${cds.filter(e => !(e.start <= t && t < e.end)).map(e => evCard(e)).join('')}
      <div class="card"><h3>🔁 Rodízio</h3><div class="evrot">${CD_LIST.map(([id, mv]) => `<div><img src="${sprId(id)}" alt=""><small>${D.mons[id].n}</small></div>`).join('')}</div></div>`; }
  XV.events = vEvents; MORE_TABS.push('events');
  MORE_X.unshift(() => { const l = liveEv(); return ['events', '📅', 'Eventos', l.length ? `🔴 AO VIVO: ${l.map(e => D.mons[e.id].n).join(' + ')}` : `Próximo: ${D.mons[spOf(nowT()).id].n} na terça 18h`]; });
  HOME_X.push(() => { const l = liveEv(); if (l.length) return `<button class="card span2 evbanner live" data-a="tab" data-t="events"><img src="${sprId(l[0].id)}" alt=""><div><small>${l[0].kind === 'cd' ? '🎉 DIA DA COMUNIDADE AO VIVO' : '🔦 HORA DO HOLOFOTE AO VIVO'}</small><b>${D.mons[l[0].id].n} por todo lado!</b><span class="small">${evCount(l[0])}</span></div><span class="arrow">›</span></button>`;
    const t = nowT(), nx = [nextCDs(1)[0], spOf(t)].sort((a, b) => a.start - b.start)[0]; if (nx.start - t < 864e5) return `<button class="card span2 evbanner" data-a="tab" data-t="events"><img src="${sprId(nx.id)}" alt=""><div><small>${nx.kind === 'cd' ? '🎉 DIA DA COMUNIDADE' : '🔦 HORA DO HOLOFOTE'} EM BREVE</small><b>${D.mons[nx.id].n}</b><span class="small">${evCount(nx)}</span></div><span class="arrow">›</span></button>`; return ''; });
  { const ea = evolveAnim; evolveAnim = async (m, to, f) => { const r = await ea(m, to, f); const c = cdLive(); if (r !== false && c && baseOf(to) === baseOf(c.id) && D.moves[c.move] && !m.moves.some(x => x.n === c.move)) { toast(`🎉 Golpe exclusivo do Dia da Comunidade!`, 'good'); await learnMove(m, c.move); S.stats.cdMoves = (S.stats.cdMoves || 0) + 1; save(); } return r; }; }
  // ---------- v6 G3: Passe de Temporada (grátis) ----------
  const SEASONS = [ // [nome, emoji, hue, Pokémon exclusivo, chapéu, aura, cor do tema]
    ['Brisa das Flores', '🌸', 310, 182, '🌸', 'sparkle', '#f472b6'], ['Ondas de Verão', '🌊', 190, 131, '🏖️', 'rainbow', '#38bdf8'],
    ['Chamas do Outono', '🍁', 20, 59, '🍂', 'fire', '#fb923c'], ['Noite Assombrada', '🎃', 270, 94, '🎃', 'cosmic', '#a855f7'],
    ['Neve Cintilante', '❄️', 180, 144, '🎄', 'volt', '#7dd3fc'], ['Tempestade Elétrica', '⚡', 50, 25, '⚡', 'volt', '#facc15']];
  const SEA_LEN = 35 * 864e5, SEA_EPOCH = Date.UTC(2026, 0, 5, 3), PASS_XP = 100, PASS_MAX = 50;
  const seasonAt = t => { const i = Math.floor((t - SEA_EPOCH) / SEA_LEN); return { i, th: ((i % SEASONS.length) + SEASONS.length) % SEASONS.length, start: SEA_EPOCH + i * SEA_LEN, end: SEA_EPOCH + (i + 1) * SEA_LEN }; };
  const POSES = [['p0', 'Parado', '', 0], ['p1', 'Pulinho', 'jump', -2], ['p2', 'Giro', 'spin', -2], ['p3', 'Aceno', 'wave', -2], ['p4', 'Pose Heroica', 'hero', -2], ['p5', 'Dancinha', 'dance', -2]];
  const BALLS = [['b0', 'Padrão', 0, 0], ['b1', 'Bola Rosa', 300, -2], ['b2', 'Bola Ciano', 170, -2], ['b3', 'Bola Dourada', 45, -2], ['b4', 'Bola Roxa', 250, -2], ['b5', 'Bola Verde', 100, -2]];
  STYLE.poses = POSES; STYLE.balls = BALLS;
  SEASONS.forEach((s, i) => { STYLE.colors.push([`sc${i}`, `Traje ${s[0]}`, s[2], -2]); STYLE.hats.push([`sh${i}`, `Enfeite ${s[0]}`, s[4], -2]); if (!STYLE.auras.some(a => a[2] === s[5] && a[0].startsWith('sa'))) STYLE.auras.push([`sa${i}`, `Aura ${s[0]}`, s[5], -2]); });
  const seaAura = th => { const s = SEASONS[th]; return (STYLE.auras.find(a => a[0].startsWith('sa') && a[2] === s[5]) || [])[0]; };
  const passTitle = k => { const th = +k.slice(3); return SEASONS[th] ? `${SEASONS[th][1]} Mestre ${SEASONS[th][0]}` : null; };
  function passReward(L, th) { const s = SEASONS[th];
    if (L === 50) return ['mon', s[3]]; if (L === 10) return ['title', `ps-${th}`]; if (L === 20) return ['style', 'colors', `sc${th}`]; if (L === 30) return ['style', 'hats', `sh${th}`]; if (L === 40) return ['style', 'auras', seaAura(th)];
    if ([5, 25, 45].includes(L)) return ['style', 'poses', POSES[1 + ((th + [5, 25, 45].indexOf(L) * 2) % 5)][0]]; if ([15, 35].includes(L)) return ['style', 'balls', BALLS[1 + ((th + (L === 35 ? 2 : 0)) % 5)][0]];
    const k = L % 4; return k === 0 ? ['item', 'capsule-token', 1] : k === 1 ? ['money', 800 + L * 60] : k === 2 ? ['item', L > 25 ? 'ultra-ball' : 'great-ball', 5] : ['item', L % 3 ? 'rare-candy' : 'egg-token', L % 3 ? 1 : 2]; }
  function pass() { const se = seasonAt(nowT()); let p = S.pass; if (!p || p.sid !== se.i) { const old = p; p = S.pass = { sid: se.i, xp: 0, got: {}, hist: (old && old.hist) || [] }; if (old && old.xp) p.hist.push({ sid: old.sid, lvl: passLvl(old) }); } return p; }
  const passLvl = p => Math.min(PASS_MAX, Math.floor(p.xp / PASS_XP));
  function seasonXP(n, src) { if (!S || !n) return; const p = pass(), b = passLvl(p); p.xp += Math.round(n); const a = passLvl(p); if (a > b) toast(`🎟️ Passe: nível ${a}! Resgate a recompensa (Mais → Passe)`, 'good'); }
  const ownedReward = r => r[0] === 'style' ? !!sty().owned[r[2]] : r[0] === 'title' ? !!(S.passTitles || {})[r[1]] : false;
  function giveReward2(r, th) { if (r[0] === 'mon') { const m = PE.makeMon(r[1], 30, st, { ot: S.trainer, caughtAt: `Passe: ${SEASONS[th][0]}`, shiny: true }); m.ribbons = ['season']; m.seasonal = th; addCaught(m); S.stats.caught++; S.stats.shinies++; if (S.party.length < 6) S.party.push(m); else S.box.push(m); return { ico: `<img src="${sprId(r[1], true)}" alt="">`, t: `${D.mons[r[1]].n} brilhante exclusivo!` }; }
    if (r[0] === 'title') { S.passTitles = S.passTitles || {}; S.passTitles[r[1]] = 1; return { ico: '🏆', t: `Título: ${passTitle(r[1])}` }; }
    if (r[0] === 'style' && (r[1] === 'poses' || r[1] === 'balls')) { const it = STYLE[r[1]].find(x => x[0] === r[2]); sty().owned[r[2]] = 1; return { ico: r[1] === 'poses' ? '🕺' : ballIco(it[2]), t: `${r[1] === 'poses' ? 'Pose' : 'Pokébola'}: ${it[1]}` }; }
    return capGive(r); }
  const ballIco = h => `<img class="bskin" src="img/items/poke-ball.png" style="filter:hue-rotate(${h}deg) saturate(1.4)" alt="">`;
  const rwPrev = (r, th) => r[0] === 'mon' ? `<img src="${sprId(r[1], true)}" alt="">` : r[0] === 'title' ? '🏆' : r[0] === 'money' ? '💰' : r[0] === 'item' ? itemImg(r[1]) : r[1] === 'balls' ? ballIco(STYLE.balls.find(x => x[0] === r[2])[2]) : r[1] === 'poses' ? '🕺' : r[1] === 'hats' ? STYLE.hats.find(x => x[0] === r[2])[2] : r[1] === 'auras' ? '✨' : '🎨';
  const rwName = r => r[0] === 'mon' ? D.mons[r[1]].n + ' ★' : r[0] === 'title' ? 'Título' : r[0] === 'money' ? fmt(r[1]) : r[0] === 'item' ? `${r[2]}x ${C.ITEM_NAME[r[1]] || r[1]}` : (STYLE[r[1]].find(x => x[0] === r[2]) || [])[1];
  function poseCls() { const p = POSES.find(x => x[0] === sty().pose); return p && p[2] ? 'pose-' + p[2] : ''; }
  function ballFx() { const b = BALLS.find(x => x[0] === sty().ball); return b && b[2] ? `filter:hue-rotate(${b[2]}deg) saturate(1.4)` : ''; }
  // loja de temporadas passadas: cosméticos de temas já vividos voltam por moedas
  function pastShop() { const se = seasonAt(nowT()), seen = new Set(); for (let i = se.i - 1; i >= se.i - 6 && i >= 0; i--) seen.add(((i % 6) + 6) % 6); seen.delete(se.th);
    const out = []; for (const th of seen) { out.push(['style', 'colors', `sc${th}`, 6000, th], ['style', 'hats', `sh${th}`, 5000, th]); const a = seaAura(th); if (a) out.push(['style', 'auras', a, 12000, th]); out.push(['title', `ps-${th}`, null, 15000, th]); } return out; }
  ACT.passclaim = d => { const p = pass(), se = seasonAt(nowT()), Ls = d.lv === 'all' ? Array.from({ length: passLvl(p) }, (_, i) => i + 1).filter(L => !p.got[L]) : [+d.lv]; const got = [];
    for (const L of Ls) { if (L > passLvl(p) || p.got[L]) continue; p.got[L] = 1; got.push(giveReward2(passReward(L, se.th), se.th)); }
    if (!got.length) return; SFX.win(); save(); modal(`<div class="center"><h3>🎟️ Recompensas do Passe</h3><div class="capres">${got.map(g => `<div class="cr"><span class="ci">${g.ico}</span><b>${g.t}</b></div>`).join('')}</div><div class="mbtns"><button class="btn primary" data-a="close">Oba!</button></div></div>`); render(); };
  ACT.passbuy = d => { const it = pastShop()[+d.i]; if (!it || ownedReward(it)) return; if (S.money < it[3]) return toast('Moedas insuficientes!', 'bad'); S.money -= it[3]; const g = giveReward2(it, it[4]); SFX.coin(); toast(`Comprou ${g.t}!`, 'good'); save(); render(); };
  ACT.passeq = d => { const s = sty(); if (!s.owned[d.id]) return; s[d.k] = s[d.k] === d.id ? (d.k === 'pose' ? 'p0' : 'b0') : d.id; save(); SFX.click2(); render(); };
  function vPass() { const p = pass(), se = seasonAt(nowT()), s = SEASONS[se.th], L = passLvl(p), into = L >= PASS_MAX ? PASS_XP : p.xp % PASS_XP, unc = Array.from({ length: L }, (_, i) => i + 1).filter(x => !p.got[x]).length, sy = sty();
    const row = Array.from({ length: PASS_MAX }, (_, i) => { const n = i + 1, r = passReward(n, se.th), got = p.got[n], can = n <= L && !got; return `<button class="pslot ${got ? 'got' : can ? 'can' : ''} ${n % 10 === 0 ? 'big' : ''}" ${can ? `data-a="passclaim" data-lv="${n}"` : ''}><small>${n}</small><span class="pi">${rwPrev(r, se.th)}</span><em>${got ? '✅' : can ? 'Pegar!' : rwName(r)}</em></button>`; }).join('');
    const shop = pastShop();
    return `<div class="card pshead" style="--pc:${s[6]}"><small>TEMPORADA ${se.i + 1} • GRÁTIS</small><h2>${s[1]} ${s[0]}</h2><p class="mut small">Termina em <b class="cdn" data-t="${se.end}">${cdn(se.end - nowT())}</b> • ${fmtBR(se.start)} → ${fmtBR(se.end)}</p>
      <div class="pslv"><b>Nv ${L}</b><div class="bar"><i style="width:${into}%"></i></div><small>${L >= PASS_MAX ? 'MÁXIMO!' : `${into}/${PASS_XP} XP`}</small></div>
      <p class="small">Ganhe XP do Passe: ⚔️ batalhas (+10 selvagem, +20 treinador) • 📜 missões (+60) • 🎁 bônus diário (+150) • ♾️ Lago Infinito (+15/onda)</p>
      ${unc ? `<button class="btn primary" data-a="passclaim" data-lv="all">Resgatar ${unc} recompensa(s)</button>` : ''}<div class="psmon"><img src="${sprId(s[3], true)}" alt=""><span>Nível 50: <b>${D.mons[s[3]].n} brilhante exclusivo</b> com Fita da Temporada</span></div></div>
      <div class="card"><h3>🎁 Trilha de recompensas</h3><div class="pstrack">${row}</div></div>
      <div class="card"><h3>🕺 Poses e Pokébolas</h3><p class="mut small">Poses aparecem no Cartão de Treinador; a cor da Pokébola aparece ao arremessar.</p><div class="stygrid">${[...POSES.slice(1).map(x => ['pose', x]), ...BALLS.slice(1).map(x => ['ball', x])].map(([k, x]) => { const own = sy.owned[x[0]], on = sy[k] === x[0]; return `<button class="sty ${on ? 'on' : ''} ${own ? 'own' : ''}" ${own ? `data-a="passeq" data-k="${k}" data-id="${x[0]}"` : ''}>${k === 'ball' ? ballIco(x[2]) : '<span class="sem">🕺</span>'}<b>${x[1]}</b><small>${on ? '✅ Usando' : own ? 'Usar' : '🎟️ Passe'}</small></button>`; }).join('')}</div></div>
      <div class="card"><h3>🏆 Títulos</h3><div class="stygrid">${SEASONS.map((x, i) => { const k = `ps-${i}`, own = (S.passTitles || {})[k]; return `<button class="sty ${S.title === k ? 'on' : ''} ${own ? 'own' : ''}" ${own ? `data-a="settitle" data-k="${k}"` : ''}><span class="sem">${x[1]}</span><b>${passTitle(k)}</b><small>${S.title === k ? '✅ Usando' : own ? 'Usar' : '🔒'}</small></button>`; }).join('')}</div></div>
      <div class="card"><h3>🛍️ Loja de Temporadas Passadas</h3><p class="mut small">Perdeu uma temporada? Os visuais voltam aqui por moedas — e cada tema volta a cada 6 temporadas.</p>${shop.length ? `<div class="stygrid">${shop.map((r, i) => { const own = ownedReward(r); return `<button class="sty ${own ? 'own' : ''}" ${own ? '' : `data-a="passbuy" data-i="${i}"`}><span class="sem">${r[0] === 'title' ? '🏆' : rwPrev(r)}</span><b>${r[0] === 'title' ? passTitle(r[1]) : rwName(r)}</b><small>${own ? '✅ Seu' : fmt(r[3])}</small></button>`; }).join('')}</div>` : '<p class="mut">Volte na próxima temporada!</p>'}</div>`; }
  XV.pass = vPass; MORE_TABS.push('pass');
  MORE_X.unshift(() => { const p = pass(); return ['pass', '🎟️', 'Passe de Temporada', `${SEASONS[seasonAt(nowT()).th][0]} • Nv ${passLvl(p)}/50`]; });
  HOME_X.push(() => { const p = pass(), se = seasonAt(nowT()), s = SEASONS[se.th], L = passLvl(p), unc = Array.from({ length: L }, (_, i) => i + 1).filter(x => !p.got[x]).length; return `<button class="card span2 psbanner" style="--pc:${s[6]}" data-a="tab" data-t="pass"><span class="pse">${s[1]}</span><div><small>PASSE DE TEMPORADA</small><b>${s[0]} • Nv ${L}</b><div class="bar"><i style="width:${L >= 50 ? 100 : p.xp % PASS_XP}%"></i></div>${unc ? `<span class="small">🎁 ${unc} para resgatar!</span>` : ''}</div><span class="arrow">›</span></button>`; });
  { const aw = award; award = async (...a) => { const before = B && B.awarded ? B.awarded.length : 0; const r = await aw(...a); try { if (B && !B.o.rogue && B.awarded && B.awarded.length > before) seasonXP(B.s.kind === 'trainer' ? 20 : 10); } catch (e) {} return r; }; }
  { const qc = ACT.qclaim; ACT.qclaim = d => { const n = S.stats.questsDone || 0; qc(d); if ((S.stats.questsDone || 0) > n) { seasonXP(60); save(); } }; }
  { const qb = ACT.qbonus; ACT.qbonus = () => { const q = ensureQuests(), had = q.bonus; qb(); if (!had && q.bonus) { seasonXP(150); save(); } }; }
  A.pass = { pass, seasonAt, seasonXP, passReward, pastShop };
  A.events = { cdOf, spOf, nextCDs, liveEv, eventSpawn, evolve: (m, to) => evolveAnim(m, to) };

  // ---------- boot ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (localStorage.getItem(UNLOCK_KEY) !== PASS_HASH) gate();
  else { const u = sessionStorage.getItem(SESSION_KEY); if (u && PS.accounts()[u]) startUser(u); else accountsScreen(); }
})();
