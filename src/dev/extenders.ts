
export {}

// Define your base StateMachine type
type StateMachine = {
  state: string;
  transition: (action: string) => void;
};

// Define extender functions
type Extender<T> = (target: T) => any;

const withSubscribe = <M extends StateMachine>(machine: M) => ({
  ...machine,
  subscribe: (callback: () => void) => {
    // Implement subscribe logic here
  },
});

const withZen = <T>(machine: T) => ({
  ...machine,
  zen: () => {
    // Implement zen logic here
  },
});


function composeFromExtensions<T>(target: T, ...extenders: Extender<T>[]) {
  return extenders.reduce((acc, extender) => extender(acc), target);
}

// Usage example
const baseMachine: StateMachine = {
  state: 'Idle',
  transition: (action: string) => {
    // Implement transition logic here
  },
};

const extendedMachine = 
  withZen(withSubscribe(baseMachine));
const subscribableMachine = withSubscribe(baseMachine);


const composedMachine = composeMachine(baseMachine, withSubscribe, withZen);

// You can now access properties and methods from the extended machine
composedMachine.state; // Access state property
composedMachine.transition('someAction'); // Call transition method
composedMachine.subscribe(() => {}); // Call subscribe method
composedMachine.zen(); // Call zen method
