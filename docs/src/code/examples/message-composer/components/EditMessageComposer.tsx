import React from "react";
import { ComposerProvider } from "../providers/composer-context";
import { createComposerMachine } from "../machines/composer-machine";
import { useMachine } from "matchina/react";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { DropZone } from "../ui/DropZone";
import { CommonActions } from "./CommonActions";

export interface EditMessageComposerProps {
  messageId: string;
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  showDropZone?: boolean;
  className?: string;
}

export const EditMessageComposer: React.FC<EditMessageComposerProps> = ({
  messageId,
  initialValue,
  onSave,
  onCancel,
  showDropZone = false,
  className = "",
}) => {
  const composerMachine = React.useMemo(
    () => createComposerMachine({ input: initialValue, metadata: { messageId } }),
    [initialValue, messageId]
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
        {showDropZone && <DropZone onFileAdd={composerMachine.actions.addAttachment} />}
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
