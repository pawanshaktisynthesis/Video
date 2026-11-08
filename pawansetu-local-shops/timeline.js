// Tempo grid + cue times: the one source of truth for picture, score, mix and checks.
export const BPM = 96, BEAT = 0.625, BAR = 2.5, DUR = 40.0;
const b = (bar, beat = 0) => +(bar * BAR + beat * BEAT).toFixed(4);
export const TL = {
  PHONE: 0.3, ORDER_OUT: b(1, 0.2),            // 2.625: the order leaves the window, line shoots north
  FAR0: b(1, 0.2), FAR1: b(2, 3),              // follow + log pull-out to the warehouse
  TRUCK: b(2, 1), WARE_LAB: b(1, 3), CUST_LAB: b(2, 2),
  BACK0: b(3), BACK1: b(3, 3),                  // 7.5 → 9.375: pan back to the neighbourhood
  SHOP_LAB: b(3, 1), SIL0: 8.8, SIL1: b(4),     // near-silence, then the chime on bar 4
  BRIDGE0: b(4), BRIDGE_N: 8, SHOP_ON: b(4, 3.5), // blocks on eighths 10.0 → 12.19; the shop takes the saffron at 12.19
  SHUTTER: b(4, 3.5),
  INSET0: b(5, 1), INSET1: b(6, 3),             // 13.125 → 16.875: phone inset
  PING: b(5, 2),
  PUSH0: b(6, 3), CUT: b(7), WALL: b(7, .5),    // 16.875 push; 17.5 cut line; 17.8 wall slides
  ITEMS: [b(7, 2), b(7, 3), b(8, 0), b(8, 1)],  // goods drop into the bag on quarters
  SEAL: b(8, 2), WALL_BACK: b(8, 3),
  RIDE0: b(8, 3.5), RIDE1: b(10, 1),            // 21.5625 → 25.625: rider to the door
  BELL: b(10, 1), HANDOVER: b(10, 1.5),
  ACC0: b(10, 2), ACC1: b(13),                  // 26.25 → 32.5: accumulation
  SHOPS_ON: [b(12, 0), b(12, 1), b(12, 2), b(12, 3)],
  PULL0: b(13), PULL1: b(14, 2),                // 32.5 → 36.25: scale reveal
  WORDS: [b(14, 0), b(14, .5)],                 // wordmark words
  LEGEND: b(14, 1), RESOLVE: b(15),
  END: DUR,
};
// orders in the accumulation: quarters (bar 10.5–11), eighths (bar 11–12), waves on quarters (bar 12–13)
TL.ORDERS = [];
for (let i = 2; i < 4; i++) TL.ORDERS.push(b(10, i));
for (let i = 0; i < 8; i++) TL.ORDERS.push(b(11, i / 2));
for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) TL.ORDERS.push(+(b(12, i) + j * .04).toFixed(4));
TL.BLOCKS = [...Array(TL.BRIDGE_N)].map((_, i) => +(TL.BRIDGE0 + i * BEAT / 2).toFixed(4));
TL.LABELS = [b(13, 1), b(13, 2), b(13, 3), b(14, 0) - .0001];   // one marimba note per station label in the pull-out
// subtitle hold = max(1.8 s, speech + 0.6 s); t0 = voice start
export const SUBS = [
  { id: 'L1', t0: 0.45, t1: 4.12, text: 'Your customers live just two streets away.' },
  { id: 'L2', t0: 4.45, t1: 8.5, text: 'But their orders go to a warehouse 30 km away.' },
  { id: 'L3', t0: 10.2, t1: 13.4, text: 'PawanSetu builds the bridge back.' },
  { id: 'L4', t0: 13.55, t1: 16.75, text: 'A neighbour orders on her phone.' },
  { id: 'L5', t0: 17.2, t1: 20.7, text: 'Your shop packs it, right off your shelf.' },
  { id: 'L6', t0: 21.7, t1: 25.2, text: 'A local rider brings it home in minutes.' },
  { id: 'L7', t0: 26.3, t1: 30.0, text: 'Then the next order. And the next.' },
  { id: 'L8', t0: 30.2, t1: 33.55, text: 'Every shop on the street, online.' },
  { id: 'L9', t0: 34.1, t1: 38.6, text: 'PawanSetu. Your shop, your neighbourhood.' },
];
