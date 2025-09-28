import React, { useCallback } from "react";
import { ComposerProvider, useComposerContext } from "../providers/composer-context";
import { createComposerMachine } from "../machines/composer-machine";
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
  const machine = React.useMemo(() => createComposerMachine({ input: initialValue, metadata: { messageId } }), [initialValue, messageId]);
  return (
    <ComposerProvider machine={machine}>
      <EditMessageComposerInner
        onSave={onSave}
        onCancel={onCancel}
        showDropZone={showDropZone}
        className={className}
      />
    </ComposerProvider>
  );
};

const EditMessageComposerInner: React.FC<Omit<EditMessageComposerProps, "messageId" | "initialValue">> = ({
  onSave,
  onCancel,
  showDropZone,
  className,
}) => {
  const [state, { machine }] = useComposerContext();

  const handleInputChange = useCallback((value: string) => {
    machine.actions.updateInput(value);
  }, [machine]);

  const handleSave = useCallback(() => {
    onSave(state.input);
  }, [onSave, state.input]);

  return (
    <Frame className={className}>
      <Header>Edit Message</Header>
      {showDropZone && <DropZone onFileAdd={(fileName: string) => machine.actions.addAttachment(fileName)} />}
      <Input value={state.input} onChange={handleInputChange} />
      <Footer>
        <CommonActions />
        <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </Footer>
    </Frame>
  );
};
