import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import bibleVersesData from "../data/bibleVerses.json";

interface BibleVerse {
  verse: string;
  reference: string;
}

// 아름다운 그라데이션 배경 색상 배열
const gradientBackgrounds = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
  "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)",
];

export const BibleVerseWidget: React.FC = () => {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [backgroundGradient, setBackgroundGradient] = useState<string>("");

  // 새로고침마다 랜덤 구절 선택
  const getRandomVerse = (): BibleVerse => {
    const index = Math.floor(Math.random() * bibleVersesData.length);
    return bibleVersesData[index];
  };

  // 랜덤 배경 그라데이션 선택
  const getRandomGradient = (): string => {
    const index = Math.floor(Math.random() * gradientBackgrounds.length);
    return gradientBackgrounds[index];
  };

  useEffect(() => {
    const fetchVerse = async () => {
      setLoading(true);
      setVerse(getRandomVerse());
      setBackgroundGradient(getRandomGradient()); // 마운트 시마다 배경 변경
      setLoading(false);
    };

    fetchVerse();
  }, []);

  if (loading) {
    return (
      <div 
        className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center"
        style={{ background: backgroundGradient || gradientBackgrounds[0] }}
      >
        <div className="animate-pulse flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-white opacity-80" />
          <div className="h-4 bg-white/20 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div 
      className="rounded-lg shadow-sm border border-gray-200/20 p-6 relative overflow-hidden"
      style={{ background: backgroundGradient }}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="relative z-10 flex items-start space-x-3">
        <BookOpen className="w-5 h-5 text-white mt-1 flex-shrink-0 drop-shadow-sm" />
        <div className="flex-1">
          <p className="text-base text-white leading-relaxed font-medium drop-shadow-sm">
            "{verse.verse}"
          </p>
          <p className="text-sm text-white/90 mt-3 text-right italic drop-shadow-sm">
            {verse.reference}
          </p>
        </div>
      </div>
    </div>
  );
};
