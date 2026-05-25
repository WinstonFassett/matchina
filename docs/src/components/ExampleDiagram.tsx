import { getExample } from "../examples";
import { useEffect, useState } from "react";
import type { FactoryMachine } from "matchina";
import { MachineVisualizer } from "./MachineVisualizer";
import type { VisualizerType } from "./VizPicker";

interface Props {
  id: string;
  viz?: VisualizerType;
  interactive?: boolean;
}

export function ExampleDiagram({ id, viz = "reactflow", interactive = false }: Props) {
  const meta = getExample(id);
  const [machine, setMachine] = useState<FactoryMachine<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meta) { setError(`Example "${id}" not found`); return; }
    meta.getMachine()
      .then((mod) => setMachine(mod.default() as FactoryMachine<any>))
      .catch((e) => setError(String(e)));
  }, [id, meta]);

  if (error) return <div className="p-4 text-red-500 font-mono text-sm">{error}</div>;
  if (!machine) return <div className="p-4 text-muted-foreground font-mono text-sm">Loading…</div>;

  return (
    <MachineVisualizer
      machine={machine}
      defaultViz={viz}
      showPicker={false}
      layout="stacked"
      interactive={interactive}
      showRawState={false}
    />
  );
}
