import { type PieceAttributes } from './components/Piece';
import { checkWinCondition } from './utils/gameUtils';

export interface BoardPosition {
  row: number;
  col: number;
}

export interface AIMove {
  placement: BoardPosition | null; // null if no piece to place (first move)
  pieceToGive: PieceAttributes;
}

export interface AIInput {
  board: (PieceAttributes | null)[][];
  pieceToPlace: PieceAttributes | null; // null for first move
  availablePieces: PieceAttributes[];
}

/**
 * Get all empty positions on the board
 */
function getEmptyPositions(board: (PieceAttributes | null)[][]): BoardPosition[] {
  const emptyPositions: BoardPosition[] = [];
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === null) {
        emptyPositions.push({ row, col });
      }
    }
  }
  
  return emptyPositions;
}

/**
 * Get a random element from an array
 */
function getRandomElement<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Check if placing a specific piece on the board would allow the opponent to win
 */
function canPieceLeadToWin(piece: PieceAttributes, board: (PieceAttributes | null)[][]): boolean {
  const emptyPositions = getEmptyPositions(board);
  
  // Try placing the piece on each empty position to see if it creates a win
  for (const position of emptyPositions) {
    // Create a copy of the board with the piece placed
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = piece;
    
    // Check if this placement results in a win
    if (checkWinCondition(testBoard)) {
      return true;
    }
  }
  
  return false;
}

/**
 * AI function to place a piece on the board
 * First tries to find a winning placement, otherwise places randomly
 */
export function makeAIPlacement(input: AIInput): BoardPosition | null {
  const { board, pieceToPlace } = input;
  
  // If there's no piece to place, return null
  if (!pieceToPlace) {
    return null;
  }
  
  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) {
    return null;
  }
  
  // First, check if there's a winning move
  for (const position of emptyPositions) {
    // Create a copy of the board with the piece placed
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = pieceToPlace;
    
    // Check if this placement results in a win
    if (checkWinCondition(testBoard)) {
      return position; // Found a winning move!
    }
  }
  
  // No winning move found, place randomly
  return getRandomElement(emptyPositions);
}

/**
 * AI function to select a piece to give to the opponent
 * First tries to avoid giving pieces that would let opponent win
 * Falls back to random selection if all pieces lead to potential wins
 */
export function makeAIPieceSelection(input: AIInput): PieceAttributes {
  const { availablePieces, board } = input;
  
  if (availablePieces.length === 0) {
    throw new Error('No pieces available to give to opponent');
  }
  
  // Find pieces that won't let the opponent win immediately
  const safePieces = availablePieces.filter(piece => !canPieceLeadToWin(piece, board));
  
  // If there are safe pieces, choose randomly from them
  if (safePieces.length > 0) {
    return getRandomElement(safePieces);
  }
  
  // If all pieces could lead to a win, pick randomly (opponent is likely to win anyway)
  return getRandomElement(availablePieces);
}

/**
 * Main AI function - calls separate place and give functions
 * Can be extended to use different AI strategies
 */
export function makeAIMove(input: AIInput): AIMove {
  // First, place the piece (if there is one)
  const placement = makeAIPlacement(input);
  
  // Then, give a piece to the opponent
  const pieceToGive = makeAIPieceSelection(input);
  
  return {
    placement,
    pieceToGive
  };
}
