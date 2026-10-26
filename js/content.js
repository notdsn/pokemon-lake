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
      enc:[[10,25,3,6],[11,10,4,7],[13,25,3,6],[14,10,4,7],[25,6,4,7],[43,10,4,7,{night:1}],[69,8,4,7],[46,6,4,7],[48,4,5,8,{night:1}],[123,1,7,9],[127,1,7,9],[251,0.05,20,20,{legend:1}]],
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
      enc:[[77,25,36,41],[78,6,40,44],[58,20,36,41],[37,15,36,41],[126,8,38,43],[66,15,36,41],[67,6,40,44],[74,10,36,40],[146,0.4,50,50,{legend:1}],[244,0.15,50,50,{legend:1}]],
      trainers:[['Faixa-Preta Kenji','blackbelt',[[67,42],[66,41],[107,43]],1600],['Treinador Ícaro','acetrainer',[[78,43],[59,44]],1700]] },
    { id:'vitoria', name:'Estrada Vitória', theme:'cave', emoji:'🏆', req:8, desc:'O último desafio antes da Liga Pokémon.', lv:[42,50],
      enc:[[67,20,42,47],[75,20,42,47],[42,20,42,47],[105,10,44,48],[95,10,42,47],[57,10,44,48],[112,6,46,50],[143,1,45,50]],
      trainers:[['Treinador Elite Davi','acetrainer',[[112,48],[65,48],[130,48]],2500],['Treinadora Elite Mel','acetrainerf',[[36,48],[121,48],[3,49]],2500]] },
    { id:'cerulcave', name:'Caverna Celeste', theme:'psychic', emoji:'🔮', req:'champion', desc:'Pós-jogo. Pokémon fortíssimos... e algo criado em laboratório.', lv:[55,65],
      enc:[[132,15,55,62],[42,15,55,62],[64,10,55,62],[82,10,55,62],[47,10,55,62],[202,0,1,1],[113,4,58,62],[101,10,55,62],[150,0.3,70,70,{legend:1}],[151,0.1,60,60,{legend:1}]].filter(e=>e[0]!==202) },
    { id:'torresino', name:'Torre do Sino (Johto)', theme:'sky', emoji:'🔔', req:'champion', desc:'Pós-jogo. Lendários de Johto e Hoenn surgem entre as nuvens.', lv:[45,60],
      enc:[[243,3,50,50,{legend:1}],[244,3,50,50,{legend:1}],[245,3,50,50,{legend:1}],[249,1.5,60,60,{legend:1}],[250,1.5,60,60,{legend:1}],[377,2,50,50,{legend:1}],[378,2,50,50,{legend:1}],[379,2,50,50,{legend:1}],[380,1.5,55,55,{legend:1}],[381,1.5,55,55,{legend:1}],[382,0.8,70,70,{legend:1}],[383,0.8,70,70,{legend:1}],[384,0.5,70,70,{legend:1}],[148,15,45,52],[149,3,55,58],[22,20,45,52],[18,20,45,52],[142,6,50,55],[248,0,1,1]].filter(e=>e[0]!==248) },
  ];
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
    { leader:'Lorelei', sprite:'lorelei', title:'Elite Four', type:'ice', team:[[87,52],[91,51],[80,52],[124,54],[131,54]], prize:5000 },
    { leader:'Bruno', sprite:'bruno', title:'Elite Four', type:'fighting', team:[[95,51],[107,53],[106,53],[95,54],[68,56]], prize:5000 },
    { leader:'Agatha', sprite:'agatha', title:'Elite Four', type:'ghost', team:[[94,54],[42,54],[93,53],[24,56],[94,58]], prize:5000 },
    { leader:'Lance', sprite:'lance', title:'Elite Four', type:'dragon', team:[[130,56],[148,54],[148,54],[142,58],[149,60]], prize:6000 },
    { leader:'Blue', sprite:'blue', title:'Campeão', type:'normal', team:[[18,59],[65,57],[112,59],[103,59],[130,59],[6,63]], prize:10000 },
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
  ];
  const ITEM_NAME = Object.fromEntries(SHOP.map(x => [x.id, x.name]));
  const THEME_BG = { grass:['#4ade80','#166534'], forest:['#15803d','#052e16'], cave:['#57534e','#1c1917'], water:['#38bdf8','#0c4a6e'], ghost:['#7c3aed','#1e1b4b'],
    safari:['#a3e635','#3f6212'], electric:['#fde047','#713f12'], ice:['#bae6fd','#0e7490'], volcano:['#f97316','#450a0a'], psychic:['#e879f9','#3b0764'], sky:['#fcd34d','#1e3a8a'], gym:['#64748b','#0f172a'] };
  const C = { TYPE_PT, TYPE_COLOR, STARTERS, REGIONS, AVATARS, MAPS, BADGES, BADGE_COLOR, GYMS, ELITE, SHOP, ITEM_NAME, THEME_BG };
  G.PC = C; if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
