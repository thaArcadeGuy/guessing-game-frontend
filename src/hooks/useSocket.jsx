import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import config from "../utils/config";

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use ref to prevent recreation on re-renders
  const socketRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple socket instances
    if (isInitialized.current) {
      console.log('⚠️ Socket already initialized, skipping');
      return;
    }

    console.log(`🔌 Connecting to: ${config.socketUrl}`);
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`🚀 Platform: ${config.platform}`);

    const newSocket = io(config.socketUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      ...(config.isProduction && {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      })
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to server", config.socketUrl);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server", reason);
      setIsConnected(false);

      if (config.isProduction && reason === "transport close") {
        console.log("🔄 Attempting to reconnect...");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("⚠️ Connection error:", error.message);
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (config.isProduction) {
        setError(`Connection issue (attempt ${newRetryCount}). Retrying...`);
      } else {
        setError(`Cannot connect to ${config.socketUrl}. Make sure backend is running.`);
      }
    });

    newSocket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    newSocket.on("reconnect_failed", () => {
      setError("Failed to connect to server. Please refresh the page.");
    });

    newSocket.on("error", (errorData) => {
      console.error("⚠️ Server error:", errorData);
      setError(errorData.message);
    });

    if (config.enableDebug || config.isDevelopment) {
      newSocket.onAny((event, ...args) => {
        console.log("📡 Socket Event:", event, args);
      });
    }

    socketRef.current = newSocket;
    isInitialized.current = true;
    setSocket(newSocket);

    // CRITICAL: Only cleanup on actual unmount (when app closes)
    return () => {
      console.log("🧹 Cleaning up socket connection (app unmounting)");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []); // Empty array - only run once

  return { socket, isConnected, error, setError };
}