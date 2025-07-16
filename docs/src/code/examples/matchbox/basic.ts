import { matchboxFactory } from 'matchina';

// Create a matchbox for light states
const Light = matchboxFactory({
  // Simple state with no data
  Off: undefined,
  
  // State with data and default parameter value
  On: (brightness = 100) => ({ brightness })
});

// Create light instances
const off = Light.Off();
const dimmed = Light.On(50);
const bright = Light.On();

console.log(off.tag);            // "Off"
console.log(dimmed.data);        // { brightness: 50 }
console.log(bright.data);        // { brightness: 100 }

// TypeScript knows exact types
console.log(dimmed.data.brightness);  // 50
