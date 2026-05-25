import { getExample } from "../examples";
import { useCallback, useMemo, useState } from "react";
import type { FactoryMachine, StoreMachine } from "matchina";
import { MachineVisualizer } from "./MachineVisualizer";
import { StoreVisualizer } from "./StoreVisualizer";
import type { VisualizerType } from "./VizPicker";
import type { SvgLayout } from "@matchina/viz-svg";

interface Props {
  id: string;
  /** Show only the app view, no diagram */
  appOnly?: boolean;
  defaultViz?: VisualizerType;
  showPicker?: boolean;
  hideAppPane?: boolean;
  defaultSvgDirection?: 'RIGHT' | 'DOWN';
  /** Pre-computed ELK layout (from Astro frontmatter) — enables SSR of the SVG diagram. */
  precomputedLayout?: SvgLayout;
}

export function ExamplePreview({ id, appOnly = false, defaultViz, showPicker, hideAppPane = false, defaultSvgDirection, precomputedLayout }: Props) {
  const meta = getExample(id);
  // Incrementing version forces machine recreation — AppViews that need a "reset"
  // (e.g. promise machines, where Resolved/Rejected are terminal) bind this to a button.
  const [version, setVersion] = useState(0);
  const onReset = useCallback(() => setVersion((v) => v + 1), []);

  // Build a fresh machine each version. Memoised so renders within a version are stable.
  const machine = useMemo(
    () => (meta ? meta.machineFactory() : null),
    [meta, version]
  );

  if (!meta) return <div className="p-4 text-red-500 font-mono text-sm">Example "{id}" not found</div>;
  if (!machine) return null;

  const AppView = meta.AppView;

  if (appOnly && AppView) {
    const propName = meta.kind === "store" ? "store" : "machine";
    return <AppView {...{ [propName]: machine }} onReset={onReset} />;
  }

  if (meta.kind === "store") {
    return (
      <StoreVisualizer
        store={machine as StoreMachine<any>}
        AppView={hideAppPane ? () => null : AppView}
        layout={hideAppPane ? "stacked" : "split"}
      />
    );
  }

  const resolvedViz = defaultViz ?? meta.defaultViz;

  return (
    <MachineVisualizer
      machine={machine as FactoryMachine<any>}
      AppView={hideAppPane ? () => null : AppView}
      showRawState={false}
      layout={hideAppPane ? "stacked" : "split"}
      interactive={true}
      appViewProps={{ onReset }}
      precomputedLayout={precomputedLayout}
      {...(resolvedViz !== undefined && { defaultViz: resolvedViz })}
      {...(showPicker !== undefined && { showPicker })}
      {...(defaultSvgDirection !== undefined && { defaultSvgDirection })}
    />
  );
}
