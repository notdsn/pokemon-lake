# Formas regionais (Alola/Galar) -> data/raw.json com id da PokeAPI (10xxx). Uso: python3 tools/add-forms.py
import json,urllib.request,concurrent.futures as cf
API='https://pokeapi.co/api/v2/'
def get(u):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'pl'}),timeout=30))
        except Exception as e: err=e
    raise err
FORMS={'rattata-alola':('raticate-alola',{'lvl':20,'tod':'night'}),'raticate-alola':None,'raichu-alola':None,'sandshrew-alola':('sandslash-alola',{'item':'ice-stone'}),'sandslash-alola':None,
'vulpix-alola':('ninetales-alola',{'item':'ice-stone'}),'ninetales-alola':None,'diglett-alola':('dugtrio-alola',{'lvl':26}),'dugtrio-alola':None,'meowth-alola':('persian-alola',{'lvl':28}),'persian-alola':None,
'geodude-alola':('graveler-alola',{'lvl':25}),'graveler-alola':('golem-alola',{'lvl':38}),'golem-alola':None,'grimer-alola':('muk-alola',{'lvl':38}),'muk-alola':None,'exeggutor-alola':None,'marowak-alola':None,
'meowth-galar':('perrserker',{'lvl':28}),'ponyta-galar':('rapidash-galar',{'lvl':40}),'rapidash-galar':None,'slowpoke-galar':('slowbro-galar',{'item':'water-stone'}),'slowbro-galar':None,
'farfetchd-galar':('sirfetchd',{'lvl':36}),'weezing-galar':None,'mr-mime-galar':('mr-rime',{'lvl':42}),'articuno-galar':None,'zapdos-galar':None,'moltres-galar':None,'corsola-galar':('cursola',{'lvl':38}),
'zigzagoon-galar':('linoone-galar',{'lvl':20}),'linoone-galar':('obstagoon',{'lvl':35,'tod':'night'}),'darumaka-galar':('darmanitan-galar-standard',{'item':'ice-stone'}),'darmanitan-galar-standard':None,
'yamask-galar':('runerigus',{'lvl':34}),'stunfisk-galar':None}
PT={'alola':'de Alola','galar':'de Galar'}
raw=json.load(open('data/raw.json'))
def mon(nm):
    p=get(API+f'pokemon/{nm}'); s=get(p['species']['url']); mv={}
    for m in p['moves']:
        for v in m['version_group_details']:
            if v['move_learn_method']['name']=='level-up': mv.setdefault(m['move']['name'],v['level_learned_at'])
    rg='alola' if 'alola' in nm else 'galar'
    return dict(id=p['id'],key=nm,fm=s['id'],rg=rg,name=next((n['name'] for n in s['names'] if n['language']['name']=='en'),nm)+' '+PT[rg],types=[t['type']['name'] for t in p['types']],
      stats=[x['base_stat'] for x in p['stats']],capture=s['capture_rate'],xp=p['base_experience'] or 100,growth=s['growth_rate']['name'],legend=s['is_legendary'] or s['is_mythical'],
      eggs=[g['name'] for g in s['egg_groups']],gender=s['gender_rate'],hatch=s['hatch_counter'] or 20,abil=p['abilities'][0]['ability']['name'],
      hidden=next((a['ability']['name'] for a in p['abilities'] if a['is_hidden']),None),learn=sorted((l,n) for n,l in mv.items()))
with cf.ThreadPoolExecutor(10) as ex: new=list(ex.map(mon,FORMS))
ids={m['key']:m['id'] for m in new}
def idof(n): return ids.get(n) or get(API+'pokemon/'+n)['id']
for m in new:
    f=FORMS[m['key']]; m['evo']=[dict(to=idof(f[0]),**f[1])] if f else []
need=sorted({n for m in new for _,n in m['learn']}-set(raw['moves']))
def move(n):
    d=get(API+'move/'+n); meta=d.get('meta') or {}
    return n,dict(name=next((x['name'] for x in d['names'] if x['language']['name']=='en'),n),pt=None,type=d['type']['name'],cat=d['damage_class']['name'],pow=d['power'],acc=d['accuracy'],pp=d['pp'],pri=d['priority'],ail=(meta.get('ailment') or {}).get('name'),ailc=meta.get('ailment_chance',0),
      heal=meta.get('healing',0),drain=meta.get('drain',0),crit=meta.get('crit_rate',0),flinch=meta.get('flinch_chance',0),stat=[[s['stat']['name'],s['change']] for s in d['stat_changes']],statc=meta.get('stat_chance',0),target=d['target']['name'],minh=meta.get('min_hits'),maxh=meta.get('max_hits'))
with cf.ThreadPoolExecutor(10) as ex: raw['moves'].update(dict(ex.map(move,need)))
raw['mons']=[m for m in raw['mons'] if m['id'] not in ids.values()]
for m in new: m['learn']=[[l,n] for l,n in m['learn'] if n in raw['moves']]; raw['mons'].append(m)
raw['abils']=sorted(set(raw['abils'])|{m['abil'] for m in new}|{m['hidden'] for m in new if m.get('hidden')})
json.dump(raw,open('data/raw.json','w'))
print('forms',len(new),'moves',len(need))
