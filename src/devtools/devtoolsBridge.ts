import { setup } from "../src/ext/setup";
import { transition as hookTransition } from "../src/state-machine-hooks";
import { adaptForDevtools } from "../src/devtools/devtools-adapter";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any };

export type DevtoolsBridgeOptions = {
  name?: string;
  trace?: boolean; // console fallback when no devtools
  serializeDepth?: number; // future-proof, currently shallow
};

/**
 * Optional enhancer that reports transitions to Redux DevTools when present,
 * or logs to console when `trace: true`. Zero dependency.
 *
 * Usage:
 *   setup(machine)(devtoolsBridge(machine, { name: "CheckoutFlow", trace: false }))
 */
export function devtoolsBridge<M extends AnyMachine>(machine: M, opts: DevtoolsBridgeOptions = {}) {
  const { name = "Machine", trace = false } = opts;

  // Attempt to connect to Redux DevTools Extension if present
  const devtools = (typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__)
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name })
    : undefined;

  const serializeState = () => {
    const adapted = adaptForDevtools(machine);
    const s = adapted.getState();
    const shallowData = s?.data && typeof s.data === "object" ? { ...s.data } : s?.data;
    if (shallowData && shallowData.machine) {
      try {
        const child = (shallowData as any).machine;
        const childState = typeof child?.getState === "function" ? child.getState() : undefined;
        const id = (s?.data as any)?.id ?? (s as any)?.id;
        (shallowData as any).machine = {
          _child: true,
          id,
          key: childState?.key,
        };
      } catch {}
    }
    return { key: s?.key, data: shallowData };
  };

  const log = (action: any) => {
    if (!trace) return;
    try {
      // eslint-disable-next-line no-console
      console.log("[matchina:devtools]", action, serializeState());
    } catch {}
  };

  return (target: M) => {
    // init snapshot
    try { devtools?.init(serializeState()); } catch {}

    const disposeTransition = hookTransition((ev, next) => {
      const result = next(ev);
      const action = buildAction(ev);
      try {
        if (devtools) devtools.send(action, serializeState());
        else log(action);
      } catch {
        log(action);
      }
      return result;
    })(target as any);

    return () => {
      disposeTransition?.();
      try { devtools?.disconnect?.(); } catch {}
    };
  };
}

function buildAction(ev: any) {
  const type = ev?.type ?? "(unknown)";
  const payload: any = { params: ev?.params, from: ev?.from?.key, to: ev?.to?.key };
  if (type === "child.exit") {
    const first = Array.isArray(ev?.params) ? ev.params[0] : undefined;
    if (first && typeof first === "object") {
      payload.childId = (first as any).id;
      payload.childState = (first as any).state;
    }
  }
  return { type, payload };
}
