import json,urllib.request,concurrent.futures as cf,re,html,os
d=json.load(open('data/raw.json'))
out_p='data/pt/moves.json'; out=json.load(open(out_p)) if os.path.exists(out_p) else {}
def get(kind,slug):
    for i in range(3):
        try:
            s=urllib.request.urlopen(urllib.request.Request(f'https://poketudo.com/pt-br/{kind}-{slug}',headers={'User-Agent':'curl/8.5.0','Accept':'*/*'}),timeout=30).read().decode()
            sub=re.search(r'detail-hero__subtitle">([^<]*)<',s); de=re.search(r'Descri[çc][ãa]o[^<]*</h2>\s*(?:<[^>]+>\s*)*([^<]{5,})<',s)
            return slug,{'pt':html.unescape(sub.group(1).strip()) if sub else None,'d':html.unescape(de.group(1).strip()) if de else None}
        except Exception as e: err=str(e)
    return slug,{'err':err}
todo=[m for m in d['moves'] if m not in out or 'err' in out[m]]
with cf.ThreadPoolExecutor(6) as ex: out.update(dict(ex.map(lambda m:get('move',m),todo)))
json.dump(out,open(out_p,'w'),ensure_ascii=False,indent=0)
ab_p='data/pt/abils.json'; ab=json.load(open(ab_p)) if os.path.exists(ab_p) else {}
with cf.ThreadPoolExecutor(6) as ex: ab.update(dict(ex.map(lambda m:get('ability',m),[a for a in d['abils'] if a not in ab or 'err' in ab[a]])))
json.dump(ab,open(ab_p,'w'),ensure_ascii=False,indent=0)
print('moves',len(out),'pt',sum(1 for v in out.values() if v.get('pt')),'err',sum(1 for v in out.values() if 'err' in v),'desc',sum(1 for v in out.values() if v.get('d')))
print('abils',len(ab),'pt',sum(1 for v in ab.values() if v.get('pt')))
