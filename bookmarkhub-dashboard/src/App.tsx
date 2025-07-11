import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/Header";
import { useEffect, useState } from "react";
import { getUserDefaultPage } from "./firebase";

function App() {
  const { user, loading } = useAuth();
  const [defaultPage, setDefaultPage] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getUserDefaultPage(user.uid)
        .then((page) => setDefaultPage(page || "dashboard"))
        .catch(() => setDefaultPage("dashboard"));
    }
  }, [user?.uid]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "defaultPage") {
        setDefaultPage(e.newValue || "dashboard");
      }
    };
    const handleLocalStorageChange = () => {
      // Firestore에서 다시 불러오도록 트리거
      if (user?.uid) {
        getUserDefaultPage(user.uid)
          .then((page) => setDefaultPage(page || "dashboard"))
          .catch(() => setDefaultPage("dashboard"));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageChange", handleLocalStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleLocalStorageChange
      );
    };
  }, [user?.uid]);

  if (loading || (user && defaultPage === null)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          defaultPage={defaultPage}
          showMenuButton={true}
          onMenuClick={() => setIsDrawerOpen(true)}
        />
        <Routes>
          <Route
            path="/"
            element={
              defaultPage === "bookmarks" ? (
                <BookmarksPage
                  isDrawerOpen={isDrawerOpen}
                  setIsDrawerOpen={setIsDrawerOpen}
                />
              ) : (
                <DashboardPage
                  isDrawerOpen={isDrawerOpen}
                  setIsDrawerOpen={setIsDrawerOpen}
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
              />
            }
          />
          <Route
            path="/bookmarks"
            element={
              <BookmarksPage
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </Router>
  );
}

export default App;
