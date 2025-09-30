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
    return (
      <div className="loading">
        <div>Connecting to {config.socketUrl}...</div>
        <div className="environment-badge">{config.environment}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>🎯 {config.appName}</h1>
          <div className="app-version">v{config.appVersion}</div>
        </div>
        
        <div className="connection-info">
          <div className="connection-status">
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            {socket && ` (ID: ${socket.id})`}
          </div>
          <div className="environment-info">
            <span className={`environment-badge ${config.environment}`}>
              {config.environment}
            </span>
            <span className="server-url">
              {config.socketUrl.replace("https://", "").replace("http://", "")}
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
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

      {/* Development-only debug info */}
      {config.isDevelopment && (
        <footer className="dev-footer">
          <details>
            <summary>🔧 Development Info</summary>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </details>
        </footer>
      )}
    </div>
  );
}

export default App;