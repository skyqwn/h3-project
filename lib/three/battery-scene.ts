import * as THREE from "three";
import type { IndustryStudio } from "./industry-scene";

/** Unbranded cylindrical and pouch cells, composed as an industry illustration. */
export function buildBatteryModel(studio: IndustryStudio) {
  const { machine, standard, physical, geometry, mesh } = studio;
  const shell = physical({ color: 0xe3e8e5, metalness: 0.7, roughness: 0.24, clearcoat: 0.45 });
  const foil = physical({ color: 0xcbd7d4, metalness: 0.85, roughness: 0.3, clearcoat: 0.3 });
  const nickel = standard({ color: 0xb6c6c3, metalness: 0.9, roughness: 0.23 });
  const graphite = standard({ color: 0x253e3d, metalness: 0.4, roughness: 0.42 });
  const green = physical({ color: 0x2e7c74, roughness: 0.24, metalness: 0.45, clearcoat: 0.4 });
  const copper = standard({ color: 0xc59465, metalness: 0.83, roughness: 0.28 });
  const separator = standard({ color: 0xe9e6d9, metalness: 0.15, roughness: 0.52 });

  function localBox(group: THREE.Group, size: [number, number, number], position: [number, number, number], material: THREE.Material, radius = 0.045) {
    // Shape helper supplies a rounded, shared geometry; reparent in local space.
    const part = studio.box(size, position, material, radius);
    group.add(part);
    return part;
  }
  function localCylinder(group: THREE.Group, radius: number, height: number, y: number, material: THREE.Material) {
    const part = studio.cylinder(radius, height, [0, y, 0], material);
    group.add(part);
    return part;
  }
  function localRing(group: THREE.Group, radius: number, thickness: number, y: number, material: THREE.Material) {
    const part = studio.ring(radius, thickness, [0, y, 0], material);
    group.add(part);
    return part;
  }

  // Two tall sealed pouch cells. Crimped margins, stacked foil and paired tabs.
  function pouch(position: [number, number, number], rotation: number, scale: number) {
    const cell = new THREE.Group();
    cell.position.set(...position);
    cell.rotation.set(-0.13, rotation, -0.14);
    cell.scale.setScalar(scale);
    machine.add(cell);
    localBox(cell, [2.07, 3.34, 0.14], [0, 1.77, 0], foil, 0.04);
    localBox(cell, [1.84, 2.96, 0.29], [0, 1.78, 0], shell, 0.1);
    localBox(cell, [1.78, 2.88, 0.016], [0, 1.79, 0.152], shell, 0.07);
    for (const x of [-0.98, 0.98]) {
      for (let i = 0; i < 4; i++) {
        localBox(cell, [0.007, 3.08, 0.008], [x + i * 0.015 - 0.023, 1.77, 0.075], nickel, 0.003);
      }
    }
    for (const y of [0.19, 3.35]) {
      for (let i = 0; i < 4; i++) {
        localBox(cell, [1.84, 0.007, 0.008], [0, y + i * 0.02 - 0.03, 0.075], nickel, 0.003);
      }
    }
    localBox(cell, [0.39, 0.47, 0.028], [-0.49, 3.58, 0], nickel, 0.015);
    localBox(cell, [0.39, 0.47, 0.028], [0.49, 3.58, 0], copper, 0.015);
    for (const x of [-0.49, 0.49]) localBox(cell, [0.48, 0.12, 0.052], [x, 3.36, 0], graphite, 0.01);
    // Restrained printed bands, kept free of any invented product claims.
    localBox(cell, [1.81, 0.075, 0.009], [0, 0.69, 0.166], green, 0.002);
    localBox(cell, [1.81, 0.018, 0.009], [0, 0.56, 0.166], green, 0.002);
    for (let i = 0; i < 5; i++) {
      localBox(cell, [0.32 + i * 0.07, 0.018, 0.009], [-0.47 + i * 0.035, 2.86 - i * 0.075, 0.166], nickel, 0.002);
    }
    return cell;
  }
  pouch([-0.78, 0.18, -0.73], -0.16, 1.11);
  pouch([1.13, 0.11, -0.49], 0.08, 0.94);

  // Foreground cylindrical cells with rolled rims, insulator rings and terminals.
  function cylindrical(position: [number, number, number], height: number, radius: number, open = false) {
    const cell = new THREE.Group();
    cell.position.set(...position);
    machine.add(cell);
    localCylinder(cell, radius, height, height / 2, shell);
    localRing(cell, radius - 0.024, 0.025, 0.045, nickel);
    localRing(cell, radius - 0.022, 0.025, height - 0.027, nickel);
    localCylinder(cell, radius - 0.055, 0.035, height + 0.005, graphite);
    localCylinder(cell, radius - 0.08, 0.045, height + 0.024, shell);
    if (open) {
      // Visible spiral cross-section, an illustrative view of electrode layers.
      localCylinder(cell, radius - 0.08, 0.025, height + 0.055, copper);
      for (let i = 0; i < 13; i++) {
        const r = 0.09 + i * (radius - 0.18) / 13;
        localRing(cell, r, 0.01, height + 0.075, i % 2 ? graphite : separator);
      }
      localCylinder(cell, 0.064, 0.038, height + 0.07, graphite);
    } else {
      localCylinder(cell, radius * 0.37, 0.055, height + 0.059, nickel);
      localRing(cell, radius * 0.39, 0.009, height + 0.045, separator);
      localCylinder(cell, radius * 0.32, 0.017, height + 0.094, shell);
    }
    const band = mesh(
      geometry(`battery-band:${radius}`, () => new THREE.CylinderGeometry(radius + 0.002, radius + 0.002, 0.11, 64, 1, true)),
      green, [0, height * 0.16, 0], cell,
    );
    band.castShadow = false;
    const line = mesh(
      geometry(`battery-line:${radius}`, () => new THREE.CylinderGeometry(radius + 0.003, radius + 0.003, 0.018, 64, 1, true)),
      green, [0, height * 0.16 - 0.13, 0], cell,
    );
    line.castShadow = false;
    return cell;
  }
  cylindrical([-1.72, 0.03, 1.03], 2.43, 0.49);
  cylindrical([-0.49, 0.03, 1.43], 1.95, 0.46);
  cylindrical([0.63, 0.03, 1.63], 1.38, 0.43, true);
}
