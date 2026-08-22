// MUST stay first: installs Node-global shims before any dependency evaluates.
import "./polyfills";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { ConsoleLogDrawer } from "./components/ConsoleLogDrawer";
import { taruviConfigError } from "./taruviClient";

// Mount ConsoleLogDrawer in its own root before the main app so it can capture
// errors that occur during App's initial render. No flushSync needed — at module
// load time React renders synchronously on the first paint anyway.
const drawerContainer = document.getElementById("console-log-drawer-root") as HTMLElement;
createRoot(drawerContainer).render(<ConsoleLogDrawer />);

const container = document.getElementById("root") as HTMLElement;

// A configuration failure must never be a blank page: render a readable
// explanation instead of mounting an app that cannot reach its backend.
function ConfigErrorPanel({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        fontFamily: "'Open Sans', sans-serif",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontFamily: "'Quicksand', sans-serif", margin: 0 }}>
        TaruviBase configuration missing
      </h2>
      <p style={{ maxWidth: 480, color: "#555", margin: 0 }}>{message}</p>
    </div>
  );
}

createRoot(container).render(
  <React.StrictMode>
    {taruviConfigError ? <ConfigErrorPanel message={taruviConfigError} /> : <App />}
  </React.StrictMode>
);
