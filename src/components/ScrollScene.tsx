// components/ScrollScene.tsx
// GSAP ScrollTrigger : effets 3D au défilement.
// Désactivés sur mobile (< 768 px) et pour `prefers-reduced-motion`.

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "tilt" | "parallax" | "rise" | "depth";
  className?: string;
};

export function ScrollScene({ children, variant = "rise", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (reduced) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        if (variant === "rise") {
          gsap.from(el.querySelectorAll("[data-rise]"), {
            opacity: 0,
            y: 60,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        }

        if (!isDesktop) return; // les effets 3D lourds sont desktop-only

        if (variant === "tilt") {
          el.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
            card.style.transformStyle = "preserve-3d";
            card.style.perspective = "1200px";
            gsap.fromTo(
              card,
              { rotateX: 14, rotateY: -8, y: 80, opacity: 0 },
              {
                rotateX: 0,
                rotateY: 0,
                y: 0,
                opacity: 1,
                duration: 1.1,
                ease: "power3.out",
                scrollTrigger: { trigger: card, start: "top 90%", once: true },
              }
            );
          });
        }

        if (variant === "parallax") {
          el.querySelectorAll<HTMLElement>("[data-parallax]").forEach((node) => {
            const speed = Number(node.dataset.parallax || "0.3");
            gsap.to(node, {
              yPercent: -speed * 100,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
            });
          });
        }

        if (variant === "depth") {
          // Effet "carrousel 3D" : la section se rapproche puis recule
          gsap.fromTo(
            el,
            { scale: 0.85, rotateX: 10, opacity: 0.6 },
            {
              scale: 1,
              rotateX: 0,
              opacity: 1,
              duration: 1.4,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 80%", end: "top 30%", scrub: 0.8 },
            }
          );
          el.style.transformStyle = "preserve-3d";
          el.style.perspective = "1500px";
        }
      }, el);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [variant]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
