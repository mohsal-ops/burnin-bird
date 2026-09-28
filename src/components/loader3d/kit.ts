import * as THREE from "three";

// Shared toolkit for the 3D intro scenes: clay/ceramic materials, lathe
// helpers, easing + choreography helpers. Everything is procedural (no model
// files to download) so the loader chunk stays small and brand-tintable.

export type SceneDef = {
  root: THREE.Group;
  /** loop length in seconds */
  period: number;
  /** t = seconds into the current loop, time = seconds since start */
  update: (t: number, time: number) => void;
  camera?: { pos: [number, number, number]; target: [number, number, number]; fov?: number };
};

export type SceneCtx = { brand: THREE.Color; flavor?: string };

// ── materials ────────────────────────────────────────────────────────────────
// A tiny procedural "grain" texture (two octaves of seeded value noise + fine
// speckle) used as a bump + roughness map on every clay/glossy surface. It is
// what turns smooth plastic into something that reads as real: crumb on the
// bun, pores on meat, glaze variation on ceramics. Built once, shared.
let grainTex: THREE.CanvasTexture | null = null;
export function grain() {
  if (grainTex || typeof document === "undefined") return grainTex;
  const N = 256;
  const r = rng(11);
  const cell = (n: number) => Array.from({ length: n * n }, () => r());
  const lo = cell(16), mid = cell(48);
  const sample = (g: number[], n: number, x: number, y: number) => {
    const fx = (x / N) * n, fy = (y / N) * n;
    const x0 = Math.floor(fx) % n, y0 = Math.floor(fy) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
    const tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = g[y0 * n + x0] + (g[y0 * n + x1] - g[y0 * n + x0]) * sx;
    const b = g[y1 * n + x0] + (g[y1 * n + x1] - g[y1 * n + x0]) * sx;
    return a + (b - a) * sy;
  };
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = 0.45 * sample(lo, 16, x, y) + 0.35 * sample(mid, 48, x, y) + 0.2 * r();
      const b = Math.round(70 + v * 150);
      const i = (y * N + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  grainTex = new THREE.CanvasTexture(c);
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.repeat.set(3, 3);
  grainTex.anisotropy = 4;
  return grainTex;
}

export function clay(color: THREE.ColorRepresentation, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const g = grain();
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    clearcoat: 0.18,
    clearcoatRoughness: 0.45,
    sheen: 0.35,
    sheenRoughness: 0.7,
    ...(g ? { bumpMap: g, bumpScale: 1.6, roughnessMap: g } : {}),
    ...o,
  });
}
export const glossy = (color: THREE.ColorRepresentation, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  clay(color, { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, bumpScale: 0.5, ...o });
export const glow = (color: THREE.ColorRepresentation, opacity = 0.9) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

// ── geometry ─────────────────────────────────────────────────────────────────
export function lathe(points: [number, number][], segments = 64) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/** cheap smooth-ish 3D noise (sum of sines) — fine for organic bumps */
export function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 3.1 + y * 1.7) * 0.5 +
    Math.sin(z * 2.3 - x * 1.3 + 1.7) * 0.35 +
    Math.sin(y * 4.7 + z * 3.9 + 0.3) * 0.25
  ) / 1.1;
}

export function bumpify(geo: THREE.BufferGeometry, amount: number, freq = 4) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * freq, v.y * freq, v.z * freq) * amount;
    const len = Math.hypot(v.x, v.z) || 1;
    p.setXYZ(i, v.x + (v.x / len) * n, v.y + n * 0.6, v.z + (v.z / len) * n);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Paint a vertical colour ramp into a geometry (use with vertexColors: true). */
export function heightTint(geo: THREE.BufferGeometry, bottom: THREE.ColorRepresentation, top: THREE.ColorRepresentation, y0: number, y1: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const a = new THREE.Color(bottom), b = new THREE.Color(top), c = new THREE.Color();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0)));
    c.copy(a).lerp(b, k * k * (3 - 2 * k));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

export function shadowed<T extends THREE.Object3D>(o: T, cast = true, receive = true): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = receive;
    }
  });
  return o;
}

// ── timing ───────────────────────────────────────────────────────────────────
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeInCubic = (p: number) => p * p * p;
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOutBack = (p: number, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
export function easeOutBounce(p: number) {
  const n1 = 7.5625, d1 = 2.75;
  if (p < 1 / d1) return n1 * p * p;
  if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
  if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
  return n1 * (p -= 2.625 / d1) * p + 0.984375;
}

/**
 * Drop a part from `height` above its rest pose onto it, with a bouncy landing
 * and a squash-and-stretch on impact. Hides the part before its cue.
 */
export function drop(o: THREE.Object3D, restY: number, t: number, start: number, dur = 0.55, height = 3) {
  const lt = t - start;
  if (lt < 0) {
    o.visible = false;
    return 0;
  }
  o.visible = true;
  const p = clamp(lt / dur);
  o.position.y = restY + height * (1 - easeOutBounce(p));
  const s = seg(p, 0.35, 1);
  const k = Math.sin(s * Math.PI) * (1 - s);
  o.scale.set(1 + 0.16 * k, 1 - 0.26 * k, 1 + 0.16 * k);
  return p;
}

/** Remember a part's rest pose (used by burst / resets). */
export function rest(o: THREE.Object3D) {
  o.userData.rest = { x: o.position.x, y: o.position.y, z: o.position.z, rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z };
  return o;
}

/** Burst a part up and away (end-of-loop), scaling it down to nothing. */
export function burst(o: THREE.Object3D, t: number, start: number, dur: number, vy: number, spin: number, dx = 0, dz = 0) {
  const p = seg(t, start, start + dur);
  if (p <= 0) return false;
  const r = o.userData.rest ?? { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
  const e = easeInCubic(p);
  o.position.set(r.x + dx * e, r.y + vy * Math.sin(p * Math.PI * 0.75), r.z + dz * e);
  o.rotation.set(r.rx + spin * e, r.ry + spin * 0.6 * e, r.rz);
  o.scale.setScalar(Math.max(0.0001, 1 - e));
  o.visible = p < 1;
  return true;
}

/** Put a part back on its rest pose (x/z/rotation; y is driven by drop). */
export function reset(o: THREE.Object3D) {
  const r = o.userData.rest;
  if (!r) return;
  o.position.x = r.x;
  o.position.z = r.z;
  o.rotation.set(r.rx, r.ry, r.rz);
}

// Seeded random so every loop (and every visitor) sees the same composition.
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
