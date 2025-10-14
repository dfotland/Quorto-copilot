import React from 'react';
import './Piece.css';

export interface PieceAttributes {
  height: 'tall' | 'short';
  color: 'light' | 'dark';
  shape: 'square' | 'round';
  top: 'smooth' | 'split';
}

interface PieceProps {
  attributes: PieceAttributes;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const Piece: React.FC<PieceProps> = ({ 
  attributes, 
  onClick, 
  isSelected = false,
  className = ''
}) => {
  const pieceClasses = [
    'piece',
    `piece-${attributes.height}`,
    `piece-${attributes.color}`,
    `piece-${attributes.shape}`,
    `piece-${attributes.top}`,
    isSelected ? 'piece-selected' : '',
    onClick ? 'piece-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={pieceClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="piece-body">
      </div>
    </div>
  );
};

export default Piece;
