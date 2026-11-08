// One beat grid for picture, score and mix. 100 BPM: beat .6 s, bar 2.4 s.
export const BPM = 100, BEAT = .6, BAR = 2.4, DUR = 31.2;
export const SHOTS = [[0, 4.8, 'dark'], [4.8, 9.6, 'macro'], [9.6, 14.4, 'spin'], [14.4, 20.4, 'explode'], [20.4, 26.4, 'lineup'], [26.4, DUR, 'end']];
export const T = {
  SWEEP1: [1.2, 2.7], SWEEP2: [3.0, 4.2], RACK: [6.0, 7.8], MACRO_SWEEPS: [6.6, 7.8, 9.0],
  SPIN0: 9.6, SPIN_TITLE: 11.4, RESET_TITLE: 12.6,
  APART: [14.4, 16.8], SIL: [18.6, 19.2], SNAP: 19.2, KICKER: [15.0, 18.4],
  LINE_SWEEPS: [21.0, 22.2, 23.4], COLORS: 21.0, FOCUS: 22.2,
  LOGO: 27.0, URL: 27.6, FADE: 30.6,
};
// one floor ring per beat while it spins (shot 3) and after the snap
T.RINGS = [];
for (let t = 10.8; t < 14.4 - 1e-6; t += BEAT) T.RINGS.push(+t.toFixed(3));
for (let t = T.SNAP; t < 20.4 - 1e-6; t += BEAT) T.RINGS.push(+t.toFixed(3));
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
