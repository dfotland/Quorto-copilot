import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import PieceSet from './components/PieceSet';
import Piece, { type PieceAttributes } from './components/Piece';
import { generateAllPieces, arePiecesEqual, checkWinCondition, isBoardFull, getWinningLine } from './utils/gameUtils';
import './App.css';
import { NeuralNetworkDemo } from './neural/NeuralNetworkDemo';

type GamePhase = 'place' | 'give';
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
  const [gamePhase, setGamePhase] = useState<GamePhase>('give');
  
  // AI controls
  const [player1AI, setPlayer1AI] = useState<boolean>(false);
  const [player2AI, setPlayer2AI] = useState<boolean>(false);
  
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

  // Handle AI moves
  useEffect(() => {
    const currentAI = currentPlayer === 1 ? player1AI : player2AI;
    
    const executeAIMove = () => {
      console.log(`AI executing move: Player ${currentPlayer}, Phase: ${gamePhase}, AI enabled: ${currentAI}`);
      
      if (gamePhase === 'give') {
        // AI selects a piece for the opponent
        if (availablePieces.length > 0) {
          const randomPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
          console.log(`AI Player ${currentPlayer} selecting piece:`, randomPiece);
          handlePieceSelect(randomPiece);
        }
      } else if (gamePhase === 'place' && stagedPiece) {
        // AI places the piece on a random empty position
        console.log(`AI Player ${currentPlayer} placing piece:`, stagedPiece);
        const emptyPositions = [];
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            if (board[row][col] === null) {
              emptyPositions.push({ row, col });
            }
          }
        }
        
        if (emptyPositions.length > 0) {
          const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
          handleCellClick(randomPosition.row, randomPosition.col);
        }
      }
    };
    
    if (gameState === 'playing' && currentAI) {
      // Delay AI move slightly for better UX
      const timeoutId = setTimeout(() => {
        executeAIMove();
      }, 1200); // Increased delay to see the piece selection
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gamePhase, gameState, player1AI, player2AI, availablePieces, stagedPiece, board]);

  const handlePieceSelect = (piece: PieceAttributes) => {
    if (gamePhase === 'give' && gameState === 'playing') {
      console.log(`handlePieceSelect: Player ${currentPlayer} selecting piece for Player ${currentPlayer === 1 ? 2 : 1}`);
      
      // Move selected piece to staging area
      setStagedPiece(piece);
      console.log(`Staged piece set:`, piece);
      
      // Remove piece from available pieces
      const newAvailablePieces = availablePieces.filter(
        p => !arePiecesEqual(p, piece)
      );
      setAvailablePieces(newAvailablePieces);
      
      // Clear selection and switch to next player's place phase
      setSelectedPiece(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setGamePhase('place');
      
      console.log(`Turn switched to Player ${currentPlayer === 1 ? 2 : 1}, phase: place`);
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
      
      // Switch to give phase (same player selects piece for opponent)
      setGamePhase('give');
      
      console.log(`Player ${currentPlayer} placed piece at row ${row}, column ${col}`);
    } else if (board[row][col]) {
      console.log(`Cell at row ${row}, column ${col} is already occupied`);
    } else if (gamePhase === 'give') {
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
    setGamePhase('give'); // First player starts by giving a piece
    setGameState('playing');
    setWinner(null);
    setWinningLine(null);
  };

  const getGameStatusMessage = () => {
    if (gameState === 'won') {
      return `🎉 Player ${winner} Wins! 🎉`;
    } else if (gameState === 'tie') {
      return `🤝 It's a Tie! 🤝`;
    } else if (gamePhase === 'give') {
      return `Player ${currentPlayer}: Select a piece for Player ${currentPlayer === 1 ? 2 : 1} to place`;
    } else {
      return `Player ${currentPlayer}: Place the selected piece on the board`;
    }
  };

  const runNeuralNetworkDemo = () => {
    console.clear();
    NeuralNetworkDemo.runDemo();
    NeuralNetworkDemo.benchmarkPerformance();
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
              <h3>{gameState === 'won' ? 'Game Over!' : gameState === 'tie' ? 'Game Over!' : `Current Player: ${currentPlayer}`}</h3>
              <p className={gameState !== 'playing' ? 'game-over-status' : ''}>{getGameStatusMessage()}</p>
            </div>
            
            <div className="ai-controls">
              <div className="ai-player">
                <label>
                  <input
                    type="checkbox"
                    checked={player1AI}
                    onChange={(e) => setPlayer1AI(e.target.checked)}
                  />
                  Player 1 AI
                </label>
              </div>
              <div className="ai-player">
                <label>
                  <input
                    type="checkbox"
                    checked={player2AI}
                    onChange={(e) => setPlayer2AI(e.target.checked)}
                  />
                  Player 2 AI
                </label>
              </div>
            </div>

            <div className="game-buttons">
              <button 
                onClick={startNewGame}
                className="new-game-button"
              >
                {gameState === 'playing' ? 'New Game' : 'Play Again'}
              </button>
              <button 
                onClick={runNeuralNetworkDemo}
                className="demo-button"
              >
                🧠 Neural Net Demo
              </button>
            </div>
            
            <div className="game-info">
              <p>Pieces placed: {16 - availablePieces.length}/16</p>
              <p>Phase: {gamePhase === 'give' ? 'Select piece' : 'Place piece'}</p>
            </div>
          </div>
          
          {/* <div className="debug-info">
            <h4>Debug Info</h4>
            <pre>{JSON.stringify({ board, availablePieces, stagedPiece, selectedPiece, currentPlayer, gamePhase, gameState, winner, winningLine }, null, 2)}</pre>
          </div> */}
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
            <h3>Piece for {currentPlayer === 1 ? 'Player 1' : 'Player 2'}</h3>
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
