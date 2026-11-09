// "One Day at a Local Shop" — nine library styles, one story. 1080×1920. New chapters drawn here; reused chapters are frames in clips/<id>/n_####.jpg.
import { CH, VO, DUR as D } from './timeline.js';
export const DUR = D;
const W = 1080, H = 1920, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), back = (t, s = 1.4) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const twos = t => Math.floor(t * 12) / 12;
let TX = [];
const reg = (id, text, x0, y0, x1, y1, pass) => TX.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) });
function txt(g, s, x, y, font, col, align = 'left', track = 0) { g.save(); g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; if (track) g.letterSpacing = track + 'px'; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w; }

// ===================== SWISS (title + end): grid, one grotesk, one signal red, snaps on the beat =====================
const SW = { paper: '#F1EFEA', ink: '#141414', red: '#E2231A', grey: '#D9D6CF' };
function swissGrid(g) { g.fillStyle = SW.paper; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 1; for (let i = 0; i <= 12; i++) { const x = 60 + i * 80; g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); } for (let j = 0; j <= 24; j++) { const y = 80 * j; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); } }
const snap = (t, t0) => t >= t0 ? 1 : 0;   // nothing eases in Swiss: things appear on the beat
function title(g, t) {
  swissGrid(g); const B = .6;
  if (snap(t, .3)) { g.fillStyle = SW.red; g.fillRect(60, 300, lerp(80, 960, ss(seg(t, 1.5, 3.3))), 40); }
  if (snap(t, .3)) txt(g, 'A DAY', 60, 260, '700 46px Inter', SW.ink, 'left', 2);
  if (snap(t, .3 + B)) txt(g, '05:30', 40, 620, '800 300px Inter', SW.ink, 'left', -14);
  if (snap(t, .3 + 2 * B)) txt(g, '21:00', 40, 900, '800 300px Inter', SW.ink, 'left', -14);
  if (snap(t, .3 + 3 * B)) { txt(g, 'AT A LOCAL SHOP', 60, 1040, '700 64px Inter', SW.ink, 'left', 1); }
  if (snap(t, .3 + 4 * B)) { txt(g, 'NINE STYLES', 60, 1500, '700 34px Inter', SW.ink, 'left', 3); txt(g, 'ONE STORY', 60, 1546, '700 34px Inter', SW.red, 'left', 3); }
  if (snap(t, .3 + 5 * B)) ['05:30 WATERCOLOR', '07:00 SILENT FILM', '11:00 GLASS', '13:00 RISOGRAPH', '15:00 CARTOON', '15:10 ISOMETRIC', '18:00 PIXEL RPG', '21:00 PAPER-CUT'].forEach((s, i) => txt(g, s, 620, 1180 + i * 36, '500 24px Inter', i < Math.floor((t - 3.3) / .12) ? SW.ink : SW.grey, 'left', 1));
  if (t > 1.0) reg('title', 'A DAY 05:30 21:00 AT A LOCAL SHOP', 40, 200, 1040, 1060);
}
function endCard(g, t) {
  swissGrid(g); const t0 = CH[CH.length - 1].t0, B = .3;
  const names = CH.slice(1, -1).map(c => [c.style.toUpperCase(), c.cat.toUpperCase()]);
  txt(g, 'NINE STYLES', 60, 200, '700 46px Inter', SW.ink, 'left', 2);
  names.forEach(([s, c], i) => { if (t < t0 + .2 + i * B) return; const y = 300 + i * 92; g.fillStyle = SW.ink; g.fillRect(60, y - 44, 6, 56); txt(g, s, 90, y, '700 40px Inter', SW.ink); txt(g, c, 90, y + 30, '500 20px Inter', '#6B6863', 'left', 2); });
  if (t >= t0 + 3.2) { g.fillStyle = SW.red; g.fillRect(60, 1180, 960, 16); }
  // the one exception on the grid: the PawanSetu logo in its own indigo
  if (t >= t0 + 3.6) { const y = 1420; g.fillStyle = '#4F46E5'; g.beginPath(); g.roundRect(60, y - 130, 160, 160, 34); g.fill(); txt(g, 'P', 140, y - 6, '700 112px Inter', '#FFFFFF', 'center'); txt(g, 'PawanSetu', 250, y - 18, '800 110px Inter', SW.ink, 'left', -3); }
  if (t >= t0 + 4.2) txt(g, 'pawansetu.in', 252, 1490, '500 44px Inter', SW.red, 'left', 1);
  if (t > t0 + 3.0) reg('styles', names.map(n => n[0]).join(' '), 60, 240, 1020, 1160, true);
  if (t >= t0 + 3.8) reg('brand', 'PawanSetu pawansetu.in', 60, 1280, 1020, 1500);
}

// ===================== WATERCOLOR: strokes paint themselves on cotton paper =====================
function paperTex(g, base = '#F6EFE2') {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { const x = hash(i) * W, y = hash(i + 7) * H; g.fillStyle = `rgba(120,95,60,${.025 + .03 * hash(i + 3)})`; g.fillRect(x, y, 1 + hash(i + 9) * 3, 1); }
}
// a brush stroke: a variable-width translucent ribbon along a polyline + a few bristle tracks that break into dashes (flying white)
function stroke(g, pts, w, col, a, u, seed = 1) {
  if (u <= 0) return; const n = Math.max(2, Math.floor(pts.length * clamp(u))), P = pts.slice(0, n);
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath();
  const L = [], R = [];
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[Math.min(P.length - 1, i + 1)], o = P[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, k = w * (.55 + .45 * Math.sin(Math.PI * (i + .5) / P.length)) * (.85 + .3 * hash(seed + i));
    L.push([p[0] - dy / l * k, p[1] + dx / l * k]); R.push([p[0] + dy / l * k, p[1] - dx / l * k]); }
  L.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); R.reverse().forEach(p => g.lineTo(...p)); g.closePath(); g.fill();
  g.globalAlpha = a * .7; g.strokeStyle = col; g.lineWidth = 1.6;
  for (let b = 0; b < 5; b++) { const off = (hash(seed * 3 + b) - .5) * w * 1.6; g.setLineDash([18 + hash(b + seed) * 30, 6 + hash(b) * 14]); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1] + off) : g.moveTo(p[0], p[1] + off)); g.stroke(); }
  g.restore();
}
const hline = (x0, x1, y, n = 24, wob = 6, s = 1) => [...Array(n + 1)].map((_, i) => [lerp(x0, x1, i / n), y + Math.sin(i * .9 + s) * wob]);
function water(g, t) {
  const t0 = CH[1].t0, u = t - t0; paperTex(g);
  const S = (k, a, b) => seg(u, a, b);
  // sky washes, warm dawn bottom-up
  for (let i = 0; i < 9; i++) stroke(g, hline(-40, W + 40, 120 + i * 95, 30, 10, i), 70, i < 4 ? '#9DB7D6' : i < 7 ? '#F2B38A' : '#F6CF8E', .22, S(0, .05 * i, .4 + .06 * i), 10 + i);
  // the sun, rising
  const sy = lerp(980, 760, ss(seg(u, .4, 6.5))); g.save(); g.globalAlpha = .55 * S(0, .3, 1.2); g.fillStyle = '#F7A85E'; g.beginPath(); g.arc(780, sy, 92, 0, TAU); g.fill(); g.globalAlpha *= .5; g.beginPath(); g.arc(780, sy, 130, 0, TAU); g.fill(); g.restore();
  // the shop: wall wash, roof edge, door frame, awning stripes
  const wx = 150, wy = 900, ww = 780, wh = 640;
  for (let i = 0; i < 8; i++) stroke(g, hline(wx, wx + ww, wy + 30 + i * 80, 20, 4, i * 2), 52, '#D9A85F', .3, S(0, .9 + .06 * i, 1.6 + .06 * i), 30 + i);
  stroke(g, hline(wx - 30, wx + ww + 30, wy, 20, 3), 22, '#7A4E3A', .55, S(0, 1.6, 2.1), 50);
  for (let i = 0; i < 7; i++) { const x = wx + 20 + i * 108; stroke(g, [[x, wy + 40], [x + 54, wy + 40], [x + 108, wy + 40]].map((p, k) => [p[0], p[1] + k * 4]), 36, i % 2 ? '#F4E8D2' : '#C8553D', .55, S(0, 2.0 + .07 * i, 2.4 + .07 * i), 60 + i); }
  // shop opening: warm interior, then the shutter rising (grey-blue strokes sliding up)
  const ox = 260, oy = 1020, ow = 560, oh = 470;
  for (let i = 0; i < 6; i++) stroke(g, hline(ox, ox + ow, oy + 40 + i * 78, 16, 3, i), 44, '#F5C77A', .35, S(0, 2.3, 2.8), 70 + i);
  for (let i = 0; i < 6; i++) { const yy = oy + 40 + i * 70, f = seg(u, 3.2 + .05 * i, 4.3); stroke(g, hline(ox + 10, ox + ow - 10, yy, 14, 2, i), 34, '#5F7895', .5, 1, 80 + i); }
  // shutter goes up: paper-coloured mist washes the shutter away from the bottom, revealing shelves
  const up = ss(seg(u, 3.4, 5.0));
  if (up > 0) { g.save(); g.fillStyle = '#F6EFE2'; g.globalAlpha = .92; g.fillRect(ox, oy + oh * (1 - up), ow, oh * up); g.restore();
    for (let s = 0; s < 3; s++) { const y = oy + 150 + s * 120; if (oy + oh * (1 - up) > y) continue; stroke(g, hline(ox + 30, ox + ow - 30, y, 14, 1, s), 8, '#7A4E3A', .5, 1, 90 + s);
      for (let k = 0; k < 7; k++) stroke(g, [[ox + 60 + k * 72, y - 40], [ox + 62 + k * 72, y - 6]], 18, ['#C8553D', '#5F9C6A', '#E0A43A', '#5F7895'][(k + s) % 4], .55, 1, 100 + k + s * 9); } }
  // street
  for (let i = 0; i < 4; i++) stroke(g, hline(-40, W + 40, 1580 + i * 50, 24, 5, i * 3), 40, '#B9AFA3', .3, S(0, 1.2 + .08 * i, 2.0), 120 + i);
  // the painter's note
  const na = S(0, 4.6, 5.4);
  if (na > 0) { g.save(); g.globalAlpha = na; g.strokeStyle = '#3B3330'; g.lineWidth = 2; g.beginPath(); g.moveTo(820, 1060); g.quadraticCurveTo(900, 990, 920, 900); g.stroke(); g.restore();
    g.save(); g.beginPath(); g.rect(700, 760, 380 * na, 140); g.clip(); txt(g, '5:30 am', 760, 840, '600 64px Caveat', '#3B3330'); txt(g, 'shutter up!', 770, 885, '500 40px Caveat', '#3B3330'); g.restore();
    if (na >= 1) reg('note', '5:30 am shutter up!', 700, 780, 1080, 900); }
}

// ===================== SILENT FILM: an engraved print in a picture house =====================
function silent(g, t) {
  const t0 = CH[2].t0, u = t - t0, f = Math.floor(t * 24);
  // the picture house: red velvet curtains around a 4:3 gate
  g.fillStyle = '#0B0807'; g.fillRect(0, 0, W, H);
  const gx = 40, gy = 560, gw = 1000, gh = 750;
  for (let i = 0; i < 14; i++) { const x = i * 80; const gr = g.createLinearGradient(x, 0, x + 80, 0); gr.addColorStop(0, '#3D0A0C'); gr.addColorStop(.5, '#7A1A1C'); gr.addColorStop(1, '#3D0A0C'); g.fillStyle = gr; g.fillRect(x, 0, 80, gy - 30); }
  g.fillStyle = '#2A0607'; g.fillRect(0, gy - 50, W, 30);
  for (let i = 0; i < 9; i++) { g.fillStyle = '#120C0B'; g.beginPath(); g.arc(70 + i * 120, 1700, 58, Math.PI, 0); g.fill(); g.fillRect(12 + i * 120, 1700, 116, 260); }   // seats
  // the print
  const pc = document.createElement('canvas'); pc.width = gw; pc.height = gh; const p = pc.getContext('2d');
  const wx = (hash(f) - .5) * 4, wy = (hash(f + 5) - .5) * 4, fl = .92 + .1 * hash(f * 3.3);
  const inter = u < 1.8;
  if (inter) {   // intertitle card
    p.fillStyle = '#0E0D0C'; p.fillRect(0, 0, gw, gh); p.strokeStyle = '#CFC8B8'; p.lineWidth = 3; p.strokeRect(50, 50, gw - 100, gh - 100); p.lineWidth = 1; p.strokeRect(64, 64, gw - 128, gh - 128);
    p.fillStyle = '#E8E1D0'; p.font = '600 84px Cormorant'; p.textAlign = 'center'; p.fillText('7:00 A.M.', gw / 2, 300); p.font = 'italic 500 58px Cormorant'; p.fillText('The regulars arrive.', gw / 2, 420);
    for (const [x, y] of [[gw / 2 - 180, 350], [gw / 2 + 180, 350]]) { p.beginPath(); p.moveTo(x - 60, y); p.lineTo(x + 60, y); p.stroke(); }
  } else {   // a wide, locked-off shot: counter, shopkeeper, a regular comes in for milk
    p.fillStyle = '#DAD3C4'; p.fillRect(0, 0, gw, gh);
    p.fillStyle = '#B9B2A3'; p.fillRect(0, 0, gw, 420);   // back wall wash
    p.strokeStyle = 'rgba(30,25,20,.55)'; p.lineWidth = 1.2; for (let x = 0; x < gw; x += 9) { p.beginPath(); p.moveTo(x, 0); p.lineTo(x - 40, 420); p.stroke(); }   // hatching
    p.strokeStyle = '#1A1612'; p.lineWidth = 3; for (let s = 0; s < 3; s++) { p.beginPath(); p.moveTo(80, 110 + s * 100); p.lineTo(920, 110 + s * 100); p.stroke(); for (let k = 0; k < 14; k++) { p.strokeRect(100 + k * 58, 60 + s * 100, 36, 48); } }   // shelves of tins
    p.fillStyle = '#8F8778'; p.fillRect(0, 560, gw, 190); p.strokeStyle = 'rgba(20,16,12,.5)'; for (let x = -200; x < gw; x += 12) { p.beginPath(); p.moveTo(x, 750); p.lineTo(x + 190, 560); p.stroke(); }   // floor
    p.fillStyle = '#5D554A'; p.fillRect(120, 420, 520, 160); p.strokeStyle = '#1A1612'; p.lineWidth = 4; p.strokeRect(120, 420, 520, 160);   // counter
    for (let x = 130; x < 640; x += 8) { p.beginPath(); p.moveTo(x, 430); p.lineTo(x, 570); p.lineWidth = 1; p.stroke(); }
    const fig = (x, y, hat, mous, arm, s = 1) => { p.save(); p.translate(x, y); p.scale(s, s); p.fillStyle = '#1A1612';
      p.beginPath(); p.ellipse(0, -230, 34, 40, 0, 0, TAU); p.fill(); p.fillStyle = '#E3DCCB'; p.beginPath(); p.ellipse(4, -228, 26, 32, 0, 0, TAU); p.fill();
      p.fillStyle = '#1A1612'; p.beginPath(); p.arc(12, -236, 3, 0, TAU); p.fill(); if (mous) { p.fillRect(-2, -212, 26, 6); }
      if (hat) { p.fillRect(-36, -270, 72, 10); p.fillRect(-26, -300, 52, 32); }
      p.beginPath(); p.moveTo(-40, -190); p.lineTo(40, -190); p.lineTo(52, 0); p.lineTo(-52, 0); p.closePath(); p.fill();
      p.strokeStyle = '#1A1612'; p.lineWidth = 16; p.lineCap = 'round'; p.beginPath(); p.moveTo(30, -175); p.lineTo(30 + Math.cos(arm) * 90, -175 + Math.sin(arm) * 90); p.stroke(); p.restore(); };
    const hand = seg(u, 2.6, 3.3) * (1 - seg(u, 3.9, 4.3));
    fig(300, 560, false, true, lerp(1.3, -.15, hand));   // the shopkeeper, apron
    p.fillStyle = '#E3DCCB'; p.fillRect(262, 420, 76, 120);
    const cx = u < 2.6 ? lerp(1100, 700, eo(seg(u, 1.8, 2.6))) : u < 4.4 ? 700 : lerp(700, 1150, seg(u, 4.4, 5.8));
    const tip = u > 3.6 && u < 4.2 ? Math.sin(Math.PI * seg(u, 3.6, 4.2)) * 18 : 0;
    p.save(); p.translate(0, -tip * .2); fig(cx, 700, true, false, lerp(1.3, Math.PI + .2, hand), .95); p.restore();
    // the milk bottle passing between hands
    const bx = lerp(440, 600, seg(u, 3.0, 3.6)), carried = u > 3.6;
    p.fillStyle = '#F4F0E6'; p.strokeStyle = '#1A1612'; p.lineWidth = 3; const bX = carried ? cx - 80 : bx, bY = carried ? 420 : 400; p.beginPath(); p.roundRect(bX - 16, bY - 60, 32, 70, 8); p.fill(); p.stroke();
  }
  // film: silver flicker, weave, scratches, dust, burnt edge
  p.globalCompositeOperation = 'multiply'; p.fillStyle = `rgba(${Math.round(255 * fl)},${Math.round(250 * fl)},${Math.round(238 * fl)},1)`; p.fillRect(0, 0, gw, gh); p.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 3; k++) if (hash(f * 7 + k) > .6) { const x = hash(f * 11 + k) * gw; p.strokeStyle = 'rgba(240,235,220,.5)'; p.lineWidth = 1; p.beginPath(); p.moveTo(x, 0); p.lineTo(x + 6, gh); p.stroke(); }
  for (let k = 0; k < 14; k++) { p.fillStyle = hash(f + k) > .5 ? 'rgba(10,8,6,.6)' : 'rgba(250,245,230,.5)'; p.beginPath(); p.arc(hash(f * 3 + k) * gw, hash(f * 5 + k) * gh, 1 + hash(f + k * 2) * 3, 0, TAU); p.fill(); }
  const vg = p.createRadialGradient(gw / 2, gh / 2, gh * .35, gw / 2, gh / 2, gh * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,12,4,.7)'); p.fillStyle = vg; p.fillRect(0, 0, gw, gh);
  // projector beam glow on the screen edge + the print
  g.save(); g.shadowColor = 'rgba(255,240,210,.35)'; g.shadowBlur = 60; g.drawImage(pc, gx + wx, gy + wy); g.restore();
  if (inter && u > .4) reg('inter', '7:00 A.M. The regulars arrive.', gx, gy, gx + gw, gy + gh);
}

// ===================== RISOGRAPH: two translucent spot inks, halftone, misregistration =====================
let HT = null;
function halftone(size = 9) { if (HT) return HT; const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); x.fillStyle = '#000'; x.beginPath(); x.arc(size / 2, size / 2, size * .36, 0, TAU); x.fill(); HT = c; return c; }
function plate(drawFn) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); drawFn(x); return c; }
function inkPlate(g, mask, col, dx, dy, seed) {   // tint the mask with one ink, add pinholes + feed streaks, multiply it down off-register
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.drawImage(mask, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${.3 + .5 * hash(seed + i)})`; x.fillRect(hash(seed + i * 3) * W, hash(seed + i * 7) * H, 2, 2); }
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, hash(seed + i * 13) * H, W, 3 + hash(i) * 10); }
  g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(c, dx, dy); g.restore();
}
function riso(g, t) {
  const t0 = CH[4].t0, u = twos(t - t0), f = Math.floor(t * 12);
  g.fillStyle = '#F4F0E6'; g.fillRect(0, 0, W, H);
  const dot = halftone();
  // plate 1 (teal): the counter, the clock face, the shopkeeper; plate 2 (pink): the queue, the clock hands, the title
  const steps = Math.floor(clamp((u - .6) / .6) * 3 + 1e-6);   // the queue shuffles forward on each half bar
  const A = plate(x => {
    x.fillStyle = '#000'; x.fillRect(80, 1180, 920, 70); x.fillRect(110, 1250, 860, 300);
    x.fillStyle = x.createPattern(dot, 'repeat'); x.fillRect(0, 1550, W, 370);   // floor tint
    x.fillStyle = '#000'; x.beginPath(); x.arc(540, 520, 230, 0, TAU); x.fill(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(540, 520, 190, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
    x.beginPath(); x.arc(200, 1000, 60, 0, TAU); x.fill(); x.fillRect(140, 1050, 120, 140);   // shopkeeper behind the counter
    x.fillStyle = x.createPattern(dot, 'repeat'); for (let s = 0; s < 3; s++) x.fillRect(80, 860 + s * 90, 300, 26);
  });
  const B = plate(x => {
    x.fillStyle = '#000';
    for (let k = 0; k < 5; k++) { const px = 420 + k * 130 - steps * 130 * (k > 0 ? 1 : 0) * .8 + (k === 0 && steps > 0 ? -1000 : 0), bob = (Math.floor(u * 6 + k) % 2) * 6; if (px < 300) continue;
      x.beginPath(); x.arc(px, 1000 - bob, 48, 0, TAU); x.fill(); x.beginPath(); x.moveTo(px - 60, 1060 - bob); x.lineTo(px + 60, 1060 - bob); x.lineTo(px + 70, 1560); x.lineTo(px - 70, 1560); x.closePath(); x.fill(); }
    x.save(); x.translate(540, 520); x.lineCap = 'round'; x.lineWidth = 26; x.strokeStyle = '#000'; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -150); x.stroke(); x.lineWidth = 34; x.beginPath(); x.moveTo(0, 0); x.lineTo(110, 0); x.stroke(); x.restore();
    x.font = '800 130px Inter'; x.textAlign = 'center'; x.fillText('LUNCH', 540, 230);
    x.fillStyle = x.createPattern(dot, 'repeat'); x.fillRect(0, 0, W, 860);   // pink sky tint
  });
  const j = (k) => [Math.round((hash(f * 3 + k) - .5) * 8), Math.round((hash(f * 5 + k) - .5) * 8)];
  inkPlate(g, A, '#0078BF', 5 + j(1)[0], 3 + j(1)[1], 11);
  inkPlate(g, B, '#FF48B0', -4 + j(2)[0], -2 + j(2)[1], 23);
  reg('riso', 'LUNCH', 200, 100, 880, 260);
}

// ===================== 16-BIT PIXEL RPG: 180×320 framebuffer ×6, indexed palette, text box =====================
const PX = { k: '#140C1C', d: '#442434', b: '#30346D', g: '#4E4A4E', br: '#854C30', gr: '#346524', r: '#D04648', y: '#DAD45E', w: '#DEEED6', s: '#D2AA99', t: '#597DCE', o: '#D27D2C', l: '#6DAA2C', c: '#6DC2CA', p: '#8595A1' };
const FONT5 = { A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110', D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000', G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110', J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111', M: '10001110111010110101100011000110001', N: '10001100011100110101100111000110001', O: '01110100011000110001100011000101110', P: '11110100011000111110100001000010000', R: '11110100011000111110101001001010001', S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110', V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', Y: '10001100010101000100001000010000100', '!': '00100001000010000100001000000000100', '.': '00000000000000000000000000110001100', ',': '00000000000000000000001100010001000', ':': '00000011000110000000011000110000000', ' ': '00000000000000000000000000000000000', '5': '11111100001111000001000011000101110', '0': '01110100011001110101110011000101110', '6': '00110010001000011110100011000101110', '>': '01000001000001000001000100010001000', '?': '01110100010000100010001000000000100', "'": '00100001000100000000000000000000000' };
function pxText(b, s, x, y, col) { b.fillStyle = col; let cx = x; for (const ch of s.toUpperCase()) { const gph = FONT5[ch] || FONT5[' ']; for (let i = 0; i < 35; i++) if (gph[i] === '1') b.fillRect(cx + (i % 5), y + Math.floor(i / 5), 1, 1); cx += 6; } }
function pixel(g, t) {
  const t0 = CH[7].t0, u = t - t0, fr = Math.floor(u * 8);
  const c = document.createElement('canvas'); c.width = 180; c.height = 320; const b = c.getContext('2d');
  const inside = u > 2.6;
  if (!inside) {   // the overworld street at dusk
    b.fillStyle = PX.g; b.fillRect(0, 0, 180, 320);
    for (let y = 0; y < 150; y++) { b.fillStyle = y < 60 ? PX.b : ((y + (y % 2)) % 4 < 2 && y < 90) ? PX.d : PX.o; if (y >= 60 && y < 90) b.fillStyle = (y % 2 === 0) ? PX.d : PX.b; if (y >= 90) b.fillStyle = (y % 3 === 0) ? PX.o : PX.r; b.fillRect(0, y, 180, 1); }   // dithered dusk sky
    b.fillStyle = PX.br; b.fillRect(40, 100, 100, 90); b.fillStyle = PX.r; for (let i = 0; i < 10; i++) b.fillRect(36 + i * 11, 96, 6, 10); b.fillStyle = PX.w; for (let i = 0; i < 10; i++) b.fillRect(42 + i * 11, 96, 5, 10);
    b.fillStyle = PX.y; b.fillRect(78, 140, 24, 50); b.fillStyle = PX.k; b.fillRect(80, 142, 20, 48);   // lit door
    b.fillStyle = PX.y; b.fillRect(80, 142, 20, 48);
    pxText(b, 'SHOP', 78, 112, PX.w);
    for (let x = 0; x < 180; x += 8) for (let y = 190; y < 320; y += 8) { b.fillStyle = (x + y) % 16 ? PX.g : PX.p; b.fillRect(x, y, 8, 8); }   // road tiles
    const kx = Math.round(lerp(-10, 86, seg(u, .3, 2.3))), ky = 230 - Math.round(lerp(0, 40, seg(u, 1.6, 2.4))), step = fr % 2;
    b.fillStyle = PX.t; b.fillRect(kx, ky - 10, 8, 9); b.fillStyle = PX.s; b.fillRect(kx + 1, ky - 17, 6, 6); b.fillStyle = PX.k; b.fillRect(kx + 1, ky - 18, 6, 2); b.fillStyle = PX.b; b.fillRect(kx + (step ? 0 : 1), ky - 1, 3, 3); b.fillRect(kx + (step ? 5 : 4), ky - 1, 3, 3);
    pxText(b, '6:00 PM', 6, 6, PX.w);
  } else {   // inside: shopkeeper behind the counter, dialog box types, then the item fanfare
    b.fillStyle = PX.br; b.fillRect(0, 0, 180, 320); for (let s = 0; s < 3; s++) { b.fillStyle = PX.d; b.fillRect(10, 34 + s * 26, 160, 4); for (let k = 0; k < 9; k++) { b.fillStyle = [PX.r, PX.y, PX.l, PX.c][(k + s) % 4]; b.fillRect(14 + k * 17, 22 + s * 26, 10, 12); } }
    b.fillStyle = PX.o; b.fillRect(0, 128, 180, 30); b.fillStyle = PX.d; b.fillRect(0, 158, 180, 4);
    b.fillStyle = PX.s; b.fillRect(80, 96, 16, 16); b.fillStyle = PX.k; b.fillRect(84, 102, 2, 2); b.fillRect(90, 102, 2, 2); b.fillRect(83, 108, 10, 2); b.fillStyle = PX.w; b.fillRect(76, 112, 24, 16);   // shopkeeper + apron
    b.fillStyle = PX.t; b.fillRect(84, 172, 10, 12); b.fillStyle = PX.s; b.fillRect(85, 164, 8, 8); b.fillStyle = PX.k; b.fillRect(85, 163, 8, 2);   // kid, back view
    const msgs = [["SHARMA: WELCOME", "BACK, HERO!", "SWEETS ARE 5 COINS."], ["> BUY SWEETS", "  LEAVE"]];
    const m = u < 4.8 ? 0 : 1, typed = Math.floor((u - (m ? 4.8 : 2.9)) * 26);
    b.fillStyle = PX.b; b.fillRect(6, 192, 168, 74); b.fillStyle = PX.w; b.fillRect(6, 192, 168, 1); b.fillRect(6, 265, 168, 1); b.fillRect(6, 192, 1, 74); b.fillRect(173, 192, 1, 74);
    let left = typed; msgs[m].forEach((ln, i) => { pxText(b, ln.slice(0, Math.max(0, left)), 12, 202 + i * 14, PX.w); left -= ln.length; });
    if (u > 5.6) { const k = Math.min(1, (u - 5.6) / .2); b.fillStyle = PX.k; b.fillRect(30, 90, 120, 34); b.fillStyle = PX.y; b.fillRect(30, 90, 120, 1); b.fillRect(30, 123, 120, 1); pxText(b, 'GOT: SWEETS!', 54, 104, k > .5 ? PX.y : PX.w);
      for (let s = 0; s < 6; s++) { const a = s / 6 * TAU + u * 3; b.fillStyle = PX.y; b.fillRect(90 + Math.round(Math.cos(a) * 54), 107 + Math.round(Math.sin(a) * 24), 2, 2); } }
  }
  g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H); g.imageSmoothingEnabled = true;
  if (u > 4.0 && u < 4.8) reg('dlg', 'SHARMA: WELCOME BACK, HERO! SWEETS ARE 5 COINS.', 36, 1152, 1044, 1596);
  if (u > 6.0) reg('got', 'GOT: SWEETS!', 180, 540, 900, 744);
}

// ===================== reused chapters: frames from their own projects =====================
const IMG = {};
async function frameOf(id, k) { const n = String(k + 1).padStart(4, '0'), key = id + n; if (!IMG[key]) { const im = new Image(); im.src = `clips/${id}/n_${n}.jpg`; await im.decode().catch(() => {}); IMG[key] = im; for (const kk in IMG) if (kk !== key && kk.startsWith(id)) delete IMG[kk]; } return IMG[key]; }

// ===================== shared overlays: the style label, the caption =====================
function label(g, t, c) {
  const a = ss(seg(t, c.t0 + .05, c.t0 + .3)) * (1 - ss(seg(t, c.t0 + 2.2, c.t0 + 2.6))); if (a <= 0 || c.id === 'title' || c.id === 'end') return;
  g.save(); g.globalAlpha = a; g.font = '700 26px Inter'; g.letterSpacing = '3px'; const s1 = c.style.toUpperCase(), w1 = g.measureText(s1).width; g.font = '500 20px Inter'; g.letterSpacing = '3px'; const s2 = c.cat.toUpperCase(), w2 = g.measureText(s2).width;
  const w = Math.max(w1, w2) + 60, Y = 1760; g.fillStyle = 'rgba(14,14,16,.82)'; g.fillRect(40, Y, w, 104); g.fillStyle = '#E2231A'; g.fillRect(40, Y, 8, 104);
  g.letterSpacing = '0px'; g.restore();
  g.save(); g.globalAlpha = a; txt(g, s1, 72, 1806, '700 26px Inter', '#FFFFFF', 'left', 3); txt(g, s2, 72, 1842, '500 20px Inter', 'rgba(255,255,255,.7)', 'left', 3); g.restore();
  if (a > .9) reg('label' + c.id, s1 + ' ' + s2, 40, 1760, 40 + w, 1864);
}
function caption(g, t) {
  const v = VO.find(v => t >= v.t - .05 && t < v.t1); if (!v) return;
  const a = Math.min(ss(seg(t, v.t - .05, v.t + .15)), 1 - ss(seg(t, v.t1 - .2, v.t1)));
  g.save(); g.font = '600 42px Inter'; const words = v.text.split(' '), ls = ['']; for (const w of words) { const tl = ls[ls.length - 1] ? ls[ls.length - 1] + ' ' + w : w; if (g.measureText(tl).width > 900 && ls[ls.length - 1]) ls.push(w); else ls[ls.length - 1] = tl; }
  const lh = 54, h = 30 + ls.length * lh, w = Math.max(...ls.map(l => g.measureText(l).width)) + 80, x = W / 2 - w / 2, y = H - 200 - h;
  g.globalAlpha = a; g.fillStyle = 'rgba(14,14,16,.82)'; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill();
  g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle'; ls.forEach((l, i) => g.fillText(l, W / 2, y + 15 + lh * (i + .5) + 2)); g.restore();
  reg(v.id, v.text, x, y, x + w, y + h);
}

export async function render(g, t, Q) {
  TX = []; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const c = CH.find(c => t >= c.t0 && t < c.t1) || CH[CH.length - 1];
  if (c.clip) { const k = Math.min(Math.floor((t - c.t0) * 24 + 1e-6), 9999), im = await frameOf(c.clip, k); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); if (im && im.naturalWidth) g.drawImage(im, 0, 0, W, H); }
  else ({ title, water, silent, riso, pixel, end: endCard })[c.id](g, t);
  label(g, t, c);
  if (!(Q && Q.has('nosub'))) caption(g, t);
  const fi = 1 - seg(t, 0, .3), fo = seg(t, DUR - .8, DUR); if (fi > 0 || fo > 0) { g.fillStyle = `rgba(0,0,0,${Math.max(fi, ss(fo))})`; g.fillRect(0, 0, W, H); }
}
export async function texts(g, t, Q) { await render(g, t, Q); return TX; }
export function events() {
  const E = [], e = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  CH.forEach(c => e(c.t0, 'cut', { id: c.id }));
  for (let i = 0; i < 6; i++) e(.3 + i * .6, 'snap');
  e(CH[1].t0 + 3.4, 'shutter'); e(CH[2].t0 + .1, 'projector', { dur: 6 }); e(CH[2].t0 + 3.6, 'clink');
  e(CH[7].t0 + 2.6, 'door'); e(CH[7].t0 + 5.6, 'fanfare');
  CH[9] && [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(i => e(CH[9].t0 + .2 + i * .3, 'snap')); e(CH[9].t0 + 3.6, 'logo');
  VO.forEach(v => e(v.t, 'voice', { id: v.id }));
  return E;
}
