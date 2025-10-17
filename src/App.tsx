import { useState, useEffect, useRef, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import Piece, { type PieceAttributes } from './components/Piece';
import ControlPanel from './components/ControlPanel';
import { generateAllPieces, arePiecesEqual, checkWinCondition, isBoardFull, getWinningLine, formatPieceForLogging, getPieceId } from './utils/gameUtils';
import { makeAIMove, type AIInput } from './ai';
import './App.css';

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
  const [basicAIDifficulty, setBasicAIDifficulty] = useState<'easy' | 'normal' | 'hard' | 'nightmare'>('easy');
  const [enableAILogging, setEnableAILogging] = useState<boolean>(false);
  
  // Track game state
  const [gameState, setGameState] = useState<GameState>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);

  // Ref to prevent duplicate AI executions
  const executionCountRef = useRef(0);
  const lastExecutionKeyRef = useRef('');
  const pendingExecutionRef = useRef(false);

  // AI Configuration popup state
  const [showAIConfig, setShowAIConfig] = useState<boolean>(false);
  
  // Rules and About popup states
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // Check for win condition after each move
  useEffect(() => {
    if (checkWinCondition(board)) {
      setGameState('won');
      setWinner(currentPlayer); // The current player is the one who just placed the winning piece
      setWinningLine(getWinningLine(board));
    } else if (isBoardFull(board)) {
      setGameState('tie');
    }
  }, [board, currentPlayer, gamePhase]);

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
      
      // Track the last move position
      setLastMove([row, col]);
      
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
    setLastMove(null); // Reset last move highlighting
    
    // Reset AI execution tracking
    executionCountRef.current = 0;
    lastExecutionKeyRef.current = '';
    pendingExecutionRef.current = false;
  };

  // Execute AI move based on current AI type
  const executeAIMove = useCallback(() => {
    if (gameState !== 'playing') return;

    const isCurrentPlayerAI = (currentPlayer === 1 && player1AI) || (currentPlayer === 2 && player2AI);
    if (!isCurrentPlayerAI) return;

    const formatPieceForDisplay = (piece: PieceAttributes | null) => {
      if (!piece) return 'null';
      return formatPieceForLogging(piece);
    };

    console.log(`🎯 ======= AI MOVE START =======`);
    console.log(`🎯 AI (Player ${currentPlayer}) executing move in phase: ${gamePhase}`);
    console.log(`🎯 Staged piece available: ${formatPieceForDisplay(stagedPiece)} ${stagedPiece ? `(height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})` : ''}`);
    console.log(`🎯 Available pieces count: ${availablePieces.length}`);

    const aiMove = executeBasicAIMove();

    // Apply the AI move to the game state
    if (aiMove) {
      applyAIMove(aiMove);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentPlayer, player1AI, player2AI, gamePhase, stagedPiece, availablePieces]);

  // Apply an AI move to the game state
  const applyAIMove = (aiMove: { placement?: { row: number; col: number } | null; pieceToGive?: PieceAttributes | null }) => {
    console.log(`🔧 Applying AI complete move:`, {
      placement: aiMove.placement,
      pieceToGive: aiMove.pieceToGive,
      currentGamePhase: gamePhase,
      hasStagedPiece: !!stagedPiece
    });

    // STEP 1: Handle placement (place the staged piece first)
    if (aiMove.placement && stagedPiece) {
      console.log(`📍 STEP 1 - Placing piece at (${aiMove.placement.row}, ${aiMove.placement.col})`);
      console.log(`🔍 PIECE DETAILS - Staged piece being placed: ${formatPieceForLogging(stagedPiece)} (height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})`);
      console.log(`🔍 Current player placing: Player ${currentPlayer}`);
      
      const newBoard = [...board];
      newBoard[aiMove.placement.row][aiMove.placement.col] = stagedPiece;
      setBoard(newBoard);
      setLastMove([aiMove.placement.row, aiMove.placement.col]);
      setStagedPiece(null); // Clear the staged piece after placing
      
      console.log(`✅ STEP 1 COMPLETE - Piece placed, staged piece cleared`);
    } else if (aiMove.placement && !stagedPiece) {
      console.log(`❌ STEP 1 FAILED - Cannot place piece, no staged piece available`);
    } else if (!aiMove.placement && stagedPiece) {
      console.log(`🔄 STEP 1 SKIPPED - No placement specified (first move of game)`);
    }

    // STEP 2: Handle piece giving (give piece to opponent)
    if (aiMove.pieceToGive) {
      console.log(`🎁 STEP 2 - AI Player ${currentPlayer} giving piece to Player ${currentPlayer === 1 ? 2 : 1}`);
      console.log(`🔍 PIECE DETAILS - Given piece: ${formatPieceForLogging(aiMove.pieceToGive)} (height:${aiMove.pieceToGive.height}, color:${aiMove.pieceToGive.color}, shape:${aiMove.pieceToGive.shape}, top:${aiMove.pieceToGive.top})`);
      console.log(`🔍 This piece will be staged for Player ${currentPlayer === 1 ? 2 : 1} to place`);
      
      // Set the new staged piece (should be null from step 1, so no override warning)
      setStagedPiece(aiMove.pieceToGive);
      console.log(`✅ NEW STAGED PIECE SET: ${formatPieceForLogging(aiMove.pieceToGive)}`);
      
      // Remove the given piece from available pieces
      const newAvailablePieces = availablePieces.filter(
        p => !arePiecesEqual(p, aiMove.pieceToGive!)
      );
      setAvailablePieces(newAvailablePieces);
      
      // Switch to next player and set them to place phase
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setGamePhase('place');
      
      console.log(`✅ STEP 2 COMPLETE - Piece given, switched to Player ${currentPlayer === 1 ? 2 : 1} in place phase`);
    } else {
      console.log(`🏁 STEP 2 SKIPPED - No piece to give (game ending move)`);
    }
    
    console.log(`🎯 ======= AI COMPLETE MOVE FINISHED =======\n`);
  };

  const executeBasicAIMove = () => {
    executionCountRef.current += 1;
    console.log(`🤖 Basic AI (Player ${currentPlayer}) is thinking... [Execution #${executionCountRef.current}]`);
    
    const aiInput: AIInput = {
      board,
      pieceToPlace: stagedPiece,
      availablePieces,
      enableLogging: enableAILogging,
      difficulty: basicAIDifficulty
    };

    const aiMove = makeAIMove(aiInput);
    console.log(`🎯 Basic AI move completed [Execution #${executionCountRef.current}]`);
    
    // DEBUG: Log what the AI actually returned
    const formatPieceForDisplay = (piece: PieceAttributes | null) => {
      if (!piece) return 'null';
      return formatPieceForLogging(piece);
    };
    
    console.log(`🔍 AI RETURNED - Placement: ${aiMove.placement ? `(${aiMove.placement.row}, ${aiMove.placement.col})` : 'null'} - Piece to place: ${formatPieceForDisplay(stagedPiece)} ${stagedPiece ? `(height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})` : ''}`);
    console.log(`🔍 AI RETURNED - PieceToGive: ${formatPieceForDisplay(aiMove.pieceToGive)} ${aiMove.pieceToGive ? `(height:${aiMove.pieceToGive.height}, color:${aiMove.pieceToGive.color}, shape:${aiMove.pieceToGive.shape}, top:${aiMove.pieceToGive.top})` : ''}`);
    
    // Convert AIMove format to common format
    return {
      placement: aiMove.placement,
      pieceToGive: aiMove.pieceToGive
    };
  };

  // Execute AI moves when it's an AI player's turn
  useEffect(() => {
    const isCurrentPlayerAI = (currentPlayer === 1 && player1AI) || (currentPlayer === 2 && player2AI);
    
    if (gameState === 'playing' && isCurrentPlayerAI) {
      // Prevent multiple pending executions
      if (pendingExecutionRef.current) {
        console.log('🚫 AI execution already pending, skipping...');
        return;
      }
      
      pendingExecutionRef.current = true;
      
      const timer = setTimeout(() => {
        executeAIMove();
        pendingExecutionRef.current = false;
      }, 500); // Small delay for better UX

      return () => {
        clearTimeout(timer);
        pendingExecutionRef.current = false;
      };
    }
  }, [currentPlayer, gamePhase, gameState, player1AI, player2AI, executeAIMove]);

  const getGameStatusMessage = () => {
    if (gameState === 'won') {
      return `Game Over`;
    } else if (gameState === 'tie') {
      return `Game Over`;
    } else if (gamePhase === 'give') {
      return `Player ${currentPlayer}: Select an available piece for Player ${currentPlayer === 1 ? 2 : 1} to place`;
    } else {
      return `Player ${currentPlayer}: Place this piece on the board`;
    }
  };

  return (
    <div className="app">
      {/* 3x3 CSS Grid Layout */}
      <div className="game-grid">
        {/* Header - Top row, spans all 3 columns */}
        <header className="header">
          <h1 className="game-title">QuAIto Game</h1>
          <div className="header-buttons">
            <button 
              onClick={() => setShowRules(true)}
              className="header-button"
            >
              Rules
            </button>
            <button 
              onClick={() => setShowAbout(true)}
              className="header-button"
            >
              About
            </button>
          </div>
        </header>

        {/* Game Board - Left column, middle row */}
        <div className="game-board-area">
          <GameBoard 
            onCellClick={handleCellClick} 
            board={board} 
            winningLine={winningLine}
            gameOver={gameState !== 'playing'}
            lastMove={lastMove}
          />
        </div>

        {/* Available Pieces - Right 2 columns, middle row */}
        <div className="available-pieces-area">
          <h3>Available Pieces ({availablePieces.length}/16)</h3>
          <div className={`pieces-grid ${(gamePhase !== 'give' || gameState !== 'playing') ? 'disabled' : ''}`}>
            {generateAllPieces().map((piece, index) => {
              const pieceId = getPieceId(piece);
              const isAvailable = availablePieces.some(availablePiece => getPieceId(availablePiece) === pieceId);
              const isSelected = !!(selectedPiece && 
                piece.height === selectedPiece.height &&
                piece.color === selectedPiece.color &&
                piece.shape === selectedPiece.shape &&
                piece.top === selectedPiece.top);
              const canSelectPieces = gamePhase === 'give' && gameState === 'playing';
              
              return (
                <div key={index} className="piece-slot">
                  {isAvailable ? (
                    <Piece
                      attributes={piece}
                      onClick={canSelectPieces ? () => handlePieceSelect(piece) : undefined}
                      isSelected={isSelected}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>



        {/* Control Panel - Right column, bottom row */}
        <ControlPanel
          player1AI={player1AI}
          player2AI={player2AI}
          onNewGame={startNewGame}
          onTogglePlayer1AI={(checked) => setPlayer1AI(checked)}
          onTogglePlayer2AI={(checked) => setPlayer2AI(checked)}
          onOpenAIConfig={() => setShowAIConfig(true)}
        />

        {/* Game Message Area - Fourth row, first column */}
        <div className="game-message-area">
          <div className="current-player-info">
            {gameState === 'won' && (
              <p className="player-status winner-announcement">🎉 Player {winner} wins! 🎉</p>
            )}
            {gameState === 'tie' && (
              <p className="player-status tie-announcement">It's a tie! 🤝</p>
            )}
            {gameState === 'playing' && (
              <p className="player-status">{getGameStatusMessage()}</p>
            )}
          </div>
          <div className="staging-area">
            {stagedPiece ? (
              <div className="staged-piece">
                <Piece attributes={stagedPiece} />
              </div>
            ) : (
              <div className="staging-empty">
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Configuration Modal */}
      {showAIConfig && (
        <div className="modal-overlay" onClick={() => setShowAIConfig(false)}>
          <div className="ai-config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AI Configuration</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAIConfig(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="basic-ai-config">
                <label>AI Difficulty:</label>
                <div className="difficulty-selection">
                  <label className={basicAIDifficulty === 'easy' ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="basicAIDifficulty"
                      value="easy"
                      checked={basicAIDifficulty === 'easy'}
                      onChange={(e) => setBasicAIDifficulty(e.target.value as 'easy' | 'normal' | 'hard' | 'nightmare')}
                    />
                    <span>Easy</span>
                  </label>
                  <label className={basicAIDifficulty === 'normal' ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="basicAIDifficulty"
                      value="normal"
                      checked={basicAIDifficulty === 'normal'}
                      onChange={(e) => setBasicAIDifficulty(e.target.value as 'easy' | 'normal' | 'hard' | 'nightmare')}
                    />
                    <span>Normal</span>
                  </label>
                  <label className={basicAIDifficulty === 'hard' ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="basicAIDifficulty"
                      value="hard"
                      checked={basicAIDifficulty === 'hard'}
                      onChange={(e) => setBasicAIDifficulty(e.target.value as 'easy' | 'normal' | 'hard' | 'nightmare')}
                    />
                    <span>Hard</span>
                  </label>
                  <label className={basicAIDifficulty === 'nightmare' ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="basicAIDifficulty"
                      value="nightmare"
                      checked={basicAIDifficulty === 'nightmare'}
                      onChange={(e) => setBasicAIDifficulty(e.target.value as 'easy' | 'normal' | 'hard' | 'nightmare')}
                    />
                    <span>Nightmare</span>
                  </label>
                </div>
              </div>
              
              <div className="config-group">
                <label>
                  <input
                    type="checkbox"
                    checked={enableAILogging}
                    onChange={(e) => setEnableAILogging(e.target.checked)}
                  />
                  Enable AI Logging (check console)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>QuAIto (Quarto with AI)</h3>
              <button 
                className="close-button" 
                onClick={() => setShowRules(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="rules-section">
                <h4>Objective</h4>
                <p>Be the first player to get four pieces in a row that share at least one common attribute.</p>
              </div>
              
              <div className="rules-section">
                <h4>Game Setup</h4>
                <ul>
                  <li>There are 16 unique pieces, each with 4 different attributes:</li>
                  <li><strong>Height:</strong> Tall or Short</li>
                  <li><strong>Color:</strong> Light or Dark</li>
                  <li><strong>Shape:</strong> Circle or Square</li>
                  <li><strong>Top:</strong> Smooth or Split</li>
                </ul>
              </div>
              
              <div className="rules-section">
                <h4>How to Play</h4>
                <ol>
                  <li><strong>Give Phase:</strong> The current player selects a piece from the available pieces for their opponent to place.</li>
                  <li><strong>Place Phase:</strong> The opponent places the given piece on any empty square on the 4×4 board.</li>
                  <li>Players alternate between giving and placing pieces.</li>
                  <li>The game continues until someone wins or the board is full (tie).</li>
                </ol>
              </div>
              
              <div className="rules-section">
                <h4>Winning</h4>
                <p>A player wins by creating a line of four pieces that share at least one common attribute. Winning lines can be:</p>
                <ul>
                  <li>Horizontal (any row)</li>
                  <li>Vertical (any column)</li>
                  <li>Diagonal (either diagonal)</li>
                </ul>
              </div>
              
              <div className="rules-section">
                <h4>Strategy Tip</h4>
                <p>Try to avoid giving your opponent a piece that could complete a winning line, while setting up your own winning opportunities!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>About QuAIto 0.91 Beta</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAbout(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="about-section">
                <h4>About the Game</h4>
                <p>Quarto is a strategic board game invented by Blaise Müller in 1991. It's a game of logic and pattern recognition where players must think several moves ahead to avoid giving their opponent a winning opportunity.</p>
              </div>
              
              <div className="about-section">
                <h4>About This App</h4>
                <p>QuAIto is a digital implementation of Quarto that features:</p>
                <ul>
                  <li><strong>Human vs Human:</strong> Play against a friend locally</li>
                  <li><strong>AI Opponents:</strong> Challenge yourself against computer players</li>
                  <li><strong>Basic AI:</strong> Uses heuristic-based decision making with configurable difficulty levels that adjust strategic thinking and randomness with minimal lookahead</li>
                </ul>
              </div>
              
              <div className="about-section">
                <h4>Technology</h4>
                <p>Built with modern web technologies:</p>
                <ul>
                  <li>React 19 with TypeScript</li>
                  <li>Vite for fast development</li>
                  <li>CSS Grid for responsive layout</li>
                </ul>
              </div>
              
              <div className="about-section">
                <h4>Tips for Playing</h4>
                <ul>
                  <li>Study the available pieces before making your selection</li>
                  <li>Try the different AI difficulty levels to improve your skills</li>
                  <li>Don't give your opponent a piece they can play to win</li>
                  <li>Place your piece to limit your opponent's choices</li>
                </ul>
              </div>
              
              <div className="about-section">
                <h4>Contact</h4>
                <p>For suggestions or bugs, email: <strong>fotland@smart-games.com</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
