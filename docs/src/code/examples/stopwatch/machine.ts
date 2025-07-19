import { facade, setup, enter, when, effect } from "matchina";

export const createStopwatchMachine = () => {
  const model = Object.assign(
    facade(
      // State data creators
      {
        Stopped: (elapsed = 0) => ({ elapsed }),
        Ticking: (elapsed = 0) => ({ elapsed, at: Date.now() }),
        Suspended: (elapsed = 0) => ({ elapsed }),
      },
      // Transitions
      {
        Stopped: { start: "Ticking" },
        Ticking: {
          _tick: "Ticking",
          stop: "Stopped",
          suspend: "Suspended",
          reset: "Stopped"
        },
        Suspended: {
          resume: "Ticking",
          stop: "Stopped",
          reset: "Stopped"
        },
      },
      // Initial state
      "Stopped"
    ),
    {
      elapsed: 0,
    }
  );

  // Update elapsed time on _tick event
  setup(model.machine)(
    // Before transition handler
    (ev) => {
      if (ev.type === "_tick" && ev.from.is("Ticking")) {
        ev.to.data.elapsed = ev.from.data.elapsed + (Date.now() - ev.from.data.at);
      }
      
      // Reset elapsed time on reset
      if (ev.type === "reset") {
        ev.to.data.elapsed = 0;
      }
    },
    // Enter Ticking state: start timer
    enter(
      when(
        (ev) => ev?.to.is("Ticking"),
        () => {
          let requestId: number;
          
          // Function to trigger tick events
          const tick = () => {
            model._tick();
            requestId = requestAnimationFrame(tick);
          };
          
          // Start animation loop
          requestId = requestAnimationFrame(tick);
          
          // Return cleanup function
          return () => {
            cancelAnimationFrame(requestId);
          };
        }
      )
    ),
    // Update model's elapsed property to match state
    effect((ev) => {
      model.elapsed = ev?.to.data.elapsed ?? 0;
    })
  );
  
  return model;
};
