import React from 'react';
import './ControlPanel.css';

interface ControlPanelProps {
  onNewGame: () => void;
  onOpenAIConfig: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onNewGame,
  onOpenAIConfig
}) => {
  return (
    <div className="control-panel-area">
      <div className="game-buttons">
        <button className="new-game-button" onClick={onNewGame}>
          New Game
        </button>
        <button className="ai-config-button" onClick={onOpenAIConfig}>
          AI Settings
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;