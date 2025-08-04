import { CloudRain, Droplets } from "lucide-react";

interface RainfallCardProps {
  todayRain?: number;
  yesterdayRain?: number;
}

export default function RainfallCard({ todayRain, yesterdayRain }: RainfallCardProps) {
  const formatRain = (amount?: number) => {
    return amount !== undefined ? amount.toFixed(2) : "--";
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Rain</h3>
        <CloudRain className="weather-card-icon h-4 w-4" />
      </div>
      <div className="flex items-center justify-between space-x-3">
        {/* Today's rainfall */}
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">
            {formatRain(todayRain)}"
          </div>
          <div className="text-xs text-muted-foreground">Today</div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-border"></div>
        
        {/* Yesterday's rainfall */}
        <div className="text-center">
          <div className="text-lg font-bold text-blue-300">
            {formatRain(yesterdayRain)}"
          </div>
          <div className="text-xs text-muted-foreground">Yesterday</div>
        </div>
      </div>
    </div>
  );
}