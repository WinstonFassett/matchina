import { matchboxFactory } from "matchina";

const TrafficLight = matchboxFactory({
  Red: () => ({}),
  Yellow: () => ({}),
  Green: () => ({}),
});

const light = TrafficLight.Red();

// This will cause a compile-time error because we didn't handle Green
/*
light.match({
  Red: () => 'Stop',
  Yellow: () => 'Caution'
  // Error: Property 'Green' is missing in type...
});
*/

// Handling all cases works
export const action = light.match({
  Red: () => "Stop",
  Yellow: () => "Caution",
  Green: () => "Go",
});
