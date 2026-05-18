import { useMemo } from "react";
import { useMachine } from "matchina/react";
import { SvgInspector } from "@matchina/viz-svg";
import { createLandingFetcherMachine } from "@code/examples/landing-fetcher/machine";
import { getActiveStatePath } from "@code/examples/lib/matchina-machine-to-xstate-definition";

export function HeroFetcherDiagram() {
  const machine = useMemo(createLandingFetcherMachine, []);
  useMachine(machine);
  const shape = (machine as any).shape?.getState();
  const value = getActiveStatePath(machine);
  return (
    <SvgInspector
      shape={shape}
      value={value}
      onFire={(event) => (machine as any).send(event)}
      options={{ direction: "DOWN" }}
      interactive
    />
  );
}
