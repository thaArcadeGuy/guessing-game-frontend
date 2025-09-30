import React, { useState, useEffect } from "react";

export default function Lobby({ socket, onJoinSession }) {
  const [playerName, setPlayerName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);

  const listSessions = () => {
    socket.emit("list-sessions", {}, (response) => {
      console.log("📋 Available sessions:", response);
      if (response && response.sessions) {
        setAvailableSessions(response.sessions);
        console.log("Sessions loaded:", response.sessions.length);
      } else if (response && response.error) {
        console.log("Error loading sessions:", response.error);
      }
    });

    socket.once("sessions-list", (data) => {
      console.log("Sessions list event:", data);
      if (data.sessions) {
        setAvailableSessions(data.sessions);
      }
    });
  };

  useEffect(() => {
    listSessions();
  }, [socket]);

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

    console.log("Creating session...");
    console.log("Player name:", playerName);
    console.log("Socket ID:", socket.id);


    setIsCreating(true);

    socket.emit(
      "create-session",
      { playerName: playerName.trim() },
      (response) => {
        console.log("Server response:", response);
        setIsCreating(false);

        if (response && response.error) {
          alert(`Failed to create session: ${response.error}`);
        } else if (response && response.sessionId) {
          console.log("Session created successfully:", response);
          console.log("Session ID:", response.sessionId);

          // Store the session ID exactly as received from backend
          setSessionCode(response.sessionId);

          onJoinSession(response.session);
        } else {
          console.log("Unexpected response:", response);
          alert("Failed to create session - no response received");
        }
      }
    );
  };

  const joinSession = () => {
    if (!playerName.trim() || !sessionCode.trim()) {
      alert("Please enter your name and session code");
      return;
    }

    console.log("🔄 Joining session...");
    console.log("Session code:", sessionCode);
    console.log("Player name:", playerName);
    console.log("Socket ID:", socket.id);

    socket.emit(
      "join-session",
      {
        sessionId: sessionCode.trim(),
        playerName: playerName.trim(),
      },
      (response) => {
        console.log("📨 Join session callback:", response);
        if (response && response.error) {
          console.log("Join failed:", response.error);
          alert(`Failed to join session: ${response.error}`);
        } else if (response && response.session) {
          console.log("Joined session successfully!");
          console.log("Session:", response.session);
          onJoinSession(response.session);
        } else {
          console.log("Unexpected response:", response);
          alert("Failed to join session - no response received");
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
          <button onClick={listSessions}>Refresh Sessions</button>
          <div className="sessions-list">
            {availableSessions.map(session => (
              <div key={session.id} className="session-item">
                <div>ID: {session.id}</div>
                <div>Players: {session.playerCount}</div>
                <div>Status: {session.status}</div>
                <button onClick={() => {
                  setSessionCode(session.id);
                  if (playerName.trim()) joinSession();
                }}>
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
