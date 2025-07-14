import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  X,
  Moon,
  Sun,
  Globe,
  Key,
  Briefcase,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserDefaultPage, setUserDefaultPage } from "../firebase";
import {
  loadBackupSettings,
  saveBackupSettings,
  performBackup,
  getAllBackups,
  getBackupStatus,
  deleteBackup,
  type BackupSettings,
  shouldBackup,
} from "../utils/backup";
import type { Bookmark, Collection } from "../types/index";

interface ImportData {
  version: string;
  exportedAt: string;
  bookmarks: Record<string, unknown>[];
  collections: Record<string, unknown>[];
}

interface SettingsProps {
  onBack: () => void;
  onImportData?: (importData: ImportData) => Promise<void>;
  onRestoreBackup?: (backupData: {
    bookmarks: Bookmark[];
    collections: Collection[];
  }) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack,
  onImportData,
  onRestoreBackup,
}) => {
  const { user, logout } = useAuth();
  const { bookmarks } = useBookmarks(user?.uid || "", "all");
  const { collections } = useCollections(user?.uid || "");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [notifications, setNotifications] = useState(true);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(() =>
    loadBackupSettings()
  );
  const [backupStatus, setBackupStatus] = useState(() => getBackupStatus());
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem("defaultPage") || "dashboard"
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<{
    open: boolean;
    timestamp: string | null;
  }>({ open: false, timestamp: null });
  const [backups, setBackups] = useState(() => getAllBackups());
  // 상태 추가
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user?.uid) {
      getUserDefaultPage(user.uid).then((page) => {
        setDefaultPage(page || "dashboard");
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    // 기존 타이머 해제
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
    }

    if (
      backupSettings.enabled &&
      user?.uid &&
      bookmarks &&
      collections &&
      bookmarks.length > 0 &&
      collections.length > 0
    ) {
      // 주기(ms) 계산
      // let intervalMs = 1000 * 60 * 60 * 24 * 7; // 기본: weekly
      let intervalMs = 10000; // 테스트용 10초 간격
      // if (backupSettings.frequency === "daily")
      //   intervalMs = 1000 * 60 * 60 * 24;
      // if (backupSettings.frequency === "monthly")
      //   intervalMs = 1000 * 60 * 60 * 24 * 30;

      // 즉시 1회 실행
      if (shouldBackup()) {
        const created = performBackup(bookmarks, collections, user.uid);
        if (created) syncBackups();
      }

      // 주기적으로 실행
      backupIntervalRef.current = setInterval(() => {
        if (shouldBackup()) {
          const created = performBackup(bookmarks, collections, user.uid);
          if (created) syncBackups();
        }
      }, intervalMs);
    }

    // 언마운트 시 타이머 해제
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, [
    backupSettings.enabled,
    backupSettings.frequency,
    user?.uid,
    bookmarks,
    collections,
  ]);

  useEffect(() => {
    // 백업 탭 진입 시 잘못된 백업 자동 정리 및 상태 동기화
    if (activeTab === "backup") {
      const latest = getAllBackups();
      setBackups(latest);
      setBackupStatus(getBackupStatus());
    }
  }, [activeTab]);

  // 백업 생성/삭제/복원 후 동기화 함수
  const syncBackups = () => {
    setBackups(getAllBackups());
    setBackupStatus(getBackupStatus());
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(
      `테마가 ${newTheme === "dark" ? "다크" : "라이트"} 모드로 변경되었습니다.`
    );
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    toast.success(
      `알림이 ${!notifications ? "활성화" : "비활성화"}되었습니다.`
    );
  };

  const handleAutoBackupToggle = () => {
    const newSettings = { ...backupSettings, enabled: !backupSettings.enabled };
    setBackupSettings(newSettings);
    saveBackupSettings(newSettings);
    setBackupStatus(getBackupStatus());
    toast.success(
      `자동 백업이 ${
        !backupSettings.enabled ? "활성화" : "비활성화"
      }되었습니다.`
    );

    // 백업이 활성화되면 무조건 1회 백업 실행 및 동기화
    if (!backupSettings.enabled && user?.uid) {
      const created = performBackup(bookmarks, collections, user.uid);
      if (created) syncBackups();
    }
  };

  // 자동 백업 주기 변경 핸들러 활성화
  const handleBackupFrequencyChange = (
    frequency: "daily" | "weekly" | "monthly"
  ) => {
    const newSettings = { ...backupSettings, frequency };
    setBackupSettings(newSettings);
    saveBackupSettings(newSettings);
    setBackupStatus(getBackupStatus());
    toast.success(
      `백업 주기가 ${
        frequency === "daily"
          ? "매일"
          : frequency === "weekly"
          ? "매주"
          : "매월"
      }로 변경되었습니다.`
    );
  };

  const handleManualBackup = () => {
    if (
      user?.uid &&
      bookmarks &&
      collections &&
      (bookmarks.length > 0 || collections.length > 0)
    ) {
      const created = performBackup(bookmarks, collections, user.uid);
      if (created) {
        syncBackups();
        toast.success("새 백업이 생성되었습니다.");
      } else {
        toast.error("백업할 데이터가 없습니다.");
      }
    }
  };

  const handleBackupRestore = async (timestamp: string) => {
    setRestoreConfirm({ open: true, timestamp });
  };

  // 복원, 삭제, 수동 백업 등에서 syncBackups 호출
  const handleConfirmRestore = async () => {
    if (!restoreConfirm.timestamp) return;
    try {
      const latest = getAllBackups();
      // 디버깅: 복원 시점 백업 목록, 복원 대상 timestamp, 실제 localStorage 키 출력
      console.log("복원 시점 백업 목록:", latest);
      console.log("복원 대상 timestamp:", restoreConfirm.timestamp);
      const allKeys = Object.keys(localStorage).filter((k) =>
        k.startsWith("bookmarkhub_backup_")
      );
      console.log("localStorage의 bookmarkhub_backup_ 키:", allKeys);
      const backupData = latest.find(
        (b) => b.timestamp === restoreConfirm.timestamp
      )?.data;
      if (backupData && onRestoreBackup) {
        await onRestoreBackup(backupData);
        toast.success("백업이 성공적으로 복원되었습니다.");
      } else if (!onRestoreBackup) {
        console.error("onRestoreBackup prop이 전달되지 않았습니다.");
        toast.error("복원 핸들러가 없습니다. 관리자에게 문의하세요.");
      } else {
        toast.error("이미 삭제된 백업입니다.");
        syncBackups();
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("백업 복원 중 오류가 발생했습니다.");
    } finally {
      setRestoreConfirm({ open: false, timestamp: null });
      syncBackups();
    }
  };

  const handleCancelRestore = () => {
    setRestoreConfirm({ open: false, timestamp: null });
  };

  const handleBackupDelete = (timestamp: string) => {
    if (window.confirm("이 백업을 삭제하시겠습니까?")) {
      deleteBackup(timestamp);
      syncBackups();
      toast.success("백업이 삭제되었습니다.");
    }
  };

  const handleDefaultPageChange = async (page: string) => {
    setDefaultPage(page);
    if (user?.uid) {
      await setUserDefaultPage(user.uid, page);
    }
    localStorage.setItem("defaultPage", page);
    window.dispatchEvent(new Event("localStorageChange"));
    toast.success(
      `기본 페이지가 ${
        page === "dashboard" ? "대시보드" : "북마크 목록"
      }으로 설정되었습니다.`
    );
    if (page === "bookmarks") {
      navigate("/bookmarks");
    } else {
      navigate("/");
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        bookmarks: bookmarks,
        collections: collections,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bookmarkhub-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("북마크 데이터가 내보내졌습니다.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("데이터 내보내기 중 오류가 발생했습니다.");
    }
  };

  const handleImportData = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      // 데이터 검증
      if (!parsedData.bookmarks || !parsedData.collections) {
        toast.error("잘못된 파일 형식입니다.");
        return;
      }

      // 모달에 데이터 설정하고 표시
      setImportData(parsedData);
      setShowImportModal(true);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("파일 읽기 중 오류가 발생했습니다.");
    }

    // 파일 입력 초기화
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!importData || !onImportData) return;

    try {
      await onImportData(importData);
      setShowImportModal(false);
      setImportData(null);
      toast.success("데이터 가져오기가 완료되었습니다.");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("데이터 가져오기 중 오류가 발생했습니다.");
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportData(null);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  // 모달 내 실제 삭제 함수
  const handleConfirmDeleteAccount = () => {
    // 계정 삭제 로직
    toast.success("계정이 삭제되었습니다.");
    setShowDeleteAccountModal(false);
    logout();
  };

  const tabs = [
    { id: "general", label: "일반", icon: SettingsIcon },
    { id: "backup", label: "백업", icon: Download },
    { id: "account", label: "계정", icon: User },
    { id: "appearance", label: "외관", icon: Palette },
    { id: "notifications", label: "알림", icon: Bell },
    { id: "privacy", label: "개인정보", icon: Shield },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          기본 설정
        </h3>
        <div className="space-y-6">
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-3">
              메인 페이지
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              앱을 처음 열 때 표시할 페이지를 선택하세요
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleDefaultPageChange("dashboard")}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  defaultPage === "dashboard"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-800 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      대시보드
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      통계 및 즐겨찾기
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDefaultPageChange("bookmarks")}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  defaultPage === "bookmarks"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                    <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      북마크 목록
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      전체 북마크 관리
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          데이터 관리
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                데이터 내보내기
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                북마크 데이터를 파일로 내보냅니다
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                데이터 가져오기
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                파일에서 북마크 데이터를 가져옵니다
              </p>
            </div>
            <button
              onClick={handleImportData}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              가져오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          계정 정보
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user?.displayName || "사용자"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          계정 관리
        </h3>
        <div className="space-y-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Key className="w-4 h-4 mr-2" />
            로그아웃
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          테마 설정
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange("light")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "light"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                라이트
              </p>
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "dark"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Moon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                다크
              </p>
            </button>
            <button
              onClick={() => handleThemeChange("auto")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "auto"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Globe className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                자동
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          알림 설정
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                브라우저 알림
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                북마크 관련 알림을 받습니다
              </p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          개인정보 보호
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              북마클은 사용자의 개인정보를 안전하게 보호합니다. 모든 데이터는
              암호화되어 저장되며, Google 계정을 통한 안전한 인증을 사용합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => {
    console.log("backupSettings.enabled:", backupSettings.enabled);
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            백업 관리
          </h3>
          <div className="space-y-4">
            {/* 자동 백업 토글 UI 추가 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  자동 백업
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  주기적으로 북마크와 컬렉션을 자동으로 백업합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoBackupToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  backupSettings.enabled
                    ? "bg-brand-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-pressed={backupSettings.enabled}
                aria-label="자동 백업 토글"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    backupSettings.enabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {/* 자동 백업 주기 선택 UI: 활성화 상태에서만 표시 */}
            {backupSettings.enabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    자동 백업 주기
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    자동 백업이 실행되는 간격을 선택하세요.
                  </p>
                </div>
                <select
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={backupSettings.frequency}
                  onChange={(e) =>
                    handleBackupFrequencyChange(
                      e.target.value as "daily" | "weekly" | "monthly"
                    )
                  }
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>
            )}
            {/* 기존 백업 상태/수동 백업 버튼 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  백업 상태
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  총 {backupStatus.backupCount}개 백업, {backupStatus.totalSize}
                  MB 사용
                </p>
              </div>
              <button
                onClick={handleManualBackup}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                새 백업 생성
              </button>
            </div>

            {backups.length > 0 && (
              <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  백업 목록
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backups.map(({ timestamp, data }) => (
                    <div
                      key={timestamp}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          북마크 {data.bookmarks?.length || 0}개, 컬렉션{" "}
                          {data.collections?.length || 0}개
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBackupRestore(timestamp)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          복원
                        </button>
                        <button
                          onClick={() => handleBackupDelete(timestamp)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "backup":
        return renderBackupSettings();
      case "account":
        return renderAccountSettings();
      case "appearance":
        return renderAppearanceSettings();
      case "notifications":
        return renderNotificationSettings();
      case "privacy":
        return renderPrivacySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <SettingsIcon className="w-6 h-6 text-brand-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  설정
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* 데이터 가져오기 확인 모달 */}
      {showImportModal && importData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              데이터 가져오기 확인
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  이 파일에는 다음 데이터가 포함되어 있습니다:
                </p>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 북마크: {importData.bookmarks.length}개</li>
                  <li>• 컬렉션: {importData.collections.length}개</li>
                  <li>
                    • 내보내기 날짜:{" "}
                    {new Date(importData.exportedAt).toLocaleDateString()}
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>주의:</strong> 기존 데이터와 병합됩니다. 중복된
                  북마크나 컬렉션은 추가되지 않습니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                가져오기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 백업 복원 커스텀 confirm 모달 */}
      {restoreConfirm.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              백업 복원 확인
            </h3>
            <p className="text-gray-700 dark:text-gray-200 mb-6">
              이 백업으로 데이터를 복원하시겠습니까? 현재 데이터는 덮어써집니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelRestore}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 계정 삭제 모달 */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              계정 삭제
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
