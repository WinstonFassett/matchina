import React from "react";
import { RTGViewer, AnimModeProvider, type ViewerProps } from "./viewers";

/**
 * MiniViewer
 * A tiny wrapper that sets a fixed animation mode via AnimModeProvider so callers
 * don't need to wrap their tree. Keeps parallel enter/exit behavior from RTGViewer.
 */
export const MiniViewer: React.FC<ViewerProps> = (props) => {
  return (
    <AnimModeProvider value={{ forward: "slideshow", back: "slideshow" }}>
      <RTGViewer {...props} />
    </AnimModeProvider>
  );
};

export default MiniViewer;
