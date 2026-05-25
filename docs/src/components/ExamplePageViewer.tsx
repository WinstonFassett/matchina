import { MachineVisualizer } from "./MachineVisualizer";
import { StoreVisualizer } from "./StoreVisualizer";
import { getExample } from "../examples";
import { useCallback, useMemo, useState } from "react";
import type { FactoryMachine, StoreMachine } from "matchina";
import type { SvgLayout } from "@matchina/viz-svg";

interface Props {
  exampleId: string;
  /** Pre-computed ELK layout (from Astro frontmatter) — enables SSR of the SVG diagram. */
  precomputedLayout?: SvgLayout;
}

export function ExamplePageViewer({ exampleId, precomputedLayout }: Props) {
  const meta = getExample(exampleId);
  const [version, setVersion] = useState(0);
  const onReset = useCallback(() => setVersion((v) => v + 1), []);

  const machine = useMemo(
    () => (meta ? meta.machineFactory() : null),
    [meta, version]
  );

  if (!meta) return <div className="p-4 text-red-500">Example "{exampleId}" not found</div>;
  if (!machine) return null;

  if (meta.kind === "store") {
    return (
      <StoreVisualizer
        store={machine as StoreMachine<any>}
        AppView={meta.AppView}
        layout="split"
      />
    );
  }

  return (
    <MachineVisualizer
      machine={machine as FactoryMachine<any>}
      AppView={meta.AppView}
      showRawState={false}
      layout="split"
      interactive={true}
      appViewProps={{ onReset }}
      precomputedLayout={precomputedLayout}
      showPicker={import.meta.env.DEV && !meta.hideVizPicker}
      {...(meta.defaultViz !== undefined && { defaultViz: meta.defaultViz })}
    />
  );
}
