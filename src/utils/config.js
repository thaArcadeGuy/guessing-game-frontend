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

  // Platform
  platform: "vercel",
  
  // Feature Flags (optional)
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === "true",
};

// Validation
if (!config.apiUrl) {
  console.warn("VITE_API_URL is not set, using default:", config.apiUrl);
}

if (config.isProduction && config.socketUrl.includes("localhost")) {
  console.warn("Production environment using localhost - check VITE_SOCKET_URL");
}

// Log configuration in development
if (config.isDevelopment) {
  console.log("App Configuration:", {
    ...config,
    // Don"t log full URLs in production
    apiUrl: config.isDevelopment ? config.apiUrl : "[hidden]",
    socketUrl: config.isDevelopment ? config.socketUrl : "[hidden]"
  });
}

export default config;