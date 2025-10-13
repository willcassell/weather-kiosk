import { Wind, Navigation } from "lucide-react";
import { formatSpeed } from "@/utils/format-values";
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
    return speed !== undefined ? formatSpeed(speed, preferences, 1) : "--";
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
        <div className="flex items-center justify-between space-x-4 w-full">
          {/* Left - Wind Speed and Gust compact for one-line display */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-responsive-lg font-bold text-cyan-400">{formatWindSpeed(windSpeed)}</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-responsive-xs">Gust:</span>
              <span className="text-responsive-sm font-semibold text-blue-300">{formatWindSpeed(windGust)}</span>
            </div>
          </div>
          
          {/* Center - Responsive Compass Display */}
          <div className="flex-shrink-0">
            <div className="relative w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 2xl:w-28 2xl:h-28 rounded-full border-2 border-primary/30 bg-primary/10">
              {/* Cardinal direction markers - positioned safely inside */}
              <div className="absolute inset-2 flex items-center justify-center">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs lg:text-sm font-bold text-muted-foreground">N</div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xs lg:text-sm font-bold text-muted-foreground">E</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs lg:text-sm font-bold text-muted-foreground">S</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-xs lg:text-sm font-bold text-muted-foreground">W</div>
              </div>
              {/* Wind direction arrow - larger and more prominent */}
              <Navigation
                className="absolute inset-0 m-auto h-10 w-10 lg:h-12 lg:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20 text-cyan-400 drop-shadow-lg"
                style={{
                  transform: `rotate(${(windDirection ?? 0) - 45}deg)`,
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))'
                }}
              />
            </div>
          </div>
          
          {/* Right - Direction and Details */}
          <div className="text-right">
            <div className="text-responsive-xl font-bold text-foreground">
              {windDirectionCardinal || "CALM"}
            </div>
            <div className="text-responsive-md text-muted-foreground">
              {formatDirection(windDirection)}
            </div>
            <div className="text-responsive-sm text-muted-foreground mt-1">
              {getWindDescription(windSpeed || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}