import { CloudRain, Droplets } from "lucide-react";
import { convertPrecipitation, getUnitSymbol } from "@shared/units";
import type { UnitPreferences } from "@shared/units";

interface RainfallCardProps {
  todayRain?: number;
  yesterdayRain?: number;
  preferences: UnitPreferences;
}

export default function RainfallCard({ todayRain, yesterdayRain, preferences }: RainfallCardProps) {
  const formatRainParts = (amount?: number) => {
    if (amount === undefined) return { value: "--", unit: "" };
    
    const converted = convertPrecipitation(amount, 'inches', preferences.precipitation);
    const symbol = getUnitSymbol(preferences.precipitation);
    return {
      value: converted.toFixed(2),
      unit: symbol
    };
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Rain</h3>
        <CloudRain className="weather-card-icon" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-2 w-full">
          {/* Today's rainfall */}
          <div className="text-center flex-1">
            <div className="text-responsive-xl font-bold text-cyan-400">
              {formatRainParts(todayRain).value}
              <sup className="text-[0.5em] ml-0.5">
                {formatRainParts(todayRain).unit}
              </sup>
            </div>
            <div className="text-responsive-sm text-muted-foreground">Today</div>
          </div>

          <div className="w-px h-8 lg:h-10 xl:h-12 2xl:h-16 bg-border"></div>

          {/* Yesterday's rainfall */}
          <div className="text-center flex-1">
            <div className="text-responsive-xl font-bold text-blue-300">
              {formatRainParts(yesterdayRain).value}
              <sup className="text-[0.5em] ml-0.5">
                {formatRainParts(yesterdayRain).unit}
              </sup>
            </div>
            <div className="text-responsive-sm text-muted-foreground">Yesterday</div>
          </div>
        </div>
      </div>
    </div>
  );
}