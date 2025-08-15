import React from "react";
import { RouterSnapshotProvider } from "./appRouter";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

// Viewers are data-driven; they own DOM. The router passes only the raw change.
export type ViewerProps = {
  change: any | null;
  direction?: Direction;
  keep?: number;
  exitMaxMs?: number; // safety max duration to keep exiting layer mounted
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

// Debug visuals context: allows demo UI to toggle red/green frames and logs
const DebugVisContext = React.createContext<boolean>(false);
export const DebugVisProvider: React.FC<{ value: boolean; children?: React.ReactNode; }> = ({ value, children }) => (
  <DebugVisContext.Provider value={value}>{children}</DebugVisContext.Provider>
);
export const useDebugVis = () => React.useContext(DebugVisContext);

// Animation mode context (presentation-level). Defaults to slideshow for both directions.
// Extended with 'circle' and 'gradient' modes; pointer-origin will default to center for now.
type AnimMode = 'slideshow' | 'slide' | 'circle' | 'gradient';
type AnimModeConfig = { forward: AnimMode; back: AnimMode };
const AnimModeContext = React.createContext<AnimModeConfig>({ forward: 'slideshow', back: 'slideshow' });
export const AnimModeProvider: React.FC<{ value: Partial<AnimModeConfig>; children?: React.ReactNode; }> = ({ value, children }) => {
  const parent = React.useContext(AnimModeContext);
  const merged = React.useMemo<AnimModeConfig>(() => ({
    forward: value.forward ?? parent.forward ?? 'slideshow',
    back: value.back ?? parent.back ?? 'slideshow',
  }), [value.forward, value.back, parent.forward, parent.back]);
  return <AnimModeContext.Provider value={merged}>{children}</AnimModeContext.Provider>;
};
export const useAnimMode = () => React.useContext(AnimModeContext);

// A SWUP-like parallel transitions viewer.
// - Renders previous and next layers together
// - Adds scope classes and direction attribute
// - Waits for animationend/transitionend before unmounting previous
export const SlideViewer: React.FC<ViewerProps> = ({
  change,
  direction = "forward",
  keep = 0,
  exitMaxMs = 5000,
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
  // Debug flag from context or ?vtDebug=1 query param
  const debugCtx = useDebugVis();
  const debugParam = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.get('vtDebug') === '1' || sp.get('vtdebug') === '1';
  }, []);
  const debug = debugCtx || debugParam;
  const animMode = useAnimMode();
  // Direction: prefer prop from Routes; fallback to change.type when absent
  const lastDirRef = React.useRef<Direction>(direction);
  const effectiveDir: Direction = React.useMemo(() => {
    if (direction) {
      lastDirRef.current = direction;
      return direction;
    }
    const t = change?.type as string | undefined;
    if (t === 'pop') return 'back';
    if (t === 'replace') return 'replace';
    return 'forward';
  }, [direction, change?.type]);
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
  const currRouteName = React.useMemo(() => (match ? String((match as any).name ?? '') : ''), [match]);
  const prevRouteName = React.useMemo(() => (prevMatch ? String((prevMatch as any).name ?? '') : ''), [prevMatch]);
  // Identity for DOM container keys should come from caller-provided view identity when available.
  // This avoids coupling to route-level identity and works for multilevel views on the same route.
  const currIdentityKey = React.useMemo(() => (viewKey ?? currRouteKey ?? 'curr'), [viewKey, currRouteKey]);
  const prevIdentityKey = React.useMemo(() => (prevViewKey ?? prevRouteKey ?? 'prev'), [prevViewKey, prevRouteKey]);
  const scopeChanged = React.useMemo(() => {
    // Prefer explicit per-level view keys when provided by Routes
    if (typeof viewKey !== 'undefined' || typeof prevViewKey !== 'undefined') {
      return Boolean(prevViewKey && viewKey && prevViewKey !== viewKey);
    }
    // Fallback: Only animate when BOTH this level's prev and curr matches exist AND differ
    if (prevRouteKey && currRouteKey) return prevRouteKey !== currRouteKey;
    return false;
  }, [viewKey, prevViewKey, prevRouteKey, currRouteKey]);

  // Exit lifecycle: keep previous children mounted until transition end (or timeout)
  const [exitLayer, setExitLayer] = React.useState<null | { node: React.ReactNode; key: string }>(null);
  const prevContainerRef = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  // When a new transition occurs at this level, capture the previous children as an exit layer.
  // Use layout effect to avoid a paint before the container has [data-vt-changing].
  React.useLayoutEffect(() => {
    console.log('SlideViewer: useLayoutEffect', { keep, prevChildren, scopeChanged, prevRouteKey });
    if (keep > 0 && prevChildren && scopeChanged) {
      console.log('SlideViewer: useLayoutEffect: setting exit layer');
      const k = (prevIdentityKey ? `${prevIdentityKey}::prev` : 'prev');
      setExitLayer({ node: prevChildren, key: k });
    } else {
      console.log('SlideViewer: useLayoutEffect: no exit layer');
      setExitLayer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keep, prevChildren, scopeChanged, prevIdentityKey]);
  // Attach transition/animation end listeners to remove exit layer
  React.useEffect(() => {
    if (!exitLayer) return;
    const el = prevContainerRef.current;
    if (!el) return;
    let done = false;
    const clear = () => {
      if (done) return;
      done = true;
      setExitLayer(null);
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    const onEnd = () => clear();
    el.addEventListener('transitionend', onEnd, { once: true } as any);
    el.addEventListener('animationend', onEnd, { once: true } as any);
    timeoutRef.current = window.setTimeout(clear, exitMaxMs);
    return () => {
      el.removeEventListener('transitionend', onEnd as any);
      el.removeEventListener('animationend', onEnd as any);
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [exitLayer, exitMaxMs]);

  // Debug: log per-level decisions when debug is enabled
  React.useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.debug('[SlideViewer]', { level: classNameBase, prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, dir: effectiveDir, hasExit: !!exitLayer });
  }, [debug, prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, effectiveDir, classNameBase, exitLayer]);

  return (
    <div
      className={`${classNameBase}-scope`}
      data-vt-dir={effectiveDir}
      data-vt-mode-forward={animMode.forward}
      data-vt-mode-back={animMode.back}
      data-vt-mode={effectiveDir === 'back' ? animMode.back : (effectiveDir === 'forward' ? animMode.forward : 'slide')}
      // Only animate when an exit layer is actually mounted at this level
      data-vt-changing={exitLayer ? 1 : undefined}
      style={{ display: 'grid' }}
    >
      {/* New/Next (rendered first to match SWUP ordering) */}
      <div
        key={`${currIdentityKey}::curr`}
        className={`${classNameBase} is-next-container`}
        data-vt-view={currRouteName || undefined}
        style={debug ? { border: '2px solid #16a34a', background: '#dcfce7', padding: 8 } : undefined}
      >
        {children ?? null}
      </div>
      {/* Previous (exiting) */}
      {exitLayer ? (
        <div
          key={exitLayer.key}
          ref={prevContainerRef}
          className={`${classNameBase} is-previous-container`}
          data-vt-exiting="1"
          data-vt-view={prevRouteName || undefined}
          style={debug ? { border: '2px solid hotpink', background: '#ffe4e6', padding: 8, marginTop: 8, opacity: 0.92 } : undefined}
        >
          {exitLayer.node}
        </div>
      ) : null}
    </div>
  );
}
;
