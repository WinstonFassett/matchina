import React from "react";

export interface FrameProps {
  children: React.ReactNode;
  className?: string;
}

export const Frame: React.FC<FrameProps> = ({ children, className = "" }) => {
  return (
    <div className={`rounded-lg space-y-3 ${className}`}>
      {children}
    </div>
  );
};