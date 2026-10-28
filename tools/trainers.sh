#!/bin/bash
# Baixa sprites de treinadores do Showdown: tools/trainers.sh nome[:fallback] ...
cd "$(dirname "$0")/../img/tr"
for a in "$@"; do n=${a%%:*}; [ -s "$n.png" ] && continue; ok=
  for s in "" -gen3 -gen4 -gen5 -gen6 -gen7 -gen8 -gen9 -masters -gen4dp -gen3rs -lgpe; do
    if curl -sf -o "$n.png" "https://play.pokemonshowdown.com/sprites/trainers/$n$s.png"; then ok=1; break; fi; done
  [ -z "$ok" ] && { rm -f "$n.png"; cp acetrainer.png "$n.png"; echo "fallback $n"; }
done; echo ok
