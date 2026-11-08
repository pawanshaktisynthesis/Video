// One source of truth. 120 BPM: beat .5 s, bar 2 s. Sections, cue times, captions.
export const BPM = 120, BEAT = .5, DUR = 46.0;
export const S = [
  { kind: 'hook', t0: 0, t1: 10.25 },
  { kind: 'title', t0: 10.25, t1: 15.0 },
  { kind: 'step', i: 0, t0: 15.0, t1: 20.5, label: 'Open PawanSetu' },
  { kind: 'step', i: 1, t0: 20.5, t1: 26.0, label: 'Pick a shop near you' },
  { kind: 'step', i: 2, t0: 26.0, t1: 33.5, label: 'Add, then order' },
  { kind: 'payoff', t0: 33.5, t1: 38.0 },
  { kind: 'cta', t0: 38.0, t1: DUR },
];
export const TL = {
  ARROW: 1.0, WATCH: 6.0, CLOCK: 6.5, NOTIME: 7.0,
  KICK: 10.5, TITLE: 11.0, MINUTES: 12.0, SNAPS: [11.0, 11.5, 12.0, 12.5],
  STAMPS: [14.5, 20.0, 25.5],                       // medallion stamps one beat before each step
  TAP1: 17.0, SHOPS: 22.0, TAP2: 23.0, ITEMS: [27.5, 28.0, 28.5], SIL0: 31.0, ORDER: 31.5,
  TICKS: [34.5, 35.0, 35.5], DONE: 35.5,
  CTA_MARK: 38.5, CTA_NAME: 39.0, CTA_LINE: 39.75,
};
// caption hold ≥ max(1.8, speech + .6, chars/12 + 1)
export const SUBS = [
  { id: 'L1', t0: 0.4, t1: 5.4, text: 'Your favourite shop is just around the corner.' },
  { id: 'L2', t0: 5.6, t1: 10.1, text: "But today, there's no time to walk there." },
  { id: 'L3', t0: 10.5, t1: 15.0, text: "Here's how to shop it online, in minutes." },
  { id: 'L4', t0: 15.3, t1: 19.0, text: 'Step one. Open PawanSetu.' },
  { id: 'L5', t0: 20.8, t1: 24.5, text: 'Step two. Pick a shop near you.' },
  { id: 'L6', t0: 26.3, t1: 30.8, text: 'Step three. Add what you need, and order.' },
  { id: 'L7', t0: 33.8, t1: 37.3, text: "That's it. Done in minutes." },
  { id: 'L8', t0: 38.4, t1: 42.6, text: 'PawanSetu. Your local shops, online.' },
];
