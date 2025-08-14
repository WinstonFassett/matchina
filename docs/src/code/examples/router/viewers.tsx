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
  const [kept, setKept] = React.useState<Array<{ id: string; el: HTMLElement }>>([]);

  // Track previous render node and key so we can display it when keep>0
  const prevKeyRef = React.useRef<string | null>(null);
  const currentContainerRef = React.useRef<HTMLDivElement | null>(null);
  const snapshotRef = React.useRef<HTMLElement | null>(null);
  const currKey = React.useMemo(() => {
    const m: any = match ?? (change as any)?.to ?? null;
    if (!m) return null;
    const name = m.name ?? m.key ?? 'unknown';
    const params = m.params ?? {};
    try { return `${name}:${JSON.stringify(params)}`; } catch { return String(name); }
  }, [match, (change as any)?.to]);

  // On key change, if keep>0 capture previous node
  // On key change, use the snapshot from the previous commit
  React.useLayoutEffect(() => {
    if (!currKey) return;
    const prevKey = prevKeyRef.current;
    const prevSnapshot = snapshotRef.current;
    if (prevKey && keep > 0 && prevSnapshot) {
      const clone = prevSnapshot.cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');
      // Strip previous inline styles that marked it as current (green)
      clone.classList.remove('is-next-container');
      try { clone.style.border = 'none'; clone.style.background = 'transparent'; } catch {}
      setKept([{ id: String(prevKey), el: clone }]);
    } else if (keep <= 0) {
      setKept([]);
    }
    // Update refs AFTER using previous
    prevKeyRef.current = currKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currKey, keep, children]);

  // After each commit, capture a fresh snapshot of the current container for the next transition
  React.useLayoutEffect(() => {
    const container = currentContainerRef.current;
    if (!container) return;
    const clone = container.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id');
    clone.classList.remove('is-next-container');
    try { clone.style.border = 'none'; clone.style.background = 'transparent'; } catch {}
    snapshotRef.current = clone;
  });

  // Ensure dir attribute is applied; no animation waiting in this debug mode
  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    scope.setAttribute("data-vt-dir", direction);
  }, [direction]);

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* Previous (pink) */}
      {(keep > 0 ? kept : []).map((k, i) => (
        <DOMSnapshot
          key={k.id + ":" + i}
          element={k.el}
          className={`${classNameBase} is-previous-container`}
          style={{ border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginBottom: 8 }}
        />
      ))}
      {/* Current (green) */}
      <div
        className={`${classNameBase} is-next-container`}
        style={{ border: '2px solid #16a34a', background: '#dcfce7', padding: 8 }}
        ref={currentContainerRef}
      >
        {children ?? null}
      </div>
    </div>
  );
}
;

// DOMSnapshot mounts a pre-cloned HTMLElement as inert content
const DOMSnapshot: React.FC<{
  element: HTMLElement;
  className?: string;
  style?: React.CSSProperties;
}> = ({ element, className, style }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Clear host then append the clone (which we were given)
    host.innerHTML = '';
    try {
      host.appendChild(element);
    } catch {}
  }, [element]);
  return <div className={className} style={style} ref={hostRef} />;
};
