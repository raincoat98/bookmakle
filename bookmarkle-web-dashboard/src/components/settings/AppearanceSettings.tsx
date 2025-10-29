import React from "react";
import { useTranslation } from "../../../node_modules/react-i18next";
import { Sun, Moon, Globe } from "lucide-react";

interface AppearanceSettingsProps {
  theme: string;
  onThemeChange: (theme: "light" | "dark" | "auto") => void;
  i18n: any;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  theme,
  onThemeChange,
  i18n,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("settings.theme")}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onThemeChange("light")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "light"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("settings.themeLight")}
              </p>
            </button>
            <button
              onClick={() => onThemeChange("dark")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "dark"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Moon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("settings.themeDark")}
              </p>
            </button>
            <button
              onClick={() => onThemeChange("auto")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === "auto"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Globe className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("settings.themeSystem")}
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("settings.language")}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => i18n.changeLanguage("ko")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                i18n.language === "ko"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-2xl mb-2 block">🇰🇷</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("languages.korean")}
              </p>
            </button>
            <button
              onClick={() => i18n.changeLanguage("en")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                i18n.language === "en"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-2xl mb-2 block">🇺🇸</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("languages.english")}
              </p>
            </button>
            <button
              onClick={() => i18n.changeLanguage("ja")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                i18n.language === "ja"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-2xl mb-2 block">🇯🇵</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("languages.japanese")}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
