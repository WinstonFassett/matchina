import React from "react";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

// Viewers are data-driven; they own DOM. The router passes only the raw change.
export interface ViewerProps {
  change: any;
  direction: Direction;
  keep?: number;
  onSettled?: () => void;
  classNameBase?: string; // e.g., 'transition-slide'
  match?: { key: string; params: any; path: string } | null;
  children?: React.ReactNode;
}

export const ImmediateViewer: React.FC<ViewerProps> = () => {
  return <></>;
};

// A SWUP-like parallel transitions viewer.
// - Renders previous and next layers together
// - Adds scope classes and direction attribute
// - Waits for animationend/transitionend before unmounting previous
export const SlideViewer: React.FC<ViewerProps> = ({
  change,
  direction,
  keep = 0,
  classNameBase = "transition-slide",
  onSettled,
  match,
  children,
}) => {
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  const [kept, setKept] = React.useState<Array<{ id: string; node: React.ReactNode }>>([]);

  // Track current cycle id to cancel previous listeners on interrupt
  const cycleIdRef = React.useRef(0);

  // Whenever 'to' changes, start a new parallel phase
  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const cycleId = ++cycleIdRef.current;

    // Update kept stack
    setKept((prev) => prev.slice(0, keep));

    // Set direction attribute immediately
    scope.setAttribute("data-vt-dir", direction);

    // Start animations on the next frame to ensure DOM is painted
    const rafId = requestAnimationFrame(() => {
      if (cycleId !== cycleIdRef.current) return; // interrupted
      scope.classList.add("is-changing");

      const cleanup = () => {
        if (cycleId !== cycleIdRef.current) return; // interrupted
        scope.classList.remove("is-changing");
        onSettled?.();
      };

      // Only wait on the immediate next and previous containers (exclude kept history)
      const animated = Array.from(
        scope.querySelectorAll(`.${classNameBase}.is-next-container, .${classNameBase}.is-previous-container:not(.is-kept-container)`) as NodeListOf<HTMLElement>
      );
      let remaining = animated.length;
      if (remaining === 0) {
        cleanup();
        return;
      }

      const endEvents = ["animationend", "transitionend"] as const;
      const seen = new WeakSet<EventTarget>();
      const onEnd = (target: EventTarget | null) => {
        if (!target || seen.has(target)) return;
        seen.add(target);
        remaining -= 1;
        if (remaining <= 0) cleanup();
      };

      animated.forEach((el) => {
        endEvents.forEach((ev) =>
          el.addEventListener(
            ev,
            (e) => onEnd(e.currentTarget),
            { once: true } as any
          )
        );
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (cycleId === cycleIdRef.current) {
        scope.classList.remove("is-changing");
      }
    };
  }, [change?.to?.key, direction, keep]);

  const route = ((match as any) ?? (change as any)?.to ?? null) as { name?: string; params?: any } | null;

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* Viewer owns DOM; this is just a transition scope container. */}
      <div className={`${classNameBase} is-next-container`}>{children ?? null}</div>
      {/* kept history */}
      {kept.map((k, i) => (
        <div
          key={k.id + ":" + i}
          className={`${classNameBase} is-previous-container is-kept-container`}
          aria-hidden="true"
        >
          {k.node}
        </div>
      ))}
    </div>
  );
}
;
