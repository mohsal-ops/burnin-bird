import * as THREE from "three";
import { burst, clay, drop, easeInCubic, easeOutBack, easeOutCubic, glossy, lathe, lerp, rest, reset, rng, seg, shadowed, type SceneCtx, type SceneDef } from "./kit";

// Bowl: a ceramic bowl lands, a stream of hundreds of rice grains pours in and
// piles into a mound, toppings drop on one by one (salmon, avocado fan,
// edamame, a jammy egg), sesame rains, chopsticks slide onto the rim — then the
// whole thing fountains up and out, and it starts again.

const GRAINS = 460;

export function bowlScene(ctx: SceneCtx): SceneDef {
  const root = new THREE.Group();
  const bowl = new THREE.Group();
  const rand = rng(21);

  const ceramic = glossy("#1f2c3b", { roughness: 0.22, clearcoat: 1 });
  bowl.add(new THREE.Mesh(lathe([[0, 0], [0.55, 0], [0.62, 0.05], [1.05, 0.42], [1.38, 0.88], [1.46, 1.0], [1.4, 1.03], [1.32, 0.95], [1.0, 0.5], [0.5, 0.2], [0, 0.18]], 80), ceramic));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.04, 10, 96), glossy(ctx.brand, { roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.0;
  bowl.add(rim);
  root.add(shadowed(bowl));

  // mound height at radius r (bowl interior is ~r<1.3 at the top)
  const top = (r: number) => 0.62 + 0.36 * (1 - Math.pow(r / 1.2, 2));

  // rice — instanced grains with precomputed rest spots on the mound surface
  const rice = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.042, 0.09, 2, 6), clay("#fffdf6", { roughness: 0.45, clearcoat: 0.5 }), GRAINS);
  rice.castShadow = true;
  rice.frustumCulled = false; // bounds change every frame as grains pour
  const restPos: THREE.Vector3[] = [];
  const restRot: THREE.Quaternion[] = [];
  for (let i = 0; i < GRAINS; i++) {
    const r = 1.18 * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    restPos.push(new THREE.Vector3(Math.cos(a) * r, top(r) - rand() * 0.06, Math.sin(a) * r));
    restRot.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3)));
  }
  root.add(rice);

  // toppings
  const place = (o: THREE.Object3D, r: number, a: number, lift = 0.05) => {
    o.position.set(Math.cos(a) * r, top(r) + lift, Math.sin(a) * r);
    return o;
  };
  const toppings: { o: THREE.Object3D; y: number }[] = [];
  const add = (o: THREE.Object3D) => {
    rest(o);
    toppings.push({ o, y: o.position.y });
    root.add(shadowed(o));
  };
  const salmonMat = glossy("#ff7a45", { roughness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.24, 2, 2, 2), salmonMat);
    place(s, 0.62 + (i % 2) * 0.22, Math.PI * 0.35 + i * 0.3, 0.08);
    s.rotation.set(0.1, rand() * 2, 0.1);
    add(s);
  }
  const avoMat = glossy("#9bcf3a", { roughness: 0.35 });
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), avoMat);
    s.scale.set(0.42, 0.28, 1);
    place(s, 0.7, Math.PI * 1.15 + i * 0.16, 0.02);
    s.rotation.set(0, Math.PI * 1.15 + i * 0.16, 0.25);
    add(s);
  }
  const edaMat = glossy("#72b843", { roughness: 0.4 });
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), edaMat);
    place(s, 0.45 + rand() * 0.45, Math.PI * 1.75 + rand() * 0.7, 0.06);
    add(s);
  }
  const egg = new THREE.Group();
  egg.add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glossy("#fffaf0")));
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12), glossy("#ffab00", { roughness: 0.15 }));
  yolk.scale.y = 0.45;
  yolk.position.y = 0.02;
  egg.add(yolk);
  egg.rotation.x = Math.PI; // dome down, cut face up
  place(egg, 0.1, 0, 0.3);
  egg.rotation.set(Math.PI, 0, 0.15);
  add(egg);

  // sesame sprinkle
  const sesame = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 6, 4), clay("#f7ecd0"), 60);
  const sesPos: THREE.Vector3[] = [];
  for (let i = 0; i < 60; i++) {
    const r = 1.05 * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    sesPos.push(new THREE.Vector3(Math.cos(a) * r, top(r) + 0.2, Math.sin(a) * r));
  }
  sesame.frustumCulled = false;
  root.add(sesame);

  // chopsticks
  const sticks = new THREE.Group();
  const wood = clay("#c8955a", { roughness: 0.6 });
  for (const dz of [-0.09, 0.09]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, 2.7, 12), wood);
    c.rotation.z = Math.PI / 2;
    c.position.set(0.3, 1.1, dz);
    sticks.add(c);
  }
  sticks.rotation.y = -0.5;
  root.add(shadowed(sticks));

  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0.0001, 0.0001, 0.0001);
  const period = 6.2;
  return {
    root,
    period,
    camera: { pos: [0, 4.2, 5.6], target: [0, 0.7, 0], fov: 31 },
    update(t, time) {
      drop(bowl, 0, t, 0.05, 0.55, 2.6);
      root.rotation.y = time * 0.3;
      const fountain = t - 4.95;

      // rice pour: grains stream from above, fall and settle into their spot
      for (let i = 0; i < GRAINS; i++) {
        const start = 0.55 + (i / GRAINS) * 1.25;
        const p = seg(t, start, start + 0.42);
        if (p <= 0 || (fountain > 0 && fountain > 0.9 + (i % 7) * 0.02)) {
          m4.compose(v.set(0, -5, 0), q, zero);
        } else if (fountain > 0) {
          const f = fountain;
          const rp = restPos[i];
          const vy = 3 + ((i * 37) % 17) / 6;
          v.set(rp.x * (1 + f * 1.8), rp.y + vy * f - 6 * f * f, rp.z * (1 + f * 1.8));
          m4.compose(v, restRot[i], one.clone().multiplyScalar(Math.max(0.0001, 1 - f / 0.95)));
        } else {
          const rp = restPos[i];
          const e = easeOutCubic(p);
          v.set(lerp(rp.x * 0.12, rp.x, e), lerp(3.6, rp.y, easeInCubic(Math.min(1, p * 1.15))), lerp(rp.z * 0.12, rp.z, e));
          m4.compose(v, restRot[i], one);
        }
        rice.setMatrixAt(i, m4);
      }
      rice.instanceMatrix.needsUpdate = true;

      toppings.forEach(({ o, y }, i) => {
        reset(o);
        if (!burst(o, t, 4.95 + (i % 5) * 0.03, 0.75, 2.2 + (i % 4) * 0.5, 3, (o.position.x) * 1.4, (o.position.z) * 1.4)) {
          drop(o, y, t, 1.95 + i * 0.075, 0.45, 2.2);
        }
      });

      for (let i = 0; i < 60; i++) {
        const p = seg(t, 3.35 + (i % 12) * 0.02, 3.7 + (i % 12) * 0.02);
        const gone = seg(t, 4.95, 5.4);
        const sp = sesPos[i];
        if (p <= 0 || gone >= 1) m4.compose(v.set(0, -5, 0), q, zero);
        else m4.compose(v.set(sp.x, lerp(sp.y + 2.2, sp.y - 0.17, easeOutCubic(p)) + gone * 2, sp.z), q, one);
        sesame.setMatrixAt(i, m4);
      }
      sesame.instanceMatrix.needsUpdate = true;

      // chopsticks slide in from the side and settle on the rim
      const cs = easeOutBack(seg(t, 3.55, 4.1), 1.3);
      const csOut = easeInCubic(seg(t, 4.95, 5.5));
      sticks.visible = t >= 3.55 && csOut < 1;
      sticks.position.set(lerp(3.5, 0, cs) + csOut * 3.5, csOut * 1.2, 0);
    },
  };
}
