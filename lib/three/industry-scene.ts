import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildSemiconductorModel } from "./semiconductor-scene";
import { buildBatteryModel } from "./battery-scene";

type Point = [number, number, number];
export type IndustryKind = "semiconductor" | "battery";
export type IndustryStudio = {
  renderer: THREE.WebGLRenderer;
  machine: THREE.Group;
  textures: Set<THREE.Texture>;
  standard: (p: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  physical: (p: THREE.MeshPhysicalMaterialParameters) => THREE.MeshPhysicalMaterial;
  geometry: (key: string, build: () => THREE.BufferGeometry) => THREE.BufferGeometry;
  mesh: (shape: THREE.BufferGeometry, material: THREE.Material, position: Point, parent?: THREE.Object3D) => THREE.Mesh;
  box: (size: Point, position: Point, material?: THREE.Material, radius?: number) => THREE.Mesh;
  cylinder: (radius: number, height: number, position: Point, material?: THREE.Material) => THREE.Mesh;
  ring: (radius: number, tube: number, position: Point, material?: THREE.Material) => THREE.Mesh;
  tube: (points: Point[], radius?: number, material?: THREE.Material) => void;
  link: (start: Point, end: Point, width: number, height: number, material?: THREE.Material) => THREE.Mesh;
};

/** Static product studies: render on mount/resize only, without an idle loop. */
export function mountIndustryScene(host: HTMLElement, kind: IndustryKind, onContextLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let environment: THREE.WebGLRenderTarget | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let disposed = false;
  const canvas = renderer.domElement;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    resizeObserver?.disconnect();
    canvas.removeEventListener("webglcontextlost", loseContext);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    environment?.dispose();
    renderer.dispose();
    canvas.remove();
  };

  const loseContext = (event: Event) => {
    event.preventDefault();
    onContextLost();
    dispose();
  };

  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    canvas.addEventListener("webglcontextlost", loseContext);

    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.65;
    } finally {
      room.dispose();
      pmrem.dispose();
    }

    function standard(parameters: THREE.MeshStandardMaterialParameters) {
      const material = new THREE.MeshStandardMaterial(parameters);
      materials.add(material);
      return material;
    }
    function physical(parameters: THREE.MeshPhysicalMaterialParameters) {
      const material = new THREE.MeshPhysicalMaterial(parameters);
      materials.add(material);
      return material;
    }
    function geometry(key: string, build: () => THREE.BufferGeometry) {
      let value = geometries.get(key);
      if (!value) {
        value = build();
        geometries.set(key, value);
      }
      return value;
    }

    const defaultMaterial = standard({color: 0xd8e0de, roughness: 0.3, metalness: 0.4});
    const machine = new THREE.Group();
    scene.add(machine);
    function mesh(shape: THREE.BufferGeometry, material: THREE.Material, position: Point, parent: THREE.Object3D = machine) {
      const object = new THREE.Mesh(shape, material);
      object.position.set(...position);
      object.castShadow = !(material.transparent && material.opacity < 0.3);
      object.receiveShadow = true;
      parent.add(object);
      return object;
    }
    function box(size: Point, position: Point, material: THREE.Material = defaultMaterial, radius = 0.035) {
      return mesh(geometry(`box:${size}:${radius}`, () => new RoundedBoxGeometry(...size, 2, radius)), material, position);
    }
    function cylinder(radius: number, height: number, position: Point, material: THREE.Material = defaultMaterial) {
      return mesh(geometry(`cylinder:${radius}:${height}`, () => new THREE.CylinderGeometry(radius, radius, height, 48)), material, position);
    }
    function ring(radius: number, tube: number, position: Point, material: THREE.Material = defaultMaterial) {
      const object = mesh(geometry(`ring:${radius}:${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 64)), material, position);
      object.rotation.x = Math.PI / 2;
      return object;
    }
    function tube(points: Point[], radius = 0.035, material: THREE.Material = defaultMaterial) {
      const path = new THREE.CurvePath<THREE.Vector3>();
      const vectors = points.map((point) => new THREE.Vector3(...point));
      // Rounded elbows with straight pipe runs between them.
      let previous = vectors[0];
      for (let i = 1; i < vectors.length - 1; i++) {
        const current = vectors[i]!;
        const before = vectors[i - 1]!;
        const after = vectors[i + 1]!;
        const bend = Math.min(0.13, current.distanceTo(before) / 3, current.distanceTo(after) / 3);
        const incoming = current.clone().add(before.clone().sub(current).normalize().multiplyScalar(bend));
        const outgoing = current.clone().add(after.clone().sub(current).normalize().multiplyScalar(bend));
        path.add(new THREE.LineCurve3(previous, incoming));
        path.add(new THREE.QuadraticBezierCurve3(incoming, current, outgoing));
        previous = outgoing;
      }
      path.add(new THREE.LineCurve3(previous, vectors[vectors.length - 1]));
      mesh(geometry(`tube:${points}:${radius}`, () => new THREE.TubeGeometry(path, 64, radius, 8, false)), material, [0, 0, 0]);
    }
    function link(start: Point, end: Point, width: number, height: number, material: THREE.Material = defaultMaterial) {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const center = a.clone().add(b).multiplyScalar(0.5);
      const part = box([a.distanceTo(b), height, width], center.toArray() as Point, material, 0.045);
      part.rotation.y = -Math.atan2(end[2] - start[2], end[0] - start[0]);
      return part;
    }

    const studio = {renderer, machine, textures, standard, physical, geometry, mesh, box, cylinder, ring, tube, link};
    if (kind === "semiconductor") buildSemiconductorModel(studio);
    else buildBatteryModel(studio);

    // Broad studio illumination and a transparent shadow catcher.
    scene.add(new THREE.HemisphereLight(0xf4f9ff, 0xb8b4aa, 1.8));
    const key = new THREE.DirectionalLight(0xfff8ed, 4.3);
    key.position.set(-3.5, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7ebff, 2.2);
    fill.position.set(5, 4, -3);
    scene.add(fill);
    const shadow = new THREE.ShadowMaterial({ opacity: 0.13 });
    materials.add(shadow);
    const floor = mesh(geometry("floor", () => new THREE.PlaneGeometry(200, 200)), shadow, [0, 0.015, 0], scene);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;

    const camera = new THREE.OrthographicCamera();
    camera.position.set(...(kind === "battery" ? [7.5, 6.5, 11] as Point : [8.2, 6.7, 10] as Point));
    camera.lookAt(...(kind === "battery" ? [0, 1.65, 0] as Point : [-0.12, 1.8, 0.1] as Point));
    camera.near = 0.1;
    camera.far = 100;
    function render() {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const viewHeight = Math.max(5.1, (kind === "battery" ? 6.7 : 6.9) / aspect);
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    }

    host.append(canvas);
    render();
    resizeObserver = new ResizeObserver(() => {
      try {
        render();
      } catch {
        onContextLost();
        dispose();
      }
    });
    resizeObserver.observe(host);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
