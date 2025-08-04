import { Wind, Navigation } from "lucide-react";

interface WindCardProps {
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  windDirectionCardinal?: string;
}

export default function WindCard({ 
  windSpeed, 
  windGust,
  windDirection, 
  windDirectionCardinal 
}: WindCardProps) {
  const formatWindSpeed = (speed?: number) => {
    return speed !== undefined ? speed.toFixed(1) : "--";
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
        <Wind className="weather-card-icon h-4 w-4" />
      </div>
      <div className="flex items-center space-x-4">
        {/* Left Side - Enhanced Animated Compass Rose */}
        <div className="relative w-16 h-16 flex-shrink-0">
          {/* Compass Background with Gradient */}
          <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-700/50 shadow-inner">
            
            {/* Animated Cardinal Direction Labels */}
            <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 text-sm font-bold transition-all duration-500 ${
              isNortherly ? 'text-red-400 scale-125 animate-glow' : 'text-muted-foreground'
            }`}>
              N
            </div>
            <div className={`absolute top-1/2 -right-2 transform -translate-y-1/2 text-sm font-bold transition-all duration-500 ${
              isEasterly ? 'text-yellow-400 scale-125 animate-glow' : 'text-muted-foreground'
            }`}>
              E
            </div>
            <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-bold transition-all duration-500 ${
              isSoutherly ? 'text-blue-400 scale-125 animate-glow' : 'text-muted-foreground'
            }`}>
              S
            </div>
            <div className={`absolute top-1/2 -left-2 transform -translate-y-1/2 text-sm font-bold transition-all duration-500 ${
              isWesterly ? 'text-green-400 scale-125 animate-glow' : 'text-muted-foreground'
            }`}>
              W
            </div>
            
            {/* Compass Center Dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-lg"></div>
            
            {/* Animated Wind Direction Arrow */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ 
                transform: `translate(-50%, -50%) rotate(${(windDirection || 0)}deg)` 
              }}
            >
              <Navigation className={`h-8 w-8 drop-shadow-lg transition-all duration-300 ${
                (windSpeed || 0) > 0 
                  ? 'text-cyan-400 animate-bounce-gentle' 
                  : 'text-gray-500'
              }`} 
              style={{
                filter: (windSpeed || 0) > 0 ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))' : 'none',
                animationDuration: `${Math.max(2 - (windSpeed || 0) / 10, 0.5)}s`
              }} />
            </div>
            
            {/* Dynamic Wind Speed Ring Animation */}
            {(windSpeed || 0) > 0 && (
              <>
                <div 
                  className="absolute inset-1 rounded-full border border-cyan-400/30 animate-ping"
                  style={{ animationDuration: `${Math.max(3 - (windSpeed || 0) / 8, 1)}s` }}
                />
                {(windSpeed || 0) > 10 && (
                  <div 
                    className="absolute inset-2 rounded-full border border-cyan-300/20 animate-ping"
                    style={{ animationDuration: `${Math.max(2 - (windSpeed || 0) / 15, 0.8)}s`, animationDelay: '0.3s' }}
                  />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Center - Enhanced Wind Speed Display */}
        <div className="flex-1">
          <div className={`text-lg font-bold transition-colors duration-300 ${
            (windSpeed || 0) > 15 ? 'text-orange-400' : 'text-foreground'
          }`}>
            {formatWindSpeed(windSpeed)} mph
          </div>
          <div className={`text-sm font-medium transition-colors duration-300 ${
            (windSpeed || 0) > 0 ? 'text-cyan-400' : 'text-muted-foreground'
          }`}>
            {windDirectionCardinal || "CALM"}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDirection(windDirection)} • {getWindDescription(windSpeed || 0)}
          </div>
        </div>
        
        {/* Right Side - Enhanced Wind Gust Data */}
        <div className="text-right">
          <div className={`text-lg font-bold transition-all duration-300 ${
            (windGust || 0) > (windSpeed || 0) + 8 
              ? 'text-red-400 animate-pulse scale-105' 
              : 'text-orange-400'
          }`}>
            {formatWindSpeed(windGust)}
          </div>
          <div className="text-xs text-muted-foreground">Gusts (mph)</div>
          <div className={`text-xs mt-0.5 transition-colors duration-300 ${
            (windGust || 0) > (windSpeed || 0) + 5 ? 'text-orange-300' : 'text-muted-foreground'
          }`}>
            +{windGust && windSpeed ? (windGust - windSpeed).toFixed(1) : '0.0'}
          </div>
        </div>
      </div>
    </div>
  );
}