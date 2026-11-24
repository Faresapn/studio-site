/**
 * The Process house, ported from the prototype's Three.js "line edition".
 *
 * A house drawn in fine ink lines on warm paper, one stage per stretch of scroll. Lines draw themselves
 * on, white card faces fill in behind them, and materials arrive only at the end. Progress p runs 0..6:
 *   0 site grid, boundary and existing trees   1 plan on the ground, volumes extrude, faces fill
 *   2 details: timber screen, glazing, concrete panels, planting   3 dimensions (one muted accent)
 *   4 the house lifts apart into its trades   5 closes up, materials and dusk light, then the real photo
 *
 * Everything here is a pure function of p, so the scene can be rendered at any progress in any order.
 */
import * as THREE from 'three';

const N = 6;
const INK = '#373634';
const ACC = '#9A6B4F';
const PAPER = '#F3F1ED';
const DUSK = '#ECE7DF';
/** The prototype was lit with pre-r155 light units; physically based units need ×π for the same look. */
const LUX = Math.PI;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outc = (t: number) => 1 - Math.pow(1 - t, 3);
export const seg = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a)));

type LineRec = {
  obj: THREE.LineSegments;
  n: number;
  win: [number, number];
  op: number;
  color?: string;
  fin?: string;
  fade?: [number, number, number];
};
type Part = {
  holder: THREE.Group;
  body: THREE.Group;
  face: THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial>;
  draw: [number, number];
  rise?: [number, number];
  fill?: [number, number];
  final?: THREE.Color;
  white: THREE.Color;
  ex: [number, number, number];
};
type Opts = {
  draw: [number, number];
  rise?: [number, number];
  fill?: [number, number];
  final?: string;
  ex?: [number, number, number];
  lineFin?: string;
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const rect = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) => [a, b, b, c, c, d, d, a];
function circle(cx: number, cy: number, cz: number, r: number, plane: 'xz' | 'xy' | 'yz', n = 40) {
  const out: THREE.Vector3[] = [];
  const P = (t: number) =>
    plane === 'xz'
      ? V(cx + Math.cos(t) * r, cy, cz + Math.sin(t) * r)
      : plane === 'xy'
        ? V(cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz)
        : V(cx, cy + Math.sin(t) * r, cz + Math.cos(t) * r);
  for (let i = 0; i < n; i++) out.push(P((i / n) * Math.PI * 2), P(((i + 1) / n) * Math.PI * 2));
  return out;
}
/** Vertical edges first, then the rings: reads as a volume being drawn up. */
function boxEdges(w: number, h: number, d: number) {
  const x = w / 2;
  const z = d / 2;
  const c = [V(-x, 0, -z), V(x, 0, -z), V(x, 0, z), V(-x, 0, z), V(-x, h, -z), V(x, h, -z), V(x, h, z), V(-x, h, z)];
  return [
    c[0],
    c[4],
    c[1],
    c[5],
    c[2],
    c[6],
    c[3],
    c[7],
    ...rect(c[0], c[1], c[2], c[3]),
    ...rect(c[4], c[5], c[6], c[7]),
  ];
}

/** Camera keys, one per stage: azimuth°, elevation°, distance, target y. */
const K = [
  [38, 44, 84, 0],
  [30, 30, 76, 3],
  [34, 16, 72, 4],
  [16, 30, 80, 3.5],
  [30, 20, 92, 6.5],
  [36, 9, 62, 4.6],
];

/**
 * Place a camera for progress p. `sway` is the eased pointer offset over the stage (-0.5..0.5 each way),
 * which turns the camera a few degrees as in the prototype.
 */
export function placeCamera(cam: THREE.PerspectiveCamera, p: number, aspect: number, sway = { x: 0, y: 0 }) {
  const f = clamp(p - 0.5, 0, N - 1);
  const i = Math.min(N - 2, Math.floor(f));
  const t = ease(f - i);
  const a = K[i];
  const b = K[i + 1];
  const L = (j: number) => a[j] + (b[j] - a[j]) * t;
  let r = L(2);
  if (aspect < 1.25) r *= (1.25 / aspect) * 0.92 + 0.08; // keep the model in frame on tall stages
  const az = ((L(0) + sway.x * 7) * Math.PI) / 180;
  const el = ((L(1) - sway.y * 4) * Math.PI) / 180;
  const ty = L(3);
  cam.fov = 22;
  cam.aspect = aspect;
  cam.near = 1;
  cam.far = 400;
  cam.position.set(-0.5 + r * Math.sin(az) * Math.cos(el), ty + r * Math.sin(el), 1 + r * Math.cos(az) * Math.cos(el));
  cam.lookAt(-0.5, ty, 1);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

export type HouseScene = {
  root: THREE.Group;
  background: THREE.Color;
  /** Set every object for progress p (0..6). Idempotent. */
  apply: (p: number) => { explode: number };
  dispose: () => void;
};

export function createHouse(): HouseScene {
  const root = new THREE.Group();
  const lines: LineRec[] = [];
  const parts: Part[] = [];
  const env: {
    bg: [THREE.Color, THREE.Color];
    hemi: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
    glass: THREE.MeshLambertMaterial;
  } = {
    bg: [new THREE.Color(PAPER), new THREE.Color(DUSK)],
    hemi: new THREE.HemisphereLight(0xffffff, 0xe6e1d9, 1.0 * LUX),
    sun: new THREE.DirectionalLight(0xffffff, 0.55 * LUX),
    shadow: new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0 })),
    glass: new THREE.MeshLambertMaterial({
      color: new THREE.Color('#2B3033'),
      emissive: new THREE.Color('#FFC98A'),
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
    }),
  };
  const background = env.bg[0].clone();

  root.add(env.hemi);
  env.sun.position.set(26, 40, 22);
  env.sun.castShadow = true;
  env.sun.shadow.mapSize.set(2048, 2048);
  Object.assign(env.sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 110 });
  env.sun.shadow.bias = -0.0004;
  env.sun.shadow.radius = 6;
  root.add(env.sun);
  env.shadow.rotation.x = -Math.PI / 2;
  env.shadow.receiveShadow = true;
  root.add(env.shadow);

  /* every set of lines draws itself on across its window */
  function ln(
    parent: THREE.Object3D,
    pts: THREE.Vector3[],
    o: Omit<LineRec, 'obj' | 'n' | 'op'> & { op?: number; dash?: boolean },
  ) {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const color = new THREE.Color(o.color || INK);
    const mat = o.dash
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: 0.5,
          gapSize: 0.35,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
    const L = new THREE.LineSegments(g, mat);
    if (o.dash) L.computeLineDistances();
    L.renderOrder = 2;
    parent.add(L);
    const rec: LineRec = {
      obj: L,
      n: pts.length,
      op: o.op ?? 0.85,
      win: o.win,
      color: o.color,
      fin: o.fin,
      fade: o.fade,
    };
    lines.push(rec);
    return rec;
  }

  /* a volume: white card faces + ink edges; rises from its base; lifts apart in stage 5 */
  function vol(w: number, h: number, d: number, x: number, y: number, z: number, o: Opts): Part {
    const holder = new THREE.Group();
    root.add(holder);
    const body = new THREE.Group();
    body.position.set(x, y, z);
    holder.add(body);
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color('#FBFAF7'),
      transparent: true,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const face = new THREE.Mesh(g, mat);
    face.castShadow = true;
    body.add(face);
    ln(body, boxEdges(w, h, d), { win: o.draw, op: 0.9, fin: o.lineFin });
    const part: Part = {
      holder,
      body,
      face,
      draw: o.draw,
      rise: o.rise,
      fill: o.fill,
      final: o.final ? new THREE.Color(o.final) : undefined,
      white: new THREE.Color('#FBFAF7'),
      ex: o.ex ?? [0, 0, 0],
    };
    parts.push(part);
    return part;
  }

  /* ── stage 1: the site ── */
  const site = new THREE.Group();
  root.add(site);
  const grid: THREE.Vector3[] = [];
  for (let x = -14; x <= 14; x += 2) grid.push(V(x, 0, -9), V(x, 0, 11));
  for (let z = -9; z <= 11; z += 2) grid.push(V(-14, 0, z), V(14, 0, z));
  ln(site, grid, { win: [0.02, 0.55], op: 0.13, fade: [1.6, 2.4, 0.06] });
  ln(site, rect(V(-14, 0, -9), V(14, 0, -9), V(14, 0, 11), V(-14, 0, 11)), {
    win: [0.12, 0.5],
    op: 0.9,
    fade: [5.15, 5.5, 0.25],
  });
  ln(
    site,
    [V(-11, 0, -6.6), V(-11, 0, -8.4), V(-11, 0, -8.4), V(-11.35, 0, -7.8), V(-11, 0, -8.4), V(-10.65, 0, -7.8)],
    {
      win: [0.4, 0.6],
      op: 0.7,
      fade: [1.8, 2.2, 0],
    },
  );
  function tree(x: number, z: number, s: number, a: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    const H = 3 * s;
    const r = 1.7 * s;
    ln(
      g,
      [
        V(0, 0, 0),
        V(0, H, 0),
        V(0, H * 0.62, 0),
        V(0.6 * s, H * 0.85, 0.2 * s),
        V(0, H * 0.7, 0),
        V(-0.5 * s, H * 0.95, -0.2 * s),
      ],
      {
        win: [a, a + 0.25],
        op: 0.7,
        fin: '#6F665C',
      },
    );
    ln(
      g,
      [
        ...circle(0, H + r * 0.55, 0, r, 'xz', 36),
        ...circle(0, H + r * 0.55, 0, r * 0.95, 'xy', 36),
        ...circle(0, H + r * 0.55, 0, r * 0.95, 'yz', 36),
      ],
      {
        win: [a + 0.12, a + 0.45],
        op: 0.55,
        fin: '#7E8A6E',
      },
    );
  }
  tree(11.2, 6.8, 1.1, 0.22);
  tree(-12.2, 1.5, 1.3, 0.3);
  tree(12.4, -6.5, 0.9, 0.38);

  /* ── stage 2: the plan on the ground, then the volumes ── */
  const plan = new THREE.Group();
  root.add(plan);
  ln(
    plan,
    [
      ...rect(V(-9, 0, -6), V(7, 0, -6), V(7, 0, 4), V(-9, 0, 4)),
      V(-3, 0, -6),
      V(-3, 0, 1),
      V(-3, 0, 1),
      V(1, 0, 1),
      V(2.5, 0, -6),
      V(2.5, 0, 4),
      V(-9, 0, -1.5),
      V(-3, 0, -1.5),
    ],
    { win: [1.0, 1.3], op: 0.85, fade: [1.6, 2.0, 0] },
  );
  ln(plan, rect(V(-10, 0, -6), V(9, 0, -6), V(9, 0, 5), V(-10, 0, 5)), {
    win: [1.05, 1.32],
    op: 0.6,
    dash: true,
    fade: [1.6, 2.0, 0],
  });
  const gf = vol(16, 3.2, 10, -1, 0, -1, {
    draw: [1.25, 1.55],
    rise: [1.25, 1.55],
    fill: [1.6, 1.95],
    final: '#EEECE7',
  });
  vol(19, 0.22, 11.4, -0.5, 3.2, -0.5, {
    draw: [1.4, 1.6],
    rise: [1.4, 1.6],
    fill: [1.65, 1.95],
    final: '#3E3630',
    ex: [0, 3.4, 0],
  });
  const tb = vol(19, 3.9, 11, -0.5, 3.42, -0.5, {
    draw: [1.45, 1.75],
    rise: [1.45, 1.75],
    fill: [1.7, 2.0],
    final: '#5B4636',
    ex: [0, 3.4, 0],
    lineFin: '#3A2D24',
  });
  const cn = vol(7.2, 3.6, 9.6, -4.6, 5.4, 1.6, {
    draw: [1.6, 1.85],
    rise: [1.6, 1.85],
    fill: [1.75, 2.0],
    final: '#C4C0B9',
    ex: [0, 6.6, 0],
  });
  const wl = vol(27, 2.1, 0.35, 0, 0, 7.9, {
    draw: [1.7, 1.95],
    rise: [1.7, 1.95],
    fill: [1.8, 2.05],
    final: '#9A9792',
    ex: [0, 0, 4.5],
  });

  /* ── stage 3: details ── */
  const sl: THREE.Vector3[] = [];
  for (let x = -9.36; x <= 9.4; x += 0.26) sl.push(V(x, 0, 5.56), V(x, 3.9, 5.56));
  for (let z = -5.36; z <= 5.4; z += 0.26) sl.push(V(9.56, 0, z), V(9.56, 3.9, z));
  ln(tb.body, sl, { win: [2.05, 2.6], op: 0.5, fin: '#C9AE93' });
  const gz: THREE.Vector3[] = [];
  const win = (x0: number, x1: number) => {
    gz.push(...rect(V(x0, 0.35, 5.02), V(x1, 0.35, 5.02), V(x1, 2.75, 5.02), V(x0, 2.75, 5.02)));
    const m = (x1 - x0) / 3;
    gz.push(V(x0 + m, 0.35, 5.02), V(x0 + m, 2.75, 5.02), V(x0 + 2 * m, 0.35, 5.02), V(x0 + 2 * m, 2.75, 5.02));
  };
  win(-7.4, -3.8);
  win(-2.8, 1.6);
  win(2.3, 6.9);
  for (const [z0, z1] of [
    [-4.6, -0.4],
    [0.6, 4.4],
  ]) {
    gz.push(
      ...rect(V(8.02, 0.35, z0), V(8.02, 0.35, z1), V(8.02, 2.75, z1), V(8.02, 2.75, z0)),
      V(8.02, 0.35, (z0 + z1) / 2),
      V(8.02, 2.75, (z0 + z1) / 2),
    );
  }
  ln(gf.body, gz, { win: [2.1, 2.45], op: 0.75 });
  for (const [x, w] of [
    [-5.6, 3.6],
    [-0.6, 4.4],
    [4.6, 4.6],
  ]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), env.glass);
    m.position.set(x, 1.55, 5.015);
    gf.body.add(m);
  }
  for (const [z, w] of [
    [-2.5, 4.2],
    [2.5, 3.8],
  ]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), env.glass);
    m.rotation.y = Math.PI / 2;
    m.position.set(8.015, 1.55, z);
    gf.body.add(m);
  }
  const cp: THREE.Vector3[] = [];
  for (let y = 1.2; y < 3.6; y += 1.2) cp.push(V(-3.6, y, 4.82), V(3.6, y, 4.82), V(3.62, y, -4.8), V(3.62, y, 4.8));
  for (let x = -2.4; x < 3.6; x += 2.4) cp.push(V(x, 0, 4.82), V(x, 3.6, 4.82));
  ln(cn.body, cp, { win: [2.2, 2.5], op: 0.35, fin: '#8E8A84' });
  const pl: THREE.Vector3[] = [];
  for (let i = 0; i < 22; i++) {
    const x = -12.6 + i * 1.2 + (i % 3) * 0.15;
    const r = 0.5 + ((i * 37) % 5) * 0.07;
    pl.push(...circle(x, 0.02, 8.85 + (i % 2) * 0.35, r, 'xz', 20));
  }
  ln(wl.holder, pl, { win: [2.35, 2.75], op: 0.6, fin: '#6F7E5E' });
  ln(wl.holder, [V(-14, 0, 10.2), V(14, 0, 10.2)], { win: [2.4, 2.7], op: 0.4 });

  /* ── stage 4: dimensions, in the one accent colour ── */
  const dm: THREE.Vector3[] = [];
  const D = (a: [number, number, number], b: [number, number, number]) => dm.push(V(...a), V(...b));
  D([-10, 0.05, 12.2], [9, 0.05, 12.2]);
  D([-10, 0.05, 11.7], [-10, 0.05, 12.7]);
  D([9, 0.05, 11.7], [9, 0.05, 12.7]);
  D([11.2, 0.05, -6], [11.2, 0.05, 5]);
  D([10.7, 0.05, -6], [11.7, 0.05, -6]);
  D([10.7, 0.05, 5], [11.7, 0.05, 5]);
  D([-11.6, 0, -6], [-11.6, 9, -6]);
  D([-12.1, 0, -6], [-11.1, 0, -6]);
  D([-12.1, 9, -6], [-11.1, 9, -6]);
  D([-10, 0.05, 5], [-10, 0.05, 12.7]);
  D([9, 0.05, 5], [9, 0.05, 12.7]);
  ln(root, dm, { win: [3.05, 3.45], op: 0.95, color: ACC, fade: [3.85, 4.1, 0] });

  const cA = new THREE.Color();
  const cB = new THREE.Color();

  function apply(p: number) {
    const explode = seg(p, 4.05, 4.6) * (1 - seg(p, 5.0, 5.45));
    const mat = seg(p, 5.1, 5.55);
    const dusk = seg(p, 5.2, 5.6);
    for (const o of parts) {
      const s = o.rise ? ease(clamp((p - o.rise[0]) / (o.rise[1] - o.rise[0]))) : 1;
      o.body.scale.y = Math.max(0.001, s);
      o.body.visible = p >= o.draw[0];
      const f = o.fill ? seg(p, o.fill[0], o.fill[1]) : 1;
      const m = o.face.material;
      m.opacity = f;
      m.depthWrite = f > 0.5;
      m.transparent = f < 0.999;
      o.face.visible = f > 0.002;
      m.color.lerpColors(o.white, o.final || o.white, mat);
      o.holder.position.set(o.ex[0] * explode, o.ex[1] * explode, o.ex[2] * explode);
    }
    for (const l of lines) {
      const t = outc(clamp((p - l.win[0]) / (l.win[1] - l.win[0])));
      const k = Math.floor((l.n * t) / 2) * 2;
      l.obj.geometry.setDrawRange(0, k);
      l.obj.visible = k > 0;
      let op = l.op;
      if (l.fade) op = l.op + (l.fade[2] - l.op) * seg(p, l.fade[0], l.fade[1]);
      op *= 1 - mat * 0.38; // lines soften as materials arrive
      const material = l.obj.material as THREE.LineBasicMaterial;
      material.opacity = op;
      if (l.fin) {
        cA.set(l.color || INK);
        cB.set(l.fin);
        material.color.lerpColors(cA, cB, mat);
      }
    }
    env.shadow.material.opacity = 0.07 * seg(p, 1.7, 2.1) + 0.05 * mat;
    env.sun.intensity = (0.55 + 0.45 * mat - 0.4 * dusk) * LUX;
    env.hemi.intensity = (1 - 0.25 * dusk) * LUX;
    env.glass.opacity = mat * 0.92;
    env.glass.emissiveIntensity = 0.2 * dusk;
    background.lerpColors(env.bg[0], env.bg[1], dusk);
    return { explode };
  }

  function dispose() {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
  }

  return { root, background, apply, dispose };
}
