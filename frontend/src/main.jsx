import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/fonts.css";
import "./styles/globals.css";
import "./styles/theme.css";
import "./styles/dashboard.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
