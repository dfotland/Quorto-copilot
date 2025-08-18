import { type PieceAttributes } from '../components/Piece';

// Generate all 16 unique Quarto pieces
export const generateAllPieces = (): PieceAttributes[] => {
  const pieces: PieceAttributes[] = [];
  
  const heights: ('tall' | 'short')[] = ['tall', 'short'];
  const colors: ('light' | 'dark')[] = ['light', 'dark'];
  const shapes: ('square' | 'round')[] = ['square', 'round'];
  const tops: ('solid' | 'hollow')[] = ['solid', 'hollow'];
  
  // Generate all possible combinations (2^4 = 16 pieces)
  for (const height of heights) {
    for (const color of colors) {
      for (const shape of shapes) {
        for (const top of tops) {
          pieces.push({ height, color, shape, top });
        }
      }
    }
  }
  
  return pieces;
};

// Get a unique identifier for a piece
export const getPieceId = (piece: PieceAttributes): string => {
  return `${piece.height}-${piece.color}-${piece.shape}-${piece.top}`;
};

// Check if two pieces are the same
export const arePiecesEqual = (piece1: PieceAttributes, piece2: PieceAttributes): boolean => {
  return getPieceId(piece1) === getPieceId(piece2);
};

// Format a piece for logging (shows full attribute names)
export const formatPieceForLogging = (piece: PieceAttributes): string => {
  const height = piece.height === 'tall' ? 'Tall' : 'Short';
  const top = piece.top === 'solid' ? 'Solid' : 'Hollow';
  const color = piece.color === 'dark' ? 'Dark' : 'Light';
  const shape = piece.shape === 'square' ? 'Square' : 'Round';
  return `${height}/${top}/${color}/${shape}`;
};

// Check if four pieces share a common attribute
const haveSameAttribute = (pieces: PieceAttributes[]): boolean => {
  if (pieces.length !== 4) return false;
  
  // Check each attribute
  const sameHeight = pieces.every(p => p.height === pieces[0].height);
  const sameColor = pieces.every(p => p.color === pieces[0].color);
  const sameShape = pieces.every(p => p.shape === pieces[0].shape);
  const sameTop = pieces.every(p => p.top === pieces[0].top);
  
  return sameHeight || sameColor || sameShape || sameTop;
};

// Check for win condition on the board
export const checkWinCondition = (board: (PieceAttributes | null)[][]): boolean => {
  // Check rows
  for (let row = 0; row < 4; row++) {
    const rowPieces = board[row].filter(piece => piece !== null) as PieceAttributes[];
    if (rowPieces.length === 4 && haveSameAttribute(rowPieces)) {
      return true;
    }
  }
  
  // Check columns
  for (let col = 0; col < 4; col++) {
    const colPieces: PieceAttributes[] = [];
    for (let row = 0; row < 4; row++) {
      if (board[row][col]) {
        colPieces.push(board[row][col]!);
      }
    }
    if (colPieces.length === 4 && haveSameAttribute(colPieces)) {
      return true;
    }
  }
  
  // Check main diagonal (top-left to bottom-right)
  const mainDiagonal: PieceAttributes[] = [];
  for (let i = 0; i < 4; i++) {
    if (board[i][i]) {
      mainDiagonal.push(board[i][i]!);
    }
  }
  if (mainDiagonal.length === 4 && haveSameAttribute(mainDiagonal)) {
    return true;
  }
  
  // Check anti-diagonal (top-right to bottom-left)
  const antiDiagonal: PieceAttributes[] = [];
  for (let i = 0; i < 4; i++) {
    if (board[i][3 - i]) {
      antiDiagonal.push(board[i][3 - i]!);
    }
  }
  if (antiDiagonal.length === 4 && haveSameAttribute(antiDiagonal)) {
    return true;
  }
  
  return false;
};

// Check if the board is full (tie condition)
export const isBoardFull = (board: (PieceAttributes | null)[][]): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// Get winning line for highlighting (returns positions of winning pieces)
export const getWinningLine = (board: (PieceAttributes | null)[][]): [number, number][] | null => {
  // Check rows
  for (let row = 0; row < 4; row++) {
    const rowPieces = board[row].filter(piece => piece !== null) as PieceAttributes[];
    if (rowPieces.length === 4 && haveSameAttribute(rowPieces)) {
      return [[row, 0], [row, 1], [row, 2], [row, 3]];
    }
  }
  
  // Check columns
  for (let col = 0; col < 4; col++) {
    const colPieces: PieceAttributes[] = [];
    for (let row = 0; row < 4; row++) {
      if (board[row][col]) {
        colPieces.push(board[row][col]!);
      }
    }
    if (colPieces.length === 4 && haveSameAttribute(colPieces)) {
      return [[0, col], [1, col], [2, col], [3, col]];
    }
  }
  
  // Check main diagonal
  const mainDiagonal: PieceAttributes[] = [];
  for (let i = 0; i < 4; i++) {
    if (board[i][i]) {
      mainDiagonal.push(board[i][i]!);
    }
  }
  if (mainDiagonal.length === 4 && haveSameAttribute(mainDiagonal)) {
    return [[0, 0], [1, 1], [2, 2], [3, 3]];
  }
  
  // Check anti-diagonal
  const antiDiagonal: PieceAttributes[] = [];
  for (let i = 0; i < 4; i++) {
    if (board[i][3 - i]) {
      antiDiagonal.push(board[i][3 - i]!);
    }
  }
  if (antiDiagonal.length === 4 && haveSameAttribute(antiDiagonal)) {
    return [[0, 3], [1, 2], [2, 1], [3, 0]];
  }
  
  return null;
};
