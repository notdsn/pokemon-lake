import urllib.request,concurrent.futures as cf,json,os
B='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/'
ids=[m['id'] for m in json.load(open('data/raw.json'))['mons']]
jobs=[]
for i in ids:
    for sub,d in (('','front'),('back/','back'),('shiny/','shiny'),('back/shiny/','backshiny')):
        jobs.append((B+sub+f'{i}.gif',f'img/{d}/{i}.gif'))
def dl(j):
    u,p=j
    if os.path.exists(p): return 0
    try: open(p,'wb').write(urllib.request.urlopen(u,timeout=30).read()); return 0
    except Exception as e: return 1
with cf.ThreadPoolExecutor(24) as ex: print('fails',sum(ex.map(dl,jobs)))
