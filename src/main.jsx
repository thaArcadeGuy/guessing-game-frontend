// import React, { useState } from "react";
// import { useSocket } from "./hooks/useSocket";
// import Lobby from "./components/Lobby";
// import GameRoom from "./components/GameRoom";
// import config from "./utils/config";
// import "./styles/App.css";

// function App() {
//   const { socket, isConnected, error, setError } = useSocket();
//   const [currentSession, setCurrentSession] = useState(null);
//   const [currentView, setCurrentView] = useState("lobby"); 

//   const handleJoinSession = (session) => {
//     setCurrentSession(session);
//     setCurrentView("game");
//     setError(null);
//   };

//   const handleLeaveSession = () => {
//     if (socket && currentSession) {
//       socket.emit("leave_session", { sessionId: currentSession.id });
//     }
//     setCurrentSession(null);
//     setCurrentView("lobby");
//   };

//   if (!socket) {
//     return (
//       <div className="loading">
//         <div>Connecting to {config.socketUrl}...</div>
//         <div className="environment-badge">{config.environment}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="app">
//       <header className="app-header">
//         <div className="app-title">
//           <h1>{config.appName}</h1>
//           <div className="app-version">v{config.appVersion}</div>
//         </div>
        
//         <div className="connection-info">
//           <div className="connection-status">
//             Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
//             {socket && ` (ID: ${socket.id})`}
//           </div>
//           <div className="environment-info">
//             <span className={`environment-badge ${config.environment}`}>
//               {config.environment}
//             </span>
//             <span className="server-url">
//               {config.socketUrl.replace("https://", "").replace("http://", "")}
//             </span>
//           </div>
//         </div>
//       </header>

//       {error && (
//         <div className="error-banner">
//           <div className="error-content">
//             <span>{error}</span>
//             <button onClick={() => setError(null)}>×</button>
//           </div>
//         </div>
//       )}

//       <main className="app-main">
//         {currentView === "lobby" && (
//           <Lobby 
//             socket={socket} 
//             onJoinSession={handleJoinSession}
//           />
//         )}

//         {currentView === "game" && currentSession && (
//           <GameRoom
//             socket={socket}
//             session={currentSession}
//             onLeaveSession={handleLeaveSession}
//           />
//         )}
//       </main>

//       {/* Development-only debug info */}
//       {config.isDevelopment && (
//         <footer className="dev-footer">
//           <details>
//             <summary>Development Info</summary>
//             <pre>{JSON.stringify(config, null, 2)}</pre>
//           </details>
//         </footer>
//       )}
//     </div>
//   );
// }

// export default App;

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import config from "./utils/config";
import "./styles/App.css";

function App() {
  const { socket, isConnected, error, setError } = useSocket();
  const [currentSession, setCurrentSession] = useState(null);
  const [currentView, setCurrentView] = useState("lobby");
  
  // Use ref to keep session stable and prevent remounting
  const sessionRef = useRef(null);

  // Stable handleJoinSession using useCallback
  const handleJoinSession = useCallback((session) => {
    console.log('📥 Joining session:', session);
    sessionRef.current = session;
    setCurrentSession(session);
    setCurrentView("game");
    setError(null);
  }, [setError]);

  // Stable handleLeaveSession using useCallback
  const handleLeaveSession = useCallback(() => {
    console.log('👋 Leaving session');
    if (socket && sessionRef.current) {
      socket.emit("leave_session", { sessionId: sessionRef.current.id });
    }
    sessionRef.current = null;
    setCurrentSession(null);
    setCurrentView("lobby");
  }, [socket]);

  // Listen for session updates from server WITHOUT causing remount
  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = (updatedSession) => {
      console.log('📊 Session update received in App:', updatedSession);
      
      // Only update if we're in a game and the session ID matches
      if (sessionRef.current && updatedSession.id === sessionRef.current.id) {
        // Update the ref but DON'T call setCurrentSession
        // This keeps the reference stable
        sessionRef.current = {
          ...sessionRef.current,
          ...updatedSession
        };
        
        console.log('✅ Session ref updated without remounting GameRoom');
      }
    };

    socket.on("session_update", handleSessionUpdate);

    return () => {
      socket.off("session_update", handleSessionUpdate);
    };
  }, [socket]);

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
          <h1>{config.appName}</h1>
          <div className="app-version">v{config.appVersion}</div>
        </div>
        
        <div className="connection-info">
          <div className="connection-status">
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            {socket && ` (ID: ${socket.id})`}
          </div>
          <div className="connection-info">
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
            <summary>Development Info</summary>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </details>
        </footer>
      )}
    </div>
  );
}

export default App;