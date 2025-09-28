import React from "react";

export interface FrameProps {
  children: React.ReactNode;
  className?: string;
}

export const Frame: React.FC<FrameProps> = ({ children, className = "" }) => {
  return (
    <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
      {children}
    </div>
  );
};