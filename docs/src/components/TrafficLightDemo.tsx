import { getXStateDefinition } from "@code/examples/lib/matchina-machine-to-xstate-definition";
import { TrafficLight } from "@code/examples/traffic-light";
import { createTrafficLight } from "@code/examples/traffic-light/machine";
import StateMachineMermaidDiagram from "@components/MachineViz";
import { createApi } from "matchina";
import { useMachine } from "matchina/integrations/react";
import { useMemo } from "react";

export function TrafficLightDemo() {
  const trafficLight = useMemo(createTrafficLight, []);
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
