import React, { useState } from "react";
import { useMachine } from "matchina/react";
import { createComposerMachine } from "../machines/composer-machine";
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
  className?: string;
}

export const SimpleComposer: React.FC<SimpleComposerProps> = ({
  title = "New Message",
  showDropZone = true,
  showEmojiButton = true,
  showClearButton = true,
  isEditMode = false,
  className = "",
}) => {
  const [machine] = useState(() => createComposerMachine());
  const state = useMachine(machine);

  const handleSubmit = () => {
    machine.api.submit();
  };

  const handleEmojiClick = () => {
    machine.api.updateInput(state.input + " 😊");
  };

  return (
    <Frame className={className}>
      <Header>{title}</Header>

      <Input
        value={state.input}
        onChange={machine.api.updateInput}
        placeholder="Type your message..."
      />

      {showDropZone && (
        <DropZone onFileAdd={machine.api.addAttachment} />
      )}

      {state.attachments.length > 0 && (
        <div className="text-sm text-gray-600">
          Attachments: {state.attachments.join(", ")}
        </div>
      )}

      <Footer>
        <div className="flex gap-2">
          {showEmojiButton && (
            <button
              onClick={handleEmojiClick}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              😊
            </button>
          )}

          {showClearButton && (
            <button
              onClick={machine.api.clear}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!state.input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isEditMode ? "Save" : "Send"}
        </button>
      </Footer>
    </Frame>
  );
};