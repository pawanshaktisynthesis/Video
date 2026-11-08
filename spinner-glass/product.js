// The spinner and its clear case (rebuilt from the owner's reference.png). Units: mm. Local axis Y = the spin axis (case faces ±Y).
import * as THREE from 'three';

export function glass(o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color: '#ffffff', metalness: 0, roughness: .02, transmission: 1, thickness: 4, ior: 1.49,
    dispersion: 4, attenuationColor: new THREE.Color('#f4f8fa'), attenuationDistance: 200, specularIntensity: 1, envMapIntensity: 1.3,
  }, o));
}
const metal = (color, rough, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, metalness: 1, roughness: rough, envMapIntensity: 1.3, clearcoat: .6, clearcoatRoughness: .12 }, o));
const lathe = (pts, seg = 160) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
export const COLORS = { blue: '#1d3fe0', green: '#1c9a3c', gold: '#d2a62a' };
const CH = metal('#e9ecef', .12, { clearcoat: 0 });   // chrome balls + bearing

// ---- the spinner: hub + swirl arms (or a star lattice) + pockets with steel balls ----
export function makeSpinner(kind = 'swirl', color = COLORS.blue) {
  const g = new THREE.Group(), M = metal(color, .2);
  const n = kind === 'lattice' ? 9 : 7, R = 26;
  const flat = geo => { geo.scale(1, .72, 1); return geo; };
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, px = Math.cos(a) * R, pz = Math.sin(a) * R;
    const pocket = new THREE.Mesh(new THREE.TorusGeometry(6, 2.1, 20, 48), M); pocket.rotation.x = Math.PI / 2; pocket.position.set(px, 0, pz); g.add(pocket);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(4.5, 40, 20), CH); ball.position.set(px, .6, pz); g.add(ball);
    if (kind === 'swirl') {   // a swept arm curling from the hub out to the next pocket
      const pts = []; for (let k = 0; k <= 24; k++) { const u = k / 24, r = 9 + (R - 6.5 - 9) * u, th = a - .95 + .95 * Math.pow(u, .8) + .35 * Math.sin(u * Math.PI); pts.push(new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r)); }
      g.add(new THREE.Mesh(flat(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 2.6, 14)), M));
    }
  }
  if (kind === 'lattice') {   // star polygon {9/4} between the pockets + an inner ring
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 4) / n * Math.PI * 2, A = new THREE.Vector3(Math.cos(a) * (R - 6), 0, Math.sin(a) * (R - 6)), B = new THREE.Vector3(Math.cos(b) * (R - 6), 0, Math.sin(b) * (R - 6));
      g.add(new THREE.Mesh(flat(new THREE.TubeGeometry(new THREE.LineCurve3(A, B), 8, 1.5, 10)), M)); }
    const inner = new THREE.Mesh(new THREE.TorusGeometry(14, 1.6, 16, 96), M); inner.rotation.x = Math.PI / 2; g.add(inner);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 1.3, 14, 160), M); ring.rotation.x = Math.PI / 2; ring.scale.z = .8; g.add(ring);
  const hub = new THREE.Mesh(lathe([[0, -3.6], [9.6, -3.6], [10.4, -2.4], [10.4, 2.4], [9.6, 3.6], [0, 3.6]], 96), M); g.add(hub);
  const bearing = new THREE.Mesh(new THREE.TorusGeometry(10.6, .9, 14, 96), CH); bearing.rotation.x = Math.PI / 2; g.add(bearing);
  const cap = new THREE.Mesh(lathe([[0, 4.2], [7.2, 4.0], [7.8, 3.4], [7.8, 2.8], [0, 2.8]], 96), metal(color, .12)); g.add(cap);
  const capB = cap.clone(); capB.scale.y = -1; g.add(capB);
  g.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return g;
}

// ---- the clear round case: two shallow domed halves, a seam lip, a hanging tab ----
export function makeCase() {
  const top = new THREE.Group(), bottom = new THREE.Group(), G = glass({ side: THREE.DoubleSide, thickness: 3 });
  const half = sgn => { const p = []; for (let i = 0; i <= 40; i++) { const u = i / 40, r = 40 * u; p.push([r, sgn * (9.5 - 3.5 * Math.pow(u, 6) - 6 * Math.max(0, u - .86) / .14 * Math.max(0, u - .86) / .14)]); } p.push([40, 0]); return p; };
  top.add(new THREE.Mesh(lathe(half(1)), G));
  bottom.add(new THREE.Mesh(lathe(half(-1).reverse()), G));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(40.4, 1.3, 16, 200), glass({ thickness: 6, dispersion: 6 })); lip.rotation.x = Math.PI / 2; bottom.add(lip);
  const tab = new THREE.Mesh(new THREE.TorusGeometry(3.6, 1.4, 16, 48), glass({ thickness: 4 })); tab.position.set(44.5, 0, 0); tab.rotation.x = Math.PI / 2; bottom.add(tab);
  [top, bottom].forEach(h => h.traverse(o => { if (o.isMesh) o.frustumCulled = false; }));
  return { top, bottom };
}

// one product: case + spinner. explode(e): halves part along the axis; spin(angle)
export function makeProduct(kind, color) {
  const root = new THREE.Group(), c = makeCase(), sp = makeSpinner(kind, color);
  root.add(c.top, c.bottom, sp);
  return { root, top: c.top, bottom: c.bottom, spinner: sp,
    explode(e) { c.top.position.y = 30 * e; c.bottom.position.y = -30 * e; c.top.rotation.set(.18 * e, 0, -.12 * e); c.bottom.rotation.set(-.14 * e, 0, .1 * e); sp.position.y = 0; },
    spin(a) { sp.rotation.y = a; } };
}
