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
- `js/app.js` — UI. `tests/sim.js` (300 batalhas IA×IA), `tests/e2e.js` (Playwright + prints).

## Futuro
PvP/trocas/chat/creche precisam de um backend (ex.: Supabase/Firebase) — o motor já aceita ações dos dois lados.
