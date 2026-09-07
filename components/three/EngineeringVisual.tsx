"use client";

import Image from "next/image";
import { Pause, Play, Layers3, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { EngineeringScene } from "@/lib/three/engineering-scene";
import styles from "./EngineeringVisual.module.css";

function Projection({ front = false }: { front?: boolean }) {
  return (
    <svg viewBox="0 0 150 90" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.8">
        <path opacity="0.2" strokeDasharray="3 3" d="M75 2v86M4 45h142" />
        {front ? (
          <>
            <path d="M19 32h112v39H19zM21 29h48v4H21zM79 29h48v4H79zM27 33v33h36V33M85 33v33h36V33M32 42h28m26 0h29M11 71h127M6 17h13v54H6zM131 17h13v54h-13zM38 42v16h12V42M97 42v16h12V42" />
            <path opacity="0.5" d="M22 25v42m-3-42h6m-6 42h6M33 82h83m-83-3v6m83-6v6" />
          </>
        ) : (
          <>
            <path d="M19 23h112v49H19zM24 29h42v36H24zM81 29h42v36H81zM30 31v32m8-32v32m8-32v32m8-32v32m8-32v32M87 31v32m8-32v32m8-32v32m8-32v32m8-32v32M7 16h12v30H7zM131 16h12v30h-12z" />
            <circle cx="11" cy="57" r="7" /><circle cx="138" cy="57" r="7" />
            <path opacity="0.5" d="M24 17v55m-3-55h6m-6 55h6M34 81h82m-82-3v6m82-6v6" />
          </>
        )}
      </g>
    </svg>
  );
}

export function EngineeringVisual() {
  const t = useTranslations("home.solutionReveal.drawing");
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<EngineeringScene | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState(2);
  const widthLabel = t("dimensions.width");
  const heightLabel = t("dimensions.height");
  const depthLabel = t("dimensions.depth");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      try {
        const { mountEngineeringScene } = await import("@/lib/three/engineering-scene");
        if (cancelled) return;
        sceneRef.current = mountEngineeringScene(host, {
          labels: { width: widthLabel, height: heightLabel, depth: depthLabel },
          onPhase: setPhase,
          onFailure: () => setReady(false),
          paused: pausedRef.current,
        });
        setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    }, { rootMargin: "100px" });
    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [widthLabel, heightLabel, depthLabel]);

  function togglePaused() {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    sceneRef.current?.setPaused(next);
  }

  return (
    <div className={styles.workspace} data-engineering-visual data-phase={phase}>
      <div className={styles.header}>
        <div className={styles.document}>
          <Layers3 size={17} aria-hidden />
          <span>{t("title")}</span>
        </div>
        <span className={styles.revision}>{t("revision")}</span>
        <button type="button" className={styles.pause} onClick={togglePaused} disabled={!ready} aria-label={paused ? t("resume") : t("pause")} title={paused ? t("resume") : t("pause")}>
          {paused ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />}
        </button>
      </div>

      <div className={styles.viewport}>
        <div className={styles.viewLabel}><ScanLine size={13} aria-hidden />{t("view")}</div>
        <div role="img" aria-label={t("imageAlt")} className={styles.scene}>
          <Image src="/industries/engineering-concept.webp" alt="" fill sizes="(max-width: 767px) 100vw, 60vw" className={`${styles.poster} ${ready ? styles.hidden : ""}`} />
          <div ref={hostRef} aria-hidden="true" className={`${styles.canvas} ${ready ? "" : styles.hidden}`} />
        </div>
        <div className={styles.projections}>
          <div><span>{t("plan")}</span><Projection /></div>
          <div><span>{t("elevation")}</span><Projection front /></div>
        </div>
        <div className={styles.axis} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.detail}><span className={styles.statusDot} />{t("material")}</div>
      </div>

      <div className={styles.footer}>
        <div className={styles.steps}>
          {(["shape", "piping", "review"] as const).map((step, index) => (
            <span key={step} className={index === phase ? styles.active : ""}>
              <i aria-hidden />{t(`steps.${step}`)}
            </span>
          ))}
        </div>
        <p>{t("note")}</p>
      </div>
    </div>
  );
}
