import { type PieceAttributes } from './components/Piece';
import { checkWinCondition, formatPieceForLogging } from './utils/gameUtils';

export interface BoardPosition {
  row: number;
  col: number;
}

export interface AIMove {
  placement: BoardPosition | null; // null if no piece to place (first move)
  pieceToGive: PieceAttributes | null; // null if game ends with winning placement
}

export interface AIInput {
  board: (PieceAttributes | null)[][];
  pieceToPlace: PieceAttributes | null; // null for first move
  availablePieces: PieceAttributes[];
  enableLogging?: boolean; // Optional logging flag
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
 * This checks if the piece attributes could complete any existing 3-in-a-row patterns
 */
function canPieceLeadToWin(piece: PieceAttributes, board: (PieceAttributes | null)[][], enableLogging: boolean = false): boolean {
  // Get all empty positions where the opponent could place this piece
  const emptyPositions = getEmptyPositions(board);
  
  if (enableLogging) {
    console.log(`  🔍 Testing piece ${formatPieceForLogging(piece)} (${piece.height}, ${piece.color}, ${piece.shape}, ${piece.top}) on ${emptyPositions.length} empty positions...`);
  }
  
  // Try placing the piece on each empty position to see if it creates a win
  for (const position of emptyPositions) {
    // Create a copy of the board with the piece placed
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = piece;
    
    // Check if this placement results in a win
    if (checkWinCondition(testBoard)) {
      if (enableLogging) {
        console.log(`  ⚠️ DANGEROUS: Piece ${formatPieceForLogging(piece)} at (${position.col},${position.row}) creates winning line!`);
      }
      return true;
    }
  }
  
  if (enableLogging) {
    console.log(`  ✅ Safe: Piece ${formatPieceForLogging(piece)} doesn't create winning line`);
  }
  
  return false;
}

/**
 * AI function to place a piece on the board
 * First tries to find a winning placement, otherwise places randomly
 */
export function makeAIPlacement(input: AIInput): BoardPosition | null {
  const { board, pieceToPlace, enableLogging } = input;
  
  if (enableLogging) {
    console.log('🔵 Basic AI: Evaluating placement options...');
  }
  
  // If there's no piece to place, return null
  if (!pieceToPlace) {
    if (enableLogging) {
      console.log('🔵 Basic AI: No piece to place (first move)');
    }
    return null;
  }
  
  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) {
    if (enableLogging) {
      console.log('🔵 Basic AI: No empty positions available');
    }
    return null;
  }
  
  if (enableLogging) {
    console.log(`🔵 Basic AI: Found ${emptyPositions.length} empty positions`);
    console.log('🔵 Basic AI: Checking for winning moves...');
  }
  
  // First, check if there's a winning move
  for (const position of emptyPositions) {
    // Create a copy of the board with the piece placed
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = pieceToPlace;
    
    // Check if this placement results in a win
    if (checkWinCondition(testBoard)) {
      if (enableLogging) {
        console.log(`🏆 Basic AI: Found winning move at (${position.col},${position.row})!`);
      }
      return position; // Found a winning move!
    }
  }
  
  // No winning move found, choose position that maximizes safe pieces to give
  if (enableLogging) {
    console.log('🧠 Basic AI: No winning move found, evaluating positions for maximum safe pieces...');
  }
  
  let bestPositions: BoardPosition[] = [];
  let maxSafePieces = -1;
  
  for (const position of emptyPositions) {
    // Create a test board with the piece placed at this position
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = pieceToPlace;
    
    // Count how many pieces would be safe to give from this board state
    const safePiecesCount = input.availablePieces.filter(piece => {
      return !canPieceLeadToWin(piece, testBoard, false); // Don't log during evaluation
    }).length;
    
    if (enableLogging) {
      console.log(`  📊 Position (${position.col},${position.row}): ${safePiecesCount} safe pieces`);
    }
    
    // Track positions with the highest number of safe pieces
    if (safePiecesCount > maxSafePieces) {
      maxSafePieces = safePiecesCount;
      bestPositions = [position]; // Start new list with this position
    } else if (safePiecesCount === maxSafePieces) {
      bestPositions.push(position); // Add to list of equally good positions
    }
  }
  
  // Randomly select from the best positions
  const selectedPosition = getRandomElement(bestPositions);
  
  if (enableLogging) {
    if (bestPositions.length > 1) {
      console.log(`🎯 Basic AI: Found ${bestPositions.length} positions with ${maxSafePieces} safe pieces, randomly selected (${selectedPosition.col},${selectedPosition.row})`);
    } else {
      console.log(`🎯 Basic AI: Selected position (${selectedPosition.col},${selectedPosition.row}) with ${maxSafePieces} safe pieces to give`);
    }
  }
  
  return selectedPosition;
}

/**
 * AI function to select a piece to give to the opponent
 * First tries to avoid giving pieces that would let opponent win
 * Falls back to random selection if all pieces lead to potential wins
 * Returns null if no pieces are available (game ending scenario)
 */
export function makeAIPieceSelection(input: AIInput): PieceAttributes | null {
  const { availablePieces, board, enableLogging } = input;
  
  if (enableLogging) {
    console.log('🟡 Basic AI: Selecting piece to give opponent...');
    console.log(`🟡 Basic AI: ${availablePieces.length} pieces available:`);
    availablePieces.forEach((piece, index) => {
      console.log(`  ${index}: ${formatPieceForLogging(piece)} (height:${piece.height}, color:${piece.color}, shape:${piece.shape}, top:${piece.top})`);
    });
  }
  
  if (availablePieces.length === 0) {
    if (enableLogging) {
      console.log('🟡 Basic AI: No pieces available to give (game ending)');
    }
    return null; // No pieces left, game is ending
  }
  
  if (enableLogging) {
    console.log('🟡 Basic AI: Checking for dangerous pieces...');
  }
  
  // Find pieces that won't let the opponent win immediately
  const safePieces = availablePieces.filter(piece => {
    const isDangerous = canPieceLeadToWin(piece, board, enableLogging);
    if (enableLogging && isDangerous) {
      console.log(`⚠️ Basic AI: Piece ${formatPieceForLogging(piece)} (height:${piece.height}, color:${piece.color}, shape:${piece.shape}, top:${piece.top}) is dangerous (allows opponent win)`);
    }
    return !isDangerous;
  });
  
  // If there are safe pieces, choose randomly from them
  if (safePieces.length > 0) {
    const selectedPiece = getRandomElement(safePieces);
    if (enableLogging) {
      console.log(`✅ Basic AI: Selected safe piece ${formatPieceForLogging(selectedPiece)} (height:${selectedPiece.height}, color:${selectedPiece.color}, shape:${selectedPiece.shape}, top:${selectedPiece.top}) (${safePieces.length} safe pieces available)`);
    }
    return selectedPiece;
  }
  
  // If all pieces could lead to a win, pick randomly (opponent is likely to win anyway)
  const selectedPiece = getRandomElement(availablePieces);
  if (enableLogging) {
    console.log(`🚨 Basic AI: All pieces are dangerous! Selected ${formatPieceForLogging(selectedPiece)} (height:${selectedPiece.height}, color:${selectedPiece.color}, shape:${selectedPiece.shape}, top:${selectedPiece.top}) randomly`);
  }
  return selectedPiece;
}

/**
 * Main AI function - calls separate place and give functions
 * Can be extended to use different AI strategies
 */
export function makeAIMove(input: AIInput): AIMove {
  const { board, pieceToPlace, enableLogging } = input;
  
  if (enableLogging) {
    console.log('\n🔷 Basic AI: Starting move evaluation...');
  }
  
  // First, place the piece (if there is one)
  const placement = makeAIPlacement(input);
  
  // Check if this placement wins the game
  if (placement && pieceToPlace) {
    const testBoard = board.map(row => [...row]);
    testBoard[placement.row][placement.col] = pieceToPlace;
    
    if (checkWinCondition(testBoard)) {
      if (enableLogging) {
        console.log('🏆 Basic AI: Winning placement found! Game ends, no piece to give.');
      }
      return {
        placement,
        pieceToGive: null // Game ends, no piece needed
      };
    }
    
    // If not a winning move, create updated board state for piece selection
    if (enableLogging) {
      console.log('🔄 Basic AI: Updating board state with placed piece for piece selection...');
    }
    
    // Use the updated board (with the placed piece) for piece selection
    const updatedInput = {
      ...input,
      board: testBoard // Board now includes the placed piece
    };
    
    const pieceToGive = makeAIPieceSelection(updatedInput);
    
    if (enableLogging) {
      console.log('🔷 Basic AI: Move evaluation complete');
    }
    
    return {
      placement,
      pieceToGive
    };
  }
  
  // If no placement (first move), use original board for piece selection
  const pieceToGive = makeAIPieceSelection(input);
  
  if (enableLogging) {
    console.log('🔷 Basic AI: Move evaluation complete');
  }
  
  return {
    placement,
    pieceToGive
  };
}
