import { matchboxFactory } from 'matchina';

// Create a Light matchbox with On/Off states
const Light = matchboxFactory({
  Off: undefined,
  On: (percentage = 100) => ({ percentage })
});

// Create an array of different lights
const lights = [
  Light.Off(),
  Light.On(100),
  Light.On(25),
  Light.On(75),
  Light.Off()
];

// Calculate power consumption (0 for off, percentage-based for on)
const powerUsage = lights.map(light => 
  light.match({
    Off: () => 0,
    On: ({ percentage }) => percentage / 100 * 10 // 10W max power
  })
);

console.log("Power usage per light (watts):", powerUsage);
// [0, 10, 2.5, 7.5, 0]

// Count how many lights are on or off
const counts = lights.reduce((acc, light) => {
  light.match({
    Off: () => acc.off++,
    On: () => acc.on++
  });
  return acc;
}, { off: 0, on: 0 });

console.log("Light counts:", counts);
// { off: 2, on: 3 }

// Advanced matching: categorize each light
const categories = lights.map(light => 
  light.match({
    Off: () => "off",
    On: ({ percentage }) => {
      if (percentage < 30) return "dim";
      if (percentage < 80) return "medium";
      return "bright";
    }
  })
);

console.log("Light categories:", categories);
// ["off", "bright", "dim", "medium", "off"]
