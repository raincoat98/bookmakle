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
import { useEffect, useState, useRef } from "react";
import { getUserDefaultPage } from "./firebase";
import {
  shouldBackup,
  performBackup,
  loadBackupSettings,
} from "./utils/backup";
import { useBookmarks } from "./hooks/useBookmarks";
import { useCollections } from "./hooks/useCollections";
import { useDrawer } from "./contexts/DrawerContext";
import { Drawer } from "./components/Drawer";

function App() {
  const { user, loading } = useAuth();
  const [defaultPage, setDefaultPage] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const { isDrawerOpen, setIsDrawerOpen, isDrawerClosing } = useDrawer();
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 백업을 위한 데이터 가져오기
  const { bookmarks } = useBookmarks(user?.uid || "", "all");
  const { collections, addCollection } = useCollections(user?.uid || "");

  useEffect(() => {
    if (user?.uid) {
      getUserDefaultPage(user.uid)
        .then((page) => setDefaultPage(page || "dashboard"))
        .catch(() => setDefaultPage("dashboard"));
    }
  }, [user?.uid]);

  // 자동 백업 체크
  useEffect(() => {
    // 자동 백업 타이머 클리어
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
    }

    const settings = loadBackupSettings();
    if (
      user?.uid &&
      settings.enabled &&
      bookmarks &&
      collections &&
      bookmarks.length > 0 &&
      collections.length > 0
    ) {
      // 주기(ms) 계산
      let intervalMs = 1000 * 60 * 60 * 24 * 7; // 기본: weekly
      if (settings.frequency === "daily") intervalMs = 1000 * 60 * 60 * 24;
      if (settings.frequency === "monthly")
        intervalMs = 1000 * 60 * 60 * 24 * 30;

      // 즉시 1회 실행
      if (shouldBackup()) {
        performBackup(bookmarks, collections, user.uid);
      }

      // 주기적으로 실행
      backupIntervalRef.current = setInterval(() => {
        if (shouldBackup()) {
          performBackup(bookmarks, collections, user.uid);
        }
      }, intervalMs);
    }

    // 언마운트 시 타이머 해제
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, [user?.uid, bookmarks, collections]);

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

  // Drawer에 전달할 컬렉션 추가 래퍼
  const handleDrawerAddCollection = async (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null
  ) => {
    await addCollection({
      name,
      description,
      icon,
      parentId: parentId ?? null,
    });
  };

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
          defaultPage={defaultPage || undefined}
          showMenuButton={true}
          // onMenuClick 등은 각 페이지에서 Context로 관리
        />
        <Drawer
          collections={collections}
          selectedCollection={selectedCollection}
          onCollectionChange={setSelectedCollection}
          isOpen={isDrawerOpen}
          isClosing={isDrawerClosing}
          onClose={() => setIsDrawerOpen(false)}
          onAddCollection={handleDrawerAddCollection}
          onDeleteCollectionRequest={() => {}}
          onEditCollection={() => {}}
          defaultPage={defaultPage || undefined}
        />
        <Routes>
          <Route
            path="/"
            element={
              defaultPage === "bookmarks" ? (
                <BookmarksPage />
              ) : (
                <DashboardPage />
              )
            }
          />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
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
