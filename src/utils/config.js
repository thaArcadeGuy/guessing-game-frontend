const config = {
  // App Info
  appName: import.meta.env.VITE_APP_NAME || "Guessing Game",
  appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
  
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:4000",
  socketUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:4000",
  
  // Environment
  environment: import.meta.env.VITE_NODE_ENV || "development",
  isDevelopment: import.meta.env.VITE_NODE_ENV === "development",
  isProduction: import.meta.env.VITE_NODE_ENV === "production",
  
  // Feature Flags (optional)
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === "true",
};

// Validation
if (!config.apiUrl) {
  console.warn("VITE_API_URL is not set, using default:", config.apiUrl);
}

if (!config.socketUrl) {
  console.warn("VITE_SOCKET_URL is not set, using default:", config.socketUrl);
}

// Log configuration in development
if (config.isDevelopment) {
  console.log("App Configuration:", config);
}

export default config;