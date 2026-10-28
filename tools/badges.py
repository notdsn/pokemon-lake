# Gera insígnias SVG estilo "pin de metal" (aro metálico, esmalte, bisel, brilho especular). Uso: python3 tools/badges.py
import math,os
def poly(n,r,rot=0,cx=50,cy=50): return 'M'+' L'.join(f'{cx+r*math.cos(rot+2*math.pi*i/n):.1f},{cy+r*math.sin(rot+2*math.pi*i/n):.1f}' for i in range(n))+'Z'
def star(n,r1,r2,rot=-math.pi/2,cx=50,cy=50): return 'M'+' L'.join(f'{cx+(r1 if i%2==0 else r2)*math.cos(rot+math.pi*i/n):.1f},{cy+(r1 if i%2==0 else r2)*math.sin(rot+math.pi*i/n):.1f}' for i in range(2*n))+'Z'
def circ(r,cx=50,cy=50): return f'M{cx-r},{cy} a{r},{r} 0 1,0 {2*r},0 a{r},{r} 0 1,0 {-2*r},0Z'
HEART='M50,88 C20,66 6,48 10,30 C14,12 38,8 50,28 C62,8 86,12 90,30 C94,48 80,66 50,88Z'
DROP='M50,6 C64,30 84,46 84,64 A34,30 0 0 1 16,64 C16,46 36,30 50,6Z'
LEAF='M50,6 C78,22 90,48 78,74 C70,90 56,94 50,94 C44,94 30,90 22,74 C10,48 22,22 50,6Z'
FLAME='M50,4 C58,24 80,34 80,60 C80,80 66,94 50,94 C34,94 20,80 20,60 C20,44 32,36 36,20 C42,32 46,34 48,36 C50,24 48,14 50,4Z'
WINGS='M50,30 C40,14 18,10 4,22 C14,26 16,32 12,38 C22,38 26,44 22,52 C34,50 40,58 50,74 C60,58 66,50 78,52 C74,44 78,38 88,38 C84,32 86,26 96,22 C82,10 60,14 50,30Z'
BUG='M50,10 C74,10 90,32 90,56 C90,78 72,92 50,92 C28,92 10,78 10,56 C10,32 26,10 50,10Z'
CONE='M50,4 L86,50 L50,96 L14,50Z'
GHOST='M50,6 C74,6 88,24 88,48 L88,90 L76,80 L64,92 L50,80 L36,92 L24,80 L12,90 L12,48 C12,24 26,6 50,6Z'
FIST='M18,30 C18,16 30,10 40,14 C46,6 58,6 62,14 C72,8 84,16 82,28 C90,32 92,46 84,54 L80,78 C78,90 66,94 50,94 C34,94 22,88 20,76 L16,52 C10,46 10,34 18,30Z'
DRAGON='M50,4 L62,30 L92,22 L72,48 L94,70 L62,66 L50,96 L38,66 L6,70 L28,48 L8,22 L38,30Z'
SHIELD='M50,4 L88,16 L84,56 C80,76 66,88 50,96 C34,88 20,76 16,56 L12,16Z'
SHAPES={'oct':poly(8,44,math.pi/8),'drop':DROP,'sun':star(10,46,32),'flower':None,'heart':HEART,'ring':circ(44),'flame':FLAME,'leaf':LEAF,'wings':WINGS,'bug':BUG,'cone':CONE,'ghost':GHOST,'fist':FIST,'diamond':poly(6,46,-math.pi/2),'snow':star(6,46,22),'dragon':DRAGON,'shield':SHIELD,'star5':star(5,47,22),'hex':poly(6,44,0)}
def flower():
    return ''.join(f'<ellipse cx="50" cy="27" rx="17" ry="23" transform="rotate({a} 50 50)"/>' for a in range(0,360,45))
def lit(h,k): # clareia/escurece hex
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16) for i in (0,2,4)]
    f=lambda c:max(0,min(255,int(c+(255-c)*k if k>0 else c*(1+k))))
    return '#%02x%02x%02x'%(f(r),f(g),f(b))
METAL={'gold':['#fff7cc','#e8c24a','#8a6512','#f7e08c','#6b4a08'],'silver':['#ffffff','#cfd6df','#6b7684','#eef2f6','#3d4651']}
# detalhes internos por forma (no esmalte)
INNER={'oct':lambda c:f'<path d="{poly(8,26,math.pi/8)}" fill="{lit(c,-.35)}" opacity=".55"/>','sun':lambda c:f'<circle cx="50" cy="50" r="16" fill="#fde047" stroke="{lit(c,-.4)}" stroke-width="2"/>',
 'ring':lambda c:f'<circle cx="50" cy="50" r="22" fill="#0b1020" stroke="{lit(c,-.4)}" stroke-width="3"/><circle cx="50" cy="50" r="10" fill="{c}"/>','drop':lambda c:f'<path d="M50,30 C56,42 66,50 66,62 A16,14 0 0 1 34,62 C34,50 44,42 50,30Z" fill="{lit(c,.35)}" opacity=".6"/>',
 'bug':lambda c:'<path d="M50,12 L50,92" stroke="#111" stroke-width="4"/><circle cx="32" cy="46" r="8" fill="#111"/><circle cx="68" cy="46" r="8" fill="#111"/><circle cx="34" cy="72" r="7" fill="#111"/><circle cx="66" cy="72" r="7" fill="#111"/>',
 'cone':lambda c:f'<path d="M50,16 L72,50 L50,84 L28,50Z" fill="{lit(c,.3)}" opacity=".7"/>','ghost':lambda c:'<circle cx="38" cy="42" r="7" fill="#111"/><circle cx="62" cy="42" r="7" fill="#111"/>',
 'diamond':lambda c:f'<path d="{poly(6,26,-math.pi/2)}" fill="{lit(c,.35)}" opacity=".6"/><path d="M50,4 L50,96 M10,27 L90,73 M90,27 L10,73" stroke="{lit(c,-.4)}" stroke-width="1.5" opacity=".5"/>',
 'snow':lambda c:f'<circle cx="50" cy="50" r="9" fill="{lit(c,.6)}"/>','flame':lambda c:'<path d="M50,40 C56,52 66,58 66,70 C66,82 58,88 50,88 C42,88 34,82 34,70 C34,60 44,54 50,40Z" fill="#fde047" opacity=".85"/>',
 'leaf':lambda c:f'<path d="M50,14 L50,90 M50,40 L30,28 M50,40 L70,28 M50,60 L28,48 M50,60 L72,48" stroke="{lit(c,-.45)}" stroke-width="3" fill="none"/>','heart':lambda c:f'<path d="M50,74 C30,60 22,48 24,36 C26,26 40,24 50,38" fill="none" stroke="{lit(c,.5)}" stroke-width="4" opacity=".6"/>',
 'wings':lambda c:f'<path d="M50,34 L50,70" stroke="{lit(c,-.45)}" stroke-width="4"/>','fist':lambda c:f'<path d="M40,16 L40,40 M62,14 L60,40 M80,30 L76,46" stroke="{lit(c,-.45)}" stroke-width="3"/>',
 'dragon':lambda c:f'<path d="{star(6,22,10)}" fill="#fde047" opacity=".85"/>','shield':lambda c:f'<path d="M50,18 L50,84 M22,40 L78,40" stroke="{lit(c,.4)}" stroke-width="5" opacity=".6"/>','star5':lambda c:f'<circle cx="50" cy="52" r="10" fill="{lit(c,.5)}"/>','hex':lambda c:f'<path d="{poly(6,24,0)}" fill="{lit(c,-.3)}" opacity=".6"/>'}
def svg(key,shape,cols,metal='gold'):
    m=METAL[metal]; c=cols[0]; flw=shape=='flower'
    sp = flower() if flw else f'<path d="{SHAPES[shape]}"/>'
    enamel = ''.join(f'<ellipse cx="50" cy="27" rx="12" ry="17" fill="{cols[i%len(cols)]}" transform="rotate({a} 50 50)"/>' for i,a in enumerate(range(0,360,45))) + '<circle cx="50" cy="50" r="13" fill="#fde047" stroke="#8a6512" stroke-width="2"/>' if flw else f'<path d="{SHAPES[shape]}" fill="url(#en)" transform="translate(50 50) scale(.84) translate(-50 -50)"/>'+INNER.get(shape,lambda c:'')(c)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108"><defs>
<linearGradient id="mt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{m[0]}"/><stop offset=".3" stop-color="{m[1]}"/><stop offset=".55" stop-color="{m[2]}"/><stop offset=".75" stop-color="{m[3]}"/><stop offset="1" stop-color="{m[4]}"/></linearGradient>
<linearGradient id="bv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
<radialGradient id="en" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="{lit(c,.55)}"/><stop offset=".45" stop-color="{c}"/><stop offset="1" stop-color="{lit(c,-.55)}"/></radialGradient>
<linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="cl">{sp}</clipPath></defs>
<g fill="url(#mt)" stroke="{m[4]}" stroke-width="1.2">{sp}</g>
<g fill="none" stroke="url(#bv)" stroke-width="3" opacity=".9">{sp}</g>
<g clip-path="url(#cl)">{enamel}<ellipse cx="38" cy="22" rx="34" ry="16" fill="url(#sp)" transform="rotate(-20 38 22)"/><rect x="-10" y="58" width="130" height="60" fill="#000" opacity=".12"/></g>
</svg>'''
B={# Kanto (formas oficiais aproximadas)
'k0':('oct',['#9ca3af'],'silver'),'k1':('drop',['#38bdf8']),'k2':('sun',['#f97316']),'k3':('flower',['#ef4444','#f59e0b','#22c55e','#3b82f6']),'k4':('heart',['#ec4899']),'k5':('ring',['#facc15']),'k6':('flame',['#dc2626']),'k7':('leaf',['#16a34a']),
# Johto
'j0':('wings',['#93c5fd'],'silver'),'j1':('bug',['#dc2626']),'j2':('cone',['#facc15']),'j3':('ghost',['#8b5cf6'],'silver'),'j4':('fist',['#b45309']),'j5':('diamond',['#cbd5e1'],'silver'),'j6':('snow',['#67e8f9'],'silver'),'j7':('dragon',['#4f46e5'])}
import json,sys
extra=json.load(open(sys.argv[1])) if len(sys.argv)>1 else {}
B.update({k:tuple(v) for k,v in extra.items()})
for k,v in B.items(): open(f'img/badges/{k}.svg','w').write(svg(k,*v))
print(len(B))
