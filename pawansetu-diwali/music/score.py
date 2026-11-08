"""PawanSetu Diwali — original score: tanpura drone, zither (koto model, santoor-like), harp, music box, soft hand drum.
80 BPM, raga-Yaman colour on D (D E F# G# A B C#). Run with LIB set → music/score.wav. Times from timeline.js."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
sys.path.insert(0, os.environ['LIB'])
from core.audio import pluck as P
from core.audio.sfx import SR, add
TL = json.loads(subprocess.check_output(['node', '-e', "globalThis.FILM_LANG=process.env.FILM_LANG;import('./timeline.js').then(m=>console.log(JSON.stringify(m.TL)))"], cwd=FILM))
HI = os.environ.get('FILM_LANG') == 'hi'
DUR = TL['END']; N = int((DUR + 3) * SR); B, BAR = .75, 3.0
rng = np.random.default_rng(8)
st = {k: np.zeros((N, 2)) for k in ['drone', 'zit', 'harp', 'box', 'drum']}
def put(s, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 2: add(st[s], np.asarray(x, float), t, g, pan)
T = lambda d: np.arange(int(d * SR)) / SR
hz = lambda p: 440 * 2 ** ((P.midi(p) - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
zit = lambda p, t, v=.6, d=2.5, pan=-.15, g=1: put('zit', P.pluck('koto', p, d, vel=v), t, g, pan)
harp = lambda p, t, v=.5, d=3, pan=.2, g=1: put('harp', P.pluck('harp', p, d, vel=v), t, g, pan)
box = lambda p, t, v=.45, d=2.5, pan=.1, g=1: put('box', P.pluck('music_box', p, d, vel=v), t, g, pan)
def drum(t, v=.6):   # one soft hand-drum stroke (a low "dha")
    d = .7; tt = T(d); x = np.sin(2 * np.pi * (110 * (1 + .25 * np.exp(-tt / .04))) * tt) * np.exp(-tt / .22) + lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt / .02) * .3
    put('drum', x * v, t, 1, 0)
def tanpura(t0, t1, g=1.):   # Pa-Sa-Sa-Sa plucks with buzzy jawari, every 3 s
    t = t0
    for k in range(int((t1 - t0) / .75) + 1):
        p = ['A2', 'D3', 'D3', 'D2'][k % 4]; d = 3.2; tt = T(d); f = hz(p)
        x = sum(np.sin(2 * np.pi * f * h * tt + h) / h ** .7 * (1 + .3 * np.sin(2 * np.pi * .7 * tt * h)) for h in range(1, 14)) * np.minimum(1, tt / .08) * np.exp(-tt / 2.2)
        put('drone', lp(x, 2500) * .12, t0 + k * .75, g, [-.3, .3, .1, -.1][k % 4])
tanpura(0.9, TL['SIL0'] - 1.0); tanpura(TL['BURST'], DUR - 1.5, .9)
# 1–6: the "one light" motif D–F#–A, slow
for t, p in [(1.2, 'D4'), (2.25, 'F#4'), (3.0, 'A4'), (4.5, 'G#4'), (5.25, 'A4')]: zit(p, t, .5)
# 6.0: the lamp — harp rising arpeggio + music box sparkles on windows
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'C#5', 'D5', 'F#5', 'A5']): harp(p, TL['LAMP'] + i * B / 3, .55)
for i in range(10): box(['D6', 'F#6', 'A6', 'E6', 'B5'][i % 5], 6.6 + i * .18, .25 + .1 * rng.random(), 1.5, pan=rng.uniform(-.5, .5), g=.6)
# 9.75–30: zither melody over a harp ostinato; one soft drum stroke per bar
CH = {'D': ['D3', 'A3', 'D4', 'F#4'], 'Bm': ['B2', 'F#3', 'B3', 'D4'], 'G': ['G2', 'D3', 'G3', 'B3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
PROG = ['D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D']
for bar in range(3, 10):
    t0 = bar * BAR; c = CH[PROG[bar % 8]]
    for i in range(8): harp([c[0], c[1], c[2], c[3], c[2], c[1], c[2], c[3]][i], t0 + i * B / 2, .32 if i else .45, 1.6, g=.8)
    drum(t0, .55); drum(t0 + 2 * B + B / 2, .3)
mel = [(9.75, 'A4'), (10.5, 'B4'), (11.25, 'C#5'), (12.0, 'D5'), (13.5, 'C#5'), (14.25, 'B4'), (15.0, 'A4'), (16.5, 'F#4'), (17.25, 'G#4'), (18.0, 'A4'),
       (19.5, 'D5'), (20.25, 'E5'), (21.0, 'F#5'), (22.5, 'E5'), (23.25, 'D5'), (24.0, 'C#5'), (25.5, 'B4'), (26.25, 'A4'), (27.0, 'G#4'), (28.5, 'A4'), (29.25, 'B4')]
for t, p in mel: zit(p, t, .5)
for t in TL['BOX']: box('A6', t, .5, 2.0); box('D7', t + .06, .35, 2.0)
# 30–34.5: harp arpeggios; one music-box note per diya
for bar in [10]:
    t0 = bar * BAR; c = CH['D']
    for i in range(12): harp(c[i % 4] if i < 8 else c[(i % 4)].replace('3', '4').replace('4', '5'), t0 + i * B / 2, .35, 2)
    drum(t0, .5)
for i, t in enumerate(TL['DIYAS']): box(['D6', 'E6', 'F#6', 'G#6', 'A6', 'B6', 'C#7', 'D7'][i], t, .4, 2.0)
harp('A2', TL['LID'], .5, 3); zit('A5', TL['LID'], .45, 3)
# 34.5–35.25: falling away into the near-silence; 36.0: burst + swell
for i, p in enumerate(['A4', 'F#4', 'D4']): zit(p, TL['TILT0'] + i * .25, .35, 2)
for p in ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']: harp(p, TL['BURST'] + rng.uniform(0, .04), .6, 4.5)
drum(TL['BURST'], .8)
for t, p in [(36.75, 'D5'), (37.5, 'F#5'), (38.25, 'A5'), (39.0, 'G#5'), (39.75, 'A5'), (41.25, 'F#5'), (42.0, 'D5')]: zit(p, t, .5, 3)
for t in TL['BURSTS'][1:]: box('D6', t, .3, 2); box('A6', t + .05, .25, 2)
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): harp(p, (44.5 if HI else 43.5) + i * .2, .45, 4)
if HI:   # logo reveal: a rising music-box glissando while the sparks gather, a full chord when the word forms
    g0, g1 = TL['LOGO_BURST'] + .6, TL['LOGO_FORM']; notes = ['D5', 'E5', 'F#5', 'G#5', 'A5', 'B5', 'C#6', 'D6', 'E6', 'F#6', 'A6', 'D7']
    for i, p in enumerate(notes): box(p, g0 + (g1 - g0) * i / len(notes), .28 + .02 * i, 1.6, pan=-.5 + i / len(notes))
    for p in ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5']: harp(p, g1, .55, 4)
    box('D6', g1, .5, 3); box('A6', g1 + .03, .4, 3); zit('D5', TL['LOGO_SEAL'], .45, 3)
mix = sum(st.values()); tt = np.arange(N) / SR
gate = np.interp(tt, [0, TL['SIL0'] - .4, TL['SIL0'], TL['BURST'] - .01, TL['BURST'], DUR + 3], [1, 1, 0, 0, 1, 1])
mix = (mix * gate[:, None])[:int(DUR * SR)]
fo = np.clip((DUR - tt[:len(mix)]) / 2.5, 0, 1); mix *= fo[:, None]
mix = mix / np.abs(mix).max() * .8
sf.write(os.path.join(HERE, 'score_hi.wav' if HI else 'score.wav'), mix.astype(np.float32), SR); print('score.wav', round(len(mix) / SR, 2), 's')
