import { Thermometer, TrendingUp, TrendingDown } from "lucide-react";
import { TemperatureDisplay } from "@/components/ui/temperature-display";
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
            <div className="text-responsive-lg font-semibold text-cyan-400/80">
              {feelsLike !== undefined ? (
                <TemperatureDisplay temperature={feelsLike} preferences={preferences} decimals={1} />
              ) : "--"}
            </div>
            <div className="text-responsive-sm text-muted-foreground/70">Feels Like</div>
          </div>

          {/* Center - Current Temperature (Larger and more prominent) */}
          <div className="text-center">
            <div className="text-responsive-3xl font-extrabold text-foreground drop-shadow-lg">
              {currentTemp !== undefined ? (
                <TemperatureDisplay temperature={currentTemp} preferences={preferences} decimals={1} />
              ) : "--"}
            </div>
          </div>

          {/* Right - Daily High/Low */}
          <div className="text-right">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1 text-red-400 justify-end">
                <TrendingUp className="h-3 w-3" />
                <div className="flex flex-col items-end">
                  <span className="text-responsive-md">
                    {highTemp !== undefined ? (
                      <TemperatureDisplay temperature={highTemp} preferences={preferences} decimals={1} />
                    ) : "--"}
                  </span>
                  {highTempTime && (
                    <span className="text-responsive-sm text-muted-foreground">{formatTime(highTempTime)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-blue-400 justify-end">
                <TrendingDown className="h-3 w-3" />
                <div className="flex flex-col items-end">
                  <span className="text-responsive-md">
                    {lowTemp !== undefined ? (
                      <TemperatureDisplay temperature={lowTemp} preferences={preferences} decimals={1} />
                    ) : "--"}
                  </span>
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