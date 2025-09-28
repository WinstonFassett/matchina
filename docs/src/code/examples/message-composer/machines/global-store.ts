/**
 * Mock global store to simulate synced state across multiple "clients"
 * This simulates what would be a real-time sync system in production
 */

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
  channels: Map<string, Channel>;
  currentChannelId: string | null;
  currentThreadId: string | null;
};

export type GlobalStoreListener = (state: GlobalStoreState) => void;

class MockGlobalStore {
  private state: GlobalStoreState = {
    channels: new Map(),
    currentChannelId: null,
    currentThreadId: null,
  };

  private listeners = new Set<GlobalStoreListener>();

  constructor() {
    // Initialize with some mock data
    this.state.channels.set("general", {
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
    });

    this.state.channels.set("random", {
      id: "random",
      name: "Random",
      messages: [],
    });

    this.state.currentChannelId = "general";
  }

  getState(): GlobalStoreState {
    return this.state;
  }

  subscribe(listener: GlobalStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Actions
  setCurrentChannel(channelId: string) {
    this.state.currentChannelId = channelId;
    this.state.currentThreadId = null; // Clear thread when changing channels
    this.notify();
  }

  setCurrentThread(threadId: string | null) {
    this.state.currentThreadId = threadId;
    this.notify();
  }

  addMessage(message: Omit<Message, "id" | "timestamp">) {
    const channel = this.state.channels.get(message.channelId);
    if (!channel) return;

    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    channel.messages.push(newMessage);
    this.notify();
  }

  getCurrentChannel(): Channel | null {
    if (!this.state.currentChannelId) return null;
    return this.state.channels.get(this.state.currentChannelId) || null;
  }

  getCurrentMessages(): Message[] {
    const channel = this.getCurrentChannel();
    if (!channel) return [];

    if (this.state.currentThreadId) {
      // Return messages in the thread
      return channel.messages.filter(msg => msg.threadId === this.state.currentThreadId);
    }

    // Return top-level channel messages
    return channel.messages.filter(msg => !msg.threadId);
  }
}

// Singleton instance for the demo
export const globalStore = new MockGlobalStore();