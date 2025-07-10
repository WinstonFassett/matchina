import React from 'react'
import {  matchina } from "matchina";
import { useMachine } from "matchina/react";

// ---cut---
export const trafficLight = matchina(
  {
    Red: () => "means stop",
    Yellow: () => "means caution",
    Green: () => "means go",
  },
  {
    Red: { next: "Green" },
    Yellow: { next: "Red" },
    Green: { next: "Yellow" },
  },
  'Red'
);

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