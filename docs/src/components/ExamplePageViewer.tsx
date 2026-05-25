import { MachineVisualizer } from "./MachineVisualizer";
import { StoreVisualizer } from "./StoreVisualizer";
import { getExample } from "../examples";
import { useEffect, useState, type ComponentType } from "react";
import type { FactoryMachine, StoreMachine } from "matchina";

interface Props {
  exampleId: string;
}

export function ExamplePageViewer({ exampleId }: Props) {
  const meta = getExample(exampleId);
  const [machine, setMachine] = useState<FactoryMachine<any> | StoreMachine<any> | null>(null);
  const [AppView, setAppView] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meta) {
      setError(`Example "${exampleId}" not found`);
      return;
    }
    meta.getMachine()
      .then((mod) => setMachine(mod.default()))
      .catch((e) => setError(String(e)));

    if (meta.getAppView) {
      meta.getAppView()
        .then((mod) => setAppView(() => mod.default))
        .catch(() => {});
    }
  }, [exampleId, meta]);

  useEffect(() => {
    if (!machine) return;
    document.getElementById('ex-panel-preview')?.setAttribute('data-loaded', '');
  }, [machine]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!machine) return null;

  if (meta?.kind === "store") {
    return (
      <StoreVisualizer
        store={machine as StoreMachine<any>}
        AppView={AppView ?? undefined}
        layout="split"
      />
    );
  }

  return (
    <MachineVisualizer
      machine={machine as FactoryMachine<any>}
      AppView={AppView ?? undefined}
      showRawState={false}
      layout="split"
      interactive={true}
      showPicker={import.meta.env.DEV && !meta?.hideVizPicker}
      {...(meta?.defaultViz !== undefined && { defaultViz: meta.defaultViz })}
    />
  );
}
