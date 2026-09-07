import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "@/lib/gsap";
import { buildAutomationAssembly } from "./automation-assembly";

type Point = [number, number, number];
export type EngineeringScene = { dispose: () => void; setPaused: (paused: boolean) => void };
type Options = {
  labels: { width: string; height: string; depth: string };
  onPhase: (phase: number) => void;
  onFailure: () => void;
  paused: boolean;
};

/** A readable CAD assembly at every frame, with motion confined to its mechanisms. */
export function mountEngineeringScene(host: HTMLElement, options: Options): EngineeringScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const root = new THREE.Group();
  scene.add(root);
  let assembly: ReturnType<typeof buildAutomationAssembly> | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let disposed = false;
  let visible = false;
  let userPaused = options.paused;
  let lastFrame = 0;
  let lastPhase = -1;
  let timeline: gsap.core.Timeline | undefined;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = { travel: -0.55, turn: 0, angle: -0.13, review: 0.75, scan: -4.5, scanOpacity: 0, phase: 0 };
  const canvas = renderer.domElement;
  let render = () => {};

  function dispose() {
    if (disposed) return;
    disposed = true;
    timeline?.kill();
    resize?.disconnect();
    intersection?.disconnect();
    motion.removeEventListener("change", updateMotion);
    document.removeEventListener("visibilitychange", syncPlayback);
    canvas.removeEventListener("webglcontextlost", contextLost);
    assembly?.dispose();
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    textures.forEach((item) => item.dispose());
    environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    options.onFailure();
    dispose();
  }
  function syncPlayback() {
    if (disposed) return;
    if (visible && !document.hidden && !userPaused && !motion.matches) timeline?.play();
    else timeline?.pause();
  }
  function updateMotion() {
    if (motion.matches) {
      timeline?.pause();
      Object.assign(state, { travel: 0, turn: 0, angle: -0.08, review: 1, scanOpacity: 0, phase: 2 });
      render();
    } else timeline?.restart();
    syncPlayback();
  }

  try {
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.addEventListener("webglcontextlost", contextLost);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      environment = pmrem.fromScene(room, 0.06);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.8;
    } finally { room.dispose(); pmrem.dispose(); }
    scene.add(new THREE.HemisphereLight(0xf0f7ff, 0xb8c0c5, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-4, 9, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd2e9ff, 1.7);
    fill.position.set(6, 3, -4);
    scene.add(fill);
    camera.position.set(8.4, 7.6, 11.5);
    camera.lookAt(0, 1.4, 0);
    camera.near = 0.1;
    camera.far = 60;
    assembly = buildAutomationAssembly();
    root.add(assembly.group);

    function geo<T extends THREE.BufferGeometry>(value: T): T { geometries.add(value); return value; }
    function mat<T extends THREE.Material>(value: T): T { materials.add(value); return value; }
    const dimensionMaterial = mat(new THREE.LineBasicMaterial({ color: 0x5481a1, transparent: true, opacity: 0.65, depthTest: false }));
    const markers: THREE.SpriteMaterial[] = [];
    function line(points: Point[], material = dimensionMaterial) {
      const object = new THREE.Line(geo(new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)))), material);
      root.add(object);
      return object;
    }
    // A restrained drafting grid and soft contact shadow sit beneath the assembly.
    const grid = new THREE.GridHelper(14, 28, 0xb7ccd9, 0xd3e0e7);
    grid.position.y = -0.18;
    geo(grid.geometry);
    const gm = Array.isArray(grid.material) ? grid.material : [grid.material];
    gm.forEach((m) => { mat(m); m.transparent = true; m.opacity = 0.25; });
    root.add(grid);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 256;
    const context = shadowCanvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D unavailable");
    const gradient = context.createRadialGradient(128, 128, 15, 128, 128, 128);
    gradient.addColorStop(0, "rgba(51,74,87,0.22)");
    gradient.addColorStop(0.65, "rgba(51,74,87,0.08)");
    gradient.addColorStop(1, "rgba(51,74,87,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    textures.add(shadowTexture);
    const shadow = new THREE.Mesh(geo(new THREE.PlaneGeometry(12, 6)), mat(new THREE.MeshBasicMaterial({map: shadowTexture, transparent:true, depthWrite:false})));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.16;
    root.add(shadow);

    function dimension(a: Point, b: Point, ticks: Point[], text: string, labelPosition: Point) {
      line([a, b]);
      for (let i = 0; i < ticks.length; i += 2) line([ticks[i]!, ticks[i + 1]!]);
      const c = document.createElement("canvas");
      c.width = 384; c.height = 96;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D unavailable");
      ctx.fillStyle = "rgba(246,250,252,0.94)";
      ctx.fillRect(5, 8, 374, 80);
      ctx.font = "500 38px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#51728b"; ctx.fillText(text, 192, 50);
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.add(texture);
      const material = mat(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
      markers.push(material);
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...labelPosition); sprite.scale.set(1.17, 0.29, 1);
      root.add(sprite);
    }
    dimension([-4.4, -0.1, 2.25], [4.4, -0.1, 2.25], [[-4.4,-0.1,1.5],[-4.4,-0.1,2.55],[4.4,-0.1,1.5],[4.4,-0.1,2.55]], options.labels.width, [0,-0.1,2.3]);
    dimension([-4.85,0,-1.15],[-4.85,3.2,-1.15],[[-5.08,0,-1.15],[-4.62,0,-1.15],[-5.08,3.2,-1.15],[-4.62,3.2,-1.15]],options.labels.height,[-4.95,1.75,-1.15]);
    dimension([4.8,-0.1,-1.7],[4.8,-0.1,1.5],[[4.58,-0.1,-1.7],[5.04,-0.1,-1.7],[4.58,-0.1,1.5],[5.04,-0.1,1.5]],options.labels.depth,[4.95,-0.1,0]);

    // Moving inspection plane and a blue selection frame around the guideway.
    const planeMaterial = mat(new THREE.MeshBasicMaterial({color:0x6ea2f3,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
    const plane = new THREE.Mesh(geo(new THREE.PlaneGeometry(3.3,3.3)),planeMaterial);
    plane.rotation.y = Math.PI/2; plane.position.y = 1.55; root.add(plane);
    const frameGeometry = geo(new THREE.BoxGeometry(2.96,0.3,1.6));
    const frameMaterial = mat(new THREE.LineDashedMaterial({color:0x4f86d9,transparent:true,opacity:0.65,dashSize:0.07,gapSize:0.05}));
    const frame = new THREE.LineSegments(geo(new THREE.EdgesGeometry(frameGeometry)),frameMaterial);
    frame.position.set(-1.65,2.65,0); frame.computeLineDistances(); root.add(frame);

    render = () => {
      if (disposed) return;
      try {
        root.rotation.y = state.angle;
        assembly?.animate(state.travel, state.turn);
        dimensionMaterial.opacity = 0.2 + state.review*0.55;
        markers.forEach((m) => {m.opacity = 0.45+state.review*0.55;});
        plane.position.x = state.scan; planeMaterial.opacity = state.scanOpacity;
        frameMaterial.opacity = 0.25+state.review*0.4;
        const phase = Math.round(state.phase);
        if (phase!==lastPhase) {lastPhase=phase;options.onPhase(phase);}
        renderer.render(scene,camera);
      } catch { options.onFailure(); dispose(); }
    };
    function resizeScene() {
      if (disposed) return;
      const {width,height}=host.getBoundingClientRect();
      if (!width||!height) return;
      const aspect=width/height;
      const viewHeight=Math.max(6.4,12.1/aspect);
      camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;
      camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
      camera.updateProjectionMatrix();renderer.setSize(width,height,false);render();
    }
    host.append(canvas);
    timeline=gsap.timeline({paused:true,repeat:-1,onUpdate:()=>{
      const now=performance.now();if(now-lastFrame<32)return;lastFrame=now;render();
    }});
    timeline
      .to(state,{angle:0.11,duration:8,ease:"sine.inOut"},0)
      .to(state,{angle:-0.13,duration:8,ease:"sine.inOut"},8)
      .to(state,{travel:0.65,duration:4,ease:"sine.inOut"},0)
      .to(state,{travel:-0.55,duration:4,ease:"sine.inOut"},4)
      .to(state,{travel:0.65,duration:4,ease:"sine.inOut"},8)
      .to(state,{travel:-0.55,duration:4,ease:"sine.inOut"},12)
      .to(state,{turn:Math.PI*2,duration:16,ease:"none"},0)
      .set(state,{phase:1},4)
      .to(state,{review:1,duration:1.5},6)
      .set(state,{phase:2},9)
      .to(state,{scanOpacity:0.055,duration:0.8},9)
      .to(state,{scan:4.5,duration:4.5,ease:"sine.inOut"},9)
      .to(state,{scanOpacity:0,duration:0.7},13.5)
      .to(state,{review:0.75,duration:1},15);
    if(motion.matches||userPaused)Object.assign(state,{travel:0,angle:-0.08,review:1,phase:2});
    resizeScene();
    if(disposed)throw new Error("Rendering unavailable");
    resize=new ResizeObserver(resizeScene);resize.observe(host);
    intersection=new IntersectionObserver(([entry])=>{visible=entry?.isIntersecting??false;syncPlayback();});intersection.observe(host);
    document.addEventListener("visibilitychange",syncPlayback);motion.addEventListener("change",updateMotion);
    return {dispose,setPaused(value){userPaused=value;syncPlayback();}};
  } catch(error) {dispose();throw error;}
}
