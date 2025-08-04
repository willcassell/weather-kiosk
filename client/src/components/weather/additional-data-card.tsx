import { BarChart3 } from "lucide-react";

interface AdditionalDataCardProps {
  humidity?: number;
  uvIndex?: number;
  visibility?: number;
  dewPoint?: number;
}

export default function AdditionalDataCard({ 
  humidity, 
  uvIndex, 
  visibility,
  dewPoint
}: AdditionalDataCardProps) {
  const formatValue = (value?: number, decimals: number = 0) => {
    return value !== undefined ? value.toFixed(decimals) : "--";
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Additional Data</h3>
        <BarChart3 className="weather-card-icon h-4 w-4" />
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-blue-400">
            {formatValue(humidity)}%
          </div>
          <div className="text-xs text-muted-foreground">Humidity</div>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-orange-400">
            {formatValue(uvIndex)}
          </div>
          <div className="text-xs text-muted-foreground">UV Index</div>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-green-400">
            {formatValue(visibility)}mi
          </div>
          <div className="text-xs text-muted-foreground">Visibility</div>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-cyan-400">
            {formatValue(dewPoint, 1)}°F
          </div>
          <div className="text-xs text-muted-foreground">Dew Point</div>
        </div>
      </div>
    </div>
  );
}