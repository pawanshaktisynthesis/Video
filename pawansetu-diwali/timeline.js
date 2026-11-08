// One source of truth for picture, score and mix. 80 BPM: beat .75 s, bar 3 s.
export const BPM = 80, BEAT = .75, BAR = 3.0, DUR = 46.5;
export const TL = {
  MATCH: 1.0, FLAME: 1.2, LAMP: 6.0, WIPE0: 9.0, WIPE1: 9.75,
  BOX: [12.75, 16.5, 21.0], ARRIVE: 30.0, HANDOVER: 30.75, LID: 31.5,
  TILT0: 34.5, TILT1: 36.0, SIL0: 35.25, BURST: 36.0, HINDI: 36.0, HAPPY: 36.75, FROM: 38.25,
  RACK0: 40.5, RACK1: 43.5, END: DUR,
};
TL.DIYAS = [...Array(8)].map((_, i) => +(31.875 + i * .375).toFixed(3));
TL.BURSTS = [36.0, 37.5, 39.0, 40.5, 42.0, 43.875];
TL.STOPS = [[10.5, 13.5], [15.0, 18.0], [19.5, 22.5]];
// scooter x (story units) keyframes: [t, x]
TL.RIDE = [[9.75, 150], [10.5, 860], [13.5, 860], [15.0, 2060], [18.0, 2060], [19.5, 3260], [22.5, 3260], [30.0, 5300]];
// subtitle hold ≥ max(1.8, speech + .6) and the read-time rule; L9 is paper, not subtitled
export const SUBS = [
  { id: 'L1', t0: 1.6, t1: 5.9, text: 'Every Diwali begins with one small light.' },
  { id: 'L2', t0: 6.3, t1: 9.9, text: 'Then the whole street wakes up.' },
  { id: 'L3', t0: 10.4, t1: 14.5, text: 'Mithai from the halwai on the corner.' },
  { id: 'L4', t0: 15.0, t1: 18.6, text: "Diyas from the potter's lane." },
  { id: 'L5', t0: 19.4, t1: 23.3, text: 'And marigolds, fresh this morning.' },
  { id: 'L6', t0: 23.5, t1: 26.7, text: 'All from shops you know,' },
  { id: 'L7', t0: 26.8, t1: 30.7, text: 'brought to your door by PawanSetu.' },
  { id: 'L8', t0: 31.0, t1: 35.5, text: 'This Diwali, light up the shops around you.' },
];
export const VOICE = [...SUBS.map(s => ({ id: s.id, t: s.t0 })), { id: 'L9', t: 36.75 }];
