// components/StoryReveal.tsx
// Révèle un bloc quand il entre dans le viewport, le referme quand il en sort.
// Animation "histoire" bidirectionnelle basée sur IntersectionObserver.

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
  /** Seuil de visibilité (0-1) déclenchant l'ouverture */
  threshold?: number;
};

export function StoryReveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  threshold = 0.15,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      el?.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.classList.add("is-visible");
          else el.classList.remove("is-visible");
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};
  const cls = `story-reveal ${className}`;

  if (Tag === "section") return <section ref={ref as never} className={cls} style={style}>{children}</section>;
  if (Tag === "article") return <article ref={ref as never} className={cls} style={style}>{children}</article>;
  return <div ref={ref} className={cls} style={style}>{children}</div>;
}

