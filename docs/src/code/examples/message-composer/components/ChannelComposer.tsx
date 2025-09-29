import { DropZone } from "../ui/DropZone";
import React from "react";
import { globalStore } from "../demo-store.machine";
import { useMachine } from "matchina/react";
import { ComposerProvider } from "../composer.context";
import { createComposerMachine } from "../composer.machine";
import { Frame } from "../ui/Frame";
import { Header } from "../ui/Header";
import { Input } from "../ui/Input";
import { Footer } from "../ui/Footer";
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
  const {input} = useMachine(composerMachine, ({input}) => ({input}));

  const handleSend = () => {
    const input = composerMachine.getState().input;
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
  const messages = React.useMemo(() => {
    return channel
      ? (globalState.currentThreadId
          ? channel.messages.filter((msg: any) => msg.threadId === globalState.currentThreadId)
          : channel.messages.filter((msg: any) => !msg.threadId))
      : [];
  }, [channel, globalState.currentThreadId]);

  return (
    <ComposerProvider machine={composerMachine}>
        <Frame className={className}>
          <Header>Channel: {globalState.currentChannelId}</Header>
          <DropZone onFileAdd={composerMachine.actions.addAttachment}>
            <Input value={input} onChange={composerMachine.actions.updateInput} />
          </DropZone>
          <Footer>
            <CommonActions />
            <div className="flex-1" />
            {input && (
              <button type="button" className="btn btn-secondary mr-2" onClick={handleCancel}>
                Cancel
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleSend}>
              Send
            </button>
          </Footer>
      
        </Frame>
      <div className="mt-4">
        <div className="font-bold mb-2">Messages:</div>
        <Messages messages={messages} />
      </div>
    </ComposerProvider>
  );
}
const Messages = React.memo(MessagesContent);
function MessagesContent({ messages }: { messages: any[] }) {
  if (messages.length === 0) {
    return <div className="text-sm text-gray-600">No messages yet.</div>;
  }
  return (
    <ul className="space-y-2">
      {messages.map((msg) => (
        <li key={msg.id} className="p-2 border rounded bg-sl-black">
          <div>{msg.content}</div>
          {msg.attachments.length > 0 && (
            <div className="text-sm text-gray-600">
              Attachments: {msg.attachments.join(", ")}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

