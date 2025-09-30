import React, { useState, useEffect } from "react";

export default function Scoreboard({ players, gameResult }) {
  const [sortedPlayers, setSortedPlayers] = useState([]);

  useEffect(() => {
    // Sort players by score (descending)
    const sorted = [...players].sort((a, b) => b.score - a.score);
    setSortedPlayers(sorted);
  }, [players]);

  const getRankEmoji = (index) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `${index + 1}.`;
    }
  };

  return (
    <div className="scoreboard">
      <h3>Round Results</h3>
      
      {gameResult && gameResult.winner && (
        <div className="winner-announcement">
          <div className="winner-trophy">🏆</div>
          <h2>Congratulations {gameResult.winner.name}!</h2>
          <p>They guessed the correct answer and earned 10 points!</p>
          <div className="correct-answer">
            The answer was: <strong>{gameResult.answer}</strong>
          </div>
        </div>
      )}

      {gameResult && !gameResult.winner && (
        <div className="timeout-announcement">
          <div className="timeout-icon">⏰</div>
          <h2>Time"s Up!</h2>
          <p>No one guessed the correct answer in time.</p>
          <div className="correct-answer">
            The answer was: <strong>{gameResult.answer}</strong>
          </div>
        </div>
      )}

      <div className="leaderboard">
        <h4>Leaderboard</h4>
        <div className="players-ranking">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`ranking-item ${index < 3 ? "top-three" : ""}`}
            >
              <div className="rank">
                {getRankEmoji(index)}
              </div>
              
              <div className="player-info">
                <span className="player-name">
                  {player.name}
                  {player.isGameMaster && " 👑"}
                </span>
              </div>
              
              <div className="player-score">
                {player.score} points
              </div>
              
              <div className="round-stats">
                {player.hasAnswered ? (
                  <span className="stat correct">Correct</span>
                ) : player.attempts > 0 ? (
                  <span className="stat incorrect">
                    {player.attempts} attempt{player.attempts !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="stat no-guess">No guess</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="next-round-info">
        <p>Next round starting soon...</p>
        <p>The game master will change for the next round!</p>
      </div>
    </div>
  );
}