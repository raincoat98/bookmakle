import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, MapPin } from "lucide-react";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  city: string;
}

// 날씨 아이콘 매핑
const getWeatherIcon = (iconCode: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    "01d": <Sun className="w-6 h-6 text-yellow-500" />,
    "01n": <Sun className="w-6 h-6 text-yellow-500" />,
    "02d": <Cloud className="w-6 h-6 text-gray-500" />,
    "02n": <Cloud className="w-6 h-6 text-gray-500" />,
    "03d": <Cloud className="w-6 h-6 text-gray-500" />,
    "03n": <Cloud className="w-6 h-6 text-gray-500" />,
    "04d": <Cloud className="w-6 h-6 text-gray-500" />,
    "04n": <Cloud className="w-6 h-6 text-gray-500" />,
    "09d": <CloudRain className="w-6 h-6 text-blue-500" />,
    "09n": <CloudRain className="w-6 h-6 text-blue-500" />,
    "10d": <CloudRain className="w-6 h-6 text-blue-500" />,
    "10n": <CloudRain className="w-6 h-6 text-blue-500" />,
    "11d": <CloudRain className="w-6 h-6 text-blue-500" />,
    "11n": <CloudRain className="w-6 h-6 text-blue-500" />,
    "13d": <CloudSnow className="w-6 h-6 text-blue-300" />,
    "13n": <CloudSnow className="w-6 h-6 text-blue-300" />,
    "50d": <Wind className="w-6 h-6 text-gray-400" />,
    "50n": <Wind className="w-6 h-6 text-gray-400" />,
  };

  return iconMap[iconCode] || <Cloud className="w-6 h-6 text-gray-500" />;
};

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 위치 가져오기
  const getLocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.log("위치 정보 가져오기 실패:", error);
          // 서울 좌표로 기본값 설정
          resolve({ lat: 37.5665, lon: 126.978 });
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  };

  // 날씨 데이터 가져오기
  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getLocation();

      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!API_KEY) {
        throw new Error("API 키가 설정되지 않았습니다");
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=kr`
      );

      if (!response.ok) {
        throw new Error("날씨 API 호출 실패");
      }

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        city: data.name,
      });
    } catch (error) {
      console.log("날씨 정보 가져오기 실패:", error);
      setError("날씨 정보를 가져올 수 없습니다");

      // 기본 날씨 데이터 (API 실패 시)
      setWeather({
        temperature: 22,
        description: "맑음",
        icon: "01d",
        city: "서울",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();

    // 30분마다 날씨 정보 업데이트
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-3">
          <Cloud className="w-6 h-6 text-gray-400" />
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Cloud className="w-6 h-6 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            날씨 정보 없음
          </span>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getWeatherIcon(weather.icon)}
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {weather.description}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>{weather.city}</span>
        </div>
      </div>
    </div>
  );
};
