import React, { useState, useEffect, useRef } from "react";

export default function ChatInterface({ socket, session, currentPlayerId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Listen for chat messages
    socket.on("chat-message", (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        playerName: data.playerName,
        message: data.message,
        timestamp: new Date(),
        isOwn: data.playerId === currentPlayerId
      }]);
    });

    // Listen for game events to display in chat
    socket.on("player-joined", (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: "system",
        message: `${data.players.find(p => p.id === data.playerId)?.name || "A player"} joined the game!`,
        timestamp: new Date()
      }]);
    });

    socket.on("player-left", (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: "system", 
        message: `${data.playerName || "A player"} left the game`,
        timestamp: new Date()
      }]);
    });

    socket.on("game-started", (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: "system",
        message: `Game started! Question: "${data.question}"`,
        timestamp: new Date()
      }]);
    });

    socket.on("game-ended", (data) => {
      if (data.winner) {
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: "system",
          message: `${data.winner.name} won the round! Answer: ${data.answer}`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: "system",
          message: `Time"s up! Answer: ${data.answer}`,
          timestamp: new Date()
        }]);
      }
    });

    return () => {
      socket.off("chat-message");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("game-started");
      socket.off("game-ended");
    };
  }, [socket, currentPlayerId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("chat-message", {
      sessionId: session.id,
      message: newMessage.trim()
    });

    setNewMessage("");
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h4>Game Chat</h4>
      </div>
      
      <div className="messages-container">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${msg.type || ""} ${msg.isOwn ? "own-message" : ""}`}
          >
            {msg.type === "system" ? (
              <div className="system-message">
                {msg.message}
              </div>
            ) : (
              <div className="player-message">
                <div className="message-header">
                  <span className="player-name">{msg.playerName}</span>
                  <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={200}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}