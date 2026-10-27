# Adiciona espécies (e golpes que faltam) ao data/raw.json de forma incremental. Uso: python3 tools/add-mons.py 656 657 658
import json,sys,urllib.request,concurrent.futures as cf
API='https://pokeapi.co/api/v2/'
def get(u):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'pl'}),timeout=30))
        except Exception as e: err=e
    raise err
VG=('firered-leafgreen','heartgold-soulsilver','platinum','emerald','black-2-white-2','x-y','omega-ruby-alpha-sapphire','ultra-sun-ultra-moon','sword-shield','scarlet-violet')
raw=json.load(open('data/raw.json')); have={m['id'] for m in raw['mons']}
ids=[int(x) for x in sys.argv[1:] if x[0]!='+' and int(x) not in have]
def mon(i):
    p=get(API+f'pokemon/{i}'); s=get(API+f'pokemon-species/{i}'); mv={}
    for m in p['moves']:
        for v in m['version_group_details']:
            if v['move_learn_method']['name']=='level-up' and v['version_group']['name'] in VG:
                mv.setdefault(m['move']['name'],v['level_learned_at'])
    return dict(id=i,name=next((n['name'] for n in s['names'] if n['language']['name']=='en'),p['name']),types=[t['type']['name'] for t in p['types']],
      stats=[x['base_stat'] for x in p['stats']],capture=s['capture_rate'],xp=p['base_experience'] or 100,growth=s['growth_rate']['name'],legend=s['is_legendary'] or s['is_mythical'],
      chain=s['evolution_chain']['url'],eggs=[g['name'] for g in s['egg_groups']],gender=s['gender_rate'],hatch=s['hatch_counter'] or 20,abil=p['abilities'][0]['ability']['name'],
      hidden=next((a['ability']['name'] for a in p['abilities'] if a['is_hidden']),None),learn=sorted((l,n) for n,l in mv.items()))
with cf.ThreadPoolExecutor(12) as ex: new=list(ex.map(mon,ids))
allids=have|set(ids); evo={}
def walk(n):
    fid=int(n['species']['url'].rstrip('/').split('/')[-1])
    for t in n['evolves_to']:
        tid=int(t['species']['url'].rstrip('/').split('/')[-1]); d=t['evolution_details'][0] if t['evolution_details'] else {}
        if tid in allids and fid in allids:
            e={'to':tid}
            if d.get('item'): e['item']=d['item']['name']
            elif d.get('min_level'): e['lvl']=d['min_level']
            elif d.get('trigger',{}).get('name')=='trade': e['lvl']=38
            else: e['lvl']=30
            if d.get('time_of_day'): e['tod']=d['time_of_day']
            if d.get('trigger',{}).get('name')=='trade' and d.get('held_item'): e.pop('lvl',None); e['item']=d['held_item']['name']
            evo.setdefault(fid,[]).append(e)
        walk(t)
for u in {m['chain'] for m in new}: walk(get(u)['chain'])
extra=[a for a in sys.argv if a.startswith('+')]
names={n for m in new for _,n in m['learn']}|{a[1:] for a in extra}
need=sorted(n for n in names if n not in raw['moves'])
def move(n):
    d=get(API+'move/'+n); meta=d.get('meta') or {}
    return n,dict(name=next((x['name'] for x in d['names'] if x['language']['name']=='en'),n),pt=next((x['name'] for x in d['names'] if x['language']['name'] in('pt-BR','pt')),None),
      type=d['type']['name'],cat=d['damage_class']['name'],pow=d['power'],acc=d['accuracy'],pp=d['pp'],pri=d['priority'],ail=(meta.get('ailment') or {}).get('name'),ailc=meta.get('ailment_chance',0),
      heal=meta.get('healing',0),drain=meta.get('drain',0),crit=meta.get('crit_rate',0),flinch=meta.get('flinch_chance',0),stat=[[s['stat']['name'],s['change']] for s in d['stat_changes']],
      statc=meta.get('stat_chance',0),target=d['target']['name'],minh=meta.get('min_hits'),maxh=meta.get('max_hits'))
with cf.ThreadPoolExecutor(12) as ex: raw['moves'].update(dict(ex.map(move,need)))
for m in new:
    m['evo']=evo.get(m['id'],[]); del m['chain']; m['learn']=[[l,n] for l,n in m['learn'] if n in raw['moves']]; raw['mons'].append(m)
for m in raw['mons']:
    if m['id'] in evo and m['id'] not in ids: m['evo']=evo[m['id']]
raw['abils']=sorted(set(raw['abils'])|{m['abil'] for m in new}|{m['hidden'] for m in new if m.get('hidden')})
json.dump(raw,open('data/raw.json','w'))
print('mons +',len(new),'moves +',len(need))
