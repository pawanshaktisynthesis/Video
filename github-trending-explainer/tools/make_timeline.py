"""Builds timeline.json from the measured voice lengths (voices/dur.json): one clock for picture, captions, score and mix."""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dur = json.load(open(os.path.join(D, 'voices', 'dur.json'))); lines = {l['id']: l['text'] for l in json.load(open(os.path.join(D, 'lines.json')))}
repos = json.load(open(os.path.join(D, 'repos.json')))
GAP, TRANS, GIANT = .35, .75, 2.6
vo, segs = [], []
t = .6
def say(i, at): vo.append({'id': i, 't': round(at, 3), 'd': dur[i], 'text': lines[i]}); return at + dur[i]
e = say('I1', t); board0 = t; e = say('I2', e + .3); t = e + .9
for r in repos:
    k = r['rank']; s = {'rank': k, 't0': round(t, 3)}
    if k == 7: s['giant'] = round(t, 3); t += GIANT
    s['card'] = round(t, 3); a = say(f'S{k}a', t + .35)
    s['term'] = round(a + GAP - .2, 3); b = say(f'S{k}b', a + GAP); s['b'] = [vo[-1]['t'], round(b, 3)]
    s['ben'] = round(b + GAP - .1, 3); c = say(f'S{k}c', b + GAP)
    s['t1'] = round(c + .6, 3); segs.append(s); t = c + .6 + TRANS
outro = round(t, 3); e = say('O1', t + .4); DUR = round(e + 2.6, 2)
for i, v in enumerate(vo):   # captions: until the next line starts (or speech + 1.0 at a segment end)
    nxt = vo[i + 1]['t'] if i + 1 < len(vo) else DUR
    v['t1'] = round(min(nxt - .08, v['t'] + v['d'] + 1.2), 3)
json.dump({'DUR': DUR, 'board0': board0, 'outro': outro, 'segs': segs, 'vo': vo, 'trans': TRANS}, open(os.path.join(D, 'timeline.json'), 'w'), indent=1)
print('DUR', DUR, 'segments', len(segs))
