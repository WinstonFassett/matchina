import React from "react";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

export interface RouteMatchInfo {
  key: string; // `${name}:${stableParams}`
  name: string;
  params: any;
  path: string;
}

export interface RouterChange {
  type: "push" | "replace" | "pop" | "redirect" | "reset" | "complete" | "fail";
  from: RouteMatchInfo | null;
  to: RouteMatchInfo | null;
  timestamp?: number;
  reason?: string;
}

export interface ViewerProps {
  change: RouterChange;
  from: RouteMatchInfo | null;
  to: RouteMatchInfo | null;
  fromNode: React.ReactNode | null;
  toNode: React.ReactNode | null;
  direction: Direction;
  keep?: number;
  onSettled?: () => void;
  classNameBase?: string; // e.g., 'transition-slide'
}

export const ImmediateViewer: React.FC<ViewerProps> = ({ toNode }) => {
  return <>{toNode}</>;
};

// A SWUP-like parallel transitions viewer.
// - Renders previous and next layers together
// - Adds scope classes and direction attribute
// - Waits for animationend/transitionend before unmounting previous
export const SlideViewer: React.FC<ViewerProps> = ({
  change,
  from,
  to,
  fromNode,
  toNode,
  direction,
  keep = 0,
  classNameBase = "transition-slide",
  onSettled,
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
    if (fromNode && from) {
      setKept((prev) => {
        const next = [{ id: from.key, node: fromNode }, ...prev];
        return next.slice(0, keep);
      });
    } else {
      setKept((prev) => prev.slice(0, keep));
    }

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
  }, [to?.key, direction, keep]);

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* incoming */}<>Incoming
      <div className={`${classNameBase} is-next-container`}>{toNode}</div>
      </>
      {/* outgoing (current) */}
      {fromNode && (<>Outgoing
        <div className={`${classNameBase} is-previous-container`} aria-hidden="true">
          {fromNode}
        </div></>
      )}

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
};
