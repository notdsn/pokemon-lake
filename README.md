# Pokémon Lake (privado)

Jogo Pokémon de navegador inspirado no Pokémon Lake. Site estático (GitHub Pages), PWA, `noindex` + `robots.txt`.

## Login
1. **Senha do site** (portão): o sha256 fica em `js/app.js` (`PASS_HASH`). A senha em texto **não** está no repositório.
   Para trocar: `node -e "require('./js/sha256.js');console.log(sha256('NOVA'))"` e cole o resultado em `PASS_HASH`.
2. **Conta local** (usuário + senha) por aparelho, guardada em `localStorage` (`pkLake.accounts`).

## Saves (regra: nunca apagar)
- `pkLake.save.<usuario>` com `v` (SAVE_VERSION). Para mudar o formato: aumente `SAVE_VERSION` em `js/save.js` e crie `MIGRATIONS[n]` que só **adiciona/converte** campos.
- Save corrompido é copiado à parte, há backups rotativos `.bak0-2` e cópia `preimport` antes de importar.
- Exportar/Importar em Mais → Salvar/Backup (texto `PKLAKE1:` ou arquivo).
- O `sw.js` nunca mexe em localStorage.

## Estrutura
- `js/engine.js` — motor de batalha determinístico (sem DOM, seed mulberry32): `createBattle` / `step(s,[a0,a1])` → eventos. Pronto para PvP: os dois clientes trocam só ações + seed e reproduzem igual.
- `js/content.js` — mapas, ginásios, Elite 4, loja. `js/data-gen.js` — dados PokeAPI (gerado por `tools/build-data.py`).
- `js/app.js` — UI. `FEAT` liga/desliga Johto e Creche.
- Dados: `tools/build-data.py` (PokeAPI → `data/raw.json`), `tools/pt-names.py` (nomes oficiais pt-BR de golpes/habilidades, poketudo.com), `tools/gen-js.py` (→ `js/data-gen.js`). Categoria de golpe: `p` físico, `s` especial, `t` status.
- Sprites: `tools/sd-sprites.py` baixa os sprites animados do Pokémon Showdown (`ani`, frente/costas/shiny) para `img/{front,back,shiny,backshiny}`; Megas em `img/mega/`. Na batalha a escala é fixa (`fitSpr`), mantendo o tamanho relativo dos Pokémon.

## Conteúdo
- Kanto (8 ginásios, Elite 4, Campeão) → Mega Pulseira. **Desafio Final: Nat** (6 de 8 Eeveelutions aleatórias, Nv 77+, IA que troca) → Insígnia Nat + título "Mestre Eevee".
- Johto (após ser Campeão): Prof. Elm (Chikorita/Cyndaquil/Totodile + Ovo de Togepi), 13 áreas, 8 ginásios, Liga de Johto, cães lendários errantes, Lugia/Ho-Oh/Celebi.
- Mega Evoluções (27), Torre de Batalha + loja de PB (Mega Pedras).
- Creche: 2 Pokémon ganham XP em tempo real; se compatíveis (mesmo grupo de ovo, ou Ditto) aparecem ovos; ovos chocam por passos (buscas) e tempo.
- Códigos de presente: sha256 do código em maiúsculas em `GIFTS` (app.js); resgate 1x por conta (`S.gifts`).

## Testes
- `node tests/sim.js 300` (IA×IA, determinismo), `node tests/ohko.js` (Moltres Nv50 nocauteia Rattata Nv5).
- Playwright (`node tests/<x>.js [URL]`): `e2e.js`, `johto.js` (migração, Elm, Creche/ovo, Johto), `nat.js`, `mega.js`, `gift.js URL CODIGO`. Desbloqueiam o portão gravando o `PASS_HASH` em `localStorage` (a senha nunca é lida). Prints em `prints/v2/`.

## Futuro
Save na nuvem, PvP/trocas/chat precisam de um backend (ex.: Supabase/Firebase) — o motor já aceita ações dos dois lados.
