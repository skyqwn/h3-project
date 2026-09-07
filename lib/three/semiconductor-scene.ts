import * as THREE from "three";
import type { IndustryStudio } from "./industry-scene";

/** Illustrative cutaway workcell; not a supplied H3 equipment specification. */
export function buildSemiconductorModel(studio: IndustryStudio) {
  const {renderer, textures, standard, physical, geometry, mesh, box, cylinder, ring, tube, link} = studio;
    const white = physical({ color: 0xf0f2ef, roughness: 0.28, metalness: 0.15, clearcoat: 0.35 });
    const polymer = standard({ color: 0xdfe5e1, roughness: 0.4, metalness: 0.04 });
    const silver = standard({ color: 0x9aa9b0, roughness: 0.24, metalness: 0.85 });
    const steel = standard({ color: 0x58676d, roughness: 0.31, metalness: 0.8 });
    const dark = standard({ color: 0x253538, roughness: 0.38, metalness: 0.35 });
    const teal = standard({ color: 0x3e777d, roughness: 0.24, metalness: 0.45 });
    const glass = physical({ color: 0x8bb9b7, transparent: true, opacity: 0.13, roughness: 0.1, metalness: 0.12, depthWrite: false, side: THREE.DoubleSide });
    const green = standard({ color: 0x5aa99a, emissive: 0x3c937e, emissiveIntensity: 0.7 });
    const amber = standard({ color: 0xc78c46, roughness: 0.3 });

    // Raised machine bed, leveling feet and divided lower service cabinets.
    box([5.25, 0.19, 2.75], [-0.25, 0.26, 0], dark);
    box([5.25, 0.85, 2.7], [-0.25, 0.79, 0], white, 0.07);
    box([5.31, 0.12, 2.76], [-0.25, 1.28, 0], silver);
    for (const x of [-2.52, -0.8, 0.93, 2.05]) {
      for (const z of [-1.1, 1.1]) {
        cylinder(0.095, 0.12, [x, 0.09, z], dark);
        cylinder(0.044, 0.13, [x, 0.19, z], silver);
      }
    }
    for (const x of [-1.98, -0.62, 0.74]) {
      box([1.29, 0.69, 0.025], [x, 0.8, 1.363], polymer, 0.015);
      box([0.25, 0.035, 0.045], [x + 0.33, 1.02, 1.392], steel, 0.012);
      for (let i = 0; i < 7; i++) {
        box([0.38, 0.018, 0.009], [x - 0.28, 0.6 + i * 0.038, 1.38], steel, 0.004);
      }
    }

    // Open-front enclosure. The cutaway deliberately exposes the process deck.
    box([4.0, 2.05, 0.13], [-0.84, 2.32, -1.22], white);
    for (const x of [-2.76, 1.1]) {
      for (const z of [-1.22, 1.22]) {
        box([0.115, 2.1, 0.115], [x, 2.35, z], silver, 0.015);
        box([0.018, 2.04, 0.012], [x, 2.35, z + 0.063], steel, 0.003);
      }
    }
    box([4.12, 0.24, 2.64], [-0.82, 3.49, 0], white, 0.055);
    box([3.73, 0.055, 2.28], [-0.82, 3.34, 0], polymer, 0.01);
    box([3.71, 0.025, 0.045], [-0.82, 3.305, 0.98], green, 0.007);
    box([4.0, 0.085, 0.055], [-0.82, 3.27, 1.25], dark, 0.012);
    // Fan-filter units, fins, fasteners and side safety glazing.
    for (const x of [-1.8, 0.12]) {
      box([1.38, 0.08, 1.77], [x, 3.65, -0.06], polymer);
      for (let i = 0; i < 13; i++) {
        box([1.11, 0.014, 0.027], [x, 3.697, -0.72 + i * 0.109], silver, 0.005);
      }
    }
    box([0.027, 1.82, 2.25], [-2.77, 2.35, 0], glass, 0.008);
    for (const x of [-2.5, 0.85]) {
      for (const y of [1.45, 3.13]) {
        const screw = cylinder(0.025, 0.018, [x, y, -1.139], steel);
        screw.rotation.x = Math.PI / 2;
      }
    }

    // Process bowl with concentric polished rims and an offset raised lid.
    cylinder(0.68, 0.45, [0.23, 1.57, -0.25], white);
    cylinder(0.606, 0.04, [0.23, 1.806, -0.25], dark);
    cylinder(0.46, 0.045, [0.23, 1.835, -0.25], steel);
    ring(0.637, 0.028, [0.23, 1.827, -0.25]);
    ring(0.48, 0.017, [0.23, 1.861, -0.25]);
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      cylinder(0.024, 0.018, [0.23 + Math.cos(angle) * 0.575, 1.838, -0.25 + Math.sin(angle) * 0.575], silver);
    }
    cylinder(0.048, 1.0, [0.73, 2.01, -0.84], silver);
    link([0.73, 2.52, -0.84], [0.23, 2.52, -0.25], 0.15, 0.1, silver);
    cylinder(0.64, 0.105, [0.23, 2.57, -0.25], white);
    ring(0.6, 0.023, [0.23, 2.513, -0.25], dark);
    cylinder(0.105, 0.085, [0.23, 2.655, -0.25], silver);

    // Wafer surfaces: procedural die pattern, with thin-film iridescence.
    const waferCanvas = document.createElement("canvas");
    waferCanvas.width = waferCanvas.height = 512;
    const ctx = waferCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    const gradient = ctx.createLinearGradient(0, 512, 512, 0);
    gradient.addColorStop(0, "#162a41");
    gradient.addColorStop(0.3, "#536a92");
    gradient.addColorStop(0.5, "#688e99");
    gradient.addColorStop(0.7, "#71688b");
    gradient.addColorStop(1, "#203047");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(203,222,227,0.48)";
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 512; y += 29) {
      for (let x = 0; x < 512; x += 24) {
        ctx.strokeRect(x + 2, y + 2, 20, 25);
        ctx.fillStyle = "rgba(185,216,224,0.14)";
        ctx.fillRect(x + 5, y + 5, 3, 16);
      }
    }
    const waferTexture = new THREE.CanvasTexture(waferCanvas);
    waferTexture.colorSpace = THREE.SRGBColorSpace;
    waferTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textures.add(waferTexture);
    const waferFace = physical({ map: waferTexture, metalness: 0.72, roughness: 0.23, iridescence: 0.65, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 380], side: THREE.DoubleSide });
    function wafer(x: number, y: number, z: number, radius: number) {
      cylinder(radius, 0.016, [x, y, z], silver);
      const surface = mesh(geometry(`wafer:${radius}`, () => new THREE.CircleGeometry(radius * 0.98, 80)), waferFace, [x, y + 0.009, z]);
      surface.rotation.x = -Math.PI / 2;
    }

    // Articulated wafer handler, held at a readable transfer pose.
    cylinder(0.27, 0.1, [-1.31, 1.4, 0.2], steel);
    cylinder(0.18, 0.35, [-1.31, 1.625, 0.2], white);
    cylinder(0.23, 0.065, [-1.31, 1.835, 0.2], dark);
    link([-1.31, 1.9, 0.2], [-0.98, 1.9, 0.91], 0.27, 0.12);
    cylinder(0.155, 0.17, [-0.98, 1.965, 0.91], silver);
    link([-0.98, 2.045, 0.91], [-0.18, 2.045, 0.68], 0.19, 0.1);
    cylinder(0.105, 0.1, [-0.18, 2.1, 0.68], steel);
    link([-0.18, 2.16, 0.68], [0.31, 2.16, 0.71], 0.11, 0.035, silver);
    wafer(0.27, 2.19, 0.71, 0.49);
    tube([[-1.34, 1.7, 0.32], [-1.3, 1.82, 0.72], [-1.02, 1.87, 1.04]], 0.025, dark);

    // Front loading station with a slotted wafer cassette.
    box([1.2, 0.13, 0.83], [-1.94, 1.31, 1.56], silver);
    box([0.91, 0.1, 0.76], [-1.94, 1.425, 1.56], dark);
    box([0.08, 0.76, 0.75], [-2.39, 1.85, 1.56], teal);
    box([0.08, 0.76, 0.75], [-1.49, 1.85, 1.56], teal);
    box([0.93, 0.08, 0.75], [-1.94, 2.27, 1.56], teal);
    box([0.86, 0.72, 0.028], [-1.94, 1.84, 1.19], dark);
    for (let i = 0; i < 8; i++) wafer(-1.94, 1.52 + i * 0.082, 1.58, 0.395);

    // Chemical supply skid: PP-like tanks, lids, level gauges and a manifold.
    box([1.1, 0.11, 2.5], [1.86, 1.34, 0], silver);
    for (const z of [-0.65, 0.65]) {
      cylinder(0.365, 0.84, [1.85, 1.84, z], polymer);
      cylinder(0.39, 0.075, [1.85, 2.285, z], white);
      ring(0.37, 0.027, [1.85, 2.23, z], silver);
      cylinder(0.095, 0.095, [1.85, 2.37, z], dark);
      box([0.04, 0.52, 0.045], [1.85, 1.85, z + 0.365], teal, 0.01);
      for (let i = 0; i < 6; i++) {
        box([0.035, 0.009, 0.01], [1.9, 1.64 + i * 0.078, z + 0.375], steel, 0.002);
      }
      tube([[1.85, 2.43, z], [1.85, 2.86, z], [1.3, 2.86, z], [1.3, 1.57, z], [0.83, 1.57, z]], 0.037);
      cylinder(0.075, 0.12, [1.3, 2.53, z], silver);
      box([0.21, 0.035, 0.065], [1.3, 2.58, z + 0.08], teal, 0.015);
    }
    for (const z of [-1.13, 1.13]) {
      box([0.06, 1.8, 0.06], [2.28, 2.2, z], silver, 0.008);
    }
    box([0.06, 0.08, 2.33], [2.28, 3.08, 0], silver, 0.01);
    tube([[2.25, 2.92, -1.05], [2.25, 2.92, 1.04], [2.05, 2.92, 1.04], [2.05, 2.28, 1.04]], 0.03, teal);
    tube([[0.8, 1.47, -0.25], [1.12, 1.47, -0.25], [1.12, 1.47, -1.05], [1.7, 1.47, -1.05]], 0.045);

    // Side-mounted control pendant: graphical indicators only, no baked text.
    link([1.1, 2.37, 1.17], [1.65, 2.37, 1.4], 0.075, 0.08, silver);
    box([0.68, 0.91, 0.13], [1.69, 2.44, 1.47], white, 0.065);
    box([0.57, 0.6, 0.016], [1.69, 2.54, 1.544], dark, 0.025);
    box([0.46, 0.018, 0.008], [1.69, 2.75, 1.556], green, 0.003);
    for (let i = 0; i < 3; i++) {
      box([0.1, 0.075, 0.008], [1.53 + i * 0.16, 2.58, 1.556], teal, 0.008);
      box([0.1, 0.018, 0.008], [1.53 + i * 0.16, 2.46, 1.556], silver, 0.003);
    }
    const stop = cylinder(0.06, 0.035, [1.87, 2.115, 1.56], amber);
    stop.rotation.x = Math.PI / 2;
    const power = cylinder(0.025, 0.025, [1.55, 2.115, 1.556], green);
    power.rotation.x = Math.PI / 2;
    cylinder(0.028, 0.27, [0.84, 3.76, -1.0], silver);
    cylinder(0.069, 0.13, [0.84, 3.94, -1.0], green);
    cylinder(0.074, 0.025, [0.84, 4.02, -1.0], dark);

}
