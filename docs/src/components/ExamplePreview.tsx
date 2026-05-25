import { getExample } from "../examples";
import { useEffect, useState, type ComponentType } from "react";
import type { FactoryMachine, StoreMachine } from "matchina";
import { MachineVisualizer } from "./MachineVisualizer";
import { StoreVisualizer } from "./StoreVisualizer";
import type { VisualizerType } from "./VizPicker";

interface Props {
  id: string;
  /** Show only the app view, no diagram */
  appOnly?: boolean;
  defaultViz?: VisualizerType;
  showPicker?: boolean;
  hideAppPane?: boolean;
  defaultSvgDirection?: 'RIGHT' | 'DOWN';
}

export function ExamplePreview({ id, appOnly = false, defaultViz, showPicker, hideAppPane = false, defaultSvgDirection }: Props) {
  const meta = getExample(id);
  const [machine, setMachine] = useState<FactoryMachine<any> | StoreMachine<any> | null>(null);
  const [AppView, setAppView] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meta) { setError(`Example "${id}" not found`); return; }
    meta.getMachine()
      .then((mod) => setMachine(mod.default()))
      .catch((e) => setError(String(e)));
    if (meta.getAppView) {
      meta.getAppView()
        .then((mod) => setAppView(() => mod.default))
        .catch(() => {});
    }
  }, [id, meta]);

  // Hide skeleton once machine is committed to DOM
  useEffect(() => {
    if (!machine) return;
    document.getElementById(`embed-preview-${id}`)?.setAttribute('data-loaded', '');
  }, [machine, id]);

  if (error) return <div className="p-4 text-red-500 font-mono text-sm">{error}</div>;
  if (!machine) return null;

  if (appOnly && AppView) {
    const propName = meta?.kind === "store" ? "store" : "machine";
    return <AppView {...{ [propName]: machine }} />;
  }

  if (meta?.kind === "store") {
    return (
      <StoreVisualizer
        store={machine as StoreMachine<any>}
        AppView={hideAppPane ? () => null : (AppView ?? undefined)}
        layout={hideAppPane ? "stacked" : "split"}
      />
    );
  }

  const resolvedViz = defaultViz ?? meta?.defaultViz;

  return (
    <MachineVisualizer
      machine={machine as FactoryMachine<any>}
      AppView={hideAppPane ? () => null : (AppView ?? undefined)}
      showRawState={false}
      layout={hideAppPane ? "stacked" : "split"}
      interactive={true}
      {...(resolvedViz !== undefined && { defaultViz: resolvedViz })}
      {...(showPicker !== undefined && { showPicker })}
      {...(defaultSvgDirection !== undefined && { defaultSvgDirection })}
    />
  );
}
