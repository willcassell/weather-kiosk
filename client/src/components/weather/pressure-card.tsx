import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPressure } from "@/utils/format-values";
import type { UnitPreferences } from "@shared/units";

interface PressureCardProps {
  pressure?: number;
  trend?: string;
  preferences: UnitPreferences;
}

export default function PressureCard({ pressure, trend, preferences }: PressureCardProps) {
  const formatPressureValue = (value?: number) => {
    return value !== undefined ? formatPressure(value, preferences, 2) : "--";
  };

  const getTrendIcon = (trendValue?: string) => {
    switch (trendValue?.toLowerCase()) {
      case 'rising':
        return <TrendingUp className="h-3 w-3" />;
      case 'falling':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trendValue?: string) => {
    switch (trendValue?.toLowerCase()) {
      case 'rising':
        return 'text-green-400';
      case 'falling':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Calculate pressure gauge position (typical range 29.5-30.5 inHg)
  const minPressure = 29.5;
  const maxPressure = 30.5;
  const pressurePosition = pressure 
    ? Math.max(0, Math.min(100, ((pressure - minPressure) / (maxPressure - minPressure)) * 100))
    : 50;

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Barometric Pressure</h3>
        <Gauge className="weather-card-icon" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center space-x-4 w-full">
          {/* Large Pressure Gauge - Takes up most of the card */}
          <div className="flex-1 relative">
            <div className="relative w-4/5 h-6 lg:h-8 xl:h-10 2xl:h-12 mb-2">
              {/* Background track */}
              <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
              
              {/* Colored pressure zones */}
              <div className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-yellow-400" style={{ width: '33%' }}></div>
                <div className="absolute top-0 h-full bg-gradient-to-r from-yellow-400 to-green-400" style={{ left: '33%', width: '34%' }}></div>
                <div className="absolute top-0 right-0 h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: '33%' }}></div>
              </div>
              
              {/* Pressure indicator needle - more prominent */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border-2 border-gray-900 w-2 h-6 lg:w-2.5 lg:h-8 xl:w-3 xl:h-10 2xl:w-4 2xl:h-12"
                style={{
                  left: `${pressurePosition}%`,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
              />
            </div>
            
            {/* Zone labels with reduced spacing and smaller text */}
            <div className="relative w-4/5 mt-1">
              <div className="absolute left-0 text-xs lg:text-sm text-red-400 font-medium">LOW</div>
              <div className="absolute left-1/2 transform -translate-x-1/2 text-xs lg:text-sm text-yellow-400 font-medium">NORMAL</div>
              <div className="absolute right-0 text-xs lg:text-sm text-green-400 font-medium">HIGH</div>
            </div>
          </div>
          
          {/* Right side - Current pressure and trend */}
          <div className="text-right flex-shrink-0">
            <div className="text-responsive-xl font-bold text-foreground">
              {formatPressureValue(pressure)}
            </div>

            <div className={`flex items-center justify-end space-x-1 mt-1 ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)}
              <span className="capitalize text-responsive-sm">{trend || 'Steady'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}