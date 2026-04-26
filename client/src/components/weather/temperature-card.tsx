import { Thermometer } from "lucide-react";
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
        <div className="flex items-center justify-between w-full">
          {/* Left - Feels Like */}
          <div className="text-left w-[70px]">
            <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">Feels Like</div>
            <div className="text-[18px] font-light text-cyan-400/80">
              {feelsLike !== undefined ? (
                <TemperatureDisplay temperature={feelsLike} preferences={preferences} decimals={1} />
              ) : "--"}
            </div>
          </div>

          {/* Center - Current Temperature */}
          <div className="flex-1 text-center">
            <div className="text-responsive-3xl font-extrabold text-foreground drop-shadow-lg">
              {currentTemp !== undefined ? (
                <TemperatureDisplay temperature={currentTemp} preferences={preferences} decimals={1} />
              ) : "--"}
            </div>
          </div>

          {/* Right - Daily High/Low */}
          <div className="text-right">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1 justify-end">
                <span className="text-[16px] text-red-400">&#9650;</span>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-red-400">
                    {highTemp !== undefined ? (
                      <TemperatureDisplay temperature={highTemp} preferences={preferences} decimals={1} />
                    ) : "--"}
                  </span>
                  {highTempTime && (
                    <span className="text-[11px] text-muted-foreground">{formatTime(highTempTime)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 justify-end">
                <span className="text-[16px] text-blue-400">&#9660;</span>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-blue-400">
                    {lowTemp !== undefined ? (
                      <TemperatureDisplay temperature={lowTemp} preferences={preferences} decimals={1} />
                    ) : "--"}
                  </span>
                  {lowTempTime && (
                    <span className="text-[11px] text-muted-foreground">{formatTime(lowTempTime)}</span>
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