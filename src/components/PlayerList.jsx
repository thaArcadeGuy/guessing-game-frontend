import React from "react";

export default function PlayerList({ players, currentPlayerId }) {
  return (
    <div className="player-list">
      <h3>Players ({players.length})</h3>
      <div className="players-container">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`player-card ${player.id === currentPlayerId ? "current-player" : ""} ${player.isGameMaster ? "game-master" : ""}`}
          >
            <div className="player-header">
              <span className="player-name">
                {player.name}
                {player.id === currentPlayerId && " (You)"}
                {player.isGameMaster && " 👑"}
              </span>
            </div>
            
            <div className="player-stats">
              <div className="player-score">Score: {player.score}</div>
              
              {player.hasAnswered && (
                <div className="player-status answered">Answered</div>
              )}
              
              {player.attempts > 0 && !player.hasAnswered && (
                <div className="player-status guessing">
                  Attempts: {player.attempts}/3
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}