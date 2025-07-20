// @errors: 2307 2339 2345
import { createMachine, defineStates, zen } from "matchina";

// Define the possible moves
export type Move = "rock" | "paper" | "scissors";

// Define our game states
export const gameStates = defineStates({
  // Waiting for player to choose
  WaitingForPlayer: (playerScore: number = 0, computerScore: number = 0) => ({
    playerScore,
    computerScore,
  }),

  // Player has chosen, now computer chooses
  PlayerChose: (
    playerMove: Move,
    playerScore: number,
    computerScore: number,
  ) => ({
    playerMove,
    playerScore,
    computerScore,
  }),

  // Round complete, showing results
  RoundComplete: (
    playerMove: Move,
    computerMove: Move,
    roundWinner: "player" | "computer" | "tie",
    playerScore: number,
    computerScore: number,
  ) => ({
    playerMove,
    computerMove,
    roundWinner,
    playerScore,
    computerScore,
  }),

  // Game over (someone reached win threshold)
  GameOver: (
    winner: "player" | "computer",
    playerScore: number,
    computerScore: number,
  ) => ({
    winner,
    playerScore,
    computerScore,
  }),
});

// Helper to determine winner of a round
export function determineWinner(
  playerMove: Move,
  computerMove: Move,
): "player" | "computer" | "tie" {
  if (playerMove === computerMove) return "tie";

  if (
    (playerMove === "rock" && computerMove === "scissors") ||
    (playerMove === "paper" && computerMove === "rock") ||
    (playerMove === "scissors" && computerMove === "paper")
  ) {
    return "player";
  }

  return "computer";
}

// Create the game machine
export function createRPSMachine() {
  const machine = createMachine(
    gameStates,
    {
      WaitingForPlayer: {
        selectMove: "PlayerChose",
      },
      PlayerChose: {
        computerSelectMove: "RoundComplete",
      },
      RoundComplete: {
        nextRound: "WaitingForPlayer",
      },
      GameOver: {
        newGame: "WaitingForPlayer",
      },
    },
    gameStates.WaitingForPlayer(0, 0),
  );

  // Extend with game-specific logic
  const game = Object.assign(zen(machine), {
    selectMove: (move: Move) => {
      // Player selects a move
      const { playerScore, computerScore } = game.getState().data;
      game.selectMove(move, playerScore, computerScore);
    },

    computerSelectMove: () => {
      // Get current state data
      const { playerMove, playerScore, computerScore } = game.getState()
        .data as any;

      // Generate computer's random move
      const moves: Move[] = ["rock", "paper", "scissors"];
      const computerMove = moves[Math.floor(Math.random() * moves.length)];

      // Determine winner of the round
      const roundWinner = determineWinner(playerMove, computerMove);

      // Update scores
      let newPlayerScore = playerScore;
      let newComputerScore = computerScore;

      if (roundWinner === "player") {
        newPlayerScore += 1;
      } else if (roundWinner === "computer") {
        newComputerScore += 1;
      }

      // Check if game is over (first to 3 wins)
      if (newPlayerScore >= 3) {
        game.computerSelectMove(
          playerMove,
          computerMove,
          "player",
          newPlayerScore,
          newComputerScore,
        );
        return;
      }

      if (newComputerScore >= 3) {
        game.computerSelectMove(
          playerMove,
          computerMove,
          "computer",
          newPlayerScore,
          newComputerScore,
        );
        return;
      }

      // Game continues, show round result
      game.computerSelectMove(
        playerMove,
        computerMove,
        roundWinner,
        newPlayerScore,
        newComputerScore,
      );
    },

    nextRound: () => {
      const { playerScore, computerScore } = game.getState().data;
      game.nextRound(playerScore, computerScore);
    },

    newGame: () => {
      game.newGame();
    },
  });

  return game;
}
