import React from 'react';
import Piece, { type PieceAttributes } from './Piece';
import './PieceSet.css';
import { generateAllPieces, getPieceId } from '../utils/gameUtils';

interface PieceSetProps {
  availablePieces: PieceAttributes[];
  selectedPiece: PieceAttributes | null;
  onPieceSelect: (piece: PieceAttributes) => void;
  gamePhase?: 'give' | 'place';
  gameOver?: boolean;
}

const PieceSet: React.FC<PieceSetProps> = ({ 
  availablePieces, 
  selectedPiece, 
  onPieceSelect,
  gamePhase = 'give',
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

  const canSelectPieces = gamePhase === 'give' && !gameOver;

  // Get all possible pieces in their original order
  const allPieces = generateAllPieces();
  
  // Create a set of available piece IDs for quick lookup
  const availablePieceIds = new Set(availablePieces.map(piece => getPieceId(piece)));

  return (
    <div className="piece-set">
      <div className={`pieces-grid ${!canSelectPieces ? 'disabled' : ''}`}>
        {allPieces.map((piece, index) => {
          const pieceId = getPieceId(piece);
          const isAvailable = availablePieceIds.has(pieceId);
          
          return (
            <div key={index} className="piece-slot">
              {isAvailable ? (
                <Piece
                  attributes={piece}
                  onClick={canSelectPieces ? () => onPieceSelect(piece) : undefined}
                  isSelected={isPieceSelected(piece)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieceSet;
