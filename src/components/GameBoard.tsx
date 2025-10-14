import React from 'react';
import Piece, { type PieceAttributes } from './Piece';
import './GameBoard.css';

interface GameBoardProps {
  onCellClick?: (row: number, col: number) => void;
  board?: (PieceAttributes | null)[][];
  winningLine?: [number, number][] | null;
  gameOver?: boolean;
  lastMove?: [number, number] | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ onCellClick, board, winningLine, gameOver, lastMove }) => {
  const handleCellClick = (row: number, col: number) => {
    if (onCellClick && !gameOver) {
      onCellClick(row, col);
    }
  };

  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  const isLastMoveCell = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    return lastMove[0] === row && lastMove[1] === col;
  };

  const renderCell = (row: number, col: number) => {
    const piece = board?.[row]?.[col];
    const isWinning = isWinningCell(row, col);
    const isLastMove = isLastMoveCell(row, col);
    
    return (
      <div
        key={`${row}-${col}`}
        className={`board-cell ${isWinning ? 'winning-cell' : ''} ${isLastMove ? 'last-move-cell' : ''} ${gameOver ? 'game-over' : ''}`}
        onClick={() => handleCellClick(row, col)}
      >
        {piece && <Piece attributes={piece} />}
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {Array.from({ length: 4 }, (_, rowIndex) =>
          Array.from({ length: 4 }, (_, colIndex) => renderCell(rowIndex, colIndex))
        )}
      </div>
    </div>
  );
};

export default GameBoard;
