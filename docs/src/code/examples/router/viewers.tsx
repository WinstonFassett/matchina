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

    // Mark changing + direction
    scope.classList.add("is-changing");
    scope.setAttribute("data-vt-dir", direction);

    const cleanup = () => {
      if (cycleId !== cycleIdRef.current) return; // interrupted
      scope.classList.remove("is-changing");
      onSettled?.();
    };

    // Wait for animations on both the immediate previous and next layers
    const collectAnimated = () => {
      const layers = scope.querySelectorAll(`.${classNameBase}`);
      return Array.from(layers) as HTMLElement[];
    };

    const animated = collectAnimated();
    let remaining = animated.length;
    if (remaining === 0) {
      cleanup();
      return;
    }

    const done = () => {
      remaining -= 1;
      if (remaining <= 0) cleanup();
    };

    const timeout = window.setTimeout(() => {
      cleanup();
    }, 1200);

    const endEvents = ["animationend", "transitionend"] as const;
    animated.forEach((el) => {
      const handler = () => done();
      endEvents.forEach((ev) => el.addEventListener(ev, handler, { once: true } as any));
    });

    return () => {
      window.clearTimeout(timeout);
      if (cycleId === cycleIdRef.current) {
        scope.classList.remove("is-changing");
      }
    };
  }, [to?.key]);

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* incoming */}
      <div className={`${classNameBase} is-next-container`}>{toNode}</div>

      {/* outgoing (current) */}
      {fromNode && (
        <div className={`${classNameBase} is-previous-container`} aria-hidden="true">
          {fromNode}
        </div>
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
