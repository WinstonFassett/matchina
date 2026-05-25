/**
 * Visualizer for StoreMachine examples.
 *
 * Stores don't have discrete states or a graph — instead this component shows:
 *   - the current value (large, monospaced)
 *   - a collapsible "last change" panel (from/to/type/params)
 *   - a collapsible "history" panel (recent changes)
 *   - default action buttons (when no custom AppView is provided)
 *
 * Mirrors the layout chrome of MachineVisualizer so the standalone /examples/<id>
 * viewer and the in-page <ExampleEmbed /> stay visually consistent.
 */

import type { StoreMachine, StoreChange } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useRef, useState, type ComponentType } from "react";

export interface StoreVisualizerProps {
  store: StoreMachine<any>;
  AppView?: ComponentType<{ store: StoreMachine<any> & any } & Record<string, any>>;
  layout?: "split" | "stacked";
  vizPosition?: "left" | "right";
  className?: string;
  /** History cap. Defaults to 20. */
  historyLimit?: number;
}

export function StoreVisualizer({
  store,
  AppView,
  layout = "split",
  vizPosition = "left",
  className = "",
  historyLimit = 20,
}: StoreVisualizerProps) {
  const change = useMachine(store);
  const value = store.getState();

  // Track change history. Skip the synthetic __initialize event.
  const [history, setHistory] = useState<StoreChange<any>[]>([]);
  const lastSeen = useRef<StoreChange<any> | null>(null);
  useEffect(() => {
    if (change && change !== lastSeen.current && change.type !== "__initialize") {
      lastSeen.current = change;
      setHistory((h) => [change, ...h].slice(0, historyLimit));
    }
  }, [change, historyLimit]);

  const isSplit = layout === "split";
  const isVizLeft = vizPosition === "left";

  const containerClasses = [
    isSplit ? "flex flex-col sm:flex-row gap-4 flex-1 min-h-0" : "flex flex-col gap-4",
    isSplit && !isVizLeft ? "flex-row-reverse" : "",
  ].filter(Boolean).join(" ");

  return (
    <div data-testid="store-visualizer" className={`flex flex-col ${isSplit ? "h-full" : ""} ${className}`}>
      <div className={containerClasses}>
        {/* Store-state pane */}
        <div data-testid="store-state-pane" className={isSplit ? "flex-1 min-h-0" : "w-full"}>
          <div className="h-full border border-border p-4 flex flex-col gap-3 overflow-auto">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Current value
              </span>
              <pre className="text-2xl font-mono text-foreground whitespace-pre-wrap break-all m-0 p-0 bg-transparent">
                {formatValue(value)}
              </pre>
            </div>

            <details className="border-t border-border pt-2" open>
              <summary className="cursor-pointer text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
                Last change
              </summary>
              <ChangeRow change={change} />
            </details>

            <details className="border-t border-border pt-2" open>
              <summary className="cursor-pointer text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
                History ({history.length})
              </summary>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No changes yet.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1 text-xs font-mono">
                  {history.map((c, i) => (
                    <li key={history.length - i} className="border-l-2 border-border pl-2">
                      <span className="text-foreground">{c.type}</span>
                      {c.params.length > 0 && (
                        <span className="text-muted-foreground">({c.params.map((p) => JSON.stringify(p)).join(", ")})</span>
                      )}
                      <span className="text-muted-foreground"> · {formatValue(c.from)} → {formatValue(c.to)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </div>
        </div>

        {/* App pane */}
        <div data-testid="store-app-pane" className={isSplit ? "flex-1 min-h-0 flex items-center justify-center" : "w-full"}>
          {AppView ? (
            <AppView store={store} />
          ) : (
            <DefaultStoreAppView store={store} />
          )}
        </div>
      </div>
    </div>
  );
}

function ChangeRow({ change }: { change: StoreChange<any> | undefined }) {
  if (!change || change.type === "__initialize") {
    return <p className="text-xs text-muted-foreground mt-2">(no changes yet)</p>;
  }
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs font-mono">
      <dt className="text-muted-foreground">type</dt>
      <dd className="text-foreground">{change.type}</dd>
      <dt className="text-muted-foreground">params</dt>
      <dd className="text-foreground">[{change.params.map((p) => JSON.stringify(p)).join(", ")}]</dd>
      <dt className="text-muted-foreground">from</dt>
      <dd className="text-foreground">{formatValue(change.from)}</dd>
      <dt className="text-muted-foreground">to</dt>
      <dd className="text-foreground">{formatValue(change.to)}</dd>
    </dl>
  );
}

function DefaultStoreAppView({ store }: { store: StoreMachine<any> }) {
  const actionKeys = Object.keys(store.actions ?? {});
  return (
    <div className="p-4 border border-border h-full flex flex-col gap-3 w-full">
      <p className="text-sm text-muted-foreground">Dispatch an action:</p>
      <div className="flex flex-wrap gap-2">
        {actionKeys.map((action) => (
          <button
            key={action}
            type="button"
            className="px-3 py-1 border border-border bg-muted hover:bg-muted/70 text-foreground text-sm transition-colors"
            onClick={() => store.dispatch(action as never)}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
