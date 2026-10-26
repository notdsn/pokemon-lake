# Baixa sprites animados do Pokémon Showdown ("ani" 3D, estilo consistente com as Megas)
import json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
mons = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/names.json'))
def sdname(n):
    n = n.lower().replace('♀', 'f').replace('♂', 'm')
    return re.sub(r'[^a-z0-9]', '', n)
DIRS = {'front': 'ani', 'back': 'ani-back', 'shiny': 'ani-shiny', 'backshiny': 'ani-back-shiny'}
jobs = []
for id, m in mons.items():
    nm = sdname(m)
    for d, sd in DIRS.items(): jobs.append((id, nm, d, sd))
os.makedirs('img/sd', exist_ok=True)
def get(j):
    id, nm, d, sd = j; out = f'img/sd/{d}/{id}.gif'; os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.path.exists(out) and os.path.getsize(out) > 500: return None
    r = subprocess.run(['curl', '-sfL', '--max-time', '30', '-o', out, f'https://play.pokemonshowdown.com/sprites/{sd}/{nm}.gif'])
    return None if r.returncode == 0 else (id, nm, d)
with ThreadPoolExecutor(16) as ex: fails = [f for f in ex.map(get, jobs) if f]
print('total', len(jobs), 'falhas', len(fails), fails[:20])
