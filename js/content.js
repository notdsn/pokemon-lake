// Conteúdo do jogo: mapas, treinadores, ginásios, liga, loja.
(function (G) {
  const TYPE_PT = { normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Veneno',ground:'Terra',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada' };
  const TYPE_COLOR = { normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD' };
  const STARTERS = [[1,4,7],[152,155,158],[252,255,258],[387,390,393]];
  const REGIONS = ['Kanto','Johto','Hoenn','Sinnoh'];
  const AVATARS = ['red','leaf','ethan','lyra','brendan','may','lucas','dawn'];
  // enc: [id, peso, minLv, maxLv, {night/day/weather}] ; trainers: [nome, sprite, [[id,lv]...], dinheiro]
  const MAPS = [
    { id:'rota1', name:'Rota 1', theme:'grass', emoji:'🌾', req:0, desc:'Campos tranquilos perto de Pallet.', lv:[2,5],
      enc:[[16,30,2,5],[19,30,2,5],[10,10,2,4],[13,10,2,4],[21,10,3,5],[29,5,3,5],[32,5,3,5],[52,3,3,5,{night:1}],[133,1,4,6]],
      trainers:[['Jovem Joãozinho','youngster',[[19,4],[16,5]],120],['Menina Lia','lass',[[29,5],[39,6]],140]] },
    { id:'floresta', name:'Floresta de Viridian', theme:'forest', emoji:'🌲', req:0, desc:'Mata fechada cheia de insetos. Dizem que há um Pikachu por aqui.', lv:[3,8],
      enc:[[10,25,3,6],[11,10,4,7],[13,25,3,6],[14,10,4,7],[25,6,4,7],[43,10,4,7,{night:1}],[69,8,4,7],[46,6,4,7],[48,4,5,8,{night:1}],[123,1,7,9],[127,1,7,9]],
      trainers:[['Caça-Inseto Rafa','bugcatcher',[[10,6],[13,6],[11,8]],160],['Caça-Inseto Duda','bugcatcher',[[14,8],[12,9]],200]] },
    { id:'mtmoon', name:'Mt. Moon', theme:'cave', emoji:'🌙', req:1, desc:'Caverna escura. Fadas dançam sob a lua cheia.', lv:[8,13],
      enc:[[41,35,8,12],[74,30,8,12],[46,10,9,12],[35,6,9,13,{night:1}],[27,10,9,12],[95,3,11,13],[104,6,9,12],[50,8,9,12]],
      trainers:[['Montanhista Beto','hiker',[[74,11],[74,11],[95,12]],300],['Pokémaníaco Kiko','pokemaniac',[[104,12],[35,13]],320]] },
    { id:'cerulean', name:'Cabo de Cerulean', theme:'water', emoji:'🌊', req:2, desc:'Praias e lagos. Use a vara e procure na água!', lv:[13,20],
      enc:[[54,15,13,18],[118,15,13,18],[60,15,13,18],[72,15,13,18],[79,8,14,18],[116,8,13,18],[98,10,13,18],[120,8,14,18,{night:1}],[129,15,10,18],[86,4,15,20],[147,1,15,18],[131,0.6,20,24]],
      trainers:[['Nadador Caio','swimmer',[[72,16],[60,17],[118,17]],400],['Pescador Zé','fisherman',[[129,15],[129,15],[129,15],[130,20]],520]] },
    { id:'torre', name:'Torre Pokémon', theme:'ghost', emoji:'👻', req:3, desc:'Torre assombrada de Lavender. À noite os fantasmas ficam agitados.', lv:[18,25],
      enc:[[92,40,18,23],[93,8,22,25,{night:1}],[104,20,18,23],[96,15,18,23],[41,15,19,23],[200,0,1,1]].filter(e=>e[0]!==200),
      trainers:[['Médium Sara','psychic',[[92,22],[92,22],[93,24]],600],['Exorcista Léo','scientist',[[96,23],[104,24],[105,25]],620]] },
    { id:'safari', name:'Zona Safári', theme:'safari', emoji:'🦏', req:4, desc:'Reserva com Pokémon raros: Tauros, Chansey, Scyther, Dratini...', lv:[22,30],
      enc:[[102,15,22,28],[111,15,22,28],[33,12,22,28],[30,12,22,28],[115,5,24,28],[128,5,24,28],[123,5,24,28],[127,5,24,28],[113,3,24,28],[147,4,22,28],[48,10,22,28],[84,10,22,28],[49,4,26,30,{night:1}]],
      trainers:[['Treinadora Ana','acetrainerf',[[115,28],[30,27],[113,28]],900],['Treinador Vítor','acetrainer',[[128,28],[111,28],[123,29]],900]] },
    { id:'usina', name:'Usina Elétrica', theme:'electric', emoji:'⚡', req:5, desc:'Faíscas pelo ar. O pássaro lendário do trovão foi visto aqui.', lv:[28,35],
      enc:[[81,30,28,33],[82,8,32,35],[100,30,28,33],[101,8,32,35],[25,15,28,33],[125,6,30,35],[145,0.4,50,50,{legend:1}]],
      trainers:[['Cientista Hugo','scientist',[[81,32],[100,32],[82,34]],1000],['Engenheiro Téo','burglar',[[101,34],[125,35]],1100]] },
    { id:'seafoam', name:'Ilhas Seafoam', theme:'ice', emoji:'❄️', req:6, desc:'Cavernas geladas no mar. Um pássaro de gelo dorme nas profundezas.', lv:[32,40],
      enc:[[86,25,32,37],[87,8,36,40],[90,20,32,37],[124,8,34,38],[79,15,32,37],[80,6,36,40],[42,15,32,37],[131,3,35,40],[144,0.4,50,50,{legend:1}]],
      trainers:[['Esquiadora Bia','beauty',[[87,38],[91,38]],1300],['Nadador Gui','swimmer',[[131,38],[80,39]],1300]] },
    { id:'vulcao', name:'Monte Brasa', theme:'volcano', emoji:'🌋', req:7, desc:'Vulcão ativo. Muito calor e Pokémon de fogo — e talvez Moltres.', lv:[36,44],
      enc:[[77,25,36,41],[78,6,40,44],[58,20,36,41],[37,15,36,41],[126,8,38,43],[66,15,36,41],[67,6,40,44],[74,10,36,40],[146,0.4,50,50,{legend:1}]],
      trainers:[['Faixa-Preta Kenji','blackbelt',[[67,42],[66,41],[107,43]],1600],['Treinador Ícaro','acetrainer',[[78,43],[59,44]],1700]] },
    { id:'vitoria', name:'Estrada Vitória', theme:'cave', emoji:'🏆', req:8, desc:'O último desafio antes da Liga Pokémon.', lv:[42,50],
      enc:[[67,20,42,47],[75,20,42,47],[42,20,42,47],[105,10,44,48],[95,10,42,47],[57,10,44,48],[112,6,46,50],[143,1,45,50]],
      trainers:[['Treinador Elite Davi','acetrainer',[[112,48],[65,48],[130,48]],2500],['Treinadora Elite Mel','acetrainerf',[[36,48],[121,48],[3,49]],2500]] },
    { id:'cerulcave', name:'Caverna Celeste', theme:'psychic', emoji:'🔮', req:'champion', desc:'Pós-jogo. Pokémon fortíssimos... e algo criado em laboratório.', lv:[55,65],
      enc:[[132,15,55,62],[42,15,55,62],[64,10,55,62],[82,10,55,62],[47,10,55,62],[202,0,1,1],[113,4,58,62],[101,10,55,62],[150,0.3,70,70,{legend:1}],[151,0.1,60,60,{legend:1}]].filter(e=>e[0]!==202) },
    { id:'torresino', name:'Pilar Celeste (Hoenn)', theme:'sky', emoji:'☁️', req:'champion', desc:'Pós-jogo. Os lendários de Hoenn surgem entre as nuvens. (Os de Johto agora vivem em Johto!)', lv:[45,60],
      enc:[[377,2,50,50,{legend:1}],[378,2,50,50,{legend:1}],[379,2,50,50,{legend:1}],[380,1.5,55,55,{legend:1}],[381,1.5,55,55,{legend:1}],[382,0.8,70,70,{legend:1}],[383,0.8,70,70,{legend:1}],[384,0.5,70,70,{legend:1}],[148,15,45,52],[149,3,55,58],[22,20,45,52],[18,20,45,52],[142,6,50,55],[248,0,1,1]].filter(e=>e[0]!==248) },
  ];

  // ===================== JOHTO (liberado ao virar Campeão de Kanto) =====================
  // níveis de Johto são de pós-jogo: equipes HGSS com níveis ajustados (~42 + 0,85×nível original)
  const jl = l => Math.round(42 + l * 0.85);
  const ROAM = [[243,0.25,55,55,{legend:1,roam:1}],[244,0.25,55,55,{legend:1,roam:1}],[245,0.25,55,55,{legend:1,roam:1}]];
  const JMAPS = [
    { id:'j_rota29', region:'johto', name:'Rotas 29–31', theme:'grass', emoji:'🌱', req:{j:0}, desc:'Começo da jornada em Johto, entre New Bark e Violet. Cães lendários correm por aqui!', lv:[44,50],
      enc:[[161,25,44,48],[162,6,48,50],[163,20,44,48,{night:1}],[164,5,48,50,{night:1}],[165,15,44,48,{day:1}],[166,4,48,50,{day:1}],[167,15,44,48,{night:1}],[168,4,48,50,{night:1}],[179,12,44,48],[180,4,48,50],[187,10,44,48],[191,8,44,48],[16,10,44,48],[19,10,44,48],...ROAM],
      trainers:[['Jovem Joey','youngster',[[19,48],[20,50]],2200],['Avicultor Abel','birdkeeper',[[16,48],[163,49],[17,50]],2300]], finds:[['pidgeotite',1]] },
    { id:'j_cavernaescura', region:'johto', name:'Caverna Escura', theme:'cave', emoji:'🕳️', req:{j:1}, desc:'Túneis sem luz entre Violet e Blackthorn.', lv:[46,52],
      enc:[[41,25,46,50],[42,8,49,52],[74,20,46,50],[206,12,46,50],[202,6,47,51],[207,8,47,51],[218,10,46,50],[219,3,50,52],[95,5,48,52],[231,6,46,50]],
      trainers:[['Montanhista Russo','hiker',[[74,49],[95,50],[208,52]],2600]], finds:[['steelixite',1]] },
    { id:'j_ruinas', region:'johto', name:'Ruínas de Alph', theme:'psychic', emoji:'🗿', req:{j:1}, desc:'Ruínas antigas cheias de Unown e mistérios.', lv:[46,52],
      enc:[[201,40,46,50],[177,15,46,50],[178,4,50,52],[203,10,46,50],[235,6,47,51],[202,6,47,51],[96,8,46,50]],
      trainers:[['Médium Íris','psychic',[[177,50],[203,51],[178,52]],2700]], finds:[['alakazite',1]] },
    { id:'j_ilex', region:'johto', name:'Bosque de Ilex', theme:'forest', emoji:'🍃', req:{j:2}, desc:'Floresta sagrada com um santuário antigo. Dizem que Celebi viaja no tempo até aqui.', lv:[47,53],
      enc:[[46,15,47,51],[47,5,51,53],[43,15,47,51,{night:1}],[44,4,51,53,{night:1}],[204,12,47,51],[205,3,51,53],[193,8,47,51,{day:1}],[214,3,49,53],[10,10,47,50],[13,10,47,50],[251,0.1,50,50,{legend:1}]],
      trainers:[['Caça-Inseto Benny','bugcatcher',[[123,51],[214,52],[205,52]],2800]], finds:[['heracronite',1],['scizorite',1]] },
    { id:'j_queimada', region:'johto', name:'Torre Queimada', theme:'ghost', emoji:'🔥', req:{j:3}, desc:'Ruínas queimadas de Ecruteak. Foi daqui que os três cães lendários despertaram.', lv:[49,55],
      enc:[[92,20,49,53],[93,6,53,55,{night:1}],[200,10,49,53,{night:1}],[198,10,49,53,{night:1}],[109,12,49,53],[19,10,49,53],[20,4,53,55],[58,8,49,53],[228,8,49,53,{night:1}],[243,0.5,55,55,{legend:1,roam:1}],[244,0.5,55,55,{legend:1,roam:1}],[245,0.5,55,55,{legend:1,roam:1}]],
      trainers:[['Sábio Ping','psychic',[[92,53],[93,54],[200,55]],3000],['Cuspidor de Fogo Ray','blackbelt',[[218,53],[58,54],[126,55]],3000]], finds:[['houndoominite',1],['gengarite',1]] },
    { id:'j_ecruteak', region:'johto', name:'Rotas de Ecruteak', theme:'safari', emoji:'🌳', req:{j:3}, desc:'Campos e bosques entre Goldenrod e Olivine. A Miltank famosa pasta por aqui.', lv:[49,55],
      enc:[[185,6,50,54],[234,10,49,53],[209,10,49,53],[210,3,53,55],[216,10,49,53],[217,3,53,55],[190,10,49,53,{day:1}],[188,8,49,53],[189,3,53,55],[183,10,49,53],[184,3,53,55],[194,8,49,53],[195,3,53,55],[241,6,49,53],[232,4,52,55],[58,6,49,53],[37,6,49,53],...ROAM],
      trainers:[['Treinadora Gina','acetrainerf',[[184,54],[210,54],[241,55]],3200],['Malabarista Iru','juggler',[[234,54],[217,55]],3200]], finds:[['ampharosite',1],['kangaskhanite',1]] },
    { id:'j_olivine', region:'johto', name:'Mar de Olivine', theme:'water', emoji:'⚓', req:{j:4}, desc:'Mar aberto e o farol de Olivine. Mantine saltam entre as ondas.', lv:[51,57],
      enc:[[72,15,51,55],[73,5,55,57],[170,15,51,55],[171,4,55,57],[226,6,52,56],[211,8,51,55],[222,8,51,55],[223,10,51,55],[224,3,55,57],[213,5,51,55],[98,8,51,55],[99,3,55,57],[227,4,52,56],[116,6,51,55],[117,3,55,57],...ROAM],
      trainers:[['Nadadora Kara','swimmer',[[171,56],[224,56],[226,57]],3400],['Pescador Ralph','fisherman',[[223,55],[211,56],[130,57]],3400]], finds:[['blastoisinite',1],['swampertite',1]] },
    { id:'j_lagofuria', region:'johto', name:'Lago da Fúria', theme:'water', emoji:'🔴', req:{j:5}, desc:'Algo fez os Magikarp evoluírem à força... dizem que há um Gyarados VERMELHO no lago!', lv:[52,58],
      enc:[[129,45,30,45],[130,15,52,58],[118,10,52,56],[119,4,56,58],[60,8,52,56],[61,3,56,58],[183,8,52,56],[130,0.6,58,58,{shiny:1}]],
      trainers:[['Pescador Andre','fisherman',[[130,57],[130,57],[119,58]],3600]], finds:[['gyaradosite',1]] },
    { id:'j_gelo', region:'johto', name:'Caminho Gelado', theme:'ice', emoji:'🧊', req:{j:6}, desc:'Caverna congelada antes de Blackthorn. Cuidado com o chão escorregadio.', lv:[54,60],
      enc:[[220,20,54,58],[221,6,58,60],[215,12,54,58,{night:1}],[225,10,54,58],[238,8,54,58],[124,4,57,60],[41,10,54,58],[42,8,57,60],[86,8,54,58],[87,3,57,60],[131,2,56,60]],
      trainers:[['Esquiadora Roxanne','beauty',[[221,59],[215,59],[124,60]],3800]], finds:[['pinsirite',1],['latiosite',1]] },
    { id:'j_redemoinho', region:'johto', name:'Ilhas Redemoinho', theme:'water', emoji:'🌀', req:{j:7}, desc:'Correntezas furiosas. No fundo das ilhas, o Guardião dos Mares — Lugia — dorme.', lv:[55,62],
      enc:[[72,15,55,60],[73,8,58,62],[116,10,55,60],[117,6,58,62],[230,2,60,62],[90,10,55,60],[91,4,58,62],[86,8,55,60],[87,4,58,62],[42,10,55,60],[223,8,55,60],[249,0.4,70,70,{legend:1}]],
      trainers:[['Nadador Tony','swimmer',[[91,61],[87,61],[230,62]],4200]], finds:[['latiasite',1],['slowbronite',1]] },
    { id:'j_sino', region:'johto', name:'Torre do Sino', theme:'sky', emoji:'🔔', req:{j:8}, desc:'A torre de nove andares de Ecruteak. Com as 8 insígnias, Ho-Oh desce do arco-íris.', lv:[56,62],
      enc:[[92,15,56,60],[93,6,60,62],[177,15,56,60],[178,6,60,62],[163,15,56,60,{night:1}],[164,6,60,62,{night:1}],[198,8,56,60,{night:1}],[200,6,56,60,{night:1}],[250,0.4,70,70,{legend:1}],...ROAM],
      trainers:[['Sábio Li','psychic',[[178,62],[164,62],[93,62]],4500]], finds:[['charizardite-x',1],['charizardite-y',1]] },
    { id:'j_dragao', region:'johto', name:'Toca do Dragão', theme:'cave', emoji:'🐉', req:{j:8}, desc:'O santuário dos domadores de dragão de Blackthorn.', lv:[56,63],
      enc:[[147,30,56,60],[148,10,60,63],[129,30,40,50],[116,12,56,60],[117,6,60,63],[230,1.5,62,63],[149,0.5,63,63]],
      trainers:[['Domadora Lola','acetrainerf',[[148,62],[230,63],[149,63]],5000]], finds:[['ampharosite',1]] },
    { id:'j_monteprata', region:'johto', name:'Monte Prata', theme:'volcano', emoji:'🏔️', req:'jchampion', desc:'Pós-Johto. A montanha mais perigosa do mundo. Lá no topo, um treinador silencioso espera...', lv:[62,72],
      enc:[[246,12,62,66],[247,5,66,70],[248,1.5,70,72],[232,10,62,68],[217,10,62,68],[200,8,62,68,{night:1}],[215,10,62,68],[42,10,62,68],[227,8,62,68],[198,6,62,68,{night:1}],[229,4,66,70,{night:1}],[241,5,62,68],[128,5,62,68],[143,1,66,70]],
      trainers:[['Red','red',[[25,88],[196,84],[197,84],[143,86],[3,86],[6,86],[9,86]],20000]], finds:[['tyranitarite',2],['mewtwonite-x',0.5],['mewtwonite-y',0.5],['sceptilite',1],['blazikenite',1]] },
  ];
  const JBADGES = ['Zéfiro','Colmeia','Planície','Névoa','Tempestade','Mineral','Geleira','Ascensão'];
  const JBADGE_COLOR = ['#93c5fd','#a3e635','#f9a8d4','#a78bfa','#fb923c','#cbd5e1','#67e8f9','#6366f1'];
  // team: [id, nível, {item}] — item = Mega Pedra para a CPU Mega Evoluir (só Elite/Campeões)
  const JGYMS = [
    { leader:'Falkner', sprite:'falkner', city:'Violet', type:'flying', team:[[16,jl(9)],[17,jl(13)]], prize:6000, reward:'pidgeotite' },
    { leader:'Bugsy', sprite:'bugsy', city:'Azalea', type:'bug', team:[[11,jl(15)],[14,jl(15)],[123,jl(17)]], prize:6500, reward:'scizorite' },
    { leader:'Whitney', sprite:'whitney', city:'Goldenrod', type:'normal', team:[[35,jl(17)],[241,jl(19)]], prize:7000, reward:'kangaskhanite' },
    { leader:'Morty', sprite:'morty', city:'Ecruteak', type:'ghost', team:[[92,jl(21)],[93,jl(21)],[93,jl(23)],[94,jl(25)]], prize:7500, reward:'gengarite' },
    { leader:'Chuck', sprite:'chuck', city:'Cianwood', type:'fighting', team:[[57,jl(27)],[62,jl(30)]], prize:8000, reward:'heracronite' },
    { leader:'Jasmine', sprite:'jasmine', city:'Olivine', type:'steel', team:[[81,jl(30)],[81,jl(30)],[208,jl(35)]], prize:8500, reward:'steelixite' },
    { leader:'Pryce', sprite:'pryce', city:'Mahogany', type:'ice', team:[[86,jl(30)],[87,jl(32)],[221,jl(34)]], prize:9000, reward:'swampertite' },
    { leader:'Clair', sprite:'clair', city:'Blackthorn', type:'dragon', team:[[148,jl(37)],[148,jl(37)],[148,jl(37)],[230,jl(40)]], prize:10000, reward:'ampharosite' },
  ];
  const JELITE = [
    { leader:'Will', sprite:'will', title:'Elite Four de Johto', type:'psychic', team:[[178,jl(40)],[124,jl(41)],[103,jl(41)],[178,jl(42)],[80,jl(41),{item:'slowbronite'}]], prize:12000, reward:'latiosite' },
    { leader:'Koga', sprite:'koga', title:'Elite Four de Johto', type:'poison', team:[[168,jl(40)],[49,jl(41)],[205,jl(43)],[89,jl(42)],[169,jl(44)]], prize:12000, reward:'beedrillite' },
    { leader:'Bruno', sprite:'bruno', title:'Elite Four de Johto', type:'fighting', team:[[237,jl(42)],[106,jl(42)],[107,jl(42)],[95,jl(43)],[68,jl(46)]], prize:12000, reward:'tyranitarite' },
    { leader:'Karen', sprite:'karen', title:'Elite Four de Johto', type:'dark', team:[[197,jl(42)],[45,jl(42)],[198,jl(44)],[94,jl(45)],[229,jl(47),{item:'houndoominite'}]], prize:12000, reward:'houndoominite' },
    { leader:'Lance', sprite:'lance', title:'Campeão de Johto', type:'dragon', team:[[130,jl(44),{item:'gyaradosite'}],[149,jl(47)],[149,jl(47)],[142,jl(46)],[6,jl(46)],[149,jl(50)]], prize:25000, reward:'latiasite' },
  ];
  // Mega Pedras: segure no Pokémon certo + Mega Pulseira (prêmio de Campeão de Kanto)
  const MEGA_STONES = { venusaurite:'Venusaurita', 'charizardite-x':'Charizardita X', 'charizardite-y':'Charizardita Y', blastoisinite:'Blastoisinita', beedrillite:'Beedrillita',
    pidgeotite:'Pidgeotita', alakazite:'Alakazita', slowbronite:'Slowbronita', gengarite:'Gengarita', kangaskhanite:'Kangaskhanita', pinsirite:'Pinsirita', gyaradosite:'Gyaradosita',
    aerodactylite:'Aerodactylita', 'mewtwonite-x':'Mewtwonita X', 'mewtwonite-y':'Mewtwonita Y', ampharosite:'Ampharosita', steelixite:'Steelixita', scizorite:'Scizorita', heracronite:'Heracronita',
    houndoominite:'Houndoominita', tyranitarite:'Tyranitarita', sceptilite:'Sceptilita', blazikenite:'Blazikenita', swampertite:'Swampertita', latiasite:'Latiasita', latiosite:'Latiosita' };
  // Pontos de Batalha (Torre de Batalha) -> Mega Pedras
  const BP_SHOP = Object.keys(MEGA_STONES).map(k => ({ id:k, bp: /mewtwonite|latia|latio|tyranitar/.test(k) ? 48 : 32 }));
  // prêmio de 1ª vitória contra cada líder/Elite de Kanto (também vale em revanche, uma vez)
  const KANTO_REWARD = { gym:['aerodactylite','gyaradosite','ampharosite','venusaurite','beedrillite','alakazite','charizardite-y','kangaskhanite'], elite:['slowbronite','pinsirite','gengarite','blastoisinite','charizardite-x'] };
  const BADGES = ['Rocha','Cascata','Trovão','Arco-Íris','Alma','Pântano','Vulcão','Terra'];
  const BADGE_COLOR = ['#9ca3af','#38bdf8','#facc15','#4ade80','#e879f9','#f59e0b','#ef4444','#22c55e'];
  const GYMS = [
    { leader:'Brock', sprite:'brock', city:'Pewter', type:'rock', team:[[74,12],[95,14]], prize:1400, tm:'Rocha' },
    { leader:'Misty', sprite:'misty', city:'Cerulean', type:'water', team:[[120,18],[121,21]], prize:2100 },
    { leader:'Lt. Surge', sprite:'ltsurge', city:'Vermilion', type:'electric', team:[[100,21],[25,18],[26,24]], prize:2400 },
    { leader:'Erika', sprite:'erika', city:'Celadon', type:'grass', team:[[71,29],[114,24],[45,29]], prize:2900 },
    { leader:'Koga', sprite:'koga', city:'Fuchsia', type:'poison', team:[[109,37],[89,39],[109,37],[110,43]], prize:4300 },
    { leader:'Sabrina', sprite:'sabrina', city:'Saffron', type:'psychic', team:[[64,38],[122,37],[49,38],[65,43]], prize:4300 },
    { leader:'Blaine', sprite:'blaine', city:'Cinnabar', type:'fire', team:[[58,42],[77,40],[78,42],[59,47]], prize:4700 },
    { leader:'Giovanni', sprite:'giovanni', city:'Viridian', type:'ground', team:[[111,45],[51,42],[31,44],[34,45],[112,50]], prize:5000 },
  ];
  const ELITE = [
    { leader:'Lorelei', sprite:'lorelei', title:'Elite Four', type:'ice', team:[[87,52],[91,51],[124,54],[131,54],[80,55,{item:'slowbronite'}]], prize:5000 },
    { leader:'Bruno', sprite:'bruno', title:'Elite Four', type:'fighting', team:[[95,51],[107,53],[106,53],[95,54],[68,56]], prize:5000 },
    { leader:'Agatha', sprite:'agatha', title:'Elite Four', type:'ghost', team:[[42,54],[93,53],[24,56],[94,54],[94,58,{item:'gengarite'}]], prize:5000 },
    { leader:'Lance', sprite:'lance', title:'Elite Four', type:'dragon', team:[[130,56,{item:'gyaradosite'}],[148,54],[148,54],[142,58],[149,60]], prize:6000 },
    { leader:'Blue', sprite:'blue', title:'Campeão', type:'normal', team:[[18,59],[65,57],[112,59],[103,59],[130,59],[6,63,{item:'charizardite-y'}]], prize:10000 },
  ];
  const SHOP = [
    { id:'poke-ball', name:'Poké Bola', price:200, desc:'Bola básica de captura.', req:0 },
    { id:'great-ball', name:'Grande Bola', price:600, desc:'Captura 1,5x melhor.', req:1 },
    { id:'ultra-ball', name:'Ultra Bola', price:1200, desc:'Captura 2x melhor.', req:3 },
    { id:'master-ball', name:'Master Bola', price:50000, desc:'Captura garantida. Rara!', req:8 },
    { id:'potion', name:'Poção', price:300, desc:'Recupera 20 HP.', req:0 },
    { id:'super-potion', name:'Super Poção', price:700, desc:'Recupera 60 HP.', req:1 },
    { id:'hyper-potion', name:'Hiper Poção', price:1200, desc:'Recupera 120 HP.', req:4 },
    { id:'full-restore', name:'Restauração Total', price:3000, desc:'HP total e cura estados.', req:6 },
    { id:'revive', name:'Reviver', price:1500, desc:'Reanima com metade do HP.', req:2 },
    { id:'antidote', name:'Antídoto', price:100, desc:'Cura envenenamento.', req:0 },
    { id:'full-heal', name:'Cura Total', price:600, desc:'Cura qualquer estado.', req:2 },
    { id:'rare-candy', name:'Bala Rara', price:4800, desc:'Sobe 1 nível na hora.', req:2 },
    { id:'fire-stone', name:'Pedra de Fogo', price:2100, desc:'Evolui certos Pokémon.', req:1 },
    { id:'water-stone', name:'Pedra da Água', price:2100, desc:'Evolui certos Pokémon.', req:1 },
    { id:'thunder-stone', name:'Pedra do Trovão', price:2100, desc:'Evolui certos Pokémon.', req:1 },
    { id:'leaf-stone', name:'Pedra da Folha', price:2100, desc:'Evolui certos Pokémon.', req:1 },
    { id:'moon-stone', name:'Pedra da Lua', price:2100, desc:'Evolui certos Pokémon.', req:1 },
    { id:'sun-stone', name:'Pedra do Sol', price:2100, desc:'Evolui Sunkern, Gloom em Bellossom...', req:1 },
    { id:'kings-rock', name:'Pedra do Rei', price:3000, desc:'Use em Poliwhirl ou Slowpoke (evolução por troca).', req:3 },
    { id:'metal-coat', name:'Revestimento Metálico', price:3000, desc:'Use em Onix ou Scyther (evolução por troca).', req:3 },
    { id:'dragon-scale', name:'Escama de Dragão', price:3000, desc:'Use em Seadra (evolução por troca).', req:3 },
    { id:'up-grade', name:'Melhoria', price:3000, desc:'Use em Porygon (evolução por troca).', req:3 },
  ];
  const ITEM_NAME = Object.assign(Object.fromEntries(SHOP.map(x => [x.id, x.name])), MEGA_STONES, { 'mega-bracelet':'Mega Pulseira', 'dynamax-band':'Pulseira Dinamax' });
  MAPS.forEach(m => m.region = m.region || 'kanto'); MAPS.push(...JMAPS);
  const THEME_BG = { grass:['#4ade80','#166534'], forest:['#15803d','#052e16'], cave:['#57534e','#1c1917'], water:['#38bdf8','#0c4a6e'], ghost:['#7c3aed','#1e1b4b'],
    safari:['#a3e635','#3f6212'], electric:['#fde047','#713f12'], ice:['#bae6fd','#0e7490'], volcano:['#f97316','#450a0a'], psychic:['#e879f9','#3b0764'], sky:['#fcd34d','#1e3a8a'], gym:['#64748b','#0f172a'] };
  const C = { TYPE_PT, TYPE_COLOR, STARTERS, REGIONS, AVATARS, MAPS, BADGES, BADGE_COLOR, GYMS, ELITE, SHOP, ITEM_NAME, THEME_BG, JBADGES, JBADGE_COLOR, JGYMS, JELITE, MEGA_STONES, BP_SHOP, KANTO_REWARD };
  G.PC = C; if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
