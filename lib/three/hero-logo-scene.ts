import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "@/lib/gsap";

export type HeroLogoScene = { dispose: () => void; setPaused: (paused: boolean) => void };

/** Extrudes the original six SVG paths; the mark is never redrawn or approximated. */
export function mountHeroLogo(host: HTMLElement, source: string, onFailure: () => void, initiallyPaused = false): HeroLogoScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  const mark = new THREE.Group();
  const pointerRig = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let environment: THREE.WebGLRenderTarget | undefined;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let intro: gsap.core.Timeline | undefined;
  let ambient: gsap.core.Timeline | undefined;
  let pointerTween: gsap.core.Tween | undefined;
  let disposed = false;
  let visible = true;
  let assembled = false;
  let userPaused = initiallyPaused;
  let lastFrame = 0;
  const motionState = { float: 0, yaw: 0, pitch: 0, spread: 0 };
  const offsets = [[-0.2, 0.16], [-0.12, 0.04], [0, 0.03], [0.17, 0], [0.12, -0.17], [0.22, -0.04]];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const base = { x: 0.1, y: -0.24, z: -0.035 };
  const canvas = renderer.domElement;

  function dispose() {
    if (disposed) return;
    disposed = true;
    intro?.kill(); ambient?.kill(); pointerTween?.kill();
    resize?.disconnect(); intersection?.disconnect();
    reduced.removeEventListener("change", motionChanged);
    document.removeEventListener("visibilitychange", visibilityChanged);
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("webglcontextlost", contextLost);
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    environment?.dispose();
    renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
  }
  function render() {
    if (disposed) return;
    try { renderer.render(scene, camera); }
    catch { onFailure(); dispose(); }
  }
  function animateFrame() {
    if (disposed) return;
    const now = performance.now();
    if (now - lastFrame < 32) return;
    lastFrame = now;
    mark.position.y = motionState.float;
    mark.rotation.set(base.x + motionState.pitch, base.y + motionState.yaw, base.z);
    meshes.forEach((mesh, index) => {
      const offset = offsets[index]!;
      mesh.position.set(offset[0]! * motionState.spread, offset[1]! * motionState.spread, (0.12 + index * 0.025) * motionState.spread);
    });
    render();
  }
  function settle() {
    intro?.kill(); ambient?.pause(); pointerTween?.kill();
    meshes.forEach((mesh) => { mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); });
    mark.position.set(0, 0, 0);
    pointerRig.rotation.set(0, 0, 0);
    mark.rotation.set(base.x, base.y, base.z);
    assembled = true;
    render();
  }
  function motionChanged() {
    if (reduced.matches) settle();
    else { ambient?.restart(); visibilityChanged(); }
  }
  function visibilityChanged() {
    if (document.hidden || !visible || reduced.matches || userPaused) { intro?.pause(); ambient?.pause(); pointerTween?.pause(); }
    else if (!assembled) intro?.resume();
    else { ambient?.resume(); pointerTween?.resume(); }
  }
  function move(event: PointerEvent) {
    if (!assembled || userPaused || reduced.matches || !finePointer.matches || !visible || document.hidden) return;
    const rect = host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pointerTween?.kill();
    pointerTween = gsap.to(pointerRig.rotation, {x: y * 0.1, y: x * 0.16, duration: 0.7, ease: "power2.out", onUpdate: render});
  }
  function leave() {
    if (!assembled || userPaused || reduced.matches) return;
    pointerTween?.kill();
    pointerTween = gsap.to(pointerRig.rotation, {x: 0, y: 0, duration: 0.9, ease: "power2.out", onUpdate: render});
  }
  function contextLost(event: Event) { event.preventDefault(); onFailure(); dispose(); }

  try {
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.addEventListener("webglcontextlost", contextLost);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      environment = pmrem.fromScene(room, 0.035);
      scene.environment = environment.texture;
      scene.environmentIntensity = 1.2;
    } finally { room.dispose(); pmrem.dispose(); }

    const paths = new SVGLoader().parse(source).paths;
    if (paths.length !== 6) throw new Error("Unexpected logo path count");
    for (const path of paths) {
      const front = new THREE.MeshPhysicalMaterial({color: path.color, metalness: 0.4, roughness: 0.27, clearcoat: 0.55, clearcoatRoughness: 0.23});
      const side = new THREE.MeshStandardMaterial({color: path.color.clone().multiplyScalar(0.6), metalness: 0.5, roughness: 0.3});
      materials.push(front, side);
      for (const shape of path.toShapes()) {
        const geometry = new THREE.ExtrudeGeometry(shape, {depth: 6, bevelEnabled: true, bevelThickness: 0.48, bevelSize: 0.48, bevelSegments: 3, curveSegments: 8, steps: 1});
        geometry.translate(-90.705, -90.705, -3);
        geometry.rotateX(Math.PI);
        geometry.scale(0.057, 0.057, 0.057);
        geometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, [front, side]);
        meshes.push(mesh); mark.add(mesh);
      }
    }
    mark.rotation.set(base.x, base.y, base.z);
    pointerRig.add(mark);
    scene.add(pointerRig);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xaebbd0, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(-3, 5, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc5dcff, 2.3);
    rim.position.set(5, 1, -2); scene.add(rim);
    camera.position.set(0, 0, 12); camera.lookAt(0, 0, 0);
    camera.near = 0.1; camera.far = 40;

    function fit() {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const viewHeight = Math.max(6.75, 6.8 / aspect);
      camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render();
    }
    host.append(canvas);
    ambient = gsap.timeline({paused: true, repeat: -1, onUpdate: animateFrame});
    ambient
      .to(motionState, {float: 0.15, yaw: 0.14, pitch: -0.04, duration: 3, ease: "sine.inOut"}, 0)
      .to(motionState, {spread: 1, duration: 1.8, ease: "sine.inOut"}, 3)
      .to(motionState, {spread: 0, duration: 2.2, ease: "power2.inOut"}, 5.2)
      .to(motionState, {float: -0.09, yaw: -0.1, pitch: 0.035, duration: 3, ease: "sine.inOut"}, 6)
      .to(motionState, {float: 0, yaw: 0, pitch: 0, duration: 3, ease: "sine.inOut"}, 9);
    if (!reduced.matches && !userPaused) {
      intro = gsap.timeline({paused: true, onUpdate: render, onComplete: () => {assembled = true; render(); visibilityChanged();}});
      meshes.forEach((mesh, index) => {
        const direction = index < 3 ? -1 : 1;
        mesh.position.set(direction * 0.28, (index % 2 ? -1 : 1) * 0.2, 0.55 + index * 0.05);
        mesh.rotation.y = direction * 0.08;
        intro!.to(mesh.position, {x: 0, y: 0, z: 0, duration: 1.45, ease: "power3.out"}, 0.12 + index * 0.095);
        intro!.to(mesh.rotation, {y: 0, duration: 1.45, ease: "power3.out"}, 0.12 + index * 0.095);
      });
    } else assembled = true;
    fit();
    resize = new ResizeObserver(fit); resize.observe(host);
    intersection = new IntersectionObserver(([entry]) => {visible = entry?.isIntersecting ?? false; visibilityChanged();});
    intersection.observe(host);
    host.addEventListener("pointermove", move); host.addEventListener("pointerleave", leave);
    reduced.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    visibilityChanged();
    return {dispose, setPaused(value) {userPaused = value; visibilityChanged();}};
  } catch (error) {dispose();throw error;}
}
