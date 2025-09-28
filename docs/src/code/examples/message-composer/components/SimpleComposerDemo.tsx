import React, { useState } from "react";
import { SimpleComposer } from "./SimpleComposer";

export const SimpleComposerDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const demos = [
    {
      name: "Basic",
      component: (
        <SimpleComposer
          title="Send Message"
          showDropZone={false}
          showEmojiButton={false}
          showClearButton={false}
        />
      )
    },
    {
      name: "Full Featured",
      component: (
        <SimpleComposer
          title="New Message"
          showDropZone={true}
          showEmojiButton={true}
          showClearButton={true}
        />
      )
    },
    {
      name: "Edit Mode",
      component: (
        <SimpleComposer
          title="Edit Message"
          showDropZone={false}
          showEmojiButton={true}
          showClearButton={true}
          isEditMode={true}
          initialMessage="This is the original message that needs editing"
        />
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Simple Boolean Props Approach</h3>
        <p className="text-sm text-gray-600 mb-4">
          This shows the traditional approach with boolean props to control features.
          Notice how it becomes unwieldy with many configuration options.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {demos.map((demo, index) => (
            <button
              key={demo.name}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Demo */}
      <div className="py-4">
        {demos[activeTab].component}
      </div>

      {/* Source Code */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          View Source Code
        </summary>
        <div className="mt-2 text-sm text-gray-600">
          <p>Source code will be added with ?raw imports</p>
        </div>
      </details>
    </div>
  );
};