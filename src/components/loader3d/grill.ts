import * as THREE from "three";
import { bumpify, burst, clay, drop, easeInOutCubic, glossy, glow, lathe, rest, reset, rng, seg, shadowed, type SceneDef } from "./kit";

// Grill: a kettle grill lands, the coals catch and flames lick up through the
// grate, three glazed hot-chicken drumsticks drop on and sizzle, each flips in
// the air in turn, embers stream up and smoke puffs roll off — then the
// drumsticks hop away and the fire dies down for the next loop.

const EMBERS = 70;

function drumstick(meat: THREE.Material, bone: THREE.Material) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 18), meat);
  m.scale.set(1.55, 0.82, 0.9);
  const p = m.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    // taper toward the bone + crispy bumps
    const x = p.getX(i);
    const k = x > 0 ? 1 - x * 0.9 : 1;
    const bump = 1 + Math.sin(i * 12.9898) * 0.035;
    p.setXYZ(i, x, p.getY(i) * k * bump, p.getZ(i) * k * bump);
  }
  bumpify(m.geometry, 0.028, 11); // crispy breading
  g.add(m);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.62, 12), bone);
  b.rotation.z = Math.PI / 2;
  b.position.x = 0.72;
  g.add(b);
  for (const dz of [-0.05, 0.05]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), bone);
    knob.position.set(1.04, 0, dz);
    g.add(knob);
  }
  return g;
}

export function grillScene(): SceneDef {
  const root = new THREE.Group();
  const grill = new THREE.Group();
  const rand = rng(3);

  const enamel = glossy("#1d1d21", { roughness: 0.25, metalness: 0.2 });
  const steel = new THREE.MeshStandardMaterial({ color: "#9aa0a8", metalness: 0.9, roughness: 0.3 });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), enamel);
  kettle.position.y = 1.5;
  grill.add(kettle);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.05, 10, 80), steel);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.5;
  grill.add(lip);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 8), steel);
    leg.position.set(Math.cos(a) * 0.62, 0.5, Math.sin(a) * 0.62);
    leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    grill.add(leg);
  }
  // grate bars
  for (let i = -5; i <= 5; i++) {
    const z = i * 0.23;
    const half = Math.sqrt(Math.max(0, 1.3 * 1.3 - z * z));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, half * 2, 8), steel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.48, z);
    grill.add(bar);
  }

  // coals + glowing embers in the bowl
  const coals = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.15), clay("#2a2422", { roughness: 1, clearcoat: 0 }), 26);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
  for (let i = 0; i < 26; i++) {
    const r = 0.95 * Math.sqrt(rand()), a = rand() * Math.PI * 2;
    q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
    m4.compose(v.set(Math.cos(a) * r, 1.05 + rand() * 0.08, Math.sin(a) * r), q, s3.setScalar(0.8 + rand() * 0.5));
    coals.setMatrixAt(i, m4);
  }
  grill.add(coals);
  const hotMat = new THREE.MeshStandardMaterial({ color: "#3a1a0c", emissive: new THREE.Color("#ff5a14"), emissiveIntensity: 0 });
  const hot: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), hotMat);
    const r = 0.8 * Math.sqrt(rand()), a = rand() * Math.PI * 2;
    h.position.set(Math.cos(a) * r, 1.13, Math.sin(a) * r);
    grill.add(h);
    hot.push(h);
  }
  const fireLight = new THREE.PointLight("#ff7a2a", 0, 5, 1.6);
  fireLight.position.set(0, 1.35, 0);
  grill.add(fireLight);

  // flames: teardrop lathes, additive, flickering
  const flameGeo = lathe(Array.from({ length: 14 }, (_, i) => {
    const y = i / 13;
    return [0.16 * Math.pow(Math.sin(Math.PI * Math.min(1, y * 1.15)), 0.8) * (1 - y * 0.55), y * 0.75] as [number, number];
  }), 20);
  const outer = glow("#ff6a1a", 0.8), innerMat = glow("#ffd23f", 0.9);
  const flames: { o: THREE.Group; ph: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Group();
    f.add(new THREE.Mesh(flameGeo, outer));
    const core = new THREE.Mesh(flameGeo, innerMat);
    core.scale.setScalar(0.55);
    f.add(core);
    const r = 0.85 * Math.sqrt(rand()), a = rand() * Math.PI * 2;
    f.position.set(Math.cos(a) * r, 1.12, Math.sin(a) * r);
    grill.add(f);
    flames.push({ o: f, ph: rand() * 10 });
  }
  root.add(shadowed(grill, true, false));

  // drumsticks
  const meat = glossy("#9a3a10", { roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.8, sheenColor: new THREE.Color("#ff8a3d") });
  const bone = clay("#f3e9d6", { roughness: 0.5 });
  const sticks = [-0.45, 0.15, 0.7].map((z, i) => {
    const d = drumstick(meat, bone);
    d.position.set(-0.3 + (i % 2) * 0.25, 1.72, z - 0.15);
    d.rotation.y = 0.3 - i * 0.25;
    rest(d);
    root.add(shadowed(d));
    return d;
  });

  // embers
  const emberGeo = new THREE.BufferGeometry();
  const ep = new Float32Array(EMBERS * 3);
  emberGeo.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: "#ffb347", size: 0.06, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const seeds = Array.from({ length: EMBERS }, () => ({ x: (rand() - 0.5) * 2, z: (rand() - 0.5) * 2, sp: 0.6 + rand() * 0.9, off: rand() }));
  root.add(embers);

  // smoke puffs
  const smoke = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshStandardMaterial({ color: "#d8d4cf", transparent: true, opacity: 0, depthWrite: false, roughness: 1 }));
    root.add(m);
    return { m, off: i / 6, x: (rand() - 0.5) * 1.2 };
  });

  const period = 6.4;
  return {
    root,
    period,
    camera: { pos: [0, 4.4, 6.2], target: [0, 1.35, 0], fov: 32 },
    update(t, time) {
      drop(grill, 0, t, 0.05, 0.55, 2.6);
      root.rotation.y = time * 0.28;
      const fire = seg(t, 0.55, 1.1) * (1 - seg(t, 5.7, 6.3));

      hotMat.emissiveIntensity = fire * (1.6 + Math.sin(time * 13) * 0.4 + Math.sin(time * 7.3) * 0.3);
      fireLight.intensity = fire * (7 + Math.sin(time * 17) * 1.5 + Math.sin(time * 9) * 1.2);
      flames.forEach(({ o, ph }) => {
        const fl = 0.75 + Math.sin(time * 14 + ph) * 0.18 + Math.sin(time * 23 + ph * 2) * 0.1;
        o.visible = fire > 0.01;
        o.scale.set(fire * (0.9 + Math.sin(time * 9 + ph) * 0.1), fire * fl * 1.1, fire * (0.9 + Math.cos(time * 11 + ph) * 0.1));
        o.rotation.y = time * 2 + ph;
      });

      sticks.forEach((d, i) => {
        reset(d);
        if (burst(d, t, 5.25 + i * 0.08, 0.7, 2.4, 4, (i - 1) * 1.6, 1.2)) return;
        drop(d, 1.72, t, 1.05 + i * 0.18, 0.5, 2.8);
        // sizzle jitter
        if (t > 1.6) d.position.y += Math.abs(Math.sin(time * 38 + i)) * 0.012;
        // each flips in turn
        const f = seg(t, 2.35 + i * 0.55, 2.95 + i * 0.55);
        if (f > 0) {
          d.position.y += Math.sin(f * Math.PI) * 0.95;
          d.rotation.x = easeInOutCubic(f) * Math.PI * 2;
          d.rotation.z = Math.sin(f * Math.PI) * 0.3;
        }
      });

      const pos = emberGeo.attributes.position as THREE.BufferAttribute;
      seeds.forEach((e, i) => {
        const c = (time * e.sp * 0.5 + e.off) % 1;
        pos.setXYZ(i, e.x * (0.9 + c * 0.4) + Math.sin(time * 3 + i) * 0.05, 1.45 + c * 2.2, e.z * (0.9 + c * 0.4));
      });
      pos.needsUpdate = true;
      (embers.material as THREE.PointsMaterial).opacity = fire * 0.95;

      smoke.forEach(({ m, off, x }) => {
        const c = (time * 0.22 + off) % 1;
        const on = seg(t, 1.6, 2.4) * (1 - seg(t, 5.6, 6.2));
        m.position.set(x + Math.sin(c * 4 + off * 9) * 0.2, 1.9 + c * 2.1, -0.2 + Math.cos(c * 3) * 0.2);
        m.scale.setScalar(0.4 + c * 1.3);
        (m.material as THREE.MeshStandardMaterial).opacity = on * 0.2 * Math.sin(c * Math.PI);
      });
    },
  };
}
