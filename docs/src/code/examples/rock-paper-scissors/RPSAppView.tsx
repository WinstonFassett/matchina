import React from 'react';
import type { Move } from './machine';
import { createRPSMachine } from './machine';

// Helper for move icons
const getIcon = (move: Move | undefined) => {
  switch (move) {
    case 'rock': return '✊';
    case 'paper': return '✋';
    case 'scissors': return '✌️';
    default: return '❓';
  }
};

interface RPSAppViewProps {
  machine: ReturnType<typeof createRPSMachine>;
}

export function RPSAppView({ machine }: RPSAppViewProps) {
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold text-center mb-3">Rock Paper Scissors</h2>
      
      {/* Score display */}
      <div className="flex justify-between text-lg font-medium mb-6 px-4">
        <div>Player: {machine.state.data.playerScore}</div>
        <div>Computer: {machine.state.data.computerScore}</div>
      </div>
      
      {/* Game content based on state */}
      {machine.state.match({
        WaitingForPlayer: () => (
          <div className="text-center">
            <h3 className="text-lg mb-3">Choose your move:</h3>
            <div className="flex justify-center gap-4">
              <button 
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl" 
                onClick={() => machine.selectMove('rock')}
              >
                ✊
              </button>
              <button 
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl" 
                onClick={() => machine.selectMove('paper')}
              >
                ✋
              </button>
              <button 
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl" 
                onClick={() => machine.selectMove('scissors')}
              >
                ✌️
              </button>
            </div>
          </div>
        ),
        
        PlayerChose: (data: any) => (
          <div className="text-center">
            <h3 className="text-lg mb-3">You chose {getIcon(data.playerMove)}</h3>
            <p className="mb-4">Computer is choosing...</p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
              onClick={() => machine.computerSelectMove()}
            >
              Continue
            </button>
          </div>
        ),
        
        RoundComplete: (data: any) => (
          <div className="text-center">
            <h3 className="text-lg mb-3">Round Result:</h3>
            <div className="flex justify-around mb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{getIcon(data.playerMove)}</div>
                <div>You</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">vs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">{getIcon(data.computerMove)}</div>
                <div>Computer</div>
              </div>
            </div>
            <p className={`text-lg font-bold mb-4 ${
              data.roundWinner === 'player' ? 'text-green-500' : 
              data.roundWinner === 'computer' ? 'text-red-500' : 
              'text-yellow-500'
            }`}>
              {data.roundWinner === "tie" 
                ? "It's a tie!" 
                : `${data.roundWinner === "player" ? "You" : "Computer"} won this round!`}
            </p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
              onClick={() => machine.nextRound()}
            >
              Next Round
            </button>
          </div>
        ),
        
        GameOver: (data: any) => (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-3">Game Over!</h3>
            <p className={`text-lg font-bold mb-4 ${
              data.winner === 'player' ? 'text-green-500' : 'text-red-500'
            }`}>
              {data.winner === "player" ? "You" : "Computer"} won the game!
            </p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
              onClick={() => machine.newGame()}
            >
              Play Again
            </button>
          </div>
        )
      })}
    </div>
  );
}

