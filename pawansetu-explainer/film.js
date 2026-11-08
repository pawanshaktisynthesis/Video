// PawanSetu — "Shop Local, Online". Mid-century Cartoon, 1080×1920. Engine: engine/toon.js (style), engine/chars.js (presenter), engine/icons.js.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, kidney, boomerang, arrow, dashed, ellipse, rect, rrect, spline, move,
  clamp, lerp, seg, ss, eo, eio, back, TAU, twos, paperFinish } from './engine/toon.js';
import { drawOwner, armJoints, drawHand } from './engine/chars.js';
import { icon } from './engine/icons.js';
import { S, TL, SUBS, BEAT, DUR as D } from './timeline.js';
export const DUR = D;
const W = 1080, H = 1920;
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const tint = (c, k) => mixc(c, '#FFFFFF', k), shade = (c, k) => mixc(c, '#2B2320', k);
// product colour (PawanSetu) stays saffron all film; accent = plum (presenter, stars); grounds rotate
// brand colours from pawansetu.in: indigo-600 tile, amber accent
const SAF = '#4F46E5', SAFD = '#3730A3', PLUM = '#E39A2E', INK = PAL.ink, PAPER = '#F3E9D2';
const GROUND = { hook: '#E07A5F', title: '#E3B23C', step: ['#8FB8C9', '#A3AD62', '#4FA9A3'], payoff: '#E07A5F', cta: PAPER };
const pop = (t, t0, d = .28) => back(seg(t, t0, t0 + d), 1.9);
const section = t => S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1];
let TX = [];

// ---------- shared furniture ----------
function bgFill(ctx, col) { ctx.fillStyle = tint(col, .28); ctx.fillRect(-500, -500, W + 1000, H + 1000); }
function floor(ctx, col, y) { plane(ctx, rect(-500, y, W + 1000, 1200), shade(col, .12)); ink(ctx, [[-20, y], [W * .3, y]], 4, { seed: 11 }); ink(ctx, [[W * .36, y], [W + 20, y]], 4, { seed: 12 }); }
function caption(ctx, t) {
  const cue = SUBS.find(s => t >= s.t0 && t < s.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + .16)), 1 - ss(seg(t, cue.t1 - .16, cue.t1)));
  const f = fit(ctx, cue.text, '500 {px}px Jost', 44, 860, 2, 34), lh = f.px * 1.25;
  const w = Math.max(...f.lines.map(l => measure(ctx, l, f.font))) + 130, h = 34 + f.lines.length * lh, x = W / 2 - w / 2, y = H - 150 - h;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 10);
  shape(ctx, rrect(x, y, w, h, 14), { fill: PAPER, line: 3.2, seed: 901, grain: .15, breaks: .08, off: [5, 5] });
  star(ctx, x + 32, y + h / 2, 15, { n: 8, inner: .4, fill: PLUM, off: [0, 0], rot: t * .8 });
  star(ctx, x + w - 32, y + h / 2, 15, { n: 8, inner: .4, fill: PLUM, off: [0, 0], rot: -t * .8 });
  f.lines.forEach((l, i) => text(ctx, l, W / 2, y + 17 + lh * (i + .5) + f.px * .34, { font: f.font, fill: INK, align: 'center' }));
  ctx.restore();
  TX.push({ id: cue.id, text: cue.text, x0: x, y0: y, x1: x + w, y1: y + h });
}
function tag(ctx, t, t0, str, x, y, o = {}) {
  const k = pop(t, t0); if (k <= 0) return;
  const f = fit(ctx, str, '500 {px}px Jost', o.px || 40, o.maxW || 700, 2, 28), w = Math.max(...f.lines.map(l => measure(ctx, l, f.font))) + 100, h = 34 + f.lines.length * f.px * 1.2, X = x - w / 2;
  ctx.save(); ctx.translate(x, y + h / 2); ctx.scale(k, k); ctx.translate(-x, -(y + h / 2));
  shape(ctx, rrect(X, y, w, h, 14), { fill: PAPER, line: 3.6, seed: 710, grain: .15, off: [6, 5] });
  star(ctx, X + 40, y + h / 2, 18, { n: 8, inner: .42, fill: PLUM, off: [0, 0], rot: t * .6 });
  f.lines.forEach((l, i) => text(ctx, l, X + 70, y + 17 + f.px * .92 + i * f.px * 1.2, { font: f.font, fill: INK }));
  ctx.restore();
  if (k > .9) TX.push({ id: 'tag:' + str, text: str, x0: X, y0: y, x1: X + w, y1: y + h });
}
function stepHeader(ctx, t, s) {
  const k = eo(seg(twos(t), s.t0 + .05, s.t0 + .4)); if (k <= 0) return;
  ctx.save(); ctx.translate(-(1 - k) * 700, 0);
  shape(ctx, ellipse(110, 150, 56, 56, 40), { fill: INK, line: 0, seed: 700, grain: .1, off: [0, 0] });
  text(ctx, String(s.i + 1), 110, 173, { font: '64px Slab', fill: PAPER, align: 'center' });
  text(ctx, `STEP ${s.i + 1} OF 3`, 190, 120, { font: '600 26px Jost', fill: INK, track: 6 });
  const f = fit(ctx, s.label, '{px}px Slab', 62, 820, 1, 40);
  text(ctx, f.lines[0], 188, 192, { font: f.font, fill: INK, plate: PAPER, off: [4, 4] });
  ctx.restore();
  TX.push({ id: 'head' + s.i, text: `STEP ${s.i + 1} OF 3 ${s.label}`, x0: 60, y0: 90, x1: 1020, y1: 210 });
}
function callout(ctx, t, t0, cx, cy, r, inner, bgc, leader) {
  const k = back(seg(t, t0, t0 + .32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) { const a = Math.atan2(leader[1] - cy, leader[0] - cx); dashed(ctx, [[cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)], leader], 4, 14, 10, -t * 40, INK, clamp(k)); shape(ctx, ellipse(leader[0], leader[1], 9, 9, 12), { fill: INK, line: 0, off: [0, 0], grain: 0 }); }
  shape(ctx, ellipse(cx, cy, R + 16, R + 16, 72), { fill: PAPER, line: 4.5, seed: 720, grain: .15, breaks: .05 });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.translate(cx, cy); ctx.scale(k, k); inner(ctx); ctx.restore();
  ink(ctx, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 721, breaks: .1 });
}
function medallionAt(ctx, t, tStamp, x, y, i, r = 104) {
  const k = pop(t, tStamp, .24); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * .4);
  star(ctx, 0, 0, r * 1.2, { n: 16, inner: .84, fill: PAL.white, off: [0, 0], rot: i * .2 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: GROUND.step[i], line: 5, seed: 730 + i, grain: .3 });
  text(ctx, String(i + 1), 0, r * .38, { font: `${Math.round(r * 1.1)}px Slab`, fill: INK, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
// the PawanSetu mark (pawansetu.in icon): an indigo rounded square with a white bold "P", printed off-register like everything else
function mark(ctx, x, y, s, seed = 600) {
  shape(ctx, rrect(x - 60 * s, y - 60 * s, 120 * s, 120 * s, 26 * s), { fill: SAF, line: 4, seed, grain: .2, shade: [{ pts: rrect(x + 10 * s, y - 60 * s, 50 * s, 120 * s, 0), color: SAFD, alpha: .3 }] });
  text(ctx, 'P', x, y + 27 * s, { font: `700 ${Math.round(80 * s)}px Jost`, fill: PAL.white, align: 'center' });
}
// a hand-tap inside a phone close-up: anticipation lift, tap, follow-through
function finger(g, t, tt, tx, ty) {
  const pre = ss(seg(t, tt - .45, tt - .12)), down = seg(t, tt - .12, tt), up = ss(seg(t, tt + .05, tt + .35));
  const fx = lerp(200, tx + 22, pre) + up * 170, fy = lerp(260, ty + 66, pre) - pre * 20 + down * 20 * (1 - up) + up * 260;   // follow-through: the hand leaves the screen
  drawHand(g, fx + 40, fy + 40, -2.25, 'point', 1, 2.4);
  if (t >= tt && t < tt + .3) { const k = seg(t, tt, tt + .3); ink(g, ellipse(tx, ty, 20 + k * 60, 20 + k * 60, 30), 4, { closed: true, color: PLUM, alpha: 1 - k, seed: 870 }); }
}
function phoneBody(g) { shape(g, rrect(-130, -230, 260, 470, 30), { fill: INK, line: 0, seed: 850, grain: .1, off: [0, 0] }); shape(g, rrect(-110, -200, 220, 400, 12), { fill: PAPER, line: 0, seed: 851, grain: .1, off: [0, 0] }); }

// ---------- presenter holding a phone (steps) ----------
const FY = 1520, PX = 250, PS = 1.18;
function presenter(ctx, t, s, o = {}) {
  const u = t - s.t0, blink = [1.4, 3.6].some(b => u > b && u < b + .13) ? 1 : 0;
  const pose = { x: PX, y: FY, s: PS, dir: 1, view: 'q', face: o.face || 'focus', look: [6, 8], blink,
    armF: { a1: 1.05, a2: -.72 }, armB: { a1: .95, a2: -.2 }, handF: 'grip', handB: 'point', prop: { kind: 'phone', hand: 'F', rot: -.12, screen: o.screen } };
  drawOwner(ctx, pose, u);
  const J = armJoints(pose, 'F'); return [PX + (J.ha[0] + 16) * PS, FY + (J.ha[1] - 30) * PS];
}

// ---------- scenes ----------
function sceneHook(ctx, t, s) {
  const col = GROUND.hook; bgFill(ctx, col);
  ctx.save(); const z = lerp(1, 1.05, ss(seg(t, 0, s.t1))); ctx.translate(W / 2, 1100); ctx.scale(z, z); ctx.translate(-W / 2, -1100);
  floor(ctx, col, FY);
  kidney && plane(ctx, kidney(820, 420, 150, .3), tint(col, .45));
  // the corner shop: mustard walls, striped awning, a sign
  const SX = 760, SW = 300;
  shape(ctx, rect(SX - SW / 2, FY - 380, SW, 380), { fill: '#E3B23C', line: 4, seed: 20, grain: .3, shade: [{ pts: rect(SX + 60, FY - 380, 100, 380), color: '#C9952A', alpha: .5 }] });
  for (let i = 0; i < 6; i++) shape(ctx, [[SX - SW / 2 - 20 + i * 57, FY - 300], [SX - SW / 2 + 37 + i * 57, FY - 300], [SX - SW / 2 + 37 + i * 57, FY - 250], [SX - SW / 2 - 20 + i * 57, FY - 250]], { fill: i % 2 ? PAL.white : '#4FA9A3', line: 3, seed: 21 + i, grain: .2 });
  shape(ctx, rect(SX - 100, FY - 210, 200, 210), { fill: shade('#E3B23C', .55), line: 3.5, seed: 28, grain: .2 });
  shape(ctx, rrect(SX - 120, FY - 360, 240, 46, 8), { fill: PAPER, line: 3, seed: 29, grain: .1 });
  text(ctx, 'CORNER SHOP', SX, FY - 326, { font: '28px Slab', fill: INK, align: 'center' });
  // presenter: points at the shop, then checks her watch
  const u = t - s.t0, watch = ss(seg(twos(t), TL.WATCH - .12, TL.WATCH)), pt = ss(seg(twos(t), TL.ARROW - .2, TL.ARROW)) * (1 - watch);
  const pose = { x: 270, y: FY, s: PS, dir: 1, view: 'q', face: t < TL.WATCH ? 'happy' : 'focus', look: t < TL.WATCH ? [8, 0] : [4, 10], blink: [2.6, 8.5].some(b => u > b && u < b + .13) ? 1 : 0,
    armF: { a1: lerp(1.3, -.15, pt), a2: lerp(1.52, -.25, pt) }, armB: { a1: lerp(1.86, 1.0, watch), a2: lerp(1.7, -1.35, watch) }, handF: pt > .5 ? 'point' : 'open', handB: watch > .5 ? 'grip' : 'open' };
  if (watch > .5) pose.armF = { a1: 1.1, a2: -1.0 };
  drawOwner(ctx, pose, u);
  // the curved arrow "around the corner"
  const au = seg(t, TL.ARROW, TL.ARROW + .8);
  if (au > 0 && t < TL.WATCH) arrow(ctx, [430, 900], [640, 1060], { u: au, bob: Math.sin(t * Math.PI * 2 / BEAT) * .5 + .5, bend: -.5, fill: PLUM });
  ctx.restore();
  // no time: a spinning clock in a starburst
  const ck = pop(t, TL.CLOCK);
  if (ck > 0) { ctx.save(); ctx.translate(560, 560); ctx.scale(ck, ck); rays(ctx, 0, 0, 28, 230, tint(col, .55)); star(ctx, 0, 0, 150, { n: 14, inner: .78, fill: PAPER, off: [0, 0] }); icon(ctx, 'clock', 0, 0, 170, { main: PLUM, light: PAL.white, dark: INK });
    const a = (t - TL.CLOCK) * 9; ink(ctx, [[0, 0], [Math.cos(a) * 62, Math.sin(a) * 62]], 7, { seed: 31, color: PLUM }); ctx.restore(); }
  tag(ctx, t, TL.NOTIME, 'No time to walk there', 560, 790);
  return { focus: [560, 560] };
}
function sceneTitle(ctx, t, s) {
  const col = GROUND.title; bgFill(ctx, col);
  rays(ctx, W / 2, 900, 30, 1400, tint(col, .5), { rot: t * .05 });
  for (const [x, y, r] of [[170, 380, 30], [900, 520, 40], [220, 1240, 34], [880, 1300, 26]]) sparkle(ctx, x, y, r * (1 + .1 * Math.sin(t * 6 + x)), { fill: PAL.white });
  plane(ctx, boomerang(W / 2, 1000, 420, -.1), tint(col, .7));
  // kicker writes on; slab title on a saffron plate; "in minutes"
  const kw = seg(t, TL.KICK, TL.KICK + .7);
  if (kw > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 600, 160 + 760 * kw, 200); ctx.clip(); text(ctx, "here's how to", W / 2, 720, { font: '700 92px Oleo', fill: INK, align: 'center', rot: -.05 }); ctx.restore(); }
  const k1 = pop(t, TL.TITLE), k2 = pop(t, TL.TITLE + BEAT);
  for (const [str, y, k] of [['SHOP LOCAL,', 880, k1], ['ONLINE', 1010, k2]]) if (k > 0) { ctx.save(); ctx.translate(W / 2, y - 40); ctx.scale(k, k); text(ctx, str, 0, 40, { font: '120px Slab', fill: INK, plate: SAF, off: [8, 7], align: 'center' }); ctx.restore(); }
  const k3 = pop(t, TL.MINUTES);
  if (k3 > 0) { ctx.save(); ctx.translate(W / 2, 1120); ctx.scale(k3, k3); shape(ctx, rrect(-200, -46, 400, 92, 46), { fill: SAF, line: 4, seed: 40, grain: .2 }); text(ctx, 'in minutes', 0, 18, { font: '600 52px Jost', fill: PAL.white, align: 'center' }); ctx.restore(); }
  if (k2 > .9) TX.push({ id: 'title', text: 'SHOP LOCAL, ONLINE', x0: 100, y0: 780, x1: 980, y1: 1060 });
  if (k3 > .9) TX.push({ id: 'mins', text: 'in minutes', x0: 340, y0: 1074, x1: 740, y1: 1166 });
  if (kw >= 1) TX.push({ id: 'kick', text: "here's how to", x0: 200, y0: 630, x1: 880, y1: 750 });
  return { focus: [W / 2, 900] };
}
// phone screens for each step
function screen1(g, t) {
  phoneBody(g);
  const open = t >= TL.TAP1 + .05;
  if (!open) {
    const cols = ['#8FB8C9', '#A3AD62', '#E07A5F', '#E3B23C', '#4FA9A3', '#C9A3C2', '#A3AD62', '#8FB8C9'];
    for (let i = 0; i < 9; i++) { const x = -66 + (i % 3) * 66, y = -130 + Math.floor(i / 3) * 80; if (i === 4) continue; shape(g, rrect(x - 24, y - 24, 48, 48, 12), { fill: cols[i % 8], line: 3, seed: 800 + i, grain: .2 }); }
    const k = t >= TL.TAP1 - .08 && t < TL.TAP1 + .1 ? .9 : 1; g.save(); g.translate(0, -50); g.scale(k * .45, k * .45); mark(g, 0, 0, 1, 820); g.restore();
    text(g, 'PawanSetu', 0, 10, { font: '600 18px Jost', fill: INK, align: 'center' });
  } else {
    const k = pop(t, TL.TAP1 + .05, .3); g.save(); g.beginPath(); g.rect(-110, -200, 220, 400); g.clip();
    shape(g, ellipse(0, -50, 400 * k, 400 * k, 50), { fill: SAF, line: 0, seed: 830, grain: .2, off: [0, 0] });
    if (k > .6) { g.save(); g.translate(0, -60); g.scale(.8, .8); mark(g, 0, 0, 1, 840); g.restore(); text(g, 'PawanSetu', 0, 60, { font: '800 36px Jost', fill: PAL.white, align: 'center' }); text(g, 'shops near you', 0, 100, { font: '500 20px Jost', fill: PAL.white, align: 'center' }); sparkle(g, 70, -130, 18, { fill: PAL.white }); }
    g.restore();
  }
  finger(g, t, TL.TAP1, 0, -50);
}
const PINS = [[-60, -110, 'Bakery'], [50, -40, 'Corner Shop'], [-40, 60, 'Medicals'], [60, 120, 'Florist']];
function screen2(g, t) {
  phoneBody(g);
  g.save(); g.beginPath(); g.rect(-110, -200, 220, 400); g.clip();
  plane(g, rect(-110, -200, 220, 400), '#E9E1C9');
  for (const [x0, y0, x1, y1] of [[-110, -70, 110, -70], [-110, 20, 110, 20], [-110, 100, 110, 100], [-10, -200, -10, 200], [80, -200, 80, 200]]) ink(g, [[x0, y0], [x1, y1]], 10, { seed: 880 + x0 + y0, color: PAL.white, taper: false });
  shape(g, ellipse(-80, 160, 14, 14, 16), { fill: '#4C7FD0', line: 3, seed: 890, grain: 0 }); text(g, 'you', -80, 192, { font: '600 16px Jost', fill: INK, align: 'center' });
  PINS.forEach(([x, y, n], i) => { const k = pop(t, TL.SHOPS + i * .25, .25); if (k <= 0) return; const sel = i === 1 && t >= TL.TAP2;
    g.save(); g.translate(x, y); g.scale(k * (sel ? 1.25 : 1), k * (sel ? 1.25 : 1)); shape(g, [[0, 0], [-16, -26], [-16, -40], [0, -54], [16, -40], [16, -26]], { fill: sel ? SAF : PLUM, line: 3, seed: 900 + i, grain: .2 }); shape(g, ellipse(0, -36, 6, 6, 10), { fill: PAL.white, line: 0, off: [0, 0], grain: 0 }); g.restore(); });
  if (t >= TL.TAP2 + .1) { const k = pop(t, TL.TAP2 + .1); g.save(); g.translate(0, 150); g.scale(k, k); shape(g, rrect(-100, -36, 200, 72, 12), { fill: PAL.white, line: 3, seed: 910, grain: .1 }); text(g, 'Corner Shop', 0, -4, { font: '600 22px Jost', fill: INK, align: 'center' }); text(g, 'open now', 0, 22, { font: '500 17px Jost', fill: SAFD, align: 'center' }); g.restore(); }
  g.restore();
  finger(g, t, TL.TAP2, 50, -76);
}
const ITEMS = ['Atta', 'Milk', 'Biscuits'];
function screen3(g, t) {
  phoneBody(g);
  shape(g, rect(-110, -200, 220, 56), { fill: SAF, line: 0, off: [0, 0], grain: .2 }); text(g, 'Corner Shop', 0, -164, { font: '600 22px Jost', fill: PAL.white, align: 'center' });
  const n = TL.ITEMS.filter(x => t >= x).length;
  ITEMS.forEach((it, i) => { const y = -110 + i * 70, on = t >= TL.ITEMS[i];
    icon(g, 'box', -70, y, 40, { main: ['#E3B23C', '#8FB8C9', '#E07A5F'][i], light: PAL.white, dark: INK }); text(g, it, -38, y + 8, { font: '500 22px Jost', fill: INK });
    shape(g, ellipse(76, y, 18, 18, 18), { fill: on ? SAF : PAL.white, line: 3, seed: 920 + i, grain: 0 }); text(g, on ? '1' : '+', 76, y + 8, { font: '700 22px Jost', fill: on ? PAL.white : INK, align: 'center' }); });
  const ordered = t >= TL.ORDER, bk = t >= TL.ORDER - .08 && t < TL.ORDER + .1 ? .94 : 1;
  g.save(); g.translate(0, 130); g.scale(bk, bk); shape(g, rrect(-90, -30, 180, 60, 30), { fill: ordered ? '#4FA9A3' : SAF, line: 3.5, seed: 930, grain: .1 }); text(g, `ORDER · ${n}`, 0, 9, { font: '700 24px Jost', fill: PAL.white, align: 'center', track: 2 }); g.restore();
  const taps = [...TL.ITEMS.map((x, i) => [x, 76, -110 + i * 70]), [TL.ORDER, 0, 130]], cur = taps.find(([x]) => t < x + .4) || taps[taps.length - 1];
  if (t < TL.ORDER + 1.2) finger(g, t, cur[0], cur[1], cur[2]);
  if (ordered) { const k = pop(t, TL.ORDER + .05, .22); g.save(); g.translate(0, -10); g.rotate(-.18); g.scale(k * 1.0, k * 1.0); star(g, 0, 0, 120, { n: 18, inner: .82, fill: PAPER, off: [0, 0] }); shape(g, rrect(-104, -36, 208, 72, 10), { fill: PAPER, line: 5, seed: 940, grain: .2, off: [0, 0] }); text(g, 'ORDER', 0, -4, { font: '34px Slab', fill: SAFD, align: 'center' }); text(g, 'PLACED', 0, 26, { font: '34px Slab', fill: SAFD, align: 'center' }); g.restore(); }
}
function sceneStep(ctx, t, s) {
  const col = GROUND.step[s.i]; bgFill(ctx, col);
  plane(ctx, kidney(820, 1280, 170, -.4), tint(col, .45));
  floor(ctx, col, FY);
  const ph = presenter(ctx, t, s, { face: (s.i === 2 && t > TL.ORDER) || (s.i === 0 && t > TL.TAP1 + .3) ? 'happy' : 'focus' });
  stepHeader(ctx, t, s);
  const CX = 640, CY = 640, R = 300;
  callout(ctx, t, s.t0 + .5, CX, CY, R, g => [screen1, screen2, screen3][s.i](g, t), tint(col, .55), ph);
  const tags = [[TL.TAP1 + .4, 'Your local shops, in one app'], [TL.TAP2 + .15, 'Shops in your neighbourhood']];
  if (tags[s.i]) tag(ctx, t, tags[s.i][0], tags[s.i][1], 730, 1010, { px: 38 });
  const nx = TL.STAMPS[s.i + 1]; if (nx) medallionAt(ctx, t, nx, CX, CY, s.i + 1);
  return { focus: [CX, CY] };
}
function scenePayoff(ctx, t, s) {
  const col = GROUND.payoff; bgFill(ctx, col); floor(ctx, col, FY);
  rays(ctx, 640, 640, 26, 900, tint(col, .5));
  const u = t - s.t0;
  drawOwner(ctx, { x: PX, y: FY, s: PS, dir: 1, view: 'q', face: 'happy', look: [6, 0], blink: u > 2.2 && u < 2.33 ? 1 : 0, armF: { a1: 1.3, a2: 1.52 }, armB: { a1: 1.86, a2: 1.7 }, handF: 'open', handB: 'open' }, u);
  // the shopping list ticks itself
  ctx.save(); ctx.translate(660, 640); ctx.rotate(.04);
  shape(ctx, rrect(-230, -300, 460, 600, 16), { fill: PAPER, line: 4, seed: 50, grain: .2, off: [7, 6] });
  text(ctx, 'today', 0, -210, { font: '700 64px Oleo', fill: INK, align: 'center' });
  ITEMS.forEach((it, i) => { const y = -90 + i * 120; ink(ctx, [[-150, y + 30], [170, y + 30]], 2.5, { seed: 51 + i, color: shade(PAPER, .2), taper: false }); text(ctx, it, -60, y + 16, { font: '500 52px Jost', fill: INK });
    shape(ctx, rrect(-170, y - 30, 64, 64, 10), { fill: PAL.white, line: 3.5, seed: 55 + i, grain: 0 });
    const k = seg(t, TL.TICKS[i], TL.TICKS[i] + .2); if (k > 0) ink(ctx, [[-160, y], [-140, y + 20], [-100, y - 26]], 10, { seed: 58 + i, color: SAF, taper: false, upto: k }); });
  ctx.restore();
  tag(ctx, t, TL.DONE, 'Done in minutes', 660, 1010);
  TX.push({ id: 'list', text: 'today Atta Milk Biscuits', x0: 430, y0: 340, x1: 890, y1: 940, pass: true });
  return { focus: [660, 640] };
}
function sceneCta(ctx, t, s) {
  const col = GROUND.cta; ctx.fillStyle = col; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  rays(ctx, W / 2, 760, 30, 1500, tint(SAF, .72));
  for (const [x, y, r] of [[180, 420, 34], [900, 470, 28], [160, 1180, 26], [920, 1150, 36]]) sparkle(ctx, x, y, r, { fill: PLUM });
  const k = pop(t, TL.CTA_MARK, .3);
  if (k > 0) { ctx.save(); ctx.translate(W / 2, 700); ctx.scale(k * 2.1, k * 2.1); star(ctx, 0, 0, 100, { n: 16, inner: .84, fill: PAL.white, off: [0, 0] }); mark(ctx, 0, 0, 1, 960); ctx.restore(); }
  const k2 = pop(t, TL.CTA_NAME);
  if (k2 > 0) { ctx.save(); ctx.translate(W / 2, 1010); ctx.scale(k2, k2); text(ctx, 'PawanSetu', 0, 40, { font: '800 132px Jost', fill: INK, align: 'center', track: -2 }); ctx.restore(); }
  const lw = seg(t, TL.CTA_LINE, TL.CTA_LINE + .8);
  if (lw > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 1080, 120 + 840 * lw, 160); ctx.clip(); text(ctx, 'your local shops, online', W / 2, 1170, { font: '700 68px Oleo', fill: PLUM, align: 'center' }); ctx.restore(); }
  if (k2 > .9) TX.push({ id: 'cta', text: 'PawanSetu your local shops, online', x0: 120, y0: 920, x1: 960, y1: 1200 });
  return { focus: [W / 2, 700] };
}
function draw(ctx, t, s) { ctx.save(); const r = ({ hook: sceneHook, title: sceneTitle, step: sceneStep, payoff: scenePayoff, cta: sceneCta })[s.kind](ctx, t, s); ctx.restore(); return r || {}; }

// ---------- transitions: medallion iris into each step, colour-block wipes elsewhere ----------
export function render(ctx, t, Q) {
  TX = []; setClock(t);
  const i = S.indexOf(section(t)), s = S[i], pv = S[i - 1];
  if (s.kind === 'step' && t < s.t0 + BEAT * .8) {
    const k = eio(seg(t, s.t0 - BEAT * .2, s.t0 + BEAT * .8)), f = draw(ctx, pv.t1 - 1e-3, pv).focus || [W / 2, H / 2];
    const cx = lerp(f[0], W / 2, k), cy = lerp(f[1], H / 2, k), r = lerp(104, 1300, k * k);
    if (pv.kind === 'title') medallionAt(ctx, t, TL.STAMPS[0], f[0], f[1], 0);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); draw(ctx, Math.max(t, s.t0 + 1e-3), s); ctx.restore();
    ink(ctx, ellipse(cx, cy, r, r, 90), 7, { closed: true, seed: 960 });
  } else if (pv && s.kind !== 'step' && t < s.t0 + .3) {
    const k = eio(seg(t, s.t0, s.t0 + .3)); draw(ctx, pv.t1 - 1e-3, pv);
    ctx.save(); ctx.beginPath(); if (s.kind === 'payoff') ctx.rect(W * (1 - k), 0, W, H); else ctx.rect(0, H * (1 - k), W, H); ctx.clip(); draw(ctx, t, s); ctx.restore();
    if (s.kind === 'payoff') ink(ctx, [[W * (1 - k), -10], [W * (1 - k), H + 10]], 6, { seed: 962 }); else ink(ctx, [[-10, H * (1 - k)], [W + 10, H * (1 - k)]], 6, { seed: 963 });
  } else {
    draw(ctx, t, s);
    if (s.kind === 'title') medallionAt(ctx, t, TL.STAMPS[0], W / 2, 900, 0);
  }
  paperFinish(ctx, W, H, 1);
  if (!(Q && Q.has('nosubs'))) caption(ctx, t);
}
export function texts(t, Q) { render(window.__g, t, Q); return TX; }
export function events() {
  const E = [], e = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  e(TL.ARROW, 'slide'); e(TL.WATCH, 'rustle'); e(TL.CLOCK, 'stamp'); e(TL.NOTIME, 'pop');
  e(S[1].t0, 'swish'); TL.SNAPS.forEach(t => e(t, 'snap')); e(TL.TITLE, 'stamp'); e(TL.TITLE + BEAT, 'stamp'); e(TL.MINUTES, 'pop');
  TL.STAMPS.forEach(t => { e(t, 'stamp'); e(t + .5, 'iris'); });
  S.filter(s => s.kind === 'step').forEach(s => e(s.t0 + .5, 'pop'));
  e(TL.TAP1, 'tap'); e(TL.TAP1 + .1, 'pips'); e(TL.SHOPS, 'pins'); e(TL.TAP2, 'tap'); e(TL.TAP2 + .1, 'pips');
  TL.ITEMS.forEach(t => e(t, 'tap')); e(TL.ORDER, 'click'); e(TL.ORDER + .05, 'stamp');
  [TL.TAP1 + .4, TL.TAP2 + .15].forEach(t => e(t, 'pop'));
  e(S[5].t0, 'swish'); TL.TICKS.forEach(t => e(t, 'tick')); e(TL.DONE, 'pop');
  e(S[6].t0, 'swish'); e(TL.CTA_MARK, 'stamp'); e(TL.CTA_NAME, 'stamp'); e(TL.CTA_LINE, 'scratch');
  return E;
}
