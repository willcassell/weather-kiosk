import { Thermometer, TrendingUp, TrendingDown } from "lucide-react";

interface TemperatureCardProps {
  currentTemp?: number;
  feelsLike?: number;
  highTemp?: number;
  lowTemp?: number;
}

export default function TemperatureCard({ 
  currentTemp, 
  feelsLike,
  highTemp, 
  lowTemp 
}: TemperatureCardProps) {
  const formatTemp = (temp?: number) => {
    return temp !== undefined ? temp.toFixed(1) : "--";
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Temperature</h3>
        <Thermometer className="weather-card-icon h-4 w-4" />
      </div>
      <div className="flex items-center justify-between space-x-3">
        {/* Left - Feels Like */}
        <div className="text-left">
          <div className="text-lg font-bold text-cyan-400">
            {formatTemp(feelsLike)}°F
          </div>
          <div className="text-xs text-muted-foreground">Feels Like</div>
        </div>
        
        {/* Center - Current Temperature (Larger) */}
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">
            {formatTemp(currentTemp)}°F
          </div>
        </div>
        
        {/* Right - Daily High/Low */}
        <div className="text-right">
          <div className="flex flex-col text-sm space-y-0.5">
            <div className="flex items-center space-x-1 text-red-400 justify-end">
              <TrendingUp className="h-3 w-3" />
              <span>{formatTemp(highTemp)}°F</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-400 justify-end">
              <TrendingDown className="h-3 w-3" />
              <span>{formatTemp(lowTemp)}°F</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}