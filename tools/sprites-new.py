# Sprites animados do Showdown para ids sem sprite (fallback gen5 estático) + cries da PokeAPI. Uso: python3 tools/sprites-new.py
import json,os,re,subprocess,unicodedata
from concurrent.futures import ThreadPoolExecutor
raw=json.load(open('data/raw.json')); names={m['id']:m['name'] for m in raw['mons']}
def sd(n):
    n=unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower().replace('♀','f').replace('♂','m')
    return re.sub(r'[^a-z0-9]','',n)
jobs=[]
for m in raw['mons']:
    i=m['id']
    if os.path.exists(f'img/front/{i}.gif'): continue
    nm=sd(names[m['fm']] if m.get('fm') else m['name'])+('-'+m['rg'] if m.get('rg') else '')
    for d,a,b in [('front','ani','gen5'),('back','ani-back','gen5-back'),('shiny','ani-shiny','gen5-shiny'),('backshiny','ani-back-shiny','gen5-back-shiny')]: jobs.append((i,nm,d,a,b))
def get(j):
    i,nm,d,a,b=j; out=f'img/{d}/{i}.gif'
    for u in [f'https://play.pokemonshowdown.com/sprites/{a}/{nm}.gif',f'https://play.pokemonshowdown.com/sprites/{b}/{nm}.png']:
        if subprocess.run(['curl','-sfL','--max-time','30','-o',out,u]).returncode==0 and os.path.getsize(out)>200: return 'ani' if 'ani' in u else 'g5'
    if os.path.exists(out): os.remove(out)
    return 'FAIL:%s:%s:%s'%(i,nm,d)
def cry(i): return subprocess.run(['curl','-sfL','--max-time','30','-o',f'cries/{i}.ogg',f'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{i}.ogg']).returncode
with ThreadPoolExecutor(24) as ex:
    r=list(ex.map(get,jobs)); c=list(ex.map(cry,[m['id'] for m in raw['mons'] if not os.path.exists(f"cries/{m['id']}.ogg")]))
from collections import Counter; print(Counter(x if not x.startswith('FAIL') else 'FAIL' for x in r),[x for x in r if x.startswith('FAIL')][:40],'cry fails',sum(1 for x in c if x))
