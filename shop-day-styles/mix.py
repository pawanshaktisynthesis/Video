"""Voice + score + a few foley hits → mix.wav (run with LIB set, after events.mjs and music/score.py)."""
import sys, os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, uniform_filter1d
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, compress, limit, whoosh
rng = np.random.default_rng(1)
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def nrm(x): m = np.abs(x).max(); return x / m if m else x
fol = np.zeros((N, 2)); voc = np.zeros((N, 2))
for e in EV['ev']:
    t, ty = e['t'], e['type']
    if ty == 'shutter': d = .9; x = bp(nz(d), 600, 3000) * (np.sin(2 * np.pi * 30 * T(d)) > .4) * np.sin(np.pi * T(d) / d); add(fol, nrm(x), t, .25, .2)
    elif ty == 'projector': d = e['dur']; x = bp(nz(d), 800, 2500) * (.5 + .5 * (np.sin(2 * np.pi * 24 * T(d)) > .7)); add(fol, nrm(x) * np.minimum(1, (d - T(d)) / .3), t, .06, 0)
    elif ty == 'clink': d = .6; add(fol, nrm(sum(np.sin(2 * np.pi * f * T(d)) * np.exp(-T(d) / tau) for f, tau in [(2100, .2), (3400, .12)])), t, .2, .2)
    elif ty == 'door': d = .5; add(fol, nrm(np.sign(np.sin(2 * np.pi * 660 * T(d))) * np.exp(-T(d) / .15)), t, .1, 0)
    elif ty == 'logo': d = 1.5; add(fol, nrm(sum(np.sin(2 * np.pi * f * T(d)) * np.exp(-T(d) / .5) for f in [880, 1320])), t, .15, 0)
    elif ty == 'cut' and t > .1: add(fol, whoosh(.25, 1), t - .12, .08, 0)
    elif ty == 'voice':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        add(voc, compress(nrm(soxr.resample(y, sr, SR)) * .9, thr=.3, ratio=3), t, .6, 0)
mus, _ = sf.read(os.path.join(D, 'music', 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = uniform_filter1d(maximum_filter1d((np.abs(voc).max(1) > .02).astype(float), int(.6 * SR)), int(.15 * SR))
mixd = voc * 1.1 + fol * .8 + mus * .5 * (1 - .55 * act)[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix.wav'), mixd.astype(np.float32), SR); print('mix', DUR)
