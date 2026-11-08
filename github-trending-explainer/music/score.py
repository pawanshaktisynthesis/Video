"""Original process-music bed: two FM-pluck patterns phasing against each other (Reich-like), soft pulse, warm pad; chord moves at each segment.
All synthesised. Reads timeline.json. Run with LIB set → music/score.wav"""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(HERE)
sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add
TL = json.load(open(os.path.join(D, 'timeline.json'))); DUR = TL['DUR']; N = int((DUR + 3) * SR)
rng = np.random.default_rng(2)
st = {k: np.zeros((N, 2)) for k in ['a', 'b', 'pad', 'pulse']}
def put(s, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 2: add(st[s], np.asarray(x, float), t, g, pan)
Tt = lambda d: np.arange(int(d * SR)) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
_cache = {}
def pluck(m, v):
    if m not in _cache:
        d = .7; f = hz(m); t = Tt(d); I = 1.6 * np.exp(-t / .08)
        _cache[m] = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * 2 * t)) * np.exp(-t / .22)
    return _cache[m] * v
# harmony per section: intro, then one chord per repo segment, outro
PROGS = [[62, 69, 74, 76], [60, 67, 72, 74], [57, 64, 69, 71], [65, 72, 77, 79], [62, 69, 74, 78]]
def chord_at(t):
    k = sum(1 for s in TL['segs'] if t >= s['t0'] - .2)
    return PROGS[k % len(PROGS)]
B = .5   # pulse: 120 BPM eighths = .25
pat = [0, 2, 1, 3, 2, 0, 3, 1]
sil0 = [s for s in TL['segs'] if s.get('giant') is not None][0]['giant']
t = .4; i = 0
while t < DUR - 1.5:
    c = chord_at(t)
    if not (sil0 - .2 <= t < sil0 + .5):
        put('a', pluck(c[pat[i % 8]], .3), t, 1, -.35)
        tb = t * (1 + .004 * ((t // 12) % 2))          # the second voice drifts and realigns: phasing
        put('b', pluck(c[pat[(i + 3) % 8]] + 12, .18), tb + .125 * ((i // 32) % 2), 1, .35)
        if i % 2 == 0: d = .12; put('pulse', lp(rng.standard_normal(int(d * SR)), 900) * np.exp(-Tt(d) / .02) * .12 + np.sin(2 * np.pi * 55 * Tt(d)) * np.exp(-Tt(d) / .05) * .25, t)
    t += .25; i += 1
# pads: one per section, long
edges = [0.3] + [s['t0'] for s in TL['segs']] + [TL['outro'], DUR - 1]
for a, b in zip(edges[:-1], edges[1:]):
    d = b - a + 1; tt = Tt(d); c = chord_at(a + .3); env = np.minimum(1, tt / 1.0) * np.minimum(1, (d - tt) / 1.0)
    x = sum(np.sin(2 * np.pi * hz(m - 12) * tt + k) for k, m in enumerate(c)) / 4
    put('pad', lp(x, 900) * env * .16, a)
mix = st['a'] + st['b'] + st['pad'] + st['pulse']
tt = np.arange(N) / SR
mix *= np.interp(tt, [0, sil0 - .25, sil0, sil0 + .45, sil0 + .5, DUR + 3], [1, 1, .03, .03, 1, 1])[:, None]
mix = mix[:int(DUR * SR)] * np.clip((DUR - tt[:int(DUR * SR)]) / 2.0, 0, 1)[:, None]
mix = mix / np.abs(mix).max() * .8
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR); print('score.wav', round(len(mix) / SR, 1), 's')
