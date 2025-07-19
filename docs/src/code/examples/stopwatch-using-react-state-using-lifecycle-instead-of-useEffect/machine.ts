import { facade } from "matchina";

export const createStopwatch = () =>
  facade(
    {
      Stopped: {},
      Ticking: {},
      Suspended: {},
    },
    {
      Stopped: {
        start: "Ticking",
      },
      Ticking: {
        stop: "Stopped",
        suspend: "Suspended",
        clear: "Ticking",
      },
      Suspended: {
        stop: "Stopped",
        resume: "Ticking",
        clear: "Suspended",
      },
    },
    "Stopped",
  );
