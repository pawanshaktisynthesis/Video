"""PawanSetu Diwali — sound design + mix → mix.wav. Run with LIB set, after events.mjs and music/score.py.
Ambience (room tone, crickets, street, distant crackers), paper-and-light foley on picture events, voice forward, music ducked."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, uniform_filter1d
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add, compress, limit, whoosh
rng = np.random.default_rng(31)
HI = os.environ.get('FILM_LANG') == 'hi'
EV = json.load(open(os.path.join(D, 'events_hi.json' if HI else 'events.json'))); DUR = float(EV['dur']); N = int(DUR * SR)
TL = json.loads(subprocess.check_output(['node', '-e', "globalThis.FILM_LANG=process.env.FILM_LANG;import('./timeline.js').then(m=>console.log(JSON.stringify({TL:m.TL,V:m.VOICE,VD:m.VOICES})))"], cwd=D))
VO, VD, TL = TL['V'], TL['VD'], TL['TL']
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
# ---- paper and light ----
def match(): d = .6; t = T(d); scr = bp(nz(.18), 1500, 7000) * np.sin(np.pi * T(.18) / .18); x = np.zeros(int(d * SR)); x[:len(scr)] += scr; fl = lp(nz(d), 1800) * np.minimum(1, np.maximum(0, t - .12) / .05) * np.exp(-np.maximum(0, t - .15) / .2); return nrm(x + fl * .7)
def flame(): d = 1.2; return nrm(lp(nz(d), 700) * np.sin(np.pi * T(d) / d) ** 2)
def click(): d = .06; return nrm(partials(d, [2400, 3700], [.008, .005], [1, .5]) + hp(nz(d), 3000) * ex(d, .003))
def shimmer(d=1.6): t = T(d); return nrm(sum(np.sin(2 * np.pi * f * t * (1 + .15 * t / d)) * np.sin(np.pi * t / d) ** 2 * rng.random() for f in [1760, 2217, 2637, 3520, 4434]))
def bell(): d = 4.0; return nrm(partials(d, [523, 1240, 1690, 2130, 2800, 3360], [2.5, 1.6, 1.1, .8, .5, .3], [1, .6, .45, .35, .2, .12]))
def paper(): d = .45; x = bp(nz(d), 800, 6000) * np.sin(np.pi * T(d) / d) * (.4 + .6 * (rng.random(int(d * SR)) > .6)); return nrm(lp(x, 5000))
def card(): d = .18; t = T(d); return nrm(np.sin(2 * np.pi * 190 * t) * ex(d, .03) + bp(nz(d), 700, 3000) * ex(d, .012) * .7)
def lid(): d = .3; return nrm(bp(nz(d), 500, 3500) * ex(d, .06) + partials(d, [320], [.05], [.4]))
def tick(): d = .15; return nrm(hp(nz(d), 2500) * ex(d, .01) * .4 + lp(nz(d), 1500) * ex(d, .05))
def scooter(d):
    t = T(d); f = 52 + 18 * np.clip(t / .5, 0, 1) - 14 * np.clip((t - d + .6) / .6, 0, 1); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 6)) * (1 + .35 * (np.sin(2 * np.pi * 11 * t) > 0)); return nrm(fade(lp(x, 700), .15, .35))
def launch(): d = .7; t = T(d); f = 900 + 1800 * t / d; return nrm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * .5 + hp(nz(d), 3000) * .2 * np.sin(np.pi * t / d))
def burst(big=1.):
    d = 2.6; t = T(d); out = lp(nz(d), 220) * ex(d, .22) * 1.4 * big
    for _ in range(int(70 * big)):
        s = int(min(2.4, .2 + rng.exponential(.55)) * SR); L = int(.008 * SR); out[s:s + L] += hp(rng.standard_normal(L), 2500) * np.exp(-np.arange(L) / (.0015 * SR)) * rng.random()
    return nrm(out)
def crackers(d):    # distant firecrackers
    out = np.zeros(int(d * SR)); t_ = 0
    while t_ < d - .6:
        t_ += rng.exponential(1.6); s = int(t_ * SR); L = int(.25 * SR); y = lp(rng.standard_normal(L), 900) * np.exp(-np.arange(L) / (.04 * SR))
        out[s:s + L] += y[:len(out) - s] * (.3 + .7 * rng.random())
    return lp(out, 1200)
def crickets(d): t = T(d); return np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 30 * t) > .3) * (np.sin(2 * np.pi * .9 * t) > 0) * .06 + np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 26 * t + 1) > .4) * (np.sin(2 * np.pi * .7 * t + 2) > .2) * .04
def street(d):
    m = np.zeros(int(d * SR))
    for _ in range(int(d * 6)): s = int(rng.random() * (len(m) - SR)); L = int((.1 + rng.random() * .3) * SR); m[s:s + L] += np.sin(np.pi * np.arange(L) / L) * rng.random()
    return bp(brown(d), 60, 400) * .5 + bp(nz(d), 300, 1800) * m * .1
def room(d): return lp(brown(d), 300) * .15
amb = np.zeros((N, 2)); fol = np.zeros((N, 2)); voc = np.zeros((N, 2))
def place(buf, x, t, g=1., pan=0.): add(buf, np.asarray(x, float), t, g, pan)
def bed(fn, t0, t1, fi, fo, g):
    d = t1 - t0
    for c in range(2):
        x = fn(d); env = np.ones(len(x)); ni, no = max(1, int(fi * SR)), max(1, int(fo * SR)); env[:ni] = np.linspace(0, 1, ni); env[-no:] = np.linspace(1, 0, no)
        s = int(t0 * SR); e = min(N, s + len(x)); amb[s:e, c] += (x * env)[:e - s] * g
bed(room, 0, DUR, .01, 1.5, .5)
bed(crickets, 1.0, 9.0, 1.5, 1.0, .35)
bed(street, TL['LAMP'] - .2, TL['SIL0'], 1.5, .7, .55)
bed(crackers, TL['LAMP'] + 1, TL['SIL0'] - .3, 1, .5, .25)
bed(street, TL['BURST'], DUR, .3, 3, .35); bed(crackers, TL['BURST'] + 1, DUR, 1, 3, .25)
for e in sorted(EV['ev'], key=lambda e: e['t']):
    t, ty = e['t'], e['type']
    if ty == 'match': place(fol, match(), t, .55, .15)
    elif ty == 'flame': place(fol, flame(), t, .3, .15)
    elif ty == 'lamp': place(fol, click(), t - .05, .4, 0); place(fol, shimmer(), t, .18, 0)
    elif ty == 'bell': place(fol, bell(), t + .05, .32, -.25)
    elif ty == 'curtain': place(fol, paper(), t, .35, .4); place(fol, whoosh(.6, 1), t, .2, -.2)
    elif ty == 'scooter': place(fol, scooter(e['dur']), t, .3, 0)
    elif ty == 'paper': place(fol, paper(), t, .25, .1)
    elif ty == 'box': place(fol, card(), t, .5, -.1)
    elif ty == 'lid': place(fol, lid(), t, .4, 0)
    elif ty == 'shimmer': place(fol, shimmer(2.0), t, .2, 0)
    elif ty == 'diya': place(fol, tick(), t, .18, -.4 + .1 * e['i'])
    elif ty == 'launch': place(fol, launch(), t, .18, 0)
    elif ty == 'burst': place(fol, burst(1.0 if e['i'] == 0 else .6), t, .55 if e['i'] == 0 else .3, [0, -.4, .4, -.2, .3, 0][e['i']])
    elif ty == 'seal': place(fol, card(), t, .3, .2)
    elif ty == 'logo_burst': place(fol, burst(1.2), t, .6, 0)
    elif ty == 'converge': place(fol, fade(whoosh(e['dur'], 1)[::-1], .05, .1), t, .25, 0); place(fol, shimmer(e['dur'] + .3), t, .18, 0)
for v in VO:
    y, sr = sf.read(os.path.join(D, VD, v['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
    y = soxr.resample(y, sr, SR); y = compress(nrm(y, .9), thr=.3, ratio=3); place(voc, y, v['t'], .6, 0)
tt = np.arange(N) / SR
# silence 1: black before the match (room tone only); silence 2: the breath before the burst
g = np.interp(tt, [0, TL['SIL0'] - .05, TL['SIL0'], TL['BURST'] - .7, TL['BURST'] - .69, DUR], [1, 1, 0, 0, 1, 1])[:, None]
fol *= np.maximum(g, (tt >= TL['BURST'] - .75)[:, None])   # the launch whistle of the first rocket is the only sound in the breath
mus, _ = sf.read(os.path.join(D, 'music', 'score_hi.wav' if HI else 'score.wav')); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = uniform_filter1d(maximum_filter1d((np.abs(voc).max(1) > .02).astype(float), int(.6 * SR)), int(.15 * SR))
duck = 1 - .5 * act
mixd = voc * 1.1 + fol * .9 * (1 - .25 * act)[:, None] + amb * .55 * (1 - .4 * act)[:, None] + mus * .55 * duck[:, None]
for c in range(2): mixd[:, c] = limit(mixd[:, c], .95)
sf.write(os.path.join(D, 'mix_hi.wav' if HI else 'mix.wav'), mixd.astype(np.float32), SR)
def rms(a, b, x=mixd): s = x[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
print('mix', DUR, 's | voice', rms(10.4, 12.5, voc * 1.1), '| music under voice', rms(10.4, 12.5, mus * .55 * duck[:, None]), '| silence1', rms(.1, .9), '| silence2', rms(35.4, 35.9), '| burst', rms(36, 37))
