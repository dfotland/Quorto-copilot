import { useState, useEffect, useRef, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import PieceSet from './components/PieceSet';
import Piece, { type PieceAttributes } from './components/Piece';
import { generateAllPieces, arePiecesEqual, checkWinCondition, isBoardFull, getWinningLine, formatPieceForLogging } from './utils/gameUtils';
import { MCTSSearch, createGameStateFromApp, type MCTSConfig, defaultMCTSConfig } from './ai/mcts';
import { makeAIMove, type AIInput } from './ai';
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
  const [aiType, setAiType] = useState<'basic' | 'mcts'>('basic');
  const [basicAIDifficulty, setBasicAIDifficulty] = useState<'easy' | 'normal' | 'hard' | 'nightmare'>('normal');
  
  // MCTS Configuration
  const [mctsConfig, setMctsConfig] = useState<MCTSConfig>(defaultMCTSConfig);
  
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

    let aiMove;
    if (aiType === 'basic') {
      aiMove = executeBasicAIMove();
    } else if (aiType === 'mcts') {
      aiMove = executeMCTSMove();
    }

    // Apply the AI move to the game state
    if (aiMove) {
      applyAIMove(aiMove);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentPlayer, player1AI, player2AI, gamePhase, stagedPiece, availablePieces, aiType]);

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
      enableLogging: mctsConfig.enableLogging, // Use the same logging flag as MCTS
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

  const executeMCTSMove = () => {
    console.log(`🤖 MCTS AI (Player ${currentPlayer}) is thinking...`);
    
    const gameStateForMCTS = createGameStateFromApp(
      board,
      availablePieces,
      stagedPiece,
      currentPlayer,
      gameState !== 'playing',
      winner
    );

    const mcts = new MCTSSearch(mctsConfig);
    const bestMove = mcts.search(gameStateForMCTS);

    // Helper function to format piece for logging
    const formatPiece = (piece: PieceAttributes) => 
      `${piece.height[0]}${piece.color[0]}${piece.shape[0]}${piece.top[0]}`;

    console.log(`🎯 MCTS AI selected move: ${bestMove.place ? `place at (${bestMove.place[1]},${bestMove.place[0]})` : 'no placement'}, ${bestMove.give ? `give piece ${formatPiece(bestMove.give)}` : 'no piece to give'}`);

    // Convert MCTS move format to common AI move format
    return {
      placement: bestMove.place ? { row: bestMove.place[0], col: bestMove.place[1] } : undefined,
      pieceToGive: bestMove.give
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
  }, [currentPlayer, gamePhase, gameState, player1AI, player2AI, aiType, executeAIMove]);

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
      {/* 3x3 CSS Grid Layout */}
      <div className="game-grid">
        {/* Header - Top row, spans all 3 columns */}
        <header className="header">
          <h1 className="game-title">QuAIto Game</h1>
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
          <PieceSet 
            availablePieces={availablePieces}
            selectedPiece={selectedPiece}
            onPieceSelect={handlePieceSelect}
            gamePhase={gamePhase}
            gameOver={gameState !== 'playing'}
          />
        </div>

        {/* Staged Piece - Middle column, bottom row */}
        <div className="staged-piece-area">
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

        {/* Control Panel - Right column, bottom row */}
        <div className="control-panel">
          <div className="current-player-info">
            <p className={`player-status ${gameState !== 'playing' ? 'game-over-status' : ''}`}>{getGameStatusMessage()}</p>
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
              onClick={() => setShowAIConfig(true)}
              className="ai-config-button"
            >
              ⚙️ AI Settings
            </button>
          </div>
        </div>

        {/* Game Message Area - Fourth row, first column */}
        <div className="game-message-area">
          {gameState === 'won' && (
            <div className="winner-announcement">
              🎉 Player {winner} wins! 🎉
            </div>
          )}
          {gameState === 'tie' && (
            <div className="tie-announcement">
              It's a tie! 🤝
            </div>
          )}
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
              <div className="ai-type-selection">
                <label>
                  <input
                    type="radio"
                    name="aiType"
                    value="basic"
                    checked={aiType === 'basic'}
                    onChange={(e) => setAiType(e.target.value as 'basic' | 'mcts')}
                  />
                  Basic AI
                </label>
                <label>
                  <input
                    type="radio"
                    name="aiType"
                    value="mcts"
                    checked={aiType === 'mcts'}
                    onChange={(e) => setAiType(e.target.value as 'basic' | 'mcts')}
                  />
                  MCTS AI
                </label>
              </div>
              
              {aiType === 'basic' && (
                <div className="basic-ai-config">
                  <label>Basic AI Difficulty:</label>
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
              )}
              
              <div className="config-group">
                <label>
                  <input
                    type="checkbox"
                    checked={mctsConfig.enableLogging}
                    onChange={(e) => setMctsConfig({
                      ...mctsConfig,
                      enableLogging: e.target.checked
                    })}
                  />
                  Enable AI Logging (check console)
                </label>
              </div>
              
              {aiType === 'mcts' && (
                <div className="mcts-config">
                  <div className="config-group">
                    <label>
                      Max Iterations: {mctsConfig.maxIterations}
                      <input
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={mctsConfig.maxIterations}
                        onChange={(e) => setMctsConfig({
                          ...mctsConfig,
                          maxIterations: parseInt(e.target.value)
                        })}
                      />
                    </label>
                  </div>
                  
                  <div className="config-group">
                    <label>
                      Max Depth: {mctsConfig.maxDepth}
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={mctsConfig.maxDepth}
                        onChange={(e) => setMctsConfig({
                          ...mctsConfig,
                          maxDepth: parseInt(e.target.value)
                        })}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="demo-section">
                <button 
                  onClick={runNeuralNetworkDemo}
                  className="demo-button"
                >
                  🧠 Neural Net Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
