// "This Week on GitHub" — Dark Tech Keynote, 1920×1080. Engine: engine.js (the style). Data: repos.json + timeline.json.
import * as E from './engine.js';
const { W, H, PAL, font, rr, clamp, lerp, seg, ss, eo, eio, back, hash, TAU } = E;
E.setAccent('#8B7CFF');
let R, TL, TX = [];
export function setup(repos, tl) { R = repos; TL = tl; }
export const DUR = () => TL.DUR;
const fmt = n => n.toLocaleString('en-US');

// ---------- small parts ----------
function text(g, s, x, y, px, wt = 500, col = PAL.text, fam = 'ui', align = 'left', track = 0) {
  g.save(); g.font = font(px, wt, fam); g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; if (track) g.letterSpacing = track + 'px'; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w;
}
function caption(g, t) {   // the toast, wrapped to two lines when needed
  const v = TL.vo.find(v => t >= v.t - .05 && t < v.t1); if (!v) return;
  const a = Math.min(ss(seg(t, v.t - .05, v.t + .12)), 1 - ss(seg(t, v.t1 - .15, v.t1)));
  g.save(); g.font = font(36, 500);
  const words = v.text.split(' '), lines = ['']; for (const w of words) { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (g.measureText(tl).width > 1320 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; }
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), lh = 46, h = 30 + lines.length * lh, w = tw + 110, x = W / 2 - w / 2, y = H - 52 - h + (1 - eo(a)) * 12;
  g.globalAlpha = eo(a); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; g.shadowOffsetY = 10;
  g.fillStyle = 'rgba(12,14,19,.82)'; rr(g, x, y, w, h, Math.min(h / 2, 36)); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 1; rr(g, x + .5, y + .5, w - 1, h - 1, Math.min(h / 2, 36)); g.stroke();
  g.fillStyle = PAL.accent; g.shadowColor = E.rgba(PAL.accent, .8); g.shadowBlur = 10; g.beginPath(); g.arc(x + 34, y + h / 2, 5, 0, TAU); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = PAL.text; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, x + 56, y + 15 + lh * (i + .5) + 1));
  g.restore();
  TX.push({ id: v.id, text: v.text, x0: x, y0: y, x1: x + w, y1: y + h });
}
function langDot(g, x, y, col, label) { g.save(); g.fillStyle = col; g.beginPath(); g.arc(x + 9, y - 9, 9, 0, TAU); g.fill(); g.restore(); return text(g, label, x + 28, y, 26, 500, PAL.dim); }
function star(g, x, y, s, col = PAL.dim) { g.save(); g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .42 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.restore(); }

// ---------- the trending board (intro + outro) ----------
function board(g, t, t0, allLit) {
  const x0 = 560, y0 = 170, rh = 66;
  text(g, 'TRENDING THIS WEEK', W / 2, 120, 22, 600, PAL.dim, 'mono', 'center', 8);
  [...R].sort((a, b) => a.rank - b.rank).forEach((r, i) => {
    const on = allLit ? 1 : ss(seg(t, t0 + .4 + i * .42, t0 + .62 + i * .42)), y = y0 + i * rh;
    E.panel(g, x0, y, 800, rh - 12, { r: 12, alpha: .35 + .65 * on, shadow: .4 * on });
    text(g, String(r.rank), x0 + 48, y + 38, 26, 600, on > .5 ? PAL.text : PAL.mute, 'mono', 'center');
    text(g, r.owner + ' / ', x0 + 92, y + 38, 24, 400, PAL.mute);
    g.save(); g.font = font(24, 400); const ow = g.measureText(r.owner + ' / ').width; g.restore();
    text(g, r.name, x0 + 92 + ow, y + 38, 26, 600, on > .5 ? PAL.text : PAL.mute);
    star(g, x0 + 640, y + 29, 10, on > .5 ? PAL.dim : PAL.mute);
    text(g, '+' + fmt(r.week), x0 + 772, y + 38, 24, 500, on > .5 ? PAL.text : PAL.mute, 'mono', 'right');
  });
  if (allLit || t > t0 + 4.6) TX.push({ id: 'board', text: 'trending board', x0: x0, y0: y0, x1: x0 + 800, y1: y0 + 10 * rh, pass: true });
}

// ---------- one repo segment ----------
function segment(g, t, s) {
  const r = R.find(r => r.rank === s.rank);
  const inK = eo(seg(t, s.card - .25, s.card + .2)), outK = eio(seg(t, s.t1, s.t1 + TL.trans * .6));
  g.save(); g.translate(-outK * 1400 + (1 - inK) * 260, 0); g.globalAlpha = clamp(inK * 1.4) * (1 - outK * .8);
  // progress: ten dots, the current one in accent
  for (let i = 0; i < 10; i++) { const k = 10 - i, cur = k === s.rank; g.fillStyle = cur ? PAL.accent : k > s.rank ? PAL.dim : PAL.mute; g.beginPath(); g.arc(W / 2 - 180 + i * 40, 92, cur ? 7 : 5, 0, TAU); g.fill(); }
  // the card
  const cx = 150, cy = 210, cw = 760, ch = 600;
  E.panel(g, cx, cy, cw, ch, { r: 28 });
  text(g, '#' + r.rank, cx + 56, cy + 150, 132, 600, PAL.text, 'disp', 'left', -4);
  text(g, r.owner + ' /', cx + 60, cy + 250, 34, 400, PAL.dim);
  const nmPx = r.name.length > 16 ? 50 : 66;
  text(g, r.name, cx + 58, cy + 250 + nmPx + 14, nmPx, 650, PAL.text);
  text(g, r.blurb, cx + 60, cy + 400, 28, 400, PAL.dim);
  const lw = langDot(g, cx + 60, cy + 480, r.lc, r.lang);
  star(g, cx + 60 + lw + 70, cy + 471, 12); text(g, r.stars, cx + 60 + lw + 92, cy + 480, 26, 500, PAL.dim, 'mono');
  // stars this week, rolling up on the card's arrival
  const wk = '+' + fmt(r.week);
  E.scramble(g, wk, cx + 60, cy + 560, t, [...wk].map((_, i) => s.card + .35 + i * .06), { px: 54, wt: 600, fam: 'disp', color: PAL.text, tracking: -.02 });
  text(g, 'stars this week', cx + 60 + (wk.length * 31) + 20, cy + 556, 24, 500, PAL.dim, 'mono');
  if (inK > .95 && outK < .05) TX.push({ id: 'card' + r.rank, text: `#${r.rank} ${r.owner} / ${r.name} ${r.blurb}`, x0: cx, y0: cy, x1: cx + cw, y1: cy + ch });
  // the terminal: the real command types itself (accent = what the repo does)
  const tk = eo(seg(t, s.term, s.term + .3));
  if (tk > 0) {
    g.save(); g.translate((1 - tk) * 80, 0); g.globalAlpha *= tk;
    const tx = 980, ty = 210, tw = 800, th = 330, inner = E.windowBox(g, tx, ty, tw, th, { title: 'terminal', app: 2 });
    const all = r.cmd.join('\n'), n = Math.floor(all.length * clamp((t - s.b[0]) / ((s.b[1] - s.b[0]) * .75)));
    let left = n, yy = inner[1] + 64, lastX = inner[0] + 40, lastY = yy;
    const mx = Math.max(...r.cmd.map(c => c.length)), px = mx > 50 ? 20 : mx > 36 ? 23 : 28;
    for (const line of r.cmd) {
      const vis = line.slice(0, Math.max(0, left)); left -= line.length + 1;
      const isComment = line.startsWith('#'), isSlash = line.startsWith('/');
      const prompt = isComment ? '' : isSlash ? '› ' : '$ ';
      const w0 = text(g, prompt, inner[0] + 40, yy, px, 500, PAL.mute, 'mono');
      const w1 = text(g, vis, inner[0] + 40 + w0, yy, px, 500, isComment ? PAL.dim : PAL.accent, 'mono');
      if (vis.length) { lastX = inner[0] + 40 + w0 + w1; lastY = yy; }
      yy += px * 1.9;
    }
    E.caret(g, lastX + 8, lastY - px * .32, px * 1.1, { on: Math.floor(t * 2.4) % 2 ? 1 : .25, glow: .6 });
    g.restore();
    if (tk > .95 && n >= all.length) TX.push({ id: 'cmd' + r.rank, text: all, x0: 980, y0: 260, x1: 1780, y1: 540, pass: true });
  }
  // the benefit tile
  const bk = back(seg(t, s.ben, s.ben + .28), 1.3);
  if (bk > 0) {
    g.save(); const bx = 980, by = 580, bw = 800, bh = 230; g.translate(bx + bw / 2, by + bh / 2); g.scale(bk, bk); g.translate(-(bx + bw / 2), -(by + bh / 2));
    E.panel(g, bx, by, bw, bh, { r: 24, fill: PAL.surf2 });
    const ck = new Path2D(); ck.arc(bx + 92, by + bh / 2, 40, 0, TAU);
    E.litShape(g, ck, { accent: true, glowR: 24, bbox: [bx + 52, by + bh / 2 - 40, 80, 80] });
    g.save(); g.strokeStyle = '#0A0B0F'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(bx + 74, by + bh / 2 + 2); g.lineTo(bx + 88, by + bh / 2 + 16); g.lineTo(bx + 112, by + bh / 2 - 14); g.stroke(); g.restore();
    text(g, 'BENEFIT', bx + 160, by + 92, 20, 600, PAL.dim, 'mono', 'left', 6);
    g.save(); g.font = font(38, 600); const words = r.benefit.split(' '), ls = ['']; for (const w of words) { const tl = ls[ls.length - 1] ? ls[ls.length - 1] + ' ' + w : w; if (g.measureText(tl).width > 580 && ls[ls.length - 1]) ls.push(w); else ls[ls.length - 1] = tl; } g.restore();
    ls.forEach((l, i) => text(g, l, bx + 160, by + 142 + i * 48, 38, 600, PAL.text));
    g.restore();
    if (bk > .95 && outK < .05) TX.push({ id: 'ben' + r.rank, text: r.benefit, x0: bx, y0: by, x1: bx + bw, y1: by + bh });
  }
  g.restore();
}
// the one giant number (#7, the most stars this week)
function giant(g, t, s) {
  const a = ss(seg(t, s.giant, s.giant + .2)) * (1 - ss(seg(t, s.card - .35, s.card - .05)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; E.glow(g, W / 2, H / 2 - 20, 700, PAL.accent, .12 * a);
  E.scramble(g, '+17,100', W / 2, H / 2 + 90, t, [...'+17,100'].map((_, i) => s.giant + .5 + i * .09), { px: 280, wt: 600, fam: 'disp', color: PAL.accent, align: 'center', tracking: -.045 });
  text(g, 'STARS THIS WEEK  ·  THE MOST OF THE TEN', W / 2, H / 2 + 190, 24, 600, PAL.dim, 'mono', 'center', 8);
  g.restore();
  if (t > s.giant + 1.0) TX.push({ id: 'giant', text: '+17,100', x0: 500, y0: 300, x1: 1420, y1: 760, pass: true });
}

export function render(g, t, Q) {
  TX = [];
  g.setTransform(1, 0, 0, 1, 0, 0);
  // camera: a slow push per segment, a whip between them
  const s = TL.segs.find(s => t >= s.t0 - .2 && t < s.t1 + TL.trans);
  E.bg(g, { lift: 1, cool: 1 });
  const z = s ? lerp(1, 1.03, ss(seg(t, s.card, s.t1))) : 1;
  E.grid(g, { ox: W / 2 - (s ? (t - s.t0) * 6 : 0), oy: H / 2, scale: z });
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  if (t < TL.segs[0].t0 + .2) { const a = 1 - ss(seg(t, TL.segs[0].t0 - .5, TL.segs[0].t0)); g.save(); g.globalAlpha = a; board(g, t, TL.board0, false);
    g.restore(); }
  if (s) { if (s.giant != null && t < s.card) giant(g, t, s); else segment(g, t, s); }
  if (t >= TL.outro - .3) { g.save(); g.globalAlpha = ss(seg(t, TL.outro - .3, TL.outro + .3)); board(g, t, TL.outro, true); g.restore(); }
  g.restore();
  E.vignette(g, .5);
  if (!(Q && Q.has('nosub'))) caption(g, t);
  const fo = seg(t, TL.DUR - 1.0, TL.DUR); if (fo > 0) { g.fillStyle = `rgba(0,0,0,${ss(fo)})`; g.fillRect(0, 0, W, H); }
}
export function texts(g, t, Q) { render(g, t, Q); return TX; }
export function events() {
  const ev = [], e = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (let i = 0; i < 10; i++) e(TL.board0 + .4 + i * .42, 'row', { i });
  for (const s of TL.segs) {
    if (s.giant != null) { e(s.giant + .5, 'giant'); }
    e(s.card - .25, 'whoosh'); e(s.card, 'drop'); e(s.term, 'slide'); e(s.b[0], 'typing', { dur: (s.b[1] - s.b[0]) * .75 }); e(s.ben, 'chime'); e(s.t1, 'whoosh_out');
  }
  e(TL.outro, 'board');
  for (const v of TL.vo) e(v.t, 'voice', { id: v.id });
  return ev;
}
