import { getAvailableActions, type FactoryMachine } from "matchina";
import { useMachine } from "matchina/react";
import type { createCheckoutMachine } from "./machine";

type Machine = ReturnType<typeof createCheckoutMachine>;

export function ActionButtons({ machine }: { machine: FactoryMachine<any> }) {
  return getAvailableActions(machine.transitions, machine.getState().key).map((action) => (
    <button className="px-3 py-1 rounded bg-blue-500 text-white text-sm" key={action} onClick={() => machine.send(action as any)}>{action}</button>
  ))
}

function ChildPanel({ child }: { child: FactoryMachine<any> }) {
  useMachine(child);
  const childState = child.getState();
  return (
    <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-3 rounded">
      <div className="text-sm mb-2">
        Payment: <span className={childState.match({
          MethodEntry: () => "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
          Authorizing: () => "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          AuthChallenge: () => "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
          Authorized: () => "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          AuthorizationError: () => "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        }, "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200")}>{childState.key}</span>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <ActionButtons machine={child} />
      </div>
    </div>
  );
}

export function CheckoutView({ machine }: { machine: Machine }) {
  useMachine(machine)
  const state: any = machine.getState();
  const key = state.key;
  return (
    <div className="p-4 space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Checkout</h3>
      <div className="text-sm">
        Step: <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-semibold">{key}</span>
      </div>
      {state.match({
        Payment: ({ machine }: any) => <ChildPanel child={machine} />,
      }, false)}
      <div className="flex gap-2 mt-2 flex-wrap">
        <ActionButtons machine={machine} />
      </div>
    </div>
  );
}
