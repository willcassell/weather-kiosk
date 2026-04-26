import { Wind, Navigation } from "lucide-react";
import { convertSpeed, getUnitSymbol } from "@shared/units";
import type { UnitPreferences } from "@shared/units";

interface WindCardProps {
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  windDirectionCardinal?: string;
  preferences: UnitPreferences;
}

export default function WindCard({
  windSpeed,
  windGust,
  windDirection,
  windDirectionCardinal,
  preferences
}: WindCardProps) {
  const formatWindSpeed = (speed?: number) => {
    if (speed === undefined) return { value: "--", unit: "" };
    const converted = convertSpeed(speed, 'mph', preferences.speed);
    const symbol = getUnitSymbol(preferences.speed);
    return { value: converted.toFixed(1), unit: symbol };
  };

  const formatDirection = (direction?: number) => {
    return direction !== undefined ? `${Math.round(direction)}°` : "--°";
  };

  // Helper functions for playful animations
  const getWindDescription = (speed: number) => {
    if (speed === 0) return "Calm";
    if (speed < 4) return "Light Air";
    if (speed < 8) return "Light Breeze";
    if (speed < 13) return "Gentle Breeze";
    if (speed < 19) return "Moderate Breeze";
    if (speed < 25) return "Fresh Breeze";
    return "Strong Wind";
  };

  // Determine which cardinal direction should glow
  const dir = windDirection || 0;
  const isNortherly = (dir >= 315 || dir < 45);
  const isEasterly = (dir >= 45 && dir < 135);
  const isSoutherly = (dir >= 135 && dir < 225);
  const isWesterly = (dir >= 225 && dir < 315);

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Wind</h3>
        <Wind className="weather-card-icon" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between w-full">
          {/* Left: Speed + Gust */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-responsive-lg font-bold text-cyan-400">
                {formatWindSpeed(windSpeed).value}
                <sup className="text-[0.5em] ml-0.5">{formatWindSpeed(windSpeed).unit}</sup>
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-responsive-xs">Gust:</span>
              <span className="text-responsive-sm font-semibold text-blue-300">
                {formatWindSpeed(windGust).value}
                <sup className="text-[0.5em] ml-0.5">{formatWindSpeed(windGust).unit}</sup>
              </span>
            </div>
          </div>
          {/* Right: Direction label ABOVE compass, both centered */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[18px] font-semibold text-cyan-400">
              {windDirectionCardinal || "CALM"}
            </div>
            <div className="relative w-12 h-12 rounded-full border-2 border-primary/30 bg-primary/10">
              <div className="absolute inset-1 flex items-center justify-center">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-muted-foreground">N</div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-[8px] font-bold text-muted-foreground">E</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-muted-foreground">S</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-[8px] font-bold text-muted-foreground">W</div>
              </div>
              <Navigation
                className="absolute inset-0 m-auto h-6 w-6 text-cyan-400 drop-shadow-lg"
                style={{
                  transform: `rotate(${(windDirection ?? 0) - 45}deg)`,
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}