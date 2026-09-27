import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { SceneCtx, SceneDef } from "./kit";
import { burgerScene } from "./burger";
import { pizzaScene } from "./pizza";
import { coffeeScene } from "./coffee";
import { bowlScene } from "./bowl";
import { grillScene } from "./grill";

// Real-time 3D intro loader. One tiny WebGL stage (soft studio lighting, a
// brand-tinted rim light, contact shadows, a studio environment for glossy
// reflections) hosting one procedural "clay toy" food scene that loops its own
// choreography. Loaded lazily by LoadingScreen, so three.js never ships in the
// main bundle. Returns a disposer.

export type Loader3DVariant = "burger" | "pizza" | "coffee" | "bowl" | "grill";

const SCENES: Record<Loader3DVariant, (ctx: SceneCtx) => SceneDef> = {
  burger: burgerScene,
  pizza: pizzaScene,
  coffee: coffeeScene,
  bowl: bowlScene,
  grill: grillScene,
};

export function mountLoader3D(
  canvas: HTMLCanvasElement,
  variant: Loader3DVariant,
  opts: { brand: string; flavor?: string; reduced?: boolean; onFirstFrame?: () => void },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.32;

  const brand = new THREE.Color(opts.brand);
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xd9c9b3, 0.45));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.0);
  key.position.set(3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.0008;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(brand, 2.6);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff3e0, 0.6);
  fill.position.set(-4, 2, 5);
  scene.add(fill);

  // shadow catcher
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const def = SCENES[variant]({ brand, flavor: opts.flavor });
  scene.add(def.root);

  const cam = def.camera ?? { pos: [0, 3.3, 6.4] as [number, number, number], target: [0, 0.75, 0] as [number, number, number] };
  const camera = new THREE.PerspectiveCamera(cam.fov ?? 30, 1, 0.1, 100);
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.target));

  const resize = () => {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let raf = 0;
  let first = true;
  const t0 = performance.now();
  const frame = () => {
    const time = (performance.now() - t0) / 1000;
    const t = opts.reduced ? def.period * 0.62 : time % def.period;
    def.update(t, opts.reduced ? 0 : time);
    renderer.render(scene, camera);
    if (first) {
      first = false;
      opts.onFirstFrame?.();
    }
    if (!opts.reduced) raf = requestAnimationFrame(frame);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}
