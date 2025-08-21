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
  difficulty?: 'easy' | 'normal' | 'hard' | 'nightmare'; // AI difficulty level
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
 * Get random chance based on difficulty level
 */
function getRandomChance(difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'): number {
  switch (difficulty) {
    case 'easy': return 0.6;     // 60% chance of random moves
    case 'normal': return 0.3;   // 30% chance of random moves
    case 'hard': return 0;     // 10% chance of random moves
    case 'nightmare': return 0;  // 0% chance of random moves (always optimal)
    default: return 0.3;
  }
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
 * Difficulty affects strategy: easy makes some random moves, nightmare is always optimal
 */
export function makeAIPlacement(input: AIInput): BoardPosition | null {
  const { board, pieceToPlace, enableLogging, difficulty = 'normal' } = input;
  
  if (enableLogging) {
    console.log(`🔵 Basic AI (${difficulty}): Evaluating placement options...`);
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

  // Check for winning moves (easy difficulty skips this 10% of the time to be more beatable)
  const shouldSkipWinCheck = difficulty === 'easy' && Math.random() < 0.1;
  
  if (!shouldSkipWinCheck) {
    // Always check for winning moves (all difficulties except when easy AI misses)
    for (const position of emptyPositions) {
      const testBoard = board.map(row => [...row]);
      testBoard[position.row][position.col] = pieceToPlace;
      
      if (checkWinCondition(testBoard)) {
        if (enableLogging) {
          console.log(`🏆 Basic AI: Found winning move at (${position.col},${position.row})!`);
        }
        return position;
      }
    }
  } else {
    if (enableLogging) {
      console.log(`😴 Basic AI (easy): Skipping win check (10% chance) - being less optimal`);
    }
  }

  // Difficulty-based strategy
  const randomChance = getRandomChance(difficulty);
  if (Math.random() < randomChance) {
    // Make a random move (easier difficulties do this more often)
    const randomPosition = getRandomElement(emptyPositions);
    if (enableLogging) {
      console.log(`🎲 Basic AI (${difficulty}): Making random placement at (${randomPosition.col},${randomPosition.row})`);
    }
    return randomPosition;
  }

  // Strategic placement (maximize safe pieces to give)
  if (enableLogging) {
    console.log('🧠 Basic AI: No winning move found, evaluating positions for maximum safe pieces...');
  }

  // Set minimum safe pieces threshold based on difficulty
  const getMinSafePieces = (difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'): number => {
    switch (difficulty) {
      case 'easy': return 2;
      case 'normal': return 2;
      case 'hard': return 3;
      case 'nightmare': return 8;
      default: return 2;
    }
  };

  const minSafePieces = getMinSafePieces(difficulty);
  let bestPositions: BoardPosition[] = [];
  let maxSafePieces = -1;
  let positionsAboveThreshold: BoardPosition[] = [];

  for (const position of emptyPositions) {
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = pieceToPlace;
    
    const safePiecesCount = input.availablePieces.filter(piece => {
      return !canPieceLeadToWin(piece, testBoard, false);
    }).length;

    if (enableLogging) {
      console.log(`  📊 Position (${position.col},${position.row}): ${safePiecesCount} safe pieces (min required: ${minSafePieces})`);
    }

    // Track positions that meet the minimum threshold
    if (safePiecesCount >= minSafePieces) {
      positionsAboveThreshold.push(position);
    }

    // Also track the highest safe pieces count overall (for fallback)
    if (safePiecesCount > maxSafePieces) {
      maxSafePieces = safePiecesCount;
      bestPositions = [position];
    } else if (safePiecesCount === maxSafePieces) {
      bestPositions.push(position);
    }
  }

  let selectedPosition: BoardPosition;

  // If we have positions that meet the minimum threshold, choose randomly among them
  if (positionsAboveThreshold.length > 0) {
    selectedPosition = getRandomElement(positionsAboveThreshold);
    if (enableLogging) {
      console.log(`🎯 Basic AI: Found ${positionsAboveThreshold.length} positions meeting minimum ${minSafePieces} safe pieces, randomly selected (${selectedPosition.col},${selectedPosition.row})`);
    }
  } else {
    // No positions meet the minimum, choose from positions with highest safe pieces count
    selectedPosition = getRandomElement(bestPositions);
    if (enableLogging) {
      console.log(`⚠️ Basic AI: No positions meet minimum ${minSafePieces} safe pieces, selected position with highest count ${maxSafePieces}: (${selectedPosition.col},${selectedPosition.row})`);
    }
  }

  return selectedPosition;
}

/**
 * AI function to select a piece to give to the opponent
 * Difficulty affects piece selection strategy
 */
export function makeAIPieceSelection(input: AIInput): PieceAttributes | null {
  const { availablePieces, board, enableLogging, difficulty = 'normal' } = input;
  
  if (enableLogging) {
    console.log(`🟡 Basic AI (${difficulty}): Selecting piece to give opponent...`);
    console.log(`🟡 Basic AI: ${availablePieces.length} pieces available:`);
    availablePieces.forEach((piece, index) => {
      console.log(`  ${index}: ${formatPieceForLogging(piece)} (height:${piece.height}, color:${piece.color}, shape:${piece.shape}, top:${piece.top})`);
    });
  }

  if (availablePieces.length === 0) {
    if (enableLogging) {
      console.log('🟡 Basic AI: No pieces available to give (game ending)');
    }
    return null;
  }

  // Easy difficulty sometimes gives dangerous pieces intentionally
  const randomChance = getRandomChance(difficulty);
  if (Math.random() < randomChance) {
    const randomPiece = getRandomElement(availablePieces);
    if (enableLogging) {
      console.log(`🎲 Basic AI (${difficulty}): Randomly selected ${formatPieceForLogging(randomPiece)}`);
    }
    return randomPiece;
  }

  if (enableLogging) {
    console.log('🟡 Basic AI: Checking for dangerous pieces...');
  }

  // Find safe pieces (strategic play)
  const safePieces = availablePieces.filter(piece => {
    const isDangerous = canPieceLeadToWin(piece, board, enableLogging);
    if (enableLogging && isDangerous) {
      console.log(`⚠️ Basic AI: Piece ${formatPieceForLogging(piece)} is dangerous (allows opponent win)`);
    }
    return !isDangerous;
  });

  if (safePieces.length > 0) {
    const selectedPiece = getRandomElement(safePieces);
    if (enableLogging) {
      console.log(`✅ Basic AI: Selected safe piece ${formatPieceForLogging(selectedPiece)} (${safePieces.length} safe pieces available)`);
    }
    return selectedPiece;
  }

  // All pieces are dangerous, pick randomly
  const selectedPiece = getRandomElement(availablePieces);
  if (enableLogging) {
    console.log(`🚨 Basic AI: All pieces are dangerous! Selected ${formatPieceForLogging(selectedPiece)} randomly`);
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
