import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { DrawerProvider } from "./contexts/DrawerContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DrawerProvider>
      <App />
    </DrawerProvider>
  </StrictMode>
);
