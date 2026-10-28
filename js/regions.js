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

  R.sinnoh = { n: 'Sinnoh', k: 's', base: 65, prev: 'hoenn', game: 'Diamond/Pearl/Platinum', story: 'Terra dos mitos: o tempo (Dialga), o espaço (Palkia) e o Mundo Distorcido de Giratina.',
    badges: [['Carvão', 'hex', ['#57534e'], 'silver'], ['Floresta', 'leaf', ['#22c55e']], ['Pedregulho', 'oct', ['#d97706']], ['Pântano', 'drop', ['#0ea5e9'], 'silver'], ['Relíquia', 'star5', ['#a855f7']], ['Mina', 'diamond', ['#94a3b8'], 'silver'], ['Pingente', 'snow', ['#a5f3fc'], 'silver'], ['Farol', 'sun', ['#fbbf24']]],
    gyms: [['Roark', 'roark', 'Oreburgh', 'rock', [[95, 0], [76, 1], [409, 3]]],
      ['Gardenia', 'gardenia', 'Eterna', 'grass', [[421, 1], [455, 2], [407, 3]]],
      ['Maylene', 'maylene', 'Veilstone', 'fighting', [[308, 3], [68, 3], [448, 5]]],
      ['Crasher Wake', 'crasherwake', 'Pastoria', 'water', [[130, 4], [195, 4], [419, 5]]],
      ['Fantina', 'fantina', 'Hearthome', 'ghost', [[426, 6], [94, 6], [429, 7]]],
      ['Byron', 'byron', 'Canalave', 'steel', [[437, 7], [208, 7], [411, 9]]],
      ['Candice', 'candice', 'Snowpoint', 'ice', [[460, 9], [461, 9], [473, 10], [478, 10]]],
      ['Volkner', 'volkner', 'Sunyshore', 'electric', [[26, 11], [135, 11], [405, 12], [466, 13]]]],
    elite: [['Aaron', 'aaron', 'Elite Four de Sinnoh', 'bug', [[469, 14], [212, 14], [416, 14], [214, 15], [452, 16]]],
      ['Bertha', 'bertha', 'Elite Four de Sinnoh', 'ground', [[195, 14], [340, 14], [464, 15], [76, 15], [450, 16]]],
      ['Flint', 'flint', 'Elite Four de Sinnoh', 'fire', [[78, 15], [467, 16], [136, 15], [229, 16], [392, 17]]],
      ['Lucian', 'lucian', 'Elite Four de Sinnoh', 'psychic', [[122, 16], [203, 16], [437, 16], [475, 17], [65, 18]]],
      ['Cynthia', 'cynthia', 'Campeã de Sinnoh', 'dragon', [[442, 18], [407, 18], [468, 19], [350, 18], [448, 19], [445, 20]]]],
    maps: [['s_rota201', 'Rotas 201–204 & Lago Verdade', 'grass', '🌱', 0, 'Twinleaf, Sandgem e Jubilife. No Lago Verdade, Uxie dorme.', [64, 70], [[396, 12], [399, 12], [401, 10], [403, 10], [406, 6], [412, 5], [415, 5], [418, 8], [433, 3], [387, 2], [390, 2], [393, 2], [480, 0.3, { legend: 1 }]]],
      ['s_bosque', 'Bosque Eterna', 'forest', '🌲', 1, 'Árvores antigas, Burmy por todo lado e um Spiritomb escondido.', [66, 72], [[406, 8], [315, 6], [412, 8], [413, 3], [414, 3], [415, 6], [420, 8], [421, 3], [455, 4], [425, 6], [402, 4], [427, 6], [442, 1]]],
      ['s_coronet', 'Monte Coronet', 'cave', '⛰️', 2, 'A montanha que divide Sinnoh. Gible vive nas cavernas mais fundas.', [68, 74], [[41, 8], [42, 4], [66, 6], [74, 8], [75, 4], [95, 4], [436, 6], [437, 2], [443, 3], [444, 1], [433, 4], [358, 3]]],
      ['s_pantano', 'Grande Pântano', 'safari', '🐊', 3, 'A Zona Safári de Sinnoh: lama, Croagunk e Skorupi.', [68, 74], [[194, 8], [195, 4], [453, 8], [454, 3], [451, 8], [452, 3], [399, 6], [400, 4], [357, 3], [443, 2], [397, 4]]],
      ['s_lagos', 'Lago Agudo & Lago Valor', 'water', '💧', 4, 'Dois lagos sagrados. Mesprit e Azelf foram vistos aqui.', [70, 76], [[418, 8], [419, 4], [422, 8], [423, 4], [456, 6], [457, 3], [458, 4], [129, 6], [130, 2], [339, 6], [340, 3], [481, 0.3, { legend: 1 }], [482, 0.3, { legend: 1 }]]],
      ['s_neve', 'Rotas 216–217 & Snowpoint', 'ice', '❄️', 5, 'Nevasca eterna no norte de Sinnoh.', [72, 78], [[459, 10], [460, 3], [215, 6], [461, 2], [220, 6], [221, 4], [473, 2], [478, 3], [471, 1], [361, 6]]],
      ['s_lanca', 'Coluna Lança', 'sky', '🏛️', 8, 'Ruínas no topo do Monte Coronet. Dialga e Palkia aparecem aqui.', [74, 80], [[425, 6], [426, 4], [429, 6], [442, 3], [444, 4], [445, 1], [436, 6], [437, 4], [474, 2], [483, 0.3, { legend: 1 }], [484, 0.3, { legend: 1 }]]],
      ['s_distorcido', 'Mundo Distorcido & Ilhas', 'ghost', '🌀', 'ch', 'Pós-Sinnoh. Giratina, Heatran, Regigigas, Cresselia, Darkrai, Shaymin... e talvez Arceus.', [76, 82], [[429, 6], [477, 4], [478, 4], [442, 4], [487, 0.3, { legend: 1 }], [485, 0.25, { legend: 1 }], [486, 0.2, { legend: 1 }], [488, 0.25, { legend: 1 }], [491, 0.2, { legend: 1 }], [492, 0.2, { legend: 1 }], [489, 0.2, { legend: 1 }], [490, 0.15, { legend: 1 }], [493, 0.1, { legend: 1 }]]]] };
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
