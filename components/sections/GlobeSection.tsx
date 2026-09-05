"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// H3's plant (Incheon/검단) radiating out toward the world — the hero now
// pairs with an aspirational "reaching for the world" headline, so the arcs
// intentionally span continents rather than the tight domestic cluster used
// before. Spread across very different longitudes so that as the camera
// auto-rotates, some destination is coming into view at almost any moment
// instead of everything bunching into one small corner.
const HQ = { lat: 37.6088, lng: 126.6222 };

const DESTINATIONS = [
  { lat: 40.7128, lng: -74.006, hue: "blue" }, // New York — North America
  { lat: 50.1109, lng: 8.6821, hue: "gold" }, // Frankfurt — Europe
  { lat: 48.8566, lng: 2.3522, hue: "blue" }, // Paris — Europe
  { lat: 31.2304, lng: 121.4737, hue: "gold" }, // Shanghai — China
  { lat: -1.2921, lng: 36.8219, hue: "blue" }, // Nairobi — Africa
  { lat: -23.5505, lng: -46.6333, hue: "gold" }, // São Paulo — South America
] as const;

// Two-tone palette (brand sky-blue + a warm gold accent), alternated per
// route — a single flat color reads as thin/sparse, so mixing hues is what
// gives the fan of arcs some visual variety, the way the reference site's
// beams mix blue and amber.
const ARC_HUES = {
  blue: ["#6ea2f3", "#bcd7ff"] as [string, string],
  gold: ["#ffb35c", "#ffe1b3"] as [string, string],
};

const ARCS = DESTINATIONS.map((d, i) => ({
  startLat: HQ.lat,
  startLng: HQ.lng,
  endLat: d.lat,
  endLng: d.lng,
  // Precomputed (rather than accessor functions) because react-globe.gl's
  // per-datum accessors only receive the single object, not an index —
  // string field-name accessors below just read these directly.
  color: ARC_HUES[d.hue],
  initialGap: i * 0.18,
}));

const POINTS = [HQ, ...DESTINATIONS];

// Pulsing beacon rings — light radiating outward from HQ and each site.
const RINGS = POINTS.map((p) => ({ lat: p.lat, lng: p.lng }));

function useContainerWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

// Day/night terminator shader: the globe is lit by a fixed world-space sun
// direction. `autoRotate` spins the CAMERA around the globe (OrbitControls
// orbits its target, it doesn't rotate the mesh) — as it swings around,
// different faces cross the sun direction and blend from lit day texture to
// city-light night texture.
//
// The normal MUST be converted to true world space with `mat3(modelMatrix)`
// (not `normalMatrix`, which is view-space, and not the raw object-space
// `normal`, which only happens to equal world space if the mesh itself never
// rotates). `mat3(modelMatrix)` is correct either way — whether the camera
// orbits a static mesh, or the mesh itself gets a rotation applied — so the
// lighting stays correct no matter which one drives the spin.
function useDayNightMaterial() {
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    // TextureLoader touches `document` internally, so this must only ever
    // run client-side — a `useMemo` runs during SSR too and crashes here.
    const loader = new THREE.TextureLoader();
    const dayTexture = loader.load("/globe/earth-day.jpg");
    const nightTexture = loader.load("/globe/earth-night.jpg");
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0.25, 0.9).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(mat3(modelMatrix) * normal); // true world-space normal
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          // Biased toward DAY: a mostly-lit, blue/cloud-textured planet
          // reads as "Earth" at a glance. Only the true far side (light
          // strongly negative) drops to the night city-light texture.
          float light = dot(vNormal, normalize(sunDirection));
          float mixAmt = smoothstep(-0.55, 0.1, light);
          vec3 day = texture2D(dayTexture, vUv).rgb * 1.02;
          vec3 night = texture2D(nightTexture, vUv).rgb * 1.3 + vec3(0.015, 0.02, 0.045);
          gl_FragColor = vec4(mix(night, day, mixAmt), 1.0);
        }
      `,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 텍스처 로딩(THREE.TextureLoader)은 document에 의존해 클라이언트에서만 실행 가능
    setMaterial(mat);
    return () => mat.dispose();
  }, []);

  return material;
}

export function GlobeSection() {
  const t = useTranslations("home.globe");
  const rootRef = useRef<HTMLElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [containerRef, containerWidth] = useContainerWidth();
  const globeMaterial = useDayNightMaterial();

  // Scroll-in growth: the card starts small and offset above its resting
  // spot, then scales/slides down to full size WHILE the section scrolls
  // into view from below — same timing as HomeSolutionReveal's own media
  // reveal (`top bottom` → `top top`) — so growth is visible from the
  // moment the section arrives, and it has already settled at full size by
  // the time the section locks into its pinned position (rather than only
  // starting to grow after it's already pinned). Desktop only — mirrors
  // HomeSolutionReveal's own reduced/mobile bail-out — a pinned scrub feels
  // janky on a mobile viewport, so mobile keeps a plain static section.
  useGSAP(
    () => {
      const root = rootRef.current;
      const card = containerRef.current;
      if (!root || !card) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || window.matchMedia("(max-width: 767px)").matches) {
        // Nothing has been tweened yet at this point (unlike
        // HomeSolutionReveal's desktop-only markup, this card is the same
        // DOM node rendered on every breakpoint) — clearProps here would
        // wipe its own inline `height` style, not just gsap's.
        return;
      }

      gsap.set(card, { scale: 0.55, yPercent: -55, transformOrigin: "50% 0%" });

      gsap.to(card, {
        scale: 1,
        yPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "top top",
          scrub: 1,
        },
      });
    },
    { scope: rootRef }
  );

  // `onGlobeReady` firing does not guarantee `globeRef.current` is already
  // attached in THIS same callback tick. Routing it through state forces a
  // fresh render/commit first, so by the time this effect runs the ref is
  // guaranteed to be set.
  const [ready, setReady] = useState(false);

  // Safety net: three-globe's own `onReady` fires synchronously on its
  // first internal update pass, but if that signal is ever missed (e.g. an
  // upstream version change), fall back to marking ready shortly after the
  // globe mounts instead of leaving the section permanently static.
  useEffect(() => {
    if (!globeMaterial) return;
    const timeout = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timeout);
  }, [globeMaterial]);

  useEffect(() => {
    if (!ready) return;
    const globe = globeRef.current;
    if (!globe) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Single, continuous, one-direction spin — OrbitControls' own
    // `autoRotate` (it orbits the camera around the target at a constant
    // rate; it never reverses and never wobbles). This replaces the earlier
    // hand-rolled per-frame `pointOfView` sine wave, which is what caused
    // the back-and-forth "왔다갔다" motion — a sine wave inherently reverses
    // direction twice per cycle.
    const controls = globe.controls();
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.55;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;

    // Start a little south of Korea (not dead-on) so the peninsula sits
    // inside the visible band instead of right at its edge, and let
    // autoRotate sweep longitude from there — with destinations now spread
    // across every continent, some arc is always coming into view rather
    // than everything being clustered in one corner.
    globe.pointOfView({ lat: 14, lng: 110, altitude: 2.3 }, 0);

    // Clouds: react-globe.gl has no clouds prop, so a slightly larger,
    // independently-rotating transparent sphere is added straight to the
    // underlying three.js scene once the globe mesh exists.
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(101, 75, 75),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load("/globe/earth-clouds.png"),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    globe.scene().add(clouds);

    if (reduced) return () => globe.scene().remove(clouds);

    let raf = 0;
    const spin = () => {
      clouds.rotation.y += 0.0006;
      raf = requestAnimationFrame(spin);
    };
    spin();

    return () => {
      cancelAnimationFrame(raf);
      globe.scene().remove(clouds);
    };
  }, [ready]);

  const globeSize = containerWidth
    ? Math.round(Math.max(containerWidth * 1.35, 640))
    : 900;

  return (
    <section ref={rootRef} className="relative isolate z-10 bg-transparent md:h-[180svh]">
      <div className="md:sticky md:top-0 md:h-svh md:overflow-hidden">
        <div className="px-6 py-section lg:px-[120px] md:flex md:h-full md:items-center md:py-0">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-[32px] bg-[#050b1a]"
            style={{ height: "clamp(480px, 62vw, 680px)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-[#050b1a] via-[#050b1a]/70 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-6 px-6 pb-14 text-center">
              <h2 className="max-w-2xl text-balance text-heading-xl text-on-dark md:text-display-lg">
                {t("headline")}
              </h2>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-body-sm font-bold text-on-dark transition-colors hover:border-white hover:bg-white/10"
              >
                {t("cta")}
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: `-${Math.round(globeSize * 0.52)}px`,
                width: globeSize,
                height: globeSize,
              }}
            >
              {globeMaterial && (
                <Globe
                  ref={globeRef}
                  width={globeSize}
                  height={globeSize}
                  backgroundColor="rgba(0,0,0,0)"
                  globeMaterial={globeMaterial}
                  showAtmosphere
                  atmosphereColor="#cfe2fb"
                  atmosphereAltitude={0.14}
                  arcsData={ARCS}
                  arcColor="color"
                  arcAltitudeAutoScale={0.55}
                  arcStroke={0.28}
                  arcDashLength={0.4}
                  arcDashGap={0.25}
                  arcDashInitialGap="initialGap"
                  arcDashAnimateTime={1800}
                  pointsData={POINTS}
                  pointColor={() => "#ffe9c2"}
                  pointAltitude={0.012}
                  pointRadius={0.14}
                  pointResolution={12}
                  ringsData={RINGS}
                  ringColor={() => (tt: number) =>
                    `rgba(255,225,178,${0.85 * (1 - tt)})`
                  }
                  ringMaxRadius={3.2}
                  ringPropagationSpeed={2.5}
                  ringRepeatPeriod={650}
                  onGlobeReady={() => setReady(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
