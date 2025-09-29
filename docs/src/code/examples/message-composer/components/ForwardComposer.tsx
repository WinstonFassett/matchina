import React from "react";
import { ComposerProvider } from "../composer.context";
import { createComposerMachine } from "../composer.machine";
import { useMachine } from "matchina/react";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { CommonActions } from "./CommonActions";

export interface ForwardComposerProps {
  message: { id: string; content: string };
  onForward: (data: { comment: string; message: { id: string; content: string } }) => void;
  onCancel: () => void;
  className?: string;
}

export const ForwardComposer: React.FC<ForwardComposerProps> = ({
  message,
  onForward,
  onCancel,
  className = "",
}) => {
  const [composerMachine] = React.useState(
    () => createComposerMachine({ input: "" }),
  );
  const state = useMachine(composerMachine);

  const handleForward = () => {
    onForward({ comment: state.input, message });
    composerMachine.actions.clear();
  };

  const handleInput = (val: string) => {
    composerMachine.actions.updateInput(val);
  };

  return (
    <ComposerProvider machine={composerMachine}>
      <Frame className={className}>
        <Header>Forward Message</Header>
        <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
          <div className="font-semibold mb-1">Original Message:</div>
          <div>{message.content}</div>
        </div>
        <Input
          value={state.input}
          onChange={handleInput}
          placeholder="Add a comment..."
        />
        <Footer>
          <CommonActions />
          <button type="button" className="btn btn-primary mr-2" onClick={handleForward}>
            Forward
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </Footer>
      </Frame>
    </ComposerProvider>
  );
};
