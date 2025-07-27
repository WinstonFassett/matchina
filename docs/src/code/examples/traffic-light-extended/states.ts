import { defineStates } from "matchina";

const pedestrianStates = defineStates({
  Walk: undefined,
  DontWalk: undefined,
  Error: undefined,
});
export interface CommonStateProps {
  key: string;
  crossingRequested?: boolean;
  walkWarningDuration?: number;
}
export const sharedStates = defineStates({
  State: (
    props: CommonStateProps = { key: "State", crossingRequested: false }
  ) => props,
});
export const states = defineStates({
  Green: () => ({
    message: "Go",
    duration: 4000, // 4 seconds
    pedestrian: pedestrianStates.Walk(),
  }),
  Yellow: () => ({
    message: "Prepare to stop",
    duration: 2000, // 2 seconds
    pedestrian: pedestrianStates.Walk(),
  }),
  Red: () => ({
    message: "Stop",
    duration: 4000, // 4 seconds
    pedestrian: pedestrianStates.DontWalk(),
  }),
  RedWithPedestrianRequest: () => ({
    message: "Stop with pedestrian requesting crossing",
    duration: 2000, // 2 seconds
    pedestrian: pedestrianStates.DontWalk(),
  }),
  FlashingYellow: () => ({
    message: "Proceed with caution",
    duration: 0, // No automatic transition
    pedestrian: pedestrianStates.DontWalk(),
    isFlashing: true,
  }),
  FlashingRed: () => ({
    message: "Stop and proceed when safe",
    duration: 0, // No automatic transition
    pedestrian: pedestrianStates.Error(),
    isFlashing: true,
  }),
  Broken: () => ({
    message: "Broken (flashing red)",
    duration: 0,
    pedestrian: pedestrianStates.Error(),
  }),
});
