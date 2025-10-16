import React from 'react';
import './ControlPanel.css';

interface ControlPanelProps {
  player1AI: boolean;
  player2AI: boolean;
  onNewGame: () => void;
  onTogglePlayer1AI: (checked: boolean) => void;
  onTogglePlayer2AI: (checked: boolean) => void;
  onOpenAIConfig: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  player1AI,
  player2AI,
  onNewGame,
  onTogglePlayer1AI,
  onTogglePlayer2AI,
  onOpenAIConfig
}) => {
  return (
    <div className="control-panel-area">
      <div className="game-buttons">
        <button className="new-game-button" onClick={onNewGame}>
          New Game
        </button>
      </div>
      
      <div className="ai-controls">
        <div className="ai-players">
          <div className="ai-player">
            <label>
              <input
                type="checkbox"
                checked={player1AI}
                onChange={(e) => onTogglePlayer1AI(e.target.checked)}
              />
              Player 1 AI
            </label>
          </div>
          <div className="ai-player">
            <label>
              <input
                type="checkbox"
                checked={player2AI}
                onChange={(e) => onTogglePlayer2AI(e.target.checked)}
              />
              Player 2 AI
            </label>
          </div>
        </div>
        <button className="ai-config-button" onClick={onOpenAIConfig}>
          AI Settings
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;