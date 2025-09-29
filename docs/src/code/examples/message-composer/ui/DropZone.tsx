import React from "react";

export interface DropZoneProps {
  onFileAdd: (fileName: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAdd, className = "", children }) => {
  const handleClick = (e: React.MouseEvent) => {
    const fileName = `file_${Date.now()}.txt`;
    console.log(`Simulated file drop: ${fileName}`);
    onFileAdd(fileName);
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-gray-400 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
      <div className="text-sm mt-4">
        📎 Drop Zone (simulated)
      </div>
    </div>
  );
};