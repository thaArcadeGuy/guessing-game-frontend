import React, { useState, useEffect } from "react";

export default function PlayerList({ players, currentPlayerId, socket }) {
  const [notification, setNotification] = useState("");
  
  useEffect(() => {
    if (!socket) return;

    // Listen for player join/leave
    socket.on("session-updated", (data) => {
      if (data.type === "player-joined") {
        setNotification(`${data.playerName} joined`);
      } else if (data.type === "player-left") {
        setNotification("Player left")
      }

      setTimeout(() => setNotification(""), 3000);

      return () => {
        socket.off("session-updated");
      };
    }, [socket]);
  });

  return (
    <div className="player-list">
      <h3>Players ({players.length})</h3>
      
      {notification && (
        <div className="player-notification">
          {notification}
        </div>
      )}

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
              <div className="player-status">
                {player.hasAnswered ? "Answered" : "Waiting"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {players.length === 1 && (
        <div className="waiting-for-players">
          Waiting for more players to join...
        </div>
      )}
    </div>
  );
}