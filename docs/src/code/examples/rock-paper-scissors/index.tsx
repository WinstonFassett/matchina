import React, { useMemo } from 'react';
import { RPSAppView } from './RPSAppView';
import { createRPSMachine } from './machine';
import { useMachine } from 'matchina/react';
import { MachineExampleWithChart } from '@components/MachineExampleWithChart';

// Main export for importing in MDX documentation
export default function RockPaperScissorsExample() {
  // Create the machine
  const game = useMemo(() => createRPSMachine(), []);
  
  const { machine } = game;
  
  // Use the machine in React
  useMachine(machine);
  
  return <MachineExampleWithChart machine={machine} AppView={RPSAppView} showRawState={true} />;
}

// Named export for backward compatibility
export function RockPaperScissors() {
  // Create the machine
  const game = useMemo(() => createRPSMachine(), []);
  
  // Use the machine in React
  useMachine(game.machine);
  
  return <RPSAppView machine={game} />;
}
