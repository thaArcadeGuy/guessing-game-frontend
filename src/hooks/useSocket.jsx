import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import config from "../utils/config";

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`🔌 Connecting to: ${config.socketUrl}`);
    console.log(`🌍 Environment: ${config.environment}`);

    const newSocket = io(config.socketUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      ...(config.isProduction && {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      })
    });

    newSocket.on("connect", () => {
      console.log("Connected to server", config.socketUrl);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from server", reason);
      setIsConnected(false);

      if (config.isProduction && reason === "transport close") {
        console.log("Attempting to reconnect...");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      setError(`Cannot connect to server: ${config.socketUrl}`);

      if (config.isDevelopment && error.message.includes("ECONNREFUSED")) {
        setError(`Development: Make sure backend is running on ${config.socketUrl}`);
      }
    });

    newSocket.on("error", (errorData) => {
      console.error("Server error:", errorData);
      setError(errorData.message);
    });

    if (config.enableDebug || config.isDevelopment) {
      newSocket.onAny((event, ...args) => {
        console.log("Socket Event:", event, args);
      });
    }

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.close();
    };
  }, []);

  return { socket, isConnected, error, setError };
}