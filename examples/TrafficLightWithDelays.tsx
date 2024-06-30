import React from 'react'
import {  effect, matchina, setup, when } from "../../src";
import { useMachine } from "../../src/integrations/react";
import { tickEffect } from './StopwatchCommon';

// ---cut---
export const trafficLight = matchina(
  {
    Red: () => "means stop",
    Green: () => "means go",
    Yellow: () => "means caution",
  },
  {
    Red: { next: "Green" },
    Green: { next: "Yellow" },
    Yellow: { next: "Red" },
  },
  'Red'
);

setup(trafficLight.machine)(
  effect(when(ev => true, change => tickEffect(trafficLight.next, change.to.match({
    Red: () => 2000,
    Green: () => 2000,  
    Yellow: () => 1000,
  }))))
);
trafficLight.next()

export const TrafficLight = () => {
  useMachine(trafficLight.machine);
  const { state } = trafficLight
  return (
    <button title="Click to Change"
      className={`rounded ${trafficLight.state.match({
        Red: () => "bg-red-500",
        Yellow: () => "bg-yellow-500",
        Green: () => "bg-green-500",
      })}`} 
      onClick={() => trafficLight.next()}
    >
      {state.key} {state.data}
    </button>
  );
}