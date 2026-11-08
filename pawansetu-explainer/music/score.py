"""PawanSetu explainer — original cool-jazz combo, 120 BPM, F major: vibraphone (modal synth), pizzicato bass (pluck model),
brushes, finger snaps, flute (synth), celesta colour (music-box model). Run with LIB set → music/score.wav. Times from timeline.js."""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
sys.path.insert(0, os.environ['LIB'])
from core.audio import pluck as P
from core.audio.sfx import SR, add
X = json.loads(subprocess.check_output(['node', '-e', "import('./timeline.js').then(m=>console.log(JSON.stringify({TL:m.TL,S:m.S,DUR:m.DUR})))"], cwd=FILM))
TL, SEC, DUR = X['TL'], X['S'], X['DUR']; N = int((DUR + 3) * SR); B = .5
rng = np.random.default_rng(5)
st = {k: np.zeros((N, 2)) for k in ['vib', 'bass', 'drums', 'flute', 'cel']}
def put(s, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 2: add(st[s], np.asarray(x, float), t, g, pan)
T = lambda d: np.arange(int(d * SR)) / SR
hz = lambda p: 440 * 2 ** ((P.midi(p) - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def vib(p, t, v=.5, d=2.0, pan=.2):   # vibraphone: bar modes 1 : 4 : 10, soft mallet, motor tremolo
    f = hz(p); tt = T(d); x = (np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * f * 3.99 * tt) * np.exp(-tt / .25) + .06 * np.sin(2 * np.pi * f * 9.9 * tt) * np.exp(-tt / .06)) * np.exp(-tt / 1.1)
    x *= 1 + .25 * np.sin(2 * np.pi * 5.5 * tt); x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR)); put('vib', x * v * .5, t, 1, pan)
def chord(ps, t, v=.45, d=1.6): [vib(p, t + i * .008, v, d, -.3 + .2 * i) for i, p in enumerate(ps)]
def bass(p, t, v=.7): put('bass', P.pluck('upright_bass_pizz', p, .55, vel=v), t)
def brush(t, v=.3, d=.22): x = bp(rng.standard_normal(int(d * SR)), 2500, 9000) * np.sin(np.pi * T(d) / d) ** 1.5; put('drums', x * v, t, 1, .3)
def tap(t, v=.4): d = .08; x = bp(rng.standard_normal(int(d * SR)), 1800, 7000) * np.exp(-T(d) / .015); put('drums', x * v, t, 1, -.2)
def kick(t, v=.4): d = .25; tt = T(d); put('drums', np.sin(2 * np.pi * (60 + 40 * np.exp(-tt / .03)) * tt) * np.exp(-tt / .08) * v, t)
def snap(t, v=.6): d = .06; x = bp(rng.standard_normal(int(d * SR)), 1500, 4500) * np.exp(-T(d) / .008); put('drums', x * v, t, 1, .45)
def flute(p, t, d, v=.35):
    f = hz(p); tt = T(d); vibr = 1 + .006 * np.sin(2 * np.pi * 5.2 * tt) * np.clip((tt - .15) / .2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vibr) / SR; x = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph) + lp(rng.standard_normal(len(tt)), 3000) * .05
    env = np.minimum(1, tt / .06) * np.minimum(1, (d - tt) / .08); put('flute', x * env * v, t, 1, -.15)
cel = lambda p, t, v=.35: put('cel', P.pluck('music_box', p, 1.5, vel=v), t, .7, .4)
CH = {'F': ['A3', 'C4', 'E4', 'G4'], 'Dm': ['F3', 'A3', 'C4', 'E4'], 'Gm': ['F3', 'Bb3', 'D4', 'A4'], 'C': ['E3', 'Bb3', 'D4', 'G4'], 'Bb': ['A3', 'D4', 'F4', 'C5'], 'Am': ['G3', 'C4', 'E4', 'A4'], 'G': ['F3', 'B3', 'D4', 'A4']}
ROOT = {'F': ['F2', 'A2', 'C3', 'E3'], 'Dm': ['D2', 'F2', 'A2', 'C3'], 'Gm': ['G2', 'Bb2', 'D3', 'F3'], 'C': ['C2', 'E2', 'G2', 'Bb2'], 'Bb': ['Bb1', 'D2', 'F2', 'A2'], 'Am': ['A1', 'C2', 'E2', 'G2'], 'G': ['G1', 'B1', 'D2', 'F2']}
PROG = ['F', 'Dm', 'Gm', 'C']
def groove(t0, t1, prog=PROG, sticks=False, comp=True):
    bar = 0; t = t0
    while t < t1 - 1e-6:
        c = prog[bar % len(prog)]
        for q in range(4):
            tq = t + q * B
            if tq >= t1: break
            bass(ROOT[c][q], tq, .7 if q == 0 else .55)
            brush(tq, .22 if q % 2 == 0 else .3); tap(tq + B * .66, .18 if not sticks else .3)
            if sticks: tap(tq, .3)
        if comp: chord(CH[c], t + B * 1.5, .32, 1.0); chord(CH[c], t + B * 3.5, .25, .6)
        t += 2.0; bar += 1
# hook: bass + brushes, sparse vibes; the clock gets a tremolo vib cluster
groove(0.0, 10.25, comp=True)
for t, p, d in [(1.0, 'C5', .5), (1.5, 'A4', .5), (2.0, 'F4', 1.0), (3.5, 'G4', .5), (4.0, 'A4', 1.5)]: flute(p, t, d)
chord(['G4', 'A4', 'Bb4', 'C5'], TL['CLOCK'], .4, 1.5)
# title: full combo, snaps, a flute line, vib gliss on "in minutes"
groove(10.25, 15.0, sticks=True)
for t in TL['SNAPS']: snap(t)
for t, p, d in [(10.75, 'F5', .5), (11.25, 'E5', .25), (11.5, 'D5', .5), (12.0, 'C5', .5), (12.5, 'A4', 1.5)]: flute(p, t, d)
for i, p in enumerate(['F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6']): vib(p, TL['MINUTES'] + i * .04, .3, 1.2)
# steps: each step its own vibraphone chord on its downbeat; half-time feel in step 2
STEPCH = [['A3', 'C4', 'E4', 'G4'], ['F3', 'Bb3', 'D4', 'A4'], ['E3', 'Bb3', 'D4', 'G4']]
for i, s in enumerate([x for x in SEC if x['kind'] == 'step']):
    t0, t1 = s['t0'], s['t1']
    if i == 2: t1 = TL['SIL0']
    groove(t0, t1, prog=[['F', 'Dm', 'Gm', 'C'], ['Bb', 'Gm', 'C', 'F'], ['Dm', 'G', 'C', 'C']][i], comp=False)
    chord(STEPCH[i], t0, .55, 2.0)
for t in TL['STAMPS']: kick(t, .5)
for t in [TL['TAP1'] + .1, TL['TAP2'] + .1]: [cel(p, t + j * .08) for j, p in enumerate(['C6', 'E6', 'G6'])]
for j, t in enumerate(TL['ITEMS']): cel(['A5', 'C6', 'E6'][j], t)
# the order lands after the silence: a vib glissando + chord
for i, p in enumerate(['F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6', 'F6']): vib(p, TL['ORDER'] + .02 + i * .035, .35, 1.5)
chord(['A3', 'C4', 'E4', 'G4', 'C5'], TL['ORDER'] + .3, .5, 2.0); groove(TL['ORDER'] + .5, SEC[5]['t0'], prog=['F'])
# payoff: the three step chords return, one per tick
groove(SEC[5]['t0'], SEC[6]['t0'], prog=['F', 'Bb'])
for i, t in enumerate(TL['TICKS']): chord(STEPCH[i], t, .45, 1.2)
for t, p, d in [(36.0, 'A4', .5), (36.5, 'C5', .5), (37.0, 'F5', 1.0)]: flute(p, t, d)
# CTA: up a step (G), then ring out
groove(SEC[6]['t0'], 44.5, prog=['G', 'Am', 'G', 'Am'])
for t, p, d in [(TL['CTA_NAME'], 'D5', .5), (TL['CTA_NAME'] + .5, 'B4', .5), (TL['CTA_NAME'] + 1.0, 'G4', 1.0), (TL['CTA_LINE'] + 1.25, 'A4', .5), (TL['CTA_LINE'] + 1.75, 'B4', .5), (TL['CTA_LINE'] + 2.25, 'D5', 1.5)]: flute(p, t, d)
chord(['B3', 'D4', 'F#4', 'A4', 'D5'], 44.5, .5, 3.0); bass('G1', 44.5, .7)
mix = sum(st.values()); tt = np.arange(N) / SR
gate = np.interp(tt, [0, TL['SIL0'] - .02, TL['SIL0'], TL['ORDER'] - .01, TL['ORDER'], DUR + 3], [1, 1, 0, 0, 1, 1])
mix = (mix * gate[:, None])[:int(DUR * SR)]; mix *= np.clip((DUR - tt[:len(mix)]) / 2.0, 0, 1)[:, None]
mix = mix / np.abs(mix).max() * .8
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR); print('score.wav', round(len(mix) / SR, 2), 's')
