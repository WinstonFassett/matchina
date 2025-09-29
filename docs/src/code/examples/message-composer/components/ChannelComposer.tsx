import React from "react";
import { globalStore } from "../machines/global-store";
import { useMachine } from "matchina/react";
import { ComposerProvider } from "../providers/composer-context";
import { createComposerMachine } from "../machines/composer-machine";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
import { DropZone } from "../ui/DropZone";
import { CommonActions } from "./CommonActions";

export interface ChannelComposerProps {
  channelId: string;
  className?: string;
}

export function ChannelComposer({ channelId, className }: ChannelComposerProps) {
  // Reactive global state for messages
  const globalState = useMachine(globalStore);
  // Local composer machine for input
  const composerMachine = React.useMemo(
    () => createComposerMachine({ input: "" }),
    [channelId]
  );
  const composerState = useMachine(composerMachine);

  const handleSend = () => {
    const input = composerState.input;
    if (input.trim()) {
      globalStore.actions.addMessage({
        content: input,
        attachments: [],
        channelId,
      });
      composerMachine.actions.clear();
    }
  };

  const handleCancel = () => {
    composerMachine.actions.clear();
  };

  // Get messages for this channel from global state
  const channel = globalState.currentChannelId ? globalState.channels[globalState.currentChannelId] : null;
  const messages = channel
    ? (globalState.currentThreadId
        ? channel.messages.filter((msg: any) => msg.threadId === globalState.currentThreadId)
        : channel.messages.filter((msg: any) => !msg.threadId))
    : [];

  return (
    <ComposerProvider machine={composerMachine}>
      <Frame className={className}>
        <Header>Channel: {globalState.currentChannelId}</Header>
        <DropZone onFileAdd={composerMachine.actions.addAttachment} />
        <Input value={composerState.input} onChange={composerMachine.actions.updateInput} />
        <Footer>
          <CommonActions />
          {composerState.input && (
            <button type="button" className="btn btn-secondary mr-2" onClick={handleCancel}>
              Cancel
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSend}>
            Send
          </button>
        </Footer>
        <div className="mt-4">
          <div className="font-bold mb-2">Messages:</div>
          <ul className="space-y-1 p-0">
            {messages.length === 0 && (
              <li className="text-gray-400 italic">No messages</li>
            )}
            {messages.map((msg: any) => (
              <li key={msg.id} className="border rounded px-2 py-1 text-sm list-none">
                {msg.content}
              </li>
            ))}
          </ul>
        </div>
      </Frame>
    </ComposerProvider>
  );
}
