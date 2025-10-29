import React from "react";
import { useTranslation } from "../../../node_modules/react-i18next";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  notifications: boolean;
  bookmarkNotifications: boolean;
  browserNotificationPermission: any;
  onNotificationToggle: () => void;
  onBookmarkNotificationToggle: () => void;
  onTestNotification: () => void;
  onNavigateToNotifications: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notifications,
  bookmarkNotifications,
  browserNotificationPermission,
  onNotificationToggle,
  onBookmarkNotificationToggle,
  onTestNotification,
  onNavigateToNotifications,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("settings.notifications")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t("settings.browserNotifications")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("settings.browserNotificationsDescription")}
              </p>
              {browserNotificationPermission.denied && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {t("notifications.permissionDenied")}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onTestNotification}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t("notifications.testNotification")}
              </button>
              <button
                onClick={onNotificationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications
                    ? "bg-brand-600"
                    : "bg-gray-200 dark:bg-gray-700"
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t("notifications.bookmarkNotifications")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("notifications.bookmarkNotificationsDescription")}
              </p>
            </div>
            <button
              onClick={onBookmarkNotificationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                bookmarkNotifications
                  ? "bg-brand-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bookmarkNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {t("notifications.center")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("notifications.centerDescription")}
              </p>
            </div>
            <button
              onClick={onNavigateToNotifications}
              className="px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>{t("notifications.viewCenter")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
