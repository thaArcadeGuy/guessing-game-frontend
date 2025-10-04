import React, { useState, useEffect } from "react";
import PlayerList from "./PlayerList";
import QuestionDisplay from "./QuestionDisplay";
import Scoreboard from "./Scoreboard";

export default function GameRoom({ socket, session, onLeaveSession }) {
  const [gameState, setGameState] = useState(session.status);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [players, setPlayers] = useState(Array.from(session.players?.values() || []));

  useEffect(() => {
    if (!socket) return;

    // Listen for real time session
    socket.on("session-updated", (data) => {
      console.log("Session updated:", data);

      if (data.type === "player-joined") {
        console.log(`New player joined: ${data.playerName}`);
        alert(`${data.playerName} joined the game!`);
      }

      if (data.type === "player-left") {
        console.log(`Player left: ${data.playerName}`);
        alert(`${data.playerName} left the game`);
      }

      if(data.players) {
        setPlayers(data.players);
      }
    });



    // Game events
    socket.on("game-started", (data) => {
      setGameState("in-progress");
      setCurrentQuestion(data.question);
      setTimeRemaining(data.timeRemaining);
      setGameResult(null);
    });

    socket.on("timer-update", (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("game-ended", (data) => {
      setGameState("ended");
      setGameResult(data);
      // Update scores
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("session_update", (updatedSession) => {
      setPlayers(Array.from(updatedSession.players?.values() || []));
    });

    socket.on("new-round-ready", (data) => {
      setGameState("waiting");
      setCurrentQuestion("");
      setTimeRemaining(60);
      setGameResult(null);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("answer-result", (data) => {
      if (data.correct) {
        // 
      } else if (data.attemptsLeft === 0) {
        alert("No more attempts left!");
      }
    });

    return () => {
      socket.off("game-started");
      socket.off("timer-update");
      socket.off("game-ended");
      socket.off("session_update");
      socket.off("new-round-ready");
      socket.off("answer-result");
      socket.off("session-updated");
      socket.off("player-joined");
      socket.off("player-left");
    };
  }, [socket]);

  const isGameMaster = socket.id === session.masterId;

  return (
    <div className="game-room">
      <div className="game-header">
        <div className="session-info">
          <h2>Game Session</h2>
          <div className="session-code">Code: <strong>{session.id}</strong></div>
          <div className="game-status">Status: <span className={`status-${gameState}`}>{gameState}</span></div>
          {gameState === "in-progress" && (
            <div className="timer">
              Time: <span className={timeRemaining <= 10 ? "time-warning" : ""}>{timeRemaining}s</span>
            </div>
          )}
        </div>
        <button onClick={onLeaveSession} className="leave-btn">
          Leave Game
        </button>
      </div>

      <div className="game-layout">
        <div className="players-panel">
          <PlayerList players={players} currentPlayerId={socket.id} />
        </div>

        <div className="game-area">
          {gameState === "waiting" && (
            <div className="waiting-room">
              <h3>Waiting Room</h3>
              <div className="session-share">
                <p>Share this code with friends:</p>
                <div className="session-code-large" style={{fontFamily: "monospace", fontSize: "1.5em"}}>
                  {session.id}
                </div>
                <p><small>Make sure to copy exactly as shown</small></p>
              </div>
              
              <div className="players-count">
                Players joined: <strong>{players.length}</strong>
              </div>
              
              {isGameMaster ? (
                <div className="game-master-controls">
                  <h4>You are the Game Master</h4>
                  <p>Create a question to start the game!</p>
                  <button 
                    onClick={() => {
                      const question = prompt("Enter your question:");
                      if (!question || question.trim().length < 5) {
                        alert("Question must be at least 5 characters long");
                        return;
                      }
                      
                      const answer = prompt("Enter the answer:");
                      if (!answer || answer.trim().length < 1) {
                        alert("Answer cannot be empty");
                        return;
                      }
                      
                      socket.emit("start-game", { 
                        sessionId: session.id,
                        question: question.trim(), 
                        answer: answer.trim()
                      });
                    }}
                    disabled={players.length < 2}
                    className="start-game-btn"
                  >
                    Start Game ({players.length}/2+ players)
                  </button>
                  {players.length < 2 && (
                    <p className="need-players-warning">Need at least 2 players to start</p>
                  )}
                </div>
              ) : (
                <div className="player-waiting">
                  <p>Waiting for the game master to start the game...</p>
                  <p>Current game master: {players.find(p => p.isGameMaster)?.name}</p>
                </div>
              )}
            </div>
          )}

          {gameState === "in-progress" && (
            <QuestionDisplay
              question={currentQuestion}
              socket={socket}
              sessionId={session.id}
              isGameMaster={isGameMaster}
            />
          )}

          {gameState === "ended" && (
            <Scoreboard 
              players={players} 
              gameResult={gameResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}