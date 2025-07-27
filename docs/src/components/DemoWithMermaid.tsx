import { useState } from "react";
import { MachineExampleWithChart } from "./MachineExampleWithChart";

interface DemoWithMermaidProps {
  createMachine?: () => any;
  example?: React.ComponentType<any>;
  AppView?: React.ComponentType<{ machine: any }>;
  title?: string;
  description?: string;
  showCode?: boolean;
  showRawState?: boolean;
  mermaidDiagram?: string;
}

/**
 * A component for MDX files to easily embed a machine example with Mermaid diagram
 * This creates the machine instance internally, so it can be used directly in MDX
 * without needing to manage the machine state in the MDX file.
 */
export function DemoWithMermaid({
  createMachine,
  example: Example,
  AppView,
  title,
  description,
  showCode = false,
  showRawState = false,
  mermaidDiagram,
}: DemoWithMermaidProps) {
  // If we have a createMachine function, create the machine instance
  const [machine] = useState(() => createMachine && createMachine());

  return (
    <div className="demo-with-mermaid mb-8">
      {title && <h3 className="text-xl font-medium mb-2">{title}</h3>}
      {description && <p className="text-gray-700 mb-4">{description}</p>}

      {/* If we have a pre-built example component, use that */}
      {Example && <Example />}

      {/* If we have a machine instance and AppView, use MachineExampleWithChart */}
      {machine && (
        <MachineExampleWithChart
          machine={machine}
          AppView={AppView}
          showRawState={showRawState}
        />
      )}

      {/* If we have a mermaid diagram, render it separately */}
      {mermaidDiagram && !Example && (
        <div className="mermaid-diagram mt-4">
          {/* The mermaid diagram would be rendered here */}
        </div>
      )}

      {showCode && (
        <div className="mt-4">
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement "Open in Stackblitz" functionality
              alert("Open in Stackblitz feature coming soon!");
            }}
          >
            Open in Stackblitz
          </a>
        </div>
      )}
    </div>
  );
}
