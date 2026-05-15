import { getExample } from "../examples";
import { useEffect, useState, type ComponentType } from "react";
import type { FactoryMachine } from "matchina";
import { MachineVisualizer } from "./MachineVisualizer";

interface Props {
  id: string;
  /** Show only the app view, no diagram */
  appOnly?: boolean;
}

export function ExamplePreview({ id, appOnly = false }: Props) {
  const meta = getExample(id);
  const [machine, setMachine] = useState<FactoryMachine<any> | null>(null);
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

  if (error) return <div className="p-4 text-red-500 font-mono text-sm">{error}</div>;
  if (!machine) return <div className="p-4 text-muted-foreground font-mono text-sm">Loading…</div>;

  if (appOnly && AppView) {
    return <AppView machine={machine} />;
  }

  return (
    <MachineVisualizer
      machine={machine}
      AppView={AppView ?? undefined}
      showRawState={false}
      layout="split"
      interactive={true}
    />
  );
}
