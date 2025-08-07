import { CloudRain, Droplets } from "lucide-react";
import { formatPrecipitation } from "@/utils/format-values";
import type { UnitPreferences } from "@shared/units";

interface RainfallCardProps {
  todayRain?: number;
  yesterdayRain?: number;
  preferences: UnitPreferences;
}

export default function RainfallCard({ todayRain, yesterdayRain, preferences }: RainfallCardProps) {
  const formatRain = (amount?: number) => {
    return amount !== undefined ? formatPrecipitation(amount, preferences, 2) : "--";
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
              {formatRain(todayRain)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Today</div>
          </div>
          
          <div className="w-px h-8 lg:h-10 xl:h-12 2xl:h-16 bg-border"></div>
          
          {/* Yesterday's rainfall */}
          <div className="text-center flex-1">
            <div className="text-responsive-xl font-bold text-blue-300">
              {formatRain(yesterdayRain)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Yesterday</div>
          </div>
        </div>
      </div>
    </div>
  );
}