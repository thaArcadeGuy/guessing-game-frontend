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

    // Game events
    socket.on("game-started", (data) => {
      setGameState("in-progress");
      setCurrentQuestion(data.question);
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("timer-update", (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("game-ended", (data) => {
      setGameState("ended");
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
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("answer-result", (data) => {
      if (data.correct) {
        alert("Correct! You won this round!");
      } else {
        alert(`Wrong! ${data.attemptsLeft} attempts left`);
      }
    });

    return () => {
      socket.off("game-started");
      socket.off("timer-update");
      socket.off("game-ended");
      socket.off("session_update");
      socket.off("new-round-ready");
      socket.off("answer-result");
    };
  }, [socket]);

  const isGameMaster = socket.id === session.masterId;

  return (
    <div className="game-room">
      <div className="game-header">
        <div className="session-info">
          <h2>Session: {session.id}</h2>
          <div>Status: {gameState}</div>
          {gameState === "in-progress" && (
            <div className="timer">Time: {timeRemaining}s</div>
          )}
        </div>
        <button onClick={onLeaveSession} className="leave-btn">
          Leave Session
        </button>
      </div>

      <div className="game-layout">
        <div className="players-panel">
          <PlayerList players={players} currentPlayerId={socket.id} />
        </div>

        <div className="game-area">
          {gameState === "waiting" && (
            <div className="waiting-room">
              <h3>Waiting for players...</h3>
              <p>Share this code with friends: <strong>{session.id}</strong></p>
              <p>Players joined: {players.length}</p>
              
              {isGameMaster && (
                <div className="game-master-controls">
                  <p>You are the Game Master</p>
                  <button 
                    onClick={() => {
                      const question = prompt("Enter your question:");
                      const answer = prompt("Enter the answer:");
                      if (question && answer) {
                        socket.emit("start-game", { 
                          sessionId: session.id,
                          question, 
                          answer 
                        });
                      }
                    }}
                    disabled={players.length < 2}
                  >
                    Start Game ({players.length}/2+ players)
                  </button>
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
            <Scoreboard players={players} />
          )}
        </div>
      </div>
    </div>
  );
}