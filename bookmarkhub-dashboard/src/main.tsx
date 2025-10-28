import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { DrawerProvider } from "./contexts/DrawerContext";
import { AuthProvider } from "./contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <DrawerProvider>
        <App />
      </DrawerProvider>
    </AuthProvider>
  </StrictMode>
);
