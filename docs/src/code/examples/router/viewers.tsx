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

  // Track previous render node and key so we can display it when keep>0
  const prevKeyRef = React.useRef<string | null>(null);
  const prevNodeRef = React.useRef<React.ReactNode>(null);
  const currKey = React.useMemo(() => {
    const m: any = match ?? (change as any)?.to ?? null;
    if (!m) return null;
    const name = m.name ?? m.key ?? 'unknown';
    const params = m.params ?? {};
    try { return `${name}:${JSON.stringify(params)}`; } catch { return String(name); }
  }, [match, (change as any)?.to]);

  // On key change, if keep>0 capture previous node
  React.useLayoutEffect(() => {
    if (!currKey) return;
    const prevKey = prevKeyRef.current;
    const prevNode = prevNodeRef.current;
    if (prevKey && keep > 0 && prevNode) {
      setKept([{ id: String(prevKey), node: prevNode }]);
    } else if (keep <= 0) {
      setKept([]);
    }
    // Update refs AFTER using previous
    prevKeyRef.current = currKey;
    prevNodeRef.current = children;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currKey, keep, children]);

  // Ensure dir attribute is applied; no animation waiting in this debug mode
  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    scope.setAttribute("data-vt-dir", direction);
  }, [direction]);

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* Previous (pink) */}
      {kept.map((k, i) => (
        <div
          key={k.id + ":" + i}
          className={`${classNameBase} is-previous-container`}
          aria-hidden="true"
          style={{ border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginBottom: 8 }}
        >
          {k.node}
        </div>
      ))}
      {/* Current (green) */}
      <div
        className={`${classNameBase} is-next-container`}
        style={{ border: '2px solid #16a34a', background: '#dcfce7', padding: 8 }}
      >
        {children ?? null}
      </div>
    </div>
  );
}
;
