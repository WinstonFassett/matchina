import React from "react";

export interface DropZoneProps {
  onFileAdd: (fileName: string) => void;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAdd, className = "" }) => {
  const handleClick = () => {
    // Simulate file selection
    const fileName = `file_${Date.now()}.txt`;
    onFileAdd(fileName);
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-gray-400 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="text-sm">
        📎 Click to add files (simulated)
      </div>
    </div>
  );
};