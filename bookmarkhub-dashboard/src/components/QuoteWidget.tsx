import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import bibleVersesData from "../data/bibleVerses.json";

interface BibleVerse {
  verse: string;
  reference: string;
}

export const BibleVerseWidget: React.FC = () => {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);

  // 새로고침마다 랜덤 구절 선택
  const getRandomVerse = (): BibleVerse => {
    const index = Math.floor(Math.random() * bibleVersesData.length);
    return bibleVersesData[index];
  };

  const fetchVerse = async () => {
    setLoading(true);
    setVerse(getRandomVerse());
    setLoading(false);
  };

  useEffect(() => {
    fetchVerse();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-gray-400" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start space-x-3">
        <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            "{verse.verse}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-right italic">
            {verse.reference}
          </p>
        </div>
      </div>
    </div>
  );
};
