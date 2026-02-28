import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Sun, Cloud, CloudRain, Snowflake, Thermometer, ChevronDown, Droplets, CloudDrizzle, Sunrise, RefreshCw } from "lucide-react";
import { WeatherData } from "@/services/weatherTypes";
import { weatherMoodService, WeatherMood } from "@/services/weatherMoodService";
import { formatTemperature } from "@/utils/weather/temperature";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface WeatherMoodBannerProps {
  weatherData: WeatherData;
  temperatureUnit?: 'F' | 'C';
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isFallback?: boolean;
  className?: string;
}

export function WeatherMoodBanner({
  weatherData,
  temperatureUnit = 'F',
  lastUpdated = null,
  onRefresh,
  isRefreshing = false,
  isFallback = false,
  className
}: WeatherMoodBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mood = useMemo(() => weatherMoodService.getWeatherMood(weatherData, temperatureUnit), [weatherData, temperatureUnit]);
  const specialEvent = useMemo(() => weatherMoodService.getSpecialEventMessage(weatherData), [weatherData]);

  const AnimationIcon = getAnimationIcon(mood.animation);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 transition-all duration-700",
        className
      )}
      style={{
        background: mood.gradient,
      }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-10">
        <AnimatedBackground animation={mood.animation} />
      </div>

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Message and advice */}
          <div className="flex-1 space-y-2">
            {/* Main message */}
            <div className="flex items-center gap-2">
              <AnimationIcon className="h-6 w-6 text-white animate-bounce drop-shadow-lg" />
              <h3 className="text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {mood.message}
              </h3>
            </div>

            {/* Plant advice */}
            <p className="text-white text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-medium">
              {mood.plantAdvice}
            </p>

            {/* Special event alert */}
            {specialEvent && (
              <div className="mt-3 flex items-start gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/40">
                <Sparkles className="h-4 w-4 text-white flex-shrink-0 mt-0.5 drop-shadow-lg" />
                <p className="text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  {specialEvent}
                </p>
              </div>
            )}
          </div>

          {/* Right: Weather stats */}
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="secondary"
              className="bg-black/30 backdrop-blur-sm border-white/40 text-white font-semibold shadow-lg"
            >
              <Thermometer className="h-3 w-3 mr-1" />
              {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)}
            </Badge>
            <div className="text-right">
              <div className="text-white text-xs font-medium drop-shadow-md">
                💧 {weatherData.current_humidity_percent}% humidity
              </div>
            </div>
          </div>
        </div>

        {/* Mood indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-500",
                  level <= getMoodLevel(mood.mood)
                    ? "bg-white shadow-lg"
                    : "bg-black/40"
                )}
              />
            ))}
          </div>
          <span className="text-white text-xs font-semibold capitalize drop-shadow-md">
            {mood.mood} conditions
          </span>
        </div>

        {/* Expandable Details Section */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mt-4 pt-4 border-t border-white/20 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h4 className="text-white font-semibold mb-3 drop-shadow-md">
                Weather Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Temperature */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Thermometer className="h-5 w-5 text-white/90" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium drop-shadow-md">
                      Temperature
                    </p>
                    <p className="text-white text-sm font-semibold drop-shadow-md">
                      {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)}
                    </p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Droplets className="h-5 w-5 text-white/90" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium drop-shadow-md">
                      Humidity
                    </p>
                    <p className="text-white text-sm font-semibold drop-shadow-md">
                      {weatherData.current_humidity_percent}%
                    </p>
                  </div>
                </div>

                {/* Rain/Snow Probability */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {weatherData.is_snowing ? (
                      <Snowflake className="h-5 w-5 text-white/90" />
                    ) : (
                      <CloudDrizzle className="h-5 w-5 text-white/90" />
                    )}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium drop-shadow-md">
                      {weatherData.is_snowing ? "Snow Chance" : "Rain Chance"}
                    </p>
                    <p className="text-white text-sm font-semibold drop-shadow-md">
                      {weatherData.upcoming_rain_probability}%
                    </p>
                  </div>
                </div>

                {/* Season */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getSeasonIcon(weatherData.season)}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium drop-shadow-md">
                      Season
                    </p>
                    <p className="text-white text-sm font-semibold capitalize drop-shadow-md">
                      {weatherData.season}
                    </p>
                  </div>
                </div>

                {/* Daylight Hours */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Sunrise className="h-5 w-5 text-white/90" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium drop-shadow-md">
                      Daylight
                    </p>
                    <p className="text-white text-sm font-semibold drop-shadow-md">
                      {weatherData.daylight_hours.toFixed(1)} hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Refresh Button and Timestamp */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-white/70 text-xs drop-shadow-md">
                  {isFallback && (
                    <span className="inline-flex items-center gap-1 mr-2">
                      <Badge variant="outline" className="text-xs border-white/40 text-white/80">
                        Estimated
                      </Badge>
                    </span>
                  )}
                  {lastUpdated ? (
                    <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
                  ) : (
                    <span>Just now</span>
                  )}
                </div>
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="text-white hover:bg-black/30 border border-white/30 h-8 px-3"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-black/30 border border-white/30 backdrop-blur-sm transition-all duration-300"
          >
            <div className={cn("transition-transform duration-300", isExpanded && "rotate-180")}>
              <ChevronDown className="h-4 w-4 mr-1" />
            </div>
            {isExpanded ? "Hide Details" : "Weather Details"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Get animation icon component
 */
function getAnimationIcon(animation: WeatherMood['animation']) {
  switch (animation) {
    case 'sunny':
    case 'hot':
      return Sun;
    case 'rainy':
      return CloudRain;
    case 'cold':
      return Snowflake;
    case 'perfect':
      return Sparkles;
    case 'cloudy':
    default:
      return Cloud;
  }
}

/**
 * Get season icon component
 */
function getSeasonIcon(season: 'winter' | 'spring' | 'summer' | 'fall') {
  const iconClass = "h-5 w-5 text-white/90";
  switch (season) {
    case 'winter':
      return <Snowflake className={iconClass} />;
    case 'spring':
      return <Sparkles className={iconClass} />;
    case 'summer':
      return <Sun className={iconClass} />;
    case 'fall':
      return <Cloud className={iconClass} />;
    default:
      return <Sun className={iconClass} />;
  }
}

/**
 * Get mood level for indicator (1-5)
 */
function getMoodLevel(mood: WeatherMood['mood']): number {
  switch (mood) {
    case 'excellent':
      return 5;
    case 'great':
      return 4;
    case 'good':
      return 3;
    case 'fair':
      return 2;
    case 'challenging':
      return 1;
    default:
      return 3;
  }
}

/**
 * Animated background component
 */
function AnimatedBackground({ animation }: { animation: WeatherMood['animation'] }) {
  switch (animation) {
    case 'sunny':
    case 'hot':
      return <SunnyAnimation />;
    case 'rainy':
      return <RainyAnimation />;
    case 'cold':
      return <SnowAnimation />;
    case 'perfect':
      return <SparkleAnimation />;
    case 'cloudy':
    default:
      return <CloudyAnimation />;
  }
}

/**
 * Sunny/Hot animation: Rising circles
 */
function SunnyAnimation() {
  return (
    <div className="absolute inset-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${20 + i * 10}px`,
            height: `${20 + i * 10}px`,
            left: `${i * 15}%`,
            bottom: `-${i * 20}px`,
            animation: `float-up ${5 + i * 0.5}s infinite ease-in-out`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-400px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Rainy animation: Falling drops
 */
function RainyAnimation() {
  return (
    <div className="absolute inset-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: '3px',
            height: '12px',
            left: `${i * 7}%`,
            top: `-${Math.random() * 20}px`,
            animation: `rain-fall ${1 + Math.random() * 2}s infinite linear`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(500px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Snow animation: Floating snowflakes
 */
function SnowAnimation() {
  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            left: `${i * 8}%`,
            top: `-${Math.random() * 20}px`,
            animation: `snow-fall ${3 + Math.random() * 4}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes snow-fall {
          0% { transform: translateY(0) translateX(0); opacity: 0.8; }
          50% { transform: translateY(250px) translateX(${Math.random() * 100 - 50}px); }
          100% { transform: translateY(500px) translateX(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Sparkle animation: Twinkling stars
 */
function SparkleAnimation() {
  return (
    <div className="absolute inset-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${1 + Math.random() * 2}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Cloudy animation: Drifting clouds
 */
function CloudyAnimation() {
  return (
    <div className="absolute inset-0">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full blur-xl"
          style={{
            width: `${100 + i * 50}px`,
            height: `${40 + i * 20}px`,
            left: `-${50 + i * 20}px`,
            top: `${i * 20}%`,
            animation: `drift ${10 + i * 2}s infinite linear`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
      `}</style>
    </div>
  );
}
