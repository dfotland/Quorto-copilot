import { type PieceAttributes } from '../components/Piece';
import { checkWinCondition, isBoardFull, arePiecesEqual } from '../utils/gameUtils';

// Game state representation
export interface GameState {
  board: (PieceAttributes | null)[][];
  availablePieces: PieceAttributes[];
  stagedPiece: PieceAttributes | null;
  currentPlayer: 1 | 2;
  gameOver: boolean;
  winner: 1 | 2 | null;
}

// Move representation: complete move tuple (place position, give piece)
export interface Move {
  place: [number, number] | null; // Position to place staged piece (null for first move)
  give: PieceAttributes | null;   // Piece to give to opponent (null for final move)
}

// MCTS Node
class MCTSNode {
  state: GameState;
  move: Move | null;
  parent: MCTSNode | null;
  children: MCTSNode[];
  visits: number;
  wins: number;
  untriedMoves: Move[];

  constructor(state: GameState, move: Move | null = null, parent: MCTSNode | null = null) {
    this.state = state;
    this.move = move;
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = this.getLegalMoves(state);
  }

  // Get all legal moves from current state
  private getLegalMoves(state: GameState): Move[] {
    const moves: Move[] = [];

    if (state.gameOver) {
      return moves;
    }

    if (state.stagedPiece) {
      // Regular play: place the staged piece and give next piece
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (!state.board[row][col]) {
            // For each empty position, generate moves with each available piece to give
            if (state.availablePieces.length > 0) {
              for (const piece of state.availablePieces) {
                moves.push({ place: [row, col], give: piece });
              }
            } else {
              // Final move of game - no piece to give
              moves.push({ place: [row, col], give: null });
            }
          }
        }
      }
    } else {
      // First move: no piece to place, just choose piece to give
      for (const piece of state.availablePieces) {
        moves.push({ place: null, give: piece });
      }
    }

    return moves;
  }

  // Check if node is fully expanded
  isFullyExpanded(): boolean {
    return this.untriedMoves.length === 0;
  }

  // Check if node is terminal
  isTerminal(): boolean {
    return this.state.gameOver;
  }

  // UCB1 formula for node selection
  ucb1(explorationConstant: number = Math.sqrt(2)): number {
    if (this.visits === 0) {
      return Infinity;
    }
    
    const exploitation = this.wins / this.visits;
    const exploration = explorationConstant * Math.sqrt(Math.log(this.parent!.visits) / this.visits);
    
    return exploitation + exploration;
  }

  // Select best child using UCB1
  selectBestChild(explorationConstant: number = Math.sqrt(2)): MCTSNode {
    return this.children.reduce((best, child) => 
      child.ucb1(explorationConstant) > best.ucb1(explorationConstant) ? child : best
    );
  }

  // Expand node by adding a new child
  expand(): MCTSNode {
    if (this.untriedMoves.length === 0) {
      throw new Error("Cannot expand fully expanded node");
    }

    const move = this.untriedMoves.pop()!;
    const newState = this.applyMove(this.state, move);
    const childNode = new MCTSNode(newState, move, this);
    this.children.push(childNode);
    
    return childNode;
  }

  // Apply a move to a game state and return new state
  private applyMove(state: GameState, move: Move): GameState {
    const newState: GameState = {
      board: state.board.map(row => [...row]),
      availablePieces: [...state.availablePieces],
      stagedPiece: state.stagedPiece,
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
      winner: state.winner
    };

    if (move.place && state.stagedPiece) {
      // Regular play: place the staged piece
      const [row, col] = move.place;
      newState.board[row][col] = state.stagedPiece;
      newState.stagedPiece = null;
      
      // Check for win condition after placing
      if (checkWinCondition(newState.board)) {
        newState.gameOver = true;
        newState.winner = state.currentPlayer;
        return newState; // Game ends, no piece giving needed
      } else if (isBoardFull(newState.board)) {
        newState.gameOver = true;
        newState.winner = null; // Tie
        return newState; // Game ends, no piece giving needed
      }
      
      // If game continues, give the piece and switch players
      if (move.give) {
        newState.stagedPiece = move.give;
        newState.availablePieces = newState.availablePieces.filter(
          piece => !arePiecesEqual(piece, move.give!)
        );
        newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
      }
    } else if (move.place === null && !state.stagedPiece && move.give) {
      // First move: no piece to place, just give a piece to start
      newState.stagedPiece = move.give;
      newState.availablePieces = newState.availablePieces.filter(
        piece => !arePiecesEqual(piece, move.give!)
      );
      newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    }

    return newState;
  }

  // Backpropagate result up the tree
  backpropagate(result: number): void {
    this.visits++;
    this.wins += result;
    
    if (this.parent) {
      this.parent.backpropagate(result);
    }
  }
}

// Move sorting strategies
export const MoveSortStrategy = {
  RANDOM: 'random',
  CENTER_FIRST: 'center_first',
  CORNERS_FIRST: 'corners_first',
  DEFENSIVE: 'defensive'
} as const;

export type MoveSortStrategy = typeof MoveSortStrategy[keyof typeof MoveSortStrategy];

// MCTS Configuration
export interface MCTSConfig {
  maxIterations: number;
  maxDepth: number;
  explorationConstant: number;
  moveSortStrategy: MoveSortStrategy;
  playoutDepth: number; // Max depth for random playouts
}

// Default MCTS configuration
export const defaultMCTSConfig: MCTSConfig = {
  maxIterations: 1000,
  maxDepth: 20,
  explorationConstant: Math.sqrt(2),
  moveSortStrategy: MoveSortStrategy.CENTER_FIRST,
  playoutDepth: 50
};

// MCTS Search Engine
export class MCTSSearch {
  private config: MCTSConfig;

  constructor(config: MCTSConfig = defaultMCTSConfig) {
    this.config = config;
  }

  // Main MCTS search function
  search(initialState: GameState): Move {
    const root = new MCTSNode(initialState);
    
    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      // Selection
      let node = this.select(root);
      
      // Expansion (if not terminal and within depth limit)
      if (!node.isTerminal() && node.visits > 0 && this.getDepth(node) < this.config.maxDepth) {
        if (!node.isFullyExpanded()) {
          node = node.expand();
        }
      }
      
      // Simulation (playout)
      const result = this.simulate(node.state);
      
      // Backpropagation
      node.backpropagate(result);
    }

    // Return best move based on visit count
    const bestChild = root.children.reduce((best, child) => 
      child.visits > best.visits ? child : best
    );
    
    return bestChild.move!;
  }

  // Selection phase: traverse tree using UCB1
  private select(node: MCTSNode): MCTSNode {
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = node.selectBestChild(this.config.explorationConstant);
    }
    return node;
  }

  // Simulation phase: random playout to end of game
  private simulate(state: GameState): number {
    let currentState = this.cloneState(state);
    let depth = 0;
    
    while (!currentState.gameOver && depth < this.config.playoutDepth) {
      const moves = this.getLegalMoves(currentState);
      if (moves.length === 0) break;
      
      const sortedMoves = this.sortMoves(moves, currentState);
      const randomMove = sortedMoves[Math.floor(Math.random() * Math.min(3, sortedMoves.length))]; // Slightly biased toward better moves
      
      currentState = this.applyMoveToState(currentState, randomMove);
      depth++;
    }
    
    // Return result from perspective of original player
    if (currentState.winner === state.currentPlayer) {
      return 1.0; // Win
    } else if (currentState.winner === null) {
      return 0.5; // Tie
    } else {
      return 0.0; // Loss
    }
  }

  // Sort moves according to strategy
  private sortMoves(moves: Move[], state: GameState): Move[] {
    const sorted = [...moves];
    
    switch (this.config.moveSortStrategy) {
      case MoveSortStrategy.CENTER_FIRST:
        return this.sortMovesCenterFirst(sorted);
      
      case MoveSortStrategy.CORNERS_FIRST:
        return this.sortMovesCornerFirst(sorted);
      
      case MoveSortStrategy.DEFENSIVE:
        return this.sortMovesDefensive(sorted, state);
      
      case MoveSortStrategy.RANDOM:
      default:
        return this.shuffleArray(sorted);
    }
  }

  // Sort placing moves with center positions first
  private sortMovesCenterFirst(moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      // First sort by place position (if both have places)
      if (a.place && b.place) {
        const centerDistance = (pos: [number, number]) => {
          const [row, col] = pos;
          return Math.abs(row - 1.5) + Math.abs(col - 1.5);
        };
        
        const placeDiff = centerDistance(a.place) - centerDistance(b.place);
        if (placeDiff !== 0) return placeDiff;
      }
      
      // If places are equal or one doesn't have place, sort by piece safety
      if (a.give && b.give) {
        return 0; // Keep original order for pieces for now
      }
      
      return 0;
    });
  }

  // Sort placing moves with corner positions first
  private sortMovesCornerFirst(moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      // First sort by place position (if both have places)
      if (a.place && b.place) {
        const isCorner = (pos: [number, number]) => {
          const [row, col] = pos;
          return (row === 0 || row === 3) && (col === 0 || col === 3);
        };
        
        const aIsCorner = isCorner(a.place);
        const bIsCorner = isCorner(b.place);
        
        if (aIsCorner && !bIsCorner) return -1;
        if (!aIsCorner && bIsCorner) return 1;
      }
      
      return 0;
    });
  }

  // Sort moves defensively (prefer safe places and safe pieces to give)
  private sortMovesDefensive(moves: Move[], state: GameState): Move[] {
    return moves.sort((a, b) => {
      // Sort by piece safety when giving pieces
      if (a.give && b.give) {
        const aDangerous = this.isPieceDangerous(a.give, state);
        const bDangerous = this.isPieceDangerous(b.give, state);
        
        if (aDangerous && !bDangerous) return 1;
        if (!aDangerous && bDangerous) return -1;
      }
      
      // Could add place-based defensive logic here too
      return 0;
    });
  }

  // Check if giving a piece would allow opponent to win
  private isPieceDangerous(piece: PieceAttributes, state: GameState): boolean {
    // Try placing piece on each empty position
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!state.board[row][col]) {
          const testBoard = state.board.map(r => [...r]);
          testBoard[row][col] = piece;
          
          if (checkWinCondition(testBoard)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Utility functions
  private getLegalMoves(state: GameState): Move[] {
    const moves: Move[] = [];

    if (state.gameOver) return moves;

    if (state.stagedPiece) {
      // Regular play: place the staged piece and give next piece
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (!state.board[row][col]) {
            // For each empty position, generate moves with each available piece to give
            if (state.availablePieces.length > 0) {
              for (const piece of state.availablePieces) {
                moves.push({ place: [row, col], give: piece });
              }
            } else {
              // Final move of game - no piece to give
              moves.push({ place: [row, col], give: null });
            }
          }
        }
      }
    } else {
      // First move: no piece to place, just choose piece to give
      for (const piece of state.availablePieces) {
        moves.push({ place: null, give: piece });
      }
    }

    return moves;
  }

  private cloneState(state: GameState): GameState {
    return {
      board: state.board.map(row => [...row]),
      availablePieces: [...state.availablePieces],
      stagedPiece: state.stagedPiece,
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
      winner: state.winner
    };
  }

  private applyMoveToState(state: GameState, move: Move): GameState {
    const newState = this.cloneState(state);

    if (move.place && state.stagedPiece) {
      // Regular play: place the staged piece
      const [row, col] = move.place;
      newState.board[row][col] = state.stagedPiece;
      newState.stagedPiece = null;
      
      // Check for win condition after placing
      if (checkWinCondition(newState.board)) {
        newState.gameOver = true;
        newState.winner = state.currentPlayer;
        return newState; // Game ends, no piece giving needed
      } else if (isBoardFull(newState.board)) {
        newState.gameOver = true;
        newState.winner = null;
        return newState; // Game ends, no piece giving needed
      }
      
      // If game continues, give the piece and switch players
      if (move.give) {
        newState.stagedPiece = move.give;
        newState.availablePieces = newState.availablePieces.filter(
          piece => !arePiecesEqual(piece, move.give!)
        );
        newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
      }
    } else if (move.place === null && !state.stagedPiece && move.give) {
      // First move: no piece to place, just give a piece to start
      newState.stagedPiece = move.give;
      newState.availablePieces = newState.availablePieces.filter(
        piece => !arePiecesEqual(piece, move.give!)
      );
      newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    }

    return newState;
  }

  private getDepth(node: MCTSNode): number {
    let depth = 0;
    let current = node;
    while (current.parent) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Public method to get search statistics
  getSearchStats(root: MCTSNode): {
    totalVisits: number;
    maxDepth: number;
    avgBranchingFactor: number;
  } {
    const stats = {
      totalVisits: root.visits,
      maxDepth: 0,
      avgBranchingFactor: 0
    };

    const calculateStats = (node: MCTSNode, depth: number) => {
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      
      if (node.children.length > 0) {
        stats.avgBranchingFactor += node.children.length;
        node.children.forEach(child => calculateStats(child, depth + 1));
      }
    };

    calculateStats(root, 0);
    
    return stats;
  }
}

// Helper function to create game state from current app state
export function createGameStateFromApp(
  board: (PieceAttributes | null)[][],
  availablePieces: PieceAttributes[],
  stagedPiece: PieceAttributes | null,
  currentPlayer: 1 | 2,
  gameOver: boolean,
  winner: 1 | 2 | null
): GameState {
  return {
    board,
    availablePieces,
    stagedPiece,
    currentPlayer,
    gameOver,
    winner
  };
}
