"""PawanSetu — sound design + mix → mix.wav. Run after events.mjs and music/score.py, with LIB set.
Three layers: ambience beds (street, wind, shop room), foley synthesised per material and placed on picture events, music ducked under the voice."""
import sys, os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, uniform_filter1d
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, compress, limit, whoosh, creak
rng = np.random.default_rng(21)
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def ex(d, tau): return np.exp(-T(d) / tau)
def nrm(x, p=1.): m = np.abs(x).max(); return x * p / m if m > 0 else x
def brown(d): w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return nrm(hp(w, 15))
def partials(d, fs, taus, amps): t = T(d); return sum(a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau) for f, tau, a in zip(fs, taus, amps))
def fade(x, a=.01, b=.05): x = x.copy(); na, nb = int(a * SR), int(b * SR); x[:na] *= np.linspace(0, 1, na); x[-nb:] *= np.linspace(1, 0, nb); return x
# ---- foley by material ----
def tap(): d = .08; return nrm(hp(nz(d), 2500) * ex(d, .004) + partials(d, [1800], [.01], [.4]))
def tick(f=2100): d = .07; return nrm(np.sin(2 * np.pi * f * T(d)) * ex(d, .012) + hp(nz(d), 4000) * ex(d, .002) * .5)
def block(i): d = .35; t = T(d); f = 180 + 12 * i; return nrm(np.sin(2 * np.pi * f * t) * ex(d, .06) + partials(d, [f * 2.7, f * 5.1], [.03, .015], [.5, .3]) + lp(nz(d), 1200) * ex(d, .01) * .6)
def shutter(d=.6, small=False):
    t = T(d); rate = 38 if not small else 46; r = (np.sin(2 * np.pi * rate * t) > .6).astype(float) * (.6 + .4 * rng.random(len(t)))
    x = bp(nz(d), 700, 3500) * lp(r, 300) * 3 + bp(nz(d), 200, 800) * .3; return nrm(fade(x, .02, .15))
def ping(): d = 1.0; return nrm(partials(d, [1568, 2349, 3136], [.35, .25, .12], [1, .6, .3]))
def cut(): d = .25; return nrm(bp(nz(d), 3000, 8000) * np.sin(np.pi * T(d) / d) ** 2 * .8)
def slide(): d = .45; return nrm(bp(nz(d), 250, 1600) * np.sin(np.pi * T(d) / d) * (.7 + .3 * np.sin(2 * np.pi * 23 * T(d))))
def lift(): d = .12; return nrm(bp(nz(d), 1500, 5000) * ex(d, .03) * .5 + partials(d, [900], [.02], [.3]))
def drop(i): d = .3; t = T(d); return nrm(np.sin(2 * np.pi * (120 + 25 * i) * t) * ex(d, .05) + bp(nz(d), 800, 4500) * ex(d, .04) * .9)   # into a paper bag
def seal(): d = .35; return nrm(bp(nz(d), 1200, 6000) * (np.sin(np.pi * T(d) / d) ** .5) * (rng.random(int(d * SR)) > .7))
def scooter(d):
    t = T(d); f = 70 + 25 * np.clip(t / .8, 0, 1) - 20 * np.clip((t - d + .9) / .9, 0, 1); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 7)) * (1 + .25 * np.sin(2 * np.pi * 9 * t)); return nrm(fade(lp(x, 900) + lp(brown(d), 400) * .3, .3, .5))
def bell(): d = .9; one = partials(d, [3900, 5200, 7800], [.25, .15, .08], [1, .5, .25]); out = one.copy(); s = int(.14 * SR); out[s:] += one[:-s] * .8; return nrm(out)
def rustle(): d = .3; return nrm(bp(nz(d), 1500, 6000) * np.sin(np.pi * T(d) / d) * (rng.random(int(d * SR)) > .5))
def plop(): d = .12; t = T(d); return nrm(np.sin(2 * np.pi * (500 + 900 * t / d) * t) * ex(d, .03))
def truck(d): t = T(d); return nrm(fade(lp(brown(d), 160) + .3 * lp(np.sin(2 * np.pi * 42 * t) * (1 + .3 * np.sin(2 * np.pi * 3 * t)), 300), 1.2, 1.5))
def word(i): d = .4; t = T(d); return nrm(np.sin(2 * np.pi * (140 + 30 * i) * t) * ex(d, .07) + partials(d, [600 + 80 * i, 1500], [.05, .02], [.5, .3]))
# ---- ambience ----
def birds(d, dens=.9, seed=3):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); t_ = 0
    while t_ < d - .5:
        t_ += r.exponential(1 / dens); f0 = 2800 + r.random() * 1500
        for j in range(r.integers(2, 5)):
            L = .05 + r.random() * .07; tt = np.arange(int(L * SR)) / SR; f = f0 * (1 + .3 * np.sin(np.pi * tt / L))
            ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / L) ** 2; s = int((t_ + j * (L + .03)) * SR); out[s:s + len(ch)] += ch[:max(0, len(out) - s)] * .5
    return out
def street(d):    # distant traffic hum, a horn or two, voices murmur
    t = T(d); x = bp(brown(d), 60, 500) * .7
    m = np.zeros(int(d * SR))
    for _ in range(int(d * 5)): s = int(rng.random() * (len(m) - SR)); L = int((.1 + rng.random() * .25) * SR); m[s:s + L] += np.sin(np.pi * np.arange(L) / L) * rng.random()
    x += bp(nz(d), 300, 1800) * m * .12
    for tt in rng.uniform(1, d - 1, int(d / 9)): L = .35; tt2 = T(L); h = np.sin(2 * np.pi * 420 * tt2) + .5 * np.sin(2 * np.pi * 530 * tt2); s = int(tt * SR); x[s:s + len(h)] += h[:len(x) - s] * np.sin(np.pi * tt2 / L) * .03
    return x
def wind(d): t = T(d); return lp(brown(d), 400) * (.5 + .3 * np.sin(2 * np.pi * .2 * t)) * .5
amb = np.zeros((N, 2)); fol = np.zeros((N, 2)); voc = np.zeros((N, 2)); brd = np.zeros((N, 2))
def place(buf, x, t, g=1., pan=0.): add(buf, np.asarray(x, float), t, g, pan)
def bed(fn, t0, t1, fi, fo, g, buf=None):
    buf = amb if buf is None else buf; d = t1 - t0
    for c, sd in ((0, 1), (1, 2)):
        x = fn(d); env = np.ones(len(x)); ni, no = int(fi * SR), int(fo * SR); env[:ni] = np.linspace(0, 1, ni); env[-no:] = np.linspace(1, 0, no)
        s = int(t0 * SR); e = min(N, s + len(x)); buf[s:e, c] += (x * env)[:e - s] * g
bed(street, 0, 8.6, .6, .5, .5)                       # the street, then it drains away before the silence
bed(wind, 2.5, 10.4, 1.5, .6, .45)                     # wind over the far fields, alone in the near-silence
bed(street, 9.6, DUR, .5, 1.5, .5)                    # J-cut: the street returns just before the chime
bed(lambda d: bp(brown(d), 80, 400) * .5, 17.3, 22.2, .4, .5, .6)   # shop room tone inside the cutaway
bed(lambda d: birds(d, .8, 3), 0, 8.5, .5, .5, .1, brd); bed(lambda d: birds(d, 1.0, 9), 10.5, DUR, 1, 1.5, .1, brd)
orders = [e['t'] for e in EV['ev'] if e['type'] == 'order']
for e in sorted(EV['ev'], key=lambda e: e['t']):
    t, ty = e['t'], e['type']
    if ty == 'tap': place(fol, tap(), t, .4, .2)
    elif ty == 'pin': place(fol, tick(), t, .2, .2)
    elif ty == 'line_whoosh': place(fol, fade(whoosh(1.4, 1), .05, .6), t, .35, -.1)
    elif ty == 'truck': place(fol, truck(e['dur']), t, .25, -.2)
    elif ty == 'shutter_creak': place(fol, creak(1.0), t, .12, .2)
    elif ty == 'whoosh_in': place(fol, whoosh(.5, 1), t, .25, 0)
    elif ty == 'whoosh_out': place(fol, whoosh(.6, 1)[::-1], t, .22, 0)
    elif ty == 'block': place(fol, block(e['i']), t, .45, -.3 + .08 * e['i'])
    elif ty == 'shutter_roll': place(fol, shutter(.55), t, .4, .25)
    elif ty == 'shutter_roll_small': place(fol, shutter(.35, True), t, .22, rng.uniform(-.4, .4))
    elif ty == 'inset_open': place(fol, whoosh(.3, 1) * .5, t - .05, .25, .3)
    elif ty == 'inset_close': place(fol, whoosh(.25, 1)[::-1] * .5, t, .18, .3)
    elif ty == 'ping': place(fol, ping(), t, .3, .3)
    elif ty == 'cut': place(fol, cut(), t, .3, 0)
    elif ty == 'wall_slide': place(fol, slide(), t, .35, 0)
    elif ty == 'item_lift': place(fol, lift(), t, .2, -.2)
    elif ty == 'item_drop': place(fol, drop(e['i']), t, .5, .1)
    elif ty == 'seal': place(fol, seal(), t, .35, .1)
    elif ty == 'scooter': place(fol, scooter(e['dur']), t, .3, 0)
    elif ty == 'bell': place(fol, bell(), t, .3, -.2)
    elif ty == 'handover': place(fol, rustle(), t, .4, -.2)
    elif ty == 'order': place(fol, plop(), t, .12, rng.uniform(-.5, .5))
    elif ty == 'word': place(fol, word(e['i']), t, .45, 0)
    elif ty == 'voice':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        y = soxr.resample(y, sr, SR); y = compress(nrm(y, .9), thr=.3, ratio=3); place(voc, y, t, .62, 0)
tt = np.arange(N) / SR
# near-silence 8.8–10.0: only wind (no street, birds, foley tails)
g_sil = np.interp(tt, [0, 8.75, 8.85, 9.95, 10.0, DUR], [1, 1, 0, 0, 1, 1])[:, None]
fol *= g_sil; brd *= g_sil
mus, sr = sf.read(os.path.join(D, 'music', 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = uniform_filter1d(maximum_filter1d((np.abs(voc).max(1) > .02).astype(float), int(.6 * SR)), int(.15 * SR))
duck_m = 1 - .6 * act; duck_a = 1 - .55 * act; duck_f = 1 - .3 * act
brd *= (1 - act)[:, None]
mixd = voc * 1.1 + brd + fol * .9 * duck_f[:, None] + amb * .5 * duck_a[:, None] + mus * .5 * duck_m[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix.wav'), mixd.astype(np.float32), SR)
def rms(a, b, x=mixd): s = x[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
print('mix.wav', DUR, 's | voice', rms(13.3, 15, voc * 1.1), 'dB | music under voice', rms(13.3, 15, mus * .5 * duck_m[:, None]), 'dB | near-silence 8.9–9.9', rms(8.9, 9.9), 'dB | chime 10.0–10.6', rms(10, 10.6))
