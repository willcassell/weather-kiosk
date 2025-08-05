import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PressureCardProps {
  pressure?: number;
  trend?: string;
}

export default function PressureCard({ pressure, trend }: PressureCardProps) {
  const formatPressure = (value?: number) => {
    return value !== undefined ? value.toFixed(2) : "--";
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
            <div className="relative w-full" style={{ height: 'clamp(24px, 4vh, 40px)' }}>
              {/* Background track */}
              <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
              
              {/* Colored pressure zones */}
              <div className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-yellow-400" style={{ width: '33%' }}></div>
                <div className="absolute top-0 h-full bg-gradient-to-r from-yellow-400 to-green-400" style={{ left: '33%', width: '34%' }}></div>
                <div className="absolute top-0 right-0 h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: '33%' }}></div>
              </div>
              
              {/* Pressure indicator needle */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-800"
                style={{ 
                  left: `${pressurePosition}%`,
                  width: 'clamp(3px, 0.5vh, 6px)',
                  height: 'clamp(20px, 3vh, 32px)'
                }}
              />
              
              {/* Zone labels */}
              <div className="absolute left-0 text-responsive-sm text-red-400 font-medium" 
                   style={{ bottom: 'clamp(-16px, -2vh, -12px)' }}>LOW</div>
              <div className="absolute left-1/2 transform -translate-x-1/2 text-responsive-sm text-yellow-400 font-medium" 
                   style={{ bottom: 'clamp(-16px, -2vh, -12px)' }}>NORMAL</div>
              <div className="absolute right-0 text-responsive-sm text-green-400 font-medium" 
                   style={{ bottom: 'clamp(-16px, -2vh, -12px)' }}>HIGH</div>
            </div>
          </div>
          
          {/* Right side - Current pressure and trend */}
          <div className="text-right flex-shrink-0">
            <div className="text-responsive-xl font-bold text-foreground">
              {formatPressure(pressure)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">inHg</div>
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