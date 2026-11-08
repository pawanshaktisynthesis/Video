"""SPIN. RESET. — foley (material-first) + score → mix.wav. Run with LIB set, after events.mjs and music/score.py."""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, limit, whoosh
rng = np.random.default_rng(3)
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def nrm(x, p=1.): m = np.abs(x).max(); return x * p / m if m > 0 else x
def partials(d, fs, taus, amps): t = T(d); return sum(a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau) for f, tau, a in zip(fs, taus, amps))
def shimmer(d):   # glass shimmer for a sweep: band-passed noise + inharmonic partials
    t = T(d); env = np.sin(np.pi * t / d) ** 1.5; return nrm(bp(nz(d), 3000, 11000) * env * .6 + partials(d, [2730, 4410, 6020, 8150], [d, d, d * .6, d * .4], [.3, .25, .2, .15]) * env)
def spinup(d=2.4):   # bearing whirr rising in pitch
    t = T(d); f = 60 + 240 * (1 - np.exp(-t / .8)); ph = 2 * np.pi * np.cumsum(f * 7) / SR
    return nrm((np.sin(ph) * .3 + bp(nz(d), 1500, 6000) * (.5 + .5 * np.sin(np.cumsum(f) / SR * 2 * np.pi))) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .8))
def friction(d=1.2): t = T(d); return nrm(bp(nz(d), 1200, 5000) * (.6 + .4 * np.sin(2 * np.pi * 37 * t) ** 2) * np.sin(np.pi * t / d) + lp(nz(d), 300) * np.sin(np.pi * t / d) * .4)
def snap():   # click cluster ms apart + inharmonic glass chord (×2.76, ×5.4) + low thump
    d = 2.0; out = np.zeros(int(d * SR))
    for k in range(4): s = int(k * .004 * SR); L = int(.002 * SR); out[s:s + L] += rng.standard_normal(L) * (1 - k * .2)
    out += partials(d, [880, 880 * 2.76, 880 * 5.4, 3950, 5100], [.9, .6, .35, .5, .3], [.5, .35, .2, .2, .12]) + lp(nz(d), 200) * np.exp(-T(d) / .06)
    return nrm(out)
def tick(): d = .06; return nrm(partials(d, [3800, 5200], [.01, .006], [1, .5]) + hp(nz(d), 4000) * np.exp(-T(d) / .003))
def ding(): d = 2.5; return nrm(partials(d, [1320, 1320 * 2.76, 1320 * 5.4], [1.2, .7, .3], [1, .4, .15]))
fol = np.zeros((N, 2))
for e in EV['ev']:
    t, ty = e['t'], e['type']
    if ty == 'sweep': add(fol, shimmer(e['dur'] + .3), t - .1, .22, e.get('pan', 0) * .7)
    elif ty == 'spinup': add(fol, spinup(), t, .2, 0)
    elif ty == 'apart': add(fol, friction(), t, .25, -.2); add(fol, whoosh(.8, 1), t + .2, .12, .2)
    elif ty == 'snap': add(fol, snap(), t, .55, 0)
    elif ty == 'title': add(fol, tick(), t, .12, .2)
    elif ty == 'logo': add(fol, ding(), t, .2, 0)
tt = np.arange(N) / SR
mus, _ = sf.read(os.path.join(D, 'music', 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
sil = [e['t'] for e in EV['ev'] if e['type'] == 'reverse'][0]; snp = [e['t'] for e in EV['ev'] if e['type'] == 'snap'][0]
fol *= np.interp(tt, [0, sil - .02, sil, snp - .01, snp, DUR], [1, 1, 0, 0, 1, 1])[:, None]   # the silence before the snap
room = lp(np.cumsum(nz(DUR)), 200); room = nrm(hp(room, 20)) * .01; room *= np.interp(tt, [0, sil - .02, sil, snp - .01, snp, DUR], [1, 1, 0, 0, 1, 1])
mixd = mus * .7 + fol * .8 + room[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix.wav'), mixd.astype(np.float32), SR)
def rms(a, b): s = mixd[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
print('mix', DUR, 's | open', rms(1, 4), '| spin', rms(10, 14), '| silence', rms(sil + .05, snp - .3), '| snap', rms(snp, snp + .5))
