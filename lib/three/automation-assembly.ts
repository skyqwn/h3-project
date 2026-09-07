import * as THREE from "three";

type Point = [number, number, number];

/** Reference-inspired assembly study: paired automation stations, not a production drawing. */
export function buildAutomationAssembly() {
  const group = new THREE.Group();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const carriages: THREE.Group[] = [];
  const spools: THREE.Group[] = [];
  const outline = new THREE.LineBasicMaterial({ color: 0x344c54, transparent: true, opacity: 0.54 });
  materials.add(outline);
  function material(color: number, metalness = 0.3, roughness = 0.48) {
    const result = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    materials.add(result);
    return result;
  }
  const white = material(0xe1e6e6, 0.18);
  const steel = material(0x8d9b9f, 0.65, 0.32);
  const dark = material(0x394d54, 0.5);
  const black = material(0x25393f, 0.25);
  const teal = material(0x76aaa9, 0.36);
  const selected = material(0x9cc4ec, 0.2);
  const copper = material(0xbd9470, 0.5);
  const film = new THREE.MeshPhysicalMaterial({ color: 0xb2d7ba, transparent: true, opacity: 0.62, roughness: 0.3, metalness: 0.1, depthWrite: false });
  materials.add(film);
  function cached(key: string, create: () => THREE.BufferGeometry) {
    let value = geometries.get(key);
    if (!value) { value = create(); geometries.set(key, value); }
    return value;
  }
  function part(shape: THREE.BufferGeometry, position: Point, mat: THREE.Material, parent: THREE.Object3D = group, edges = true) {
    const mesh = new THREE.Mesh(shape, mat);
    mesh.position.set(...position);
    mesh.castShadow = mat !== film;
    mesh.receiveShadow = true;
    if (edges) mesh.add(new THREE.LineSegments(cached(`edges:${shape.uuid}`, () => new THREE.EdgesGeometry(shape, 32)), outline));
    parent.add(mesh);
    return mesh;
  }
  function box(size: Point, pos: Point, mat = steel, parent: THREE.Object3D = group) {
    return part(cached(`box:${size}`, () => new THREE.BoxGeometry(...size)), pos, mat, parent);
  }
  function cylinder(radius: number, length: number, pos: Point, mat: THREE.Material = steel, parent: THREE.Object3D = group, axis: "x" | "y" | "z" = "y") {
    const obj = part(cached(`cylinder:${radius}:${length}`, () => new THREE.CylinderGeometry(radius, radius, length, 24)), pos, mat, parent);
    if (axis === "x") obj.rotation.z = Math.PI / 2;
    if (axis === "z") obj.rotation.x = Math.PI / 2;
    return obj;
  }
  function cable(points: Point[], radius = 0.024, mat = black) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const shape = cached(`cable:${points}:${radius}`, () => new THREE.TubeGeometry(curve, 20, radius, 6, false));
    return part(shape, [0, 0, 0], mat, group, false);
  }

  // Two bolted machine skids with fine extruded rails and service access panels.
  for (const center of [-1.65, 1.65]) {
    box([3.18, 0.16, 2.7], [center, 0.2, 0], dark);
    box([3.04, 0.08, 2.55], [center, 0.32, 0], white);
    for (const x of [center - 1.4, center + 1.4]) {
      for (const z of [-1.13, 1.13]) {
        cylinder(0.085, 0.14, [x, 0.045, z], dark);
        cylinder(0.038, 0.11, [x, 0.16, z]);
        box([0.13, 2.46, 0.13], [x, 1.62, z], dark);
        box([0.034, 2.42, 0.012], [x, 1.62, z + 0.072], steel);
        box([0.23, 0.27, 0.038], [x, 2.6, z + 0.086], steel);
        for (const y of [2.51, 2.69]) cylinder(0.024, 0.025, [x, y, z + 0.115], black, group, "z");
      }
      box([0.16, 0.16, 2.43], [x, 2.85, 0], dark);
    }
    for (const z of [-1.13, 1.13]) {
      box([3.04, 0.14, 0.14], [center, 2.85, z], dark);
      box([3.04, 0.1, 0.13], [center, 0.72, z], steel);
      box([3.05, 0.012, 0.027], [center, 2.931, z], steel);
    }
    // Internal conveyor: bearing blocks, shafts and contrasting guide rails.
    for (const z of [-0.7, 0.7]) {
      box([2.74, 0.16, 0.12], [center, 1.02, z], steel);
      box([2.76, 0.045, 0.045], [center, 1.122, z], teal);
      for (const x of [center - 1.16, center, center + 1.16]) box([0.16, 0.68, 0.16], [x, 0.69, z], dark);
    }
    for (let i = 0; i < 10; i++) {
      const x = center - 1.17 + i * 0.26;
      cylinder(0.07, 1.35, [x, 1.035, 0], steel, group, "z");
      for (const z of [-0.74, 0.74]) box([0.16, 0.15, 0.09], [x, 1.035, z], dark);
    }
    // Twin upper guideways and a traversing process head.
    for (const z of [-0.58, 0.58]) {
      box([2.93, 0.19, 0.13], [center, 2.48, z], steel);
      cylinder(0.027, 2.88, [center, 2.59, z], teal, group, "x");
    }
    const carriage = new THREE.Group();
    carriage.position.set(center, 0, 0);
    group.add(carriage);
    box([0.59, 0.18, 1.42], [0, 2.61, 0], selected, carriage);
    for (const z of [-0.58, 0.58]) box([0.34, 0.14, 0.22], [0, 2.49, z], teal, carriage);
    box([0.38, 0.67, 0.28], [0, 2.23, 0], white, carriage);
    for (const x of [-0.145, 0.145]) cylinder(0.023, 0.84, [x, 2.16, 0.16], steel, carriage);
    box([0.59, 0.12, 0.5], [0, 1.83, 0], steel, carriage);
    for (const x of [-0.2, 0.2]) {
      cylinder(0.035, 0.35, [x, 1.62, 0.08], copper, carriage);
      box([0.12, 0.1, 0.18], [x, 1.41, 0.08], dark, carriage);
    }
    box([0.27, 0.31, 0.3], [0, 2.89, 0], teal, carriage);
    carriages.push(carriage);

    // Cable carrier links and motors give the assembly its mechanical density.
    for (let i = 0; i < 15; i++) {
      box([0.145, 0.1, 0.11], [center - 1.2 + i * 0.165, 2.98, -1.1], black);
      box([0.016, 0.035, 0.12], [center - 1.2 + i * 0.165, 3.045, -1.1], teal);
    }
    for (const x of [center - 1.28, center + 1.28]) {
      box([0.35, 0.26, 0.27], [x, 2.49, 0.8], teal);
      cylinder(0.095, 0.21, [x, 2.49, 1.01], dark, group, "z");
      box([0.45, 0.15, 0.39], [x, 0.93, 1.02], steel);
      box([0.23, 0.3, 0.28], [x, 1.12, 1.04], teal);
      cable([[x, 1.05, 1.15], [x, 0.58, 1.22], [x - 0.25, 0.42, 1.19], [x - 0.47, 0.44, 0.8]]);
    }
    for (let i = 0; i < 3; i++) {
      box([0.81, 0.4, 0.045], [center - 0.91 + i * 0.91, 0.56, 1.28], white);
      box([0.14, 0.025, 0.035], [center - 0.71 + i * 0.91, 0.67, 1.315], dark);
    }
    // Pneumatic manifold and its distribution lines.
    box([0.86, 0.12, 0.22], [center, 0.7, -1.08], steel);
    for (let i = 0; i < 6; i++) {
      box([0.09, 0.22, 0.16], [center - 0.33 + i * 0.13, 0.87, -1.08], teal);
      cable([[center - 0.33 + i * 0.13, 0.98, -1.08], [center - 0.33 + i * 0.13, 1.13, -0.92], [center - 0.5 + i * 0.17, 1.24, -0.8]], 0.012);
    }
  }

  // End feed modules, translucent material reels and flanged shafts.
  for (const x of [-3.85, 3.85]) {
    box([1.04, 0.15, 2.35], [x, 0.22, 0.2], dark);
    box([0.13, 1.52, 0.14], [x, 1.06, -0.5], steel);
    box([0.13, 1.52, 0.14], [x, 1.06, 1.25], steel);
    const spool = new THREE.Group();
    spool.position.set(x, 1.33, 0.45);
    group.add(spool);
    cylinder(0.51, 0.63, [0, 0, 0], film, spool, "z");
    for (const z of [-0.35, 0.35]) {
      cylinder(0.56, 0.025, [0, 0, z], film, spool, "z");
      cylinder(0.15, 0.05, [0, 0, z], steel, spool, "z");
      for (let i = 0; i < 4; i++) {
        const spoke = box([0.9, 0.022, 0.015], [0, 0, z + 0.022], teal, spool);
        spoke.rotation.z = i * Math.PI / 4;
      }
    }
    cylinder(0.058, 1.87, [0, 0, 0.0], dark, spool, "z");
    spools.push(spool);
    cylinder(0.1, 1.23, [x, 1.82, 0.35], steel, group, "z");
    for (const z of [-0.65, 1.25]) box([0.2, 0.23, 0.21], [x, 1.34, z], dark);
  }

  // Tall control cabinets, access doors, louvers and graphic control indicators.
  for (const x of [-3.64, 3.64]) {
    box([1.07, 2.83, 0.75], [x, 1.65, -1.35], white);
    box([1.14, 0.12, 0.81], [x, 3.12, -1.35], white);
    for (const dx of [-0.255, 0.255]) {
      box([0.49, 2.52, 0.025], [x + dx, 1.65, -0.956], white);
      box([0.025, 0.26, 0.03], [x + dx + 0.13, 1.64, -0.933], dark);
      for (let i = 0; i < 8; i++) box([0.33, 0.019, 0.009], [x + dx, 0.62 + i * 0.055, -0.935], dark);
    }
    box([0.33, 0.41, 0.028], [x - 0.25, 2.31, -0.93], dark);
    box([0.25, 0.29, 0.012], [x - 0.25, 2.34, -0.909], selected);
    for (let i = 0; i < 3; i++) cylinder(0.032, 0.03, [x - 0.34 + i * 0.11, 2.03, -0.91], i === 2 ? copper : teal, group, "z");
    cable([[x, 0.41, -1], [x, 0.29, -0.77], [x * 0.8, 0.3, -0.78]], 0.048);
  }

  return {
    group,
    animate(travel: number, turn: number) {
      carriages.forEach((carriage, index) => {
        carriage.position.x = (index === 0 ? -1.65 : 1.65) + (index === 0 ? travel : -travel) * 0.72;
      });
      spools.forEach((spool, index) => { spool.rotation.z = turn * (index === 0 ? 1 : -1); });
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
