"""One cue per chapter, each in its style's own sound palette, all synthesised; hard cuts with the picture.
Swiss: dry clicks + bass pulse · watercolour: soft plucked harp + birds-ish chimes · silent film: picture-house piano (pluck model) · glass: FM glass bells + sub ·
riso: woodblock + bouncy pluck (Tati-ish everyday rhythm) · cartoon: vibraphone + walking pizz bass · iso: marimba groove · pixel: square/triangle chip tune with echo · paper-cut: tanpura drone + music box."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
sys.path.insert(0, os.environ['LIB'])
from core.audio import pluck as P
from core.audio.sfx import SR, add
X = json.loads(subprocess.check_output(['node', '-e', "import('./timeline.js').then(m=>console.log(JSON.stringify({CH:m.CH,DUR:m.DUR})))"], cwd=FILM)); CH, DUR = {c['id']: c for c in X['CH']}, X['DUR']
N = int((DUR + 2) * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(6)
T = lambda d: np.arange(int(d * SR)) / SR
hz = lambda m: 440 * 2 ** ((P.midi(m) - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def put(x, t, g=1., pan=0.): add(out, np.asarray(x, float), t, g, pan)
def sine(m, d, dec=.3): t = T(d); return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t / dec)
def fm(m, d, r=3.5, I=2, dec=.8): t = T(d); f = hz(m); return np.sin(2 * np.pi * f * t + I * np.exp(-t / .3) * np.sin(2 * np.pi * f * r * t)) * np.exp(-t / dec)
def sq(m, d, duty=.5): t = T(d); x = np.sign(np.sin(2 * np.pi * hz(m) * t) - (2 * duty - 1) * 0) ; return x * np.minimum(1, (d - t) / .02) * .3
def tri(m, d): t = T(d); ph = (hz(m) * t) % 1; return (4 * np.abs(ph - .5) - 1) * np.minimum(1, (d - t) / .02) * .5
def click(): d = .02; return lp(rng.standard_normal(int(d * SR)), 6000) * np.exp(-T(d) / .003)
def wood(f=900): d = .1; t = T(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / .025)
def pl(inst, m, d=1.5, v=.6): return P.pluck(inst, m, d, vel=v)
def vib(m, d=1.5): t = T(d); return (np.sin(2 * np.pi * hz(m) * t) + .2 * np.sin(2 * np.pi * hz(m) * 4 * t) * np.exp(-t / .2)) * np.exp(-t / .9) * (1 + .2 * np.sin(2 * np.pi * 5.5 * t))
def marimba(m, d=.8): t = T(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / .05)) * np.exp(-t / .35)
def sec(c, fn):
    t0, t1 = CH[c]['t0'], CH[c]['t1']; fn(t0, t1)
# title + end: Swiss — clicks on the grid beat, a bass pulse
def swiss(t0, t1):
    for k in range(int((t1 - t0) / .3)): put(click(), t0 + k * .3, .5 if k % 2 == 0 else .25, .3)
    for k in range(int((t1 - t0) / .6)): put(sine('A1', .5, .15), t0 + k * .6, .6)
    put(fm('A5', 2.5, 2, 1, 1.2), t0 + .3, .2)
sec('title', swiss); sec('end', swiss)
sec('end', lambda t0, t1: [put(fm(m, 3, 3.5, 1.5, 1.5), t0 + 3.6 + i * .1, .25) for i, m in enumerate(['A4', 'C#5', 'E5', 'A5'])])
# watercolour: dawn harp arpeggios + a few high chimes
def water(t0, t1):
    for k, m in enumerate(['D4', 'A4', 'D5', 'F#5', 'A5', 'F#5', 'D5', 'A4'] * 2): put(pl('harp', m, 2.5, .45), t0 + .2 + k * .42, .7, -.2 + .05 * (k % 8))
    for t in [t0 + 1.2, t0 + 3.3, t0 + 5.6]: put(fm('A6', 1.5, 2.76, 1, .5), t, .08, .4)
sec('water', water)
# silent film: a picture-house piano (pluck model as a bright upright), oom-pah + melody
def silent(t0, t1):
    for k in range(int((t1 - t0) / .5)):
        b = ['C3', 'G3'][k % 2]; put(pl('acoustic_guitar', b, .6, .5), t0 + k * .5, .5, -.1)
        put(pl('harp', ['E4', 'G4', 'C5', 'G4'][k % 4], .5, .4), t0 + k * .5 + .25, .45, .1)
    for i, (t, m) in enumerate([(1.8, 'E5'), (2.3, 'G5'), (2.8, 'C6'), (3.6, 'B5'), (4.1, 'G5'), (4.6, 'E5'), (5.1, 'C5')]): put(pl('harp', m, 1.0, .7), t0 + t, .7, 0)
sec('silent', silent)
# glass: FM bells + sub drone
def glass(t0, t1):
    t = T(t1 - t0); put(np.sin(2 * np.pi * 55 * t) * np.minimum(1, t / .5) * np.minimum(1, (t1 - t0 - t) / .3) * .3, t0)
    for i, m in enumerate(['A5', 'E6', 'C6', 'A6', 'E6']): put(fm(m, 3), t0 + .3 + i * 1.2, .25, -.4 + .2 * i)
sec('glass', glass)
# riso: everyday rhythm — woodblock, bouncy plucks, a bicycle-bell-ish ting
def riso(t0, t1):
    for k in range(int((t1 - t0) / .25)): put(wood(1200 if k % 4 else 800), t0 + k * .25, .25 if k % 2 else .4, .2)
    for k, m in enumerate(['G4', 'B4', 'D5', 'B4', 'C5', 'E5', 'G5', 'E5'] * 3): put(pl('koto', m, .5, .5), t0 + k * .25, .45, -.2)
sec('riso', riso)
# cartoon: vibraphone chords + walking pizz bass
def cartoon(t0, t1):
    walk = ['F2', 'A2', 'C3', 'E3', 'D2', 'F2', 'A2', 'C3', 'G2', 'Bb2', 'D3', 'F3', 'C2', 'E2', 'G2', 'Bb2']
    for k in range(int((t1 - t0) / .5)): put(pl('upright_bass_pizz', walk[k % 16], .5, .7), t0 + k * .5, .8)
    for k in range(int((t1 - t0) / 2)): [put(vib(m), t0 + k * 2 + .75, .18, .2) for m in [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']][k % 2]]
sec('cartoon', cartoon)
# iso: marimba groove
def iso(t0, t1):
    pat = ['D4', 'F#4', 'A4', 'F#4', 'B4', 'A4', 'F#4', 'E4']
    for k in range(int((t1 - t0) / .25)): put(marimba(pat[k % 8]), t0 + k * .25, .35, -.2)
    for k in range(int((t1 - t0) / .5)): put(marimba('D3' if k % 4 < 2 else 'A2', 1.0), t0 + k * .5, .5)
sec('iso', iso)
# pixel: chip tune, pulse lead + triangle bass + echo
def pixel(t0, t1):
    lead = ['C5', 'E5', 'G5', 'C6', 'B5', 'G5', 'E5', 'G5'] * 2 + ['A5', 'F5', 'C5', 'F5', 'G5', 'E5', 'C5', 'E5'] * 2
    x = np.zeros(int((t1 - t0 + 1) * SR))
    for k in range(int((t1 - t0) / .1875)):
        s = int(k * .1875 * SR); y = sq(lead[k % len(lead)], .15) * .4; x[s:s + len(y)] += y[:len(x) - s]
        if k % 2 == 0: y = tri(['C3', 'C3', 'F3', 'G3'][(k // 8) % 4], .18) * .5; x[s:s + len(y)] += y[:len(x) - s]
    e = np.zeros_like(x); d = int(.28 * SR); e[d:] = x[:-d] * .35; put(lp(x + e, 7000), t0, .5)
    for i, m in enumerate(['C6', 'E6', 'G6', 'C7']): put(sq(m, .12) * .5, t0 + 5.6 + i * .09, .6)   # item fanfare
sec('pixel', pixel)
# paper-cut: tanpura drone + music box
def lantern(t0, t1):
    t = T(t1 - t0); f = hz('D3'); x = sum(np.sin(2 * np.pi * f * h * t) / h ** .8 for h in range(1, 9)) * np.minimum(1, t / 1.0) * np.minimum(1, (t1 - t0 - t) / .4)
    put(lp(x, 2000) * .12, t0)
    for i, m in enumerate(['A5', 'F#5', 'D5', 'E5', 'F#5']): put(pl('music_box', m, 2, .45), t0 + 1.2 + i * .9, .5, .2)
sec('lantern', lantern)
out = out[:int(DUR * SR)]; out = out / np.abs(out).max() * .8
sf.write(os.path.join(HERE, 'score.wav'), out.astype(np.float32), SR); print('score.wav', round(len(out) / SR, 1))
