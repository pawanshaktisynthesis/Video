"""SPIN. RESET. — original minimal electronic score, 100 BPM, A minor/Dorian. All synthesised (numpy).
FM glass bells, filtered tick grid, warm pad, sub drone, soft kicks, 808 slides, risers. Times from timeline.js. Run with LIB set → music/score.wav"""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
sys.path.insert(0, os.environ['LIB'])
from core.audio.sfx import SR, add
X = json.loads(subprocess.check_output(['node', '-e', "import('./timeline.js').then(m=>console.log(JSON.stringify({T:m.T,DUR:m.DUR})))"], cwd=FILM)); T, DUR = X['T'], X['DUR']
N = int((DUR + 3) * SR); B, BAR = .6, 2.4; rng = np.random.default_rng(9)
st = {k: np.zeros((N, 2)) for k in ['bell', 'pad', 'bass', 'drums', 'fx']}
def put(s, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 2: add(st[s], np.asarray(x, float), t, g, pan)
Tt = lambda d: np.arange(int(d * SR)) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def bell(m, t, v=.4, d=3.0, pan=0.):   # FM glass bell: inharmonic ratio, bright attack
    f = hz(m); tt = Tt(d); I = 2.2 * np.exp(-tt / .35); x = np.sin(2 * np.pi * f * tt + I * np.sin(2 * np.pi * f * 3.5 * tt)) * np.exp(-tt / (d * .32)); put('bell', x * v, t, 1, pan)
def pad(ms, t, d, v=.12):
    tt = Tt(d); env = np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / 1.0); x = 0
    for m in ms:
        for det in (-.07, .07): f = hz(m + det); ph = 2 * np.pi * f * tt; x = x + (2 * ((ph / (2 * np.pi)) % 1) - 1)
    put('pad', lp(x, 1400) * env * v / len(ms), t, 1, 0)
def sub(m, t, d, v=.35): tt = Tt(d); put('bass', np.sin(2 * np.pi * hz(m) * tt) * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .6) * v, t)
def kick(t, v=.6): d = .35; tt = Tt(d); put('drums', np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-tt / .03)) / SR) * np.exp(-tt / .16)) * v, t)
def clap(t, v=.25): d = .18; x = bp(rng.standard_normal(int(d * SR)), 900, 3500) * np.exp(-Tt(d) / .04); put('drums', x * v, t, 1, .1)
def tick(t, v=.12, pan=.3): d = .03; x = hp(rng.standard_normal(int(d * SR)), 6000) * np.exp(-Tt(d) / .004); put('drums', x * v, t, 1, pan)
def b808(m0, m1, t, d=1.2, v=.55):   # sine with pitch slide + soft saturation
    tt = Tt(d); f = hz(m0) + (hz(m1) - hz(m0)) * np.clip(tt / .25, 0, 1); x = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt / .7); put('bass', x * v, t)
def riser(t0, t1, v=.25): d = t1 - t0; tt = Tt(d); x = bp(rng.standard_normal(len(tt)), 800, 8000) * (tt / d) ** 2; put('fx', x * v, t0, 1, 0)
A = 57  # A3
# 0–9.6: drone + pad, bells far apart (the dark studio)
sub(33, 0.3, 9.6); pad([A, A + 3, A + 7], 0.5, 9.0)
for t, m in [(1.2, A + 19), (3.0, A + 15), (4.8, A + 12), (6.6, A + 19), (7.8, A + 22), (9.0, A + 15)]: bell(m, t, .32, 3, (m % 5 - 2) * .2)
for k in range(int(4.8 / (B / 2)), int(9.6 / (B / 2))): tick(k * B / 2, .07 if k % 2 else .11)
# 9.6–14.4: the spin — kicks + tick grid; a glass ding per floor ring
riser(8.4, 9.6)
for k in range(8): kick(9.6 + k * B, .55 if k % 4 else .7)
for k in range(int(9.6 / (B / 4)), int(14.4 / (B / 4))): tick(k * B / 4, .05 + .05 * (k % 2 == 0))
for k in range(4): clap(9.6 + B + k * 2 * B)
pad([A, A + 3, A + 7, A + 10], 9.6, 4.8, .1); sub(33, 9.6, 4.8)
ring_notes = [A + 24, A + 22, A + 19, A + 15]
for i, r in enumerate([r for r in T['RINGS'] if r < 14.4]): bell(ring_notes[i % 4], r, .22, 1.6, (i % 3 - 1) * .3)
# 14.4–18.6: exploded view — 808 slides, half-time, pad opens
for i, (t, m0, m1) in enumerate([(14.4, 45, 33), (15.6, 33, 36), (16.8, 36, 31), (18.0, 31, 33)]): b808(m0, m1, t)
for k in range(int(14.4 / B), int(18.6 / B)): tick(k * B, .08)
kick(14.4, .6); kick(16.8, .5); clap(15.6); clap(18.0)
pad([A - 2, A + 2, A + 5, A + 9], 14.4, 4.2, .11)
riser(17.4, 18.6, .3)
# 18.6–19.2: total silence (only a reverse whoosh in the fx stem); 19.2: the snap — chord + kick + ring
d = .55; x = bp(rng.standard_normal(int(d * SR)), 1500, 9000) * (Tt(d) / d) ** 3; put('fx', x * .35, T['SNAP'] - d)
kick(T['SNAP'], .8); [bell(m, T['SNAP'], .32, 3.5) for m in [A + 12, A + 15, A + 19, A + 24]]
b808(33, 33, T['SNAP'], 1.6, .6)
for i, r in enumerate([r for r in T['RINGS'] if r > T['SNAP']]): bell(ring_notes[i % 4], r, .18, 1.4)
# 20.4–26.4: line-up — groove continues, one bell per colour sweep
for k in range(10): kick(20.4 + k * B, .5)
for k in range(int(20.4 / (B / 2)), int(26.4 / (B / 2))): tick(k * B / 2, .08 if k % 2 else .1)
for k in range(5): clap(21.0 + k * 2 * B)
for t, m in zip(T['LINE_SWEEPS'], [A + 15, A + 19, A + 22]): bell(m, t, .32, 2.4)
pad([A, A + 3, A + 7, A + 12], 20.4, 6.0, .1); sub(33, 20.4, 6.0)
# 26.4–31.2: end — the motif resolves, ring-out
for t, m in [(26.4, A + 12), (27.0, A + 15), (27.6, A + 19), (28.2, A + 24)]: bell(m, t, .3, 3.5)
pad([A, A + 4, A + 7, A + 11], 26.4, 4.8, .1); sub(33, 26.4, 4.6, .3); kick(26.4, .5)
mix = sum(st.values()); tt = np.arange(N) / SR
g = np.interp(tt, [0, T['SIL'][0] - .02, T['SIL'][0], T['SNAP'] - .01, T['SNAP'], DUR + 3], [1, 1, 0, 0, 1, 1])
mix = mix * np.maximum(g, 0)[:, None]; mix = mix + 0   # the reverse whoosh lives in fx; restore it inside the silence
s0, s1 = int(T['SIL'][0] * SR), int(T['SNAP'] * SR); mix[s0:s1] = st['fx'][s0:s1]
mix = mix[:int(DUR * SR)] * np.clip((DUR - tt[:int(DUR * SR)]) / 1.5, 0, 1)[:, None]
for c in range(2): mix[:, c] = np.tanh(mix[:, c] / np.abs(mix).max() * 1.4) * .85   # tame bass peaks so loudnorm stays linear
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR); print('score.wav', round(len(mix) / SR, 2), 's')
