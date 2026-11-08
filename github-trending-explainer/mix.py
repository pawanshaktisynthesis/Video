"""UI sound family + voice + score → mix.wav. Run with LIB set, after events.mjs and music/score.py."""
import sys, os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, uniform_filter1d
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, compress, limit, whoosh
rng = np.random.default_rng(4)
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def nrm(x, p=1.): m = np.abs(x).max(); return x * p / m if m > 0 else x
def partials(d, fs, taus, amps): t = T(d); return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, tau, a in zip(fs, taus, amps))
def thock(): d = .2; t = T(d); return nrm(np.sin(2 * np.pi * (140 - 60 * t / d) * t) * np.exp(-t / .04) + bp(nz(d), 800, 3000) * np.exp(-t / .01) * .5)
def key(): d = .04; return nrm(partials(d, [3200, 5400], [.006, .004], [1, .5]) + hp(nz(d), 5000) * np.exp(-T(d) / .002))
def chime(): d = 1.2; return nrm(partials(d, [1568, 2349, 3136], [.5, .35, .2], [1, .6, .3]))
def slide(): d = .25; return nrm(bp(nz(d), 1500, 6000) * np.sin(np.pi * T(d) / d))
def tick(): d = .05; return nrm(partials(d, [2600], [.01], [1]) + hp(nz(d), 4000) * np.exp(-T(d) / .003) * .4)
def boom(): d = 2.0; t = T(d); return nrm(np.sin(2 * np.pi * 50 * t) * np.exp(-t / .5) + partials(d, [400, 800, 1200], [.6, .4, .3], [.3, .2, .1]))
fol = np.zeros((N, 2)); voc = np.zeros((N, 2))
for e in EV['ev']:
    t, ty = e['t'], e['type']
    if ty == 'row': add(fol, tick(), t, .12, -.3 + .06 * e['i'])
    elif ty == 'whoosh': add(fol, whoosh(.35, 1), t, .14, .3)
    elif ty == 'whoosh_out': add(fol, whoosh(.4, 1)[::-1], t, .12, -.3)
    elif ty == 'drop': add(fol, thock(), t, .35, -.2)
    elif ty == 'slide': add(fol, slide(), t, .12, .3)
    elif ty == 'typing':
        n = int(e['dur'] * 9)
        for k in range(n): add(fol, key(), t + k / 9 + rng.uniform(0, .03), .05 + .03 * rng.random(), .3)
    elif ty == 'chime': add(fol, chime(), t, .14, .25)
    elif ty == 'giant': add(fol, boom(), t, .5, 0)
    elif ty == 'board': add(fol, chime(), t, .12, 0)
    elif ty == 'voice':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        add(voc, compress(nrm(soxr.resample(y, sr, SR), .9), thr=.3, ratio=3), t, .6, 0)
mus, _ = sf.read(os.path.join(D, 'music', 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = uniform_filter1d(maximum_filter1d((np.abs(voc).max(1) > .02).astype(float), int(.6 * SR)), int(.15 * SR))
mixd = voc * 1.1 + fol * .8 * (1 - .3 * act)[:, None] + mus * .45 * (1 - .6 * act)[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix.wav'), mixd.astype(np.float32), SR)
def rms(a, b, x=mixd): s = x[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
print('mix', DUR, 's | voice', rms(10, 14, voc * 1.1), '| music under voice', rms(10, 14, mus * .45 * (1 - .6 * act)[:, None]))
