// PawanSetu — "One Small Light". Paper-cut Lightbox, Canvas 2D, 1080×1920 @ 30 fps.
// Each layer: cut silhouette (holes punched), warm top rim, pulp grain, backlight translucency, soft cast shadow, depth blur. Lights bloom.
import { TL, SUBS, DUR as D, LANG } from './timeline.js';
const HI = LANG === 'hi';
export const DUR = D, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.6) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const TAU = Math.PI * 2;
const flick = (t, k = 0) => 1 + .07 * Math.sin(7.3 * t + k) * Math.sin(3.1 * t + k * 1.7);

// ---------- ladder (new-moon night, warm violet) ----------
const SAF = '#F08A24', SAF_D = '#C4661A', SAF_L = '#FFB25E';
const AMBER = '#ffb862', GOLD = '#ffd890';
const L = {
  far: { sp: .22, col: '#6b5aa6', rim: '#b9a3e0', trans: .8 },
  mid: { sp: .55, col: '#45337a', rim: '#9a7fd0', trans: .5 },
  story: { sp: 1, col: '#2a1d4f', rim: '#7d62b8', trans: .25 },
  scoot: { sp: 1, col: '#1d1438', rim: '#6a52a0', trans: .1 },
  front: { sp: 1.35, col: '#0e0a1c', rim: '#4d3a78', trans: .05 },
};

// ---------- the street (story units: x along the strip, y = screen px at rest) ----------
const GROUND = 1580;
const SHOPS = [
  { x: 600, kind: 'halwai', sign: 'MITHAI', hi: 'मिठाई' },
  { x: 1800, kind: 'potter', sign: 'DIYAS', hi: 'दीये' },
  { x: 3000, kind: 'florist', sign: 'PHOOL', hi: 'फूल' },
];
const HOME = { x0: 5360, x1: 5860, top: 1020, door: 5470, win: { x: 5690, y: 1190 } };
const RIDE = TL.RIDE;
function scootX(t) {
  if (t <= RIDE[0][0]) return RIDE[0][1];
  for (let i = 1; i < RIDE.length; i++) if (t <= RIDE[i][0]) return lerp(RIDE[i - 1][1], RIDE[i][1], eio(seg(t, RIDE[i - 1][0], RIDE[i][0])));
  return RIDE[RIDE.length - 1][1];
}
const moving = t => { for (let i = 1; i < RIDE.length; i++) if (t > RIDE[i - 1][0] && t < RIDE[i][0]) return RIDE[i][1] !== RIDE[i - 1][1]; return false; };

// ---------- camera ----------
function camAt(t) {
  if (t < TL.WIPE0 + .375) { const f = eio(seg(t, TL.FLAME, TL.LAMP + .3)); return { x: HOME.win.x - 60 * f, ty: 0, z: lerp(2.6, 1.0, f), py: HOME.win.y, focus: 'story' }; }
  if (t < TL.ARRIVE - .5) { const zf = ss(seg(t, TL.WIPE0 + .375, TL.WIPE0 + .38)); return { x: scootX(t) - 140, ty: 0, z: lerp(1, 1.5, zf), py: 1560, focus: 'story' }; }
  const fA = eio(seg(t, TL.ARRIVE - .5, TL.ARRIVE + .8)), base = lerp(scootX(t) - 120, HOME.door + 120, fA);
  const zin = lerp(1.5, 1.62, ss(seg(t, TL.ARRIVE, TL.TILT0)));
  const tilt = 380 * eio(seg(t, TL.TILT0, TL.TILT1)) * (1 - eio(seg(t, TL.RACK0, TL.RACK1)));
  const z = lerp(zin, 1, eio(seg(t, TL.TILT0, TL.TILT1)));
  return { x: base, ty: tilt, z, py: lerp(1560, 1300, eio(seg(t, TL.TILT0, TL.TILT1))), focus: t > TL.RACK0 ? 'rack' : 'story' };
}
// zoom per layer: near layers scale more on a dolly
const zl = (cam, sp) => 1 + (cam.z - 1) * (.45 + .55 * sp);
function tf(g, cam, sp) { const z = zl(cam, sp); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, cam.py); g.scale(z, z); g.translate(-cam.x * sp, -cam.py + cam.ty * sp); }
function visRange(cam, sp, pad = 300) { const z = zl(cam, sp); return [cam.x * sp - W / 2 / z - pad, cam.x * sp + W / 2 / z + pad]; }

// ---------- lighting state ----------
const lampOn = t => ss(seg(t, TL.LAMP, TL.LAMP + .5));
const layerLit = (t, k) => ss(seg(t, TL.LAMP + .4 * k, TL.LAMP + .4 * k + .5));
function ambient(t) { return t < TL.MATCH ? 0 : Math.max(lerp(0, .16, seg(t, TL.MATCH, TL.FLAME + .3)), lerp(.16, 1, ss(seg(t, TL.LAMP, TL.LAMP + 2.0)))); }
const winLit = (t, x) => ss(seg(t, TL.LAMP + .6 + hash(Math.floor(x / 7)) * 1.8, TL.LAMP + .9 + hash(Math.floor(x / 7)) * 1.8));

// ---------- offscreen canvases ----------
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
let A, B, S, GL, GRAIN, Q4;
// blur at quarter resolution (software canvas blur is the bottleneck)
function soft(main, src, px, ox = 0, oy = 0, alpha = 1, op = 'source-over') {
  const q = Q4.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W / 4, H / 4); q.filter = `blur(${(px / 4).toFixed(2)}px)`; q.drawImage(src, 0, 0, W / 4, H / 4); q.filter = 'none';
  main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = alpha; main.globalCompositeOperation = op; main.imageSmoothingQuality = 'high'; main.drawImage(Q4, ox, oy, W, H); main.restore();
}
function init() {
  A = mk(); B = mk(); S = mk(); GL = mk(); Q4 = document.createElement('canvas'); Q4.width = W / 4; Q4.height = H / 4;
  const n = document.createElement('canvas'); n.width = n.height = 256; const ng = n.getContext('2d'), id = ng.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (hash(i * .37) - .5) * 120 + (hash(Math.floor(i / 4) * 1.3) - .5) * 60; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  ng.putImageData(id, 0, 0); GRAIN = n;
}

// one paper layer: shapes(g) fills the silhouette (current transform); holes(g) are punched; em(g) draws its lights afterwards
function paper(main, glow, cam, t, spec, fns, o = {}) {
  const a = A.getContext('2d'), b = B.getContext('2d'), s = S.getContext('2d');
  a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, H); a.globalCompositeOperation = 'source-over';
  tf(a, cam, spec.sp); a.fillStyle = spec.col; a.beginPath(); fns.shapes(a); a.fill();
  if (fns.holes) { a.globalCompositeOperation = 'destination-out'; a.beginPath(); fns.holes(a); a.fill(); a.globalCompositeOperation = 'source-over'; }
  a.setTransform(1, 0, 0, 1, 0, 0);
  // cast shadow on what is behind
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H); s.globalCompositeOperation = 'source-over'; s.drawImage(A, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = '#05020c'; s.fillRect(0, 0, W, H); s.globalCompositeOperation = 'source-over';
  soft(main, S, 10, 9, 15, .55 * (o.shadow ?? 1));
  // rim on the top edge, paper below
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.globalCompositeOperation = 'source-over'; b.drawImage(A, 0, 0);
  b.globalCompositeOperation = 'source-in'; b.fillStyle = spec.rim; b.fillRect(0, 0, W, H);
  b.globalCompositeOperation = 'source-atop'; b.drawImage(A, 0, 3);
  // backlight translucency (warm, strongest near the light point) + pulp grain
  const lit = o.lit ?? 1, LP = o.lp || [W / 2, 1250 + cam.ty * .4, 1300];
  if (lit > 0) { const gr = b.createRadialGradient(LP[0], LP[1], 0, LP[0], LP[1], LP[2]); gr.addColorStop(0, `rgba(255,184,98,${.55 * spec.trans * lit})`); gr.addColorStop(1, `rgba(255,150,80,${.12 * spec.trans * lit})`); b.fillStyle = gr; b.fillRect(0, 0, W, H); }
  b.globalAlpha = .07; b.fillStyle = b.createPattern(GRAIN, 'repeat'); b.fillRect(0, 0, W, H); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  const bl = o.blur || 0; if (bl > .3) soft(main, B, bl); else { main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.drawImage(B, 0, 0); main.restore(); }
  // lights of this layer: on the picture and in the glow buffer
  if (fns.em) { for (const g of [main, glow]) { g.save(); tf(g, cam, spec.sp); fns.em(g, g === glow); g.restore(); } }
}

// ---------- shape helpers ----------
const R = (g, x, y, w, h) => { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); };
const arch = (g, x, y, w, h) => { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); };
const circ = (g, x, y, r) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); };
function flame(g, x, y, s, t, k, col = GOLD, glowOnly) {
  const f = flick(t, k), h = 22 * s * f;
  if (!glowOnly) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - h); g.bezierCurveTo(x + 9 * s, y - h * .45, x + 8 * s, y, x, y); g.bezierCurveTo(x - 8 * s, y, x - 9 * s, y - h * .45, x, y - h); g.fill(); g.fillStyle = '#fff4d8'; g.beginPath(); g.ellipse(x, y - h * .3, 3 * s, 6 * s, 0, 0, TAU); g.fill(); }
  else { const r = 60 * s * f, gr = g.createRadialGradient(x, y - h * .4, 0, x, y - h * .4, r); gr.addColorStop(0, 'rgba(255,200,110,.9)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(x - r, y - h * .4 - r, 2 * r, 2 * r); flame(g, x, y, s, t, k, col, false); }
}
function diya(g, x, y, s) { g.moveTo(x - 20 * s, y); g.quadraticCurveTo(x, y + 16 * s, x + 20 * s, y); g.lineTo(x + 24 * s, y - 4 * s); g.lineTo(x - 24 * s, y - 4 * s); g.closePath(); }
function lantern(g, x, y, s) {   // akash kandil, a star lantern
  g.moveTo(x, y - 30 * s); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 13 : 30) * s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath();
}

// ---------- sky (moves with the camera; tilt shifts its glow) ----------
function sky(g, cam, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120b26'); gr.addColorStop(.55 + cam.ty / H * .3, '#24163f'); gr.addColorStop(.75 + cam.ty / H * .2, '#7a4a7e'); gr.addColorStop(1, '#a8687a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // stars (no moon: Diwali is on Amavasya)
  for (let i = 0; i < 90; i++) { const x = ((hash(i) * 1600 - cam.x * .05) % 1400 + 1400) % 1400 - 160, y = hash(i + 50) * 1100 + cam.ty * .1; g.fillStyle = `rgba(255,236,200,${.25 + .5 * hash(i + 9) * (.7 + .3 * Math.sin(t * 2 + i))})`; g.fillRect(x, y, 2, 2); }
}

// ---------- far skyline ----------
const far = cam => ({
  shapes(g) {
    const [x0, x1] = visRange(cam, L.far.sp), base = 1180, step = 150;
    R(g, x0 - 200, base - 40, x1 - x0 + 400, 900);
    for (let i = Math.floor(x0 / step); i <= x1 / step; i++) {
      const x = i * step, k = Math.floor(hash(i) * 5), h = 90 + hash(i + 3) * 160;
      if (k === 0) { R(g, x + 20, base - h, 90, h); g.moveTo(x + 15, base - h); g.arc(x + 65, base - h, 50, Math.PI, 0); R(g, x + 62, base - h - 85, 6, 40); }        // dome
      else if (k === 1) { g.moveTo(x + 10, base); g.lineTo(x + 40, base - h - 120); g.quadraticCurveTo(x + 62, base - h - 175, x + 84, base - h - 120); g.lineTo(x + 114, base); g.closePath(); R(g, x + 60, base - h - 200, 4, 40); }   // temple shikhara
      else if (k === 2) { R(g, x + 60, base - h - 60, 10, h + 60); for (let j = 0; j < 6; j++) { const a = Math.PI + .3 + j * .5; g.moveTo(x + 65, base - h - 60); g.quadraticCurveTo(x + 65 + Math.cos(a) * 50, base - h - 90 + Math.sin(a) * 30, x + 65 + Math.cos(a) * 80, base - h - 50 + Math.sin(a) * 40); g.lineTo(x + 65 + Math.cos(a) * 78, base - h - 44 + Math.sin(a) * 40); g.closePath(); } }  // palm
      else R(g, x + 10, base - h, 120, h);
    }
  },
  holes(g) { const [x0, x1] = visRange(cam, L.far.sp), base = 1180; for (let i = Math.floor(x0 / 150); i <= x1 / 150; i++) if (Math.floor(hash(i) * 5) >= 3) { const h = 90 + hash(i + 3) * 160; for (let j = 0; j < 3; j++) R(g, i * 150 + 30 + j * 32, base - h + 30, 10, 14); } },
  em(g) { /* far windows glow through holes via the backlight */ },
});

// ---------- mid houses: lanterns, string lights ----------
const mid = (cam, t) => {
  const base = 1400, step = 240, [x0, x1] = visRange(cam, L.mid.sp);
  const H_ = i => 260 + hash(i * 1.7) * 170;
  return {
    shapes(g) { R(g, x0 - 200, base - 10, x1 - x0 + 400, 700);
      for (let i = Math.floor(x0 / step) - 1; i <= x1 / step + 1; i++) { const x = i * step, h = H_(i); R(g, x + 6, base - h, step - 12, h); for (let c = 0; c < 6; c++) R(g, x + 10 + c * 38, base - h - 18, 20, 18); R(g, x + 30, base - h * .55, step - 70, 10); } },
    holes(g) { for (let i = Math.floor(x0 / step) - 1; i <= x1 / step + 1; i++) { const x = i * step, h = H_(i); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) arch(g, x + 34 + c * 62, base - h + 50 + r * 120, 34, 60); } },
    em(g, isGlow) {
      for (let i = Math.floor(x0 / step) - 1; i <= x1 / step + 1; i++) { const x = i * step, h = H_(i);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const wl = winLit(t, x + r * 3 + c); if (wl <= 0) continue; g.globalAlpha = wl * (isGlow ? .35 : .8) * (.8 + .2 * flick(t, i + c)); g.fillStyle = AMBER; g.beginPath(); arch(g, x + 34 + c * 62, base - h + 50 + r * 120, 34, 60); g.fill(); }
        g.globalAlpha = 1;
        // a star lantern hanging from every other roof
        if (hash(i + 7) > .4) { const lx = x + step * .5, ly = base - h + 30 + Math.sin(t * 1.3 + i) * 3, lo = winLit(t, x + 99); if (lo > 0) { g.strokeStyle = 'rgba(30,20,50,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, base - h); g.lineTo(lx, ly - 30); g.stroke(); g.globalAlpha = lo; g.fillStyle = hash(i) > .5 ? '#ff9a6a' : GOLD; g.beginPath(); lantern(g, lx, ly, .9); g.fill(); g.globalAlpha = 1; } }
        // string lights sagging to the next house
        const sl = winLit(t, x + 55); if (sl > 0) for (let j = 0; j <= 10; j++) { const u = j / 10, px = x + 12 + u * step, py = base - h + 8 + Math.sin(Math.PI * u) * 46; g.globalAlpha = sl * (.55 + .45 * (Math.sin(t * 3 + j * 1.7 + i) > 0 ? 1 : .4)); g.fillStyle = j % 3 === 0 ? '#ff8f70' : GOLD; g.beginPath(); circ(g, px, py, 5); g.fill(); }
        g.globalAlpha = 1;
      }
    },
  };
};

// ---------- story layer: shops, filler houses, home ----------
function shopkeeper(g, x, y, arm) {   // jointed silhouette: body + one arm rotating at the shoulder
  g.beginPath(); circ(g, x, y - 150, 24); g.moveTo(x - 40, y); g.lineTo(x - 34, y - 112); g.quadraticCurveTo(x, y - 132, x + 34, y - 112); g.lineTo(x + 40, y); g.closePath(); g.fill();
  g.save(); g.translate(x + 28, y - 108); g.rotate(-arm); g.beginPath(); R(g, 0, -9, 70, 18); circ(g, 72, 0, 11); g.fill(); g.restore();
}
function boxShape(g, x, y, w, h) { R(g, x - w / 2, y - h, w, h); }
const story = (cam, t) => {
  const [x0, x1] = visRange(cam, 1, 500);
  const fillers = [];
  for (let x = 1100; x < 5300; x += 300) if (!SHOPS.some(s => Math.abs(s.x - x) < 520)) fillers.push(x);
  const fh = x => 300 + hash(x) * 120;
  const handArm = (i) => { const bt = TL.BOX[i]; return Math.sin(Math.PI * seg(t, bt - .9, bt - .1)) * 1.1; };
  return {
    shapes(g) {
      R(g, x0, GROUND, x1 - x0, 400);
      for (const s of SHOPS) { if (s.x < x0 - 400 || s.x > x1 + 400) continue; R(g, s.x - 240, GROUND - 440, 480, 440);
        for (let j = 0; j < 9; j++) { g.moveTo(s.x - 270 + j * 60, GROUND - 330); g.arc(s.x - 240 + j * 60, GROUND - 330, 30, Math.PI, 0); }   // scalloped awning edge
        R(g, s.x - 270, GROUND - 370, 540, 40); R(g, s.x - 200, GROUND - 120, 400, 30); }
      for (const x of fillers) { if (x < x0 - 300 || x > x1 + 300) continue; const h = fh(x); R(g, x - 125, GROUND - h, 250, h); R(g, x - 140, GROUND - h - 16, 280, 16); }
      if (HOME.x1 > x0 && HOME.x0 < x1) { R(g, HOME.x0, HOME.top, HOME.x1 - HOME.x0, GROUND - HOME.top); R(g, HOME.x0 - 20, HOME.top - 30, HOME.x1 - HOME.x0 + 40, 30); for (let c = 0; c < 12; c++) R(g, HOME.x0 - 10 + c * 44, HOME.top - 60, 24, 30);
        R(g, HOME.x0 - 10, GROUND - 330, HOME.x1 - HOME.x0 + 20, 22); R(g, HOME.door - 110, GROUND - 26, 220, 26); }
    },
    holes(g) {
      for (const s of SHOPS) { if (s.x < x0 - 400 || s.x > x1 + 400) continue; R(g, s.x - 200, GROUND - 320, 400, 200); R(g, s.x - 150, GROUND - 425, 300, 46); }
      for (const x of fillers) { if (x < x0 - 300 || x > x1 + 300) continue; const h = fh(x); R(g, x - 30, GROUND - 190, 60, 190); arch(g, x - 95, GROUND - h + 40, 44, 74); arch(g, x + 51, GROUND - h + 40, 44, 74); }
      if (HOME.x1 > x0 && HOME.x0 < x1) { arch(g, HOME.win.x - 70, HOME.win.y - 120, 140, 190); arch(g, HOME.door - 70, GROUND - 270, 140, 244); arch(g, HOME.x0 + 50, HOME.top + 70, 90, 130); }
    },
    em(g, isGlow) {
      const lit = lampOn(t);
      for (const [i, s] of SHOPS.entries()) { if (s.x < x0 - 400 || s.x > x1 + 400) continue;
        // interior glow, the sign burning through, goods, the shopkeeper
        g.globalAlpha = lit * (isGlow ? .3 : .9); g.fillStyle = '#f7b25a'; g.fillRect(s.x - 200, GROUND - 320, 400, 200);
        g.fillStyle = '#ffe2a0'; g.fillRect(s.x - 150, GROUND - 425, 300, 46);
        g.globalAlpha = lit; g.fillStyle = L.story.col; g.font = HI ? '400 40px Tiro' : '700 38px Cormorant'; g.textAlign = 'center'; g.letterSpacing = HI ? '0px' : '8px'; g.fillText(HI ? s.hi : s.sign, s.x, GROUND - (HI ? 391 : 389)); g.letterSpacing = '0px';
        if (!isGlow) { g.fillStyle = L.story.col; shopkeeper(g, s.x - 60, GROUND - 120, handArm(i) + .25);
          if (s.kind === 'halwai') for (let j = 0; j < 3; j++) { g.beginPath(); g.ellipse(s.x + 60 + j * 46, GROUND - 128, 22, 7, 0, 0, TAU); for (let k = 0; k < 4; k++) circ(g, s.x + 46 + j * 46 + (k % 2) * 14, GROUND - 140 - (k > 1 ? 12 : 0), 8); g.fill(); }
          if (s.kind === 'florist') { g.strokeStyle = L.story.col; g.lineWidth = 2; for (let j = 0; j < 6; j++) { const gx = s.x - 180 + j * 70; g.beginPath(); g.moveTo(gx, GROUND - 320); g.lineTo(gx, GROUND - 190); g.stroke(); } } }
        if (s.kind === 'potter') for (let j = 0; j < 7; j++) { const dx = s.x + 10 + (j % 4) * 44, dy = GROUND - 128 - Math.floor(j / 4) * 46; if (!isGlow) { g.fillStyle = L.story.col; g.beginPath(); diya(g, dx, dy, .8); g.fill(); } flame(g, dx, dy - 4, .7 * lit, t, j, GOLD, isGlow); }
        if (s.kind === 'florist') for (let j = 0; j < 6; j++) for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? '#ffb347' : '#ff8c2a'; g.beginPath(); circ(g, s.x - 180 + j * 70, GROUND - 305 + k * 17, 8); g.fill(); }
        g.globalAlpha = 1;
      }
      for (const x of fillers) { if (x < x0 - 300 || x > x1 + 300) continue; const h = fh(x), wl = winLit(t, x);
        g.globalAlpha = wl * (isGlow ? .35 : .85); g.fillStyle = AMBER; g.beginPath(); R(g, x - 30, GROUND - 190, 60, 190); arch(g, x - 95, GROUND - h + 40, 44, 74); arch(g, x + 51, GROUND - h + 40, 44, 74); g.fill();
        for (const dx of [-90, 90]) { if (!isGlow) { g.fillStyle = L.story.col; g.beginPath(); diya(g, x + dx, GROUND - 4, .8); g.fill(); } flame(g, x + dx, GROUND - 8, .7 * wl, t, x + dx, GOLD, isGlow); }
        g.globalAlpha = 1; }
      if (HOME.x1 > x0 && HOME.x0 < x1) home(g, isGlow, t);
    },
  };
};
// the home: her window (the first flame), the door, diyas along the parapet and steps
const HOME_DIYAS = [...Array(8)].map((_, i) => i < 5 ? [HOME.x0 + 30 + i * 105, GROUND - 330] : [HOME.door - 90 + (i - 5) * 90, GROUND - 26]);
function home(g, isGlow, t) {
  const amb = lampOn(t), fl = seg(t, TL.FLAME - .05, TL.FLAME + .25);
  // window: dim before the match, warm after
  g.globalAlpha = Math.max(fl * .75, amb) * (isGlow ? .5 : .85); g.fillStyle = '#f2a050'; g.beginPath(); arch(g, HOME.win.x - 70, HOME.win.y - 120, 140, 190); g.fill(); g.globalAlpha = 1;
  if (!isGlow) { g.fillStyle = L.story.col; g.beginPath(); diya(g, HOME.win.x, HOME.win.y + 62, 1.1); R(g, HOME.win.x - 80, HOME.win.y + 66, 160, 12); g.fill(); }
  if (t > TL.MATCH && t < TL.FLAME + .1) { const m = seg(t, TL.MATCH, TL.FLAME + .1); g.globalAlpha = 1 - m; g.fillStyle = '#fff2d0'; g.beginPath(); circ(g, HOME.win.x + 30 - 20 * m, HOME.win.y + 20, 8 + 30 * m); g.fill(); g.globalAlpha = 1; }
  if (fl > 0) flame(g, HOME.win.x, HOME.win.y + 56, 1.3 * fl, t, 1, GOLD, isGlow);
  // door + the other window
  const dl = Math.max(amb * .7, seg(t, TL.ARRIVE - .5, TL.ARRIVE + .3));
  g.globalAlpha = dl * (isGlow ? .4 : .9); g.fillStyle = '#f7b25a'; g.beginPath(); arch(g, HOME.door - 70, GROUND - 270, 140, 244); arch(g, HOME.x0 + 50, HOME.top + 70, 90, 130); g.fill(); g.globalAlpha = 1;
  // the family at the door
  const fa = seg(t, TL.ARRIVE - .4, TL.ARRIVE + .2);
  if (fa > 0 && !isGlow) { g.globalAlpha = fa; g.fillStyle = L.story.col; const mx = HOME.door - 20, reach = Math.sin(Math.PI * seg(t, TL.HANDOVER - .6, TL.HANDOVER + .4)) * .9 + (t > TL.HANDOVER ? .5 : 0);
    g.beginPath(); circ(g, mx, GROUND - 198, 22); g.moveTo(mx - 36, GROUND - 26); g.lineTo(mx - 26, GROUND - 160); g.quadraticCurveTo(mx, GROUND - 178, mx + 26, GROUND - 160); g.lineTo(mx + 46, GROUND - 26); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(mx - 22, GROUND - 210); g.quadraticCurveTo(mx - 40, GROUND - 150, mx - 34, GROUND - 120); g.lineTo(mx - 22, GROUND - 150); g.fill();   // dupatta
    g.save(); g.translate(mx - 22, GROUND - 156); g.rotate(Math.PI - reach); g.beginPath(); R(g, 0, -8, 62, 16); g.fill(); g.restore();
    g.beginPath(); circ(g, mx + 52, GROUND - 120, 16); R(g, mx + 38, GROUND - 106, 28, 80); g.fill(); g.globalAlpha = 1; }
  // diyas along the house, lit one by one
  HOME_DIYAS.forEach(([x, y], i) => { const on = seg(t, TL.DIYAS[i], TL.DIYAS[i] + .2); if (!isGlow) { g.fillStyle = L.story.col; g.beginPath(); diya(g, x, y, 1); g.fill(); } if (on > 0) flame(g, x, y - 5, on, t, i * 2.3, GOLD, isGlow); });
}

// ---------- the scooter + saffron boxes ----------
function boxesOnRack(t) { return TL.BOX.filter(b => t >= b).length - (t >= TL.HANDOVER ? 3 : 0); }
const scooter = (cam, t) => {
  const x = scootX(t), mv = moving(t), bob = mv ? Math.sin(t * 25) * 1.5 : 0, y = GROUND - bob;
  return {
    shapes(g) {
      circ(g, x - 78, GROUND - 34, 34); circ(g, x + 70, GROUND - 34, 34);
      g.moveTo(x - 120, y - 50); g.lineTo(x - 20, y - 62); g.lineTo(x + 30, y - 40); g.lineTo(x + 70, y - 50); g.lineTo(x + 95, y - 150); g.lineTo(x + 110, y - 152); g.lineTo(x + 92, y - 40); g.lineTo(x + 104, y - 30); g.lineTo(x - 116, y - 26); g.closePath();
      R(g, x - 110, y - 92, 100, 30); R(g, x - 132, y - 110, 70, 12);                                       // seat, rack
      circ(g, x - 30, y - 222, 24); g.moveTo(x - 58, y - 92); g.lineTo(x - 50, y - 190); g.quadraticCurveTo(x - 30, y - 205, x - 6, y - 190); g.lineTo(x + 6, y - 92); g.closePath();   // rider
      g.moveTo(x - 10, y - 180); g.lineTo(x + 96, y - 150); g.lineTo(x + 92, y - 136); g.lineTo(x - 14, y - 160); g.closePath(); R(g, x - 4, y - 92, 24, 58);
    },
    holes(g) { for (const wx of [x - 78, x + 70]) { const sp = mv ? t * 9 : 0; for (let k = 0; k < 5; k++) { const a = sp + k * TAU / 5; g.moveTo(wx, GROUND - 34); g.arc(wx, GROUND - 34, 24, a, a + .7); g.closePath(); } } },
    em(g, isGlow) {
      if (isGlow) { const hl = lampOn(t); g.globalAlpha = .5 * hl; const gr = g.createRadialGradient(x + 112, y - 128, 0, x + 112, y - 128, 70); gr.addColorStop(0, 'rgba(255,230,170,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(x + 40, y - 200, 150, 150); g.globalAlpha = 1; return; }
      const n = boxesOnRack(t);
      for (let j = 0; j < n; j++) saffBox(g, x - 97, y - 110 - j * 46, 64, 44, j);
      // a box flying from the shop counter onto the rack
      TL.BOX.forEach((bt, i) => { const f = seg(t, bt - .55, bt); if (f <= 0 || f >= 1) return; const s = SHOPS[i], u = eio(f), bx = lerp(s.x + 20, x - 97, u), by = lerp(GROUND - 140, y - 110 - i * 46, u) - Math.sin(Math.PI * u) * 120; saffBox(g, bx, by, 64, 44, i); });
      // handover: the boxes go to her hands, then the lid opens
      if (t >= TL.HANDOVER - .5 && t < TL.HANDOVER) { const u = eio(seg(t, TL.HANDOVER - .5, TL.HANDOVER)); for (let j = 0; j < 3; j++) saffBox(g, lerp(x - 97, HOME.door - 92, u), lerp(y - 110 - j * 46, GROUND - 120 - j * 40, u) - Math.sin(Math.PI * u) * 60, 64, 44, j); }
    },
  };
};
function saffBox(g, x, y, w, h, j) { g.fillStyle = SAF; g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = SAF_L; g.fillRect(x - w / 2, y - h, w, 4); g.fillStyle = SAF_D; g.fillRect(x - w / 2, y - 5, w, 5); g.fillStyle = '#fff1dc'; g.font = '700 16px Cormorant'; g.textAlign = 'center'; g.fillText('PS', x, y - h / 2 + 6); }
function heldBoxes(g, glow, cam, t) {   // after the handover: the stack in her arms, the lid, the burst
  if (t < TL.HANDOVER) return; const x = HOME.door - 92, y = GROUND - 120, lid = eo(seg(t, TL.LID, TL.LID + .4));
  for (const c of [g, glow]) { c.save(); tf(c, cam, 1);
    if (c === g) { for (let j = 0; j < 3; j++) saffBox(c, x, y - j * 40, 64, 40, j); c.save(); c.translate(x + 32, y - 120); c.rotate(-1.9 * lid); c.fillStyle = SAF_D; c.fillRect(-64, -8, 64, 8); c.restore(); }
    if (lid > 0) { const r = 260 * eo(seg(t, TL.LID, TL.LID + 1.2)), a = 1 - .6 * seg(t, TL.LID + 1.0, TL.LID + 3.0), gr = c.createRadialGradient(x, y - 125, 0, x, y - 125, r); gr.addColorStop(0, `rgba(255,236,180,${a})`); gr.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = gr; c.fillRect(x - r, y - 125 - r, 2 * r, 2 * r); }
    c.restore(); }
}

// ---------- front layer: toran on top, rangoli band + diyas at the bottom; also the wipe curtain ----------
const front = (cam, t) => {
  const [x0, x1] = visRange(cam, L.front.sp, 400), base = 1720;
  return {
    shapes(g) {
      R(g, x0, base, x1 - x0, 400);
      for (let x = Math.floor(x0 / 80) * 80; x < x1; x += 80) { g.moveTo(x, base + 1); g.arc(x + 40, base + 1, 40, Math.PI, 0); }
      // toran: marigold strings sagging from the top edge
      const ty = -cam.ty * L.front.sp;
      for (let x = Math.floor(x0 / 360) * 360; x < x1; x += 360) for (let j = 0; j <= 14; j++) { const u = j / 14; circ(g, x + u * 360, ty + 30 + Math.sin(Math.PI * u) * 90, 13); if (j % 3 === 1) for (let k = 1; k < 5; k++) circ(g, x + u * 360, ty + 30 + Math.sin(Math.PI * u) * 90 + k * 24, 10 - k); }
      R(g, x0, ty - 200, x1 - x0, 214);
    },
    holes(g) { for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) { g.moveTo(x + 80, base + 70); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.lineTo(x + 80 + Math.cos(a) * 26, base + 100 + Math.sin(a) * 26); g.lineTo(x + 80 + Math.cos(a + TAU / 16) * 10, base + 100 + Math.sin(a + TAU / 16) * 10); } g.closePath(); } },
    em(g, isGlow) {
      const lit = Math.max(lampOn(t), .0);
      for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) { g.globalAlpha = .6 * lit; g.fillStyle = '#ff9e4a'; g.beginPath(); circ(g, x + 80, base + 100, 30); g.fill(); g.globalAlpha = 1; }
      for (let x = Math.floor(x0 / 320) * 320 + 160; x < x1; x += 320) { if (!isGlow) { g.fillStyle = L.front.col; g.beginPath(); diya(g, x, base - 2, 1.4); g.fill(); } flame(g, x, base - 8, 1.25 * lit, t, x * .01, GOLD, isGlow); }
    },
  };
};
function curtain(g, cam, t) {   // near-plane wipe: a dark banyan sheet sweeping across
  const f = seg(t, TL.WIPE0, TL.WIPE1); if (f <= 0 || f >= 1) return;
  const cx = lerp(W + 900, -900, eio(f));
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#07040f'; g.beginPath();
  R(g, cx - 640, -100, 1280, H + 200);
  for (let k = 0; k < 14; k++) { circ(g, cx - 640 + hash(k) * 60 - 30, k * 150, 120 + hash(k + 3) * 60); circ(g, cx + 640 + hash(k + 9) * 60 - 30, k * 150 + 70, 120 + hash(k + 5) * 60); }
  g.fill();
}

// ---------- fireworks in the sky (paper petals that burst out on their axis) ----------
function bursts(g, glow, cam, t) {
  TL.BURSTS.forEach((bt, i) => {
    const up = seg(t, bt - .7, bt), f = seg(t, bt, bt + 2.0); if (t < bt - .7 || f >= 1) return;
    const cx = (HI ? [540, 250, 830, 300, 790] : [540, 300, 800, 420, 700, 540])[i], cy = (HI ? [520, 280, 300, 400, 250] : [520, 380, 430, 640, 300, 470])[i] + cam.ty * .3, col = ['#ffd27a', '#ff9f8a', '#ffc46a', '#ffe6a8', '#ff8f6a', '#ffd27a'][i];
    for (const c of [g, glow]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (up < 1) { c.globalAlpha = 1; c.fillStyle = GOLD; c.beginPath(); circ(c, cx, lerp(H, cy, eo(up)), 4); c.fill(); }
      else { const r = 230 * eo(f) * (i === 0 ? 1.25 : 1), a = 1 - ss(seg(f, .45, 1)), n = 18;
        c.globalAlpha = a; c.fillStyle = col;
        for (let k = 0; k < n; k++) { const ang = k * TAU / n + i; c.save(); c.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r + f * f * 60); c.rotate(ang); c.beginPath(); c.moveTo(14, 0); c.quadraticCurveTo(0, 7, -40 * (1 - f * .6), 0); c.quadraticCurveTo(0, -7, 14, 0); c.fill(); c.restore(); }
        c.beginPath(); for (let k = 0; k < n; k++) { const ang = (k + .5) * TAU / n + i; circ(c, cx + Math.cos(ang) * r * .55, cy + Math.sin(ang) * r * .55 + f * f * 40, 5); } c.fill(); }
      c.restore(); }
  });
}

// ---------- the greeting, as paper strips that write themselves ----------
function greeting(g, glow, t) {
  if (HI) return greetingHi(g, glow, t);
  const items = [
    { s: 'शुभ दीपावली', font: '400 92px Tiro', y: 690, t0: TL.HINDI + .3, d: .9, col: '#ffd9a0' },
    { s: 'Happy Diwali', font: '600 128px Cormorant', y: 840, t0: TL.HAPPY, d: 1.1, col: '#fbe9cc' },
    { s: 'from PawanSetu', font: '500 italic 54px Cormorant', y: 930, t0: TL.FROM, d: .8, col: '#f6dcb4' },
  ];
  const ga = 1 - .0 * seg(t, TL.RACK0, TL.RACK1);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const bl = 9 * ss(seg(t, TL.RACK0, TL.RACK1)); if (bl > .3) g.filter = `blur(${bl}px)`;
  for (const it of items) { const f = seg(t, it.t0, it.t0 + it.d); if (f <= 0) continue;
    g.font = it.font; g.textAlign = 'center'; const tw = g.measureText(it.s).width, x0 = W / 2 - tw / 2 - 10;
    g.save(); g.beginPath(); g.rect(x0, it.y - 160, (tw + 20) * eo(f), 220); g.clip();
    g.fillStyle = 'rgba(5,2,12,.5)'; g.filter = `blur(${8 + bl}px)`; g.fillText(it.s, W / 2 + 8, it.y + 12);          // shadow on the sky panel
    g.filter = bl > .3 ? `blur(${bl}px)` : 'none'; g.fillStyle = '#fff3d6'; g.fillText(it.s, W / 2, it.y - 2); g.fillStyle = it.col; g.fillText(it.s, W / 2, it.y);   // rim + paper
    g.restore();
  }
  // the seal
  const sa = seg(t, TL.FROM + .6, TL.FROM + .9);
  if (sa > 0) { const sx = W / 2 + 230, sy = 912, sc = back(sa); g.save(); g.translate(sx, sy); g.scale(sc, sc); g.rotate(-.12); g.fillStyle = SAF; g.beginPath(); circ(g, 0, 0, 38); g.fill(); g.strokeStyle = '#fff1dc'; g.lineWidth = 2.5; g.beginPath(); circ(g, 0, 0, 30); g.stroke(); g.fillStyle = '#fff1dc'; g.font = '400 40px Tiro'; g.textAlign = 'center'; g.fillText('प', 0, 13); g.restore(); }
  g.restore();
  glow.save(); glow.setTransform(1, 0, 0, 1, 0, 0); glow.globalAlpha = .25 * seg(t, TL.HAPPY, TL.HAPPY + 1); glow.fillStyle = '#ffcf8a'; glow.font = '600 128px Cormorant'; glow.textAlign = 'center'; glow.fillText('Happy Diwali', W / 2, 840); glow.restore();
}

// ---------- Hindi ending: the greeting, then a fireworks logo reveal (sparks gather into the wordmark) ----------
const LOGO = { s: 'पवनसेतु', font: '400 132px Tiro', y: 770 };
let TGT = null;
function logoTargets() {   // ~640 points sampled from the wordmark's pixels, deterministic order
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.font = LOGO.font; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(LOGO.s, W / 2, LOGO.y);
  const d = x.getImageData(0, 0, W, H).data, pts = [];
  for (let y = LOGO.y - 150; y < LOGO.y + 50; y += 3) for (let xx = 100; xx < W - 100; xx += 3) if (d[(y * W + xx) * 4 + 3] > 140) pts.push([xx, y]);
  pts.sort((a, b) => hash(a[0] * 7.1 + a[1] * 3.3) - hash(b[0] * 7.1 + b[1] * 3.3));
  return pts.slice(0, 1100);
}
function paperText(g, s, font, x, y, f, col, rimCol = '#fff3d6') {   // a paper strip that writes itself from its left edge
  if (f <= 0) return; g.save(); g.font = font; g.textAlign = 'center'; const tw = g.measureText(s).width;
  g.beginPath(); g.rect(x - tw / 2 - 10, y - 170, (tw + 20) * eo(f), 240); g.clip();
  g.fillStyle = 'rgba(5,2,12,.5)'; g.filter = 'blur(8px)'; g.fillText(s, x + 8, y + 12); g.filter = 'none';
  g.fillStyle = rimCol; g.fillText(s, x, y - 2); g.fillStyle = col; g.fillText(s, x, y); g.restore();
}
function greetingHi(g, glow, t) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  paperText(g, 'शुभ दीपावली', '400 124px Tiro', W / 2, 470, seg(t, TL.HINDI, TL.HINDI + 1.0), '#ffd9a0');
  paperText(g, 'Happy Diwali', '600 64px Cormorant', W / 2, 560, seg(t, TL.HAPPY, TL.HAPPY + .7), '#fbe9cc');
  // the logo rocket
  const up = seg(t, TL.LOGO_LAUNCH, TL.LOGO_BURST), C = [W / 2, LOGO.y - 50];
  if (t > TL.LOGO_LAUNCH && up < 1) for (const c of [g, glow]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = GOLD; c.beginPath(); circ(c, C[0], lerp(H, C[1], eo(up)), 5); c.fill(); c.restore(); }
  // sparks: burst out, then gather into the wordmark, then fade as the paper appears
  if (t >= TL.LOGO_BURST && t < TL.LOGO_FORM + .8) {
    if (!TGT) TGT = logoTargets();
    const pos = (tt, i, tx, ty) => { const f1 = eo(seg(tt, TL.LOGO_BURST, TL.LOGO_BURST + .6)), f2 = eio(seg(tt, TL.LOGO_BURST + .6, TL.LOGO_FORM)), a = hash(i * 1.3) * TAU, r = (140 + hash(i * 2.9) * 340) * f1;
      return [lerp(C[0] + Math.cos(a) * r, tx, f2), lerp(C[1] + Math.sin(a) * r + f1 * f1 * 40 * (1 - f2), ty, f2)]; };
    const fa = 1 - ss(seg(t, TL.LOGO_FORM + .1, TL.LOGO_FORM + .8)), fl = 1 - seg(t, TL.LOGO_BURST, TL.LOGO_BURST + .35);
    for (const c of [g, glow]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (fl > 0) { const gr = c.createRadialGradient(C[0], C[1], 0, C[0], C[1], 260); gr.addColorStop(0, `rgba(255,240,200,${fl})`); gr.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = gr; c.fillRect(C[0] - 260, C[1] - 260, 520, 520); }
      c.globalAlpha = fa; c.lineCap = 'round';
      TGT.forEach(([tx, ty], i) => { const [x, y] = pos(t, i, tx, ty), [px, py] = pos(t - .07, i, tx, ty), tw = .7 + .3 * Math.sin(t * 24 + i);
        const col = i % 5 === 0 ? '#ffffff' : i % 3 ? GOLD : SAF_L;
        c.strokeStyle = col; c.globalAlpha = fa * .45; c.lineWidth = 2.2; c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
        c.globalAlpha = fa; c.fillStyle = col; c.fillRect(x - 2.4 * tw, y - 2.4 * tw, 4.8 * tw, 4.8 * tw); });
      c.restore(); }
  }
  // the wordmark settles into saffron paper; Latin name and the seal follow
  const pa = ss(seg(t, TL.LOGO_PAPER, TL.LOGO_PAPER + .5));
  if (pa > 0) { g.save(); g.globalAlpha = pa; g.font = LOGO.font; g.textAlign = 'center'; g.fillStyle = 'rgba(5,2,12,.5)'; g.filter = 'blur(9px)'; g.fillText(LOGO.s, W / 2 + 9, LOGO.y + 13); g.filter = 'none';
    g.fillStyle = SAF_L; g.fillText(LOGO.s, W / 2, LOGO.y - 3); g.fillStyle = SAF; g.fillText(LOGO.s, W / 2, LOGO.y); g.restore();
    glow.save(); glow.setTransform(1, 0, 0, 1, 0, 0); glow.globalAlpha = .35 * pa; glow.font = LOGO.font; glow.textAlign = 'center'; glow.fillStyle = '#ffb25e'; glow.fillText(LOGO.s, W / 2, LOGO.y); glow.restore(); }
  paperText(g, 'PawanSetu', 'italic 500 50px Cormorant', W / 2, LOGO.y + 72, seg(t, TL.LOGO_LATIN, TL.LOGO_LATIN + .6), '#f6dcb4');
  const sa = seg(t, TL.LOGO_SEAL, TL.LOGO_SEAL + .3);
  if (sa > 0) { g.font = LOGO.font; const sx = W / 2 + g.measureText(LOGO.s).width / 2 + 62, sy = LOGO.y - 52, sc = back(sa); g.save(); g.translate(sx, sy); g.scale(sc, sc); g.rotate(-.12); g.fillStyle = SAF; g.beginPath(); circ(g, 0, 0, 40); g.fill(); g.strokeStyle = '#fff1dc'; g.lineWidth = 2.5; g.beginPath(); circ(g, 0, 0, 32); g.stroke(); g.fillStyle = '#fff1dc'; g.font = '400 44px Tiro'; g.textAlign = 'center'; g.fillText('प', 0, 14); g.restore(); }
  g.restore();
}

// ---------- subtitles: warm off-white serif on the dark front band ----------
function subtitle(g, s, t) {
  const a = seg(t, s.t0 - .15, s.t0 + .25) * (1 - seg(t, s.t1, s.t1 + .3)); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.font = HI ? '400 50px Tiro' : '600 54px Cormorant'; g.textAlign = 'center';
  const tw = g.measureText(s.text).width, y = H - 64;
  if (tw > 980) console.warn('subtitle too wide', s.id, tw);
  const gr = g.createLinearGradient(0, y - 70, 0, y + 30); gr.addColorStop(0, 'rgba(8,4,16,0)'); gr.addColorStop(.5, 'rgba(8,4,16,.55)'); gr.addColorStop(1, 'rgba(8,4,16,0)'); g.fillStyle = gr; g.fillRect(W / 2 - tw / 2 - 60, y - 70, tw + 120, 100);
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 10; g.fillStyle = '#f6ead6'; g.fillText(s.text, W / 2, y);
  g.restore();
  TX.push({ id: s.id, text: s.text, x0: W / 2 - tw / 2, y0: y - 46, x1: W / 2 + tw / 2, y1: y + 12 });
}

// ---------- the frame ----------
let TX = [];
export function render(g, t, Q) {
  if (!A) init(); TX = [];
  const cam = camAt(t), glow = GL.getContext('2d'); glow.setTransform(1, 0, 0, 1, 0, 0); glow.globalCompositeOperation = 'source-over'; glow.clearRect(0, 0, W, H);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
  sky(g, cam, t); bursts(g, glow, cam, t);
  const rack = ss(seg(t, TL.RACK0, TL.RACK1)), close = t < TL.LAMP ? 1 - seg(t, TL.FLAME, TL.LAMP) : 0;
  const lp = t < TL.LAMP + .5 ? (() => { const z = zl(cam, 1); return [W / 2 + (HOME.win.x - cam.x) * z, cam.py + (HOME.win.y + 40 - cam.py) * z, 700 * z]; })() : null;
  const lpOf = k => lp && lampOn(t) < 1 ? [lerp(lp[0], W / 2, lampOn(t)), lerp(lp[1], 1250, lampOn(t)), lerp(lp[2], 1300, lampOn(t))] : undefined;
  const lightOf = k => Math.max(layerLit(t, k), t > TL.FLAME ? .5 : 0);
  paper(g, glow, cam, t, L.far, far(cam), { lit: layerLit(t, 0), blur: 1.5 + 5 * close + 6 * rack });
  paper(g, glow, cam, t, L.mid, mid(cam, t), { lit: layerLit(t, 1), blur: .8 + 3 * close + 6 * rack });
  paper(g, glow, cam, t, L.story, story(cam, t), { lit: lightOf(2), lp: lpOf(2), blur: 5 * rack });
  heldBoxes(g, glow, cam, t);
  if (t > TL.WIPE0) paper(g, glow, cam, t, L.scoot, scooter(cam, t), { lit: lightOf(3), blur: 5 * rack });
  greeting(g, glow, t);
  paper(g, glow, cam, t, L.front, front(cam, t), { lit: lightOf(4), lp: lpOf(4), blur: 2.5 * (1 - rack) + 2 * close });
  curtain(g, cam, t);
  // darkness before the lamp: the flame is the only light
  const amb = ambient(t);
  if (amb < 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(3,1,8,${1 - amb})`; g.fillRect(0, 0, W, H);
    if (t > TL.MATCH && lp) { g.globalCompositeOperation = 'lighter'; const r = lp[2] * .8 * flick(t, 1) * seg(t, TL.MATCH, TL.FLAME + .3), gr = g.createRadialGradient(lp[0], lp[1] - 20, 0, lp[0], lp[1] - 20, r); gr.addColorStop(0, `rgba(120,70,30,${.6 * (1 - amb)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; } }
  // bloom
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  g.restore(); soft(g, GL, 28, 0, 0, amb < 1 ? .85 : .45, 'lighter'); soft(g, GL, 8, 0, 0, .3, 'lighter');
  if (amb < 1) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - amb; g.drawImage(GL, 0, 0); g.restore(); }
  // vignette
  g.setTransform(1, 0, 0, 1, 0, 0); const vg = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const sub = SUBS.find(s => t >= s.t0 - .15 && t < s.t1 + .3);
  if (sub && !Q.has('nosub')) subtitle(g, sub, t);
  if (t > TL.HAPPY) TX.push({ id: 'greet', text: 'Happy Diwali from PawanSetu', x0: 160, y0: HI ? 380 : 600, x1: 920, y1: HI ? 850 : 950, pass: true });
}
export function texts(t, Q) { render(window.__g, t, Q); return TX; }

export function events() {
  const E = [], e = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  e(TL.MATCH, 'match'); e(TL.FLAME, 'flame'); e(TL.LAMP, 'lamp'); e(TL.LAMP, 'bell');
  e(TL.WIPE0 + .1, 'curtain');
  TL.STOPS.forEach(([a, b], i) => { e(a - .9, 'scooter', { dur: .9 }); e(b, 'scooter', { dur: (i < 2 ? 1.5 : 7.5) }); });
  e(TL.WIPE1, 'scooter', { dur: .75 });
  TL.BOX.forEach((t, i) => { e(t - .55, 'paper', { i }); e(t, 'box', { i }); });
  e(TL.HANDOVER, 'paper', { i: 4 }); e(TL.LID, 'lid'); e(TL.LID, 'shimmer');
  TL.DIYAS.forEach((t, i) => e(t, 'diya', { i }));
  TL.BURSTS.forEach((t, i) => { e(t - .7, 'launch', { i }); e(t, 'burst', { i }); });
  if (!HI) { e(TL.HINDI + .3, 'paper', { i: 5 }); e(TL.HAPPY, 'paper', { i: 6 }); e(TL.FROM, 'paper', { i: 7 }); e(TL.FROM + .6, 'seal'); }
  else { e(TL.HINDI, 'paper', { i: 5 }); e(TL.HAPPY, 'paper', { i: 6 }); e(TL.LOGO_LAUNCH, 'launch', { i: 9 }); e(TL.LOGO_BURST, 'logo_burst'); e(TL.LOGO_BURST + .6, 'converge', { dur: TL.LOGO_FORM - TL.LOGO_BURST - .6 }); e(TL.LOGO_FORM, 'shimmer'); e(TL.LOGO_LATIN, 'paper', { i: 7 }); e(TL.LOGO_SEAL, 'seal'); }
  return E;
}
