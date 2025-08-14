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
  // Map change.type to direction and persist last non-null value for stability
  const mapDir = React.useCallback((t?: string): Direction => {
    if (t === 'pop') return 'back';
    if (t === 'replace') return 'replace';
    return 'forward';
  }, []);
  const lastDirRef = React.useRef<Direction>(direction);
  const effectiveDir: Direction = React.useMemo(() => {
    const next = mapDir(change?.type as string | undefined);
    // If change is undefined/null, reuse last direction for this paint
    if (change && change.type) {
      lastDirRef.current = next;
      return next;
    }
    return lastDirRef.current;
  }, [change, mapDir]);
  // Decide scope change purely by child component identity (view element type)
  const getViewId = React.useCallback((node: React.ReactNode): string | null => {
    const el: any = React.isValidElement(node) ? node : null;
    if (!el) return null;
    const t: any = el.type;
    return (t?.displayName || t?.name || null) ?? null;
  }, []);
  const currViewId = React.useMemo(() => getViewId(children), [children, getViewId]);
  const prevViewId = React.useMemo(() => getViewId(prevChildren), [prevChildren, getViewId]);
  const scopeChanged = Boolean(prevViewId && currViewId && prevViewId !== currViewId);

  return (
    <div
      className={`${classNameBase}-scope`}
      data-vt-dir={effectiveDir}
      data-vt-changing={keep > 0 && !!prevChildren && scopeChanged ? 1 : undefined}
      style={{ display: 'grid' }}
    >
      {/* Previous (pink) */}
      {keep > 0 && prevChildren && scopeChanged ? (
        <div
          key={(prevViewId ? `${prevViewId}::prev` : 'prev')}
          className={`${classNameBase} is-previous-container`}
          style={{ border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginBottom: 8 }}
        >
          {prevChildren}
        </div>
      ) : null}
      {/* Current (green) */}
      <div
        key={(currViewId ? `${currViewId}::curr` : 'curr')}
        className={`${classNameBase} is-next-container`}
        style={{ border: '2px solid #16a34a', background: '#dcfce7', padding: 8 }}
      >
        {children ?? null}
      </div>
    </div>
  );
}
;
