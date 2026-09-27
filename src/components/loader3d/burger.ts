import * as THREE from "three";
import { burst, bumpify, clay, drop, heightTint, easeInOutCubic, glossy, lathe, reset, rest, rng, seg, shadowed, type SceneDef } from "./kit";

// Burger: every layer drops in from above and lands with a squash, the stack
// does a happy hop-and-spin, idles, then everything bursts apart — and builds
// itself again.

export function burgerScene(): SceneDef {
  const root = new THREE.Group();
  const stack = new THREE.Group();
  root.add(stack);
  const R = rng(11);

  const bunMat = glossy("#ffffff", { vertexColors: true, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: new THREE.Color("#ffcf8a") });

  // bottom bun
  const bunBottom = new THREE.Mesh(heightTint(lathe([[0, 0], [1.02, 0], [1.16, 0.06], [1.22, 0.18], [1.18, 0.3], [1.05, 0.34], [0, 0.34]]), "#b8641f", "#f2c27a", 0, 0.34), bunMat);

  // patty — bumpy, seared
  const patty = new THREE.Mesh(
    bumpify(lathe([[0, 0], [1.18, 0], [1.3, 0.08], [1.32, 0.2], [1.24, 0.3], [0, 0.32]], 72), 0.035, 6),
    clay("#4a2415", { roughness: 0.8, clearcoat: 0.25, sheen: 0 }),
  );

  // cheese — a square slice whose corners melt down over the patty
  const cheeseGeo = new THREE.PlaneGeometry(2.35, 2.35, 28, 28);
  cheeseGeo.rotateX(-Math.PI / 2);
  {
    const p = cheeseGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 1.12) p.setY(i, -Math.pow(r - 1.12, 2) * 1.7 - (r - 1.12) * 0.25);
    }
    cheeseGeo.rotateY(Math.PI / 4);
    cheeseGeo.computeVertexNormals();
  }
  const cheese = new THREE.Mesh(cheeseGeo, glossy("#ffae00", { roughness: 0.42, clearcoat: 0.35, side: THREE.DoubleSide, sheen: 0 }));

  // lettuce — ruffled ring
  const lettuceGeo = new THREE.CylinderGeometry(1.52, 1.02, 0.08, 160, 3);
  {
    const p = lettuceGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const r = Math.hypot(x, z);
      const k = Math.max(0, (r - 1.0) / 0.52);
      const rr = r * (1 + 0.05 * Math.sin(a * 7) * k);
      p.setXYZ(i, (x / r) * rr, y + k * (0.09 * Math.sin(a * 11) + 0.05 * Math.sin(a * 23 + 1)), (z / r) * rr);
    }
    lettuceGeo.computeVertexNormals();
  }
  const lettuce = new THREE.Mesh(lettuceGeo, clay("#46a826", { roughness: 0.45, clearcoat: 0.5, sheenColor: new THREE.Color("#b6ee7a") }));

  // tomato slices
  const tomato = new THREE.Group();
  const tomatoMat = glossy("#d62d1c");
  for (const [x, z] of [[-0.62, 0.3], [0.66, 0.1], [0.05, -0.62]] as [number, number][]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 40), tomatoMat);
    s.position.set(x, 0.06, z);
    tomato.add(s);
  }

  // top bun dome + sesame seeds
  const domePts: [number, number][] = [[0, 0], [1.16, 0], [1.25, 0.09]];
  for (let i = 1; i <= 22; i++) {
    const a = (i / 22) * (Math.PI / 2);
    domePts.push([1.25 * Math.cos(a), 0.09 + 0.98 * Math.sin(a)]);
  }
  const bunTop = new THREE.Group();
  bunTop.add(new THREE.Mesh(heightTint(lathe(domePts, 72), "#f0bd72", "#a9571a", 0.05, 1.05), bunMat));
  const seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), clay("#fff4dc", { roughness: 0.4 }), 46);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 0.42, 0.62), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 46; i++) {
    const a = 0.2 + R() * 1.1;
    const phi = R() * Math.PI * 2;
    const n = new THREE.Vector3(Math.cos(a) * Math.cos(phi), Math.sin(a), Math.cos(a) * Math.sin(phi)).normalize();
    pos.set(1.25 * Math.cos(a) * Math.cos(phi), 0.09 + 0.98 * Math.sin(a), 1.25 * Math.cos(a) * Math.sin(phi)).addScaledVector(n, 0.012);
    q.setFromUnitVectors(up, n);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(up, R() * Math.PI));
    m4.compose(pos, q, sc);
    seeds.setMatrixAt(i, m4);
  }
  bunTop.add(seeds);

  // bottom → top with rest heights
  const parts: { o: THREE.Object3D; y: number }[] = [
    { o: bunBottom, y: 0 },
    { o: patty, y: 0.3 },
    { o: cheese, y: 0.63 },
    { o: lettuce, y: 0.66 },
    { o: tomato, y: 0.7 },
    { o: bunTop, y: 0.83 },
  ];
  parts.forEach(({ o, y }) => {
    o.position.y = y;
    rest(o);
    stack.add(shadowed(o));
  });

  const period = 5.4;
  return {
    root,
    period,
    update(t, time) {
      parts.forEach(({ o, y }, i) => {
        reset(o);
        if (!burst(o, t, 4.35 + i * 0.05, 0.75, 2.2 + i * 0.35, (i % 2 ? 1 : -1) * 2.4, (i - 2.5) * 0.35, 0.6)) {
          drop(o, y, t, 0.12 + i * 0.2, 0.6, 3.4);
        }
      });
      // hop + spin once assembled, then a slow showroom turn with a gentle float
      const hop = seg(t, 1.75, 2.75);
      stack.position.y = Math.sin(hop * Math.PI) * 0.55 + (t > 2.75 ? Math.sin((t - 2.75) * 2.4) * 0.05 : 0);
      stack.rotation.y = time * 0.45 + easeInOutCubic(hop) * Math.PI * 2;
      stack.rotation.z = Math.sin(hop * Math.PI) * 0.08;
    },
  };
}
