import React from "react";
import { ThreadComposer } from "./ThreadComposer";

export const ThreadComposerDemo: React.FC = () => {
  // For demo, use a static channelId
  return <ThreadComposer channelId="general" />;
};
