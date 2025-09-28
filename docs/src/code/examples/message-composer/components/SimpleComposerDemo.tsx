import React from "react";
import { SimpleComposer } from "./SimpleComposer";

export const SimpleComposerDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Simple Boolean Props Approach</h3>
        <p className="text-sm text-gray-600 mb-4">
          This shows the traditional approach with boolean props to control features.
          Notice how it becomes unwieldy with many configuration options.
        </p>

        <div className="grid gap-4">
          <div>
            <h4 className="font-medium mb-2">Basic Message</h4>
            <SimpleComposer
              title="Send Message"
              showDropZone={false}
              showEmojiButton={false}
              showClearButton={false}
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Full-Featured Message</h4>
            <SimpleComposer
              title="New Message"
              showDropZone={true}
              showEmojiButton={true}
              showClearButton={true}
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Edit Mode</h4>
            <SimpleComposer
              title="Edit Message"
              showDropZone={false}
              showEmojiButton={true}
              showClearButton={true}
              isEditMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};