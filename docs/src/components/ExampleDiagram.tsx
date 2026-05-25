import { getExample } from "../examples";
import { useMemo } from "react";
import type { FactoryMachine } from "matchina";
import { MachineVisualizer } from "./MachineVisualizer";
import type { VisualizerType } from "./VizPicker";
import type { SvgLayout } from "@matchina/viz-svg";

interface Props {
  id: string;
  viz?: VisualizerType;
  interactive?: boolean;
  precomputedLayout?: SvgLayout;
}

export function ExampleDiagram({ id, viz = "reactflow", interactive = false, precomputedLayout }: Props) {
  const meta = getExample(id);
  const machine = useMemo(
    () => (meta ? (meta.machineFactory() as FactoryMachine<any>) : null),
    [meta]
  );

  if (!meta) return <div className="p-4 text-red-500 font-mono text-sm">Example "{id}" not found</div>;
  if (!machine) return null;

  return (
    <MachineVisualizer
      machine={machine}
      defaultViz={viz}
      showPicker={false}
      layout="stacked"
      interactive={interactive}
      showRawState={false}
      precomputedLayout={precomputedLayout}
    />
  );
}
