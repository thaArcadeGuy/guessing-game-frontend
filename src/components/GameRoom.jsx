import React, { useState, useEffect, useRef } from "react";
import PlayerList from "./PlayerList";
import QuestionDisplay from "./QuestionDisplay.jsx";
import Scoreboard from "./Scoreboard";
import ChatInterface from "./ChatInterface";

export default function GameRoom({ socket, session, onLeaveSession }) {
  const [gameState, setGameState] = useState(session.status);
  const [currentQuestion, setCurrentQuestion] = useState(session.currentQuestion || "");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [players, setPlayers] = useState(Array.from(session.players?.values() || []));
  const [gameResult, setGameResult] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use ref to track mounted state and prevent unnecessary remounts
  const isMounted = useRef(true);
  const hasHandledNewRound = useRef(false);
  
  
  const isGameMaster = socket?.id === session?.masterId;

  // Component mount/unmount - FIXED
  useEffect(() => {
    console.log('🔄 GameRoom MOUNTED - Session:', session.id);
    isMounted.current = true;
    
    return () => {
      console.log('💀 GameRoom UNMOUNTING - Session:', session.id);
      isMounted.current = false;
    };
  }, [session.id]); // Only depend on session.id

  // Debug logging
  useEffect(() => {
    console.log(`
      🎯 RENDER DEBUG:
      • gameState: ${gameState}
      • currentQuestion: ${currentQuestion ? `"${currentQuestion}"` : 'empty'}
      • players: ${players.length}
      • isGameMaster: ${isGameMaster}
      • isTransitioning: ${isTransitioning}
      • Condition (waiting && !question): ${gameState === 'waiting' && !currentQuestion}
      • hasHandledNewRound: ${hasHandledNewRound.current}
    `);
  }, [gameState, currentQuestion, players, isGameMaster, isTransitioning]);

  useEffect(() => {
    console.log('🔄 Session prop updated:', {
      id: session.id,
      status: session.status,
      currentQuestion: session.currentQuestion,
      players: session.players?.size
    });
    
    // Sync state with updated session prop
    setGameState(session.status);
    setCurrentQuestion(session.currentQuestion || "");
    setPlayers(Array.from(session.players?.values() || []));
    
    // Reset new round handling when session fundamentally changes
    if (session.status === "waiting") {
      hasHandledNewRound.current = false;
    }
  }, [session]);

  // SINGLE consolidated useEffect for ALL socket events - FIXED
  useEffect(() => {
    if (!socket || !socket.connected) {
      console.log('⚠️ Socket not ready, skipping listener setup');
      return;
    }

    console.log('🎯 Setting up socket event listeners for GameRoom');
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🆔 Socket ID:', socket.id);
    console.log('🏠 Session ID:', session.id);
    
    // Reset the flag when setting up new listeners
    hasHandledNewRound.current = false;

    // Remove any existing listeners first to prevent duplicates
    const events = [
      "session-updated", "game-started", "timer-update", "game-ended",
      "session_update", "new-round-ready", "answer-result"
    ];
    
    events.forEach(event => {
      socket.off(event);
    });

    // Session updates (player joins/leaves)
    socket.on("session-updated", (data) => {
      console.log("📋 Session updated:", data);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    // Game started
    socket.on("game-started", (data) => {
      console.log("🎮 Game started:", data);
      if (!isMounted.current) return;
      
      setGameState("in-progress");
      setCurrentQuestion(data.question);
      setTimeRemaining(data.timeRemaining || 60);
      setGameResult(null);
      setIsTransitioning(false);
      hasHandledNewRound.current = false;
    });

    // Timer update
    socket.on("timer-update", (data) => {
      if (!isMounted.current) return;
      setTimeRemaining(data.timeRemaining);
    });

    // Game ended
    socket.on("game-ended", (data) => {
      console.log("🏁 Game ended:", data);
      if (!isMounted.current) return;
      
      setGameState("ended");
      setGameResult(data);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    // Session update (general)
    socket.on("session_update", (updatedSession) => {
      console.log("📊 Session update:", updatedSession);
      if (!isMounted.current) return;
      
      setPlayers(Array.from(updatedSession.players?.values() || []));
      setGameState(updatedSession.status);
      setCurrentQuestion(updatedSession.currentQuestion || "");
    });

    // NEW ROUND READY - The CRITICAL handler! - FIXED
    socket.on("new-round-ready", (data) => {
      console.log('');
      console.log('='.repeat(80));
      console.log('🎯🎯🎯 NEW-ROUND-READY HANDLER IS EXECUTING! 🎯🎯🎯');
      console.log('='.repeat(80));
      console.log('📦 Event data received:', JSON.stringify(data, null, 2));
      console.log('🔍 Current socket ID:', socket.id);
      console.log('🔌 Socket connected:', socket.connected);
      console.log('🏠 Current session ID:', session.id);
      console.log('👤 New game master:', data.newGameMaster);
      console.log('🔄 hasHandledNewRound before:', hasHandledNewRound.current);
      console.log('🔵 isMounted:', isMounted.current);
      console.log('='.repeat(80));
      console.log('');

      // Prevent duplicate handling and ensure component is mounted
      if (hasHandledNewRound.current || !isMounted.current) {
        console.log('⚠️ Skipping new-round-ready - already handled or not mounted');
        return;
      }

      hasHandledNewRound.current = true;

      // Use batch state updates
      setGameState("waiting");
      setCurrentQuestion("");
      setTimeRemaining(60);
      setGameResult(null);
      setIsTransitioning(false);
      
      if (data.players) {
        setPlayers(data.players);
      }

      console.log('✅✅✅ ALL STATE UPDATES COMPLETED! ✅✅✅');
      console.log('🔄 hasHandledNewRound after:', hasHandledNewRound.current);

      // Notify user about new round
      if (data.newGameMaster) {
        setTimeout(() => {
          const isMeNewMaster = socket.id === data.newGameMaster.id;
          if (isMeNewMaster) {
            alert(`🎉 You are now the Game Master! It's your turn to ask a question.`);
          } else {
            alert(`🔄 New round! ${data.newGameMaster.name} is now the game master.`);
          }
        }, 100);
      }
    });

    // Answer result
    socket.on("answer-result", (data) => {
      if (data.correct) {
        console.log("✅ Correct answer!");
      } else if (data.attemptsLeft === 0) {
        alert("No more attempts left!");
      }
    });

    // Debug: Log ALL incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Socket event received: ${eventName}`, args);
      if (eventName === 'new-round-ready') {
        console.log('🚨🚨🚨 NEW-ROUND-READY EVENT DETECTED BY onAny! 🚨🚨🚨');
      }
    });

    console.log('✅ All socket event listeners registered successfully');

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      console.log('🧹 Cleaning up socket listeners in GameRoom');
      console.log('📊 State during cleanup:', { 
        gameState, 
        currentQuestion, 
        players: players.length,
        hasHandledNewRound: hasHandledNewRound.current,
        isMounted: isMounted.current
      });
      
      events.forEach(event => {
        socket.off(event);
      });
      socket.offAny();
    };
  }, [socket, session.id]); // Depend on socket and session.id

  // Add a specific effect to handle the new-round-ready state transition
  useEffect(() => {
    if (gameState === "ended" && gameResult) {
      console.log('🏁 Game ended, waiting for new round...');
      // You could add a loading state here
    }
  }, [gameState, gameResult]);

  return (
    <div className="game-room">
      {isTransitioning && (
        <div className="transition-overlay">
          <div className="transition-message">
            <h3>Starting New Round...</h3>
            <p>Please wait while we set up the next round</p>
          </div>
        </div>
      )}
      
      <div className="game-header">
        <div className="session-info">
          <h2>Game Session - Round #{players.find(p => p.isGameMaster)?.roundNumber || 1}</h2>
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
          <PlayerList players={players} currentPlayerId={socket.id} socket={socket} />
          <div className="game-state-debug">
            <h4>Current State:</h4>
            <p><strong>Game State:</strong> {gameState}</p>
            <p><strong>Question:</strong> {currentQuestion || "None"}</p>
            <p><strong>Players:</strong> {players.length}</p>
            <p><strong>Is Game Master:</strong> {isGameMaster ? "Yes" : "No"}</p>
            <p><strong>New Round Handled:</strong> {hasHandledNewRound.current ? "Yes" : "No"}</p>
          </div>
        </div>

        <div className="game-area">
          {/* Debug panel */}
          <div style={{
            background: '#333', 
            color: 'white', 
            padding: '10px', 
            marginBottom: '20px',
            borderRadius: '4px',
            fontSize: '0.8em',
            fontFamily: 'monospace'
          }}>
            <strong>🎯 RENDER DEBUG:</strong>
            <div>gameState: <span style={{color: '#ff6b6b'}}>{gameState}</span></div>
            <div>currentQuestion: <span style={{color: '#4ecdc4'}}>{currentQuestion || 'empty'}</span></div>
            <div>players: <span style={{color: '#45b7d1'}}>{players.length}</span></div>
            <div>isGameMaster: <span style={{color: '#96ceb4'}}>{isGameMaster ? 'YES' : 'NO'}</span></div>
            <div>Should show waiting: <span style={{color: gameState === 'waiting' && !currentQuestion ? '#1dd1a1' : '#ff9ff3'}}>
              {gameState === 'waiting' && !currentQuestion ? 'YES' : 'NO'}
            </span></div>
            <div>New Round Handled: <span style={{color: hasHandledNewRound.current ? '#1dd1a1' : '#ff9ff3'}}>
              {hasHandledNewRound.current ? 'YES' : 'NO'}
            </span></div>
          </div>

          {/* Waiting room */}
          {gameState === "waiting" && !currentQuestion && (
            <div className="waiting-room" style={{border: '4px solid green', padding: '20px', background: '#f0fff0'}}>
              <h3 style={{color: 'green'}}>✅ WAITING FOR NEXT ROUND</h3>
              
              <div className="round-info">
                <p>👑 <strong>Game Master:</strong> {players.find(p => p.isGameMaster)?.name || 'Loading...'}</p>
                <p><strong>Players Ready:</strong> {players.length}</p>
                <p><strong>Round:</strong> #{players.find(p => p.isGameMaster)?.roundNumber || 1}</p>
              </div>

              {isGameMaster ? (
                <div className="game-master-controls">
                  <h4>🎉 Your turn to ask a question!</h4>
                  <button
                    onClick={() => {
                      const question = prompt("Enter your question for the next round:");
                      if (!question || question.trim().length < 5) {
                        alert("Question must be at least 5 characters long");
                        return;
                      }

                      const answer = prompt("Enter the answer:");
                      if (!answer || answer.trim().length < 1) {
                        alert("Answer cannot be empty");
                        return;
                      }

                      console.log("Starting new round with:", { question, answer });
                      socket.emit("start-game", {
                        sessionId: session.id,
                        question: question.trim(),
                        answer: answer.trim()
                      });
                    }}
                    disabled={players.length < 2}
                    className="start-game-btn"
                  >
                    Start Next Round ({players.length}/2+ players)
                  </button>
                  {players.length < 2 && (
                    <p className="need-players-warning">Need at least 2 players to start</p>
                  )}
                </div>
              ) : (
                <div className="player-waiting">
                  <p>Waiting for <strong>{players.find(p => p.isGameMaster)?.name || 'Game Master'}</strong> to start the next round...</p>
                  <div className="waiting-animation">
                    <div className="loading-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="session-share">
                <p>Share this code with friends:</p>
                <div className="session-code-large" style={{fontFamily: "monospace", fontSize: "1.5em"}}>
                  {session.id}
                </div>
              </div>
            </div>
          )}

          {/* Game in progress */}
          {gameState === "in-progress" && (
            <div style={{border: '4px solid blue', padding: '20px'}}>
              <h3 style={{color: 'blue'}}>🎮 ROUND IN PROGRESS</h3>
              <QuestionDisplay
                question={currentQuestion}
                socket={socket}
                sessionId={session.id}
                isGameMaster={isGameMaster}
              />
            </div>
          )}

          {/* Game ended - waiting for next round */}
          {gameState === "ended" && gameResult && (
            <div style={{border: '4px solid orange', padding: '20px', background: '#fff9e6'}}>
              <h3 style={{color: 'orange'}}>⏳ ROUND ENDED - NEXT ROUND STARTING SOON</h3>
              <div style={{marginBottom: '20px'}}>
                <p><strong>Winner:</strong> {gameResult.winner?.name || 'No winner'}</p>
                <p><strong>Correct Answer:</strong> {gameResult.answer}</p>
                <p><strong>Next round starting...</strong></p>
                <div className="loading-spinner" style={{textAlign: 'center', margin: '20px 0'}}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              </div>
              <Scoreboard 
                players={players} 
                gameResult={gameResult}
              />
            </div>
          )}
        </div>

        <div className="chat-panel">
          <ChatInterface
            socket={socket}
            session={session}
            currentPlayerId={socket.id}
          />
        </div>
      </div>
    </div>
  );
}