import React from "react";
import { ComposerProvider } from "../composer.context";
import { createComposerMachine } from "../composer.machine";
import { useMachine } from "matchina/react";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { CommonActions } from "./CommonActions";
import { enhanceMethod } from "@lib/src";

export interface EditMessageComposerProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export const EditMessageComposer: React.FC<EditMessageComposerProps> = ({
  initialValue,
  onSave,
  onCancel,
  className = "",
}) => {
  const composerMachine = React.useMemo(
    () => {
      const machine = createComposerMachine({ input: initialValue })
      enhanceMethod(machine.actions, 'submit', (submit => () => {
        const { input } = machine.getState()
        submit();         
        onSave(input);
      }));
      return machine
    },
    [initialValue]
  );
  const state = useMachine(composerMachine);

  return (
    <ComposerProvider machine={composerMachine}>
      <Frame className={className}>
        <Header>Edit Message</Header>
        <Input value={state.input} onChange={composerMachine.actions.updateInput} />
        <Footer>
          <CommonActions />
          <button type="button" className="btn btn-primary" onClick={composerMachine.actions.submit}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </Footer>
      </Frame>
    </ComposerProvider>
  );
};
