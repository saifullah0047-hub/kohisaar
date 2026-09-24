"use client";

import type { HeroProps } from "@/types/hero";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export function Hero({
  eyebrow,
  headline,
  description,
  primaryCta,
  secondaryCta,
  videoSrc,
  posterSrc,
  alignment = "left",
}: HeroProps) {
  const [canPlayVideo, setCanPlayVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { const media = window.matchMedia("(min-width: 801px) and (prefers-reduced-motion: no-preference)"); const update = () => setCanPlayVideo(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const playVideo = useCallback(() => {
    void videoRef.current?.play().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (canPlayVideo) playVideo();
  }, [canPlayVideo, playVideo]);

  return (
    <section className={`hero hero--${alignment}`} aria-labelledby="hero-heading">
      <div className="hero__media" aria-hidden="true">
        {canPlayVideo && videoSrc ? <video
          ref={videoRef}
          className="hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterSrc ?? "/images/koh-hero-poster.jpg"}
          onCanPlay={playVideo}
        >
          <source src={videoSrc} type="video/mp4" />
        </video> : null}
        <div className="hero__veil" />
      </div>

      <div className="hero__content page-shell">
        <p className="eyebrow hero__reveal hero__reveal--one">{eyebrow}</p>
        <h1 id="hero-heading" className="hero__reveal hero__reveal--two">{headline}</h1>
        <p className="hero__description hero__reveal hero__reveal--three">{description}</p>
        <div className="hero__actions hero__reveal hero__reveal--four">
          <Link className="button button--light" href={primaryCta.href}>{primaryCta.label}</Link>
          {secondaryCta ? <Link className="button button--quiet" href={secondaryCta.href}>{secondaryCta.label}</Link> : null}
        </div>
      </div>

      <div className="hero__scroll-note" aria-hidden="true">
        <span className="hero__scroll-line" />
        <span>Discover the ritual</span>
      </div>
    </section>
  );
}
