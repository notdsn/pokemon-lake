# raw.json + data/pt -> js/data-gen.js
import json
d=json.load(open('data/raw.json')); pt=json.load(open('data/pt/moves.json')); ab=json.load(open('data/pt/abils.json'))
FIX={'avalanche':'Avalanche','embargo':'Embargo','inferno':'Inferno','magnitude':'Magnitude','octazooka':'Octazuca','surf':'Surfar'}
STONE={'venusaur-mega':'venusaurite','charizard-mega-x':'charizardite-x','charizard-mega-y':'charizardite-y','blastoise-mega':'blastoisinite','beedrill-mega':'beedrillite','pidgeot-mega':'pidgeotite','alakazam-mega':'alakazite','slowbro-mega':'slowbronite','gengar-mega':'gengarite','kangaskhan-mega':'kangaskhanite','pinsir-mega':'pinsirite','gyarados-mega':'gyaradosite','aerodactyl-mega':'aerodactylite','mewtwo-mega-x':'mewtwonite-x','mewtwo-mega-y':'mewtwonite-y','ampharos-mega':'ampharosite','steelix-mega':'steelixite','scizor-mega':'scizorite','heracross-mega':'heracronite','houndoom-mega':'houndoominite','tyranitar-mega':'tyranitarite','sceptile-mega':'sceptilite','blaziken-mega':'blazikenite','swampert-mega':'swampertite','latias-mega':'latiasite','latios-mega':'latiosite','rayquaza-mega':None}
CAT={'physical':'p','special':'s','status':'t'}
mons={}
for m in d['mons']:
    mons[m['id']]=dict(n=m['name'],t=m['types'],s=m['stats'],c=m['capture'],x=m['xp'],g=m['growth'],L=1 if m['legend'] else 0,e=m['evo'],l=m['learn'],eg=m['eggs'],gr=m['gender'],hc=m['hatch'],ab=m['abil'])
mons[700]['ab']='pixilate'
megas={}
for b,fs in d['megas'].items():
    b=int(b); mons[b]['mg']=[f['form'] for f in fs]
    for f in fs:
        suf=' X' if f['form'].endswith('-x') else ' Y' if f['form'].endswith('-y') else ''
        megas[f['form']]=dict(b=b,n='Mega '+mons[b]['n']+suf,t=f['types'],s=f['stats'],ab=f['abil'],st=STONE[f['form']])
moves={}
for k,v in d['moves'].items():
    p=pt.get(k,{}); n=FIX.get(k) or p.get('pt') or v['name']
    moves[k]=dict(n=n,en=v['name'],ds=p.get('d') or '',t=v['type'],c=CAT[v['cat']],p=v['pow'] or 0,a=v['acc'] or 0,pp=v['pp'],pr=v['pri'],ai=v['ail'] if v['ail'] not in (None,'none','unknown') else None,aic=v['ailc'],h=v['heal'],d=v['drain'],cr=v['crit'],f=v['flinch'],st=v['stat'],stc=v['statc'],tg=v['target'],mh=v['minh'],xh=v['maxh'])
abils={k:{'n':v.get('pt') or k.replace('-',' ').title(),'d':v.get('d') or ''} for k,v in ab.items()}
out={'mons':mons,'moves':moves,'megas':megas,'abils':abils}
open('js/data-gen.js','w').write('// Gerado por tools/gen-js.py (PokeAPI + nomes pt-BR do Pokétudo)\n(typeof window!=="undefined"?window:globalThis).PDATA='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(mons),len(moves),len(megas))
