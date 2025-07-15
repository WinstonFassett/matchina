import { getXStateDefinition } from "@code/examples/stopwatch-common/matchina-machine-to-xstate-definition";
import StateMachineMermaidDiagram from "@components/MachineViz";
import { TrafficLight, trafficLight } from "@code/examples/TrafficLight";
import { useMemo } from "react";
import { useMachine } from "@lib/src/integrations/react";
import { createApi } from "@lib/src";

export function TrafficLightDemo() {
  const config = useMemo(() => {
    return getXStateDefinition(trafficLight.machine);
  }, [trafficLight.machine]);
  useMachine(trafficLight.machine);
  const actions = useMemo(
    () => createApi(trafficLight.machine as any, trafficLight.state.key),
    [trafficLight.state],
  );

  return (
    <div className="not-content flex items-center justify-around">
      <TrafficLight />
      <StateMachineMermaidDiagram
        config={config}
        stateKey={trafficLight.state.key}
        actions={actions}
      />
    </div>
  );
}
