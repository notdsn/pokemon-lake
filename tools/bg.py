# Gera os fundos em 3 camadas (céu, colinas, primeiro plano) por bioma. Estilo plano e suave.
import random, math, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'img', 'bg'); W, H = 800, 600
def svg(body, defs=''): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice"><defs>{defs}</defs>{body}</svg>'
def grad(i, stops, vert=True): return f'<linearGradient id="{i}" x1="0" y1="0" x2="{0 if vert else 1}" y2="{1 if vert else 0}">' + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>'
def ridge(rnd, y, amp, n, rough=0.5):
    pts = [(0, H)]; 
    for i in range(n + 1):
        x = W * i / n; pts.append((x, y + math.sin(i * 1.3 + rnd.random()) * amp * rough + (rnd.random() - .5) * amp))
    pts.append((W, H)); return 'M' + ' L'.join(f'{x:.0f},{y:.0f}' for x, y in pts) + 'Z'
def smooth(rnd, y, amp, n):
    xs = [W * i / n for i in range(n + 1)]; ys = [y + (rnd.random() - .5) * amp for _ in xs]
    d = f'M0,{H} L0,{ys[0]:.0f}'
    for i in range(n): mx = (xs[i] + xs[i + 1]) / 2; d += f' Q{xs[i]:.0f},{ys[i]:.0f} {mx:.0f},{(ys[i] + ys[i + 1]) / 2:.0f}'
    return d + f' L{W},{ys[-1]:.0f} L{W},{H}Z'
def clouds(rnd, n, col='#fff', op=.7):
    s = ''
    for _ in range(n):
        x, y, r = rnd.uniform(0, W), rnd.uniform(40, 200), rnd.uniform(18, 34)
        s += f'<g fill="{col}" opacity="{op}"><ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r*2.2:.0f}" ry="{r*.8:.0f}"/><circle cx="{x-r*.6:.0f}" cy="{y-r*.3:.0f}" r="{r*.7:.0f}"/><circle cx="{x+r*.5:.0f}" cy="{y-r*.5:.0f}" r="{r:.0f}"/></g>'
    return s
def pines(rnd, y0, n, col, h=(50, 90), jitter=30):
    s = ''
    for i in range(n):
        x = W * (i + rnd.random() * .6) / n; hh = rnd.uniform(*h); yb = y0 + rnd.uniform(-jitter, jitter) * .4
        s += f'<path d="M{x:.0f},{yb-hh:.0f} L{x+hh*.32:.0f},{yb:.0f} L{x-hh*.32:.0f},{yb:.0f}Z" fill="{col}"/>'
    return s
def blobtrees(rnd, y0, n, col, col2):
    s = ''
    for i in range(n):
        x = W * (i + rnd.random()) / n; r = rnd.uniform(26, 44); y = y0 + rnd.uniform(-12, 12)
        s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{col}"/><circle cx="{x-r*.3:.0f}" cy="{y-r*.35:.0f}" r="{r*.45:.0f}" fill="{col2}" opacity=".5"/>'
    return s
def tufts(rnd, n, col, col2, y=H, h=(16, 34)):
    s = ''
    for _ in range(n):
        x = rnd.uniform(0, W); hh = rnd.uniform(*h); yy = y - rnd.uniform(0, 30)
        s += f'<path d="M{x-8:.0f},{yy:.0f} Q{x-6:.0f},{yy-hh*.6:.0f} {x-12:.0f},{yy-hh:.0f} Q{x-1:.0f},{yy-hh*.5:.0f} {x:.0f},{yy-hh*1.1:.0f} Q{x+2:.0f},{yy-hh*.5:.0f} {x+12:.0f},{yy-hh*.9:.0f} Q{x+5:.0f},{yy-hh*.4:.0f} {x+8:.0f},{yy:.0f}Z" fill="{rnd.choice([col, col2])}"/>'
    return s
def rocks(rnd, n, col, col2, y=H):
    s = ''
    for _ in range(n):
        x = rnd.uniform(0, W); r = rnd.uniform(10, 26); yy = y - rnd.uniform(0, 24)
        s += f'<ellipse cx="{x:.0f}" cy="{yy:.0f}" rx="{r*1.3:.0f}" ry="{r*.8:.0f}" fill="{col}"/><ellipse cx="{x-r*.3:.0f}" cy="{yy-r*.3:.0f}" rx="{r*.6:.0f}" ry="{r*.3:.0f}" fill="{col2}" opacity=".6"/>'
    return s
B = {}
def biome(name, sky, hills, fg): B[name] = (sky, hills, fg)
r = random.Random
# FLORESTA
R1 = r(1); biome('forest',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + clouds(R1, 4, op=.55), grad('s', [(0, '#7dd3fc'), (.7, '#bbf7d0'), (1, '#d9f99d')])),
  svg(f'<path d="{smooth(R1, 300, 60, 6)}" fill="#4d8f5a"/>' + pines(R1, 330, 16, '#2f6b45', (60, 110)) + f'<path d="{smooth(R1, 360, 40, 5)}" fill="#3f7d4c"/>' + blobtrees(R1, 360, 9, '#2d6a3e', '#86efac')),
  svg(tufts(R1, 40, '#3f9a4f', '#2e7d3c')))
# CAVERNA
R2 = r(2); stal = ''.join(f'<path d="M{x:.0f},0 L{x+w:.0f},0 L{x+w/2:.0f},{h:.0f}Z" fill="#3b3346"/>' for x, w, h in [(R2.uniform(0, 800), R2.uniform(20, 50), R2.uniform(40, 130)) for _ in range(14)])
biome('cave',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + stal + '<ellipse cx="560" cy="250" rx="160" ry="90" fill="#a78bfa" opacity=".08"/>', grad('s', [(0, '#1e1b2e'), (.6, '#3b3552'), (1, '#4b4462')])),
  svg(f'<path d="{ridge(R2, 330, 80, 9)}" fill="#4a4060"/><path d="{ridge(R2, 380, 50, 12)}" fill="#3a3150"/>' + ''.join(f'<path d="M{x:.0f},{y:.0f} l8,-22 l8,22z" fill="#67e8f9" opacity=".55"/>' for x, y in [(R2.uniform(0, 800), R2.uniform(380, 430)) for _ in range(6)])),
  svg(rocks(R2, 14, '#2e2840', '#6b6185')))
# LAGO / PRAIA
R3 = r(3); waves = ''.join(f'<path d="M{x:.0f},{y:.0f} q12,-6 24,0" stroke="#e0f2fe" stroke-width="3" fill="none" opacity=".6"/>' for x, y in [(R3.uniform(0, 780), R3.uniform(380, 470)) for _ in range(14)])
biome('water',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + clouds(R3, 5, op=.8), grad('s', [(0, '#38bdf8'), (.7, '#bae6fd'), (1, '#e0f2fe')])),
  svg(f'<path d="{smooth(R3, 330, 40, 5)}" fill="#6aa86f"/>' + blobtrees(R3, 335, 7, '#4b8a55', '#bbf7d0') + '<rect y="360" width="800" height="240" fill="url(#w)"/>' + waves, grad('w', [(0, '#3b82f6'), (1, '#1d4ed8')])),
  svg(f'<path d="{smooth(R3, 540, 30, 5)}" fill="#f3d9a4"/>' + tufts(R3, 10, '#6aa84f', '#4d8a3a', h=(20, 40))))
# MONTANHA
R4 = r(4); peaks = ''
for i in range(5):
    x = 80 + i * 170 + R4.uniform(-40, 40); h = R4.uniform(180, 280); w = R4.uniform(150, 220); yb = 400
    peaks += f'<path d="M{x-w:.0f},{yb} L{x:.0f},{yb-h:.0f} L{x+w:.0f},{yb}Z" fill="#7c8aa5"/><path d="M{x-w*.28:.0f},{yb-h*.72:.0f} L{x:.0f},{yb-h:.0f} L{x+w*.28:.0f},{yb-h*.72:.0f} L{x+w*.1:.0f},{yb-h*.66:.0f} L{x-w*.08:.0f},{yb-h*.74:.0f}Z" fill="#f8fafc"/>'
biome('mountain',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + clouds(R4, 3, op=.6), grad('s', [(0, '#60a5fa'), (.8, '#dbeafe'), (1, '#f1f5f9')])),
  svg(peaks + f'<path d="{ridge(R4, 410, 50, 8)}" fill="#5b6b52"/>' + pines(R4, 430, 12, '#3f5240', (40, 70))),
  svg(rocks(R4, 10, '#6b7280', '#d1d5db') + tufts(R4, 16, '#6b8f4e', '#4d6b3a')))
# CIDADE
R5 = r(5); bld = ''
x = 0
while x < 800:
    w = R5.uniform(50, 100); h = R5.uniform(120, 260); bld += f'<rect x="{x:.0f}" y="{400-h:.0f}" width="{w:.0f}" height="{h+200:.0f}" fill="{R5.choice(["#94a3b8", "#a5b4c8", "#8796ad"])}"/>'
    for wy in range(int(400 - h + 14), 390, 22):
        for wx in range(int(x + 8), int(x + w - 10), 16): bld += f'<rect x="{wx}" y="{wy}" width="7" height="10" fill="#fef9c3" opacity="{R5.choice([.25, .5, .8])}"/>'
    x += w + R5.uniform(4, 16)
biome('city',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + clouds(R5, 3, op=.5), grad('s', [(0, '#93c5fd'), (.8, '#e0e7ff'), (1, '#f5f5f4')])),
  svg(bld + '<rect y="400" width="800" height="200" fill="#9ca3af"/>' + ''.join(f'<circle cx="{40+i*110}" cy="380" r="26" fill="#4d8a55"/><rect x="{37+i*110}" y="380" width="6" height="24" fill="#6b4f33"/>' for i in range(8))),
  svg('<rect y="560" width="800" height="40" fill="#78716c" opacity=".5"/>' + ''.join(f'<rect x="{i*100+20}" y="578" width="50" height="5" fill="#f5f5f4" opacity=".7"/>' for i in range(8))))
# NEVE
R6 = r(6); biome('snow',
  svg('<rect width="800" height="600" fill="url(#s)"/>' + clouds(R6, 4, '#f1f5f9', .7), grad('s', [(0, '#a5b4fc'), (.7, '#e0e7ff'), (1, '#f8fafc')])),
  svg(f'<path d="{smooth(R6, 320, 70, 5)}" fill="#e2e8f0"/>' + pines(R6, 350, 14, '#335a5e', (60, 100)) + ''.join(f'<path d="M{x:.0f},{y-60:.0f} l14,26 l-28,0z" fill="#f8fafc"/>' for x, y in [(R6.uniform(0, 800), 350) for _ in range(0)]) + f'<path d="{smooth(R6, 380, 40, 5)}" fill="#f1f5f9"/>'),
  svg(f'<path d="{smooth(R6, 560, 25, 6)}" fill="#ffffff"/>' + rocks(R6, 5, '#cbd5e1', '#ffffff')))
# DESERTO / SAVANA
R7 = r(7); biome('desert',
  svg('<rect width="800" height="600" fill="url(#s)"/><circle cx="620" cy="120" r="46" fill="#fde68a" opacity=".7"/>', grad('s', [(0, '#fb923c'), (.5, '#fcd34d'), (1, '#fef3c7')])),
  svg('<path d="M60,400 L120,260 L300,260 L350,400Z" fill="#c2703d"/><path d="M500,400 L540,300 L660,300 L700,400Z" fill="#b45f33"/>' + f'<path d="{smooth(R7, 390, 50, 4)}" fill="#e7b56b"/><path d="{smooth(R7, 430, 40, 4)}" fill="#d9a35a"/>' + ''.join(f'<g fill="#5f7d3a"><rect x="{x:.0f}" y="{y-50:.0f}" width="12" height="50" rx="6"/><rect x="{x-12:.0f}" y="{y-38:.0f}" width="10" height="20" rx="5"/><rect x="{x+14:.0f}" y="{y-44:.0f}" width="10" height="22" rx="5"/></g>' for x, y in [(R7.uniform(20, 780), 440) for _ in range(4)])),
  svg(''.join(f'<path d="M{x:.0f},{y:.0f} q30,-8 60,0" stroke="#c48a45" stroke-width="3" fill="none" opacity=".6"/>' for x, y in [(R7.uniform(0, 760), R7.uniform(540, 595)) for _ in range(12)]) + tufts(R7, 8, '#a3a35a', '#8a8a45', h=(12, 22))))
for k, (a, b, c) in B.items():
    for n, s in (('sky', a), ('hills', b), ('fg', c)): open(os.path.join(OUT, f'{k}-{n}.svg'), 'w').write(s)
print('ok', len(B) * 3)
