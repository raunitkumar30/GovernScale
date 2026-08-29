import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./pages/auth/AuthContext";
import { clearGovernScaleData } from "./utils/localStorage";
import { ensureHierarchySeeded, resetHierarchyData } from "./data/hierarchy";

import "./index.css";

// Auto seed Phase 1 Organization Skeleton on load
ensureHierarchySeeded();

// Global convenience method for clearing localStorage directly
window.clearGovernScale = () => {
  clearGovernScaleData();
  resetHierarchyData();
  localStorage.clear();
  console.log("GovernScale localStorage cleared successfully.");
  window.location.reload();
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);