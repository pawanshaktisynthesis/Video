// PawanSetu — "Two Streets Away". Isometric Infographic, 1080×1920, 40 s.
// One world: a neighbourhood board, a far warehouse up-frame, a saffron bridge home → shop.
import { Iso, PAL, tri, clamp, lerp, seg, ss, eo, eio, back, hash, mix, hex, TAU, C30, S30, pin, inset, ring, cutLine, hatch, haloText, ICON, iconGrid, person, FONT } from './engine.js';
import { TL, SUBS, DUR as D } from './timeline.js';
export const DUR = D;
export const W = 1080, H = 1920;

// ---------- palette (one meaning per hue) ----------
const SAF = '#F08A24', SAFT = tri(SAF), TEAL = tri('#5FA8A0'), TERRA = tri('#C9634A'), STEEL = tri('#8A93A6'), LEAF = tri('#8DB360');
const GREYSHOP = tri('#BDB6AA'), CREAMW = tri('#F4EBDA', .15, .2), WOOD = tri('#A9784E'), INDIGO = '#4C5BD4';
const INK = '#2A2233', BG = '#F3EDE2', ROADC = '#C4BCB0', PAVE = '#E6DDC8';
const lg = Math.log, ex = Math.exp, mixK = (a, b, f) => ex(lerp(lg(a), lg(b), f));
const P3 = (x, y, z) => ({ x, y, z }), mixP = (a, b, f) => P3(lerp(a.x, b.x, f), lerp(a.y, b.y, f), lerp(a.z, b.z, f));

function polyPath(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, L, len: L[L.length - 1], at(u) { const d = this.len * clamp(u); let i = 1; while (i < this.pts.length - 1 && this.L[i] < d) i++; const a = this.pts[i - 1], b = this.pts[i], f = (d - this.L[i - 1]) / (this.L[i] - this.L[i - 1] || 1); return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), rot: Math.atan2(b[1] - a[1], b[0] - a[0]) }; },
    upto(u) { const d = this.len * clamp(u), out = [this.pts[0]]; for (let i = 1; i < this.pts.length; i++) { if (this.L[i] <= d) out.push(this.pts[i]); else { const p = this.at(u); out.push([p.x, p.y]); break; } } return out; } };
}

// ---------- the world ----------
const BOARD = 24;
const HOME = { x: -13, y: 8, w: 7, d: 5, h: 4 };                          // the customer's home; front (+x face) on the cross street
const WIN = P3(-6, 9.6, 2.5);                                            // her window (on the +x face)
const DOOR = P3(-6, 11.6, 0);
const SHOPS = [                                                          // x, y, w, d, h, sign; front = +y face on the main street (row A) or -y (row B)
  { id: 'hero', x: 3, y: -10, w: 7, d: 7, h: 4.6, sign: 'SHARMA STORE', front: 1 },
  { id: 's1', x: -11, y: -10, w: 6.5, d: 7, h: 4.2, sign: 'MEDICALS', front: 1 },
  { id: 's2', x: 13, y: -9.5, w: 6.5, d: 6.5, h: 4, sign: 'BAKERY', front: 1 },
  { id: 's3', x: -21, y: -9.5, w: 6, d: 6.5, h: 4.4, sign: 'TAILOR', front: 1 },
  { id: 's4', x: 4, y: 3, w: 6, d: 5, h: 3.8, sign: '', front: -1 },
  { id: 's5', x: 13, y: 3, w: 6, d: 5, h: 3.6, sign: '', front: -1 },
];
const HERO = SHOPS[0], SHOPC = P3(HERO.x + HERO.w / 2, HERO.y + HERO.d / 2, 2.0);
const HOMES = [[-21, 4, 5, 5, 3.4], [-21, 13, 5, 6, 3.8], [-12, 16, 6, 5, 3.4], [4, 13, 5, 5, 3.6], [13, 12, 5, 5, 4], [13, 19, 6, 4, 3.2],
  [-20, -21, 6, 6, 3.6], [-10, -21, 6, 6, 4.2], [4, -21, 6, 6, 3.4], [14, -21, 6, 6, 3.8], [-21, 20, 4, 3, 3]];
const TREES = [[-3.5, -12], [11.5, -14], [-15, -14], [-3.5, 14], [11, 21], [-16, 23], [21.5, 8], [-23, -3], [22, -14], [-6.5, 21.5], [10.5, 9.5]];
const ROUTE = polyPath([[6.5, -2.6], [6.5, 0], [0, 0], [0, 11.6], [-5.2, 11.6]]);          // rider: shop door → main street → cross street → her door
// the far warehouse, up-frame (−x −y), 30 km "away" (not to scale)
const WH = { x: -186, y: -178, w: 46, d: 34, h: 18 };
const FARLINE = [[-6, 9.6, 2.5], [-1, 9.6, .3], [-1, -BOARD - 1, .3], [-60, -70, .3], [WH.x + WH.w, WH.y + WH.d * .55, .3]];
const MID = P3(-82, -78, 2);

// shop "online" state 0..1
function shopOn(i, t) {
  if (i === 0) return ss(seg(t, TL.SHOP_ON, TL.SHOP_ON + .45));
  const tt = [TL.SHOPS_ON[0], TL.SHOPS_ON[1], TL.SHOPS_ON[2], TL.SHOPS_ON[3], TL.SHOPS_ON[3] + .3125][i - 1];
  return ss(seg(t, tt, tt + .3));
}

// ---------- camera: world centre + log zoom ----------
const C1 = P3(-1.5, 2.2, 1.5), C1b = P3(-1.5, 1, 3), C2 = P3(0, 1.5, 0), C3 = P3(0, 0, 7.5);
function riderAt(t) { return ROUTE.at(eio(seg(t, TL.RIDE0, TL.RIDE1 - .1))); }
export function camAt(t) {
  const K = (p, k) => ({ ...p, k });
  if (t < TL.FAR0) return K(WIN, mixK(60, 68, ss(seg(t, 0, TL.FAR0))));
  if (t < TL.FAR1) { const f = eio(seg(t, TL.FAR0, TL.FAR1)); return K(mixP(WIN, MID, ss(f)), mixK(68, 6.2, f)); }
  if (t < TL.BACK0) return K(MID, mixK(6.2, 6.0, seg(t, TL.FAR1, TL.BACK0)));
  if (t < TL.BACK1) { const f = eio(seg(t, TL.BACK0, TL.BACK1)); return K(mixP(MID, C1, ss(f)), mixK(6.0, 19, f)); }
  if (t < TL.BRIDGE0) return K(C1, 19);
  if (t < 12.5) { const f = ss(seg(t, TL.BRIDGE0, 12.5)); return K(mixP(C1, C1b, f), mixK(19, 22, f)); }
  if (t < TL.PUSH0) return K(C1b, mixK(22, 22.6, seg(t, 12.5, TL.PUSH0)));
  if (t < TL.WALL_BACK) { const f = eio(seg(t, TL.PUSH0, TL.CUT + .1)); return K(mixP(C1b, SHOPC, f), mixK(22.6, lerp(56, 58, seg(t, TL.CUT, TL.WALL_BACK)), f)); }
  if (t < TL.ACC0) {
    const r = riderAt(t), f = eio(seg(t, TL.WALL_BACK, TL.RIDE0 + .5)), c = mixP(SHOPC, P3(r.x, r.y, 1.2), f);
    return K(c, mixK(58, 36, f));
  }
  if (t < TL.PULL0) { const f = eio(seg(t, TL.ACC0, TL.ACC0 + 1.0)); return K(mixP(P3(DOOR.x + .8, DOOR.y, 1.2), C2, f), mixK(36, lerp(16.5, 17.3, seg(t, TL.ACC0 + 1, TL.PULL0)), f)); }
  { const f = eio(seg(t, TL.PULL0, TL.PULL1)); return K(mixP(C2, C3, f), mixK(17.3, lerp(12.2, 11.9, seg(t, TL.PULL1, D)), f)); }
}

// ---------- background ----------
function background(g, iso) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const k = iso.cam.k; if (k > 70) return;
  const step = k < 9 ? 12 : k < 25 ? 4 : 2; g.fillStyle = 'rgba(150,125,95,.17)';
  const cs = [iso.unP(0, 0, -3), iso.unP(W, H, -3), iso.unP(W, 0, -3), iso.unP(0, H, -3)];
  const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
  const x0 = Math.floor(Math.min(...xs) / step) * step, x1 = Math.max(...xs), y0 = Math.floor(Math.min(...ys) / step) * step, y1 = Math.max(...ys);
  if ((x1 - x0) / step * (y1 - y0) / step > 60000) return;
  for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) { const [sx, sy] = iso.P(x, y, -3); if (sx < -3 || sx > W + 3 || sy < -3 || sy > H + 3) continue; g.fillRect(sx - 1.3, sy - 1.3, 2.6, 2.6); }
}

// ---------- board, roads, homes, trees ----------
function board(iso) {
  const B = BOARD;
  iso.box(-B, -B, -3.2, 2 * B, 2 * B, 1.4, tri('#8A5B3A'), { cull: false, bias: -900, layer: -1 });
  iso.box(-B, -B, -1.8, 2 * B, 2 * B, 1.2, tri('#A77850'), { cull: false, bias: -899, layer: -1 });
  iso.box(-B, -B, -.6, 2 * B, 2 * B, .6, [PAVE, '#D6CBB2', '#BBAE93'], { cull: false, bias: -898, layer: -1 });
  // streets: main (along x, y∈[-2,2]) and cross (along y, x∈[-2,2])
  iso.flat([[-B, -2], [B, -2], [B, 2], [-B, 2]], .01, ROADC, { layer: 0 });
  iso.flat([[-2, -B], [2, -B], [2, B], [-2, B]], .012, ROADC, { layer: 0 });
  // centre dashes
  for (let x = -B + 1; x < B; x += 3) if (Math.abs(x) > 2.5) iso.flat([[x, -.12], [x + 1.4, -.12], [x + 1.4, .12], [x, .12]], .02, '#F4EDDD', { layer: 0 });
  for (let y = -B + 1; y < B; y += 3) if (Math.abs(y) > 2.5) iso.flat([[-.12, y], [.12, y], [.12, y + 1.4], [-.12, y + 1.4]], .022, '#F4EDDD', { layer: 0 });
  // little green patches
  for (const [x, y, w, d] of [[-23, -1, 0, 0], [-4.5, -16, 3, 5], [17, 9.5, 5, 2], [-17.5, 10, 2.5, 2.5], [6, 9.5, 5, 2.5]]) if (w) iso.flat([[x, y], [x + w, y], [x + w, y + d], [x, y + d]], .02, '#B9CC8E', { layer: 0 });
}
function homeBox(iso, x, y, w, d, h, o = {}) {
  iso.box(x, y, 0, w, d, h, o.col || TEAL, { decal: I => {
    // windows on the visible faces (+x and +y)
    const wy = n => { for (let i = 0; i < n; i++) { const a = x + (i + .5) * w / n - .45; I.poly([I.L(a, y + d, 1.6), I.L(a + .9, y + d, 1.6), I.L(a + .9, y + d, 2.6), I.L(a, y + d, 2.6)], '#F6E7C4'); } };
    const wx = n => { for (let i = 0; i < n; i++) { const a = y + (i + .5) * d / n - .45; if (o.skipWin && Math.abs(a + .45 - WIN.y) < .8) continue; I.poly([I.L(x + w, a, 1.6), I.L(x + w, a + .9, 1.6), I.L(x + w, a + .9, 2.6), I.L(x + w, a, 2.6)], '#E9D9B5'); } };
    wy(Math.max(1, Math.round(w / 2.6))); wx(Math.max(1, Math.round(d / 2.6)));
    if (o.decal) o.decal(I);
  } });
  iso.roof(x, y, h, w, d, 1.7, o.roof || TERRA, { ridge: w > d ? 'x' : 'y', over: .25 });
}
function tree(iso, x, y, s = 1) { iso.cyl(x, y, 0, .22 * s, 1.3 * s, WOOD, { n: 8 }); iso.sphere(x, y, 2.1 * s, 1.15 * s, LEAF, { bias: .5 }); }

// her home: the lit window with a phone
function heroHome(iso, t) {
  const on = seg(t, TL.PHONE, TL.PHONE + .25);
  homeBox(iso, HOME.x, HOME.y, HOME.w, HOME.d, HOME.h, { skipWin: true, decal: I => {
    const y0 = WIN.y - .8, y1 = WIN.y + .8, z0 = 1.5, z1 = 3.2, X = HOME.x + HOME.w;
    I.poly([I.L(X, y0, z0), I.L(X, y1, z0), I.L(X, y1, z1), I.L(X, y0, z1)], hex(mix('#3B3645', '#FFE9B8', .25 + .5 * on)));
    // the neighbour, as a silhouette in the window, phone glowing in her hand
    const P = (yy, zz) => I.L(X + .01, yy, zz);
    I.poly([P(WIN.y - .45, z0), P(WIN.y - .5, 2.35), P(WIN.y + .2, 2.35), P(WIN.y + .25, z0)], '#5A4C66');
    const hd = P(WIN.y - .12, 2.68), R = .27 * I.cam.k; const g = I.g; g.beginPath(); g.arc(hd[0], hd[1], R, 0, TAU); g.fillStyle = I.col('#5A4C66'); g.fill();
    g.beginPath(); g.arc(hd[0] - R * .1, hd[1] - R * .25, R * 1.02, Math.PI * 1.05, TAU * .98); g.fillStyle = I.col('#2E2638'); g.fill();
    I.poly([P(WIN.y + .25, 2.0), P(WIN.y + .55, 2.0), P(WIN.y + .55, 2.5), P(WIN.y + .25, 2.5)], hex(mix('#28304F', '#9FB0FF', on)));
    if (on > 0) { const c = P(WIN.y + .4, 2.25); const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], I.cam.k * 1.2); gr.addColorStop(0, `rgba(160,176,255,${.45 * on})`); gr.addColorStop(1, 'rgba(160,176,255,0)'); g.fillStyle = gr; g.fillRect(c[0] - I.cam.k * 1.3, c[1] - I.cam.k * 1.3, I.cam.k * 2.6, I.cam.k * 2.6); }
    // frame + door
    const fr = [I.L(X, y0, z0), I.L(X, y1, z0), I.L(X, y1, z1), I.L(X, y0, z1)]; g.save(); g.beginPath(); fr.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.strokeStyle = I.col('#3F7A73'); g.lineWidth = Math.max(1, .12 * I.cam.k); g.stroke(); g.restore();
    I.poly([I.L(X, DOOR.y - .6, 0), I.L(X, DOOR.y + .6, 0), I.L(X, DOOR.y + .6, 2.3), I.L(X, DOOR.y - .6, 2.3)], '#6B4A3A');
  } });
}

// ---------- shops ----------
function shopCols(i, t) { const on = shopOn(i, t); return { on, wall: on > 0 ? [hex(mix(GREYSHOP[0], CREAMW[0], on)), hex(mix(GREYSHOP[1], CREAMW[1], on)), hex(mix(GREYSHOP[2], CREAMW[2], on))] : GREYSHOP, roof: [hex(mix('#CFC9BE', SAFT[0], on)), hex(mix('#B4AEA3', SAFT[1], on)), hex(mix('#9A948A', SAFT[2], on))] }; }
function shopFront(I, s, on, t) {   // door, shutter, awning, sign on the +y face
  const Y = s.y + s.d, x0 = s.x + .8, x1 = s.x + s.w - .8, zt = 3.0;
  I.poly([I.L(x0, Y, 0), I.L(x1, Y, 0), I.L(x1, Y, zt), I.L(x0, Y, zt)], hex(mix('#4E4957', '#F7D8A0', on)));
  if (on > .2) { // goods visible through the open front
    for (let j = 0; j < 6; j++) { const a = x0 + .3 + j * (x1 - x0 - .6) / 6; const c = ['#D9534F', '#4C9F70', '#E9BE5C', '#5A7FC2', '#C9634A', '#7FA650'][j]; I.poly([I.L(a, Y + .01, 1.3), I.L(a + .55, Y + .01, 1.3), I.L(a + .55, Y + .01, 2.1), I.L(a, Y + .01, 2.1)], c, on); }
  }
  // roller shutter: half down when closed, rolls up as the shop comes online
  const sh = lerp(.55, 0, ss(seg(on, 0, 1))) * zt;
  if (sh > .02) { I.poly([I.L(x0, Y + .02, zt - sh), I.L(x1, Y + .02, zt - sh), I.L(x1, Y + .02, zt), I.L(x0, Y + .02, zt)], '#9C978E'); const g = I.g; g.save(); g.strokeStyle = I.col('#7D786F'); g.lineWidth = 1.2; for (let z = zt - .25; z > zt - sh; z -= .25) { const a = I.L(x0, Y + .02, z), b = I.L(x1, Y + .02, z); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } g.restore(); }
  // awning slides out with the colour
  if (on > 0) { const out = 1.25 * eo(on), z0 = zt + .65, z1 = zt + .15; const n = 6;
    for (let j = 0; j < n; j++) { const a = lerp(x0 - .3, x1 + .3, j / n), b = lerp(x0 - .3, x1 + .3, (j + 1) / n); I.poly([I.L(a, Y, z0), I.L(b, Y, z0), I.L(b, Y + out, z1), I.L(a, Y + out, z1)], j % 2 ? '#FBF4E6' : SAFT[1]); } }
  if (s.sign) { const z = s.h - .45; I.poly([I.L(s.x + .5, Y + .02, z - .55), I.L(s.x + s.w - .5, Y + .02, z - .55), I.L(s.x + s.w - .5, Y + .02, z + .3), I.L(s.x + .5, Y + .02, z + .3)], on > .5 ? INK : '#77716A');
    I.text3Now(s.sign, s.x + .75, Y + .03, z - .4, { plane: 'xz', size: .62, weight: 600, track: 6, tri: ['#FBF4E6', '#FBF4E6', '#FBF4E6'], face: on > .5 ? '#FFD7A1' : '#E9E1D2' }); }
}
function shopBox(iso, i, t) {
  const s = SHOPS[i], c = shopCols(i, t);
  iso.box(s.x, s.y, 0, s.w, s.d, s.h, c.wall, { decal: I => { if (s.front > 0) shopFront(I, s, c.on, t); } });
  iso.box(s.x - .2, s.y - .2, s.h, s.w + .4, s.d + .4, .55, c.roof, { bias: .2 });
}
// hero shop with the cutaway: walls + roof as separate skins; the near skin (front wall + roof) slides away
function cutOpen(t) { return t < TL.WALL ? 0 : t < TL.WALL_BACK ? ss(seg(t, TL.WALL, TL.WALL + .35)) : 1 - ss(seg(t, TL.WALL_BACK, TL.WALL_BACK + .35)); }
function heroShop(iso, t) {
  const op = cutOpen(t); if (op <= 0) return shopBox(iso, 0, t);
  const s = HERO, c = shopCols(0, t), wt = .3, X = s.x + s.w, Y = s.y + s.d;
  // floor + back walls (-x, -y), right wall (+x)
  iso.flat([[s.x, s.y], [X, s.y], [X, Y], [s.x, Y]], .03, '#E1CFAE', { layer: 0 });
  iso.box(s.x, s.y, 0, s.w, wt, s.h, c.wall, { bias: -40 });
  iso.box(s.x, s.y, 0, wt, s.d, s.h, c.wall, { bias: -40 });
  iso.box(X - wt, s.y, 0, wt, s.d, s.h, c.wall, { bias: -2 });
  iso.add(SHOPC.x + SHOPC.y + 1, () => iso.sub(() => interior(iso, t)), 1);
  // the skins
  const a = 1 - seg(op, .1, .75);
  if (a > 0) { iso.alpha = a; iso.box(s.x, Y - wt + op * 3.2, 0, s.w, wt, s.h, c.wall, { bias: 60, decal: I => shopFront(I, { ...s, d: s.d + op * 3.2 }, c.on, t) }); iso.box(s.x - .2, s.y - .2, s.h + op * 4, s.w + .4, s.d + .4, .55, c.roof, { bias: 80 }); iso.alpha = 1; }
  // hatched section rims on the cut tops of the remaining walls
  const hr = seg(op, .6, 1);
  if (hr > 0) iso.add(5e4, () => { const g = iso.g; g.save(); g.globalAlpha = hr;
    for (const q of [[[s.x, s.y], [X, s.y], [X, s.y + wt], [s.x + wt, s.y + wt], [s.x + wt, Y], [s.x, Y]], [[X - wt, s.y + wt], [X, s.y + wt], [X, Y], [X - wt, Y]]]) hatch(g, q.map(p => iso.P(p[0], p[1], s.h)), { sp: 6 });
    g.restore(); }, 1);
}
// inside the shop: shelves of goods, the shopkeeper, a counter, the bag being packed
const ITEMC = ['#D9534F', '#E9BE5C', '#4C9F70', '#5A7FC2'];
const SHELF = [[4.2, -9.2], [5.6, -9.2], [7.4, -9.2], [8.8, -9.2]];
const BAG = P3(7.2, -4.4, 1.45);
function interior(iso, t) {
  const s = HERO;
  // shelf unit along the back wall
  for (let lvl = 0; lvl < 3; lvl++) {
    const z = .2 + lvl * 1.15; iso.box(s.x + .5, s.y + .35, z, s.w - 1, 1.1, .14, WOOD, { bias: -30 });
    for (let j = 0; j < 9; j++) { const gx = s.x + .7 + j * .62, c = ['#D9534F', '#E9BE5C', '#4C9F70', '#5A7FC2', '#C9634A', '#7FA650', '#E39A3B', '#8E6CB8', '#3E9FB0'][(j + lvl * 4) % 9];
      const gone = lvl === 1 && [1, 3, 6, 8].includes(j) && t > TL.ITEMS[[1, 3, 6, 8].indexOf(j)] - .45; if (!gone) iso.box(gx, s.y + .5, z + .14, .48, .7, .55 + .15 * hash(j + lvl), tri(c), { bias: -29 }); }
  }
  // counter + shopkeeper
  iso.box(s.x + 1.6, -5.4, 0, 4.4, 1.0, 1.4, WOOD, { bias: 5 });
  iso.bill(5.0, -6.6, 0, (g, I, k) => person(g, { h: 2.7, body: hex(mix('#8A93A6', SAF, shopOn(0, t))), skin: '#B9825A', hair: '#2B2230', apron: '#FBF4E6', arm: lerp(.2, -1.0, packArm(t)), face: 1 }), { bias: 2 });
  // the bag on the counter + items flying in
  const sealed = ss(seg(t, TL.SEAL, TL.SEAL + .25));
  iso.box(BAG.x - .5, BAG.y - .35, BAG.z, 1.0, .7, 1.05 + .1 * sealed, SAFT, { bias: 9, decal: I => { const p = I.L(BAG.x - .5, BAG.y + .35, BAG.z + .55); haloText(I.g, 'PS', p[0] + .18 * I.cam.k, p[1] + .1 * I.cam.k, { font: `700 ${Math.round(.42 * I.cam.k)}px ${FONT}`, color: '#FBF4E6', halo: false }); } });
  if (sealed > 0) iso.box(BAG.x - .5, BAG.y - .35, BAG.z + 1.05 + .1 * sealed, 1.0, .7, .16 * sealed, tri('#D2741A'), { bias: 10 });
  TL.ITEMS.forEach((ti, i) => {
    const f = seg(t, ti - .45, ti); if (f <= 0 || f >= 1) return;
    const a = SHELF[i], u = eio(f), x = lerp(a[0] + .25, BAG.x, u), y = lerp(a[1] + .35, BAG.y, u), z = lerp(1.6, BAG.z + 1.0, u) + Math.sin(Math.PI * u) * 1.6;
    iso.box(x - .22, y - .3, z, .44, .6, .55, tri(ITEMC[i]), { bias: 30 });
  });
}
function packArm(t) { let a = 0; for (const ti of TL.ITEMS) a = Math.max(a, Math.sin(Math.PI * seg(t, ti - .5, ti + .05))); return a; }

// ---------- the warehouse, far up-frame ----------
function warehouse(iso, t) {
  const w = WH;
  iso.box(w.x - 10, w.y - 10, -2.4, w.w + 20, w.d + 20, 2.4, [ '#D4D0C8', '#BDB8AE', '#A39E94'], { cull: false });
  iso.box(w.x, w.y, 0, w.w, w.d, w.h, STEEL, { decal: I => {
    const g = I.g; g.save(); g.strokeStyle = I.col('#6E7689'); g.lineWidth = 1.2;
    for (let x = w.x + 2; x < w.x + w.w; x += 2) { const a = I.L(x, w.y + w.d, 0), b = I.L(x, w.y + w.d, w.h); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    g.restore();
    for (let i = 0; i < 4; i++) { const y0 = w.y + 3 + i * 7.5; I.poly([I.L(w.x + w.w, y0, 0), I.L(w.x + w.w, y0 + 5, 0), I.L(w.x + w.w, y0 + 5, 6), I.L(w.x + w.w, y0, 6)], '#5D6475'); }
  } });
  for (let i = 0; i < 3; i++) { const y0 = w.y + 3.2 + i * 7.5; iso.box(w.x + w.w + 1, y0, 0, 9, 4.2, 4.4, tri('#A8AFBD')); }
  // a van leaving for the neighbourhood (the long way)
  const f = seg(t, TL.TRUCK, TL.TRUCK + 6), p = farAt(.92 - .14 * f);
  iso.push(p.x, p.y, 0, p.rot + Math.PI); iso.box(-2.6, -1.2, .4, 5.2, 2.4, 2.6, tri('#9AA2B3')); iso.box(2.6, -1.2, .4, 1.6, 2.4, 1.8, tri('#7C8597'));
  for (const wx of [-1.6, 2.8]) iso.cyl(wx, -1.3, .55, .55, 2.6, tri('#3A3442'), { axis: 'y', n: 10 }); iso.pop();
}
const FAR = polyPath(FARLINE.map(p => [p[0], p[1]]));
function farAt(u) { return FAR.at(u); }
function farLine(iso, t) {
  const u = eo(seg(t, TL.ORDER_OUT, TL.FAR1 - .3)); if (u <= 0) return;
  const fade = (1 - .55 * ss(seg(t, TL.BRIDGE0, TL.BRIDGE0 + 1.5))) * (1 - seg(t, TL.PUSH0, TL.PUSH0 + .6)); if (fade <= 0) return;
  const pts = FAR.upto(u).map((p, i) => [p[0], p[1], i === 0 ? 2.5 : .3]);
  iso.line3(pts, '#6F7A90', Math.max(3, iso.cam.k * .18), { dash: [14, 10], off: -t * 40, a: fade, depth: 1e5, layer: 1 });
  // arrow head + the order parcel riding the head
  const hd = FAR.at(u), s = iso.P(hd.x, hd.y, .3);
  if (u < 1 && t < TL.FAR1) iso.add(1.1e5, () => { const g = iso.g; g.save(); g.fillStyle = iso.col('#6F7A90'); g.beginPath(); g.arc(s[0], s[1], 9, 0, TAU); g.fill(); g.restore(); }, 1);
}

// ---------- the bridge (the native move: Setu) ----------
const BR0 = P3(-9.5, 10.5, HOME.h + 1.2), BR1 = P3(6.5, -6.5, HERO.h + .55);
function bridgeAt(u) { return P3(lerp(BR0.x, BR1.x, u), lerp(BR0.y, BR1.y, u), lerp(BR0.z, BR1.z, u) + Math.sin(Math.PI * u) * 6.2); }
function bridge(iso, t) {
  const n = TL.BRIDGE_N, rot = Math.atan2(BR1.y - BR0.y, BR1.x - BR0.x), L = Math.hypot(BR1.x - BR0.x, BR1.y - BR0.y) / n;
  // the line leads: drawn just ahead of each block
  const lead = clamp((t - TL.BRIDGE0 + .25) / (TL.BLOCKS[n - 1] - TL.BRIDGE0 + .25));
  if (lead > 0 && t < TL.BLOCKS[n - 1] + .4) { const pts = []; for (let i = 0; i <= 24; i++) { const p = bridgeAt(lead * i / 24); pts.push([p.x, p.y, p.z + .5]); } iso.line3(pts, SAFT[2], 3, { dash: [8, 6], depth: 2e5 }); }
  for (let i = 0; i < n; i++) {
    const tl = TL.BLOCKS[i]; if (t < tl - .22) continue;
    const f = seg(t, tl - .22, tl), drop = (1 - f) * (1 - f) * 4, sq = t >= tl ? Math.sin(Math.PI * clamp((t - tl) / .16)) * .18 * (1 - clamp((t - tl) / .16)) : 0;
    const p = bridgeAt((i + .5) / n), z = p.z + drop;
    iso.keep = true;
    iso.push(p.x, p.y, z, rot); iso.box(-L * .56, -.9, -.45 * (1 - sq), L * 1.12, 1.8, .8 * (1 - sq), SAFT, { bias: 40 }); iso.pop();
    iso.keep = false;
  }
  // two piers where the bridge meets the roofs
  if (t > TL.BLOCKS[0]) { iso.keep = true; iso.box(BR0.x - .5, BR0.y - .5, HOME.h + .6, 1, 1, .9, SAFT); iso.keep = false; }
  if (t > TL.BLOCKS[n - 1]) { iso.keep = true; iso.box(BR1.x - .5, BR1.y - .5, HERO.h + .5, 1, 1, .4, SAFT); iso.keep = false; }
}

// ---------- the rider ----------
function rider(iso, t, pose) {
  const p = pose || riderAt(t), moving = t > TL.RIDE0 && t < TL.RIDE1, bob = moving ? Math.sin(t * 22) * .03 : 0;
  iso.push(p.x, p.y, bob, p.rot);
  iso.box(-.9, -.32, .38, 1.8, .64, .42, tri('#3D3550'));
  iso.box(-1.05, -.5, .8, .95, 1.0, .85, SAFT);
  for (const wx of [-.7, .75]) iso.cyl(wx, -.14, .32, .32, .28, tri('#2C2633'), { axis: 'y', n: 10, spin: -t * 9 });
  iso.pop();
  const hand = t < TL.HANDOVER;
  iso.bill(p.x, p.y, .7 + bob, (g) => person(g, { h: 1.9, body: SAF, hat: 'cap', hatColor: '#D2741A', skin: '#A8744E', arm: hand ? 1.1 : .2, face: Math.cos(p.rot) - Math.sin(p.rot) >= 0 ? 1 : -1 }), { bias: 3 });
}
function riderRoute(iso, t) {
  const u = clamp((t - TL.SEAL) / (TL.RIDE1 - TL.SEAL) * 1.15); if (u <= 0 || t > TL.ACC0 + .8) return;
  const a = 1 - seg(t, TL.ACC0, TL.ACC0 + .8);
  iso.line3(ROUTE.upto(u).map(p => [p[0], p[1], .08]), SAF, Math.max(3, iso.cam.k * .12), { dash: [12, 8], off: -t * 30, a, depth: -500, layer: 0 });
}
function neighbourAtDoor(iso, t) {
  const a = seg(t, TL.RIDE1 - 1.0, TL.RIDE1 - .6); if (a <= 0 || t > TL.PULL1) return;
  const got = t > TL.HANDOVER;
  iso.bill(DOOR.x + .7, DOOR.y - .2, 0, g => person(g, { h: 2.6, body: '#4C5BD4', skin: '#B9825A', hair: '#2B2230', arm: got ? .9 : .3, face: 1, tool: got ? (g2, x, y, h) => { g2.fillStyle = SAFT[1]; g2.fillRect(x - .14 * h, y - .05 * h, .26 * h, .3 * h); g2.fillStyle = SAFT[2]; g2.fillRect(x + .02 * h, y - .05 * h, .1 * h, .3 * h); } : null }), { bias: 4 });
}

// ---------- accumulation: orders everywhere ----------
const DOORS = [[-16, 6.5], [-16, 16], [-9, 16], [6.5, 13], [15.5, 12], [16, 19], [-6, 11.6], [-17, -15], [-7, -15], [7, -15], [17, -15]];
const FRONTS = [[6.5, -2.6], [-7.7, -2.6], [16.2, -2.6], [-18, -2.6], [7, 3], [16, 3]];
function order(iso, t, i) {
  const ti = TL.ORDERS[i], f = seg(t, ti - .7, ti); if (t < ti - .7 || t > ti + .7) return;
  let si = i < 4 ? 0 : Math.floor(hash(i * 3.1) * 6); const hi = Math.floor(hash(i * 7.7 + 1) * DOORS.length);
  if (si > 0 && ti < [0, ...TL.SHOPS_ON, TL.SHOPS_ON[3] + .3125][si]) si = 0;   // only shops already online send orders
  const A = FRONTS[si], B = DOORS[hi], u = eio(f), fade = 1 - seg(t, ti, ti + .7);
  const pts = []; for (let j = 0; j <= 16; j++) { const v = u * j / 16; pts.push([lerp(A[0], B[0], v), lerp(A[1], B[1], v), .2 + Math.sin(Math.PI * v) * 3]); }
  iso.line3(pts, SAF, 3, { dash: [7, 6], a: fade, depth: 3e5 });
  if (f < 1) { const p = pts[pts.length - 1]; iso.keep = true; iso.box(p[0] - .4, p[1] - .4, p[2] - .2, .8, .8, .7, SAFT, { bias: 3e5 }); iso.keep = false; }
  else { const q = seg(t, ti, ti + .45), s = iso.P(B[0], B[1], 1.2); iso.add(4e5, () => { const g = iso.g; g.save(); g.strokeStyle = iso.col(SAF, 1 - q); g.lineWidth = 3; g.lineCap = 'round'; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU, r0 = 10 + q * 26, r1 = r0 + 12; g.beginPath(); g.moveTo(s[0] + Math.cos(a) * r0, s[1] + Math.sin(a) * r0 * .7); g.lineTo(s[0] + Math.cos(a) * r1, s[1] + Math.sin(a) * r1 * .7); g.stroke(); } g.restore(); }, 1); }
}

// ---------- text registry (for readcheck) ----------
let TX = [];
const reg = (id, text, x0, y0, x1, y1, pass) => TX.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) });
function label(iso, id, x, y, z, o) {
  if (o.a <= 0) return;
  pin(iso, x, y, z, { ts: 30, ns: 56, len: 70, ...o });
  const [ax, ay] = iso.P(x, y, z), up = o.up ?? 130, dir = o.dir ?? 1, tx = ax + dir * ((o.len ?? 70) + 12);
  const tw = Math.max(o.title.length * 24, ((o.num || '') + ' ' + (o.unit || '')).length * 19);
  if (o.a > .5) reg(id, [o.title, o.num, o.unit].filter(Boolean).join(' '), dir > 0 ? tx : tx - tw, ay - up - 40, dir > 0 ? tx + tw : tx, ay - up + 70);
}

// ---------- subtitles: the map-label card (wraps to two lines on the narrow frame) ----------
function wrap(g, text, maxW) { const words = text.split(' '), lines = ['']; for (const w of words) { const tryL = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (g.measureText(tryL).width > maxW && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryL; } return lines; }
function cube(g, ix, iy, s, t3) { const P = (u, v, z) => [ix + (u - v) * C30 * s, iy + ((u + v) * .5 - z) * s]; const f = (pts, c) => { g.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = c; g.fill(); }; f([[-.5, .5, -.5], [.5, .5, -.5], [.5, .5, .5], [-.5, .5, .5]], t3[1]); f([[.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5], [.5, -.5, .5]], t3[2]); f([[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]], t3[0]); }
function subtitle(g, s, t) {
  const a = seg(t, s.t0, s.t0 + .6), fade = 1 - seg(t, s.t1, s.t1 + .3); if (a <= 0 || fade <= 0) return;
  g.save(); g.font = `500 44px ${FONT}`;
  const lines = wrap(g, s.text, 900), tw = Math.max(...lines.map(l => g.measureText(l).width)), pad = 30, icon = 50, lh = 56;
  const w = tw + pad * 2 + icon, h = 30 + lines.length * lh, x = W / 2 - w / 2, y = H - 230 - h;
  g.globalAlpha = ss(fade); g.translate(0, (1 - ss(fade)) * 10);
  const bw = eo(seg(a, 0, .35));
  g.beginPath(); g.roundRect(x, y, w, h, 12); g.fillStyle = 'rgba(251,246,236,.97)'; g.fill();
  g.save(); g.beginPath(); g.rect(x - 4, y - 4, (w + 8) * bw, h + 8); g.clip(); g.beginPath(); g.roundRect(x, y, w, h, 12); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); g.restore();
  cube(g, x + pad + 14, y + h / 2 + 2, 14, SAFT);
  g.save(); g.beginPath(); g.rect(x + pad + icon - 6, y, (tw + 12) * ss(seg(a, .2, .75)), h); g.clip();
  g.fillStyle = INK; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, x + pad + icon, y + 15 + lh / 2 + i * lh + 2)); g.restore();
  g.restore();
  reg(s.id, s.text, x, y, x + w, y + h);
}

// ---------- phone inset ----------
function phoneUI(g, cx, cy, R, t) {
  g.fillStyle = '#EDE6F4'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const pw = R * .78, ph = R * 1.5, px = cx - pw / 2, py = cy - ph / 2 + R * .12;
  g.save(); g.translate(0, (1 - eo(seg(t, TL.INSET0 + .2, TL.INSET0 + .7))) * 40);
  g.beginPath(); g.roundRect(px - 10, py - 10, pw + 20, ph + 20, 30); g.fillStyle = '#2C2840'; g.fill();
  g.beginPath(); g.roundRect(px, py, pw, ph, 22); g.fillStyle = '#FBF6EC'; g.fill();
  g.save(); g.beginPath(); g.roundRect(px, py, pw, ph, 22); g.clip();
  g.fillStyle = SAF; g.fillRect(px, py, pw, 70); haloText(g, 'PawanSetu', px + 22, py + 47, { font: `700 30px ${FONT}`, color: '#FFFFFF', halo: false });
  haloText(g, 'Sharma Store', px + 22, py + 118, { font: `600 26px ${FONT}`, halo: false }); haloText(g, '400 m · open now', px + 22, py + 150, { font: `400 20px ${FONT}`, color: '#6B6375', halo: false });
  const items = ['Atta 5 kg', 'Mustard oil', 'Biscuits', 'Soap'];
  items.forEach((it, i) => { const yy = py + 190 + i * 46, on = seg(t, TL.INSET0 + .5 + i * .18, TL.INSET0 + .7 + i * .18);
    g.globalAlpha = on; cube(g, px + 36, yy, 12, tri(ITEMC[i])); haloText(g, it, px + 58, yy + 8, { font: `500 22px ${FONT}`, halo: false }); g.globalAlpha = 1; });
  const pg = seg(t, TL.PING, TL.PING + .2), bc = pg > 0 ? '#2E8B57' : SAF;
  g.beginPath(); g.roundRect(px + 18, py + ph - 86, pw - 36, 60, 30); g.fillStyle = bc; g.fill();
  haloText(g, pg > 0 ? 'ORDER PLACED ✓' : 'PLACE ORDER', cx, py + ph - 47, { font: `700 19px ${FONT}`, color: '#FFFFFF', halo: false, align: 'center', track: 1 });
  g.restore(); g.restore();
}

// ---------- isotype: orders today ----------
function isotype(g, t) {
  const a = seg(t, TL.ACC0 + .3, TL.ACC0 + .8) * (1 - seg(t, TL.PULL0, TL.PULL0 + .5)); if (a <= 0) return;
  const lit = TL.ORDERS.filter(o => t >= o).length + (t >= TL.HANDOVER ? 0 : 0);
  g.save(); g.globalAlpha = a;
  haloText(g, 'ORDERS TODAY', 116, 238, { font: `600 32px ${FONT}`, track: 4 });
  haloText(g, String(lit * 10), 964, 248, { font: `400 64px ${FONT}`, align: 'right' });
  iconGrid(g, 108, 270, 26, lit, 13, 66, (g2, x, y, s, on) => { if (on) ICON.box(g2, x, y, s, SAFT, 1); else ICON.box(g2, x, y, s, SAFT, 0); });
  haloText(g, '1 ICON = 10 ORDERS · ILLUSTRATIVE', 116, 440, { font: `500 22px ${FONT}`, track: 3, color: '#6B6375' });
  g.restore();
  reg('iso', 'ORDERS TODAY ' + lit * 10, 100, 200, 980, 450, true);
}

// ---------- end frame: wordmark + legend ----------
function wordmark(g, t) {
  if (t < TL.WORDS[0] - .05) return;
  const I = new Iso(g, W, H); I.cam = { x: 0, y: 0, z: 0, k: 1 };
  // lying isometric type, reading up-right; P(x, -x, z) lands at screen (540 + 2x·cos30, 960 − z)
  const at = (sx, sy) => { const x = (sx - 540) / (2 * C30); return [x, -x, 960 - sy]; };
  g.font = '700 100px Jost'; g.letterSpacing = '10px'; const w1 = g.measureText('PAWAN').width + 40; g.letterSpacing = '0px';
  [['PAWAN', 0, TL.WORDS[0], '#FBF4E6'], ['SETU', w1, TL.WORDS[1], '#FFE2BF']].forEach(([wd, off, tw, face]) => {
    if (t < tw - .02) return; const e = back(seg(t, tw, tw + .25), 2.2), lift = (1 - ss(seg(t, tw, tw + .2))) * 30;
    const [x, y, z] = at(150 + off * C30, 545 - off * S30 + lift);
    I.text3Now(wd, x, y, z, { size: 100, plane: 'xy', extrude: 11 * e, track: 10, tri: [SAFT[0], SAFT[1], SAFT[2]], face, weight: 700 });
  });
  const ta = seg(t, TL.WORDS[1] + .5, TL.WORDS[1] + 1.0);
  if (ta > 0) { g.save(); g.globalAlpha = ta; haloText(g, 'Your shop. Your neighbourhood.', W / 2, 650, { font: `500 46px ${FONT}`, align: 'center' }); g.restore(); reg('tag', 'Your shop. Your neighbourhood.', 200, 610, 880, 665); }
  reg('wm', 'PAWANSETU', 140, 200, 900, 560);
}
function legend(g, t) {
  const a = seg(t, TL.LEGEND, TL.LEGEND + .5); if (a <= 0) return;
  const x = 150, y = 1430; g.save(); g.globalAlpha = a;
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 780 * eo(a), y - 34); g.stroke();
  const rows = [[SAFT, 'Local shop on PawanSetu'], [TEAL, 'Customers nearby'], [null, 'Far-away warehouse']];
  rows.forEach(([c, s], i) => { const yy = y + 10 + i * 44; const ra = seg(a, i * .2, i * .2 + .4); g.globalAlpha = a * ra;
    if (c) cube(g, x + 18, yy - 6, 18, c); else { g.save(); g.strokeStyle = '#6F7A90'; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(x, yy - 6); g.lineTo(x + 40, yy - 6); g.stroke(); g.restore(); }
    haloText(g, s, x + 62, yy + 6, { font: `500 30px ${FONT}` }); });
  g.globalAlpha = a; haloText(g, 'ILLUSTRATIVE · NOT TO SCALE', x, y + 152, { font: `600 22px ${FONT}`, track: 4, color: '#6B6375' });
  g.restore();
  rows.forEach(([, s], i) => { if (seg(a, i * .2, i * .2 + .4) > .5) reg('legend' + i, s, x, y - 20 + i * 44, x + 600, y + 20 + i * 44); });
}

// ---------- the scene ----------
export function render(g, t, Q) {
  TX = [];
  const iso = new Iso(g, W, H), cam = camAt(t); iso.cam = cam; const k = cam.k;
  background(g, iso);
  // the far world (only when the camera is far enough to need it)
  if (k < 30 && t < TL.BRIDGE0 + 2) warehouse(iso, t);
  board(iso);
  for (const [x, y, w, d, h] of HOMES) homeBox(iso, x, y, w, d, h);
  heroHome(iso, t);
  if (k < 80) for (const [x, y] of TREES) tree(iso, x, y);
  heroShop(iso, t);
  for (let i = 1; i < SHOPS.length; i++) shopBox(iso, i, t);
  farLine(iso, t);
  if (t >= TL.BRIDGE0 - .3) bridge(iso, t);
  riderRoute(iso, t);
  if (t < TL.RIDE0) { if (t > TL.SEAL) rider(iso, t, ROUTE.at(0)); }
  else if (t < TL.PULL1 + 2) rider(iso, t, t > TL.RIDE1 ? ROUTE.at(1) : null);
  neighbourAtDoor(iso, t);
  if (t > TL.ACC0) for (let i = 0; i < TL.ORDERS.length; i++) order(iso, t, i);
  iso.flush();

  // ----- overlays (screen space) -----
  const out = (t0, t1) => seg(t, t0, t0 + .9) * (1 - seg(t, t1, t1 + .3));
  label(iso, 'cust', WIN.x, WIN.y + .4, 3.3, { title: 'YOUR CUSTOMER', num: '400', unit: 'm away', dir: -1, up: 300, len: 80, a: out(.25, TL.FAR0 + 1.0) });
  if (k < 20 && t < TL.BACK0 + 1.4) label(iso, 'ware', WH.x + WH.w * .6, WH.y + WH.d * .4, WH.h + 1, { title: 'WAREHOUSE', num: '30', unit: 'km away', dir: 1, up: 70, a: out(TL.WARE_LAB, TL.BACK0 + 1.0) });
  label(iso, 'shop', HERO.x + 3.5, HERO.y + 3.5, HERO.h + .8, { title: 'YOUR SHOP', num: '2', unit: 'streets away', dir: -1, up: 330, len: 60, a: out(TL.SHOP_LAB, TL.BRIDGE0 + 1.3) });
  // phone inset (frame within the frame)
  const ia = seg(t, TL.INSET0, TL.INSET0 + .7) * (1 - seg(t, TL.INSET1 - .3, TL.INSET1));
  if (ia > 0) { const [ax, ay] = iso.P(WIN.x, WIN.y + .4, 2.3); inset(iso, ax, ay, 560, 520, 330, ia, (g2, cx, cy, R) => phoneUI(g2, cx, cy, R, t)); reg('phone', 'PawanSetu Sharma Store ORDER PLACED', 230, 190, 890, 850, true); }
  // inside the shop
  label(iso, 'pack', BAG.x, BAG.y, BAG.z + 1.4, { title: 'PACKED', num: '4', unit: 'items · your shelf', dir: 1, up: 360, len: 40, a: out(TL.ITEMS[0] - .4, TL.WALL_BACK - .1) });
  // the rider: "you are here" ring + an illustrative timer
  if (t > TL.RIDE0 - .2 && t < TL.ACC0 + .5) {
    const p = riderAt(t), [sx, sy] = iso.P(p.x, p.y, 1.1), ra = seg(t, TL.RIDE0 - .2, TL.RIDE0 + .3) * (1 - seg(t, TL.ACC0, TL.ACC0 + .5));
    const mins = Math.round(lerp(0, 12, seg(t, TL.RIDE0, TL.RIDE1)));
    ring(g, sx, sy, 2.3 * k, ra, t, mins + ' MIN', { ts: 34, lw: 3 }); if (ra > .5) reg('timer', '12 MIN', sx, sy - 2.3 * k - 60, sx + 2.3 * k + 180, sy, true);
  }
  isotype(g, t);
  // the scale reveal: one label per station, one note each
  if (t > TL.PULL0) {
    label(iso, 'r_shop', HERO.x + 3.5, HERO.y + 3.5, HERO.h + .8, { title: 'YOUR SHOP', dir: 1, up: 110, len: 50, a: seg(t, TL.LABELS[0], TL.LABELS[0] + .9) });
    label(iso, 'r_cust', HOME.x + 2, HOME.y + 3, HOME.h + 1.7, { title: 'YOUR CUSTOMERS', dir: 1, up: 150, len: 30, a: seg(t, TL.LABELS[1], TL.LABELS[1] + .9) });
    label(iso, 'r_rider', DOOR.x + .5, DOOR.y + 3, 0, { title: 'LOCAL RIDER', dir: 1, up: -150, len: 50, a: seg(t, TL.LABELS[2], TL.LABELS[2] + .9) });
    label(iso, 'r_street', 16, 5.5, 3.8, { title: 'EVERY SHOP · ONLINE', dir: -1, up: -190, len: 30, a: seg(t, TL.LABELS[3], TL.LABELS[3] + .9) });
  }
  wordmark(g, t); legend(g, t);
  const sub = SUBS.find(s => t >= s.t0 && t < s.t1 + .3);
  if (sub && !Q.has('nosub')) subtitle(g, sub, t);
}
export function texts(t, Q) { render(window.__g, t, Q); return TX; }

// ---------- sound events ----------
export function events() {
  const E = []; const e = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  e(TL.PHONE, 'tap'); e(TL.ORDER_OUT, 'line_whoosh', { dur: 4 }); e(TL.TRUCK, 'truck', { dur: 5 });
  e(.9, 'pin'); e(TL.WARE_LAB, 'pin'); e(TL.SHOP_LAB, 'pin'); e(TL.SHOP_LAB + .2, 'shutter_creak');
  e(TL.BACK0, 'whoosh_in');
  TL.BLOCKS.forEach((t, i) => e(t, 'block', { i }));
  e(TL.SHUTTER, 'shutter_roll');
  e(TL.INSET0, 'inset_open'); e(TL.INSET1 - .3, 'inset_close'); e(TL.PING, 'ping');
  TL.ITEMS.forEach((t, i) => { e(t - .45, 'item_lift', { i }); e(t, 'item_drop', { i }); });
  e(TL.PUSH0, 'whoosh_in'); e(TL.CUT, 'cut'); e(TL.WALL, 'wall_slide'); e(TL.ITEMS[0] - .4, 'pin'); e(TL.SEAL, 'seal'); e(TL.WALL_BACK, 'wall_slide');
  e(TL.RIDE0 - .3, 'scooter', { dur: TL.RIDE1 - TL.RIDE0 + .6 }); e(TL.BELL, 'bell'); e(TL.HANDOVER, 'handover');
  e(TL.ACC0, 'whoosh_out');
  TL.ORDERS.forEach((t, i) => e(t, 'order', { i }));
  [...TL.SHOPS_ON, TL.SHOPS_ON[3] + .3125].forEach(t => e(t, 'shutter_roll_small'));
  e(TL.PULL0, 'whoosh_out'); TL.LABELS.forEach(t => e(t, 'pin'));
  TL.WORDS.forEach((t, i) => e(t, 'word', { i })); e(TL.LEGEND, 'pin');
  for (const s of SUBS) e(s.t0, 'voice', { id: s.id });
  return E;
}
