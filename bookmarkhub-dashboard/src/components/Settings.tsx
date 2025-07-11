import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
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

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem("defaultPage") || "dashboard"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

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
    setAutoBackup(!autoBackup);
    toast.success(
      `자동 백업이 ${!autoBackup ? "활성화" : "비활성화"}되었습니다.`
    );
  };

  const handleDefaultPageChange = (page: string) => {
    setDefaultPage(page);
    localStorage.setItem("defaultPage", page);
    toast.success(
      `기본 페이지가 ${
        page === "dashboard" ? "대시보드" : "북마크 목록"
      }으로 설정되었습니다.`
    );
  };

  const handleExportData = () => {
    // 북마크 데이터 내보내기 로직
    toast.success("북마크 데이터가 내보내졌습니다.");
  };

  const handleImportData = () => {
    // 북마크 데이터 가져오기 로직
    toast.success("북마크 데이터가 가져와졌습니다.");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      // 계정 삭제 로직
      toast.success("계정이 삭제되었습니다.");
      logout();
    }
  };

  const tabs = [
    { id: "general", label: "일반", icon: SettingsIcon },
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

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                자동 백업
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                북마크 데이터를 자동으로 백업합니다
              </p>
            </div>
            <button
              onClick={handleAutoBackupToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoBackup ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoBackup ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
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

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
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
    </div>
  );
};
