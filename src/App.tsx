import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import PieceSet from './components/PieceSet';
import Piece, { type PieceAttributes } from './components/Piece';
import { generateAllPieces, arePiecesEqual, checkWinCondition, isBoardFull, getWinningLine } from './utils/gameUtils';
import './App.css';

type GamePhase = 'select' | 'place';
type Player = 1 | 2;
type GameState = 'playing' | 'won' | 'tie';

function App() {
  // Initialize an empty 4x4 board
  const [board, setBoard] = useState<(PieceAttributes | null)[][]>(
    Array(4).fill(null).map(() => Array(4).fill(null))
  );
  
  // Start with all 16 pieces available
  const [availablePieces, setAvailablePieces] = useState<PieceAttributes[]>(generateAllPieces());
  
  // Track the piece in the staging area (selected by current player for opponent to place)
  const [stagedPiece, setStagedPiece] = useState<PieceAttributes | null>(null);
  
  // Track the currently selected piece from available pieces
  const [selectedPiece, setSelectedPiece] = useState<PieceAttributes | null>(null);
  
  // Track current player and game phase
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('select');
  
  // Track game state
  const [gameState, setGameState] = useState<GameState>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);

  // Check for win condition after each move
  useEffect(() => {
    if (checkWinCondition(board)) {
      setGameState('won');
      setWinner(gamePhase === 'place' ? (currentPlayer === 1 ? 2 : 1) : currentPlayer);
      setWinningLine(getWinningLine(board));
    } else if (isBoardFull(board)) {
      setGameState('tie');
    }
  }, [board, currentPlayer, gamePhase]);

  const handlePieceSelect = (piece: PieceAttributes) => {
    if (gamePhase === 'select' && gameState === 'playing') {
      // Immediately move selected piece to staging area
      setStagedPiece(piece);
      
      // Remove piece from available pieces
      const newAvailablePieces = availablePieces.filter(
        p => !arePiecesEqual(p, piece)
      );
      setAvailablePieces(newAvailablePieces);
      
      // Clear selection and switch to place phase
      setSelectedPiece(null);
      setGamePhase('place');
      
      console.log(`Player ${currentPlayer} selected piece for Player ${currentPlayer === 1 ? 2 : 1} to place`);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    // Only place piece if cell is empty, we're in place phase, there's a staged piece, and game is still playing
    if (!board[row][col] && gamePhase === 'place' && stagedPiece && gameState === 'playing') {
      // Place the staged piece on the board
      const newBoard = [...board];
      newBoard[row][col] = stagedPiece;
      setBoard(newBoard);
      
      // Clear staged piece
      setStagedPiece(null);
      
      // Switch to next player and select phase
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setGamePhase('select');
      
      console.log(`Player ${currentPlayer === 1 ? 2 : 1} placed piece at row ${row}, column ${col}`);
    } else if (board[row][col]) {
      console.log(`Cell at row ${row}, column ${col} is already occupied`);
    } else if (gamePhase === 'select') {
      console.log(`Player ${currentPlayer} must first select a piece for the opponent`);
    } else if (gameState !== 'playing') {
      console.log(`Game is over`);
    } else {
      console.log(`No piece available to place`);
    }
  };

  const startNewGame = () => {
    setBoard(Array(4).fill(null).map(() => Array(4).fill(null)));
    setAvailablePieces(generateAllPieces());
    setSelectedPiece(null);
    setStagedPiece(null);
    setCurrentPlayer(1);
    setGamePhase('select');
    setGameState('playing');
    setWinner(null);
    setWinningLine(null);
  };

  const getGameStatusMessage = () => {
    if (gameState === 'won') {
      return `🎉 Player ${winner} Wins! 🎉`;
    } else if (gameState === 'tie') {
      return `🤝 It's a Tie! 🤝`;
    } else if (gamePhase === 'select') {
      return `Player ${currentPlayer}: Select a piece for Player ${currentPlayer === 1 ? 2 : 1} to place`;
    } else {
      return `Player ${currentPlayer === 1 ? 2 : 1}: Place the selected piece on the board`;
    }
  };

  return (
    <div className="app">
      <h1>Quarto Game</h1>
      
      <div className="game-container">
        <div className="game-section">
          <GameBoard 
            onCellClick={handleCellClick} 
            board={board} 
            winningLine={winningLine}
            gameOver={gameState !== 'playing'}
          />
          
          <div className="game-controls">
            <div className="current-player">
              <h3 className={gameState !== 'playing' ? 'game-over-title' : ''}>
                {gameState === 'playing' ? `Current Turn: Player ${currentPlayer}` : 'Game Over'}
              </h3>
              <p className={`game-status ${gameState !== 'playing' ? 'game-over-status' : ''}`}>
                {getGameStatusMessage()}
              </p>
            </div>
            
            <div className="game-buttons">
              <button onClick={startNewGame} className="new-game-button">
                {gameState === 'playing' ? 'New Game' : 'Play Again'}
              </button>
            </div>
            
            <div className="game-info">
              <p>Pieces placed: {16 - availablePieces.length}/16</p>
              <p>Game phase: {gameState === 'playing' ? (gamePhase === 'select' ? 'Piece Selection' : 'Piece Placement') : 'Finished'}</p>
            </div>
          </div>
        </div>
        
        <div className="piece-selection-area">
          <PieceSet 
            availablePieces={availablePieces}
            selectedPiece={selectedPiece}
            onPieceSelect={handlePieceSelect}
            gamePhase={gamePhase}
            gameOver={gameState !== 'playing'}
          />
          
          {/* Staging Area */}
          <div className="staging-area">
            <h3>Piece for Opponent</h3>
            <div className={`staging-circle ${gameState !== 'playing' ? 'disabled' : ''}`}>
              {stagedPiece ? (
                <div className="staged-piece">
                  <Piece attributes={stagedPiece} size="small" />
                </div>
              ) : (
                <div className="staging-empty">
                  <span>{gameState === 'playing' ? 'Select a piece above' : 'Game Over'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
