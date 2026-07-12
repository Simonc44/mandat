// components/ScrollScene.tsx
// GSAP ScrollTrigger : effets variés au défilement.
// Désactivés pour `prefers-reduced-motion`.
//
// Variants disponibles :
//  rise        — monte depuis le bas (défaut)
//  tilt        — rotation 3D + montée
//  parallax    — parallax vertical
//  depth       — zoom + perspective
//  slideX      — glisse depuis la gauche ou la droite (horizontal)
//  sticky-fade — section collante : l'élément [data-sticky-img] change
//                d'opacité en fonction du scroll, comme un crossfade
//                pendant que le texte [data-sticky-step] défile

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "tilt" | "parallax" | "rise" | "depth" | "slideX" | "sticky-fade";
  className?: string;
  /** slideX : direction d'entrée des éléments [data-slide] */
  fromLeft?: boolean;
};

export function ScrollScene({
  children,
  variant = "rise",
  className = "",
  fromLeft = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod   = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {

        // ── rise ──────────────────────────────────────────────────────────
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

        if (!isDesktop) return;

        // ── tilt ──────────────────────────────────────────────────────────
        if (variant === "tilt") {
          el.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
            card.style.transformStyle = "preserve-3d";
            card.style.perspective = "1200px";
            gsap.fromTo(
              card,
              { rotateX: 14, rotateY: -8, y: 80, opacity: 0 },
              {
                rotateX: 0, rotateY: 0, y: 0, opacity: 1,
                duration: 1.1, ease: "power3.out",
                scrollTrigger: { trigger: card, start: "top 90%", once: true },
              },
            );
          });
        }

        // ── parallax ──────────────────────────────────────────────────────
        if (variant === "parallax") {
          el.querySelectorAll<HTMLElement>("[data-parallax]").forEach((node) => {
            const speed = Number(node.dataset.parallax || "0.3");
            gsap.to(node, {
              yPercent: -speed * 100,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            });
          });
        }

        // ── depth ─────────────────────────────────────────────────────────
        if (variant === "depth") {
          gsap.fromTo(
            el,
            { scale: 0.85, rotateX: 10, opacity: 0.6 },
            {
              scale: 1, rotateX: 0, opacity: 1,
              duration: 1.4, ease: "power3.out",
              scrollTrigger: {
                trigger: el, start: "top 80%", end: "top 30%", scrub: 0.8,
              },
            },
          );
          el.style.transformStyle = "preserve-3d";
          el.style.perspective = "1500px";
        }

        // ── slideX ────────────────────────────────────────────────────────
        // Chaque [data-slide] entre depuis le côté (gauche ou droite).
        // Alterne automatiquement si data-slide="auto".
        if (variant === "slideX") {
          const items = el.querySelectorAll<HTMLElement>("[data-slide]");
          items.forEach((item, i) => {
            const dir = item.dataset.slide === "right"
              ? 1
              : item.dataset.slide === "left"
              ? -1
              : fromLeft
              ? (i % 2 === 0 ? -1 : 1)   // alternance auto
              : (i % 2 === 0 ? 1 : -1);

            gsap.fromTo(
              item,
              { x: dir * 120, opacity: 0 },
              {
                x: 0, opacity: 1,
                duration: 1.0,
                ease: "power3.out",
                delay: i * 0.06,
                scrollTrigger: { trigger: item, start: "top 88%", once: true },
              },
            );
          });
        }

        // ── sticky-fade ───────────────────────────────────────────────────
        // La section est "collante" : pendant que les [data-sticky-step]
        // défilent, l'image [data-sticky-img] change d'opacité progressivement.
        // Structure attendue :
        //   <ScrollScene variant="sticky-fade">
        //     <div data-sticky-img="0"> … image 0 … </div>
        //     <div data-sticky-img="1"> … image 1 … </div>
        //     <div data-sticky-step="0"> … texte slide 0 … </div>
        //     <div data-sticky-step="1"> … texte slide 1 … </div>
        //   </ScrollScene>
        if (variant === "sticky-fade") {
          const imgs  = el.querySelectorAll<HTMLElement>("[data-sticky-img]");
          const steps = el.querySelectorAll<HTMLElement>("[data-sticky-step]");

          // Cache toutes les images sauf la première
          imgs.forEach((img, i) => {
            gsap.set(img, { opacity: i === 0 ? 1 : 0, position: "absolute", inset: 0 });
          });

          // Pour chaque step, quand il entre dans le viewport, on crossfade
          steps.forEach((step, i) => {
            const imgIn  = imgs[i];
            const imgOut = imgs[i - 1];

            ScrollTrigger.create({
              trigger: step,
              start: "top 60%",
              end:   "bottom 40%",
              onEnter: () => {
                if (imgIn)  gsap.to(imgIn,  { opacity: 1, duration: 0.7, ease: "power2.inOut" });
                if (imgOut) gsap.to(imgOut, { opacity: 0, duration: 0.7, ease: "power2.inOut" });
              },
              onLeaveBack: () => {
                if (imgIn)  gsap.to(imgIn,  { opacity: 0, duration: 0.5, ease: "power2.inOut" });
                if (imgOut) gsap.to(imgOut, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
              },
            });
          });
        }

      }, el);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [variant, fromLeft]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
