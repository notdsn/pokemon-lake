import json,urllib.request,concurrent.futures as cf,os,re
IDS=[700,470,471]+list(range(1,261))+list(range(377,385))+list(range(387,396))
API='https://pokeapi.co/api/v2/'
def get(u):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'pl'}),timeout=30))
        except Exception as e: err=e
    raise err
def mon(i):
    p=get(API+f'pokemon/{i}'); s=get(API+f'pokemon-species/{i}')
    mv=[]
    for m in p['moves']:
        for v in m['version_group_details']:
            if v['move_learn_method']['name']=='level-up' and v['version_group']['name'] in ('firered-leafgreen','heartgold-soulsilver','platinum','emerald','sword-shield','scarlet-violet'):
                mv.append((v['level_learned_at'],m['move']['name']));break
    mv=sorted(set(mv))
    return dict(id=i,name=next((n['name'] for n in s['names'] if n['language']['name']=='en'),p['name']),
      types=[t['type']['name'] for t in p['types']],
      stats=[x['base_stat'] for x in p['stats']],capture=s['capture_rate'],xp=p['base_experience'] or 100,
      growth=s['growth_rate']['name'],legend=s['is_legendary'] or s['is_mythical'],chain=s['evolution_chain']['url'],
      eggs=[g['name'] for g in s['egg_groups']],gender=s['gender_rate'],hatch=s['hatch_counter'] or 20,abil=p['abilities'][0]['ability']['name'],
      genus=next((n['genus'] for n in s['genera'] if n['language']['name']=='en'),''),learn=mv)
with cf.ThreadPoolExecutor(16) as ex: mons=list(ex.map(mon,IDS))
chains={}
for u in set(m['chain'] for m in mons): chains[u]=get(u)
idset=set(IDS); evo={}
def walk(n):
    fid=int(n['species']['url'].rstrip('/').split('/')[-1])
    for t in n['evolves_to']:
        tid=int(t['species']['url'].rstrip('/').split('/')[-1])
        d=t['evolution_details'][0] if t['evolution_details'] else {}
        if tid in idset and fid in idset:
            e={'to':tid}
            if d.get('item'): e['item']=d['item']['name']
            elif d.get('min_level'): e['lvl']=d['min_level']
            elif d.get('trigger',{}).get('name')=='trade': e['lvl']=38
            else: e['lvl']=30
            if d.get('time_of_day'): e['tod']=d['time_of_day']
            if d.get('relative_physical_stats') is not None: e['rps']=d['relative_physical_stats']
            if d.get('trigger',{}).get('name')=='trade' and d.get('held_item'): e.pop('lvl',None); e['item']=d['held_item']['name']
            evo.setdefault(fid,[]).append(e)
        walk(t)
for c in chains.values(): walk(c['chain'])
MEGA={3:['venusaur-mega'],6:['charizard-mega-x','charizard-mega-y'],9:['blastoise-mega'],15:['beedrill-mega'],18:['pidgeot-mega'],65:['alakazam-mega'],80:['slowbro-mega'],94:['gengar-mega'],115:['kangaskhan-mega'],127:['pinsir-mega'],130:['gyarados-mega'],142:['aerodactyl-mega'],150:['mewtwo-mega-x','mewtwo-mega-y'],181:['ampharos-mega'],208:['steelix-mega'],212:['scizor-mega'],214:['heracross-mega'],229:['houndoom-mega'],248:['tyranitar-mega'],254:['sceptile-mega'],257:['blaziken-mega'],260:['swampert-mega'],380:['latias-mega'],381:['latios-mega'],384:['rayquaza-mega']}
def mega(f):
    p=get(API+'pokemon/'+f); return dict(form=f,types=[t['type']['name'] for t in p['types']],stats=[x['base_stat'] for x in p['stats']],abil=p['abilities'][0]['ability']['name'])
with cf.ThreadPoolExecutor(8) as ex: megas={b:list(ex.map(mega,fs)) for b,fs in MEGA.items()}
names=set(n for m in mons for _,n in m['learn'])|{'tackle','struggle','dragon-ascent','moonblast','hyper-voice','calm-mind','shadow-ball'}
abils=set(m['abil'] for m in mons)|set(x['abil'] for v in megas.values() for x in v)
def move(n):
    d=get(API+'move/'+n)
    meta=d.get('meta') or {}
    return n,dict(name=next((x['name'] for x in d['names'] if x['language']['name']=='en'),n),
      pt=next((x['name'] for x in d['names'] if x['language']['name'] in('pt-BR','pt')),None),
      type=d['type']['name'],cat=d['damage_class']['name'],pow=d['power'],acc=d['accuracy'],pp=d['pp'],pri=d['priority'],
      ail=(meta.get('ailment') or {}).get('name'),ailc=meta.get('ailment_chance',0),heal=meta.get('healing',0),drain=meta.get('drain',0),
      crit=meta.get('crit_rate',0),flinch=meta.get('flinch_chance',0),
      stat=[[s['stat']['name'],s['change']] for s in d['stat_changes']],statc=meta.get('stat_chance',0),
      target=d['target']['name'],minh=meta.get('min_hits'),maxh=meta.get('max_hits'))
with cf.ThreadPoolExecutor(16) as ex: moves=dict(ex.map(move,sorted(names)))
for m in mons:
    m['evo']=evo.get(m['id'],[]); del m['chain']
    m['learn']=[[l,n] for l,n in m['learn'] if n in moves]
json.dump({'mons':mons,'moves':moves,'megas':megas,'abils':sorted(abils)},open('data/raw.json','w'))
print(len(mons),len(moves))
