import { matchboxFactory } from "matchina";

export const Light = matchboxFactory({
  // Off state with no parameters
  Off: undefined,
  // On state with optional brightness percentage
  On: (percentage = 100) => ({ percentage }),
});

// Create light instances
const off = Light.Off();
const onFull = Light.On(); // Uses default 100%
const dimmed = Light.On(50); // 50% brightness
const { percentage } = dimmed.data;
