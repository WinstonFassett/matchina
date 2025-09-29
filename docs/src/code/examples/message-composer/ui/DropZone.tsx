import React from "react";

export interface DropZoneProps {
  onFileAdd: (fileName: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAdd, className = "", children }) => {
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger file add if click is on the DropZone itself, not on children
    if (e.target === e.currentTarget) {
      const fileName = `file_${Date.now()}.txt`;
      onFileAdd(fileName);
    }
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-gray-400 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="text-sm mb-2">
        📎 Click to add files (simulated)
      </div>
      {children}
    </div>
  );
};