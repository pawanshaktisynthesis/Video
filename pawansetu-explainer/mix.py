"""PawanSetu explainer — foley + ambience + voice + music → mix.wav. Run with LIB set, after events.mjs and music/score.py."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, uniform_filter1d
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, compress, limit, whoosh
rng = np.random.default_rng(12)
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
X = json.loads(subprocess.check_output(['node', '-e', "import('./timeline.js').then(m=>console.log(JSON.stringify({TL:m.TL,V:m.SUBS})))"], cwd=D)); TL, VO = X['TL'], X['V']
T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def ex(d, tau): return np.exp(-T(d) / tau)
def nrm(x, p=1.): m = np.abs(x).max(); return x * p / m if m > 0 else x
def partials(d, fs, taus, amps): t = T(d); return sum(a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau) for f, tau, a in zip(fs, taus, amps))
def stamp(): d = .25; t = T(d); return nrm(np.sin(2 * np.pi * 95 * t) * ex(d, .04) + lp(nz(d), 900) * ex(d, .015) * .8)        # damped rubber stamp
def pop(): d = .12; t = T(d); return nrm(np.sin(2 * np.pi * (380 + 900 * t / d) * t) * ex(d, .03))
def swish(): d = .35; return nrm(bp(nz(d), 900, 6000) * np.sin(np.pi * T(d) / d) ** 2)
def iris(): d = .3; t = T(d); return nrm(bp(nz(d), 2000, 8000) * np.sin(np.pi * t / d) * (1 - t / d) + hp(nz(d), 4000) * ex(d, .02) * .3)
def tap(): d = .07; return nrm(partials(d, [1900, 3100], [.01, .006], [1, .4]) + hp(nz(d), 3000) * ex(d, .004) * .6)       # plastic screen tap
def click(): d = .1; return nrm(partials(d, [2500, 4200, 1200], [.015, .008, .03], [1, .5, .6]) + hp(nz(d), 2500) * ex(d, .003))
def pips():
    out = np.zeros(int(.45 * SR))
    for i, f in enumerate([1320, 1760, 2640]): s = int(i * .1 * SR); y = np.sin(2 * np.pi * f * T(.09)) * ex(.09, .03); out[s:s + len(y)] += y
    return nrm(out)
def pins():
    out = np.zeros(int(1.2 * SR))
    for i in range(4): s = int(i * .25 * SR); y = pop(); out[s:s + len(y)] += y * .8
    return nrm(out)
def tick(): d = .12; return nrm(bp(nz(d), 1500, 6000) * ex(d, .02) + partials(d, [900], [.02], [.3]))   # pen tick on paper
def scratch(): d = .8; return nrm(bp(nz(d), 2000, 7000) * (np.sin(2 * np.pi * 9 * T(d)) > -.2) * np.sin(np.pi * T(d) / d))
def slide(): d = .7; t = T(d); return nrm(np.sin(2 * np.pi * np.cumsum(500 + 900 * t / d) / SR) * np.sin(np.pi * t / d) * .6)     # slide whistle for the arrow
def rustle(): d = .3; return nrm(bp(nz(d), 600, 3000) * np.sin(np.pi * T(d) / d))
amb = np.zeros((N, 2)); fol = np.zeros((N, 2)); voc = np.zeros((N, 2))
def place(buf, x, t, g=1., pan=0.): add(buf, np.asarray(x, float), t, g, pan)
room = lp(np.cumsum(nz(DUR)), 300); room = nrm(hp(room, 20)) * .12
amb[:, 0] += room[:N]; amb[:, 1] += room[:N] * .9
for k in range(int(10.25 / .5)): place(amb, partials(.05, [3200, 5100], [.008, .005], [1, .5]), k * .5, .05 if k % 2 else .08, .3)   # mantel clock on the grid (hook)
F = {'slide': (slide, .25), 'rustle': (rustle, .3), 'stamp': (stamp, .55), 'pop': (pop, .25), 'swish': (swish, .35), 'iris': (iris, .3), 'tap': (tap, .45),
     'pips': (pips, .2), 'pins': (pins, .25), 'click': (click, .6), 'tick': (tick, .45), 'scratch': (scratch, .2)}
for e in EV['ev']:
    if e['type'] in F: fn, g = F[e['type']]; place(fol, fn(), e['t'], g, rng.uniform(-.2, .2))
for v in VO:
    y, sr = sf.read(os.path.join(D, 'voices', v['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
    place(voc, compress(nrm(soxr.resample(y, sr, SR), .9), thr=.3, ratio=3), v['t0'], .6)
tt = np.arange(N) / SR
g = np.interp(tt, [0, TL['SIL0'] - .02, TL['SIL0'], TL['ORDER'] - .01, TL['ORDER'], DUR], [1, 1, 0, 0, 1, 1])[:, None]   # the beat of silence before the order click
amb *= g; fol *= g
mus, _ = sf.read(os.path.join(D, 'music', 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = uniform_filter1d(maximum_filter1d((np.abs(voc).max(1) > .02).astype(float), int(.6 * SR)), int(.15 * SR))
mixd = voc * 1.1 + fol * .8 + amb * .6 + mus * .5 * (1 - .6 * act)[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix.wav'), mixd.astype(np.float32), SR)
def rms(a, b, x=mixd): s = x[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
print('mix', DUR, 's | voice', rms(15.3, 18, voc * 1.1), '| music under voice', rms(15.3, 18, mus * .5 * (1 - .6 * act)[:, None]), '| silence', rms(TL['SIL0'] + .05, TL['ORDER'] - .05), '| order', rms(TL['ORDER'], TL['ORDER'] + .5))
