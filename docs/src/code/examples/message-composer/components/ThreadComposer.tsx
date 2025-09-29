import React from 'react';
import * as Composer from './Composer.tsx';
import { ComposerProvider } from '../providers/composer-context';
import { createComposerMachine } from '../machines/composer-machine';

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
        <Composer.DropZone onFileAdd={machine.actions.addAttachment} />
        <Composer.Header>Thread Reply</Composer.Header>
        <Composer.Input value={machine.getState().input} onChange={machine.actions.updateInput} />
        {/* Example: AlsoSendToChannel primitive could be added here if implemented */}
        <Composer.Footer>
          <Composer.CommonActions />
          <button type="button" className="btn btn-primary">Send</button>
        </Composer.Footer>
      </Composer.Frame>
    </ComposerProvider>
  );
}
