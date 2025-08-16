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
  value: number;                  // Evaluation score for this move (higher is better)
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
  depth: number;

  constructor(state: GameState, move: Move | null = null, parent: MCTSNode | null = null) {
    this.state = state;
    this.move = move;
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = this.getLegalMoves(state);
    this.depth = parent ? parent.depth + 1 : 0;
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
                const move = { place: [row, col] as [number, number], give: piece, value: 0 };
                move.value = this.evaluateMove(state, move);
                moves.push(move);
              }
            } else {
              // Final move of game - no piece to give
              const move = { place: [row, col] as [number, number], give: null, value: 0 };
              move.value = this.evaluateMove(state, move);
              moves.push(move);
            }
          }
        }
      }
    } else {
      // First move: no piece to place, just choose piece to give
      for (const piece of state.availablePieces) {
        const move = { place: null, give: piece, value: 0 };
        move.value = this.evaluateMove(state, move);
        moves.push(move);
      }
    }

    return moves;
  }

  // Evaluate a move and return its value (higher is better)
  private evaluateMove(state: GameState, move: Move): number {
    let value = 0;

    // Evaluate placement position (if placing a piece)
    if (move.place && state.stagedPiece) {
      const [row, col] = move.place;
      
      // Center positions are generally better (small bonus)
      const centerDistance = Math.abs(row - 1.5) + Math.abs(col - 1.5);
      value += (3 - centerDistance) * 0.1;
      
      // Check if this placement wins the game (huge bonus)
      const testBoard = state.board.map(r => [...r]);
      testBoard[row][col] = state.stagedPiece;
      if (checkWinCondition(testBoard)) {
        value += 1000; // Winning move gets highest priority
      }
    }

    // Evaluate piece giving (if giving a piece)
    if (move.give) {
      // Avoid giving pieces that allow opponent to win (huge penalty)
      if (this.isPieceDangerous(move.give, state)) {
        value -= 500; // Dangerous pieces get large penalty
      }
      
      // Slightly prefer giving pieces that limit opponent's options
      value += this.calculatePieceDefensiveValue(move.give, state);
    }

    return value;
  }

  // Calculate defensive value of giving a piece (higher means safer to give)
  private calculatePieceDefensiveValue(piece: PieceAttributes, state: GameState): number {
    let value = 0;
    
    // Count how many positions this piece could be placed without creating threats
    let safePositions = 0;
    let totalPositions = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!state.board[row][col]) {
          totalPositions++;
          const testBoard = state.board.map(r => [...r]);
          testBoard[row][col] = piece;
          
          // Check if placing here creates any threat for us
          if (!checkWinCondition(testBoard)) {
            safePositions++;
          }
        }
      }
    }
    
    // Prefer pieces that have fewer winning placements for opponent
    if (totalPositions > 0) {
      value = (safePositions / totalPositions) * 0.2;
    }
    
    return value;
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

// MCTS Configuration
export interface MCTSConfig {
  maxIterations: number;
  maxDepth: number;
  explorationConstant: number;
  playoutDepth: number; // Max depth for random playouts
}

// Default MCTS configuration
export const defaultMCTSConfig: MCTSConfig = {
  maxIterations: 1000,
  maxDepth: 20,
  explorationConstant: Math.sqrt(2),
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
      if (!node.isTerminal() && node.visits > 0 && node.depth < this.config.maxDepth) {
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
      
      const sortedMoves = this.sortMoves(moves);
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
  private sortMoves(moves: Move[]): Move[] {
    // Simply sort by value (higher values first)
    return moves.sort((a, b) => b.value - a.value);
  }

  // Evaluate a move and return its value (higher is better)
  private evaluateMove(state: GameState, move: Move): number {
    let value = 0;

    // Evaluate placement position (if placing a piece)
    if (move.place && state.stagedPiece) {
      const [row, col] = move.place;
      
      // Center positions are generally better (small bonus)
      const centerDistance = Math.abs(row - 1.5) + Math.abs(col - 1.5);
      value += (3 - centerDistance) * 0.1;
      
      // Check if this placement wins the game (huge bonus)
      const testBoard = state.board.map(r => [...r]);
      testBoard[row][col] = state.stagedPiece;
      if (checkWinCondition(testBoard)) {
        value += 1000; // Winning move gets highest priority
      }
    }

    // Evaluate piece giving (if giving a piece)
    if (move.give) {
      // Avoid giving pieces that allow opponent to win (huge penalty)
      if (this.isPieceDangerous(move.give, state)) {
        value -= 500; // Dangerous pieces get large penalty
      }
      
      // Slightly prefer giving pieces that limit opponent's options
      value += this.calculatePieceDefensiveValue(move.give, state);
    }

    return value;
  }

  // Calculate defensive value of giving a piece (higher means safer to give)
  private calculatePieceDefensiveValue(piece: PieceAttributes, state: GameState): number {
    let value = 0;
    
    // Count how many positions this piece could be placed without creating threats
    let safePositions = 0;
    let totalPositions = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!state.board[row][col]) {
          totalPositions++;
          const testBoard = state.board.map(r => [...r]);
          testBoard[row][col] = piece;
          
          // Check if placing here creates any threat for us
          if (!checkWinCondition(testBoard)) {
            safePositions++;
          }
        }
      }
    }
    
    // Prefer pieces that have fewer winning placements for opponent
    if (totalPositions > 0) {
      value = (safePositions / totalPositions) * 0.2;
    }
    
    return value;
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
                const move = { place: [row, col] as [number, number], give: piece, value: 0 };
                move.value = this.evaluateMove(state, move);
                moves.push(move);
              }
            } else {
              // Final move of game - no piece to give
              const move = { place: [row, col] as [number, number], give: null, value: 0 };
              move.value = this.evaluateMove(state, move);
              moves.push(move);
            }
          }
        }
      }
    } else {
      // First move: no piece to place, just choose piece to give
      for (const piece of state.availablePieces) {
        const move = { place: null, give: piece, value: 0 };
        move.value = this.evaluateMove(state, move);
        moves.push(move);
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

    const calculateStats = (node: MCTSNode) => {
      stats.maxDepth = Math.max(stats.maxDepth, node.depth);
      
      if (node.children.length > 0) {
        stats.avgBranchingFactor += node.children.length;
        node.children.forEach(child => calculateStats(child));
      }
    };

    calculateStats(root);
    
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
