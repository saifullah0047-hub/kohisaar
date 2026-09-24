export type HeroAlignment = "left" | "center" | "right";

export interface HeroProps {
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  videoSrc: string;
  posterSrc?: string;
  alignment?: HeroAlignment;
}
