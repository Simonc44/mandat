import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

export function useLiquidGlassButtons() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activeInstances = new Map<HTMLElement, { destroy: () => void }>();
    const observers = new Map<HTMLElement, IntersectionObserver>();

    const processButton = async (btn: HTMLElement) => {
      if (btn.dataset.liquidProcessed === "true") return;
      btn.dataset.liquidProcessed = "true";

      const parent = btn.parentElement;
      if (!parent) return;

      // Create a wrapper that matches the original layout
      const wrapper = document.createElement("div");
      wrapper.className = "liquid-button-root inline-block relative overflow-visible";

      const computedStyle = window.getComputedStyle(btn);
      wrapper.style.margin = computedStyle.margin;
      wrapper.style.display = computedStyle.display === "block" ? "block" : "inline-block";
      wrapper.style.verticalAlign = computedStyle.verticalAlign;
      wrapper.style.width = computedStyle.width;

      // Reset margin on original button so we don't have double spacing
      btn.style.margin = "0";

      // Insert wrapper in place of button
      parent.insertBefore(wrapper, btn);

      // Create background sibling
      const bg = document.createElement("div");
      bg.className = "liquid-button-bg absolute inset-0 pointer-events-none";
      bg.style.borderRadius = computedStyle.borderRadius || "14px";
      bg.style.zIndex = "1";

      // Determine original background styling
      const bgImage = computedStyle.backgroundImage;
      const bgColor = computedStyle.backgroundColor;
      if (bgImage && bgImage !== "none") {
        bg.style.backgroundImage = bgImage;
      } else if (bgColor) {
        bg.style.backgroundColor = bgColor;
      } else {
        bg.style.background = "var(--gradient-primary)";
      }

      // Configure button style so it is prepared for liquid glass
      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.boxShadow = "none";
      btn.style.position = "relative";
      btn.style.zIndex = "2";

      // Append bg and btn to wrapper
      wrapper.appendChild(bg);
      wrapper.appendChild(btn);

      // Setup IntersectionObserver for on-demand initialization to avoid WebGL context limit (max 16)
      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting) {
            if (!activeInstances.has(btn)) {
              try {
                const { LiquidGlass } = await import("@ybouane/liquidglass");

                // Set dataset configuration for the button
                btn.dataset.config = JSON.stringify({
                  button: true,
                  cornerRadius: parseInt(computedStyle.borderRadius) || 14,
                  blurAmount: 0.15,
                  refraction: 0.35,
                  chromAberration: 0.04,
                });

                const instance = await LiquidGlass.init({
                  root: wrapper,
                  glassElements: [btn],
                });

                activeInstances.set(btn, instance);
              } catch (e) {
                console.error("Error initializing LiquidGlass for button:", e);
              }
            }
          } else {
            // Clean up when off-screen to save precious WebGL contexts
            const instance = activeInstances.get(btn);
            if (instance) {
              try {
                instance.destroy();
              } catch (e) {}
              activeInstances.delete(btn);
            }
          }
        },
        { threshold: 0.01 }
      );

      observer.observe(wrapper);
      observers.set(btn, observer);
    };

    const scanAndProcess = () => {
      // Find all primary buttons, link primary buttons, or standard button tags
      const buttons = document.querySelectorAll<HTMLElement>("button:not([disabled]), .btn-primary");
      buttons.forEach((btn) => {
        if (btn.dataset.liquidProcessed === "true") return;
        if (btn.closest(".liquid-button-root")) return;
        // Don't wrap tiny toggle buttons, icons, or specific widgets if they are too small (e.g. AI widget, cookie banner close)
        if (btn.offsetWidth < 35 || btn.offsetHeight < 25) return;

        processButton(btn);
      });
    };

    // Run initial scan
    scanAndProcess();

    // Setup MutationObserver to watch for newly inserted elements (like client-side route changes or dynamic updates)
    const mutationObserver = new MutationObserver(() => {
      scanAndProcess();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observers.forEach((obs) => obs.disconnect());
      activeInstances.forEach((inst) => {
        try {
          inst.destroy();
        } catch (e) {}
      });
    };
  }, [location.pathname]);
}
