"""PawanSetu — original score: kalimba, marimba, music box, plucked bass, hand percussion. 96 BPM, D major.
Run: $LIB/.venv/bin/python music/score.py  (LIB in the environment) → music/score.wav
Times come from timeline.js (read through node): picture and music share one grid."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio import pluck as P
from core.audio.sfx import SR, add
TL = json.loads(subprocess.check_output(['node', '-e', "import('./timeline.js').then(m=>console.log(JSON.stringify(m.TL)))"], cwd=FILM))
DUR = TL['END']; N = int((DUR + 2) * SR)
B, BAR = .625, 2.5
rng = np.random.default_rng(4)
stems = {k: np.zeros((N, 2)) for k in ['kal', 'mar', 'box', 'bass', 'perc']}
def put(s, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1: add(stems[s], np.asarray(x, float), t, g, pan)
T = lambda d: np.arange(int(d * SR)) / SR
def hz(p): return 440 * 2 ** ((P.midi(p) - 69) / 12)
def marimba(p, v=.7, d=1.6):
    f = hz(p); t = T(d); tau = .55 * (262 / f) ** .45
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / tau) + .35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / (tau * .18)) + .12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / (tau * .06))
    x[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR)); return x * v
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def shaker(v=.5): d = .07; x = hp(rng.standard_normal(int(d * SR)), 5000) * np.exp(-T(d) / .018); return x * v
def cajon(v=.7): d = .3; t = T(d); return (np.sin(2 * np.pi * (95 - 35 * t / d) * t) * np.exp(-t / .07) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t / .015) * .4) * v
def slap(v=.5): d = .15; t = T(d); x = sosfilt(butter(2, [900, 4000], 'band', fs=SR, output='sos'), rng.standard_normal(len(t))) * np.exp(-t / .025); return x / np.abs(x).max() * v
def wblock(f=1100, v=.5): d = .12; t = T(d); return (np.sin(2 * np.pi * f * t) * np.exp(-t / .03) + .4 * np.sin(2 * np.pi * f * 2.6 * t) * np.exp(-t / .012)) * v
kal = lambda p, t, v=.6, d=1.8, pan=.25, g=1: put('kal', P.pluck('kalimba', p, d, vel=v), t, g, pan)
mar = lambda p, t, v=.6, d=1.6, pan=-.2, g=1: put('mar', marimba(p, v, d), t, g, pan)
box = lambda p, t, v=.5, d=2.5, pan=.1, g=1: put('box', P.pluck('music_box', p, d, vel=v), t, g, pan)
bas = lambda p, t, v=.7, d=1.0, g=1: put('bass', P.pluck('upright_bass_pizz', p, d, vel=v), t, g, 0)
CH = {'D': ['D3', 'A3', 'D4', 'F#4'], 'Bm': ['B2', 'F#3', 'B3', 'D4'], 'G': ['G2', 'D3', 'G3', 'B3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
ROOT = {'D': 'D2', 'Bm': 'B1', 'G': 'G1', 'A': 'A1'}
PROG = ['D', 'Bm', 'G', 'A']
ch_at = lambda t: PROG[int(t // BAR) % 4]
HOME = ['F#4', 'A4', 'D5']                     # the "home" motif (kalimba)
SETU = ['D5', 'F#5', 'A5', 'B5', 'A5']          # the PawanSetu motif (marimba)

# ---- A 0–7.5: home motif, kalimba arpeggio, shaker; thins as the line goes far ----
for i, p in enumerate(HOME): kal(p, TL['PHONE'] + i * B / 2, .7)
for bar in range(1, 3):
    t0 = bar * BAR; c = CH[ch_at(t0)]
    for i in range(8): kal([c[1], c[2], c[3], c[2]][i % 4], t0 + i * B / 2, .42 if i % 2 else .55, 1.2)
    bas(ROOT[ch_at(t0)], t0, .6, 1.2)
for i in range(int(1.25 / (B / 2)), int(7.5 / (B / 2))): put('perc', shaker(.4 if i % 2 == 0 else .28), i * B / 2, 1, .4)
kal('A3', 7.5, .5, 2.5); bas('D2', 7.5, .5, 1.3)
# ---- bar 4 (10.0): the bridge. A chime first, then one marimba note per landing block ----
box('D6', TL['BRIDGE0'], .8, 3); box('A6', TL['BRIDGE0'] + .01, .5, 3)
scale = ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5']
for i, t in enumerate(TL['BLOCKS']): mar(scale[i], t, .6)
mar('D3', TL['BRIDGE0'], .5, 2.4)
for i, p in enumerate(SETU): mar(p, TL['SHOP_ON'] + .3125 + i * B / 2, .65)
# ---- 12.5–26.25: the groove ----
for bar in range(5, 11):
    t0 = bar * BAR; c = ch_at(t0); C = CH[c]
    for q in range(4):
        tq = t0 + q * B
        if tq >= TL['ACC0'] + 1.25 * 0 and tq >= 26.25: break
        put('perc', cajon(.6) if q % 2 == 0 else slap(.45), tq, 1, 0)
        for p in C[1:]: mar(p, tq + B / 2, .32, .5, pan=-.3, g=.7)            # off-beat chords
    bas(ROOT[c], t0, .7, .9); bas(ROOT[c], t0 + 2 * B, .55, .7)
    for i in range(8): put('perc', shaker(.32 if i % 2 == 0 else .2), t0 + i * B / 2, 1, .45)
mel = [(12.5, 'A4'), (12.8125, 'B4'), (13.125, 'D5'), (14.375, 'B4'), (15.0, 'F#4'), (17.5, 'A4'), (17.8125, 'B4'), (18.125, 'D5'), (19.375, 'E5'), (20.0, 'D5'),
       (22.5, 'F#5'), (22.8125, 'E5'), (23.125, 'D5'), (24.375, 'B4'), (25.0, 'A4')]
for t, p in mel: kal(p, t, .45, 1.4, .3)
box('A5', TL['PING'], .5, 1.5); box('E6', TL['PING'] + .08, .4, 1.5)
# ---- 26.25–32.5: accumulation — groove + woodblock, one pitched plink per order ----
for bar in range(10, 13):
    t0 = bar * BAR; c = ch_at(t0); C = CH[c]
    for q in range(4):
        tq = t0 + q * B
        if tq < 26.25: continue
        put('perc', cajon(.65) if q % 2 == 0 else slap(.5), tq, 1, 0); put('perc', wblock(1100 if q % 2 else 900, .35), tq + B / 2, 1, -.4)
        for p in C[1:]: mar(p, tq + B / 2, .32, .5, pan=-.3, g=.7)
    bas(ROOT[c], t0 + (B * 2 if t0 < 26.25 else 0), .7, .9); bas(ROOT[c], t0 + 2 * B, .55, .7)
    for i in range(8):
        if t0 + i * B / 2 >= 26.25: put('perc', shaker(.34 if i % 2 == 0 else .22), t0 + i * B / 2, 1, .45)
penta = ['D6', 'E6', 'F#6', 'A6', 'B6']
for i, t in enumerate(TL['ORDERS']): box(penta[int(i * 7) % 5], t, .3 + .1 * (i < 10), 1.0, pan=(i % 5 - 2) * .2, g=.7)
# ---- 32.5–40: the reveal: thin out, one note per label, resolve on the motif ----
for i, t in enumerate(TL['LABELS']): mar(['A4', 'B4', 'D5', 'F#5'][i], t, .6, 1.8)
for bar in range(13, 15):
    t0 = bar * BAR; C = CH[ch_at(t0)]
    for i in range(4): kal([C[1], C[2], C[3], C[2]][i], t0 + i * B, .35, 1.4)
    bas(ROOT[ch_at(t0)], t0, .5, 1.5)
for i, p in enumerate(SETU[:3] + ['D6']): mar(p, TL['RESOLVE'] + i * B / 2, .6, 2.5)
box('D6', TL['RESOLVE'] + 1.875, .45, 3.5); kal('D4', TL['RESOLVE'] + 1.875, .4, 3); bas('D2', TL['RESOLVE'] + 1.875, .55, 2.5)

# the far line: low-pass closes 3 → 7.5 s; the near-silence 8.8 → 10.0 (music gated to zero)
mixd = sum(stems.values())
tt = np.arange(N) / SR
w = np.clip((tt - 3.0) / 4.5, 0, 1) * (tt < 10)
for c in range(2): mixd[:, c] = mixd[:, c] * (1 - w) + lp(mixd[:, c], 700) * w
gate = np.interp(tt, [0, 8.5, 8.8, 9.999, 10.0, DUR + 2], [1, 1, 0, 0, 1, 1])
mixd *= gate[:, None]
mixd = mixd[:int(DUR * SR)]
mixd = mixd / np.abs(mixd).max() * .8
sf.write(os.path.join(HERE, 'score.wav'), mixd.astype(np.float32), SR)
print('score.wav', round(len(mixd) / SR, 2), 's')
