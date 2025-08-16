import { type PieceAttributes } from '../components/Piece';
import { MCTSSearch, createGameStateFromApp, defaultMCTSConfig, MoveSortStrategy, type MCTSConfig, type Move } from './mcts';

// Enhanced AI that can use MCTS for move selection
export class MCTSAIPlayer {
  private mcts: MCTSSearch;
  private config: MCTSConfig;

  constructor(config: Partial<MCTSConfig> = {}) {
    this.config = { ...defaultMCTSConfig, ...config };
    this.mcts = new MCTSSearch(this.config);
  }

  // Get best move using MCTS (returns place, give tuple)
  getBestMove(
    board: (PieceAttributes | null)[][],
    availablePieces: PieceAttributes[],
    stagedPiece: PieceAttributes | null,
    currentPlayer: 1 | 2
  ): Move {
    const gameState = createGameStateFromApp(
      board,
      availablePieces,
      stagedPiece,
      currentPlayer,
      false,
      null
    );

    const bestMove = this.mcts.search(gameState);
    
    if (bestMove.place !== undefined || bestMove.give !== undefined) {
      return bestMove;
    }

    // Fallback logic
    if (stagedPiece) {
      // Regular play: place piece and give next piece
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
        give: randomGive
      };
    } else {
      // First move: no piece to place, just give a piece
      return { 
        place: null,
        give: availablePieces[Math.floor(Math.random() * availablePieces.length)] 
      };
    }
  }

  // Update MCTS configuration
  updateConfig(newConfig: Partial<MCTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.mcts = new MCTSSearch(this.config);
  }

  // Get current configuration
  getConfig(): MCTSConfig {
    return { ...this.config };
  }
}

// Factory functions for different AI difficulty levels
export const createEasyMCTSAI = (): MCTSAIPlayer => {
  return new MCTSAIPlayer({
    maxIterations: 100,
    maxDepth: 5,
    moveSortStrategy: MoveSortStrategy.RANDOM,
    playoutDepth: 10
  });
};

export const createMediumMCTSAI = (): MCTSAIPlayer => {
  return new MCTSAIPlayer({
    maxIterations: 500,
    maxDepth: 10,
    moveSortStrategy: MoveSortStrategy.CENTER_FIRST,
    playoutDepth: 20
  });
};

export const createHardMCTSAI = (): MCTSAIPlayer => {
  return new MCTSAIPlayer({
    maxIterations: 2000,
    maxDepth: 15,
    moveSortStrategy: MoveSortStrategy.DEFENSIVE,
    playoutDepth: 30
  });
};

// Example usage function that shows how to integrate with existing AI
export function enhanceExistingAI(
  board: (PieceAttributes | null)[][],
  availablePieces: PieceAttributes[],
  stagedPiece: PieceAttributes | null,
  currentPlayer: 1 | 2,
  useMCTS: boolean = true
): Move | null {
  
  if (!useMCTS) {
    // Fall back to existing simple AI logic
    return null;
  }

  const mctsAI = createMediumMCTSAI();
  return mctsAI.getBestMove(board, availablePieces, stagedPiece, currentPlayer);
}
