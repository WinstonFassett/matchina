import { matchboxFactory } from 'matchina';

// Create a Light matchbox with On/Off states
export const Light = matchboxFactory({
  // Off state with no parameters
  Off: undefined,
  
  // On state with optional brightness percentage
  On: (percentage = 100) => ({ percentage })
});

// Create light instances
const off = Light.Off();
const onFull = Light.On(); // Uses default 100%
const dimmed = Light.On(50); // 50% brightness

// Type-safe access to state data
console.log(off.tag); // "Off"
console.log(onFull.tag); // "On"
console.log(onFull.data.percentage); // 100
console.log(dimmed.data.percentage); // 50
