import React, { useMemo } from 'react';
import { RPSAppView } from './RPSAppView';
import { createRPSMachine } from './machine';
import { useMachine } from 'matchina/react';
import { MachineExampleWithChart } from '@components/MachineExampleWithChart';

export default function RockPaperScissorsExample() {
  // Create the machine
  const game = useMemo(() => createRPSMachine(), []);
  
  const { machine } = game;
  
  // Use the machine in React
  useMachine(machine);
  
  return <MachineExampleWithChart machine={machine} AppView={RPSAppView} showRawState={true} />;
}
