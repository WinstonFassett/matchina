import React from "react";
import type { createCheckoutMachine } from "./machine";
import { useMachine } from "matchina/react";
import { getAvailableActions, type FactoryMachine } from "matchina";

type Machine = ReturnType<typeof createCheckoutMachine>;

export function ActionButtons({ machine }: { machine: FactoryMachine<any> }) {
  if (machine.getState().data?.machine) return <div>Awaiting submachine</div>
  return getAvailableActions(machine.transitions, machine.getState().key).map((action) => (
    <button key={action} onClick={() => machine.send(action as any)} className="btn">{action}</button>
  ))
}

export function CheckoutView({ machine }: { machine: Machine }) {
  useMachine(machine)
  useMachine(machine.payment)
  const state = machine.getState();
  const key = state.key;
  const paymentKey = key === "Payment" ? machine.payment.getState().key : undefined;
  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">Checkout</h3>
      <div>Step: <b>{key}</b></div>
      {key === "Payment" && (
        <div className="pl-3 border-l">
          <div>Payment: <b>{paymentKey}</b></div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <ActionButtons machine={machine.payment} />
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-2 flex-wrap">
        <ActionButtons machine={machine} />
      </div>
    </div>
  );
}
