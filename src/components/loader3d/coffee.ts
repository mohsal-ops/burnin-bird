import * as THREE from "three";
import { drop, easeInOutCubic, easeOutBack, easeOutCubic, glossy, lathe, lerp, seg, shadowed, type SceneCtx, type SceneDef } from "./kit";

// Coffee / matcha: a glossy ceramic cup lands on its saucer, a silky stream
// pours in and fills it, latte art blooms and swirls on the surface, steam
// curls up — then a quick sip empties it for the next pour. Matcha green when
// the brand reads matcha/tea, latte brown otherwise.

function artTexture(base: string, foam: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  // crema: warm lighter rim fading into the drink
  const cr = g.createRadialGradient(256, 256, 60, 256, 256, 256);
  cr.addColorStop(0, base);
  cr.addColorStop(0.72, base);
  cr.addColorStop(0.9, foam + "99");
  cr.addColorStop(1, foam);
  g.fillStyle = cr;
  g.beginPath();
  g.arc(256, 256, 256, 0, Math.PI * 2);
  g.fill();
  // tulip: three stacked hearts + a pulled stem
  g.filter = "blur(2px)";
  g.fillStyle = foam;
  const heart = (cx: number, cy: number, w: number) => {
    g.beginPath();
    g.moveTo(cx, cy + w * 0.75);
    g.bezierCurveTo(cx - w * 1.35, cy - w * 0.05, cx - w * 0.75, cy - w * 1.0, cx, cy - w * 0.35);
    g.bezierCurveTo(cx + w * 0.75, cy - w * 1.0, cx + w * 1.35, cy - w * 0.05, cx, cy + w * 0.75);
    g.fill();
  };
  heart(256, 330, 120);
  g.globalCompositeOperation = "destination-out";
  heart(256, 318, 92);
  g.globalCompositeOperation = "source-over";
  heart(256, 300, 92);
  g.globalCompositeOperation = "destination-out";
  heart(256, 290, 66);
  g.globalCompositeOperation = "source-over";
  heart(256, 262, 64);
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000";
  g.fillRect(250, 150, 12, 280);
  g.globalCompositeOperation = "source-over";
  g.fillStyle = base;
  g.fillRect(252, 150, 8, 270);
  g.filter = "none";
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function coffeeScene(ctx: SceneCtx): SceneDef {
  const matcha = /matcha|tea|green/i.test(ctx.flavor || "");
  const liquidColor = matcha ? "#6fa83a" : "#6b3f22";
  const foam = matcha ? "#f3f0dc" : "#f3dfc2";

  const root = new THREE.Group();
  const ceramic = glossy("#f8f6f1", { roughness: 0.22, sheen: 0 });
  const accent = glossy(ctx.brand.clone().lerp(new THREE.Color("#ffffff"), 0.15), { roughness: 0.3 });

  const saucer = new THREE.Mesh(lathe([[0, 0], [1.3, 0], [1.55, 0.08], [1.66, 0.16], [1.6, 0.18], [1.3, 0.12], [0.75, 0.08], [0, 0.08]]), ceramic);
  const cup = new THREE.Group();
  // outer shell → rim → inner wall → inner floor (one lathe)
  const inner: [number, number][] = [[0.9, 1.13], [0.86, 0.66], [0.7, 0.24], [0, 0.2]];
  cup.add(new THREE.Mesh(lathe([[0, 0.02], [0.6, 0.02], [0.7, 0.08], [0.9, 0.6], [0.99, 1.1], [1.0, 1.17], [0.95, 1.2], ...inner], 72), ceramic));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.035, 10, 72), accent);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.92;
  cup.add(band);
  const handleGeo = new THREE.TorusGeometry(0.3, 0.075, 16, 32, Math.PI * 1.25);
  handleGeo.rotateZ(-Math.PI * 0.625);
  const handle = new THREE.Mesh(handleGeo, ceramic);
  handle.position.set(0.95, 0.62, 0);
  cup.add(handle);

  const innerR = (y: number) => {
    const pts = [...inner].reverse(); // floor → rim
    for (let i = 0; i < pts.length - 1; i++) {
      const [r0, y0] = pts[i], [r1, y1] = pts[i + 1];
      if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0));
    }
    return 0.88;
  };

  const liquidMat = glossy(liquidColor, { roughness: 0.18, clearcoat: 1, sheen: 0 });
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(1, 64), liquidMat);
  liquid.rotation.x = -Math.PI / 2;
  cup.add(liquid);
  const art = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshPhysicalMaterial({ map: artTexture(liquidColor, foam), transparent: true, roughness: 0.35, clearcoat: 0.8, depthWrite: false }),
  );
  art.rotation.x = -Math.PI / 2;
  cup.add(art);

  const streamGeo = new THREE.CylinderGeometry(0.075, 0.1, 1, 16, 1, true);
  streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, liquidMat);
  root.add(stream);

  // steam ribbons
  const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false });
  const steams = [-0.35, 0, 0.35].map((x, i) => {
    const pts = Array.from({ length: 12 }, (_, k) => new THREE.Vector3(x + Math.sin(k * 0.9 + i * 2) * 0.12, k * 0.12, Math.cos(k * 0.7 + i) * 0.06));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6, false), steamMat.clone());
    root.add(m);
    return m;
  });

  // coffee beans that tumble onto the saucer (not for matcha)
  const beanMat = glossy("#4a2a17", { roughness: 0.35 });
  const beans = matcha ? [] : Array.from({ length: 7 }, (_, i) => {
    const bn = new THREE.Group();
    const half = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), beanMat);
    half.scale.set(1, 0.62, 1.4);
    bn.add(half);
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 6, 16, Math.PI), glossy("#2a150a"));
    groove.rotation.set(0, Math.PI / 2, 0);
    groove.position.y = 0.055;
    groove.scale.set(1, 1, 1.4);
    bn.add(groove);
    const a = -0.9 + i * 0.42;
    bn.position.set(Math.cos(a) * 1.28, 0.2, Math.sin(a) * 1.28 + 0.1);
    bn.rotation.set(0.3, i * 1.3, 0.2);
    root.add(shadowed(bn));
    return bn;
  });

  saucer.position.y = 0;
  cup.position.y = 0.12;
  root.add(shadowed(saucer), shadowed(cup));

  const period = 6;
  return {
    root,
    period,
    camera: { pos: [0, 3.2, 6.1], target: [0, 0.9, 0], fov: 30 },
    update(t, time) {
      drop(saucer, 0, t, 0.05, 0.5, 2.5);
      drop(cup, 0.12, t, 0.3, 0.55, 3);
      beans.forEach((bn, i) => {
        drop(bn, 0.2, t, 3.2 + i * 0.09, 0.5, 2.4);
        bn.rotation.y = i * 1.3 + (1 - seg(t, 3.2 + i * 0.09, 3.7 + i * 0.09)) * 6;
        if (t > 5.3) bn.scale.setScalar(Math.max(0.0001, 1 - seg(t, 5.3, 5.8)));
      });
      cup.rotation.y = -0.6 + Math.sin(time * 0.7) * 0.35;

      // pour → level rises
      const fill = easeInOutCubic(seg(t, 1.0, 2.7));
      const sip = easeInOutCubic(seg(t, 5.3, 5.85));
      const level = lerp(0.22, 1.06, fill * (1 - sip));
      const r = innerR(level) * 0.985;
      liquid.visible = fill > 0.001 && sip < 0.999;
      liquid.position.y = level;
      liquid.scale.setScalar(r);

      const pouring = t > 0.95 && t < 2.95;
      stream.visible = pouring;
      if (pouring) {
        const topY = 4.2;
        const growIn = easeOutCubic(seg(t, 0.95, 1.2));
        const cut = easeInOutCubic(seg(t, 2.6, 2.95)); // stream end leaves the cup, pulling up
        const surface = cup.position.y + level;
        stream.position.set(0, topY, 0);
        const bottom = lerp(topY, surface, growIn);
        const tail = lerp(topY, surface, cut);
        stream.position.y = tail;
        stream.scale.set(1 + Math.sin(time * 20) * 0.06, Math.max(0.001, tail - bottom), 1);
      }

      // latte art blooms, then slowly swirls
      const bloom = easeOutBack(seg(t, 2.75, 3.45), 1.2) * (1 - sip);
      art.visible = bloom > 0.01;
      art.position.y = level + 0.005;
      art.scale.setScalar(Math.max(0.001, r * 0.99 * bloom));
      art.rotation.z = Math.PI + Math.sin(time * 0.6) * 0.25;
      // a little sip-tilt at the end
      cup.rotation.x = Math.sin(sip * Math.PI) * 0.22;

      steams.forEach((s, i) => {
        const on = seg(t, 3.0 + i * 0.25, 3.6 + i * 0.25) * (1 - seg(t, 5.0, 5.6));
        const cyc = ((time * 0.45 + i * 0.33) % 1);
        s.position.set(0, cup.position.y + level + 0.15 + cyc * 0.5, 0);
        (s.material as THREE.MeshBasicMaterial).opacity = on * 0.45 * Math.sin(cyc * Math.PI);
        s.scale.set(1 + cyc * 0.6, 1 + cyc * 0.4, 1);
        s.rotation.y = time * 0.6 + i;
      });
    },
  };
}
