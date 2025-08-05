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
        <BarChart3 className="weather-card-icon" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-2 w-full">
          <div className="text-center flex-1">
            <div className="text-responsive-md font-bold text-blue-400">
              {formatValue(humidity)}%
            </div>
            <div className="text-responsive-sm text-muted-foreground">Humidity</div>
          </div>
          <div className="w-px h-8 lg:h-10 xl:h-12 2xl:h-16 bg-border"></div>
          <div className="text-center flex-1">
            <div className="text-responsive-md font-bold text-orange-400">
              {formatValue(uvIndex)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">UV Index</div>
          </div>
          <div className="w-px h-8 lg:h-10 xl:h-12 2xl:h-16 bg-border"></div>
          <div className="text-center flex-1">
            <div className="text-responsive-md font-bold text-green-400">
              {formatValue(visibility)}mi
            </div>
            <div className="text-responsive-sm text-muted-foreground">Visibility</div>
          </div>
          <div className="w-px h-8 lg:h-10 xl:h-12 2xl:h-16 bg-border"></div>
          <div className="text-center flex-1">
            <div className="text-responsive-md font-bold text-cyan-400">
              {formatValue(dewPoint, 1)}°F
            </div>
            <div className="text-responsive-sm text-muted-foreground">Dew Point</div>
          </div>
        </div>
      </div>
    </div>
  );
}