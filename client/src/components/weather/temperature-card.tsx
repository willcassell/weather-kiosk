import { Thermometer, TrendingUp, TrendingDown } from "lucide-react";
import { formatTemperature, formatTemperatureWhole } from "@/utils/format-values";
import type { UnitPreferences } from "@shared/units";

interface TemperatureCardProps {
  currentTemp?: number;
  feelsLike?: number;
  highTemp?: number;
  lowTemp?: number;
  highTempTime?: Date;
  lowTempTime?: Date;
  preferences: UnitPreferences;
}

export default function TemperatureCard({ 
  currentTemp, 
  feelsLike,
  highTemp, 
  lowTemp,
  highTempTime,
  lowTempTime,
  preferences
}: TemperatureCardProps) {
  const formatTemp = (temp?: number) => {
    return temp !== undefined ? formatTemperature(temp, preferences, 1) : "--";
  };

  const formatTime = (time?: Date) => {
    if (!time) return "";
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Temperature</h3>
        <Thermometer className="weather-card-icon" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-3 w-full">
          {/* Left - Feels Like */}
          <div className="text-left">
            <div className="text-responsive-lg font-bold text-cyan-400">
              {formatTemp(feelsLike)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Feels Like</div>
          </div>
          
          {/* Center - Current Temperature (Larger) */}
          <div className="text-center">
            <div className="text-responsive-3xl font-bold text-foreground">
              {formatTemp(currentTemp)}
            </div>
          </div>
          
          {/* Right - Daily High/Low */}
          <div className="text-right">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1 text-red-400 justify-end">
                <TrendingUp className="h-3 w-3" />
                <div className="flex flex-col items-end">
                  <span className="text-responsive-md">{formatTemp(highTemp)}</span>
                  {highTempTime && (
                    <span className="text-responsive-sm text-muted-foreground">{formatTime(highTempTime)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-blue-400 justify-end">
                <TrendingDown className="h-3 w-3" />
                <div className="flex flex-col items-end">
                  <span className="text-responsive-md">{formatTemp(lowTemp)}</span>
                  {lowTempTime && (
                    <span className="text-responsive-sm text-muted-foreground">{formatTime(lowTempTime)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}