import React, { useState, useEffect } from "react";

export default function Lobby({ socket, onJoinSession }) {
  const [playerName, setPlayerName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for session updates
    socket.on("session_update", (session) => {
      console.log("Session updated:", session);
    });

    // Listen for errors
    socket.on("error", (error) => {
      alert(`Error: ${error.message}`);
    });

    // Load available sessions
    socket.emit("list_sessions", {}, (response) => {
      if (response.sessions) {
        setSessions(response.sessions);
      }
    });

    return () => {
      socket.off("session_update");
      socket.off("error");
    };
  }, [socket]);

  const createSession = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    console.log('=== SESSION CREATION DEBUG ===');
    console.log('1. Emitting create-session event');
    console.log('2. Player name:', playerName);
    console.log('3. Socket connected:', socket.connected);
    console.log('4. Socket ID:', socket.id);

    setIsCreating(true);
    socket.emit(
      "create-session",
      { playerName: playerName.trim() },
      (response) => {
        console.log("Server response:", response);
        setIsCreating(false);

        if (response.error) {
          alert(`Failed to create session: ${response.error}`);
        } else {
          console.log("Session created successfully:", response);

          onJoinSession({
            id: response.sessionId,
            players: [],
            status: "waiting"
          });
        }
      }
    );
  };

  const joinSession = () => {
    if (!playerName.trim() || !sessionCode.trim()) {
      alert("Please enter your name and session code");
      return;
    }

    socket.emit(
      "join-session",
      {
        sessionId: sessionCode.trim(),
        playerName: playerName.trim(),
      },
      (response) => {
        if (response.error) {
          alert(`Failed to join session: ${response.error}`);
        } else {
          onJoinSession(response.session || { 
            id: sessionCode.trim(), 
            status: "waiting" 
          });
        }
      }
    );
  };

  return (
    <div className="lobby">
      <div className="lobby-section">
        <h2>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your display name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="lobby-section">
        <h2>Create New Game</h2>
        <button
          onClick={createSession}
          disabled={!playerName.trim() || isCreating}
        >
          {isCreating ? "Creating..." : "Create New Session"}
        </button>
      </div>

      <div className="lobby-section">
        <h2>Join Existing Game</h2>
        <input
          type="text"
          placeholder="Enter session code"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
        />
        <button
          onClick={joinSession}
          disabled={!playerName.trim() || !sessionCode.trim()}
        >
          Join Session
        </button>
      </div>

      {sessions.length > 0 && (
        <div className="lobby-section">
          <h2>Available Sessions</h2>
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div>Code: {session.id}</div>
                <div>Players: {session.playerCount}</div>
                <div>Status: {session.status}</div>
                <div>Host: {session.masterName}</div>
                <button
                  onClick={() => {
                    setSessionCode(session.id);
                    if (playerName.trim()) {
                      joinSession();
                    }
                  }}
                  disabled={session.status !== "waiting"}
                >
                  {session.status === "waiting" ? "Join" : "In Progress"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
