import React, { useState } from "react";
import { useMachine } from "matchina/react";
import { createComposerMachine } from "../composer.machine";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { DropZone } from "../ui/DropZone";

export interface SimpleComposerProps {
  title?: string;
  showDropZone?: boolean;
  showEmojiButton?: boolean;
  showClearButton?: boolean;
  isEditMode?: boolean;
  initialMessage?: string;
  className?: string;
}

export const SimpleComposer: React.FC<SimpleComposerProps> = ({
  title = "New Message",
  showDropZone = true,
  showEmojiButton = true,
  showClearButton = true,
  isEditMode = false,
  initialMessage = "",
  className = "",
}) => {
  const [machine] = useState(() => createComposerMachine({ input: initialMessage }));
  const state = useMachine(machine);

  const handleSubmit = () => {
    console.log("Submitting message:", state);
    machine.actions.submit();
  };

  const handleEmojiClick = () => {
    console.log("Adding emoji to:", state.input);
    machine.actions.updateInput(state.input + " 😊");
  };

  return (
    <Frame className={className}>
      <Header>{title}</Header>

      <Input
        value={state.input}
        onChange={machine.actions.updateInput}
        placeholder="Type your message..."
      />

      {showDropZone && (
        <DropZone onFileAdd={machine.actions.addAttachment} />
      )}

      {state.attachments.length > 0 && (
        <div className="text-sm text-gray-600">
          Attachments: {state.attachments.join(", ")}
        </div>
      )}

      <Footer>
        <div className="flex gap-2 items-center">
          {showEmojiButton && (
            <button
              onClick={handleEmojiClick}
              className="h-10 w-10 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center leading-none"
              style={{ fontSize: '14px' }}
            >
              😊
            </button>
          )}

          {showClearButton && (
            <button
              onClick={() => {
                console.log("Clearing composer");
                machine.actions.clear();
              }}
              className="h-10 px-4 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center leading-none"
              style={{ fontSize: '14px' }}
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!state.input.trim()}
          className="h-10 px-4 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center leading-none"
          style={{ fontSize: '14px' }}
        >
          {isEditMode ? "Save" : "Send"}
        </button>
      </Footer>
    </Frame>
  );
};