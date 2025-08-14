import React from 'react';
import Piece, { type PieceAttributes } from './Piece';
import './PieceSet.css';

interface PieceSetProps {
  availablePieces: PieceAttributes[];
  selectedPiece: PieceAttributes | null;
  onPieceSelect: (piece: PieceAttributes) => void;
  gamePhase?: 'select' | 'place';
  gameOver?: boolean;
}

const PieceSet: React.FC<PieceSetProps> = ({ 
  availablePieces, 
  selectedPiece, 
  onPieceSelect,
  gamePhase = 'select',
  gameOver = false
}) => {
  const isPieceSelected = (piece: PieceAttributes) => {
    if (!selectedPiece) return false;
    return (
      piece.height === selectedPiece.height &&
      piece.color === selectedPiece.color &&
      piece.shape === selectedPiece.shape &&
      piece.top === selectedPiece.top
    );
  };

  const canSelectPieces = gamePhase === 'select' && !gameOver;

  return (
    <div className="piece-set">
      <h3>Available Pieces ({availablePieces.length}/16)</h3>
      <div className={`pieces-grid ${!canSelectPieces ? 'disabled' : ''}`}>
        {availablePieces.map((piece, index) => (
          <div key={index} className="piece-slot">
            <Piece
              attributes={piece}
              size="small"
              onClick={canSelectPieces ? () => onPieceSelect(piece) : undefined}
              isSelected={isPieceSelected(piece)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieceSet;
