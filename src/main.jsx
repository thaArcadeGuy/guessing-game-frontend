import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return React.createElement("h1", null, "Hello World");
}

const root = createRoot(document.getElementById("app"));

root.render(<App />); 