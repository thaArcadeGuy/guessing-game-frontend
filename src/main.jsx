import React, { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import "./styles/App.css";

function App() {
  const { socket, isConnected, error, setError } = useSocket();
  const [currentSession, setCurrentSession] = useState(null);
  const [currentView, setCurrentView] = useState("lobby"); 

  const handleJoinSession = (session) => {
    setCurrentSession(session);
    setCurrentView("game");
    setError(null);
  };

  const handleLeaveSession = () => {
    if (socket && currentSession) {
      socket.emit("leave_session", { sessionId: currentSession.id });
    }
    setCurrentSession(null);
    setCurrentView("lobby");
  };

  if (!socket) {
    return <div className="loading">Connecting to server...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Guessing Game</h1>
        <div className="connection-status">
          Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        {currentView === "lobby" && (
          <Lobby 
            socket={socket} 
            onJoinSession={handleJoinSession}
          />
        )}

        {currentView === "game" && currentSession && (
          <GameRoom
            socket={socket}
            session={currentSession}
            onLeaveSession={handleLeaveSession}
          />
        )}
      </main>
    </div>
  );
}

export default App;