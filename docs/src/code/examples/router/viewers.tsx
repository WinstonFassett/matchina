import React from "react";
import { RouterSnapshotProvider } from "./appRouter";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

// Viewers are data-driven; they own DOM. The router passes only the raw change.
export type ViewerProps = {
  change: any | null;
  direction?: Direction;
  keep?: number;
  classNameBase?: string;
  match?: any;
  prevMatch?: any;
  prevPath?: string;
  prevChildren?: React.ReactNode;
  prevCtx?: any;
  // Optional: per-level scoped view identity passed by Routes
  viewKey?: string;
  prevViewKey?: string;
} & { children?: React.ReactNode };

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
  viewKey,
  prevViewKey,
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
  // Use route identity at this scope (name + params) to decide if this level changed
  const makeRouteKey = React.useCallback((m: any): string | null => {
    if (!m) return null;
    const name = (m as any).name ?? 'unknown';
    const params = (m as any).params ?? {};
    try { return `${name}:${JSON.stringify(params)}`; } catch { return String(name); }
  }, []);
  // IMPORTANT: only use props from this Routes level; do NOT fall back to global change.to/from
  const currRouteKey = React.useMemo(() => makeRouteKey(match ?? null), [makeRouteKey, match]);
  const prevRouteKey = React.useMemo(() => makeRouteKey(prevMatch ?? null), [makeRouteKey, prevMatch]);
  const scopeChanged = React.useMemo(() => {
    // Prefer explicit per-level view keys when provided by Routes
    if (typeof viewKey !== 'undefined' || typeof prevViewKey !== 'undefined') {
      // If we have a previous layer and keep>0, treat first render after change as changed
      if (!prevViewKey && typeof viewKey !== 'undefined' && prevChildren && keep > 0) return true;
      return Boolean(prevViewKey && viewKey && prevViewKey !== viewKey);
    }
    // Fallback: Only animate when BOTH this level's prev and curr matches exist AND differ
    if (prevRouteKey && currRouteKey) return prevRouteKey !== currRouteKey;
    return false;
  }, [viewKey, prevViewKey, prevChildren, keep, prevRouteKey, currRouteKey]);

  // Debug: log per-level decisions (remove once stable)
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[SlideViewer]', { level: classNameBase, prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, dir: effectiveDir });
  }, [prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, effectiveDir, classNameBase]);

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
          key={(prevRouteKey ? `${prevRouteKey}::prev` : 'prev')}
          className={`${classNameBase} is-previous-container`}
          style={{ border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginBottom: 8 }}
        >
          {prevChildren}
        </div>
      ) : null}
      {/* Current (green) */}
      <div
        key={(currRouteKey ? `${currRouteKey}::curr` : 'curr')}
        className={`${classNameBase} is-next-container`}
        style={{ border: '2px solid #16a34a', background: '#dcfce7', padding: 8 }}
      >
        {children ?? null}
      </div>
    </div>
  );
}
;
