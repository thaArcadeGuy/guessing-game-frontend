import React, { useState, useEffect } from "react";

export default function QuestionDisplay({ question, socket, sessionId, isGameMaster }) {
  const [guess, setGuess] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for answer results
    socket.on("answer-result", (data) => {
      setAttemptsLeft(data.attemptsLeft);
      if (data.correct) {
        setHasAnswered(true);
      }
    });

    // Reset when new round starts
    socket.on("new-round-ready", () => {
      setGuess("");
      setAttemptsLeft(3);
      setHasAnswered(false);
    });

    return () => {
      socket.off("answer-result");
      socket.off("new-round-ready");
    };
  }, [socket]);

  const submitGuess = () => {
    if (!guess.trim()) {
      alert("Please enter your guess");
      return;
    }

    if (hasAnswered) {
      alert("You have already answered correctly!");
      return;
    }

    if (attemptsLeft <= 0) {
      alert("No more attempts left!");
      return;
    }

    socket.emit("submit-answer", { 
      answer: guess.trim() 
    }, (response) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
      }
    });

    setGuess("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      submitGuess();
    }
  };

  if (isGameMaster) {
    return (
      <div className="question-display game-master-view">
        <h3>You are the Game Master</h3>
        <div className="current-question">
          <h4>Current Question:</h4>
          <p className="question-text">{question || "No question set"}</p>
        </div>
        <div className="game-master-info">
          <p>Watch players guess your question</p>
          <p>Game will end when someone guesses correctly or time runs out</p>
        </div>
      </div>
    );
  }

  return (
    <div className="question-display">
      <div className="question-header">
        <h3>Question:</h3>
        <div className="attempts-counter">
          Attempts left: <span className={attemptsLeft <= 1 ? "warning" : ""}>{attemptsLeft}/3</span>
        </div>
      </div>
      
      <div className="question-text">{question || "Waiting for question..."}</div>
      
      {question && !hasAnswered && attemptsLeft > 0 ? (
        <div className="guess-input-section">
          <input
            type="text"
            placeholder="Enter your guess..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={hasAnswered}
            className="guess-input"
          />
          <button 
            onClick={submitGuess}
            disabled={!guess.trim() || hasAnswered}
            className="submit-guess-btn"
          >
            Submit Guess
          </button>
        </div>
      ) : hasAnswered ? (
        <div className="answer-status correct">
          You answered correctly! Waiting for other players...
        </div>
      ) : (
        <div className="answer-status no-attempts">
          No attempts left! Waiting for game to end...
        </div>
      )}
      
      <div className="guess-tips">
        <p>Tips:</p>
        <ul>
          <li>You have 3 attempts to guess the answer</li>
          <li>Answers are case-insensitive</li>
          <li>First correct guess wins the round!</li>
        </ul>
      </div>
    </div>
  );
}