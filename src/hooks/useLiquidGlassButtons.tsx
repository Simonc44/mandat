import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

export function useLiquidGlassButtons() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activeInstances = new Map<HTMLElement, { destroy: () => void }>();
    const observers = new Map<HTMLElement, IntersectionObserver>();
    const resizeObservers = new Map<HTMLElement, ResizeObserver>();
    const bgElements = new Map<HTMLElement, HTMLDivElement>();

    const processButton = async (btn: HTMLElement) => {
      if (btn.dataset.liquidProcessed === "true") return;
      btn.dataset.liquidProcessed = "true";

      const parent = btn.parentElement;
      if (!parent) {
        delete btn.dataset.liquidProcessed;
        return;
      }

      const computedStyle = window.getComputedStyle(btn);
      const borderRadius = computedStyle.borderRadius || "14px";

      // Store original button inline styles for perfect restoration on destruction
      const originalStyles = {
        background: btn.style.background,
        backgroundImage: btn.style.backgroundImage,
        boxShadow: btn.style.boxShadow,
        borderColor: btn.style.borderColor,
        position: btn.style.position,
      };

      // Create background sibling element
      const bg = document.createElement("div");
      bg.className = "liquid-button-bg absolute pointer-events-none";
      bg.style.borderRadius = borderRadius;
      bg.style.boxSizing = "border-box";

      // Copy original background style
      const bgImage = computedStyle.backgroundImage;
      const bgColor = computedStyle.backgroundColor;
      if (bgImage && bgImage !== "none") {
        bg.style.backgroundImage = bgImage;
      } else if (bgColor) {
        bg.style.backgroundColor = bgColor;
      } else {
        bg.style.background = "var(--gradient-primary)";
      }

      let inserted = false;
      let insertFrame: number | null = null;

      // Setup dynamic positioning and sizing sync using ResizeObserver
      const syncPosition = () => {
        if (!document.body.contains(btn)) return;
        bg.style.left = `${btn.offsetLeft}px`;
        bg.style.top = `${btn.offsetTop}px`;
        bg.style.width = `${btn.offsetWidth}px`;
        bg.style.height = `${btn.offsetHeight}px`;
        bg.style.display = window.getComputedStyle(btn).display;
      };

      const resizeObserver = new ResizeObserver(() => {
        syncPosition();
      });
      resizeObserver.observe(btn);
      resizeObservers.set(btn, resizeObserver);

      // Define cleanup helper first so it can be called safely
      const cleanupButton = () => {
        if (insertFrame !== null) {
          cancelAnimationFrame(insertFrame);
        }

        // Stop observation
        observer.disconnect();
        resizeObserver.disconnect();

        // Restore original inline styles
        btn.style.background = originalStyles.background;
        btn.style.backgroundImage = originalStyles.backgroundImage;
        btn.style.boxShadow = originalStyles.boxShadow;
        btn.style.borderColor = originalStyles.borderColor;
        btn.style.position = originalStyles.position;
        delete btn.dataset.liquidProcessed;

        // Remove background element from DOM
        // Defer removal to prevent synchronous DOM hierarchy conflicts during React's commit/reconciliation
        if (inserted) {
          inserted = false;
          requestAnimationFrame(() => {
            if (bg.parentNode) {
              try {
                bg.parentNode.removeChild(bg);
              } catch (e) {
                console.warn("Failed to remove button background safely:", e);
              }
            }
          });
        }

        // Destroy LiquidGlass instance
        const instance = activeInstances.get(btn);
        if (instance) {
          try {
            instance.destroy();
          } catch (e) {}
          activeInstances.delete(btn);
        }

        bgElements.delete(btn);
        observers.delete(btn);
        resizeObservers.delete(btn);
      };

      // Store cleanup function on the button element for easy access in MutationObserver
      (btn as any)._liquidCleanup = cleanupButton;

      // Defer DOM insertion to requestAnimationFrame to safely decouple from React's synchronous render/commit cycle
      insertFrame = requestAnimationFrame(() => {
        const currentParent = btn.parentElement;
        if (!currentParent || !document.body.contains(btn)) {
          cleanupButton();
          return;
        }
        try {
          currentParent.insertBefore(bg, btn);
          inserted = true;
          bgElements.set(btn, bg);
          syncPosition();
        } catch (err) {
          console.warn("Deferred background insertion failed:", err);
          cleanupButton();
        }
      });

      // Setup styles on button to make it transparent and ready for glass rendering
      btn.style.background = "transparent";
      btn.style.backgroundImage = "none";
      btn.style.boxShadow = "none";
      btn.style.borderColor = "transparent";
      btn.style.position = "relative";

      // Setup IntersectionObserver for on-demand WebGL rendering
      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting) {
            if (!activeInstances.has(btn)) {
              try {
                const { LiquidGlass } = await import("@ybouane/liquidglass");

                btn.dataset.config = JSON.stringify({
                  button: true,
                  cornerRadius: parseInt(borderRadius) || 14,
                  blurAmount: 0.15,
                  refraction: 0.4,
                  chromAberration: 0.04,
                  edgeHighlight: 0.2,
                  specular: 0.8,
                  fresnel: 1.0,
                  tintStrength: 0.25,
                  brightness: 0.05,
                });

                const instance = await LiquidGlass.init({
                  root: parent,
                  glassElements: [btn],
                });

                activeInstances.set(btn, instance);
              } catch (e) {
                console.error("Error initializing LiquidGlass for button:", e);
              }
            }
          } else {
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

      observer.observe(btn);
      observers.set(btn, observer);
    };

    const scanAndProcess = () => {
      const buttons = document.querySelectorAll<HTMLElement>("button:not([disabled]), .btn-primary");
      buttons.forEach((btn) => {
        if (btn.dataset.liquidProcessed === "true") return;
        if (btn.offsetWidth < 35 || btn.offsetHeight < 25) return;
        processButton(btn);
      });
    };

    scanAndProcess();

    // Setup MutationObserver to watch for newly inserted elements, and clean up removed ones
    const mutationObserver = new MutationObserver(() => {
      // Clean up orphaned buttons that were removed from the DOM
      bgElements.forEach((_, btn) => {
        if (!document.body.contains(btn)) {
          const cleanup = (btn as any)._liquidCleanup;
          if (typeof cleanup === "function") {
            cleanup();
          }
        }
      });

      scanAndProcess();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();

      // Clean up all active state
      bgElements.forEach((_, btn) => {
        const cleanup = (btn as any)._liquidCleanup;
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
    };
  }, [location.pathname]);
}
