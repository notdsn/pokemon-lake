// Regiões pós-Johto (Hoenn → Paldea). Cada região abre ao virar Campeão da anterior.
// Mapa: [id, nome, tema, emoji, req (nº de insígnias ou 'ch'), descrição, [nvMin, nvMax], enc, treinadores]
// enc: [id, peso] ou [id, peso, {legend:1}] • níveis vêm do mapa • gym/elite: [líder, sprite, cidade|título, tipo, [[id, +nv]...]]
(function (G) {
  const C = G.PC, R = {};
  R.hoenn = { n: 'Hoenn', k: 'h', base: 60, prev: 'johto', game: 'Ruby/Sapphire/Emerald', story: 'Mar e terra em conflito: Groudon e Kyogre despertam, e Rayquaza vigia lá do céu.',
    badges: [['Pedra', 'hex', ['#a8a29e'], 'silver'], ['Punho', 'fist', ['#f97316']], ['Dínamo', 'sun', ['#facc15']], ['Calor', 'flame', ['#ef4444']], ['Equilíbrio', 'ring', ['#e11d48']], ['Pena', 'wings', ['#38bdf8'], 'silver'], ['Mente', 'heart', ['#d946ef']], ['Chuva', 'drop', ['#2563eb']]],
    gyms: [['Roxanne', 'roxanne', 'Rustboro', 'rock', [[299, 0], [75, 1], [348, 1], [76, 3]]],
      ['Brawly', 'brawly', 'Dewford', 'fighting', [[296, 1], [67, 2], [308, 3], [297, 4]]],
      ['Wattson', 'wattson', 'Mauville', 'electric', [[101, 3], [82, 4], [311, 4], [310, 5]]],
      ['Flannery', 'flannery', 'Lavaridge', 'fire', [[219, 5], [323, 5], [78, 6], [324, 7]]],
      ['Norman', 'norman', 'Petalburg', 'normal', [[288, 7], [335, 7], [264, 8], [289, 9]]],
      ['Winona', 'winona', 'Fortree', 'flying', [[277, 8], [279, 8], [357, 9], [227, 9], [334, 10]]],
      ['Tate & Liza', 'tate', 'Mossdeep', 'psychic', [[344, 10], [178, 10], [337, 10], [338, 10], [282, 11]]],
      ['Juan', 'juan', 'Sootopolis', 'water', [[340, 12], [342, 12], [365, 12], [350, 13], [230, 13]]]],
    elite: [['Sidney', 'sidney', 'Elite Four de Hoenn', 'dark', [[262, 14], [275, 14], [332, 14], [319, 15], [359, 16]]],
      ['Phoebe', 'phoebe', 'Elite Four de Hoenn', 'ghost', [[356, 14], [354, 14], [302, 15], [354, 15], [356, 16]]],
      ['Glacia', 'glacia', 'Elite Four de Hoenn', 'ice', [[362, 15], [364, 15], [362, 15], [364, 16], [365, 17]]],
      ['Drake', 'drake', 'Elite Four de Hoenn', 'dragon', [[372, 16], [330, 16], [334, 16], [230, 17], [373, 18]]],
      ['Steven', 'steven', 'Campeão de Hoenn', 'steel', [[227, 18], [344, 18], [346, 18], [348, 18], [306, 19], [376, 20]]]],
    maps: [['h_rota101', 'Rotas 101–104', 'grass', '🌱', 0, 'Littleroot, Oldale e Petalburg. Os primeiros passos em Hoenn!', [56, 62], [[261, 12], [263, 14], [265, 12], [270, 8], [273, 8], [276, 8], [278, 10], [280, 5], [285, 6], [287, 5], [293, 6], [300, 6], [252, 2], [255, 2], [258, 2], [380, 0.2, { legend: 1, roam: 1 }], [381, 0.2, { legend: 1, roam: 1 }]]],
      ['h_bosque', 'Bosque Petalburg & Caverna Granito', 'forest', '🌲', 1, 'Mata fechada e uma caverna escura cheia de Sableye e Aron.', [58, 64], [[266, 8], [268, 8], [267, 4], [269, 4], [285, 8], [290, 8], [296, 10], [302, 6], [303, 6], [304, 10], [307, 8], [287, 5], [271, 4]]],
      ['h_deserto', 'Rota 111 & Deserto', 'safari', '🏜️', 2, 'Tempestade de areia constante. Trapinch, Cacnea e Baltoy vivem aqui.', [60, 66], [[328, 12], [329, 4], [331, 10], [332, 4], [343, 10], [344, 3], [327, 8], [322, 8], [313, 4], [314, 4], [345, 2], [347, 2]]],
      ['h_chimney', 'Monte Chimney & Trilha Ardente', 'volcano', '🌋', 3, 'Cinzas vulcânicas caem como neve. Lar dos Numel e Torkoal.', [62, 68], [[322, 12], [323, 5], [324, 8], [218, 8], [219, 4], [66, 6], [74, 6], [337, 4], [338, 4], [327, 6]]],
      ['h_mar', 'Rotas Marinhas 124–134', 'water', '🌊', 4, 'O mar aberto de Hoenn. Nas profundezas, algo antigo dorme...', [64, 70], [[278, 10], [279, 5], [318, 10], [319, 4], [320, 8], [321, 3], [339, 6], [340, 3], [341, 6], [342, 3], [349, 2], [350, 1], [363, 6], [366, 4], [369, 1], [370, 6], [382, 0.3, { legend: 1 }]]],
      ['h_caverna', 'Caverna Terremoto & Ruínas', 'cave', '🕳️', 6, 'Túneis tremem sem parar. Dizem que Groudon descansa aqui, e os Regis guardam as ruínas.', [66, 72], [[299, 8], [304, 8], [305, 4], [306, 2], [309, 8], [311, 5], [312, 5], [315, 6], [316, 6], [345, 4], [347, 4], [351, 5], [353, 6], [355, 6], [360, 4], [361, 6], [383, 0.3, { legend: 1 }], [377, 0.2, { legend: 1 }], [378, 0.2, { legend: 1 }], [379, 0.2, { legend: 1 }]]],
      ['h_pilar', 'Pilar Celeste', 'sky', '☁️', 8, 'Uma torre em ruínas acima das nuvens. Rayquaza mora no topo.', [70, 76], [[333, 10], [334, 4], [357, 6], [358, 6], [359, 5], [371, 6], [372, 3], [374, 5], [375, 2], [354, 6], [356, 5], [384, 0.3, { legend: 1 }]]],
      ['h_ilhas', 'Ilha do Sul & Ilha Miragem', 'psychic', '🏝️', 'ch', 'Pós-Hoenn. Ilhas que só aparecem às vezes. Jirachi e Deoxys foram vistos aqui!', [74, 80], [[280, 6], [281, 5], [282, 3], [335, 6], [336, 6], [351, 6], [357, 6], [373, 2], [376, 2], [380, 0.6, { legend: 1 }], [381, 0.6, { legend: 1 }], [385, 0.25, { legend: 1 }], [386, 0.25, { legend: 1 }]]]] };
  G.PREG = R; G.PREG_ORDER = ['hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'];
  const lv = (r, o) => Math.min(100, r.base + o);
  for (const [key, r] of Object.entries(R)) {
    r.key = key;
    r.GYMS = r.gyms.map(([leader, sprite, city, type, team], i) => ({ leader, sprite, city, type, team: team.map(([id, o]) => [id, lv(r, o)]), prize: 12000 + i * 1500 }));
    r.ELITE = r.elite.map(([leader, sprite, title, type, team], i) => ({ leader, sprite, title, type, team: team.map(([id, o]) => [id, lv(r, o)]), prize: i === 4 ? 40000 : 18000 }));
    r.BADGES = r.badges.map(b => b[0]);
    r.MAPS = r.maps.map(([id, name, theme, emoji, rq, desc, lvr, enc, trainers]) => ({ id, region: key, name, theme, emoji, req: rq === 'ch' ? { r: key, ch: 1 } : { r: key, b: rq }, desc, lv: lvr,
      enc: enc.map(([i, w, o]) => o && o.legend ? [i, w, lvr[1], lvr[1], o] : [i, w, lvr[0], lvr[1]]), trainers: trainers || [], finds: [] }));
    C.MAPS.push(...r.MAPS);
  }
})(typeof window !== 'undefined' ? window : globalThis);
