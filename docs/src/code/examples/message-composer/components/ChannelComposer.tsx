import React, { useCallback } from "react";
import { globalStore } from "../machines/global-store";
import { useMachine } from "matchina/react";
import { ComposerProvider, useComposerContext } from "../providers/composer-context";
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
    () => createComposerMachine({ input: "", metadata: { channelId } }),
    [channelId]
  );

  return (
    <ComposerProvider machine={composerMachine}>
      <ChannelComposerContent className={className} globalState={globalState} channelId={channelId} />
    </ComposerProvider>
  );
}

function ChannelComposerContent({ className, channelId }: { className?: string; globalState: any; channelId: string }) {
  const [state, { machine }] = useComposerContext();
  const globalState = useMachine(globalStore);
  const handleSend = useCallback(() => {
    const input = state.input;
    console.log("Sending message:", input, "to channel:", channelId);
    if (input.trim()) {
      globalStore.actions.addMessage({
        content: input,
        attachments: [],
        channelId,
      });
      machine.actions.clear();
    }
  }, [state.input, channelId, machine]);

  const handleCancel = useCallback(() => {
    machine.actions.clear();
  }, [machine]);

  // Get messages for this channel from global state
  const channel = globalState.currentChannelId ? globalState.channels[globalState.currentChannelId] : null;
  console.log("Channel messages:", channel?.messages, globalState);
  const messages = channel
    ? (globalState.currentThreadId
        ? channel.messages.filter((msg: any) => msg.threadId === globalState.currentThreadId)
        : channel.messages.filter((msg: any) => !msg.threadId))
    : [];

  return (
    <Frame className={className}>
      <Header>Channel: {globalState.currentChannelId}</Header>
      <DropZone onFileAdd={machine.actions.addAttachment} />
      <Input value={state.input} onChange={machine.actions.updateInput} />
      <Footer>
        <CommonActions />
        {state.input && (
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
        <ul className="space-y-1">
          {messages.length === 0 && (
            <li className="text-gray-400 italic">Welcome to the channel!</li>
          )}
          {messages.map((msg: any) => (
            <li key={msg.id} className="bg-gray-100 rounded px-2 py-1 text-sm">
              {msg.content}
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
