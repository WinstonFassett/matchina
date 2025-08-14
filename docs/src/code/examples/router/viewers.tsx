import React from "react";
import { RouterSnapshotProvider } from "./appRouter";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

// Viewers are data-driven; they own DOM. The router passes only the raw change.
export type ViewerProps = {
  change?: any;
  direction?: Direction;
  keep?: number;
  classNameBase?: string;
  match?: any;
  prevMatch?: any;
  prevPath?: string;
  prevChildren?: React.ReactNode;
  prevCtx?: any;
  children?: React.ReactNode;
};

export const ImmediateViewer: React.FC<ViewerProps> = () => {
  return <></>;
};

// A SWUP-like parallel transitions viewer.
// - Renders previous and next layers together
// - Adds scope classes and direction attribute
// - Waits for animationend/transitionend before unmounting previous
export const SlideViewer: React.FC<ViewerProps> = ({
  change,
  direction = "forward",
  keep = 0,
  classNameBase = "vt-scope",
  match,
  prevMatch,
  prevPath,
  prevChildren,
  prevCtx,
  children,
}) => {
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  const currKey = React.useMemo(() => {
    const m: any = match ?? (change as any)?.to ?? null;
    if (!m) return null;
    const name = (m as any).name ?? 'unknown';
    const params = (m as any).params ?? {};
    try { return `${name}:${JSON.stringify(params)}`; } catch { return String(name); }
  }, [match, (change as any)?.to]);

  // Ensure dir attribute is applied; no animation waiting in this debug mode
  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    scope.setAttribute("data-vt-dir", direction);
  }, [direction]);

  return (
    <div ref={scopeRef} data-vt-dir={direction}>
      {/* Previous (pink) */}
      {keep > 0 && prevChildren ? (
        <div
          className={`${classNameBase} is-previous-container`}
          style={{ border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginBottom: 8 }}
        >
          {prevCtx ? (
            <RouterSnapshotProvider value={prevCtx}>{prevChildren}</RouterSnapshotProvider>
          ) : (
            prevChildren
          )}
        </div>
      ) : null}
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
