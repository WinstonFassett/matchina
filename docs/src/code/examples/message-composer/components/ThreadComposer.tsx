import React from 'react';
import * as Composer from './Composer.tsx';
import { ComposerProvider } from '../composer.context.tsx';
import { createComposerMachine } from '../composer.machine.ts';
import { CommonActions } from './CommonActions.tsx';

export interface ThreadComposerProps {
  channelId: string;
  className?: string;
}

export function ThreadComposer({ channelId, className }: ThreadComposerProps) {
  const machine = React.useMemo(
    () => createComposerMachine({ input: '' }),
    [channelId]
  );
  return (
    <ComposerProvider machine={machine}>
        <Composer.Frame className={className}>
          <Composer.Header>Thread Reply</Composer.Header>
          <Composer.DropZone onFileAdd={machine.actions.addAttachment}>
            <Composer.Input value={machine.getState().input} onChange={machine.actions.updateInput} />
            {/* Example: AlsoSendToChannel primitive could be added here if implemented */}
          </Composer.DropZone>
          <Composer.Footer>
            <CommonActions />
            <div className="flex-1" />
            <button type="button" className="btn btn-primary">Send</button>
          </Composer.Footer>
        </Composer.Frame>
    </ComposerProvider>
  );
}
