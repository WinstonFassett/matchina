import { useEffect, useMemo } from "react";
import { useMachine } from "matchina/react";
import { SvgInspector, type SvgLayout } from "@matchina/viz-svg";
import { createLandingFetcherMachine } from "@code/examples/landing-fetcher/machine";
import { getActiveStatePath } from "@code/examples/lib/matchina-machine-to-xstate-definition";

interface Props {
  precomputedLayout?: SvgLayout;
}

export function HeroFetcherDiagram({ precomputedLayout }: Props) {
  const machine = useMemo(createLandingFetcherMachine, []);
  useMachine(machine);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("hero-card")?.setAttribute("data-live", "");
      });
    });
  }, []);
  const shape = (machine as any).shape?.getState();
  const value = getActiveStatePath(machine);
  return (
    <SvgInspector
      shape={shape}
      value={value}
      onFire={(event) => (machine as any).send(event)}
      options={{ direction: "DOWN" }}
      precomputedLayout={precomputedLayout}
      interactive
    />
  );
}
