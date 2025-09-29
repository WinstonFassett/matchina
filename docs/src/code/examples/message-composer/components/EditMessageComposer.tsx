import React from "react";
import { ComposerProvider } from "../composer.context";
import { createComposerMachine } from "../composer.machine";
import { useMachine } from "matchina/react";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { CommonActions } from "./CommonActions";

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
    () => createComposerMachine({ input: initialValue }),
    [initialValue]
  );
  const state = useMachine(composerMachine);

  const handleInput = (val: string) => {
    composerMachine.actions.updateInput(val);
  };

  const handleSave = () => {
    onSave(state.input);
    composerMachine.actions.clear();
  };

  return (
    <ComposerProvider machine={composerMachine}>
      <Frame className={className}>
  <Header>Edit Message</Header>
  <Input value={state.input} onChange={handleInput} />
        <Footer>
          <CommonActions />
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </Footer>
      </Frame>
    </ComposerProvider>
  );
};
