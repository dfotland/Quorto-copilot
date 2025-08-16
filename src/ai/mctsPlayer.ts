import { type PieceAttributes } from '../components/Piece';
import { MCTSSearch, createGameStateFromApp, defaultMCTSConfig, type MCTSConfig, type Move } from './mcts';

// Enhanced AI that can use MCTS for move selection
export class MCTSAIPlayer {
  // Get best move using MCTS with configurable parameters
  getBestMove(
    board: (PieceAttributes | null)[][],
    availablePieces: PieceAttributes[],
    stagedPiece: PieceAttributes | null,
    currentPlayer: 1 | 2,
    config: Partial<MCTSConfig> = {}
  ): Move {
    // For the first move (no staged piece), just return a random piece
    if (!stagedPiece) {
      return { 
        place: null,
        give: availablePieces[Math.floor(Math.random() * availablePieces.length)],
        value: 0
      };
    }

    // Merge provided config with defaults
    const mctsConfig = { ...defaultMCTSConfig, ...config };
    const mcts = new MCTSSearch(mctsConfig);
    
    const gameState = createGameStateFromApp(
      board,
      availablePieces,
      stagedPiece,
      currentPlayer,
      false,
      null
    );

    const bestMove = mcts.search(gameState);
    
    if (bestMove.place !== undefined || bestMove.give !== undefined) {
      return bestMove;
    }

    // Fallback logic for regular play (placing piece and giving next piece)
    const emptyPositions: [number, number][] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!board[row][col]) {
          emptyPositions.push([row, col]);
        }
      }
    }
    const randomPlace = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const randomGive = availablePieces.length > 0 
      ? availablePieces[Math.floor(Math.random() * availablePieces.length)]
      : null;
    return { 
      place: randomPlace,
      give: randomGive,
      value: 0
    };
  }
}

// Example usage function that shows how to integrate with existing AI
export function enhanceExistingAI(
  board: (PieceAttributes | null)[][],
  availablePieces: PieceAttributes[],
  stagedPiece: PieceAttributes | null,
  currentPlayer: 1 | 2,
  config: Partial<MCTSConfig> = {},
  useMCTS: boolean = true
): Move | null {
  
  if (!useMCTS) {
    // Fall back to existing simple AI logic
    return null;
  }

  const mctsAI = new MCTSAIPlayer();
  return mctsAI.getBestMove(board, availablePieces, stagedPiece, currentPlayer, config);
}
