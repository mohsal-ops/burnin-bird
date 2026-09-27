import * as THREE from "three";
import { clay, drop, easeInOutCubic, easeOutBack, easeInCubic, glossy, lerp, rng, seg, shadowed, type SceneDef } from "./kit";

// Pizza: eight slices spin in and lock into a pie, pepperoni + basil rain down,
// then one slice lifts toward you trailing stretchy cheese strings, drops back,
// the whole pie gets a dough-toss flip — and flies apart to start over.

const R = 1.55;
const N = 8;
const TH = (Math.PI * 2) / N;

export function pizzaScene(): SceneDef {
  const root = new THREE.Group();
  const pie = new THREE.Group();
  root.add(pie);
  const rand = rng(5);

  const doughMat = clay("#e2a95e", { roughness: 0.7 });
  const crustMat = glossy("#c9782c", { roughness: 0.55, clearcoat: 0.35, sheen: 0.5, sheenColor: new THREE.Color("#ffc98a") });
  const sauceMat = glossy("#b8230f", { roughness: 0.3 });
  const cheeseMat = glossy("#ffc234", { roughness: 0.4, clearcoat: 0.55 });
  const pepMat = glossy("#9a1d12", { roughness: 0.3 });
  const basilMat = glossy("#3e8f3a", { roughness: 0.4 });

  const crustGeo = new THREE.TorusGeometry(R - 0.02, 0.15, 14, 20, TH);
  crustGeo.rotateX(-Math.PI / 2);
  crustGeo.rotateY(-(Math.PI / 2 + TH / 2));
  const cheeseGeo = new THREE.CylinderGeometry(R - 0.3, R - 0.3, 0.05, 18, 1, false, -TH / 2, TH);
  {
    const p = cheeseGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + Math.sin(p.getX(i) * 9) * Math.cos(p.getZ(i) * 7) * 0.02);
    cheeseGeo.computeVertexNormals();
  }

  type Slice = { g: THREE.Group; toppings: { o: THREE.Object3D; y: number }[] };
  const slices: Slice[] = [];
  for (let k = 0; k < N; k++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, 0.12, 18, 1, false, -TH / 2, TH), doughMat));
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.position.y = 0.08;
    g.add(crust);
    const sauce = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.14, R - 0.14, 0.03, 18, 1, false, -TH / 2, TH), sauceMat);
    sauce.position.y = 0.075;
    g.add(sauce);
    const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
    cheese.position.y = 0.1;
    g.add(cheese);
    const toppings: Slice["toppings"] = [];
    const count = 2 + (k % 2);
    for (let j = 0; j < count; j++) {
      const rho = 0.45 + rand() * 0.75;
      const a = (rand() - 0.5) * TH * 0.55;
      const isBasil = j === count - 1 && k % 3 === 0;
      const t = isBasil
        ? new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), basilMat)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 22), pepMat);
      if (isBasil) t.scale.set(1, 0.18, 0.55);
      t.position.set(Math.sin(a) * rho, 0, Math.cos(a) * rho);
      t.rotation.y = rand() * Math.PI;
      const y = isBasil ? 0.15 : 0.145;
      t.position.y = y;
      g.add(t);
      toppings.push({ o: t, y });
    }
    g.rotation.y = k * TH;
    pie.add(shadowed(g));
    slices.push({ g, toppings });
  }

  // cheese strings for the pull
  const stringMat = glossy("#ffcf4d", { roughness: 0.35 });
  const strings = Array.from({ length: 7 }, () => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), stringMat);
    m.castShadow = true;
    root.add(m);
    return m;
  });
  const anchors = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ rho: 0.3 + i * 0.13, side: i % 2 ? 1 : -1 }));
  const tmp = new THREE.Vector3();

  const period = 6.2;
  return {
    root,
    period,
    camera: { pos: [0, 4.6, 5.6], target: [0, 0.2, 0.2], fov: 32 },
    update(t, time) {
      // toss (flip + spin) of the whole pie
      const toss = seg(t, 3.9, 5.0);
      pie.position.y = Math.sin(toss * Math.PI) * 0.85;
      pie.scale.setScalar(1 - Math.sin(toss * Math.PI) * 0.18);
      pie.rotation.x = easeInOutCubic(toss) * Math.PI * 2;
      pie.rotation.y = time * 0.25 + easeInOutCubic(toss) * Math.PI;

      slices.forEach(({ g, toppings }, k) => {
        const phi = k * TH;
        // fly in: from far out + above, spinning, landing with overshoot
        const inP = seg(t, 0.05 + k * 0.08, 0.7 + k * 0.08);
        const outP = seg(t, 5.25 + k * 0.03, 5.9 + k * 0.03);
        const dist = (1 - easeOutBack(inP, 1.4)) * 3.2 + easeInCubic(outP) * 3.4;
        g.visible = inP > 0 && outP < 1;
        g.position.set(Math.sin(phi) * dist, (1 - inP) * 1.6 + outP * 1.2, Math.cos(phi) * dist);
        g.rotation.set(0, phi + (1 - inP) * 2.5 - outP * 2.5, 0);
        g.scale.setScalar(inP < 1 ? 0.6 + 0.4 * inP : 1 - outP * 0.9);

        // the hero slice (k=0 faces the camera) lifts out for the cheese pull
        if (k === 0) {
          const up = easeInOutCubic(seg(t, 2.25, 2.95)) * (1 - easeInOutCubic(seg(t, 3.35, 3.8)));
          g.position.z += up * 1.45;
          g.position.y += up * 1.15;
          g.rotation.x = -up * 0.45;
        }
        toppings.forEach(({ o, y }, j) => drop(o, y, t, 1.05 + (k * 3 + j) * 0.035, 0.42, 1.6));
      });

      // strings: from the pie to the lifted slice, sagging, thinning as they stretch
      const hero = slices[0].g;
      const on = t > 2.25 && t < 3.8 && hero.position.z > 0.03;
      hero.updateMatrixWorld();
      pie.updateMatrixWorld();
      strings.forEach((s, i) => {
        s.visible = on;
        if (!on) return;
        const a = anchors[i];
        const ang = a.side * (TH / 2) * 0.96;
        const local = new THREE.Vector3(Math.sin(ang) * a.rho, 0.11, Math.cos(ang) * a.rho);
        const end = local.clone().applyMatrix4(hero.matrixWorld);
        // matching point on the neighbouring (resting) slice edge
        const start = tmp.set(Math.sin(ang) * a.rho, 0.11, Math.cos(ang) * a.rho).applyMatrix4(pie.matrixWorld).clone();
        const len = start.distanceTo(end);
        const mid = start.clone().lerp(end, 0.5);
        mid.y -= len * 0.28;
        const curve = new THREE.CatmullRomCurve3([start, start.clone().lerp(mid, 0.5), mid, end.clone().lerp(mid, 0.5), end]);
        s.geometry.dispose();
        s.geometry = new THREE.TubeGeometry(curve, 24, lerp(0.07, 0.02, Math.min(1, len / 2)), 8, false);
      });
    },
  };
}
