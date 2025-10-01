import { createStoreMachine, storeApi } from "matchina";

export type Message = {
  id: string;
  content: string;
  attachments: string[];
  timestamp: Date;
  channelId: string;
  threadId?: string;
};

export type Channel = {
  id: string;
  name: string;
  messages: Message[];
};

export type GlobalStoreState = {
  channels: Record<string, Channel>;
  currentChannelId: string | null;
  currentThreadId: string | null;
};

const initialState: GlobalStoreState = {
  channels: {
    general: {
      id: "general",
      name: "General",
      messages: [
        {
          id: "1",
          content: "Welcome to the channel!",
          attachments: [],
          timestamp: new Date(Date.now() - 60000),
          channelId: "general",
        },
      ],
    },
    random: {
      id: "random",
      name: "Random",
      messages: [],
    },
  },
  currentChannelId: "general",
  currentThreadId: null,
};

const globalStoreBase = createStoreMachine(initialState, {
  setCurrentChannel: (channelId: string) => (change) => ({
    ...change.from,
    currentChannelId: channelId,
    currentThreadId: null,
  }),
  setCurrentThread: (threadId: string | null) => (change) => ({
    ...change.from,
    currentThreadId: threadId,
  }),
  addMessage: (message: Omit<Message, "id" | "timestamp">) => (change) => {
    console.log("Adding message to global store:", message);
    const channel = change.from.channels[message.channelId];
    console.log("Channel found:", channel);
    if (!channel) return change.from;
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    return {
      ...change.from,
      channels: {
        ...change.from.channels,
        [message.channelId]: {
          ...channel,
          messages: [...channel.messages, newMessage],
        },
      },
    };
  },
});
export const globalStore = {
  ...globalStoreBase,
  actions: storeApi(globalStoreBase),
};

(globalThis as any).globalStore = globalStore;

export function getCurrentChannel(state: GlobalStoreState): Channel | null {
  if (!state.currentChannelId) return null;
  return state.channels[state.currentChannelId] || null;
}

export function getCurrentMessages(state: GlobalStoreState): Message[] {
  const channel = getCurrentChannel(state);
  if (!channel) return [];
  if (state.currentThreadId) {
    return channel.messages.filter(msg => msg.threadId === state.currentThreadId);
  }
  return channel.messages.filter(msg => !msg.threadId);
}