// CommonActions fragment for use in composer footers
export function CommonActions() {
  return (
    <>
      <PlusMenu />
      <TextFormat />
      <Emojis />
      <Mentions />
      <Divider />
      <Video />
      <Audio />
      <Divider />
      <SlashCommands />
    </>
  );
}
// Composer namespace for UI primitives and actions
import React from 'react';
import { useComposerContext } from '../providers/composer-context';

// Core UI primitives
export { Frame } from '../ui/Frame';
export { Header } from '../ui/Header';
export { Input } from '../ui/Input';
export { Footer } from '../ui/Footer';
export { DropZone } from '../ui/DropZone';

function useClickInput(label: string) {
  const [, {machine}] = useComposerContext()
  return () => {
    const state = machine.getState();
    console.log(`${label} clicked, current input:`, state.input);
    machine.actions.updateInput(machine.getState().input + ` ${label}`);
  }
}

// Inline demo primitives for composition
export const PlusMenu: React.FC = () => (
  <button type="button" title="More actions" className="icon-btn" onClick={useClickInput('PlusMenu')}>＋</button>
)

export const TextFormat: React.FC = () => (
  <button type="button" title="Text formatting" className="icon-btn" onClick={useClickInput('[format]')}>A̲</button>
);

export const Emojis: React.FC = () => (
  <button type="button" title="Insert emoji" className="icon-btn" onClick={useClickInput('😊')}>😊</button>
);

export const Mentions: React.FC = () => (
  <button type="button" title="Mention someone" className="icon-btn" onClick={useClickInput('@dude')}>@</button>
);

export const Divider: React.FC = () => (
  <span className="mx-1 text-gray-300">|</span>
);

export const Video: React.FC = () => (
  <button type="button" title="Attach video" className="icon-btn" onClick={useClickInput('[Video]')}>🎥</button>
);

export const Audio: React.FC = () => (
  <button type="button" title="Attach audio" className="icon-btn" onClick={useClickInput('[Audio]')}>🎤</button>
);

export const SlashCommands: React.FC = () => (
  <button type="button" title="Slash commands" className="icon-btn">/</button>
);
