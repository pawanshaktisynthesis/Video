// SPIN. RESET. — the owner's fidget spinner as a glass product film (Glass Product Render style), 1080×1920.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, seg, eio, eo, ei, ss, lerp, hash } from '/core/lib.js';
import { DUR, T, BEAT, shotAt } from './timeline.js';
import { makeProduct, COLORS } from './product.js';
import { makeStudio } from './studio.js';

const QS = new URLSearchParams(location.search), NOTXT = QS.has('notext');
const W = 1080, H = 1920, SS = +(QS.get('ss') || 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(SS); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 1, 4000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: false });
post.bloom.strength = .22; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .3; post.vig.uniforms.contrast.value = .1; post.vig.uniforms.sat.value = 1.05;

const studio = makeStudio(renderer, scene);
studio.U.uRes.value.set(W * SS, H * SS);
const AMBER = new THREE.Color('#ffb347'), GOLDL = new THREE.Color('#ffdc8f');
studio.U.uA.value = AMBER; studio.U.uB.value = GOLDL;
const P = { blue: makeProduct('swirl', COLORS.blue), green: makeProduct('swirl', COLORS.green), gold: makeProduct('lattice', COLORS.gold) };
Object.values(P).forEach(p => scene.add(p.root));
const V = (x, y, z) => new THREE.Vector3(x, y, z), Y = V(0, 1, 0);
// the poster's composition: blue front and low, green upper left, gold upper right
const HOME = { blue: V(0, 40, 0), green: V(-40, 150, -70), gold: V(42, 190, -110) };
function face(p, pos, dir, roll = 0) { p.root.position.copy(pos); p.root.quaternion.setFromUnitVectors(Y, dir.clone().normalize()); p.root.rotateY(roll); }
const toward = (from, cam, tilt = V(0, 0, 0)) => cam.clone().sub(from).normalize().add(tilt);
// spin angle: idle drift; spin-up in shot 3 (ω 6 rad/s, τ .8 s); slow turns elsewhere
function spinAngle(t, ph = 0) {
  const w = 6, tau = .8, d = Math.max(0, t - T.SPIN0);
  return ph + .25 * t + (t > T.SPIN0 && t < 14.4 ? w * d - w * tau * (1 - Math.exp(-d / tau)) : 0);
}
const SW = (t, a, b) => { const u = seg(t, a, b); return u > 0 && u < 1 ? u : null; };

function frame(t) {
  const [t0, t1, name] = shotAt(t), u = seg(t, t0, t1);
  let pos, look, fov = 30, focus = null, aper = 300, bg = .35, sweep = null, rings = false, bloom = .22, spot = .03;
  const envO = { left: 1, right: 1, top: 1.3, front: .4, back: 1, key: .9 };
  const show = { blue: 1, green: 0, gold: 0 };
  Object.values(P).forEach(p => { p.explode(0); });
  switch (name) {
    case 'dark': {   // three dark round outlines; two sweeps draw their rims; the blue one is found first
      Object.assign(show, { green: 1, gold: 1 });
      const amb = ss(seg(t, 1.0, 4.2));
      Object.assign(envO, { left: .08 + .5 * amb, right: .08 + .5 * amb, top: .05 + .4 * amb, front: 0, back: .15 + .6 * amb, key: .5 * amb });
      pos = V(0, 105, 640).lerp(V(0, 100, 560), eio(u)); look = V(0, 100, 0); fov = 30; focus = HOME.blue; aper = 120; bg = .15 * amb;
      for (const k of ['blue', 'green', 'gold']) face(P[k], HOME[k], toward(HOME[k], pos, V(k === 'gold' ? -.15 : .12, .05, 0)), .2);
      const s1 = SW(t, ...T.SWEEP1), s2 = SW(t, ...T.SWEEP2);
      if (s1 != null) sweep = { x: lerp(-1, 1, s1), I: 7 * Math.sin(s1 * Math.PI) };
      if (s2 != null) sweep = { x: lerp(1, -1, s2), I: 7 * Math.sin(s2 * Math.PI), tilt: .25 };
      break;
    }
    case 'macro': {   // close on the case face; rack focus from the clear face to a steel ball inside
      const p = HOME.blue, cam = p.clone().add(V(-70, 40, 150).lerp(V(-56, 32, 132), eio(u)));
      face(P.blue, p, toward(p, cam, V(.15, .1, 0)), .3);
      pos = cam; look = p.clone().add(V(-6, 4, 0)); fov = 32; aper = 1000;
      const faceP = p.clone().add(toward(p, cam).normalize().multiplyScalar(9)), ballP = p.clone().add(V(-18, 14, 4));
      focus = faceP.lerp(ballP, ss(seg(t, ...T.RACK)));
      for (const st of T.MACRO_SWEEPS) { const s = SW(t, st, st + .45); if (s != null) sweep = { x: lerp(-1, 1, s), I: 5 * Math.sin(s * Math.PI), tilt: -.35 }; }
      bg = .25; break;
    }
    case 'spin': {   // it spins up; each beat a ring of amber light spreads over the floor
      const p = V(0, 30, 0), az = lerp(.5, .15, eio(u)), el = .62, d = 230;
      pos = V(Math.sin(az) * Math.cos(el) * d, p.y + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d); look = p.clone().add(V(0, -8, 0)); fov = 30; focus = p; aper = 260;
      face(P.blue, p, V(0, 1, .55), 0); rings = true; bg = .5; spot = .05;
      Object.assign(envO, { top: .25, key: 0, front: 0 }); break;   // the flat case face mirrors the top box as a grey slab: keep it low
    }
    case 'explode': {   // halves part along the axis (axis ~40° to view), hover, snap shut on the downbeat
      const p = V(0, 40, 0); let e;
      if (t < T.APART[1]) e = eo(seg(t, ...T.APART));
      else if (t < T.SIL[0]) e = 1 + .03 * seg(t, T.APART[1], T.SIL[0]);
      else if (t < T.SNAP) e = 1.03 * (1 - ei(seg(t, T.SIL[0], T.SNAP)));
      else e = 0;
      face(P.blue, p, V(.15, 1, .25), .4); P.blue.explode(e);
      const az = lerp(.35, .6, eio(u)), el = .78, d = lerp(250, 230, eio(u)), push = eo(seg(t, T.SNAP, T.SNAP + .9));
      pos = V(Math.sin(az) * Math.cos(el) * (d - 50 * push), p.y + Math.sin(el) * (d - 50 * push), Math.cos(az) * Math.cos(el) * (d - 50 * push)); look = p.clone(); fov = 32; focus = p; aper = 90;
      Object.assign(envO, { left: 1.4, right: 1.4, top: .3, front: 0, back: 1.6, key: 0 }); bg = .8;
      if (t >= T.SNAP) { const k = Math.exp(-(t - T.SNAP) / .08), fr = Math.floor(t * 24); pos.add(V(hash(fr) - .5, hash(fr + 9) - .5, 0).multiplyScalar(k * 2.4)); rings = true; }
      break;
    }
    case 'lineup': {   // three colours; one sweep passes each on the beat
      Object.assign(show, { green: 1, gold: 1 });
      pos = V(-20, 120, 600).lerp(V(10, 110, 540), eio(u)); look = V(0, 135, 0); fov = 30; focus = HOME.blue; aper = 90; bg = .6;
      for (const k of ['blue', 'green', 'gold']) face(P[k], HOME[k], toward(HOME[k], pos, V(k === 'gold' ? -.15 : .12, .05, 0)), .2);
      T.LINE_SWEEPS.forEach((st, i) => { const s = SW(t, st, st + .9); if (s != null) sweep = { x: lerp(-1, 1, s), I: 6 * Math.sin(s * Math.PI), y: [-60, 80, 120][i] }; });
      break;
    }
    case 'end': {   // pull back into negative space; the blue one, the name above, the shop below
      const p = V(0, 40, 0); pos = V(0, 70, 330).lerp(V(0, 80, 430), eio(u)); look = V(0, 28, 0); fov = 30; focus = p; aper = 140;
      face(P.blue, p, toward(p, pos, V(.12, .06, 0)), .2); bg = .7 - .3 * seg(t, 29, DUR); bloom = .26;
      const s = SW(t, 27.0, 28.4); if (s != null) sweep = { x: lerp(-1, 1, s), I: 6 * Math.sin(s * Math.PI) };
      break;
    }
  }
  for (const k in P) { P[k].root.visible = !!show[k]; P[k].spin(spinAngle(t, { blue: 0, green: 1.3, gold: 2.1 }[k] * (name === 'lineup' ? 1 : 0))); }
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(look);
  if (sweep) sweep.az = Math.atan2(camera.position.x, camera.position.z) + Math.PI;
  // floor rings: the "reset" made visible
  let fl = 0; const U = studio.U; for (const wv of U.uWave.value) wv.set(0, 0, 0, 0);
  if (rings) { let wi = 0; const bp = P.blue.root.position;
    for (const rt of T.RINGS) { const dt = t - rt; if (dt < 0 || dt > 2.2 || wi >= 12) continue; const big = Math.abs(rt - T.SNAP) < .01; U.uWave.value[wi++].set(bp.x, bp.z, 10 + 60 * dt, (big ? .9 : .45) * Math.exp(-dt / .6)); fl += (big ? 1.4 : .8) * Math.exp(-dt / .15); } }
  studio.updateEnv(Object.assign(envO, { sweep: sweep || { I: 0 }, aura: { I: fl * .8, col: AMBER } }));
  scene.backgroundIntensity = bg; U.uBgI.value = bg; U.uTime.value = t * .6; U.uSpot.value = spot;
  const bp = P.blue.root.position, swI = sweep ? sweep.I / 7 : 0;
  U.uC.value[0].set(bp.x, bp.z, 12 + (bp.y - studio.FLOOR.y) * .3, rings ? .35 + fl * .4 : swI * .4);
  U.uC.value[1].set(0, 0, 1, 0); U.uC.value[2].set(0, 0, 1, 0);
  post.dof.focus = focus ? camera.position.distanceTo(focus) : 200; post.dof.aper = aper; post.dof.maxCoc = 14;
  post.bloom.strength = bloom + fl * .06;
  return name;
}

// ---- 2D layer: thin titles with a glint, the end card ----
const ov = document.getElementById('ov'), g = ov.getContext('2d');
await Promise.all(['200 100px "Inter Tight"', '300 40px "Inter Tight"', '500 20px "Inter Tight"', '700 40px "Inter Tight"', '800 40px "Inter Tight"'].map(f => document.fonts.load(f)));
let TX = [];
function spaced(text, x, y, font, sp, align = 'center') { g.font = font; g.letterSpacing = sp + 'px'; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, align === 'center' ? x + sp / 2 : x, y); const w = g.measureText(text).width; g.letterSpacing = '0px'; return w; }
function glint(text, y, font, sp, a, gx, col = 'rgba(238,242,246,.94)') {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.fillStyle = col; const w = spaced(text, W / 2, y, font, sp); g.restore();
  if (gx != null) { g.save(); g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(gx - 120, 0, gx + 120, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,200,120,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(.58, 'rgba(255,220,150,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, y - 110, W, 220); g.restore(); }
  if (a > .9) TX.push({ id: text, text, x0: W / 2 - w / 2, y0: y - 60, x1: W / 2 + w / 2, y1: y + 60 });
}
const fadeIO = (t, a, b, d = .5) => ss(seg(t, a, a + d)) * (1 - ss(seg(t, b - d, b)));
function hud(t) {
  g.clearRect(0, 0, W, H); TX = [];
  if (t < .4) { g.fillStyle = `rgba(0,0,0,${1 - ss(seg(t, 0, .4))})`; g.fillRect(0, 0, W, H); }
  if (NOTXT) return;
  // SPIN. RESET.
  const gs = SW(t, 12.0, 13.4), gx = gs != null ? lerp(W * .1, W * .9, gs) : null;
  glint('SPIN.', 300, '200 168px "Inter Tight"', 30, fadeIO(t, T.SPIN_TITLE, 14.3, .4), gx);
  glint('RESET.', 480, '200 168px "Inter Tight"', 30, fadeIO(t, T.RESET_TITLE, 14.3, .4), gx, 'rgba(255,214,150,.95)');
  // kicker over the exploded view
  glint('PREMIUM FIDGET SPINNER', 250, '400 30px "Inter Tight"', 12, fadeIO(t, ...T.KICKER, .5));
  // three colours
  const ls = T.LINE_SWEEPS.map(s => SW(t, s, s + .9)).find(x => x != null), lx = ls != null ? lerp(W * .1, W * .9, ls) : null;
  glint('THREE COLORS', 210, '200 92px "Inter Tight"', 18, fadeIO(t, T.COLORS, 26.2, .5), lx);
  glint('BUILT FOR EVERYDAY FOCUS', 300, '400 28px "Inter Tight"', 10, fadeIO(t, T.FOCUS, 26.2, .5));
  // end card: the title, then the PawanSetu logo (indigo tile + white P) and the address
  if (t >= T.LOGO - .5) {
    const es = SW(t, 27.0, 28.4), ex = es != null ? lerp(W * .1, W * .9, es) : null;
    glint('SPIN. RESET.', 260, '200 110px "Inter Tight"', 14, ss(seg(t, 26.6, 27.2)), ex);
    const a = ss(seg(t, T.LOGO, T.LOGO + .6)), a2 = ss(seg(t, T.URL, T.URL + .6));
    g.save(); g.globalAlpha = a * .7; g.fillStyle = '#c9d0d8'; spaced('AVAILABLE ON', W / 2, 1450, '500 22px "Inter Tight"', 10); g.restore();
    g.save(); g.globalAlpha = a; g.font = '800 72px "Inter Tight"'; const ww = g.measureText('PawanSetu').width, tile = 92, gap = 26, x0 = W / 2 - (tile + gap + ww) / 2, y0 = 1560;
    g.fillStyle = '#4F46E5'; g.beginPath(); g.roundRect(x0, y0 - tile / 2, tile, tile, 20); g.fill();
    g.fillStyle = '#ffffff'; g.font = '700 60px "Inter Tight"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', x0 + tile / 2, y0 + 3);
    g.font = '800 72px "Inter Tight"'; g.textAlign = 'left'; g.fillStyle = '#f2f4f7'; g.fillText('PawanSetu', x0 + tile + gap, y0 + 3); g.restore();
    g.save(); g.globalAlpha = a2; g.fillStyle = '#ffc879'; spaced('pawansetu.in', W / 2, 1665, '400 40px "Inter Tight"', 4); g.restore();
    if (a > .9) TX.push({ id: 'logo', text: 'AVAILABLE ON PawanSetu', x0: x0, y0: 1420, x1: x0 + tile + gap + ww, y1: 1610 });
    if (a2 > .9) TX.push({ id: 'url', text: 'pawansetu.in', x0: 380, y0: 1640, x1: 700, y1: 1690 });
  }
  const fo = seg(t, T.FADE, DUR); if (fo > 0) { g.fillStyle = `rgba(0,0,0,${ss(fo)})`; g.fillRect(0, 0, W, H); }
}

window.render = t => {
  frame(t);
  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  studio.reflect(camera);
  post.composer.render();
  hud(t);
};
window.TEXTS = t => { hud(t); return TX; };
window.DUR = DUR;
const EV = [], e = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
e(T.SWEEP1[0], 'sweep', { dur: T.SWEEP1[1] - T.SWEEP1[0], pan: -1 }); e(T.SWEEP2[0], 'sweep', { dur: T.SWEEP2[1] - T.SWEEP2[0], pan: 1 });
T.MACRO_SWEEPS.forEach(s => e(s, 'sweep', { dur: .45, pan: -1 })); e(T.SPIN0, 'spinup');
T.RINGS.forEach(r => e(r, 'ring', { big: Math.abs(r - T.SNAP) < .01 ? 1 : 0 }));
e(T.APART[0], 'apart'); e(T.SIL[0], 'reverse'); e(T.SNAP, 'snap');
T.LINE_SWEEPS.forEach((s, i) => e(s, 'sweep', { dur: .9, pan: [-.6, -.2, .5][i] })); e(27.0, 'sweep', { dur: 1.4, pan: 0 });
e(T.SPIN_TITLE, 'title'); e(T.RESET_TITLE, 'title'); e(T.COLORS, 'title'); e(T.LOGO, 'logo');
window.EV = EV;
window.READY = true;
